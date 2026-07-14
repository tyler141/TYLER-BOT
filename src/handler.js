const config = require('../config');
const {
  getCommandBody,
  parseCommand,
  getSender,
  isOwner,
  isGroup,
  logCommand,
} = require('./utils/helpers');

const commands = require('./commands');

async function handleMessage(sock, msg, store) {
  const text = getCommandBody(msg.message);
  if (!text) return;

  const parsed = parseCommand(text);
  if (!parsed) return;

  const { command, args, fullArgs } = parsed;
  const sender = getSender(msg);
  const from = msg.key.remoteJid;
  const isGroupMsg = isGroup(msg);
  const senderNum = sender.split('@')[0];
  const pushName = msg.pushName || 'User';
  const owner = isOwner(sender);

  const context = {
    sock,
    msg,
    store,
    text,
    command,
    args,
    fullArgs,
    sender,
    from,
    isGroup: isGroupMsg,
    senderNum,
    pushName,
    owner,
    reply: async (content) => {
      return await sock.sendMessage(from, content, { quoted: msg });
    },
    replyText: async (message) => {
      return await sock.sendMessage(from, { text: message }, { quoted: msg });
    },
    replyMention: async (message, mentioned = []) => {
      return await sock.sendMessage(
        from,
        { text: message, mentions: mentioned },
        { quoted: msg }
      );
    },
    react: async (emoji) => {
      return await sock.sendMessage(from, {
        react: { text: emoji, key: msg.key },
      });
    },
  };

  const cmd = commands[command];
  if (!cmd) return;

  if (cmd.ownerOnly && !owner) {
    return await context.replyText(
      `⚠️ *Access Denied*\n\nThis command is restricted to the bot owner only.`
    );
  }

  if (cmd.groupOnly && !isGroupMsg) {
    return await context.replyText(
      `⚠️ *Group Only*\n\nThis command can only be used in group chats.`
    );
  }

  logCommand(senderNum, command, args);

  try {
    await cmd.execute(context);
  } catch (err) {
    console.error(`[ERROR] Command ${command}:`, err.message);
    await context.replyText(
      `❌ *Error executing command*\n\n${err.message}`
    );
  }
}

module.exports = { handleMessage };
