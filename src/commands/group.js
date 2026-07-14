const { formatJidToNumber } = require('../utils/helpers');

module.exports = {
  grouplink: {
    description: 'Get group invite link',
    category: 'GROUP',
    groupOnly: true,
    execute: async (ctx) => {
      try {
        const code = await ctx.sock.groupInviteCode(ctx.from);
        await ctx.replyText(`👥 *Group Invite Link*\n\nhttps://chat.whatsapp.com/${code}`);
      } catch {
        await ctx.replyText('❌ Failed to get invite link. Make sure bot is admin.');
      }
    },
  },
  revoke: {
    description: 'Revoke group invite link',
    category: 'GROUP',
    groupOnly: true,
    ownerOnly: true,
    execute: async (ctx) => {
      try {
        await ctx.sock.groupRevokeInvite(ctx.from);
        await ctx.replyText('✅ Group invite link revoked successfully.');
      } catch {
        await ctx.replyText('❌ Failed to revoke link. Bot must be admin.');
      }
    },
  },
  kick: {
    description: 'Kick member from group',
    category: 'GROUP',
    groupOnly: true,
    ownerOnly: true,
    execute: async (ctx) => {
      const mentioned = ctx.msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
      if (!mentioned.length) return await ctx.replyText('Usage: .kick @user');
      try {
        await ctx.sock.groupParticipantsUpdate(ctx.from, mentioned, 'remove');
        await ctx.replyText(`✅ Kicked ${mentioned.length} member(s).`);
      } catch {
        await ctx.replyText('❌ Failed to kick. Bot must be admin.');
      }
    },
  },
  add: {
    description: 'Add member to group',
    category: 'GROUP',
    groupOnly: true,
    ownerOnly: true,
    execute: async (ctx) => {
      if (!ctx.fullArgs) return await ctx.replyText('Usage: .add <number>');
      const number = ctx.fullArgs.replace(/[^0-9]/g, '');
      const jid = `${number}@s.whatsapp.net`;
      try {
        await ctx.sock.groupParticipantsUpdate(ctx.from, [jid], 'add');
        await ctx.replyText(`✅ Added ${number} to the group.`);
      } catch {
        await ctx.replyText('❌ Failed to add. Number may have privacy settings on.');
      }
    },
  },
  promote: {
    description: 'Promote to admin',
    category: 'GROUP',
    groupOnly: true,
    ownerOnly: true,
    execute: async (ctx) => {
      const mentioned = ctx.msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
      if (!mentioned.length) return await ctx.replyText('Usage: .promote @user');
      try {
        await ctx.sock.groupParticipantsUpdate(ctx.from, mentioned, 'promote');
        await ctx.replyText('✅ Promoted to admin.');
      } catch {
        await ctx.replyText('❌ Failed. Bot must be admin.');
      }
    },
  },
  demote: {
    description: 'Demote admin',
    category: 'GROUP',
    groupOnly: true,
    ownerOnly: true,
    execute: async (ctx) => {
      const mentioned = ctx.msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
      if (!mentioned.length) return await ctx.replyText('Usage: .demote @user');
      try {
        await ctx.sock.groupParticipantsUpdate(ctx.from, mentioned, 'demote');
        await ctx.replyText('✅ Demoted from admin.');
      } catch {
        await ctx.replyText('❌ Failed. Bot must be admin.');
      }
    },
  },
  tagall: {
    description: 'Tag all group members',
    category: 'GROUP',
    groupOnly: true,
    ownerOnly: true,
    execute: async (ctx) => {
      try {
        const meta = await ctx.sock.groupMetadata(ctx.from);
        const participants = meta.participants.map((p) => p.id);
        let text = `👥 *Tag All*\n\n`;
        text += `Total Members: ${participants.length}\n\n`;
        text += participants.map((p, i) => `${i + 1}. @${formatJidToNumber(p)}`).join('\n');
        await ctx.replyMention(text, participants);
      } catch {
        await ctx.replyText('❌ Failed to tag all.');
      }
    },
  },
  hidetag: {
    description: 'Hidden tag all members',
    category: 'GROUP',
    groupOnly: true,
    ownerOnly: true,
    execute: async (ctx) => {
      if (!ctx.fullArgs) return await ctx.replyText('Usage: .hidetag <message>');
      try {
        const meta = await ctx.sock.groupMetadata(ctx.from);
        const participants = meta.participants.map((p) => p.id);
        await ctx.sock.sendMessage(
          ctx.from,
          { text: ctx.fullArgs, mentions: participants },
          { quoted: ctx.msg }
        );
      } catch {
        await ctx.replyText('❌ Failed to hidetag.');
      }
    },
  },
  groupinfo: {
    description: 'Show group information',
    category: 'GROUP',
    groupOnly: true,
    execute: async (ctx) => {
      try {
        const meta = await ctx.sock.groupMetadata(ctx.from);
        let text = `👥 *Group Information*\n\n`;
        text += `📛 Name: ${meta.subject}\n`;
        text += `🆔 ID: ${meta.id}\n`;
        text += `👥 Members: ${meta.participants.length}\n`;
        text += `👑 Owner: ${meta.owner ? formatJidToNumber(meta.owner) : 'Unknown'}\n`;
        text += `📅 Created: ${new Date(meta.creation * 1000).toLocaleDateString()}\n`;
        text += `📝 Desc: ${meta.desc || 'No description'}\n`;
        await ctx.replyText(text);
      } catch {
        await ctx.replyText('❌ Failed to get group info.');
      }
    },
  },
  setgcpp: {
    description: 'Set group icon',
    category: 'GROUP',
    groupOnly: true,
    ownerOnly: true,
    execute: async (ctx) => {
      if (!ctx.msg.message?.imageMessage) {
        return await ctx.replyText('Usage: Send/reply an image with .setpp');
      }
      try {
        const { downloadMedia } = require('../utils/helpers');
        const media = await downloadMedia(ctx.msg.message, ctx.sock);
        if (!media) return await ctx.replyText('❌ No image found.');
        await ctx.sock.updateProfilePicture(ctx.from, media.buffer);
        await ctx.replyText('✅ Group icon updated.');
      } catch {
        await ctx.replyText('❌ Failed to update icon.');
      }
    },
  },
  setgcname: {
    description: 'Set group name',
    category: 'GROUP',
    groupOnly: true,
    ownerOnly: true,
    execute: async (ctx) => {
      if (!ctx.fullArgs) return await ctx.replyText('Usage: .setname <new name>');
      try {
        await ctx.sock.groupUpdateSubject(ctx.from, ctx.fullArgs);
        await ctx.replyText('✅ Group name updated.');
      } catch {
        await ctx.replyText('❌ Failed. Bot must be admin.');
      }
    },
  },
  setdesc: {
    description: 'Set group description',
    category: 'GROUP',
    groupOnly: true,
    ownerOnly: true,
    execute: async (ctx) => {
      if (!ctx.fullArgs) return await ctx.replyText('Usage: .setdesc <description>');
      try {
        await ctx.sock.groupUpdateDescription(ctx.from, ctx.fullArgs);
        await ctx.replyText('✅ Group description updated.');
      } catch {
        await ctx.replyText('❌ Failed. Bot must be admin.');
      }
    },
  },
  mute: {
    description: 'Close group (admins only)',
    category: 'GROUP',
    groupOnly: true,
    ownerOnly: true,
    execute: async (ctx) => {
      try {
        await ctx.sock.groupSettingUpdate(ctx.from, 'announcement');
        await ctx.replyText('✅ Group closed. Only admins can send messages.');
      } catch {
        await ctx.replyText('❌ Failed. Bot must be admin.');
      }
    },
  },
  unmute: {
    description: 'Open group',
    category: 'GROUP',
    groupOnly: true,
    ownerOnly: true,
    execute: async (ctx) => {
      try {
        await ctx.sock.groupSettingUpdate(ctx.from, 'not_announcement');
        await ctx.replyText('✅ Group opened. All members can send messages.');
      } catch {
        await ctx.replyText('❌ Failed. Bot must be admin.');
      }
    },
  },
  lockgc: {
    description: 'Lock group settings',
    category: 'GROUP',
    groupOnly: true,
    ownerOnly: true,
    execute: async (ctx) => {
      try {
        await ctx.sock.groupSettingUpdate(ctx.from, 'locked');
        await ctx.replyText('✅ Group settings locked.');
      } catch {
        await ctx.replyText('❌ Failed. Bot must be admin.');
      }
    },
  },
  infouser: {
    description: 'Show user info',
    category: 'GROUP',
    groupOnly: true,
    execute: async (ctx) => {
      const mentioned = ctx.msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
      const target = mentioned[0] || ctx.sender;
      try {
        const info = await ctx.sock.fetchBusinessProfile(target);
        let text = `👤 *User Information*\n\n`;
        text += `🆔 JID: ${target}\n`;
        text += `📱 Number: ${formatJidToNumber(target)}\n`;
        if (info) {
          text += `🏢 Business: ${info.name || 'N/A'}\n`;
          text += `📧 Email: ${info.email || 'N/A'}\n`;
        }
        await ctx.replyText(text);
      } catch {
        await ctx.replyText(`👤 Number: ${formatJidToNumber(target)}`);
      }
    },
  },
};
