const { updateUser } = require('../../src/database.js');

const msToTime = (duration) => {
    let seconds = Math.floor((duration / 1000) % 60),
        minutes = Math.floor((duration / (1000 * 60)) % 60),
        hours = Math.floor((duration / (1000 * 60 * 60)) % 24);
    
    let timeStr = [];
    if (hours > 0) timeStr.push(`${hours} Jam`);
    if (minutes > 0) timeStr.push(`${minutes} Menit`);
    if (seconds > 0) timeStr.push(`${seconds} Detik`);
    
    return timeStr.join(' ');
};

module.exports = {
    name: ['daily'],
    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        const targetJid = m.sender;
        const user = global.db.users[targetJid];
        
        if (!user) return m.reply('Kamu belum terdaftar di database.');

        const claimAmount = 3;
        const cooldown = 24 * 60 * 60 * 1000;
        const timeNow = Date.now();

        if (user.lastClaim && timeNow - user.lastClaim < cooldown) {
            const remainingTime = cooldown - (timeNow - user.lastClaim);
            return m.reply(`Kamu sudah mengklaim limit gratis hari ini!\nSilakan kembali dalam: *${msToTime(remainingTime)}*`);
        }

        const currentLimit = user.limit || 0;
        const newLimit = currentLimit + claimAmount;

        await updateUser(targetJid, { 
            limit: newLimit,
            lastClaim: timeNow 
        });

        m.reply(`Selamat! Kamu berhasil mengklaim *${claimAmount} Limit* gratis hari ini.\nSisa limit kamu sekarang: *${newLimit}*\n\nJangan lupa kembali lagi besok!`);
    }
};