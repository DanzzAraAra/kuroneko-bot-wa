/*
   * Dandy
   * DO NOT FOR SALE!
   * Github: github.com/DanzzAraAra
*/
const {
    extractMessageContent,
    jidNormalizedUser,
    areJidsSameUser,
    downloadMediaMessage,
} = require("baileys");

const getDevice = (id) =>
    /^3A.{18}$/.test(id) ? "ios"
    : /^3E.{20}$/.test(id) ? "web"
    : /^(.{21}|.{32})$/.test(id) ? "android"
    : /^.{18}$/.test(id) ? "desktop"
    : "bot";

const getContentType = (content) => {
    if (!content) return null;
    return Object.keys(content).find(
        (k) => (k === "conversation" || k.endsWith("Message") || k.includes("V2") || k.includes("V3")) && k !== "senderKeyDistributionMessage"
    );
};

const isHex = (str) => !/[^0-9a-fA-F]/.test(str);
const storeID = new Map();

const checkIsBot = (ctx) => {
    if (!ctx.id || !isHex(ctx.id)) return true;

    const now = Date.now();
    if (storeID.has(ctx.id)) {
        let lastTime = storeID.get(ctx.id);
        let diff = now - lastTime;
        if (diff < 3000) return true;
    }

    storeID.set(ctx.id, now);

    if (storeID.size > 1000) {
        for (const [key, time] of storeID) {
            if (now - time > 300000) storeID.delete(key);
        }
    }

    return false;
};

const parseMessage = (content) => {
    let msgContent = extractMessageContent(content);

    if (msgContent?.viewOnceMessageV2Extension) {
        msgContent = msgContent.viewOnceMessageV2Extension.message;
    }

    if (msgContent?.protocolMessage?.type === 14) {
        let type = getContentType(msgContent.protocolMessage);
        msgContent = msgContent.protocolMessage[type];
    }

    if (msgContent?.messageContextInfo) {
        delete msgContent.messageContextInfo;
    }

    if (msgContent?.message) {
        let type = getContentType(msgContent.message);
        msgContent = msgContent.message[type];
    }

    return msgContent;
};

const serialize = async (msg, bot, store) => {
    if (msg.messageStubType === 2) return msg;

    let m = { ...msg };

    m.key = msg.key;
    m.id = msg?.key?.id || false;
    m.from = m.key.remoteJid.startsWith("status")
        ? jidNormalizedUser(m.key?.participant || msg.participant)
        : jidNormalizedUser(m.key.remoteJid);
    m.chat = m.from;

    m.fromMe = m.key.fromMe;
    m.isGroup = m.from.endsWith("@g.us");
    m.isNewsletter = m.from.endsWith("@newsletter");
    m.device = getDevice(m.id);
    m.jid = jidNormalizedUser(
        m.fromMe ? bot.user.id : m.isGroup ? m.key.participant : m.from
    );

    m.message = parseMessage(msg.message);

    if (msg.message) {
        m.type = getContentType(msg.message) || Object.keys(msg.message)[0];
        m.msg = parseMessage(msg.message[m.type]) || msg.message[m.type];

        m.mentions = [
            ...(m.msg?.contextInfo?.mentionedJid || []),
            ...(m.msg?.contextInfo?.groupMentions?.map(v => v.groupJid) || [])
        ];

        m.text =
            m.msg?.text ||
            m.msg?.conversation ||
            m.msg?.caption ||
            m.message?.conversation ||
            m.msg?.selectedButtonId ||
            m.msg?.singleSelectReply?.selectedRowId ||
            m.msg?.selectedId ||
            m.msg?.contentText ||
            m.msg?.selectedDisplayText ||
            m.msg?.title ||
            "";
    }

    m.expiration = m.msg?.contextInfo?.expiration || 0;
    m.timestamps = typeof msg?.messageTimestamp === "number"
        ? msg.messageTimestamp * 1000
        : (m.msg?.timestampMs * 1000 || 0);

    m.isBot = m.device === "bot" || checkIsBot(m) || false;
    m.name = store?.contacts?.[m.jid]?.name || msg?.pushName || bot.user?.name || "Unknown";

    if (m.isGroup && store?.groupMetadata) {
        if (!(m.from in store.groupMetadata)) {
            try {
                store.groupMetadata[m.from] = await bot.groupMetadata(m.from);
            } catch {}
        }
        m.metadata = store.groupMetadata[m.from];
    }

    m.isMedia = !!m.msg?.mimetype || !!m.msg?.thumbnailDirectPath;

    if (m.isMedia) {
        m.download = async () =>
            downloadMediaMessage(m, "buffer", {}, { logger: bot.logger });
    }

    m.reply = async (text, options = {}) => {
        const payload = typeof text === "string" ? { text } : text;
        return bot.sendMessage(
            m.from,
            payload,
            {
                quoted: m,
                ephemeralExpiration: m.expiration,
                ...options
            }
        );
    };

    m.edit = async (text, key = m.key) => {
        const payload = typeof text === "string"
            ? { text, edit: key }
            : { ...text, edit: key };
        return bot.sendMessage(
            m.from,
            payload,
            {
                quoted: m,
                ephemeralExpiration: m.expiration
            }
        );
    };

    m.react = async (emoji) => {
        return bot.sendMessage(m.from, {
            react: {
                text: emoji,
                key: m.key
            }
        });
    };

    if (m.msg?.contextInfo?.quotedMessage) {
        let quoted = {};

        quoted.message = parseMessage(m.msg.contextInfo.quotedMessage);

        quoted.key = {
            remoteJid: m.msg.contextInfo.remoteJid || m.from,
            participant: jidNormalizedUser(m.msg.contextInfo.participant),
            fromMe: areJidsSameUser(
                jidNormalizedUser(m.msg.contextInfo.participant),
                jidNormalizedUser(bot.user.id)
            ),
            id: m.msg.contextInfo.stanzaId
        };

        quoted.type = getContentType(quoted.message) || Object.keys(quoted.message)[0];
        quoted.msg = parseMessage(quoted.message[quoted.type]) || quoted.message[quoted.type];
        quoted.jid = jidNormalizedUser(quoted.key.participant || quoted.key.remoteJid);
        quoted.from = /g\.us|status/.test(m.msg.contextInfo.remoteJid)
            ? quoted.key.participant
            : quoted.key.remoteJid;

        quoted.fromMe = quoted.key.fromMe;
        quoted.id = quoted.key.id;
        quoted.device = getDevice(quoted.id);
        quoted.isBot = quoted.device === "bot" || checkIsBot(quoted) || false;
        quoted.name = store?.contacts?.[quoted.jid]?.name || "Unknown";

        quoted.mentions = [
            ...(quoted.msg?.contextInfo?.mentionedJid || []),
            ...(quoted.msg?.contextInfo?.groupMentions?.map(v => v.groupJid) || [])
        ];

        if (quoted.msg) {
            quoted.text =
                quoted.msg?.text ||
                quoted.msg?.conversation ||
                quoted.msg?.caption ||
                quoted.message?.conversation ||
                quoted.msg?.selectedButtonId ||
                quoted.msg?.singleSelectReply?.selectedRowId ||
                quoted.msg?.selectedId ||
                quoted.msg?.contentText ||
                quoted.msg?.selectedDisplayText ||
                quoted.msg?.title ||
                "";

            quoted.isMedia = !!quoted.msg?.mimetype || !!quoted.msg?.thumbnailDirectPath;

            if (quoted.isMedia) {
                quoted.download = async () =>
                    downloadMediaMessage(quoted, "buffer", {}, { logger: bot.logger });
            }
        }

        m.quoted = quoted;
    }

    return m;
};

module.exports = {
    serialize,
    parseMessage,
    getDevice,
    getContentType
};