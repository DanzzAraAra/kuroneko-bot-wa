export default {
    name: 'listban',
    execute: async (sock, m, args, settings) => {
        if (!m.isOwner) {
            return sock.sendMessage(m.from, { text: settings.mess.owner }, { quoted: m })
        }

        const users = global.db.users
        const bannedUsers = Object.entries(users).filter(([jid, data]) => data.banned)

        if (!bannedUsers.length) {
            return sock.sendMessage(m.from, { text: 'Tidak ada user yang di banned' }, { quoted: m })
        }

        let text = `*LIST BANNED USER*\nTotal: ${bannedUsers.length} user\n\n`

        bannedUsers.forEach(([jid, data], index) => {
            const number = jid.split('@')[0]
            text += `${index + 1} ${data.name || 'Unknown'}\nwa.me/${number}\n\n`
        })

        await sock.sendMessage(m.from, { text: text.trim() }, { quoted: m })
    }
}