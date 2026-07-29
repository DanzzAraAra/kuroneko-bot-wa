const axios = require('axios');

module.exports = {
    name: ['ytsum', 'ytsummary'],
    limit: 3,
    premium: true,
    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        try {
            const url = args[0];
            let lang = args[1] ? args[1].toLowerCase() : 'id';

            if (!url) {
                await m.reply(`*Ex:* ${usedPrefix}${commandName} https://youtube.com/watch?v=xxx id\n*Lang:* id / en`);
                return false;
            }

            if (!['en', 'id'].includes(lang)) {
                lang = 'id';
            }

            if (settings?.mess?.wait) await m.reply(settings.mess.wait);

            const apiUrl = `${settings.api}/api/tools/ytsum?url=${encodeURIComponent(url)}&lang=${encodeURIComponent(lang)}&apikey=${settings.key}`;
            const { data } = await axios.get(apiUrl);

            if (!data.status || !data.result) {
                await m.reply('Gagal merangkum video YouTube. Pastikan URL valid.');
                return false;
            }

            const { content, video_thumbnail_url } = data.result;

            if (video_thumbnail_url) {
                await sock.sendMessage(m.chat || m.from, {
                    image: { url: video_thumbnail_url },
                    caption: content || '-'
                }, { quoted: m });
            } else {
                await sock.sendMessage(m.chat || m.from, {
                    text: content || '-'
                }, { quoted: m });
            }

        } catch (err) {
            console.error(err);
            await m.reply(settings?.mess?.error || err.message);
            return false;
        }
    }
};