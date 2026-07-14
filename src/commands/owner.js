const config = require('../../config');
const { getUptime } = require('../utils/helpers');

module.exports = {
  ping: {
    description: 'Bot response time',
    category: 'OWNER',
    ownerOnly: true,
    execute: async (ctx) => {
      const start = Date.now();
      await ctx.reply('⚡');
      const latency = Date.now() - start;
      await ctx.replyText(`🏓 *Pong!*\n\nLatency: ${latency}ms\nUptime: ${getUptime()}`);
    },
  },
  uptime: {
    description: 'Show bot uptime',
    category: 'OWNER',
    execute: async (ctx) => {
      await ctx.replyText(`⏱️ *Uptime*\n\n${getUptime()}`);
    },
  },
  restart: {
    description: 'Restart bot',
    category: 'OWNER',
    ownerOnly: true,
    execute: async (ctx) => {
      await ctx.replyText('🔄 Restarting bot...');
      setTimeout(() => process.exit(0), 1000);
    },
  },
  shutdown: {
    description: 'Shutdown bot',
    category: 'OWNER',
    ownerOnly: true,
    execute: async (ctx) => {
      await ctx.replyText('🔴 Shutting down...');
      setTimeout(() => process.exit(0), 1000);
    },
  },
  setpp: {
    description: 'Set bot profile picture',
    category: 'OWNER',
    ownerOnly: true,
    execute: async (ctx) => {
      if (!ctx.msg.message?.imageMessage) {
        return await ctx.replyText('Usage: Reply/send an image with .setpp');
      }
      try {
        const { downloadMedia } = require('../utils/helpers');
        const media = await downloadMedia(ctx.msg.message, ctx.sock);
        if (!media) return await ctx.replyText('❌ No image found.');
        await ctx.sock.updateProfilePicture(ctx.sock.user.id, media.buffer);
        await ctx.replyText('✅ Bot profile picture updated.');
      } catch {
        await ctx.replyText('❌ Failed to update profile picture.');
      }
    },
  },
  setname: {
    description: 'Set bot name',
    category: 'OWNER',
    ownerOnly: true,
    execute: async (ctx) => {
      if (!ctx.fullArgs) return await ctx.replyText('Usage: .setname <new name>');
      try {
        await ctx.sock.updateProfileName(ctx.fullArgs);
        await ctx.replyText(`✅ Bot name updated to: ${ctx.fullArgs}`);
      } catch {
        await ctx.replyText('❌ Failed to update name.');
      }
    },
  },
  setbio: {
    description: 'Set bot bio',
    category: 'OWNER',
    ownerOnly: true,
    execute: async (ctx) => {
      if (!ctx.fullArgs) return await ctx.replyText('Usage: .setbio <text>');
      try {
        await ctx.sock.updateProfileStatus(ctx.fullArgs);
        await ctx.replyText(`✅ Bio updated to: ${ctx.fullArgs}`);
      } catch {
        await ctx.replyText('❌ Failed to update bio.');
      }
    },
  },
  bc: {
    description: 'Broadcast to all chats',
    category: 'OWNER',
    ownerOnly: true,
    execute: async (ctx) => {
      if (!ctx.fullArgs) return await ctx.replyText('Usage: .bc <message>');
      await ctx.replyText('📢 Broadcasting to all chats...');
      const chats = ctx.store?.getAllChats() || [];
      let count = 0;
      for (const chat of chats) {
        try {
          await ctx.sock.sendMessage(chat.id, { text: `📢 *Broadcast*\n\n${ctx.fullArgs}` });
          count++;
        } catch {}
      }
      await ctx.replyText(`✅ Broadcast sent to ${count} chats.`);
    },
  },
  bcgc: {
    description: 'Broadcast to all groups',
    category: 'OWNER',
    ownerOnly: true,
    execute: async (ctx) => {
      if (!ctx.fullArgs) return await ctx.replyText('Usage: .bcgc <message>');
      await ctx.replyText('📢 Broadcasting to all groups...');
      const chats = ctx.store?.getAllChats() || [];
      const groups = chats.filter((c) => c.id.endsWith('@g.us'));
      let count = 0;
      for (const group of groups) {
        try {
          await ctx.sock.sendMessage(group.id, { text: `📢 *Broadcast*\n\n${ctx.fullArgs}` });
          count++;
        } catch {}
      }
      await ctx.replyText(`✅ Broadcast sent to ${count} groups.`);
      if (count === 0) await ctx.replyText('No groups found. Join groups first.');
    },
  },
  getgroups: {
    description: 'List all groups',
    category: 'OWNER',
    ownerOnly: true,
    execute: async (ctx) => {
      const chats = ctx.store?.getAllChats() || [];
      const groups = chats.filter((c) => c.id.endsWith('@g.us'));
      if (!groups.length) return await ctx.replyText('No groups found.');
      let text = `👥 *All Groups (${groups.length})*\n\n`;
      groups.forEach((g, i) => {
        text += `${i + 1}. ${g.name || g.id}\n`;
      });
      await ctx.replyText(text);
    },
  },
  join: {
    description: 'Join group via invite link',
    category: 'OWNER',
    ownerOnly: true,
    execute: async (ctx) => {
      if (!ctx.fullArgs) return await ctx.replyText('Usage: .join <invite link>');
      const match = ctx.fullArgs.match(/chat\.whatsapp\.com\/([^\s]+)/);
      if (!match) return await ctx.replyText('❌ Invalid invite link.');
      try {
        const code = match[1];
        await ctx.sock.groupAcceptInvite(code);
        await ctx.replyText('✅ Joined group successfully.');
      } catch {
        await ctx.replyText('❌ Failed to join group.');
      }
    },
  },
  leave: {
    description: 'Leave current group',
    category: 'OWNER',
    ownerOnly: true,
    groupOnly: true,
    execute: async (ctx) => {
      await ctx.replyText('👋 Leaving group...');
      try {
        await ctx.sock.groupLeave(ctx.from);
      } catch {
        await ctx.replyText('❌ Failed to leave.');
      }
    },
  },
  block: {
    description: 'Block user',
    category: 'OWNER',
    ownerOnly: true,
    execute: async (ctx) => {
      const mentioned = ctx.msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
      if (!mentioned.length) return await ctx.replyText('Usage: .block @user');
      try {
        await ctx.sock.updateBlockStatus(mentioned[0], 'block');
        await ctx.replyText(`✅ Blocked ${mentioned[0].split('@')[0]}`);
      } catch {
        await ctx.replyText('❌ Failed to block.');
      }
    },
  },
  unblock: {
    description: 'Unblock user',
    category: 'OWNER',
    ownerOnly: true,
    execute: async (ctx) => {
      const mentioned = ctx.msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
      if (!mentioned.length) return await ctx.replyText('Usage: .unblock @user');
      try {
        await ctx.sock.updateBlockStatus(mentioned[0], 'unblock');
        await ctx.replyText(`✅ Unblocked ${mentioned[0].split('@')[0]}`);
      } catch {
        await ctx.replyText('❌ Failed to unblock.');
      }
    },
  },
  setprefix: {
    description: 'Change bot prefix',
    category: 'OWNER',
    ownerOnly: true,
    execute: async (ctx) => {
      if (!ctx.fullArgs) return await ctx.replyText('Usage: .setprefix <character>');
      config.prefix = ctx.fullArgs[0];
      await ctx.replyText(`✅ Prefix changed to: ${config.prefix}`);
    },
  },
  status: {
    description: 'Show bot status',
    category: 'OWNER',
    ownerOnly: true,
    execute: async (ctx) => {
      let text = `📊 *Bot Status*\n\n`;
      text += `🤖 Name: ${config.botName}\n`;
      text += `📱 Bot Number: ${ctx.sock.user?.id?.split(':')[0] || 'N/A'}\n`;
      text += `👤 Owner: ${config.ownerNumber}\n`;
      text += `🔧 Prefix: ${config.prefix}\n`;
      text += `⏱️ Uptime: ${getUptime()}\n\n`;
      text += `*Features:*\n`;
      Object.entries(config.features).forEach(([key, val]) => {
        text += `${val ? '✅' : '❌'} ${key}\n`;
      });
      await ctx.replyText(text);
    },
  },
};
