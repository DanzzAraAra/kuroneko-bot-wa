import { updateUser } from "../../src/database.js";

export default {
    name: ["delmoney"],
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
            return m.reply(`*Ex:* ${usedPrefix}${commandName} @user 10000`);
        }

        const user = global.db?.users?.[targetJid];

        if (!user) {
            return m.reply("Pengguna tidak ditemukan di database.");
        }

        const opt = target ? args[0] : args[1] || args[0];
        const currentMoney = Number(user.money) || 0;

        if (opt?.toLowerCase() === "all") {
            await updateUser(targetJid, { money: 0 });

            return m.reply(
                `Sukses menghapus seluruh money untuk *@${targetJid.split("@")[0]}*.\n` +
                "Sisa money sekarang: *Rp0*"
            );
        }

        const amount = Number(opt);

        if (!Number.isSafeInteger(amount) || amount <= 0) {
            return m.reply(
                `Masukkan jumlah money yang valid!\n\n` +
                `*Ex:* ${usedPrefix}${commandName} @user 10000\n` +
                `*Atau:* ${usedPrefix}${commandName} @user all`
            );
        }

        const newMoney = Math.max(0, currentMoney - amount);

        await updateUser(targetJid, { money: newMoney });

        return m.reply(
            `Sukses mengurangi *Rp${amount.toLocaleString("id-ID")}* money untuk *@${targetJid.split("@")[0]}*.\n` +
            `Sisa money sekarang: *Rp${newMoney.toLocaleString("id-ID")}*`
        );
    }
};