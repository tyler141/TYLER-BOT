const axios = require('axios');
const { isUrl } = require('../utils/helpers');

async function fetchYtInfo(query) {
  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  const { data } = await axios.get(searchUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    timeout: 15000,
  });
  const match = data.match(/"videoId":"([^"]+)"/);
  if (!match) throw new Error('No results found');
  const videoId = match[1];
  const titleMatch = data.match(/"title":{"runs":\[{"text":"([^"]+)"/);
  const title = titleMatch ? titleMatch[1] : 'Unknown';
  return { videoId, title, url: `https://youtu.be/${videoId}` };
}

module.exports = {
  ytvideo: {
    description: 'Download YouTube video',
    category: 'DOWNLOADER',
    execute: async (ctx) => {
      if (!ctx.fullArgs) return await ctx.replyText('Usage: .ytvideo <url>');
      await ctx.replyText(`⬇️ Fetching video info...\n\n${ctx.fullArgs}`);
      try {
        let url = ctx.fullArgs;
        let title = 'YouTube Video';
        if (!isUrl(url)) {
          const info = await fetchYtInfo(url);
          url = info.url;
          title = info.title;
        }
        await ctx.replyText(
          `✅ *YouTube Video Found*\n\n📋 Title: ${title}\n🔗 URL: ${url}\n\n⚠️ Note: Direct video download requires a yt-dlp server or API. Use the URL to watch or use .play for audio.`
        );
      } catch (err) {
        await ctx.replyText(`❌ Failed to fetch video: ${err.message}`);
      }
    },
  },
  ytaudio: {
    description: 'Download YouTube audio',
    category: 'DOWNLOADER',
    execute: async (ctx) => {
      if (!ctx.fullArgs) return await ctx.replyText('Usage: .ytaudio <url>');
      await ctx.replyText(`⬇️ Fetching audio info...\n\n${ctx.fullArgs}`);
      try {
        let url = ctx.fullArgs;
        let title = 'YouTube Audio';
        if (!isUrl(url)) {
          const info = await fetchYtInfo(url);
          url = info.url;
          title = info.title;
        }
        await ctx.replyText(
          `✅ *YouTube Audio Found*\n\n📋 Title: ${title}\n🔗 URL: ${url}\n\n⚠️ Note: Direct audio download requires a yt-dlp server or API. Use the URL to listen.`
        );
      } catch (err) {
        await ctx.replyText(`❌ Failed to fetch audio: ${err.message}`);
      }
    },
  },
  play: {
    description: 'Play song from YouTube',
    category: 'DOWNLOADER',
    execute: async (ctx) => {
      if (!ctx.fullArgs) return await ctx.replyText('Usage: .play <song name>');
      await ctx.replyText(`🔍 Searching for: ${ctx.fullArgs}`);
      try {
        const info = await fetchYtInfo(ctx.fullArgs);
        await ctx.replyText(
          `🎵 *Now Playing*\n\n📋 Title: ${info.title}\n🔗 URL: ${info.url}\n\n▶️ Click the link to listen on YouTube`
        );
      } catch (err) {
        await ctx.replyText(`❌ Search failed: ${err.message}`);
      }
    },
  },
  tiktok: {
    description: 'Download TikTok video',
    category: 'DOWNLOADER',
    execute: async (ctx) => {
      if (!ctx.fullArgs) return await ctx.replyText('Usage: .tiktok <url>');
      await ctx.replyText('⬇️ Fetching TikTok...');
      try {
        await ctx.replyText(
          `✅ TikTok URL received: ${ctx.fullArgs}\n\n⚠️ Direct download requires an API key. Use a TikTok downloader service with this URL.`
        );
      } catch (err) {
        await ctx.replyText(`❌ Failed: ${err.message}`);
      }
    },
  },
  facebook: {
    description: 'Download Facebook video',
    category: 'DOWNLOADER',
    execute: async (ctx) => {
      if (!ctx.fullArgs) return await ctx.replyText('Usage: .facebook <url>');
      await ctx.replyText(
        `✅ Facebook URL received: ${ctx.fullArgs}\n\n⚠️ Direct download requires an API. Use a Facebook downloader service with this URL.`
      );
    },
  },
  instagram: {
    description: 'Download Instagram content',
    category: 'DOWNLOADER',
    execute: async (ctx) => {
      if (!ctx.fullArgs) return await ctx.replyText('Usage: .instagram <url>');
      await ctx.replyText(
        `✅ Instagram URL received: ${ctx.fullArgs}\n\n⚠️ Direct download requires an API. Use an Instagram downloader service with this URL.`
      );
    },
  },
  twitter: {
    description: 'Download Twitter/X video',
    category: 'DOWNLOADER',
    execute: async (ctx) => {
      if (!ctx.fullArgs) return await ctx.replyText('Usage: .twitter <url>');
      await ctx.replyText(
        `✅ Twitter/X URL received: ${ctx.fullArgs}\n\n⚠️ Direct download requires an API. Use a Twitter downloader service with this URL.`
      );
    },
  },
  img: {
    description: 'Search and download image',
    category: 'DOWNLOADER',
    execute: async (ctx) => {
      if (!ctx.fullArgs) return await ctx.replyText('Usage: .img <search query>');
      await ctx.replyText(`🔍 Searching images for: ${ctx.fullArgs}`);
      try {
        const res = await axios.get(
          `https://www.googleapis.com/customsearch/v1`,
          {
            params: {
              key: 'AIzaSyA...',
              cx: '...',
              q: ctx.fullArgs,
              searchType: 'image',
              num: 1,
            },
            timeout: 10000,
          }
        );
        if (res.data.items && res.data.items[0]) {
          const imgUrl = res.data.items[0].link;
          const imgRes = await axios.get(imgUrl, { responseType: 'arraybuffer', timeout: 15000 });
          await ctx.sock.sendMessage(ctx.from, {
            image: Buffer.from(imgRes.data),
            caption: `🖼️ Image result for: ${ctx.fullArgs}`,
          }, { quoted: ctx.msg });
        } else {
          throw new Error('No images found');
        }
      } catch {
        const fallbackUrl = `https://source.unsplash.com/800x600/?${encodeURIComponent(ctx.fullArgs)}`;
        try {
          const imgRes = await axios.get(fallbackUrl, { responseType: 'arraybuffer', timeout: 15000 });
          await ctx.sock.sendMessage(ctx.from, {
            image: Buffer.from(imgRes.data),
            caption: `🖼️ Image result for: ${ctx.fullArgs}`,
          }, { quoted: ctx.msg });
        } catch {
          await ctx.replyText('❌ Image search failed. Try another query.');
        }
      }
    },
  },
};
