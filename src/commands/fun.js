const { formatJidToNumber } = require('../utils/helpers');

const jokes = [
  "Why don't programmers like nature? It has too many bugs.",
  "I told my computer I needed a break, and it said 'No problem — I'll go to sleep.'",
  "Why did the developer go broke? Because he used up all his cache.",
  "What's a programmer's favorite place? The Foo Bar.",
  "I would tell you a UDP joke, but you might not get it.",
];

const rizz = [
  "Are you a WiFi signal? Because I'm feeling a connection.",
  "Do you have a map? I keep getting lost in your eyes.",
  "Are you French? Because Eiffel for you.",
  "You must be made of copper and tellurium, because you're Cu-Te.",
  "Are you a magician? Because whenever I look at you, everyone else disappears.",
];

const truths = [
  "What's the most embarrassing thing you've ever done?",
  "What's your biggest fear?",
  "What's the last lie you told?",
  "Who do you have a crush on?",
  "What's your most useless talent?",
];

const dares = [
  "Send the last photo in your gallery.",
  "Do 10 pushups and send a video.",
  "Record yourself singing a song.",
  "Send a voice note speaking in a funny accent.",
  "Change your profile picture to a meme for 1 hour.",
];

const eightBalls = [
  "It is certain.",
  "Without a doubt.",
  "Yes, definitely.",
  "Most likely.",
  "Ask again later.",
  "Better not tell you now.",
  "My sources say no.",
  "Outlook not so good.",
  "Very doubtful.",
];

const characters = [
  "Hero", "Villain", "Wise Sage", "Trickster", "Explorer",
  "Loyal Friend", "Mysterious Stranger", "Mastermind", "Rookie", "Legend",
];

module.exports = {
  '8ball': {
    description: 'Magic 8 ball',
    category: 'FUN',
    execute: async (ctx) => {
      if (!ctx.fullArgs) return await ctx.replyText('Usage: .8ball <question>');
      const answer = eightBalls[Math.floor(Math.random() * eightBalls.length)];
      await ctx.replyText(`🎱 *Magic 8 Ball*\n\nQuestion: ${ctx.fullArgs}\nAnswer: ${answer}`);
    },
  },
  ship: {
    description: 'Ship meter',
    category: 'FUN',
    execute: async (ctx) => {
      const mentioned = ctx.msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
      if (mentioned.length < 1) return await ctx.replyText('Usage: .ship @user');
      const percent = Math.floor(Math.random() * 100) + 1;
      const heart = '❤️'.repeat(Math.ceil(percent / 20));
      await ctx.replyMention(
        `💕 *Ship Meter*\n\n@${formatJidToNumber(ctx.sender)} ❤️ @${formatJidToNumber(mentioned[0])}\n\nLove: ${percent}%\n${heart}`,
        [ctx.sender, mentioned[0]]
      );
    },
  },
  joke: {
    description: 'Random joke',
    category: 'FUN',
    execute: async (ctx) => {
      await ctx.replyText(`😂 *Joke*\n\n${jokes[Math.floor(Math.random() * jokes.length)]}`);
    },
  },
  meme: {
    description: 'Random meme',
    category: 'FUN',
    execute: async (ctx) => {
      try {
        const axios = require('axios');
        const res = await axios.get('https://meme-api.com/gimme', { timeout: 10000 });
        const meme = res.data;
        if (meme.url) {
          const imgRes = await axios.get(meme.url, { responseType: 'arraybuffer', timeout: 15000 });
          await ctx.sock.sendMessage(ctx.from, {
            image: Buffer.from(imgRes.data),
            caption: `🤣 *${meme.title}*\nr/${meme.subreddit}`,
          }, { quoted: ctx.msg });
        } else {
          throw new Error('No meme found');
        }
      } catch {
        await ctx.replyText('❌ Failed to fetch meme. Try again later.');
      }
    },
  },
  rizz: {
    description: 'Random rizz line',
    category: 'FUN',
    execute: async (ctx) => {
      await ctx.replyText(`😏 *Rizz*\n\n${rizz[Math.floor(Math.random() * rizz.length)]}`);
    },
  },
  truth: {
    description: 'Truth question',
    category: 'FUN',
    execute: async (ctx) => {
      await ctx.replyText(`🤐 *Truth*\n\n${truths[Math.floor(Math.random() * truths.length)]}`);
    },
  },
  dare: {
    description: 'Dare challenge',
    category: 'FUN',
    execute: async (ctx) => {
      await ctx.replyText(`🎯 *Dare*\n\n${dares[Math.floor(Math.random() * dares.length)]}`);
    },
  },
  coinflip: {
    description: 'Flip a coin',
    category: 'FUN',
    execute: async (ctx) => {
      const result = Math.random() < 0.5 ? 'Heads' : 'Tails';
      await ctx.replyText(`🪙 *Coin Flip*\n\nResult: ${result}`);
    },
  },
  dice: {
    description: 'Roll a dice',
    category: 'FUN',
    execute: async (ctx) => {
      const result = Math.floor(Math.random() * 6) + 1;
      await ctx.replyText(`🎲 *Dice Roll*\n\nResult: ${result}`);
    },
  },
  character: {
    description: 'Random character',
    category: 'FUN',
    execute: async (ctx) => {
      const char = characters[Math.floor(Math.random() * characters.length)];
      await ctx.replyText(`🎭 *Your Character*\n\n${ctx.pushName}, you are a *${char}*!`);
    },
  },
};
