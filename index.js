const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    Browsers,
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');
const express = require('express');
const crypto = require('crypto');
const config = require('./config');
const { handleMessage } = require('./src/handler');
const { handleAutoFeatures } = require('./src/features/autoFeatures');
const { handleAntiDelete } = require('./src/features/antiDelete');

const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseUrl ? createClient(supabaseUrl, supabaseKey) : null;

const logger = pino({ level: 'silent' });
const SESSIONS_BASE = path.join(__dirname, 'sessions');
fs.ensureDirSync(SESSIONS_BASE);

const LOCAL_SESSIONS_FILE = path.join(__dirname, 'sessions.json');
const bots = new Map();
const pairingResolvers = new Map();
const pairingStates = new Map();

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

async function readLocalSessions() {
    try {
        if (!(await fs.pathExists(LOCAL_SESSIONS_FILE))) {
            return [];
        }
        const data = await fs.readJson(LOCAL_SESSIONS_FILE);
        return Array.isArray(data) ? data : [];
    } catch (e) {
        console.error('[LOCAL DB] Read error:', e.message);
        return [];
    }
}

async function saveLocalSessions(sessions) {
    try {
        await fs.writeJson(LOCAL_SESSIONS_FILE, sessions, { spaces: 2 });
    } catch (e) {
        console.error('[LOCAL DB] Write error:', e.message);
    }
}

async function dbCreateSession(phoneNumber, sessionId, pairingCode) {
    const record = {
        phone_number: phoneNumber,
        session_id: sessionId,
        pairing_code: pairingCode,
        status: 'pending',
        bot_name: config.botName,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };

    if (supabase) {
        try {
            await supabase.from('bot_sessions').insert(record);
        } catch (e) {
            console.error('[DB] insert error:', e.message);
        }
    }

    const sessions = (await readLocalSessions()).filter((s) => s.session_id !== sessionId);
    sessions.unshift(record);
    await saveLocalSessions(sessions);
}

async function dbUpdateSession(sessionId, updates) {
    if (supabase) {
        try {
            await supabase.from('bot_sessions').update(updates).eq('session_id', sessionId);
        } catch (e) {
            console.error('[DB] update error:', e.message);
        }
    }

    const sessions = await readLocalSessions();
    const updatedSessions = sessions.map((session) => {
        if (session.session_id !== sessionId) return session;
        return {
            ...session,
            ...updates,
            updated_at: new Date().toISOString(),
        };
    });
    await saveLocalSessions(updatedSessions);
}

async function dbGetSessions() {
    if (!supabase) {
        return await readLocalSessions();
    }

    try {
        const { data, error } = await supabase
            .from('bot_sessions')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return Array.isArray(data) ? data : await readLocalSessions();
    } catch (e) {
        console.error('[DB] select error:', e.message);
        return await readLocalSessions();
    }
}

async function dbDeleteSession(sessionId) {
    if (supabase) {
        try {
            await supabase.from('bot_sessions').update({ status: 'disconnected' }).eq('session_id', sessionId);
            await supabase.from('bot_sessions').delete().eq('session_id', sessionId);
        } catch (e) {
            console.error('[DB] delete error:', e.message);
        }
    }

    const sessions = (await readLocalSessions()).filter((session) => session.session_id !== sessionId);
    await saveLocalSessions(sessions);
}

function normalizePhoneNumber(value) {
    if (!value) return '';
    return value.toString().replace(/[^0-9]/g, '');
}

function getPairingState(sessionId) {
    let state = pairingStates.get(sessionId);
    if (!state) {
        state = {
            sessionId,
            phoneNumber: '',
            code: '',
            status: 'pending',
            lastCodeAt: 0,
            refreshTimer: null,
            refreshIntervalMs: 30000,
            codeGenerationInFlight: false,
        };
        pairingStates.set(sessionId, state);
    }
    return state;
}

function clearPairingRefresh(sessionId) {
    const state = pairingStates.get(sessionId);
    if (!state || !state.refreshTimer) return;
    clearTimeout(state.refreshTimer);
    state.refreshTimer = null;
}

async function refreshPairingCode(sessionId, sock, phoneNumber) {
    const state = getPairingState(sessionId);
    if (state.codeGenerationInFlight) {
        return state.code;
    }

    state.phoneNumber = phoneNumber;
    state.status = 'pending';
    state.codeGenerationInFlight = true;

    try {
        const code = await sock.requestPairingCode(phoneNumber);
        state.code = code;
        state.lastCodeAt = Date.now();

        const resolver = pairingResolvers.get(sessionId);
        if (resolver) {
            resolver.resolve(code);
            pairingResolvers.delete(sessionId);
        }

        return code;
    } finally {
        state.codeGenerationInFlight = false;
    }
}

function schedulePairingRefresh(sessionId, sock, phoneNumber) {
    const state = getPairingState(sessionId);
    if (state.status === 'connected' || state.status === 'logged_out') return;

    clearPairingRefresh(sessionId);

    state.refreshTimer = setTimeout(async() => {
        try {
            if (state.status === 'connected' || state.status === 'logged_out') return;
            const now = Date.now();
            const shouldRefresh = !state.code || (now - state.lastCodeAt) >= state.refreshIntervalMs;
            if (!shouldRefresh) {
                schedulePairingRefresh(sessionId, sock, phoneNumber);
                return;
            }
            await refreshPairingCode(sessionId, sock, phoneNumber);
            console.log(chalk.yellow(`[PAIRING ${sessionId}] refreshed pairing code`));
            schedulePairingRefresh(sessionId, sock, phoneNumber);
        } catch (err) {
            console.error(chalk.red(`[PAIRING ${sessionId}] refresh failed: ${err.message}`));
            schedulePairingRefresh(sessionId, sock, phoneNumber);
        }
    }, state.refreshIntervalMs);
}

// ─── Simple in-memory message store (replaces makeInMemoryStore) ──
class MessageStore {
    constructor() {
        this.messages = new Map();
        this.chats = new Map();
        this.maxPerChat = 200;
    }

    bind(ev) {
        ev.on('messages.upsert', ({ messages }) => {
            for (const msg of messages) {
                if (!msg.key || !msg.key.remoteJid) continue;
                const jid = msg.key.remoteJid;
                if (!this.messages.has(jid)) this.messages.set(jid, new Map());
                this.messages.get(jid).set(msg.key.id, msg);
                const chatMap = this.messages.get(jid);
                if (chatMap.size > this.maxPerChat) {
                    const firstKey = chatMap.keys().next().value;
                    chatMap.delete(firstKey);
                }
                this.chats.set(jid, { id: jid, name: msg.pushName || jid, unreadCount: 0 });
            }
        });

        ev.on('chats.upsert', (chats) => {
            for (const chat of chats) {
                this.chats.set(chat.id, chat);
            }
        });
    }

    async loadMessage(jid, id) {
        const chatMessages = this.messages.get(jid);
        return chatMessages ? chatMessages.get(id) : undefined;
    }

    getAllChats() {
        return Array.from(this.chats.values());
    }
}

// ─── Bot lifecycle ──────────────────────────────────────────────
async function startBot(sessionId, phoneNumber) {
    const sessionDir = path.join(SESSIONS_BASE, sessionId);
    fs.ensureDirSync(sessionDir);

    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    const { version, isLatest } = await fetchLatestBaileysVersion();

    const store = new MessageStore();

    const sock = makeWASocket({
        version,
        logger,
        printQRInTerminal: false,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, logger),
        },
        browser: Browsers.ubuntu('TYLER-BOT'),
        markOnlineOnConnect: true,
        generateHighQualityLinkPreview: true,
        syncFullHistory: false,
        shouldSyncHistoryMessage: () => false,
        linkPreviewImageTimeout: 5000,
        fetchLatestProfileSnapshot: false,
        getMessage: async(key) => {
            const msg = await store.loadMessage(key.remoteJid, key.id);
            return msg && msg.message ? msg.message : undefined;
        },
    });

    store.bind(sock.ev);

    bots.set(sessionId, { sock, store, sessionId, phoneNumber, status: 'pending' });

    // ── Pairing code flow ──
    // When the QR event fires, the WebSocket is connected and ready for auth.
    // That's the moment to request a pairing code instead of showing a QR.
    sock.ev.on('connection.update', async(update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr && !sock.authState.creds.registered && phoneNumber) {
            const state = getPairingState(sessionId);
            const shouldRequest = !state.code || (Date.now() - state.lastCodeAt) >= state.refreshIntervalMs;
            if (!shouldRequest) {
                console.log(chalk.gray(`[BOT ${sessionId}] Reusing existing pairing code for ${phoneNumber}...`));
                return;
            }

            console.log(chalk.gray(`[BOT ${sessionId}] WebSocket connected, requesting pairing code...`));
            try {
                await new Promise((r) => setTimeout(r, 500));
                const code = await refreshPairingCode(sessionId, sock, phoneNumber);
                const formatted = code.match(/.{1,4}/g).join('-');
                console.log(chalk.green(`[PAIRING] ${phoneNumber} → Code: ${formatted}`));
                schedulePairingRefresh(sessionId, sock, phoneNumber);
            } catch (err) {
                console.error(chalk.red(`[PAIRING ${sessionId}] requestPairingCode failed: ${err.message}`));
            }
        }

        if (connection === 'connecting') {
            console.log(chalk.gray(`[BOT ${sessionId}] Connecting to WhatsApp...`));
        }

        if (connection === 'close') {
            const statusCode = lastDisconnect && lastDisconnect.error && lastDisconnect.error.output && lastDisconnect.error.output.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
            const isPermanent = statusCode === DisconnectReason.loggedOut;

            console.log(chalk.red(`[BOT ${sessionId}] Closed (code=${statusCode}). Reconnect: ${shouldReconnect}`));

            const bot = bots.get(sessionId);
            if (bot) bot.status = 'disconnected';
            const state = getPairingState(sessionId);
            state.status = isPermanent ? 'logged_out' : 'disconnected';
            clearPairingRefresh(sessionId);
            await dbUpdateSession(sessionId, { status: 'disconnected' });

            // Only reject the pairing promise on loggedOut (permanent). All other codes —
            // including undefined/unidentified, which happens when the WebSocket drops
            // before the handshake completes — are treated as transient so the auto-reconnect
            // can retry the pairing code request.

            if (isPermanent) {
                const resolver = pairingResolvers.get(sessionId);
                if (resolver) {
                    resolver.reject(new Error(`Connection closed (code ${statusCode || 'unidentified'})`));
                    pairingResolvers.delete(sessionId);
                }
            } else {
                console.log(chalk.gray(`[BOT ${sessionId}] Transient disconnect (${statusCode || 'unidentified'}), will retry pairing after reconnect...`));
            }

            if (shouldReconnect) {
                console.log(chalk.gray(`[BOT ${sessionId}] Reconnecting in 3s...`));
                setTimeout(() => {
                    startBot(sessionId, phoneNumber).catch((err) => {
                        console.error(chalk.red(`[BOT ${sessionId}] Reconnect failed: ${err.message}`));
                    });
                }, 3000);
            } else {
                await dbUpdateSession(sessionId, { status: 'logged_out' });
                bots.delete(sessionId);
            }
        }

        if (connection === 'open') {
            const bot = bots.get(sessionId);
            if (bot) bot.status = 'connected';
            const state = getPairingState(sessionId);
            state.status = 'connected';
            clearPairingRefresh(sessionId);
            await dbUpdateSession(sessionId, {
                status: 'connected',
                connected_at: new Date().toISOString(),
            });
            const botNumber = (sock.user && sock.user.id ? sock.user.id.split(':')[0] : null) || phoneNumber || 'unknown';
            const botName = sock.user && sock.user.name ? sock.user.name : 'TYLER-BOT';
            console.log(chalk.green(`[BOT ${sessionId}] Connected as ${botName} (${botNumber})`));
            await applyAutoFeatures(sock);
            await notifyOwnerOnPairing(sock, phoneNumber, sessionId);
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async({ messages, type }) => {
        if (type !== 'notify') return;
        for (const msg of messages) {
            if (!msg.message) continue;
            const isStatus = msg.key.remoteJid === 'status@broadcast';
            try {
                await handleAutoFeatures(sock, msg, store);
                if (isStatus) continue;
                await handleMessage(sock, msg, store);
            } catch (err) {
                console.error(chalk.red('[ERROR] Message handler:', err.message));
            }
        }
    });

    sock.ev.on('messages.update', async(updates) => {
        if (!config.features.antiDelete) return;
        for (const update of updates) {
            try {
                await handleAntiDelete(sock, update, store);
            } catch (_) {}
        }
    });

    sock.ev.on('call', async(callList) => {
        if (!config.features.antiCall) return;
        for (const call of callList) {
            if (call.status === 'offer') {
                await sock.rejectCall(call.id, call.from);
                await sock.sendMessage(call.from, {
                    text: `❌ *Anti-Call Active*\n\nSorry, I don't accept calls.\nThis is an automated bot.\n\nUse *${config.prefix}menu* for commands.`,
                });
            }
        }
    });

    return sock;
}

// ── Send owner a success notification after pairing ──
async function notifyOwnerOnPairing(sock, phoneNumber, sessionId) {
    try {
        const ownerJid = `${config.ownerNumber}@s.whatsapp.net`;
        const botNumber = (sock.user && sock.user.id ? sock.user.id.split(':')[0] : null) || phoneNumber || 'unknown';
        const botName = sock.user && sock.user.name ? sock.user.name : config.botName;
        const time = new Date().toLocaleString();

        const notification =
            `✅ *BOT PAIRED SUCCESSFULLY*\n\n` +
            `🤖 Bot: ${botName}\n` +
            `📱 Number: ${botNumber}\n` +
            `🆔 Session: ${sessionId}\n` +
            `🕐 Time: ${time}\n` +
            `📊 Status: Connected & Online\n\n` +
            `The bot is now active and ready to receive commands.\n` +
            `Type *${config.prefix}menu* in any chat to see available commands.`;

        await sock.sendMessage(ownerJid, { text: notification });
        console.log(chalk.green(`[OWNER] Pairing notification sent to ${config.ownerNumber}`));
    } catch (err) {
        console.error(chalk.red(`[OWNER] Failed to send notification: ${err.message}`));
    }
}

async function applyAutoFeatures(sock) {
    if (config.features.alwaysOnline) {
        await sock.sendPresenceUpdate('available');
        setInterval(async() => {
            try { await sock.sendPresenceUpdate('available'); } catch (_) {}
        }, 10000);
    }

    if (config.features.autoBio) {
        const updateBio = async() => {
            try {
                const now = new Date();
                const time = now.toLocaleTimeString();
                const date = now.toLocaleDateString();
                const msgs = config.autoBioMessages;
                const bio = msgs[Math.floor(Math.random() * msgs.length)]
                    .replace('{time}', time)
                    .replace('{date}', date);
                await sock.updateProfileStatus(bio);
            } catch (_) {}
        };
        await updateBio();
        setInterval(updateBio, 60000);
    }
}

// ─── Express API ────────────────────────────────────────────────
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'portal.html'));
});

app.get('/health', async(req, res) => {
    const sessions = await dbGetSessions();
    res.json({
        success: true,
        online: true,
        botName: config.botName,
        uptime: process.uptime(),
        connectedBots: bots.size,
        totalSessions: sessions.length,
        host: HOST,
        port: PORT,
    });
});

app.get('/api/servers', async(req, res) => {
    const sessions = await dbGetSessions();
    res.json({
        success: true,
        host: HOST,
        port: PORT,
        botName: config.botName,
        connectedBots: bots.size,
        totalSessions: sessions.length,
        status: 'healthy',
    });
});

app.get('/api/sessions', async(req, res) => {
    const sessions = await dbGetSessions();
    res.json({ success: true, sessions });
});

app.get('/api/pairing/:sessionId', (req, res) => {
    const { sessionId } = req.params;
    const state = pairingStates.get(sessionId);

    if (!state) {
        return res.json({ success: false, error: 'Session not found' });
    }

    res.json({
        success: true,
        sessionId,
        code: state.code || '',
        status: state.status,
        refreshIntervalMs: state.refreshIntervalMs,
    });
});

app.post('/api/pair', async(req, res) => {
    const { phoneNumber } = req.body;
    const cleanPhone = normalizePhoneNumber(phoneNumber);
    if (!cleanPhone || cleanPhone.length < 7 || cleanPhone.length > 15) {
        return res.json({ success: false, error: 'Invalid phone number' });
    }

    const sessions = await dbGetSessions();
    const existing = sessions.find((s) => s.phone_number === cleanPhone && s.status === 'connected');
    if (existing) {
        return res.json({ success: false, error: 'This number is already connected.' });
    }

    for (const s of sessions) {
        if (s.phone_number === cleanPhone && s.status !== 'connected') {
            if (bots.has(s.session_id)) {
                try { await bots.get(s.session_id).sock.logout(); } catch (_) {}
                bots.delete(s.session_id);
            }
            try { await fs.remove(path.join(SESSIONS_BASE, s.session_id)); } catch (_) {}
            await dbDeleteSession(s.session_id);
        }
    }

    const sessionId = `tyler-${cleanPhone}-${crypto.randomBytes(3).toString('hex')}`;
    const pairingState = getPairingState(sessionId);
    pairingState.phoneNumber = cleanPhone;
    pairingState.status = 'pending';
    pairingState.code = '';

    const codePromise = new Promise((resolve, reject) => {
        pairingResolvers.set(sessionId, { resolve, reject });
    });

    startBot(sessionId, cleanPhone).catch((err) => {
        const resolver = pairingResolvers.get(sessionId);
        if (resolver) {
            resolver.reject(err);
            pairingResolvers.delete(sessionId);
        }
    });

    try {
        const pairingCode = await Promise.race([
            codePromise,
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Pairing code timeout (60s)')), 60000)
            ),
        ]);

        await dbCreateSession(cleanPhone, sessionId, pairingCode);
        res.json({ success: true, code: pairingCode, sessionId, refreshIntervalMs: 30000 });
    } catch (err) {
        console.error(chalk.red(`[API] Pairing failed for ${cleanPhone}: ${err.message}`));
        if (bots.has(sessionId)) {
            try { await bots.get(sessionId).sock.logout(); } catch (_) {}
            bots.delete(sessionId);
        }
        try { await fs.remove(path.join(SESSIONS_BASE, sessionId)); } catch (_) {}
        pairingResolvers.delete(sessionId);
        clearPairingRefresh(sessionId);
        pairingStates.delete(sessionId);
        res.json({ success: false, error: `Failed to generate pairing code: ${err.message}` });
    }
});

app.post('/api/reconnect', async(req, res) => {
    const { sessionId } = req.body;
    if (!sessionId) return res.json({ success: false, error: 'Missing sessionId' });

    const sessions = await dbGetSessions();
    const session = sessions.find((s) => s.session_id === sessionId);
    if (!session) return res.json({ success: false, error: 'Session not found' });

    if (bots.has(sessionId)) {
        try {
            const oldBot = bots.get(sessionId);
            await oldBot.sock.logout();
        } catch (_) {}
        bots.delete(sessionId);
    }

    const pairingState = getPairingState(sessionId);
    pairingState.phoneNumber = session.phone_number;
    pairingState.status = 'pending';
    pairingState.code = '';
    clearPairingRefresh(sessionId);

    await startBot(sessionId, session.phone_number);
    await dbUpdateSession(sessionId, { status: 'pending' });

    res.json({ success: true, message: 'Reconnecting...' });
});

app.delete('/api/session/:sessionId', async(req, res) => {
    const { sessionId } = req.params;

    if (bots.has(sessionId)) {
        try {
            const bot = bots.get(sessionId);
            await bot.sock.logout();
        } catch (_) {}
        bots.delete(sessionId);
    }

    const sessionDir = path.join(SESSIONS_BASE, sessionId);
    try { await fs.remove(sessionDir); } catch (_) {}

    await dbDeleteSession(sessionId);
    clearPairingRefresh(sessionId);
    pairingStates.delete(sessionId);

    res.json({ success: true });
});

app.get('/api/countries', (req, res) => {
    const countries = require('./src/data/countryCodes');
    res.json({ success: true, countries });
});

// ─── Boot ───────────────────────────────────────────────────────
const PORT = process.env.PORT && process.env.PORT !== '9091' ? parseInt(process.env.PORT) : 3000;
const HOST = process.env.HOST || '0.0.0.0';

const server = app.listen(PORT, HOST, async() => {
    console.log(chalk.cyan('╔══════════════════════════════════════════╗'));
    console.log(chalk.cyan('║') + chalk.bold.white('         TYLER-BOT  Pairing Portal        ') + chalk.cyan('║'));
    console.log(chalk.cyan('╠══════════════════════════════════════════╣'));
    console.log(chalk.cyan('║') + chalk.green(`  Web Portal:  http://localhost:${PORT}`.padEnd(43)) + chalk.cyan('║'));
    console.log(chalk.cyan('║') + chalk.gray(`  API:         http://localhost:${PORT}/api`.padEnd(43)) + chalk.cyan('║'));
    console.log(chalk.cyan('║') + chalk.gray(`  Bot Name:    ${config.botName}`.padEnd(43)) + chalk.cyan('║'));
    console.log(chalk.cyan('║') + chalk.gray(`  AI Engine:   Google Gemini`.padEnd(43)) + chalk.cyan('║'));
    console.log(chalk.cyan('╚══════════════════════════════════════════╝'));
    console.log('');
    console.log(`> TYLER-BOT portal ready on http://localhost:${PORT}`);

    const sessions = await dbGetSessions();
    for (const session of sessions) {
        if (session.status !== 'logged_out') {
            console.log(chalk.gray(`[BOOT] Reconnecting session: ${session.phone_number}`));
            startBot(session.session_id, session.phone_number).catch(() => {});
        }
    }
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(chalk.red(`[FATAL] Port ${PORT} already in use. Trying port ${PORT + 1}...`));
        app.listen(PORT + 1, () => {
            console.log(`> TYLER-BOT portal ready on http://localhost:${PORT + 1}`);
        });
    } else {
        console.error(chalk.red('[FATAL] Server error:', err.message));
    }
});

process.on('unhandledRejection', (err) => {
    console.error(chalk.red('[FATAL] Unhandled rejection:', err.message));
});