const config = require('../../config');
const { getUptime } = require('../utils/helpers');

module.exports = {
  menu: {
    description: 'Show bot menu',
    category: 'MAIN',
    execute: async (ctx) => {
      const menu = buildMenu(ctx);
      await ctx.replyText(menu);
    },
  },
  help: {
    description: 'Show help menu',
    category: 'MAIN',
    execute: async (ctx) => {
      const menu = buildMenu(ctx);
      await ctx.replyText(menu);
    },
  },
  list: {
    description: 'List all commands',
    category: 'MAIN',
    execute: async (ctx) => {
      const menu = buildMenu(ctx);
      await ctx.replyText(menu);
    },
  },
};

function buildMenu(ctx) {
  const { prefix, botName } = config;
  const uptime = getUptime();
  const date = new Date().toLocaleDateString();
  const time = new Date().toLocaleTimeString();

  let text = '';
  text += `╭═══════════════════════\n`;
  text += `║ ✨ *${botName}* ✨\n`;
  text += `║ _Powered by Google Gemini_\n`;
  text += `╰═══════════════════════\n\n`;
  text += `┌─────────────────────\n`;
  text += `│ 👤 User: ${ctx.pushName}\n`;
  text += `│ 📅 Date: ${date}\n`;
  text += `│ 🕐 Time: ${time}\n`;
  text += `│ ⏱️ Uptime: ${uptime}\n`;
  text += `│ 📊 Commands: ${countCommands()}\n`;
  text += `└─────────────────────\n\n`;

  text += `*📥 DOWNLOADER*\n`;
  text += `├ ${prefix}ytvideo <url> - Download YouTube video\n`;
  text += `├ ${prefix}ytaudio <url> - Download YouTube audio\n`;
  text += `├ ${prefix}tiktok <url> - Download TikTok\n`;
  text += `├ ${prefix}facebook <url> - Download Facebook video\n`;
  text += `├ ${prefix}instagram <url> - Download Instagram\n`;
  text += `├ ${prefix}twitter <url> - Download Twitter/X video\n`;
  text += `├ ${prefix}play <song> - Play song from YouTube\n`;
  text += `└ ${prefix}img <query> - Search & download image\n\n`;

  text += `*🤖 AI & TOOLS*\n`;
  text += `├ ${prefix}ai <text> - Google Gemini AI response\n`;
  text += `├ ${prefix}gpt <text> - Google Gemini AI response\n`;
  text += `├ ${prefix}gemini <text> - Google Gemini AI response\n`;
  text += `├ ${prefix}translate <lang> <text> - Translate text\n`;
  text += `└ ${prefix}quote - Random quote\n\n`;

  text += `*📊 STATUS & PRESENCE*\n`;
  text += `├ ${prefix}online - Set always online ON\n`;
  text += `├ ${prefix}offline - Set always online OFF\n`;
  text += `├ ${prefix}autoread <on/off> - Toggle auto-read\n`;
  text += `├ ${prefix}autotype <on/off> - Toggle auto-typing\n`;
  text += `├ ${prefix}autorecord <on/off> - Toggle auto-recording\n`;
  text += `├ ${prefix}autostatus <on/off> - Toggle status view\n`;
  text += `├ ${prefix}autoreact <on/off> - Toggle auto-react\n`;
  text += `└ ${prefix}antiblue <on/off> - Toggle anti blue tick\n\n`;

  text += `*👥 GROUP MANAGEMENT*\n`;
  text += `├ ${prefix}grouplink - Get group invite link\n`;
  text += `├ ${prefix}revoke - Revoke group link\n`;
  text += `├ ${prefix}kick @user - Kick member\n`;
  text += `├ ${prefix}add <number> - Add member\n`;
  text += `├ ${prefix}promote @user - Promote to admin\n`;
  text += `├ ${prefix}demote @user - Demote admin\n`;
  text += `├ ${prefix}tagall - Tag all members\n`;
  text += `├ ${prefix}hidetag <msg> - Hidden tag all\n`;
  text += `├ ${prefix}groupinfo - Group information\n`;
  text += `├ ${prefix}setgcpp <image> - Set group icon\n`;
  text += `├ ${prefix}setgcname <name> - Set group name\n`;
  text += `├ ${prefix}setdesc <desc> - Set group description\n`;
  text += `├ ${prefix}mute - Close group (admins only)\n`;
  text += `├ ${prefix}unmute - Open group\n`;
  text += `├ ${prefix}lockgc - Lock group\n`;
  text += `└ ${prefix}infouser @user - User info\n\n`;

  text += `*🔧 OWNER ONLY*\n`;
  text += `├ ${prefix}ping - Bot response time\n`;
  text += `├ ${prefix}uptime - Bot uptime\n`;
  text += `├ ${prefix}restart - Restart bot\n`;
  text += `├ ${prefix}shutdown - Shutdown bot\n`;
  text += `├ ${prefix}setpp <image> - Set bot profile pic\n`;
  text += `├ ${prefix}setname <name> - Set bot name\n`;
  text += `├ ${prefix}setbio <text> - Set bot bio\n`;
  text += `├ ${prefix}bc <msg> - Broadcast to all chats\n`;
  text += `├ ${prefix}bcgc <msg> - Broadcast to all groups\n`;
  text += `├ ${prefix}getgroups - List all groups\n`;
  text += `├ ${prefix}join <link> - Join group via link\n`;
  text += `├ ${prefix}leave - Leave current group\n`;
  text += `├ ${prefix}block @user - Block user\n`;
  text += `├ ${prefix}unblock @user - Unblock user\n`;
  text += `├ ${prefix}setprefix <char> - Change prefix\n`;
  text += `└ ${prefix}status - Bot status info\n\n`;

  text += `*⚙️ SETTINGS*\n`;
  text += `├ ${prefix}settings - Show current settings\n`;
  text += `├ ${prefix}autostatuslike <on/off> - Auto like status\n`;
  text += `├ ${prefix}anticall <on/off> - Anti call\n`;
  text += `├ ${prefix}autobio <on/off> - Auto bio update\n`;
  text += `├ ${prefix}antidelete <on/off> - Anti delete messages\n`;
  text += `└ ${prefix}language - Set language\n\n`;

  text += `*🎮 FUN*\n`;
  text += `├ ${prefix}8ball <question> - Magic 8 ball\n`;
  text += `├ ${prefix}ship @user - Ship meter\n`;
  text += `├ ${prefix}joke - Random joke\n`;
  text += `├ ${prefix}meme - Random meme\n`;
  text += `├ ${prefix}rizz - Random rizz line\n`;
  text += `├ ${prefix}truth - Truth question\n`;
  text += `├ ${prefix}dare - Dare question\n`;
  text += `├ ${prefix}coinflip - Flip a coin\n`;
  text += `├ ${prefix}dice - Roll a dice\n`;
  text += `└ ${prefix}character - Random character\n\n`;

  text += `*🛠️ UTILITY*\n`;
  text += `├ ${prefix}sticker - Image to sticker\n`;
  text += `├ ${prefix}take - Change sticker text\n`;
  text += `├ ${prefix}tts <text> - Text to speech\n`;
  text += `├ ${prefix}delete - Delete bot message\n`;
  text += `├ ${prefix}calc <expr> - Calculator\n`;
  text += `├ ${prefix}shorturl <url> - Shorten URL\n`;
  text += `├ ${prefix}tempmail - Temporary email\n`;
  text += `├ ${prefix}uuid - Generate UUID\n`;
  text += `├ ${prefix}base64 <text> - Encode/Decode base64\n`;
  text += `├ ${prefix}hash <text> - Hash text\n`;
  text += `├ ${prefix}weather <city> - Weather info\n`;
  text += `├ ${prefix}currency <amt> <from> <to> - Currency convert\n`;
  text += `├ ${prefix}wikipedia <query> - Wikipedia search\n`;
  text += `└ ${prefix}google <query> - Google search\n\n`;

  text += `╭═══════════════════════\n`;
  text += `║ 📖 Type *${prefix}help <command>* for details\n`;
  text += `║ 🔧 Prefix: *${prefix}*\n`;
  text += `║ 💬 Commands: *${countCommands()}*\n`;
  text += `╰═══════════════════════\n`;
  text += `_Powered by ${botName} | Google Gemini AI_`;

  return text;
}

let _commandCount = null;
function countCommands() {
  if (_commandCount !== null) return _commandCount;
  const all = require('./index');
  _commandCount = Object.keys(all).length;
  return _commandCount;
}
