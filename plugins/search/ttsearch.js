const axios = require('axios');

module.exports = {
    name: ['ttsearch', 'tiktoksearch'],
    limit: 3,
    premium: false,
    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        try {
            const text = args.join(' ');

            if (!text) {
                await m.reply(`*Ex:* ${usedPrefix}${commandName} blue archive`);
                return false;
            }

            if (settings?.mess?.wait) await m.reply(settings.mess.wait);

            const apiUrl = `${settings.api}/api/search/tiktok?q=${encodeURIComponent(text)}&apikey=${settings.key}`;
            const { data } = await axios.get(apiUrl);

            if (!data.status || !data.result || data.result.length === 0) {
                await m.reply('Video TikTok tidak ditemukan dari pencarian tersebut.');
                return false;
            }

            const randomItem = data.result[Math.floor(Math.random() * data.result.length)];

            let caption = `*TIKTOK SEARCH*\n\n`;
            caption += `* Author:* ${randomItem.author?.nickname || '-'}\n`;
            caption += `* Title:* ${randomItem.title || '-'}\n`;
            caption += `* Likes:* ${randomItem.stats?.likes || 0}\n`;
            caption += `* Plays:* ${randomItem.stats?.plays || 0}\n`;
            caption += `* Comments:* ${randomItem.stats?.comments || 0}`;

            await sock.sendMessage(m.chat || m.from, {
                video: { url: randomItem.link },
                caption: caption.trim()
            }, { quoted: m });

        } catch (err) {
            console.error(err);
            await m.reply(settings?.mess?.error || err.message);
            return false;
        }
    }
};