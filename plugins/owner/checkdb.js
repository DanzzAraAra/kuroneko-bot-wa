const mongoose = require('mongoose');
const { User } = require('../../src/database');

module.exports = {
    name: 'checkdb',
    execute: async (sock, m, args, settings) => {
        if (!m.isOwner) {
            return sock.sendMessage(m.from, { text: settings.mess.owner }, { quoted: m });
        }

        const states = {
            0: 'Terputus 🔴',
            1: 'Terhubung 🟢',
            2: 'Menghubungkan 🟡',
            3: 'Memutuskan 🟠'
        };

        const stateCode = mongoose.connection.readyState;
        const statusText = states[stateCode] || 'Unknown ⚪';

        let totalDbUsers = 0;
        let totalBannedDb = 0;

        if (stateCode === 1) {
            totalDbUsers = await User.countDocuments();
            totalBannedDb = await User.countDocuments({ banned: true });
        }

        const totalCacheUsers = Object.keys(global.db.users).length;
        const totalBannedCache = Object.values(global.db.users).filter(u => u.banned).length;

        const text = `*STATUS DATABASE*\n\n` +
                     `Koneksi: ${statusText}\n` +
                     `User DB: ${totalDbUsers} (Banned: ${totalBannedDb})\n` +
                     `User Cache: ${totalCacheUsers} (Banned: ${totalBannedCache})\n` +
                     `Uptime: ${process.uptime().toFixed(2)} detik`;

        await sock.sendMessage(m.from, { text: text }, { quoted: m });
    }
};