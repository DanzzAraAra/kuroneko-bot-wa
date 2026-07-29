const axios = require('axios');

module.exports = {
    name: ['yts', 'ytsearch'],
    limit: 2,
    premium: false,
    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        try {
            const text = args.join(' ');

            if (!text) {
                await m.reply(`*Ex:* ${usedPrefix}${commandName} billie eilish`);
                return false;
            }

            if (settings?.mess?.wait) await m.reply(settings.mess.wait);

            const apiUrl = `${settings.api}/api/search/yts?q=${encodeURIComponent(text)}&apikey=${settings.key}`;
            const { data } = await axios.get(apiUrl);

            if (!data.status || !data.result || data.result.length === 0) {
                await m.reply('Pencarian YouTube tidak menemukan hasil.');
                return false;
            }

            let caption = `*YOUTUBE SEARCH*\n\n`;
            data.result.slice(0, 10).forEach((item, index) => { // Tampilkan max 10 hasil
                caption += `*${index + 1}. ${item.title}*\n`;
                caption += `* Duration:* ${item.duration}\n`;
                caption += `* Views:* ${item.views}\n`;
                caption += `* Uploaded:* ${item.uploaded}\n`;
                caption += `* Link:* ${item.url}\n\n`;
            });

             await sock.sendMessage(m.chat || m.from, {
                 text: caption.trim()
             }, { quoted: m });

        } catch (err) {
            console.error(err);
            await m.reply(settings?.mess?.error || err.message);
            return false;
        }
    }
};