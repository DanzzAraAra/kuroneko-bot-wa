import { updateUser } from "../../src/database.js";

export default {
    name: ["dellimit"],
    owner: true,

    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        const isOwner = m.sender.split("@")[0] === "628xxx" || m.isOwner;

        if (!isOwner) {
            return m.reply(settings.mess.owner);
        }

        const ctx = m.message?.extendedTextMessage?.contextInfo;
        const target = ctx?.mentionedJid?.[0] || ctx?.participant;
        const number = args[0]?.replace(/\D/g, "");
        const targetJid = target || (number ? `${number}@s.whatsapp.net` : null);

        if (!targetJid) {
            return m.reply(`*Ex:* ${usedPrefix}${commandName} @user 10`);
        }

        const user = global.db?.users?.[targetJid];

        if (!user) {
            return m.reply("Pengguna tidak ditemukan di database.");
        }

        const opt = target ? args[0] : args[1] || args[0];
        const currentLimit = Number(user.limit) || 0;

        if (opt?.toLowerCase() === "all") {
            await updateUser(targetJid, { limit: 0 });

            return m.reply(
                `Sukses menghapus seluruh limit untuk *@${targetJid.split("@")[0]}*.\n` +
                "Sisa limit sekarang: *0*"
            );
        }

        const amount = Number(opt);

        if (!Number.isInteger(amount) || amount <= 0) {
            return m.reply(
                `Masukkan jumlah limit yang valid!\n\n` +
                `*Ex:* ${usedPrefix}${commandName} @user 10\n` +
                `*Atau:* ${usedPrefix}${commandName} @user all`
            );
        }

        const newLimit = Math.max(0, currentLimit - amount);

        await updateUser(targetJid, { limit: newLimit });

        return m.reply(
            `Sukses mengurangi *${amount}* limit untuk *@${targetJid.split("@")[0]}*.\n` +
            `Sisa limit sekarang: *${newLimit}*`
        );
    }
};