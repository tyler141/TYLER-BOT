const config = require('../../config');
const { getCommandBody, getMediaType } = require('../utils/helpers');

async function handleAntiDelete(sock, update, store) {
  if (!config.features.antiDelete) return;

  // Detect deletion
  if (update.update.message === null && update.key) {
    const key = update.key;
    if (key.fromMe) return;

    try {
      // Try to load the deleted message from store
      const msg = await store?.loadMessage(key.remoteJid, key.id);
      if (!msg?.message) return;

      const sender = key.participant || key.remoteJid;
      const senderNum = sender.split('@')[0];
      const text = getCommandBody(msg.message);

      let notification = `🚨 *Anti-Delete Alert*\n\n`;
      notification += `👤 Sender: @${senderNum}\n`;
      notification += `📍 Chat: ${key.remoteJid.endsWith('@g.us') ? 'Group' : 'Private'}\n`;

      if (text) {
        notification += `📝 Message: ${text}\n`;
      }

      if (getMediaType(msg.message)) {
        notification += `📎 Media: Yes (media was deleted)\n`;
      }

      notification += `🕐 Time: ${new Date().toLocaleString()}\n`;

      // Send to owner
      const ownerJid = `${config.ownerNumber}@s.whatsapp.net`;
      await sock.sendMessage(ownerJid, {
        text: notification,
        mentions: [sender],
      });

      // Forward original message to owner if it exists
      if (msg.message) {
        await sock.sendMessage(ownerJid, {
          forward: msg,
        });
      }
    } catch (_) {}
  }
}

module.exports = { handleAntiDelete };
