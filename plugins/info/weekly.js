import { updateUser } from "../../src/database.js";

const msToTime = duration => {
    const days = Math.floor(duration / 86400000);
    const hours = Math.floor((duration % 86400000) / 3600000);
    const minutes = Math.floor((duration % 3600000) / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);

    return [
        days && `${days} Hari`,
        hours && `${hours} Jam`,
        minutes && `${minutes} Menit`,
        seconds && `${seconds} Detik`
    ].filter(Boolean).join(" ");
};

export default {
    name: ["weekly"],

    execute: async (sock, m, args, settings) => {
        try {
            const userId = m.userId || m.sender;
            const user = global.db?.users?.[userId];

            if (!user) {
                return m.reply("Kamu belum terdaftar di database");
            }

            const claimAmount = 700;
            const cooldown = 7 * 86400000;
            const timeNow = Date.now();

            if (user.lastWeekly && timeNow - user.lastWeekly < cooldown) {
                const remainingTime = cooldown - (timeNow - user.lastWeekly);

                return m.reply(
                    `Kamu sudah mengklaim money mingguan!\n` +
                    `Silakan kembali dalam: *${msToTime(remainingTime)}*`
                );
            }

            const newMoney = (Number(user.money) || 0) + claimAmount;

            await updateUser(userId, {
                money: newMoney,
                lastWeekly: timeNow
            });

            return m.reply(
                `Selamat! Kamu berhasil mengklaim *${claimAmount.toLocaleString("id-ID")} Money* mingguan!\n` +
                `Saldo money kamu sekarang: *${newMoney.toLocaleString("id-ID")}*\n\n` +
                `Jangan lupa kembali lagi minggu depan!`
            );
        } catch (err) {
            console.error(err);
            return m.reply(settings?.mess?.error || err.message);
        }
    }
};