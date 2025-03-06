import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import Cors from 'cors';
import { CorsRequest } from 'cors';
import rateLimit from 'express-rate-limit';
import type { Request } from 'express';

interface TranslationRequest {
  text: string | string[];
  target_lang: string;
  source_lang?: string;
}

interface TranslationResponse {
  translations: Array<{
    text: string;
    detected_source_language: string;
  }>;
}

interface ErrorResponse {
  error: string;
  details?: {
    message: string;
  };
}

const cors = Cors({
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
});

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100 // 每个IP限制100次请求
}) as any;

const runMiddleware = (req: NextApiRequest, res: NextApiResponse, fn: (req: CorsRequest, res: NextApiResponse, cb: (result: unknown) => void) => void): Promise<void> => {
  return new Promise((resolve, reject) => {
    fn(req as CorsRequest, res, (result: unknown) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve();
    });
  });
};

const DEEPL_API_URL = 'https://api-free.deepl.com/v2/translate';

const validateRequest = (req: NextApiRequest): { isValid: boolean; error?: string } => {
  const { text, target_lang } = req.body as TranslationRequest;
  
  if (!text) {
    return { isValid: false, error: '文本内容不能为空' };
  }
  
  if (!target_lang || typeof target_lang !== 'string' || target_lang.length !== 2) {
    return { isValid: false, error: '无效的目标语言代码' };
  }
  
  if (Array.isArray(text) && text.some(t => typeof t !== 'string' || !t.trim())) {
    return { isValid: false, error: '文本数组中包含无效内容' };
  }
  
  return { isValid: true };
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<TranslationResponse | ErrorResponse>) {
  try {
    await runMiddleware(req, res, cors);
    await new Promise((resolve, reject) => {
      limiter(req, res, (result: Error | undefined) => {
        if (result instanceof Error) reject(result);
        resolve(result);
      });
    });
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { text, target_lang, source_lang } = req.body as TranslationRequest;
    const apiKey = req.headers.authorization;

    if (!apiKey || !apiKey.startsWith('DeepL-Auth-Key ')) {
      return res.status(401).json({ error: 'Missing or invalid API key format' });
    }

    const fullApiKey = apiKey.replace('DeepL-Auth-Key ', '');

    const validation = validateRequest(req);
    if (!validation.isValid) {
      return res.status(400).json({ error: validation.error || '无效的请求参数' });
    }

    const response = await axios.post(
      DEEPL_API_URL,
      {
        text: Array.isArray(text) ? text : [text],
        target_lang: target_lang.toUpperCase(),
        source_lang: source_lang ? source_lang.toUpperCase() : undefined
      },
      {
        headers: {
          'Authorization': `DeepL-Auth-Key ${fullApiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return res.status(200).json({
      translations: response.data.translations.map((t: { text: any; detected_source_language: any; }) => ({
        text: t.text,
        detected_source_language: t.detected_source_language
      }))
    });
  } catch (error: unknown) {
    const errorDetails = error instanceof Error && 'isAxiosError' in error 
      ? `Status: ${(error as any).response?.status}, Data: ${JSON.stringify((error as any).response?.data)}, Message: ${(error as Error).message}`
      : error instanceof Error 
        ? error.stack || error.message
        : String(error);
    
    console.error(`[${new Date().toISOString()}] DeepL API Error: ${errorDetails}`);
    
    const errorResponse: ErrorResponse = {
      error: 'Translation failed',
      details: {
        message: error instanceof Error && 'isAxiosError' in error ? (error as any).response?.data?.message || error.message : (error instanceof Error ? error.message : String(error))
      }
    };
    
    return res.status(500).json(errorResponse);
  }
}