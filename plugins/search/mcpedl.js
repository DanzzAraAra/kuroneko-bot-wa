const axios = require('axios');

module.exports = {
    name: ['mcpedl', 'mcpdl'],
    limit: 2,
    premium: false,
    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        try {
            const text = args.join(' ');

            if (!text) {
                await m.reply(`*Ex:* ${usedPrefix}${commandName} shader`);
                return false;
            }

            if (settings?.mess?.wait) await m.reply(settings.mess.wait);

            const apiUrl = `${settings.api}/api/search/mcpedl?q=${encodeURIComponent(text)}&apikey=${settings.key}`;
            const { data } = await axios.get(apiUrl);

            if (!data.status || !data.result || data.result.length === 0) {
                await m.reply('Tidak ditemukan hasil dari pencarian MCPEDL.');
                return false;
            }

            let caption = `*MCPEDL SEARCH*\n\n`;
            data.result.slice(0, 10).forEach((item, index) => {
                caption += `*${index + 1}. ${item.title}*\n`;
                caption += `* Rating:* ${item.rating}\n`;
                caption += `* Link:* ${item.link}\n\n`;
            });

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