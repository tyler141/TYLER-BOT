const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
const config = require('../../config');

let genAI = null;
let model = null;

function getGeminiModel() {
  if (!config.geminiKey || config.geminiKey === 'your_gemini_api_key_here') {
    return null;
  }
  if (!genAI) {
    genAI = new GoogleGenerativeAI(config.geminiKey);
    model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: 'You are TYLER-BOT, a helpful WhatsApp assistant. Keep responses concise, friendly, and informative. Use minimal formatting.',
    });
  }
  return model;
}

async function callGemini(prompt) {
  const model = getGeminiModel();
  if (!model) {
    return fallbackAI(prompt);
  }
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (err) {
    return `⚠️ Gemini AI error: ${err.message}\n\nMake sure your GEMINI_API_KEY is valid in .env`;
  }
}

function fallbackAI(prompt) {
  const responses = [
    `I received: "${prompt}"\n\nTo enable full AI responses, add your Google Gemini API key in the .env file.\n\nExample:\nGEMINI_API_KEY=your_key_here\n\nGet a free key at: https://aistudio.google.com/app/apikey`,
    `You said: "${prompt}"\n\nI'm running in limited mode. Set GEMINI_API_KEY in .env for full Google Gemini AI responses.\n\nFree key: https://aistudio.google.com/app/apikey`,
    `Question: "${prompt}"\n\nAI requires a Google Gemini API key to function fully. Please configure GEMINI_API_KEY in .env.\n\nGet one free: https://aistudio.google.com/app/apikey`,
  ];
  return responses[Math.floor(Math.random() * responses.length)];
}

module.exports = {
  ai: {
    description: 'Google Gemini AI response',
    category: 'AI',
    execute: async (ctx) => {
      if (!ctx.fullArgs) return await ctx.replyText('Usage: .ai <your question>');
      await ctx.reply('🤖 Thinking...');
      const response = await callGemini(ctx.fullArgs);
      await ctx.replyText(`🤖 *Gemini AI*\n\n${response}`);
    },
  },
  gpt: {
    description: 'Google Gemini AI response',
    category: 'AI',
    execute: async (ctx) => {
      if (!ctx.fullArgs) return await ctx.replyText('Usage: .gpt <your question>');
      await ctx.reply('🤖 Thinking...');
      const response = await callGemini(ctx.fullArgs);
      await ctx.replyText(`🤖 *Gemini AI*\n\n${response}`);
    },
  },
  gemini: {
    description: 'Google Gemini AI response',
    category: 'AI',
    execute: async (ctx) => {
      if (!ctx.fullArgs) return await ctx.replyText('Usage: .gemini <your question>');
      await ctx.reply('🤖 Thinking...');
      const response = await callGemini(ctx.fullArgs);
      await ctx.replyText(`🤖 *Gemini AI*\n\n${response}`);
    },
  },
  translate: {
    description: 'Translate text',
    category: 'AI',
    execute: async (ctx) => {
      if (ctx.args.length < 2)
        return await ctx.replyText('Usage: .translate <language> <text>');
      const lang = ctx.args[0];
      const text = ctx.args.slice(1).join(' ');
      try {
        const res = await axios.get(
          `https://translate.googleapis.com/translate_a/single`,
          {
            params: { client: 'gtx', sl: 'auto', tl: lang, dt: 't', q: text },
            timeout: 15000,
          }
        );
        const translated = res.data[0].map((item) => item[0]).join('');
        await ctx.replyText(
          `🌐 *Translation*\n\n*Original:* ${text}\n*Translated (${lang}):* ${translated}`
        );
      } catch (err) {
        await ctx.replyText('❌ Translation failed. Try again.');
      }
    },
  },
  quote: {
    description: 'Random inspirational quote',
    category: 'AI',
    execute: async (ctx) => {
      try {
        const res = await axios.get('https://api.quotable.io/random', { timeout: 10000 });
        await ctx.replyText(`💬 *Quote*\n\n"${res.data.content}"\n\n— ${res.data.author}`);
      } catch {
        const quotes = [
          { content: 'The only way to do great work is to love what you do.', author: 'Steve Jobs' },
          { content: 'Success is not final, failure is not fatal.', author: 'Winston Churchill' },
          { content: 'Believe you can and you\'re halfway there.', author: 'Theodore Roosevelt' },
        ];
        const q = quotes[Math.floor(Math.random() * quotes.length)];
        await ctx.replyText(`💬 *Quote*\n\n"${q.content}"\n\n— ${q.author}`);
      }
    },
  },
};
