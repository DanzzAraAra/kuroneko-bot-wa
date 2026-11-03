/*
 * Dandy
 * DO NOT FOR SALE!
 * Github: github.com/DanzzAraAra
 */
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore
} from "baileys";
import pino from "pino";
import readline from "node:readline";
import chalk from "chalk";
import { makeStore } from "./system/store.js";
import { loadPlugins, watchPlugins } from "./system/loadPlugins.js";
import { handleMsg } from "./system/handler.js";
import { handleParticipants } from "./system/participants.js";
import { auto, autoAdmin, startSchedule } from "./system/auto.js";
import {
  handleCall,
  cacheAntiDeleteMessage,
  handleMessageUpdate,
  handleMessageDelete
} from "./system/anti.js";
import { logMessage } from "./src/logger.js";
import { serialize } from "./src/serialize.js";
import { connectDB } from "./src/database.js";
import { attachFunctions } from "./src/function.js";
import { startCLI } from "./system/cli.js";
import { connectAmba } from "./system/react.js";
import settings from "./settings.js";

global.settings = settings;
const store = makeStore();
const logger = pino({ level: "silent" });
let cliStarted = false;
let reconnecting = false;

const question = (rl, text) => {
  return new Promise(resolve => {
    rl.question(text, answer => resolve(answer.trim()));
  });
};

const login = async sock => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true
  });

  try {
    let choice;

    while (!["1", "2"].includes(choice)) {
      choice = await question(
        rl,
        chalk.cyan("\nLogin Method:\n1. QR Code\n2. Pairing Code\nChoose [1/2]: ")
      );

      if (!["1", "2"].includes(choice)) {
        console.log(chalk.red("Pilihan tidak valid. Masukkan 1 atau 2."));
      }
    }

    if (choice === "1") return;

    let phone;

    while (!/^\d{10,15}$/.test(phone || "")) {
      phone = await question(
        rl,
        chalk.yellow("\nMasukkan nomor [Ex: 628123456789]:\n> ")
      );

      if (!/^\d{10,15}$/.test(phone)) {
        console.log(chalk.red("Nomor tidak valid. Gunakan angka dengan kode negara."));
      }
    }

    const code = await sock.requestPairingCode(phone);

    console.log(chalk.greenBright(`\n[ KODE PAIRING ]: ${code}\n`));
  } finally {
    rl.close();
  }
};

const handleConnection = (sock, ambaRef) => {
  sock.ev.on("connection.update", async ({ connection, lastDisconnect }) => {
    if (connection === "open") {
      reconnecting = false;

      console.log(chalk.greenBright(
        `\n[+] ${settings.botName} Successfully connected to WhatsApp!\n`
      ));

      startSchedule(sock);
      ambaRef.instance?.close();
      ambaRef.instance = connectAmba(sock, {
        version: "7.0.0-rc14"
      });

      return;
    }

    if (connection !== "close") return;

    ambaRef.instance?.close();
    ambaRef.instance = undefined;

    const statusCode = lastDisconnect?.error?.output?.statusCode;

    if (statusCode === DisconnectReason.loggedOut) {
      console.log(chalk.redBright(
        '[!] Session has been released. Please delete the "session" folder'
      ));

      process.exit(0);
    }

    if (reconnecting) return;

    reconnecting = true;

    console.log(chalk.red("[!] Koneksi terputus. Mencoba reconnect..."));

    setTimeout(async () => {
      try {
        await runBot();
      } catch (err) {
        reconnecting = false;
        console.error(chalk.red("[Reconnect Error]"), err);
      }
    }, 3000);
  });
};

const handleMessages = sock => {
  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;

    for (const msg of messages) {
      if (!msg?.message) continue;

      try {
        cacheAntiDeleteMessage(msg);
        await auto(sock, msg);

        if (msg.key?.remoteJid === "status@broadcast") continue;

        const m = await serialize(msg, sock, store);

        logMessage(m);
        await handleMsg(sock, m, store);
      } catch (err) {
        console.error(chalk.red("[Message Error]"), err);
      }
    }
  });
};

const handleAntiDelete = sock => {
  sock.ev.on("messages.update", async updates => {
    try {
      await handleMessageUpdate(sock, updates);
    } catch (err) {
      console.error(chalk.red("[Anti Delete Update Error]"), err);
    }
  });

  sock.ev.on("messages.delete", async data => {
    try {
      await handleMessageDelete(sock, data);
    } catch (err) {
      console.error(chalk.red("[Anti Delete Error]"), err);
    }
  });
};

const handleGroup = sock => {
  sock.ev.on("group-participants.update", async update => {
    console.log(chalk.cyan("[Group Participants]"), {
      group: update.id,
      action: update.action,
      participants: update.participants
    });

    try {
      await handleParticipants(sock, update);
    } catch (err) {
      console.error(chalk.red("[Participants Error]"), err);
    }

    try {
      await autoAdmin(sock, update);
    } catch (err) {
      console.error(chalk.red("[Auto Admin Error]"), err);
    }
  });
};

const handleCalls = sock => {
  sock.ev.on("call", async calls => {
    try {
      await handleCall(sock, calls, settings);
    } catch (err) {
      console.error(chalk.red("[Call Error]"), err);
    }
  });
};

const runBot = async () => {
  const { state, saveCreds } = await useMultiFileAuthState("session");
  const { version } = await fetchLatestBaileysVersion();

  const sock = attachFunctions(makeWASocket({
    version,
    logger,
    printQRInTerminal: !state.creds.registered,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(
        state.keys,
        pino({ level: "fatal" })
      )
    },
    browser: ["Ubuntu", "Chrome", "20.0.04"],
    syncFullHistory: false,
    generateHighQualityLinkPreview: true,
    getMessage: async key => {
      return (await store.loadMessage(key.remoteJid, key.id))?.message;
    }
  }));

  const ambaRef = { instance: undefined };
  store.bind(sock.ev);
  sock.ev.on("creds.update", saveCreds);

  if (!state.creds.registered) {
    await login(sock);
  }

  if (!cliStarted) {
    startCLI();
    cliStarted = true;
  }

  handleConnection(sock, ambaRef);
  handleMessages(sock);
  handleAntiDelete(sock);
  handleGroup(sock);
  handleCalls(sock);
};

const startBot = async () => {
  await connectDB();

  console.log(chalk.green(
    `[Database] Mode: ${settings.database.mode}`
  ));

  loadPlugins();
  watchPlugins();
  await runBot();
};

startBot().catch(err => {
  console.error(chalk.red("[Fatal Error]"), err);
});