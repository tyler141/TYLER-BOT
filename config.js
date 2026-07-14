require('dotenv').config();

const config = {
  botName: process.env.BOT_NAME || 'TYLER-BOT',
  prefix: process.env.BOT_PREFIX || '.',
  ownerNumber: process.env.OWNER_NUMBER || '254751332163',
  ownerName: 'Owner',
  sessionId: process.env.SESSION_ID || 'tyler-bot',
  geminiKey: process.env.GEMINI_API_KEY || '',

  features: {
    autoRead: process.env.AUTO_READ === 'true',
    autoStatusView: process.env.AUTO_STATUS_VIEW === 'true',
    autoStatusLike: process.env.AUTO_STATUS_LIKE === 'true',
    autoTyping: process.env.AUTO_TYPING === 'true',
    autoRecording: process.env.AUTO_RECORDING === 'true',
    alwaysOnline: process.env.ALWAYS_ONLINE === 'true',
    antiCall: process.env.ANTI_CALL === 'true',
    autoReact: process.env.AUTO_REACT === 'true',
    autoBlueTick: process.env.AUTO_BLUE_TICK === 'true',
    autoBio: process.env.AUTO_BIO === 'true',
    antiDelete: process.env.ANTI_DELETE === 'true',
    autoSaveContacts: process.env.AUTO_SAVE_CONTACTS === 'true',
  },

  autoReactEmoji: ['❤️', '🔥', '😂', '👍', '🎉', '💯', '😍', '🙏'],

  autoBioMessages: [
    '🤖 TYLER-BOT | Always Online',
    '⚡ Powered by TYLER | {time}',
    '🔥 Bot Active | {date}',
    '💻 TYLER-BOT Running 24/7',
  ],

  menuSections: [
    'DOWNLOADER',
    'AI & TOOLS',
    'STATUS',
    'GROUP',
    'OWNER',
    'SETTINGS',
    'FUN',
    'UTILITY',
  ],
};

module.exports = config;
