const os = require('os');
const config = require('../../config');
const { getUptime } = require('../utils/helpers');

function secondsToDhms(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${days}d ${hours}h ${minutes}m ${secs}s`;
}

module.exports = {
    stats: {
        description: 'Show bot and server health',
        category: 'AI & TOOLS',
        execute: async(ctx) => {
            const load = os.loadavg().map((value) => value.toFixed(2));
            const memory = process.memoryUsage();
            const text = [
                '📈 *Bot & Server Stats*',
                '',
                `🤖 Bot: ${config.botName}`,
                `📱 Number: ${ctx.sock.user?.id?.split(':')[0] || 'N/A'}`,
                `⏱️ Uptime: ${getUptime()}`,
                `🧠 Memory: ${(memory.rss / 1024 / 1024).toFixed(1)} MB`,
                `🖥️ CPU Load: ${load.join(' | ')}`,
                `🌐 Host: ${process.env.HOST || '0.0.0.0'}`,
                `🚪 Port: ${process.env.PORT || 3000}`,
            ].join('\n');
            await ctx.replyText(text);
        },
    },
    botinfo: {
        description: 'Show bot details',
        category: 'AI & TOOLS',
        execute: async(ctx) => {
            const text = [
                '🤖 *Bot Information*',
                '',
                `Name: ${config.botName}`,
                `Prefix: ${config.prefix}`,
                `Owner: ${config.ownerNumber}`,
                `Status: Online`,
                `Uptime: ${getUptime()}`,
                `Smart Replies: ${config.features.smartReply ? 'On' : 'Off'}`,
            ].join('\n');
            await ctx.replyText(text);
        },
    },
    remind: {
        description: 'Set a reminder',
        category: 'AI & TOOLS',
        execute: async(ctx) => {
            if (ctx.args.length < 2) return await ctx.replyText('Usage: .remind <time> <message>');
            const [timeValue, ...messageParts] = ctx.args;
            const message = messageParts.join(' ');
            const delayMs = parseInt(timeValue, 10) * 1000;
            if (!Number.isFinite(delayMs) || delayMs <= 0) {
                return await ctx.replyText('Usage: .remind <seconds> <message>');
            }
            setTimeout(async() => {
                try {
                    await ctx.replyText(`⏰ Reminder\n\n${message}`);
                } catch (_) {}
            }, delayMs);
            await ctx.replyText(`✅ Reminder set for ${timeValue} seconds.`);
        },
    },
};