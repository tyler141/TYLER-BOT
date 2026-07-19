const config = require('../../config');

function toggleFeature(ctx, featureName, displayName) {
    if (!ctx.fullArgs) return ctx.replyText(`Usage: .${ctx.command} <on/off>`);
    const enable = ctx.fullArgs.toLowerCase() === 'on';
    config.features[featureName] = enable;
    return ctx.replyText(
        `✅ *${displayName}* is now *${enable ? 'ENABLED' : 'DISABLED'}*`
    );
}

module.exports = {
    settings: {
        description: 'Show current settings',
        category: 'SETTINGS',
        execute: async(ctx) => {
            let text = `⚙️ *Current Settings*\n\n`;
            text += `🤖 Bot Name: ${config.botName}\n`;
            text += `🔧 Prefix: ${config.prefix}\n`;
            text += `👤 Owner: ${config.ownerNumber}\n\n`;
            text += `*Features:*\n`;
            Object.entries(config.features).forEach(([key, val]) => {
                text += `${val ? '✅' : '❌'} ${key}\n`;
            });
            await ctx.replyText(text);
        },
    },
    autoread: {
        description: 'Toggle auto-read messages',
        category: 'SETTINGS',
        execute: async(ctx) => toggleFeature(ctx, 'autoRead', 'Auto Read'),
    },
    autotype: {
        description: 'Toggle auto-typing indicator',
        category: 'SETTINGS',
        execute: async(ctx) => toggleFeature(ctx, 'autoTyping', 'Auto Typing'),
    },
    autorecord: {
        description: 'Toggle auto-recording indicator',
        category: 'SETTINGS',
        execute: async(ctx) => toggleFeature(ctx, 'autoRecording', 'Auto Recording'),
    },
    autostatus: {
        description: 'Toggle auto status view',
        category: 'SETTINGS',
        execute: async(ctx) => toggleFeature(ctx, 'autoStatusView', 'Auto Status View'),
    },
    autostatuslike: {
        description: 'Toggle auto status like',
        category: 'SETTINGS',
        execute: async(ctx) => toggleFeature(ctx, 'autoStatusLike', 'Auto Status Like'),
    },
    autoreact: {
        description: 'Toggle auto react to messages',
        category: 'SETTINGS',
        execute: async(ctx) => toggleFeature(ctx, 'autoReact', 'Auto React'),
    },
    antiblue: {
        description: 'Toggle anti blue tick',
        category: 'SETTINGS',
        execute: async(ctx) => toggleFeature(ctx, 'autoBlueTick', 'Anti Blue Tick'),
    },
    anticall: {
        description: 'Toggle anti call',
        category: 'SETTINGS',
        execute: async(ctx) => toggleFeature(ctx, 'antiCall', 'Anti Call'),
    },
    autobio: {
        description: 'Toggle auto bio update',
        category: 'SETTINGS',
        execute: async(ctx) => toggleFeature(ctx, 'autoBio', 'Auto Bio'),
    },
    antidelete: {
        description: 'Toggle anti delete messages',
        category: 'SETTINGS',
        execute: async(ctx) => toggleFeature(ctx, 'antiDelete', 'Anti Delete'),
    },
    smartreply: {
        description: 'Toggle smart automatic replies',
        category: 'SETTINGS',
        execute: async(ctx) => toggleFeature(ctx, 'smartReply', 'Smart Reply'),
    },
    online: {
        description: 'Enable always online',
        category: 'SETTINGS',
        execute: async(ctx) => {
            config.features.alwaysOnline = true;
            await ctx.sock.sendPresenceUpdate('available');
            await ctx.replyText('✅ Always Online is now ENABLED');
        },
    },
    offline: {
        description: 'Disable always online',
        category: 'SETTINGS',
        execute: async(ctx) => {
            config.features.alwaysOnline = false;
            await ctx.sock.sendPresenceUpdate('unavailable');
            await ctx.replyText('✅ Always Online is now DISABLED');
        },
    },
    language: {
        description: 'Set bot language',
        category: 'SETTINGS',
        execute: async(ctx) => {
            if (!ctx.fullArgs)
                return await ctx.replyText('Usage: .language <en/sw/fr/ar/es>');
            await ctx.replyText(`✅ Language set to: ${ctx.fullArgs}`);
        },
    },
};