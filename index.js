/*
   * Dandy
   * DO NOT FOR SALE!
   * Github: github.com/DanzzAraAra
*/
const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    makeInMemoryStore
} = require('baileys');
const pino = require('pino');
const readline = require('readline');
const chalk = require('chalk');

const { loadPlugins, watchPlugins } = require('./system/loadPlugins');
const { handleMsg } = require('./system/handler');
const { handleParticipants } = require('./system/participants');
const { auto, autoAdmin } = require('./system/auto');
const { handleCall } = require('./system/anti');
const { logMessage } = require('./src/logger');
const { serialize } = require('./src/serialize');
const { connectDB } = require('./src/database');

global.settings = require('./settings');

process.on('uncaughtException', (err) => console.error(chalk.red('[Uncaught Exception]'), err));
process.on('unhandledRejection', (reason, promise) => console.error(chalk.red('[Unhandled Rejection] at:'), promise, 'reason:', reason));

const store = makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) });

const question = (text) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise((resolve) => rl.question(text, (answer) => {
        rl.close();
        resolve(answer);
    }));
};

const runBot = async () => {
    await connectDB(global.settings.mongoUrl);

    loadPlugins();
    watchPlugins();

    const { state, saveCreds } = await useMultiFileAuthState('session');
    const { version } = await fetchLatestBaileysVersion();
    
    let useCode = false;
    if (!state.creds.registered) {
        const choice = await question(chalk.cyan('\nMetode Login:\n1. QR Code\n2. Pairing Code\nPilih (1/2): '));
        useCode = choice.trim() === '2';
    }

    const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: !useCode,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'fatal' })),
        },
        browser: ['Ubuntu', 'Chrome', '20.0.04'],
        syncFullHistory: false,
        generateHighQualityLinkPreview: true,
        getMessage: async (key) => {
            if (store) {
                const msg = await store.loadMessage(key.remoteJid, key.id);
                return msg?.message || undefined;
            }
            return undefined;
        }
    });

    store.bind(sock.ev);
    
    if (useCode && !sock.authState.creds.registered) {
        setTimeout(async () => {
            const phone = await question(chalk.yellow('\nMasukkan nomor WA:\n> '));
            const code = await sock.requestPairingCode(phone.trim());
            console.log(chalk.greenBright(`\n🔑 KODE PAIRING: ${code}\n`));
        }, 2000);
    }
    
    sock.ev.on('creds.update', saveCreds);
    
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log(chalk.red(`[!] Koneksi terputus. Otomatis menghubungkan ulang: ${shouldReconnect}`));
            
            if (shouldReconnect) {
                runBot();
            } else {
                console.log(chalk.redBright('[!] Sesi telah keluar. Silakan hapus folder "session"'));
                process.exit();
            }
        } else if (connection === 'open') {
            console.log(chalk.greenBright(`\n[+] ${global.settings.botName} berhasil terhubung ke WhatsApp!\n`));
        }
    });

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;
        
        const msg = messages[0];
        if (!msg.message) return;
        
        auto(sock, msg);
        
        if (msg.key.remoteJid === 'status@broadcast' && !msg.key.fromMe) return;
        
        try {
            logMessage(msg);
            const m = await serialize(msg, sock, store);
            await handleMsg(sock, m);
        } catch (err) {
            console.error(chalk.red('[Error on Message Upsert]'), err);
        }
    });

    sock.ev.on('group-participants.update', async (update) => {
        await handleParticipants(sock, update);
        await autoAdmin(sock, update);
    });

    sock.ev.on('call', async (calls) => {
        try {
            await handleCall(sock, calls, global.settings);
        } catch (err) {
            console.error(chalk.red('[Error on Call]'), err);
        }
    });
};

runBot();
