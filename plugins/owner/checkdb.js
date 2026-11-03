import mongoose from 'mongoose';
import { User } from '../../src/database.js';

export default {
    name: 'checkdb',
    
    execute: async (sock, m, args, settings) => {
        if (!m.isOwner) {
            return sock.sendMessage(
                m.from,
                { text: settings.mess.owner },
                { quoted: m }
            );
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
            totalBannedDb = await User.countDocuments({
                banned: true
            });
        }
        const users = global.db?.users || {};
        const totalCacheUsers = Object.keys(users).length;
        const totalBannedCache = Object.values(users)
            .filter(user => user.banned)
            .length;
        const text =
            `*STATUS DATABASE*\n\n` +
            `Koneksi: ${statusText}\n` +
            `User DB: ${totalDbUsers} (Banned: ${totalBannedDb})\n` +
            `User Cache: ${totalCacheUsers} (Banned: ${totalBannedCache})\n` +
            `Uptime: ${process.uptime().toFixed(2)} detik`;
        await sock.sendMessage(
            m.from,
            { text },
            { quoted: m }
        );
    }
};