/*
 * Dandy
 * DO NOT FOR SALE!
 * Github: github.com/DanzzAraAra
 */
import { addUser, updateUser, addGroup, trackCommand } from "../src/database.js";
import { plugins } from "./loadPlugins.js";
import { handleAnti } from "./anti.js";
import { handleLimit } from "../src/limit.js";
import { handleGame } from "../src/game/handler.js";
import {
    getOwnerNumbers,
    getSenderNumber,
    normalizeJid
} from "../src/serialize.js";

const groupCache = new Map();
const CACHE_TIME = 5 * 60 * 1000;

global.regSessions ??= new Map();
global.tekateki ??= {};
global.tebakbendera ??= {};

function getNum(id) {
    if (!id) return "";

    const value = String(id).trim();
    if (/@(lid|g\.us|newsletter|broadcast)$/.test(value)) return "";

    return value.split("@")[0].split(":")[0].replace(/\D/g, "");
}

function isSameJid(a, b) {
    const numA = getNum(a);
    const numB = getNum(b);
    return Boolean(numA && numB && numA === numB);
}

function resolveOwner(m) {
    if (!m) return false;

    const number = m.senderNumber || m.senderNum ||
        getSenderNumber(m.sender, m.senderAlt);

    return Boolean(number && getOwnerNumbers(global.settings).includes(number));
}

async function sendErrorToOwner(sock, error, cmd, m) {
    const errorText = error?.stack || error?.message || String(error);

    console.error(
        `[ERROR] Command: ${cmd || "Unknown"}\nSender: ${m?.sender || "Unknown"}\nChat: ${m?.from || "Unknown"}`,
        errorText
    );

    const owners = getOwnerNumbers(global.settings);
    if (!owners.length) return;

    try {
        await sock.sendMessage(`${owners[0]}@s.whatsapp.net`, {
            text: `*[ PLUGIN ERROR ]*\n\n*Command:* ${cmd || "Unknown"}\n*Pengirim:* ${m?.sender || "Unknown"}\n*Chat:* ${m?.from || "Unknown"}\n\n*Error:*\n${errorText}`
        });
    } catch (err) {
        console.error("[Send Error]", err.message);
    }
}

async function getGroupData(sock, jid) {
    const cached = groupCache.get(jid);

    if (cached && Date.now() - cached.time < CACHE_TIME) {
        return cached.data;
    }

    const data = await sock.groupMetadata(jid);
    groupCache.set(jid, { data, time: Date.now() });

    return data;
}

async function handleMsg(sock, m, store) {
    if (!m?.key || (m.key.fromMe && m.key.id?.startsWith("BAE5"))) return;

    const text = m.text || "";
    const jid = m.from || m.key.remoteJid || "";
    if ((!text && !m.message) || !jid) return;

    const sender = m.sender || "";
    const senderAlt = m.senderAlt || "";
    const senderNum = m.senderNumber || getSenderNumber(sender, senderAlt);

    const userKeys = [m.jid, sender, senderAlt, m.senderLid].filter(Boolean);
    const users = global.db.users;
    const userId = userKeys.find(id => users[id]) || userKeys[0];

    m.userId = userId;

    const isOwner = resolveOwner({
        ...m,
        sender,
        senderAlt,
        senderNumber: senderNum
    });

    Object.assign(m, {
        sender,
        senderAlt,
        senderNumber: senderNum,
        senderNum,
        isOwner
    });

    const isGroup = jid.endsWith("@g.us");

    if (global.settings.onlyJoinGroup && jid !== global.settings.onlyJoinGroup && !isOwner) {
        return sock.sendMessage(jid, {
            text: `Bot hanya bisa digunakan di grup:\n${global.settings.onlyJoinGroupUrl}`
        }, { quoted: m });
    }

    let currentUser = users[userId];

    if (!isOwner && currentUser?.banned) return;

    if (!currentUser) {
        await addUser(userId, m.name || m.pushName || "Unknown");
        currentUser = users[userId];
    }

    if (currentUser?.premium && currentUser.premiumTime > 0 && Date.now() > currentUser.premiumTime) {
        await updateUser(userId, { premium: false, premiumTime: 0 });

        await sock.sendMessage(jid, {
            text: "Masa premium kamu telah habis! Terima kasih telah menggunakan layanan premium kami."
        }, { quoted: m });

        currentUser = users[userId];
    }

    const isRegistered = Boolean(currentUser?.registered);
    const quotedId = m.message?.extendedTextMessage?.contextInfo?.stanzaId ||
        m.msg?.contextInfo?.stanzaId;
    const session = global.regSessions.get(userId);

    if (!isRegistered && quotedId && session && session.msgId === quotedId) {
        if (text.trim().toUpperCase() !== session.code) {
            return sock.sendMessage(jid, {
                text: "Kode salah! Reply pesan registrasi dengan kode yang benar."
            }, { quoted: m });
        }

        clearTimeout(session.timeout);

        const bonus = !currentUser?.claimedFreeLimit;

        await updateUser(userId, {
            registered: true,
            username: session.username,
            age: session.age,
            limit: (currentUser?.limit || 0) + (bonus ? 30 : 0),
            claimedFreeLimit: true
        });

        global.regSessions.delete(userId);

        return sock.sendMessage(jid, {
            text: `Registrasi berhasil! Halo *${session.username}* (${session.age} tahun), sekarang kamu bisa menggunakan fitur bot.` +
                (bonus ? "\n\n🎁 *Bonus Pendaftaran:* Kamu mendapatkan 30 Limit!" : "")
        }, { quoted: m });
    }

    try {
        if (await handleGame(sock, m, text, jid, userId)) return;
    } catch (err) {
        await sendErrorToOwner(sock, err, "game", m);
        return;
    }

    const botJid = normalizeJid(sock.user?.id || "");
    const botLid = sock.user?.lid ? normalizeJid(sock.user.lid) : "";

    let isAdmin = false;
    let isBotAdmin = false;
    let groupAdmins = [];

    if (isGroup) {
        await addGroup(jid);

        try {
            const metadata = await getGroupData(sock, jid);

            groupAdmins = (metadata.participants || [])
                .filter(p => ["admin", "superadmin"].includes(p.admin))
                .flatMap(p => [p.id, p.lid, p.phoneNumber].filter(Boolean));

            isAdmin = groupAdmins.some(id =>
                isSameJid(id, sender) ||
                isSameJid(id, senderAlt) ||
                normalizeJid(id) === normalizeJid(sender) ||
                (senderAlt && normalizeJid(id) === normalizeJid(senderAlt))
            );

            isBotAdmin = groupAdmins.some(id =>
                normalizeJid(id) === botJid ||
                (botLid && normalizeJid(id) === botLid) ||
                isSameJid(id, botJid)
            );
        } catch (err) {
            console.error("[Group Metadata Error]", err.message);
        }
    }

    Object.assign(m, {
        isGroup,
        isOwner,
        isAdmin,
        isBotAdmin,
        groupAdmins,
        botJid,
        botLid,
        toJid: normalizeJid,
        normalizeJid
    });

    try {
        if (await handleAnti(sock, m)) return;
    } catch (err) {
        await sendErrorToOwner(sock, err, "anti", m);
        return;
    }

    const prefixes = Array.isArray(global.settings.prefix)
        ? global.settings.prefix
        : [global.settings.prefix];

    let prefix;
    let cmd;
    let args = [];

    if (text.startsWith(">")) {
        prefix = ">";
        cmd = "eval";
        args = [text.slice(1).trim()];
    } else if (text.startsWith("$")) {
        prefix = "$";
        cmd = "shell";
        args = [text.slice(1).trim()];
    } else {
        prefix = prefixes.find(p => typeof p === "string" && p && text.startsWith(p));
        if (!prefix) return;

        args = text.slice(prefix.length).trim().split(/\s+/);
        cmd = args.shift()?.toLowerCase() || "";
    }

    if (!cmd) return;

    if (isGroup) {
        const group = global.db.groups[jid] || {};

        if (group.mute && !isOwner) return;
        if (group.onlyadmin && !isAdmin && !isOwner) return;
    }

    if (global.settings.mode === "self" && !isOwner) return;

    if (!["onlygroup", "onlypc", "onlyjoingroup"].includes(cmd)) {
        if (global.settings.onlyGroup && !isGroup) return;
        if (global.settings.onlyPrivate && isGroup) return;
    }

    if (!isOwner && !isRegistered && cmd !== "register") {
        return sock.sendMessage(jid, {
            text: global.settings.mess.register
        }, { quoted: m });
    }

    const command = plugins.get(cmd);
    if (!command) {
        console.log(`[COMMAND NOT FOUND] ${prefix}${cmd}`);
        return;
    }

    if (command.nsfw && isGroup && !global.db.groups[jid]?.nsfw) {
        return sock.sendMessage(jid, {
            text: global.settings.mess.nsfw
        }, { quoted: m });
    }

    if (command.premium && !currentUser?.premium && !isOwner) {
        return sock.sendMessage(jid, {
            text: `Perintah *${prefix}${cmd}* hanya untuk pengguna *Premium*! Hubungi Owner untuk membeli paket premium.`
        }, { quoted: m });
    }

    if (command.owner && !isOwner) {
        return sock.sendMessage(jid, {
            text: global.settings.mess.owner
        }, { quoted: m });
    }

    let limitData;

    try {
        limitData = await handleLimit(sock, m, command, currentUser, userId, prefix);
    } catch (err) {
        await sendErrorToOwner(sock, err, cmd, m);
        return;
    }

    if (!limitData.canContinue) return;

    try {
        const result = await command.execute(
            sock,
            m,
            args,
            global.settings,
            cmd,
            prefix,
            store
        );

        if (result === false) {
            if (limitData.refund) await limitData.refund();
            return;
        }

        await trackCommand(cmd);
    } catch (err) {
        await sendErrorToOwner(sock, err, cmd, m);

        if (limitData.refund) {
            try {
                await limitData.refund();
            } catch (refundError) {
                console.error("[Refund Error]", refundError.message);
            }
        }

        try {
            await sock.sendMessage(jid, {
                text: `Terjadi error pada command *${prefix}${cmd}*`
            }, { quoted: m });
        } catch (sendError) {
            console.error("[Send Error]", sendError.message);
        }
    }
}

export {
    handleMsg,
    getNum,
    normalizeJid,
    isSameJid,
    resolveOwner
};