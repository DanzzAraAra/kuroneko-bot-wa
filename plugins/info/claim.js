const { updateUser } = require('../../src/database.js');

module.exports = {
    name: ['claim'],
    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        const targetJid = m.sender;
        const user = global.db.users[targetJid];
        
        if (!user) return sock.sendMessage(m.from, { text: 'Data kamu tidak ditemukan di database.' }, { quoted: m });

        if (user.claimedFreePremium) {
            return sock.sendMessage(
                m.from, 
                { text: 'Kamu sudah pernah mengambil bonus Premium gratis sebelumnya!' }, 
                { quoted: m }
            );
        }

        const oneDay = 24 * 60 * 60 * 1000;
        const timeNow = Date.now();
        const premiumExpiry = timeNow + oneDay;

        await updateUser(targetJid, { 
            premium: true,
            premiumTime: premiumExpiry,
            claimedFreePremium: true
        });

        const expiredDate = new Date(premiumExpiry).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });

        const responseText = `*BERHASIL KLAIM PREMIUM GRATIS!*\n\n` +
            `Halo *${user.username || m.name}*,\n` +
            `Kamu berhasil mendapatkan status **Premium selama 1 Hari** sebagai bonus pengguna baru.\n\n` +
            `*Masa Berlaku Hingga:* ${expiredDate} WIB\n\n` +
            `Sekarang kamu bebas menggunakan semua fitur premium bot!`;

        await sock.sendMessage(m.from, { text: responseText }, { quoted: m });
    }
};