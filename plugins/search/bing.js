const axios = require('axios');

module.exports = {
    name: ['bing', 'bingsearch'],
    limit: 2,
    premium: false,
    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        try {
            const text = args.join(' ');

            if (!text) {
                await m.reply(`*Ex:* ${usedPrefix}${commandName} cottage cheese`);
                return false;
            }

            if (settings?.mess?.wait) await m.reply(settings.mess.wait);

            const apiUrl = `${settings.api}/api/search/bing?q=${encodeURIComponent(text)}&apikey=${settings.key}`;
            const { data } = await axios.get(apiUrl);

            if (!data.status || !data.result || (!data.result.images && !data.result.videos && !data.result.web)) {
                await m.reply('Tidak ditemukan hasil dari pencarian Bing.');
                return false;
            }

            let caption = `*ʙɪɴɢ ꜱᴇᴀʀᴄ🇭*\n\n`;

            if (data.result.images && data.result.images.length > 0) {
                caption += `*• Images (${data.result.images.length}):*\n`;
                data.result.images.slice(0, 5).forEach((img, index) => {
                    caption += `  ${index + 1}. ${img.title}\n`;
                    caption += `     🔗 ${img.sourceUrl}\n`;
                });
                caption += `\n`;
            }

            if (data.result.videos && data.result.videos.length > 0) {
                caption += `*• Videos (${data.result.videos.length}):*\n`;
                data.result.videos.slice(0, 3).forEach((vid, index) => {
                    caption += `  ${index + 1}. ${vid.title}\n`;
                    caption += `     🔗 ${vid.link}\n`;
                });
            }

            await sock.sendMessage(m.chat || m.from, {
                text: caption.trim(),
                linkPreview: false
            }, { quoted: m });

        } catch (err) {
            console.error(err);
            await m.reply(settings?.mess?.error || err.message);
            return false;
        }
    }
};