const axios = require('axios');
const crypto = require('crypto');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

module.exports = {
  sticker: {
    description: 'Convert image to sticker',
    category: 'UTILITY',
    execute: async (ctx) => {
      const hasImage = ctx.msg.message?.imageMessage;
      const quotedImage = ctx.msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
      const imageMsg = hasImage || quotedImage;
      if (!imageMsg) return await ctx.replyText('Usage: Send/reply an image with .sticker');

      try {
        const type = hasImage ? ctx.msg.message : ctx.msg.message.extendedTextMessage.contextInfo.quotedMessage;
        const stream = await downloadContentFromMessage(imageMsg, 'image');
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
          buffer = Buffer.concat([buffer, chunk]);
        }
        await ctx.sock.sendMessage(ctx.from, {
          sticker: buffer,
        }, { quoted: ctx.msg });
      } catch (err) {
        await ctx.replyText(`❌ Failed to create sticker: ${err.message}`);
      }
    },
  },
  take: {
    description: 'Change sticker text/pack',
    category: 'UTILITY',
    execute: async (ctx) => {
      const quoted = ctx.msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.stickerMessage;
      if (!quoted) return await ctx.replyText('Reply to a sticker with .take <packname> <author>');
      try {
        const stream = await downloadContentFromMessage(quoted, 'sticker');
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
          buffer = Buffer.concat([buffer, chunk]);
        }
        await ctx.sock.sendMessage(ctx.from, {
          sticker: buffer,
        }, { quoted: ctx.msg });
      } catch {
        await ctx.replyText('❌ Failed to process sticker.');
      }
    },
  },
  tts: {
    description: 'Text to speech',
    category: 'UTILITY',
    execute: async (ctx) => {
      if (!ctx.fullArgs) return await ctx.replyText('Usage: .tts <text>');
      try {
        const lang = 'en';
        const url = `https://translate.googleapis.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(ctx.fullArgs)}&tl=${lang}&client=tw-ob`;
        const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 });
        await ctx.sock.sendMessage(
          ctx.from,
          { audio: Buffer.from(res.data), mimetype: 'audio/mpeg', ptt: false },
          { quoted: ctx.msg }
        );
      } catch {
        await ctx.replyText('❌ TTS failed. Try again.');
      }
    },
  },
  delete: {
    description: 'Delete bot message',
    category: 'UTILITY',
    execute: async (ctx) => {
      const quoted = ctx.msg.message?.extendedTextMessage?.contextInfo;
      if (!quoted) return await ctx.replyText('Reply to a message to delete it.');
      try {
        await ctx.sock.sendMessage(ctx.from, {
          delete: {
            remoteJid: ctx.from,
            fromMe: true,
            id: quoted.stanzaId,
            participant: quoted.participant,
          },
        });
      } catch {
        await ctx.replyText('❌ Can only delete bot messages.');
      }
    },
  },
  calc: {
    description: 'Calculator',
    category: 'UTILITY',
    execute: async (ctx) => {
      if (!ctx.fullArgs) return await ctx.replyText('Usage: .calc <expression>');
      try {
        const expr = ctx.fullArgs.replace(/[^-()\d/*+.%\s]/g, '');
        if (!expr) throw new Error('Invalid expression');
        const result = Function(`"use strict"; return (${expr})`)();
        await ctx.replyText(`🧮 *Calculator*\n\n${ctx.fullArgs} = ${result}`);
      } catch {
        await ctx.replyText('❌ Invalid expression.');
      }
    },
  },
  shorturl: {
    description: 'Shorten URL',
    category: 'UTILITY',
    execute: async (ctx) => {
      if (!ctx.fullArgs || !isUrl(ctx.fullArgs))
        return await ctx.replyText('Usage: .shorturl <url>');
      try {
        const res = await axios.get(
          `https://is.gd/create.php?format=simple&url=${encodeURIComponent(ctx.fullArgs)}`,
          { timeout: 10000 }
        );
        await ctx.replyText(`🔗 *Shortened URL*\n\n${res.data}`);
      } catch {
        await ctx.replyText('❌ URL shortening failed.');
      }
    },
  },
  tempmail: {
    description: 'Temporary email',
    category: 'UTILITY',
    execute: async (ctx) => {
      try {
        const res = await axios.get('https://www.1secmail.com/api/v1/?action=genRandomMailbox', { timeout: 10000 });
        const email = res.data[0];
        await ctx.replyText(
          `📧 *Temporary Email*\n\nAddress: ${email}\nDomain: 1secmail.com\n\nCheck inbox: .checkmail`
        );
      } catch {
        await ctx.replyText('❌ Failed to generate temp mail.');
      }
    },
  },
  uuid: {
    description: 'Generate UUID',
    category: 'UTILITY',
    execute: async (ctx) => {
      const uuid = crypto.randomUUID();
      await ctx.replyText(`🆔 *UUID*\n\n${uuid}`);
    },
  },
  base64: {
    description: 'Base64 encode/decode',
    category: 'UTILITY',
    execute: async (ctx) => {
      if (!ctx.fullArgs) return await ctx.replyText('Usage: .base64 <encode/decode> <text>');
      const mode = ctx.args[0];
      const text = ctx.args.slice(1).join(' ');
      try {
        if (mode === 'encode') {
          const encoded = Buffer.from(text).toString('base64');
          await ctx.replyText(`📝 *Base64 Encoded*\n\n${encoded}`);
        } else if (mode === 'decode') {
          const decoded = Buffer.from(text, 'base64').toString('utf8');
          await ctx.replyText(`📝 *Base64 Decoded*\n\n${decoded}`);
        } else {
          await ctx.replyText('Usage: .base64 <encode/decode> <text>');
        }
      } catch {
        await ctx.replyText('❌ Invalid input.');
      }
    },
  },
  hash: {
    description: 'Hash text (SHA-256)',
    category: 'UTILITY',
    execute: async (ctx) => {
      if (!ctx.fullArgs) return await ctx.replyText('Usage: .hash <text>');
      const hash = crypto.createHash('sha256').update(ctx.fullArgs).digest('hex');
      await ctx.replyText(`#️⃣ *SHA-256 Hash*\n\n${hash}`);
    },
  },
  weather: {
    description: 'Weather info',
    category: 'UTILITY',
    execute: async (ctx) => {
      if (!ctx.fullArgs) return await ctx.replyText('Usage: .weather <city>');
      try {
        const res = await axios.get(
          `https://wttr.in/${encodeURIComponent(ctx.fullArgs)}?format=j1`,
          { timeout: 10000, headers: { 'User-Agent': 'curl/7.68.0' } }
        );
        const data = res.data;
        const current = data.current_condition[0];
        let text = `🌤️ *Weather - ${ctx.fullArgs}*\n\n`;
        text += `🌡️ Temp: ${current.temp_C}°C / ${current.temp_F}°F\n`;
        text += `💧 Humidity: ${current.humidity}%\n`;
        text += `🌬️ Wind: ${current.windspeedKmph} km/h\n`;
        text += `☁️ Condition: ${current.weatherDesc[0].value}\n`;
        text += `👁️ Feels like: ${current.FeelsLikeC}°C`;
        await ctx.replyText(text);
      } catch {
        await ctx.replyText('❌ Weather info unavailable. Try another city.');
      }
    },
  },
  currency: {
    description: 'Currency convert',
    category: 'UTILITY',
    execute: async (ctx) => {
      if (ctx.args.length < 3)
        return await ctx.replyText('Usage: .currency <amount> <from> <to>');
      const [amount, from, to] = ctx.args;
      try {
        const res = await axios.get(
          `https://api.exchangerate-api.com/v4/latest/${from.toUpperCase()}`,
          { timeout: 10000 }
        );
        const rate = res.data.rates[to.toUpperCase()];
        if (!rate) throw new Error('Currency not found');
        const result = (parseFloat(amount) * rate).toFixed(2);
        await ctx.replyText(
          `💱 *Currency Convert*\n\n${amount} ${from.toUpperCase()} = ${result} ${to.toUpperCase()}\nRate: 1 ${from.toUpperCase()} = ${rate} ${to.toUpperCase()}`
        );
      } catch {
        await ctx.replyText('❌ Conversion failed. Check currency codes.');
      }
    },
  },
  wikipedia: {
    description: 'Wikipedia search',
    category: 'UTILITY',
    execute: async (ctx) => {
      if (!ctx.fullArgs) return await ctx.replyText('Usage: .wikipedia <query>');
      try {
        const res = await axios.get(
          `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(ctx.fullArgs)}`,
          { timeout: 10000 }
        );
        const data = res.data;
        if (data.type === 'disambiguation') {
          await ctx.replyText(`📖 Multiple results found. Be more specific.`);
          return;
        }
        await ctx.replyText(
          `📚 *Wikipedia*\n\n*${data.title}*\n\n${data.extract}\n\n🔗 ${data.content_urls?.desktop?.page || ''}`
        );
      } catch {
        await ctx.replyText('❌ No Wikipedia article found.');
      }
    },
  },
  google: {
    description: 'Google search',
    category: 'UTILITY',
    execute: async (ctx) => {
      if (!ctx.fullArgs) return await ctx.replyText('Usage: .google <query>');
      try {
        const res = await axios.get(
          `https://www.googleapis.com/customsearch/v1`,
          {
            params: {
              key: 'AIzaSyA...',
              cx: '...',
              q: ctx.fullArgs,
              num: 5,
            },
            timeout: 10000,
          }
        );
        if (res.data.items && res.data.items.length > 0) {
          let text = `🔍 *Google Search*\n\n`;
          res.data.items.forEach((item, i) => {
            text += `${i + 1}. *${item.title}*\n${item.link}\n${item.snippet}\n\n`;
          });
          await ctx.replyText(text);
        } else {
          await ctx.replyText('No results found.');
        }
      } catch {
        const url = `https://www.google.com/search?q=${encodeURIComponent(ctx.fullArgs)}`;
        await ctx.replyText(`🔍 *Google Search*\n\n${url}`);
      }
    },
  },
};
