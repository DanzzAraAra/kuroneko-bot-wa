export default {
    name: ["topcmd"],

    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        try {
            const commands = Object.entries(global.db.settings.topcmd || {})
                .map(([name, count]) => ({
                    name,
                    count: Number(count) || 0
                }))
                .filter(command => command.count > 0)
                .sort((a, b) => b.count - a.count)
                .slice(0, 10);

            if (!commands.length) {
                return m.reply("Belum ada statistik penggunaan command.");
            }

            const medals = ["🥇", "🥈", "🥉"];

            const text = commands.map((command, i) => {
                const rank = medals[i] || `*${i + 1}.*`;

                return `${rank} .${command.name}\n   Digunakan: ${command.count.toLocaleString("id-ID")} kali`;
            }).join("\n\n");

            return m.reply(
                `*[ TOP COMMANDS ]*\n\n${text}\n\n> Total: ${commands.length} command`
            );
        } catch (err) {
            return m.reply(settings?.mess?.error || err.message);
        }
    }
};