export default {
    name: ["toplimit"],

    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        try {
            const users = Object.entries(global.db.users || {})
                .map(([jid, user]) => ({
                    username: user.username || "Unknown",
                    limit: Number(user.limit) || 0
                }))
                .filter(user => user.limit > 0)
                .sort((a, b) => b.limit - a.limit)
                .slice(0, 10);

            if (!users.length) {
                return m.reply("Belum ada pengguna dengan limit.");
            }

            const medals = ["🥇", "🥈", "🥉"];

            const text = users.map((user, i) => {
                const rank = medals[i] || `*${i + 1}.*`;

                return `${rank} ${user.username}\n   Limit: ${user.limit.toLocaleString("id-ID")}`;
            }).join("\n\n");

            return m.reply(`*[ TOP LIMIT ]*\n\n${text}\n\n> Total: ${users.length} user`);
        } catch (err) {
            return m.reply(settings?.mess?.error || err.message);
        }
    }
};