const chalk = require('chalk');
const config = require('../../config');
const fs = require('fs-extra');
const path = require('path');

function getCommandBody(message) {
  const types = [
    'conversation',
    'imageMessage',
    'videoMessage',
    'extendedTextMessage',
    'audioMessage',
    'stickerMessage',
    'documentMessage',
  ];

  for (const type of types) {
    if (message[type]) {
      if (type === 'conversation') return message.conversation || '';
      if (type === 'extendedTextMessage') return message.extendedTextMessage?.text || '';
      if (type === 'imageMessage') return message.imageMessage?.caption || '';
      if (type === 'videoMessage') return message.videoMessage?.caption || '';
      if (type === 'documentMessage') return message.documentMessage?.caption || '';
      return '';
    }
  }
  return '';
}

function getMediaType(message) {
  const types = [
    'imageMessage',
    'videoMessage',
    'audioMessage',
    'stickerMessage',
    'documentMessage',
    'ptvMessage',
  ];
  for (const type of types) {
    if (message[type]) return type;
  }
  return null;
}

function parseCommand(text) {
  if (!text || typeof text !== 'string') return null;
  const trimmed = text.trim();
  if (!trimmed.startsWith(config.prefix)) return null;

  const body = trimmed.slice(config.prefix.length).trim();
  if (!body) return null;

  const args = body.split(/\s+/);
  const command = args.shift().toLowerCase();
  const fullArgs = body;

  return { command, args, fullArgs, body };
}

function getSender(msg) {
  const isGroup = msg.key.remoteJid?.endsWith('@g.us');
  return isGroup
    ? msg.key.participant || msg.key.remoteJid
    : msg.key.remoteJid;
}

function getOwnerJid() {
  return `${config.ownerNumber}@s.whatsapp.net`;
}

function isOwner(sender) {
  const num = sender.split('@')[0];
  return num === config.ownerNumber;
}

function isGroup(msg) {
  return msg.key.remoteJid?.endsWith('@g.us');
}

function getGroupName(sock, jid) {
  try {
    const meta = sock.getSetting(jid);
    return meta || 'Unknown Group';
  } catch {
    return 'Unknown Group';
  }
}

function formatJidToNumber(jid) {
  if (!jid) return '';
  return jid.split('@')[0].split(':')[0];
}

async function downloadMedia(message, sock) {
  const mediaType = getMediaType(message);
  if (!mediaType) return null;

  const stream = await downloadContentFromMessage(message[mediaType], mediaType.replace('Message', ''));
  let buffer = Buffer.from([]);
  for await (const chunk of stream) {
    buffer = Buffer.concat([buffer, chunk]);
  }
  return { buffer, type: mediaType };
}

const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

function isUrl(str) {
  return /^https?:\/\//i.test(str);
}

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function randomEmoji() {
  const emojis = config.autoReactEmoji;
  return emojis[Math.floor(Math.random() * emojis.length)];
}

function formatUptime(uptime) {
  const days = Math.floor(uptime / 86400);
  const hours = Math.floor((uptime % 86400) / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = Math.floor(uptime % 60);
  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

const startTime = Date.now();

function getUptime() {
  return formatUptime(Math.floor((Date.now() - startTime) / 1000));
}

function logCommand(sender, command, args) {
  const time = new Date().toLocaleTimeString();
  console.log(
    chalk.gray(`[${time}]`) +
    chalk.cyan(` ${sender}`) +
    chalk.white(` → `) +
    chalk.green(`${config.prefix}${command}`) +
    (args.length ? chalk.gray(` ${args.join(' ')}`) : '')
  );
}

module.exports = {
  getCommandBody,
  getMediaType,
  parseCommand,
  getSender,
  getOwnerJid,
  isOwner,
  isGroup,
  formatJidToNumber,
  downloadMedia,
  isUrl,
  formatTime,
  randomEmoji,
  formatUptime,
  getUptime,
  logCommand,
  downloadContentFromMessage,
};
