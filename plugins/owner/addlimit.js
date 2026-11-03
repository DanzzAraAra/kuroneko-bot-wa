import { updateUser } from "../../src/database.js";

const getNum = id => id
    ? String(id).split("@")[0].split(":")[0].replace(/\D/g, "")
    : "";

const resolveTarget = async (sock, m, args) => {
    const ctx = m.message?.extendedTextMessage?.contextInfo;
    let target = ctx?.mentionedJid?.[0] || ctx?.participant;

    if (!target && args[0]) {
        const number = args[0].replace(/\D/g, "");
        if (number) target = `${number}@s.whatsapp.net`;
    }

    if (target?.endsWith("@lid")) {
        try {
            target = await sock.signalRepository?.lidMapping?.getPNForLID?.(target) || target;
        } catch {}
    }

    return target;
};

export default {
    name: ["addlimit"],
    owner: true,

    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        if (!m.isOwner) return m.reply(settings.mess.owner);

        const targetJid = await resolveTarget(sock, m, args);

        if (!targetJid) {
            return m.reply(`*Ex:* ${usedPrefix}${commandName} @user 50`);
        }

        const targetNum = getNum(targetJid);
        const users = global.db?.users || {};
        const dbKey = Object.keys(users).find(key => getNum(key) === targetNum);

        if (!dbKey) return m.reply("Pengguna tidak ditemukan di database");

        const amountStr = args[1] || (/^\d+$/.test(args[0] || "") ? args[0] : null);
        const amount = Number(amountStr);

        if (!Number.isSafeInteger(amount) || amount <= 0) {
            return m.reply("Masukkan jumlah limit yang valid");
        }

        const newLimit = (Number(users[dbKey].limit) || 0) + amount;

        await updateUser(dbKey, { limit: newLimit });

        return m.reply(
            `Sukses menambahkan *${amount}* limit untuk *@${targetNum}*\nSisa limit sekarang: *${newLimit}*`
        );
    }
};