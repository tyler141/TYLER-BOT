const config = require('../../config');
const { getCommandBody, randomEmoji } = require('../utils/helpers');

async function handleAutoFeatures(sock, msg, store) {
    if (!msg.message) return;

    const from = msg.key.remoteJid;
    const isStatus = from === 'status@broadcast';

    // Auto-read
    if (config.features.autoRead && !msg.key.fromMe) {
        try {
            await sock.readMessages([msg.key]);
        } catch (_) {}
    }

    // Auto blue tick (read receipts)
    if (config.features.autoBlueTick && !msg.key.fromMe) {
        try {
            await sock.readMessages([msg.key]);
        } catch (_) {}
    }

    // Auto typing
    if (config.features.autoTyping && !msg.key.fromMe && !isStatus) {
        try {
            await sock.sendPresenceUpdate('composing', from);
        } catch (_) {}
    }

    // Auto recording
    if (config.features.autoRecording && !msg.key.fromMe && !isStatus) {
        try {
            await sock.sendPresenceUpdate('recording', from);
        } catch (_) {}
    }

    // Auto react
    if (config.features.autoReact && !msg.key.fromMe && !isStatus) {
        try {
            const text = getCommandBody(msg.message);
            if (text && text.length > 2) {
                await sock.sendMessage(from, {
                    react: { text: randomEmoji(), key: msg.key },
                });
            }
        } catch (_) {}
    }

    // Smart replies for casual greetings and thanks
    if (config.features.smartReply && !msg.key.fromMe && !isStatus) {
        try {
            const text = getCommandBody(msg.message);
            if (text && !text.startsWith(config.prefix)) {
                const lower = text.toLowerCase().trim();
                if (/^(hi|hello|hey|yo|good morning|good afternoon|good evening|hii|hiii)$/i.test(lower)) {
                    await sock.sendMessage(from, { text: `👋 Hello! I’m ${config.botName}. How can I help?` }, { quoted: msg });
                } else if (/(thank you|thanks|thx|gracias|appreciate it)/i.test(lower)) {
                    await sock.sendMessage(from, { text: `😊 You’re welcome! I’m always here to help.` }, { quoted: msg });
                }
            }
        } catch (_) {}
    }

    // Auto status view & like
    if (isStatus) {
        if (config.features.autoStatusView) {
            try {
                await sock.readMessages([msg.key]);
            } catch (_) {}
        }

        if (config.features.autoStatusLike) {
            try {
                const sender = msg.key.participant || msg.key.remoteJid;
                await sock.sendMessage(
                    'status@broadcast', { react: { text: '❤️', key: msg.key } }, { statusJidList: [sender] }
                );
            } catch (_) {}
        }
    }
}

module.exports = { handleAutoFeatures };