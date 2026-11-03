export default {
    name: ["nekopoi-search"],
    nsfw: true,
    limit: 1,

    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        const query = args.join(" ").trim();
        const page = /^\d+$/.test(args.at(-1)) && args.length > 1
            ? args.pop()
            : "1";

        if (!args.length) {
            return m.reply(`*Ex:* ${usedPrefix + commandName} kaede to suzu`
            );
        }

        const search = args.join(" ").trim();

        try {
            await m.reply(settings.mess.wait);

            const params = new URLSearchParams({
                query: search,
                page,
                apikey: settings.key
            });

            const response = await fetch(
                `${settings.api}/api/nsfw/nekopoi-search?${params}`
            );

            const result = await response.json();

            if (!response.ok || !result.status) {
                return m.reply(result.message || settings.mess.error);
            }

            if (!Array.isArray(result.result) || !result.result.length) {
                return m.reply(`Tidak ditemukan hasil untuk: ${search}`);
            }

            const results = result.result.map((item, index) =>
                `*${index + 1}. ${item.title}*\n` +
                `> Genres: ${item.genres || "Unknown"}\n` +
                `> ${item.url}`
            );

            return m.reply(
                `*[ NEKOPOI SEARCH ]*\n\n` +
                `> Query: ${search}\n` +
                `> Page: ${page}\n` +
                `> Total Results: ${result.result.length}\n\n` +
                results.join("\n\n")
            );
        } catch (err) {
            console.error("[Nekopoi Search]", err);
            return m.reply(settings?.mess?.error || err.message);
        }
    }
};