const msToTime = (duration) => {
    const seconds = Math.floor((duration / 1000) % 60);
    const minutes = Math.floor((duration / (1000 * 60)) % 60);
    const hours = Math.floor((duration / (1000 * 60 * 60)) % 24);
    const days = Math.floor((duration / (1000 * 60 * 60 * 24)));

    const result = [];
    if (days > 0) result.push(`${days} Hari`);
    if (hours > 0) result.push(`${hours} Jam`);
    if (minutes > 0) result.push(`${minutes} Menit`);
    if (seconds > 0) result.push(`${seconds} Detik`);
    
    return result.length > 0 ? result.join(', ') : 'Beberapa saat lagi';
};

module.exports = {
    name: [ 'profile', 'me' ],
    execute: async (sock, m, args, settings, cmd, prefix) => {
        const { sender, chat, message } = m;
        
        const contextInfo = message?.extendedTextMessage?.contextInfo || {};
        const mentionedJid = contextInfo.mentionedJid || [];
        const quotedJid = contextInfo.participant;
        
        let targetJid = sender;
        if (mentionedJid.length > 0) {
            targetJid = mentionedJid[0];
        } else if (quotedJid) {
            targetJid = m.normalizeJid ? m.normalizeJid(quotedJid) : quotedJid;
        }

        const user = global.db?.users?.[targetJid];

        if (!user) {
            return sock.sendMessage(
                chat, 
                { text: 'Pengguna tidak ditemukan dalam database.' }, 
                { quoted: m }
            );
        }

        const nomor = targetJid.split('@')[0];
        const statusDaftar = user.registered ? 'Sudah' : 'Belum';
        const statusBanned = user.banned ? 'Ya' : 'Tidak';
        const displayUsername = user.username ? `@${user.username}` : 'Belum diatur';
        const displayAge = user.age ? `${user.age} Tahun` : 'Belum diatur';
        const displayLimit = user.limit ?? 0;

        let premiumStatus = 'Bukan Premium';
        if (user.premium) {
            const timeRemaining = user.premiumTime - Date.now();
            premiumStatus = timeRemaining > 0 
                ? `Aktif (Sisa: ${msToTime(timeRemaining)})` 
                : 'Kedaluwarsa';
        }

        const profileText = `
*[ PROFILE ]*
• *Nama:* ${user.name || 'Unknown'}
• *Username:* ${displayUsername}
• *Umur:* ${displayAge}
• *Nomor:* ${nomor}
• *Role:* ${user.role || 'User'}

*[ STATUS ]*
• Terdaftar: ${statusDaftar}
• Limit: ${displayLimit}
• Premium: ${premiumStatus}
• Banned: ${statusBanned}
`.trim();

        await sock.sendMessage(
            chat, 
            { text: profileText }, 
            { quoted: m }
        );
    }
};