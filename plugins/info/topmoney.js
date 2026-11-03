export default {
    name: ["topmoney"],

    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        try {
            const users = Object.entries(global.db.users || {})
                .map(([jid, user]) => ({
                    username: user.username || "Unknown",
                    money: Number(user.money) || 0
                }))
                .filter(user => user.money > 0)
                .sort((a, b) => b.money - a.money)
                .slice(0, 10);

            if (!users.length) {
                return m.reply("Belum ada pengguna");
            }

            const medals = ["🥇", "🥈", "🥉"];

            const text = users.map((user, i) => {
                const rank = medals[i] || `*${i + 1}.*`;

                return `${rank} ${user.username}\n   Money: Rp${user.money.toLocaleString("id-ID")}`;
            }).join("\n\n");

            return m.reply(`*[ TOP MONEY ]*\n\n${text}\n\n> Total: ${users.length} user`);
        } catch (err) {
            return m.reply(settings?.mess?.error || err.message);
        }
    }
};