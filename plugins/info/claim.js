import { updateUser } from "../../src/database.js";

export default {
    name: ["claim"],

    execute: async (sock, m, args, settings) => {
        const reply = text => m.reply(text);

        try {
            const userId = m.userId || m.sender;
            const user = global.db?.users?.[userId];

            if (!user) {
                return reply("Data kamu tidak ditemukan di database");
            }

            if (user.claimedFreePremium) {
                return reply("Kamu sudah pernah mengambil bonus Premium gratis sebelumnya");
            }

            const premiumExpiry = Date.now() + 86400000;

            await updateUser(userId, {
                premium: true,
                premiumTime: premiumExpiry,
                claimedFreePremium: true
            });

            const expiredDate = new Date(premiumExpiry).toLocaleString("id-ID", {
                timeZone: "Asia/Jakarta"
            });

            return reply(
                `*[ BERHASIL KLAIM PREMIUM GRATIS! ]*\n\n` +
                `Halo *${user.username || m.name}*,\n` +
                `Kamu berhasil mendapatkan status *Premium selama 1 Hari* sebagai bonus pengguna baru.\n\n` +
                `*Masa Berlaku Hingga:* ${expiredDate} WIB\n\n` +
                `Sekarang kamu bebas menggunakan semua fitur premium bot!`
            );
        } catch (err) {
            console.error(err);
            return reply(settings?.mess?.error || err.message);
        }
    }
};