/*
 * Dandy
 * DO NOT FOR SALE!
 * Github: github.com/DanzzAraAra
 * Note: Pengaturan warning mengikuti konfigurasi pada plugins/group/warn.js. Jadi, jika kamu mengatur .warn set 3, batas warning untuk fitur anti lainnya juga otomatis menjadi 3x
 */
import https from "https";
import { downloadContentFromMessage } from "baileys";
import { addGroup } from "../src/database.js";
import { addWarning } from "../src/warn.js";
import toxicWords from "../src/toxic.json" with { type: "json" };

const spamRecords = new Map();
const deletedMessageCache = new Map();
const autoBackTasks = new Map();

const SPAM_LIMIT = 5;
const TIME_WINDOW = 4000;
const PENALTY_TIME = 5000;
const MESSAGE_TTL = 24 * 60 * 60 * 1000;
const MAX_CACHED_MESSAGES = 3000;
const AUTO_BACK_TIMEOUT = 5000;
const AUTO_BACK_LEAVE_TIME = 5000;

const toxicPatterns = toxicWords.map(word =>
    new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i")
);

const isCommand = text => {
    const prefixes = Array.isArray(global.settings?.prefix)
        ? global.settings.prefix
        : [global.settings?.prefix];

    return prefixes.some(prefix =>
        typeof prefix === "string" &&
        prefix &&
        text.startsWith(prefix)
    );
};

const normalizeNumber = value => {
    return String(value || "")
        .split("@")[0]
        .split(":")[0]
        .replace(/\D/g, "");
};

const isOwnerNumber = jid => {
    const owners = global.settings?.ownerNumber || [];
    const list = Array.isArray(owners) ? owners : [owners];
    const number = normalizeNumber(jid);
    return Boolean(number) && list.some(owner =>
        normalizeNumber(owner) === number
    );
};

const normalizeLink = text => {
    return String(text || "")
        .normalize("NFKC")
        .toLowerCase()
        .replace(/[\u200B-\u200F\uFEFF]/g, "")
        .replace(/[\u00A0\s]+/g, "")
        .replace(/\\/g, "/")
        .replace(/h\s*t\s*t\s*p\s*s?/g, "http")
        .replace(/:+/g, ":")
        .replace(/\/{2,}/g, "//")
        .replace(/\.{2,}/g, ".");
};

const hasWhatsAppGroupLink = text => {
    if (!text) return false;

    const normalized = normalizeLink(text);

    const patterns = [
        /(?:https?:)?\/\/(?:www\.)?chat\.whatsapp\.com(?:\/|$|[?#])/i,
        /(?:^|[^a-z0-9.-])chat\.whatsapp\.com(?:\/|$|[?#])/i,
        /(?:https?:)?\/\/(?:www\.)?whatsapp\.com\/(?:invite|channel)\/[a-z0-9_-]+/i
    ];

    if (patterns.some(pattern => pattern.test(normalized))) {
        return true;
    }

    return normalized.replace(/[^a-z0-9]/g, "").includes("chatwhatsappcom");
};

const getGroupInviteCode = text => {
    const match = String(text || "").match(
        /chat\.whatsapp\.com\/([a-zA-Z0-9]{20,24})/i
    );

    return match?.[1] || null;
};

const getErrorStatus = err => {
    return Number(
        err?.data ||
        err?.status ||
        err?.statusCode ||
        err?.output?.statusCode ||
        err?.output?.payload?.statusCode
    );
};

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const resolveDeleteActor = async (sock, actor) => {
    if (typeof actor !== "string" || !actor) return null;
    if (!actor.endsWith("@lid")) return actor;

    try {
        const mapping = sock.signalRepository?.lidMapping;

        if (typeof mapping?.getPNForLID !== "function") {
            return actor;
        }
        const result = await mapping.getPNForLID(actor);
        if (result && !result.endsWith("@lid")) {
            return result;
        }
    } catch {}
    return actor;
};

// ga support video
const detectNSFW = async (buffer, mime) => {
    const payload = JSON.stringify({
        data: `data:${mime};base64,${buffer.toString("base64")}`
    });

    return new Promise((resolve, reject) => {
        const req = https.request({
            hostname: "www.nyckel.com",
            path: "/v1/functions/o2f0jzcdyut2qxhu/invoke",
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                "Content-Length": Buffer.byteLength(payload)
            }
        }, res => {
            let data = "";

            res.on("data", chunk => {
                data += chunk;
            });

            res.on("end", () => {
                try {
                    if (res.statusCode < 200 || res.statusCode >= 300) {
                        throw new Error(`NSFW error: HTTP ${res.statusCode}`);
                    }
                    const result = JSON.parse(data);
                    if (result.message) {
                        throw new Error(result.message);
                    }
                    resolve({
                        isNSFW: result.labelName === "Porn",
                        confidencePercent: `${(result.confidence * 100).toFixed(2)}%`
                    });
                } catch (err) {
                    reject(err);
                }
            });
        });

        req.setTimeout(15000, () => {
            req.destroy(new Error("api timeout"));
        });

        req.on("error", reject);
        req.end(payload);
    });
};

const deleteMessage = (sock, jid, key) => {
    return sock.sendMessage(jid, { delete: key });
};

const getMediaBuffer = async (m, type) => {
    if (typeof m.download === "function") {
        return m.download();
    }

    const media = m.msg || m.message?.[type];
    const mediaType = type === "imageMessage" ? "image" : "sticker";
    const stream = await downloadContentFromMessage(media, mediaType);
    const chunks = [];

    for await (const chunk of stream) {
        chunks.push(chunk);
    }

    return Buffer.concat(chunks);
};

const warn = (sock, jid, sender, senderNum, title, text) => {
    return sock.sendMessage(jid, {
        text: `*${title}*\n\n@${senderNum} ${text}`,
        mentions: [sender]
    });
};

const applyAntiWarning = async (sock, m, title, text, groupData) => {
    if (groupData.warnEnabled === false) {
        return sock.sendMessage(m.from, {
            text:
                `*[ ${title} ]*\n\n` +
                `> User: @${m.sender.split("@")[0]}\n` +
                `> Pesan pelanggaran telah dihapus.`,
            mentions: [m.sender]
        });
    }

    const result = await addWarning(
        sock,
        m.from,
        m.sender,
        text
    );

    if (!result.success) {
        console.error(`[${title}]`, result.message);
        return;
    }

    let message =
        `*[ ${title} ]*\n\n` +
        `> User: ${result.target.split("@")[0]}\n` +
        `> Alasan: ${text}\n` +
        `> Warning: ${result.count}/${result.max}\n`;

    if (result.kicked) {
        message += `\n> User mencapai batas warning dan telah dikeluarkan dari grup.`;
    } else if (result.count >= result.max) {
        message += `\n> ${result.message || "Warning mencapai batas maksimal."}`;
    } else {
        message += `\n> Pesan pelanggaran telah dihapus.`;
    }

    await sock.sendMessage(m.from, { text: message });
};

const cacheAntiDeleteMessage = message => {
    const key = message?.key;
    const jid = key?.remoteJid;

    if (!key?.id || !jid?.endsWith("@g.us") || !message.message) return;
    if (message.message.protocolMessage) return;

    const cacheKey = `${jid}:${key.id}`;

    deletedMessageCache.set(cacheKey, {
        message,
        savedAt: Date.now()
    });

    if (deletedMessageCache.size > MAX_CACHED_MESSAGES) {
        const oldestKey = deletedMessageCache.keys().next().value;

        if (oldestKey) {
            deletedMessageCache.delete(oldestKey);
        }
    }
};

const isGroupAdmin = async (sock, jid, actor) => {
    if (!actor) return false;

    try {
        const metadata = await sock.groupMetadata(jid);
        const resolvedActor = await resolveDeleteActor(sock, actor);
        const actorNumber = normalizeNumber(resolvedActor);

        return metadata.participants.some(participant => {
            const ids = [
                participant.id,
                participant.lid,
                participant.phoneNumber
            ].filter(Boolean);

            const matches = ids.some(id =>
                id === actor ||
                id === resolvedActor ||
                (
                    !String(id).endsWith("@lid") &&
                    actorNumber &&
                    normalizeNumber(id) === actorNumber
                )
            );

            return matches &&
                ["admin", "superadmin"].includes(participant.admin);
        });
    } catch {
        return false;
    }
};

const getDeleteActor = item => {
    const update = item?.update || {};
    const protocol = update.message?.protocolMessage;
    const parameters = Array.isArray(update.messageStubParameters)
        ? update.messageStubParameters
        : [];

    const candidates = [
        update.participant,
        update.author,
        update.sender,
        protocol?.participant,
        item?.participant,
        item?.author,
        ...parameters
    ];

    return candidates.find(value =>
        typeof value === "string" &&
        (
            value.endsWith("@s.whatsapp.net") ||
            value.endsWith("@lid")
        )
    ) || null;
};

const shouldIgnoreDelete = async (sock, jid, deletedBy) => {
    if (!deletedBy) return false;

    const actor = await resolveDeleteActor(sock, deletedBy);

    if (isOwnerNumber(actor)) return true;

    return isGroupAdmin(sock, jid, actor || deletedBy);
};

const restoreDeletedMessage = async (sock, key, deletedBy = null) => {
    const jid = key?.remoteJid;

    if (!jid?.endsWith("@g.us") || !key?.id) return;

    const group = global.db?.groups?.[jid];

    if (!group?.antidelete) return;

    const cacheKey = `${jid}:${key.id}`;
    const cached = deletedMessageCache.get(cacheKey);

    if (!cached) return;

    if (Date.now() - cached.savedAt > MESSAGE_TTL) {
        deletedMessageCache.delete(cacheKey);
        return;
    }

    if (await shouldIgnoreDelete(sock, jid, deletedBy)) {
        deletedMessageCache.delete(cacheKey);
        return;
    }

    deletedMessageCache.delete(cacheKey);

    const original = cached.message;
    const sender = original.key.participant || original.key.remoteJid;
    const senderNum = sender?.split("@")[0]?.split(":")[0] || "Unknown";

    try {
        await sock.sendMessage(jid, {
            text: `*ANTI DELETE*\nPesan yang dihapus terdeteksi.\nPengirim: @${senderNum}`,
            mentions: sender ? [sender] : []
        });

        await sock.sendMessage(jid, {
            forward: original
        });
    } catch (err) {
        console.error("[Anti Delete]", err.message);
    }
};

const handleMessageUpdate = async (sock, updates) => {
    for (const item of updates || []) {
        const update = item?.update || {};
        const protocol = update.message?.protocolMessage;
        const stubType = update.messageStubType;

        const isRevoke =
            stubType === 1 ||
            String(stubType).toUpperCase().includes("REVOKE") ||
            (
                protocol &&
                (
                    protocol.type === 0 ||
                    String(protocol.type).toUpperCase().includes("REVOKE")
                )
            );

        if (!isRevoke) continue;

        await restoreDeletedMessage(
            sock,
            protocol?.key || item.key,
            getDeleteActor(item)
        );
    }
};

const handleMessageDelete = async (sock, data) => {
    const keys = Array.isArray(data) ? data : data?.keys || [];
    const deletedBy = getDeleteActor(data);

    for (const key of keys) {
        await restoreDeletedMessage(sock, key, deletedBy);
    }
};

const handleAntiSpam = async (sock, m) => {
    const { sender, senderNum, from, text, isOwner } = m;

    if (isOwner || !text || !isCommand(text)) return false;

    const now = Date.now();
    const data = spamRecords.get(sender) || {
        count: 0,
        lastMessage: now,
        banUntil: 0
    };

    if (now < data.banUntil) return true;

    if (now - data.lastMessage > TIME_WINDOW) {
        data.count = 0;
    }

    data.count++;
    data.lastMessage = now;

    if (data.count >= SPAM_LIMIT) {
        data.count = 0;
        data.banUntil = now + PENALTY_TIME;

        spamRecords.set(sender, data);

        await warn(
            sock,
            from,
            sender,
            senderNum,
            "ANTI SPAM",
            "kamu mengirim command terlalu cepat!\nBot memblokir kamu selama 5 detik."
        );
        return true;
    }

    spamRecords.set(sender, data);

    return false;
};

const handleAntiNSFW = async (sock, m, groupData) => {
    const { type, isAdmin, isOwner, isBotAdmin, from, key } = m;

    if (
        !["imageMessage", "stickerMessage"].includes(type) ||
        !groupData.antinsfw ||
        isAdmin ||
        isOwner ||
        !isBotAdmin
    ) return false;

    try {
        const buffer = await getMediaBuffer(m, type);
        const mime = m.msg?.mimetype ||
            m.message?.[type]?.mimetype ||
            (type === "imageMessage" ? "image/jpeg" : "image/webp");

        const result = await detectNSFW(buffer, mime);

        if (!result.isNSFW) return false;

        await deleteMessage(sock, from, key);

        await applyAntiWarning(
            sock,
            m,
            "ANTI NSFW",
            `mengirim media NSFW. Akurasi deteksi: ${result.confidencePercent}`,
            groupData
        );

        return true;
    } catch (err) {
        console.error("[Anti NSFW]", err.message);
        return false;
    }
};

const handleAntiToxic = async (sock, m, groupData) => {
    const { text, isAdmin, isOwner, isBotAdmin, from, key } = m;

    if (
        !text ||
        !groupData.antitoxic ||
        isAdmin ||
        isOwner ||
        !isBotAdmin ||
        !toxicPatterns.some(pattern => pattern.test(text))
    ) return false;

    await deleteMessage(sock, from, key);

    await applyAntiWarning(
        sock,
        m,
        "ANTI TOXIC",
        "menggunakan kata kasar",
        groupData
    );

    return true;
};

const handleAntiLink = async (sock, m, groupData) => {
    const { text, isAdmin, isOwner, isBotAdmin, from, key } = m;
    if (
        !groupData.antilink ||
        isAdmin ||
        isOwner ||
        !isBotAdmin ||
        !hasWhatsAppGroupLink(text)
    ) return false;

    await deleteMessage(sock, from, key);

    await applyAntiWarning(
        sock,
        m,
        "ANTI LINK",
        "mengirim link grup WhatsApp",
        groupData
    );

    return true;
};

const handleAntiTagSW = async (sock, m, groupData) => {
    const { type, message, isAdmin, isOwner, isBotAdmin, from, key } = m;
    const isTagSW = type === "groupStatusMentionMessage" ||
        (
            message &&
            JSON.stringify(message).includes("groupStatusMentionMessage")
        );
    if (
        !isTagSW ||
        !groupData.antitagsw ||
        isAdmin ||
        isOwner ||
        !isBotAdmin
    ) return false;

    await deleteMessage(sock, from, key);

    await applyAntiWarning(
        sock,
        m,
        "ANTI TAG SW",
        "melakukan tag status WhatsApp",
        groupData
    );

    return true;
};

// untuk group yang aktifin request login ga bisa coba logic sendiri aja malaz gw njir hihi
const handleAutoBack = async (sock, m, groupData) => {
    const {
        text,
        from,
        sender,
        isAdmin,
        isOwner,
        isBotAdmin,
        key
    } = m;

    if (
        !groupData.autoback ||
        !text ||
        isCommand(text) ||
        isAdmin ||
        isOwner ||
        !isBotAdmin
    ) return false;

    const code = getGroupInviteCode(text);
    if (!code) return false;
    const taskKey = `${from}:${key?.id || sender}`;
    if (autoBackTasks.has(taskKey)) return true;
    autoBackTasks.set(taskKey, true);
    const processAutoBack = async () => {
        try {
            const sourceCode = await sock.groupInviteCode(from);
            if (code === sourceCode) return;
            let targetGroup;
            try {
                targetGroup = await sock.groupAcceptInvite(code);
            } catch (err) {
                const status = getErrorStatus(err);
                if (status === 400) {
                    await sock.sendMessage(from, {
                        text: "Auto Back gagal: link grup tidak valid atau tidak dapat diproses."
                    }, { quoted: m });
                    return;
                }
                if (status === 304) {
                    await delay(AUTO_BACK_TIMEOUT);

                    try {
                        targetGroup = await sock.groupAcceptInvite(code);
                    } catch (retryError) {
                        if (getErrorStatus(retryError) === 304) {
                            await deleteMessage(sock, from, key);

                            await sock.sendMessage(from, {
                                text:
                                    "Permintaan bergabung ke grup tujuan belum disetujui dalam 5 detik.\n" +
                                    "Pesan link undangan telah dihapus."
                            });
                            return;
                        }
                        throw retryError;
                    }
                } else if (status === 409) {
                    const info = await sock.groupGetInviteInfo(code);
                    targetGroup = info?.id;
                } else if (status === 410) {
                    await sock.sendMessage(from, {
                        text: "Link undangan grup tidak valid atau sudah kedaluwarsa"
                    }, { quoted: m });
                    return;
                } else {
                    throw err;
                }
            }

            const targetJid = typeof targetGroup === "string"
                ? targetGroup
                : targetGroup?.id;
            if (!targetJid?.endsWith("@g.us")) {
                throw new Error("Gagal mendapatkan ID grup tujuan.");
            }
            const sourceLink = `https://chat.whatsapp.com/${sourceCode}`;
            await sock.sendMessage(targetJid, {
                text:
                    `Halo, saya kembali dari grup sebelumnya.\n\n` +
                    `Ini link grup tadi:\n${sourceLink}\n\n` +
                    `back tadi @${sender.split("@")[0]}`,
                mentions: [sender]
            });

            await sock.sendMessage(from, {
                text: "Berhasil bergabung dan mengirim link grup asal ke grup tujuan."
            });

            await delay(AUTO_BACK_LEAVE_TIME);
            await sock.groupLeave(targetJid);
        } catch (err) {
            console.error("[AUTO BACK]", err);
            await sock.sendMessage(from, {
                text: `Auto Back gagal: ${err.message}`
            }).catch(() => {});
        } finally {
            autoBackTasks.delete(taskKey);
        }
    };

    processAutoBack().catch(err => {
        console.error("[AUTO BACK]", err);
        autoBackTasks.delete(taskKey);
    });

    return true;
};

const handleAnti = async (sock, m) => {
    if (await handleAntiSpam(sock, m)) return true;
    if (!m.isGroup) return false;
    const jid = m.from;
    addGroup(jid);
    const groupData = global.db?.groups?.[jid] || {};
    if (await handleAntiNSFW(sock, m, groupData)) return true;
    if (await handleAntiToxic(sock, m, groupData)) return true;
    if (await handleAutoBack(sock, m, groupData)) return true;
    if (await handleAntiLink(sock, m, groupData)) return true;
    if (await handleAntiTagSW(sock, m, groupData)) return true;
    return false;
};

const handleCall = async (sock, calls, settings) => {
    if (!settings?.anticall) return;
    for (const call of calls) {
        if (call.status !== "offer") continue;
        try {
            await sock.rejectCall(call.id, call.from);
            const message = settings.mess?.anticall;
            if (message && call.from) {
                await sock.sendMessage(call.from, {
                    text: message
                });
            }
        } catch (err) {
            console.error("[Anti Call]", err.message);
        }
    }
};

export {
    handleAnti,
    handleCall,
    cacheAntiDeleteMessage,
    handleMessageUpdate,
    handleMessageDelete
};