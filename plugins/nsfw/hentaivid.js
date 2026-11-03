export default {
    name: ["hentaivid"],
    nsfw: true,
    limit: 3,

    execute: async (sock, m, args, settings) => {
        try {
            await m.reply(settings.mess.wait);
            const params = new URLSearchParams({
                apikey: settings.key
            });
            const response = await fetch(
                `${settings.api}/api/random/hentaivid?${params}`
            );
            const result = await response.json();
            if (!response.ok || !result.status) {
                return m.reply(result.message || settings.mess.error);
            }
            const data = result.result;
            const getVideoUrl = value => {
                if (typeof value === "string") return value;
                if (Array.isArray(value)) {
                    return getVideoUrl(value[Math.floor(Math.random() * value.length)]);
                }
                if (value && typeof value === "object") {
                    return value.url || value.video || value.link;
                }
                return null;
            };
            const videoUrl = getVideoUrl(data);
            if (!videoUrl || !/^https?:\/\//i.test(videoUrl)) {
                return m.reply("URL video tidak ditemukan.");
            }
            return sock.sendMessage(m.from, {
                video: { url: videoUrl },
                mimetype: "video/mp4",
                caption: "*[ RANDOM HENTAI VIDEO ]*\n\n> Enjoy the video!"
            }, { quoted: m });
        } catch (err) {
            console.error("[Hentai Video]", err);
            return m.reply(settings?.mess?.error || err.message);
        }
    }
};