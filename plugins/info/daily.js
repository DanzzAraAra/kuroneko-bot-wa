import { updateUser } from "../../src/database.js";

const msToTime = duration => {
    const hours = Math.floor(duration / 3600000);
    const minutes = Math.floor((duration % 3600000) / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);

    return [
        hours && `${hours} Jam`,
        minutes && `${minutes} Menit`,
        seconds && `${seconds} Detik`
    ].filter(Boolean).join(" ");
};

export default {
    name: ["daily"],

    execute: async (sock, m, args, settings) => {
        try {
            const userId = m.userId || m.sender;
            const user = global.db?.users?.[userId];

            if (!user) {
                return m.reply("Kamu belum terdaftar di database");
            }

            const claimAmount = 100;
            const cooldown = 86400000;
            const timeNow = Date.now();

            if (user.lastClaim && timeNow - user.lastClaim < cooldown) {
                const remainingTime = cooldown - (timeNow - user.lastClaim);

                return m.reply(
                    `Kamu sudah mengklaim money harian!\n` +
                    `Silakan kembali dalam: *${msToTime(remainingTime)}*`
                );
            }

            const newMoney = (Number(user.money) || 0) + claimAmount;

            await updateUser(userId, {
                money: newMoney,
                lastClaim: timeNow
            });

            return m.reply(
                `Selamat! Kamu berhasil mengklaim *${claimAmount.toLocaleString("id-ID")} Money* hari ini!\n` +
                `Saldo money kamu sekarang: *${newMoney.toLocaleString("id-ID")}*\n\n` +
                `Jangan lupa kembali lagi besok!`
            );
        } catch (err) {
            console.error(err);
            return m.reply(settings?.mess?.error || err.message);
        }
    }
};