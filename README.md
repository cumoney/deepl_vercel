# DeepL Vercel

这是一个基于 Vercel 部署的 DeepL API 代理服务。它可以帮助你在不直接暴露 DeepL API 密钥的情况下使用 DeepL 的翻译服务。

## 功能特点

- 支持 DeepL API 的文本翻译功能
- 使用 Vercel 部署，无需自己维护服务器
- 内置 CORS 支持，可以在浏览器中直接调用
- 完整的错误处理和日志记录

## 部署说明

1. Fork 这个仓库
2. 在 Vercel 中导入这个项目
3. 部署完成后，你就可以通过 Vercel 提供的域名访问这个服务了

## API 使用说明

### 翻译接口

```
POST /api/translate
```

请求头：
```
Content-Type: application/json
Authorization: DeepL-Auth-Key YOUR_API_KEY
```

请求体：
```json
{
  "text": ["要翻译的文本"],
  "target_lang": "目标语言代码",
  "source_lang": "源语言代码（可选）"
}
```

响应示例：
```json
{
  "translations": [
    {
      "text": "翻译后的文本",
      "detected_source_language": "检测到的源语言"
    }
  ]
}
```

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

## 许可证

MIT License