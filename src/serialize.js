/*
 * Dandy
 * DO NOT FOR SALE!
 * Github: github.com/DanzzAraAra
 */
import { downloadMediaMessage } from "baileys";

const storeID = new Map();

const getDevice = id => {
    if (/^3A.{18}$/.test(id)) return "ios";
    if (/^3E.{20}$/.test(id)) return "web";
    if (/^(.{21}|.{32})$/.test(id)) return "android";
    if (/^.{18}$/.test(id)) return "desktop";
    return "bot";
};

const getContentType = content => {
    if (!content) return null;

    return Object.keys(content).find(key =>
        (
            key === "conversation" ||
            key.endsWith("Message") ||
            key.includes("V2") ||
            key.includes("V3")
        ) && key !== "senderKeyDistributionMessage"
    );
};

const normalizeNumber = value => {
    if (!value) return null;

    const raw = String(value).trim();

    if (!raw || /@(lid|g\.us|broadcast|newsletter)$/.test(raw)) {
        return null;
    }

    const number = raw.split("@")[0].split(":")[0].replace(/\D/g, "");

    return number || null;
};

const normalizeJid = value => {
    if (!value) return null;

    const jid = String(value).trim();

    if (jid.includes("@")) return jid;

    const number = normalizeNumber(jid);

    return number ? `${number}@s.whatsapp.net` : null;
};

const isHex = value => {
    return typeof value === "string" && /^[0-9a-fA-F]+$/.test(value);
};

const checkIsBot = ctx => {
    if (!ctx?.id || !isHex(ctx.id)) return true;

    const now = Date.now();
    const lastSeen = storeID.get(ctx.id);

    if (lastSeen && now - lastSeen < 3000) return true;

    storeID.set(ctx.id, now);

    if (storeID.size > 1000) {
        for (const [id, time] of storeID) {
            if (now - time > 300000) {
                storeID.delete(id);
            }
        }
    }

    return false;
};

const unwrapMessage = message => {
    let result = message;

    while (result) {
        const wrapped =
            result.ephemeralMessage?.message ||
            result.viewOnceMessage?.message ||
            result.viewOnceMessageV2?.message ||
            result.viewOnceMessageV2Extension?.message;

        if (!wrapped) break;

        result = wrapped;
    }

    return result || null;
};

const parseMessage = content => {
    let message = unwrapMessage(content?.message || content);

    if (!message) return null;

    if (message.protocolMessage?.type === 14) {
        const type = getContentType(message.protocolMessage);

        if (type) {
            message = message.protocolMessage[type];
        }
    }

    if (message.messageContextInfo) {
        message = { ...message };
        delete message.messageContextInfo;
    }

    return message;
};

const getMessageText = message => {
    const data = parseMessage(message);

    if (!data) return "";

    return (
        data.conversation ||
        data.extendedTextMessage?.text ||
        data.imageMessage?.caption ||
        data.videoMessage?.caption ||
        data.documentMessage?.caption ||
        data.buttonsResponseMessage?.selectedButtonId ||
        data.listResponseMessage?.singleSelectReply?.selectedRowId ||
        data.templateButtonReplyMessage?.selectedId ||
        data.templateButtonReplyMessage?.selectedDisplayText ||
        ""
    );
};

const getMedia = message => {
    const data = parseMessage(message);

    if (!data) return null;

    const mediaTypes = {
        imageMessage: ["image", "image/jpeg"],
        videoMessage: ["video", "video/mp4"],
        documentMessage: ["document", "application/octet-stream"],
        audioMessage: ["audio", "audio/ogg; codecs=opus"],
        stickerMessage: ["sticker", "image/webp"]
    };

    for (const [key, [type, defaultMimetype]] of Object.entries(mediaTypes)) {
        const media = data[key];

        if (!media) continue;

        const mimetype = media.mimetype || defaultMimetype;

        return {
            type,
            message: media,
            mimetype,
            isAudio: type === "audio" || mimetype.startsWith("audio/"),
            ptt: Boolean(media.ptt),
            seconds: media.seconds || 0
        };
    }

    return null;
};

const resolveLid = async (sock, jid) => {
    if (!jid?.endsWith("@lid")) return jid;

    const mapping = sock?.signalRepository?.lidMapping;

    if (typeof mapping?.getPNForLID !== "function") return jid;

    for (const value of [jid, jid.split("@")[0]]) {
        try {
            const result = await mapping.getPNForLID(value);

            if (result && !result.endsWith("@lid")) {
                return result;
            }
        } catch {}
    }

    return jid;
};

const resolvePN = async (sock, jid) => {
    if (!jid) return null;

    const resolved = await resolveLid(sock, jid);

    if (!resolved || resolved.endsWith("@lid")) return null;

    const number = normalizeNumber(resolved);

    return number ? `${number}@s.whatsapp.net` : null;
};

const resolveSender = async (sock, key) => {
    const {
        remoteJid = "",
        participant = "",
        participantAlt = "",
        remoteJidAlt = ""
    } = key || {};

    if (remoteJid.endsWith("@g.us")) {
        const sender = participantAlt && !participantAlt.endsWith("@lid")
            ? participantAlt
            : participant.endsWith("@lid")
                ? await resolveLid(sock, participant)
                : participant;

        return {
            sender,
            senderLid: participant.endsWith("@lid") ? participant : null,
            senderAlt: participantAlt || null
        };
    }

    if (remoteJid.endsWith("@lid")) {
        return {
            sender: remoteJidAlt && !remoteJidAlt.endsWith("@lid")
                ? remoteJidAlt
                : await resolveLid(sock, remoteJid),
            senderLid: remoteJid,
            senderAlt: remoteJidAlt || null
        };
    }

    return {
        sender: remoteJid,
        senderLid: null,
        senderAlt: remoteJidAlt || null
    };
};

const getOwnerNumbers = settings => {
    const owners = Array.isArray(settings?.ownerNumber)
        ? settings.ownerNumber
        : [settings?.ownerNumber];

    return owners.map(normalizeNumber).filter(Boolean);
};

const getSenderNumber = (sender, senderAlt) => {
    for (const value of [sender, senderAlt]) {
        if (value?.endsWith("@lid")) continue;

        const number = normalizeNumber(value);

        if (number) return number;
    }

    return null;
};

const isOwner = (sender, senderAlt, senderNumber, settings) => {
    const owners = getOwnerNumbers(settings);

    if (!owners.length) return false;

    const numbers = [
        senderNumber,
        getSenderNumber(sender, senderAlt)
    ].filter(Boolean);

    return numbers.some(number => owners.includes(number));
};

const getQuotedMessage = async (sock, msg) => {
    const message = parseMessage(msg);

    if (!message) return null;

    const source =
        message.extendedTextMessage ||
        message.imageMessage ||
        message.videoMessage ||
        message.documentMessage ||
        message.audioMessage ||
        message.stickerMessage;

    const context = source?.contextInfo;

    if (!context?.quotedMessage) return null;

    const participantAlt = context.participantAlt || "";
    const participant = context.participant || "";

    let sender = participant;

    if (participantAlt.endsWith("@s.whatsapp.net")) {
        sender = participantAlt;
    } else if (participant.endsWith("@lid")) {
        sender = await resolveLid(sock, participant);
    }

    return {
        key: {
            remoteJid: msg.key?.remoteJid || "",
            fromMe: Boolean(context.fromMe),
            id: context.stanzaId || "",
            participant: sender,
            participantAlt: participantAlt || null
        },
        message: unwrapMessage(context.quotedMessage)
    };
};

const serialize = async (msg, bot, store) => {
    if (!msg || msg.messageStubType === 2) return msg;

    const key = msg.key || {};
    const chat = key.remoteJid || "";
    const senderInfo = await resolveSender(bot, key);

    const m = {
        ...msg,
        raw: msg,
        key,
        id: key.id || "",
        chat,
        from: chat,
        sender: senderInfo.sender,
        senderLid: senderInfo.senderLid,
        senderAlt: senderInfo.senderAlt,
        pushName: msg.pushName || "Unknown",
        fromMe: Boolean(key.fromMe)
    };

    m.isGroup = chat.endsWith("@g.us");
    m.isChannel = chat.endsWith("@newsletter");
    m.isBroadcast = chat.endsWith("@broadcast");

    m.senderNumber = getSenderNumber(m.sender, m.senderAlt);
    m.jid = m.senderNumber
        ? `${m.senderNumber}@s.whatsapp.net`
        : m.sender;

    m.message = parseMessage(msg.message);
    m.type = getContentType(m.message) || Object.keys(m.message || {})[0] || "";
    m.msg = m.type
        ? parseMessage(m.message?.[m.type]) || m.message?.[m.type]
        : null;

    m.text = getMessageText(msg.message);

    const mentions = [
        ...(m.msg?.contextInfo?.mentionedJid || []),
        ...(m.msg?.contextInfo?.groupMentions?.map(item => item.groupJid) || [])
    ];

    m.mentions = await Promise.all(
        mentions.map(jid => resolveLid(bot, jid))
    );

    m.expiration = m.msg?.contextInfo?.expiration || 0;

    m.timestamps = typeof msg.messageTimestamp === "number"
        ? Number(msg.messageTimestamp) * 1000
        : (m.msg?.timestampMs || 0);

    m.device = getDevice(m.id);
    m.isBot = m.device === "bot" || checkIsBot(m);

    m.name =
        store?.contacts?.[m.jid]?.name ||
        store?.contacts?.[m.sender]?.name ||
        msg.pushName ||
        bot.user?.name ||
        "Unknown";

    if (m.isGroup) {
        if (!store.groupMetadata[m.from]) {
            try {
                store.groupMetadata[m.from] = await bot.groupMetadata(m.from);
            } catch {}
        }

        m.metadata = store.groupMetadata[m.from];
    }

    m.media = getMedia(msg.message);
    m.isMedia = Boolean(m.media);

    if (m.isMedia) {
        m.download = () => downloadMediaMessage(m, "buffer", {}, {
            logger: bot.logger,
            reuploadRequest: bot.updateMediaMessage
        });
    }

    m.isOwner = isOwner(
        m.sender,
        m.senderAlt,
        m.senderNumber,
        global.settings
    );

    m.reply = (text, options = {}) => {
        if (!m.from) return null;

        const payload = typeof text === "string" ? { text } : text;

        return bot.sendMessage(m.from, payload, {
            quoted: m,
            ephemeralExpiration: m.expiration,
            ...options
        });
    };

    m.edit = (text, editKey = m.key) => {
        const payload = typeof text === "string"
            ? { text, edit: editKey }
            : { ...text, edit: editKey };

        return bot.sendMessage(m.from, payload, {
            quoted: m,
            ephemeralExpiration: m.expiration
        });
    };

    m.react = emoji => {
        return bot.sendMessage(m.from, {
            react: {
                text: emoji,
                key: m.key
            }
        });
    };

    m.quoted = await getQuotedMessage(bot, msg);

    if (m.quoted) {
        m.quoted.media = getMedia(m.quoted.message);
        m.quoted.text = getMessageText(m.quoted.message);

        m.quoted.senderNumber = getSenderNumber(
            m.quoted.key.participant,
            m.quoted.key.participantAlt
        );

        m.quoted.jid = m.quoted.senderNumber
            ? `${m.quoted.senderNumber}@s.whatsapp.net`
            : m.quoted.key.participant || m.quoted.key.remoteJid;

        m.quoted.name = store?.contacts?.[m.quoted.jid]?.name || "Unknown";
        m.quoted.isMedia = Boolean(m.quoted.media);

        if (m.quoted.isMedia) {
            m.quoted.download = () => downloadMediaMessage(
                m.quoted,
                "buffer",
                {},
                {
                    logger: bot.logger,
                    reuploadRequest: bot.updateMediaMessage
                }
            );
        }
    }

    return m;
};

export {
    serialize,
    parseMessage,
    getDevice,
    getContentType,
    normalizeNumber,
    normalizeJid,
    resolveLid,
    resolvePN,
    resolveSender,
    getOwnerNumbers,
    getSenderNumber,
    isOwner
};