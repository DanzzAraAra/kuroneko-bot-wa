module.exports = {
    name: 'listban',
    execute: async (sock, m, args, settings) => {
        if (!m.isOwner) {
            return sock.sendMessage(m.from, { text: settings.mess.owner }, { quoted: m });
        }

        const users = global.db.users;
        const bannedUsers = Object.entries(users).filter(([jid, data]) => data.banned);

        if (bannedUsers.length === 0) {
            return sock.sendMessage(m.from, { text: 'Tidak ada user yang di-banned saat ini.' }, { quoted: m });
        }

        let text = `*LIST BANNED USER*\nTotal: ${bannedUsers.length} user\n\n`;

        bannedUsers.forEach(([jid, data], index) => {
            const number = jid.split('@')[0];
            const name = data.name || 'Unknown';
            text += `${index + 1}. ${name}\nwa.me/${number}\n\n`;
        });

        await sock.sendMessage(m.from, { text: text.trim() }, { quoted: m });
    }
};