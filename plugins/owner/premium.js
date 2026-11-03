import { updateUser } from "../../src/database.js";

const getNum = id => id
    ? String(id).split("@")[0].split(":")[0].replace(/\D/g, "")
    : "";

const parseDuration = str => {
    const match = String(str || "").trim().match(/^(\d+(?:\.\d+)?)(s|m|h|d)$/i);
    if (!match) return null;

    const num = parseFloat(match[1]);

    switch (match[2].toLowerCase()) {
        case "s": return num * 1000;
        case "m": return num * 60000;
        case "h": return num * 3600000;
        case "d": return num * 86400000;
        default: return null;
    }
};

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
    name: ["addprem", "delprem"],
    owner: true,

    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        if (!m.isOwner) return m.reply(settings.mess.owner);

        const targetJid = await resolveTarget(sock, m, args);

        if (!targetJid) {
            return m.reply(`*Ex:* ${usedPrefix}${commandName} @user`);
        }

        const targetNum = getNum(targetJid);
        const dbKey = Object.keys(global.db?.users || {}).find(key => getNum(key) === targetNum);

        if (!dbKey) {
            return m.reply("Pengguna tidak ditemukan di database");
        }

        const user = global.db.users[dbKey];

        if (commandName === "addprem") {
            const timeStr = args[1] || (!/^\d+$/.test(args[0] || "") ? args[0] : null);
            const duration = parseDuration(timeStr);

            if (!duration || !Number.isFinite(duration)) {
                return m.reply(`*Ex:* ${usedPrefix}addprem @user 30d`);
            }

            const baseTime = user.premium && user.premiumTime > Date.now()
                ? user.premiumTime
                : Date.now();

            const newPremTime = baseTime + duration;

            await updateUser(dbKey, {
                premium: true,
                premiumTime: newPremTime
            });

            return m.reply(
                `Sukses menambahkan Premium untuk *@${targetNum}* selama *${timeStr}*\n\nPremium berakhir pada: ${new Date(newPremTime).toLocaleString("id-ID")}`
            );
        }

        if (commandName === "delprem") {
            if (!user.premium) {
                return m.reply("Pengguna tersebut memang bukan user premium");
            }

            await updateUser(dbKey, {
                premium: false,
                premiumTime: 0
            });

            return m.reply(`Status Premium untuk *@${targetNum}* telah dihapus`);
        }
    }
};