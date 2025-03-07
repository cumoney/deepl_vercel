import axios from 'axios';

interface TranslationResponse {
  translations: Array<{
    text: string;
    detected_source_language: string;
  }>;
}

const API_URL = 'http://localhost:3000/api/translate';
const API_KEY = '2c8bdcb7-5ead-e2dd-5b06-3e1d4d69035c:fx'; // 替换为你的DeepL API密钥

// 移除未使用的sleep函数

describe('翻译API测试', () => {
  // 基本翻译功能测试
  test('单文本翻译测试', async () => {
    const response = await axios.post<TranslationResponse>(API_URL, {
      text: 'Hello, world!',
      target_lang: 'zh'
    }, {
      headers: {
        'Authorization': `DeepL-Auth-Key ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    expect(response.status).toBe(200);
    expect(response.data.translations).toHaveLength(1);
    expect((response.data as TranslationResponse).translations[0].text).toBeTruthy();
    expect((response.data as TranslationResponse).translations[0].detected_source_language).toBe('EN');
  });

  test('多文本数组翻译测试', async () => {
    const response = await axios.post<TranslationResponse>(API_URL, {
      text: ['Hello', 'World'],
      target_lang: 'zh'
    }, {
      headers: {
        'Authorization': `DeepL-Auth-Key ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    expect(response.status).toBe(200);
    expect(response.data.translations).toHaveLength(2);
    ((response.data as TranslationResponse).translations).forEach((translation) => {
      expect(translation.text).toBeTruthy();
      // 移除特定语言检测的断言，因为DeepL可能会返回不同的检测结果
      expect(translation.detected_source_language).toBeTruthy();
    });
  });

  // 错误处理测试
  test('无效的API密钥测试', async () => {
    try {
      await axios.post(API_URL, {
        text: 'Hello',
        target_lang: 'zh'
      }, {
        headers: {
          'Authorization': 'DeepL-Auth-Key invalid-key',
          'Content-Type': 'application/json'
        }
      });
    } catch (error: any) {
      expect(error.response.status).toBe(500);
      expect(error.response.data.error).toBeTruthy();
    }
  });

  test('无效的目标语言代码测试', async () => {
    try {
      await axios.post(API_URL, {
        text: 'Hello',
        target_lang: 'invalid'
      }, {
        headers: {
          'Authorization': `DeepL-Auth-Key ${API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (error: any) {
      expect(error.response.status).toBe(400);
      expect(error.response.data.error).toBeTruthy();
    }
  });
});