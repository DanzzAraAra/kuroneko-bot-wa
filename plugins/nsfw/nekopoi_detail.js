export default {
    name: ["nekopoi-detail"],
    nsfw: true,
    limit: 1,

    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        const url = args.join(" ").trim();
        if (!url) {
            return m.reply(
                `*Ex:* ${usedPrefix + commandName} https://nekopoi.care/hentai/example/`
            );
        }
        try {
            await m.reply(settings.mess.wait);
            const params = new URLSearchParams({
                slug: url,
                apikey: settings.key
            });
            const response = await fetch(
                `${settings.api}/api/nsfw/nekopoi-detail?${params}`
            );
            const result = await response.json();
            if (!response.ok || !result.status) {
                return m.reply(result.message || settings.mess.error);
            }
            const data = result.result;
            if (!data) {
                return m.reply("Detail tidak ditemukan.");
            }
            const metadata = Object.entries(data.metadata || {})
                .map(([key, value]) => `> ${key}: ${value || "Unknown"}`)
                .join("\n");
            const episodes = (data.episodes || [])
                .map(item =>
                    `*${item.badge || "Episode"}*\n` +
                    `> ${item.title}\n` +
                    `> Date: ${item.date || "Unknown"}\n` +
                    `> ${item.url}`
                )
                .join("\n\n");

            const caption =
                `*[ NEKOPOI DETAIL ]*\n\n` +
                `*${data.title || "Unknown"}*\n\n` +
                `${data.synopsis || "No synopsis"}\n\n` +
                `*[ METADATA ]*\n` +
                `${metadata || "No metadata"}\n\n` +
                `*[ EPISODE ]*\n` +
                `${episodes || "No episodes"}\n\n` +
                `> URL: ${data.url || url}`;

            if (data.poster) {
                return sock.sendMessage(m.from, {
                    image: { url: data.poster },
                    caption
                }, { quoted: m });
            }

            return m.reply(caption);
        } catch (err) {
            console.error("[Nekopoi Detail]", err);
            return m.reply(settings?.mess?.error || err.message);
        }
    }
};