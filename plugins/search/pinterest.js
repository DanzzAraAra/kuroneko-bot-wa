const axios = require('axios');

module.exports = {
    name: ['pinterest', 'pin'],
    limit: 2,
    premium: false,
    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        try {
            const text = args.join(' ');

            if (!text) {
                await m.reply(`*Ex:* ${usedPrefix}${commandName} anime girl`);
                return false;
            }

            if (settings?.mess?.wait) await m.reply(settings.mess.wait);

            const apiUrl = `${settings.api}/api/search/pinterest?query=${encodeURIComponent(text)}&apikey=${settings.key}`;
            const { data } = await axios.get(apiUrl);

            if (!data.status || !data.result || data.result.length === 0) {
                await m.reply('Gambar tidak ditemukan.');
                return false;
            }

            const randomItem = data.result[Math.floor(Math.random() * data.result.length)];

            let caption = `*PINTEREST SEARCH*\n\n`;
            caption += `*Title:* ${randomItem.title || '-'}\n`;
            caption += `*Board:* ${randomItem.board || '-'}\n`;
            caption += `*Username:* ${randomItem.username || '-'}\n`;
            caption += `*Source:* ${randomItem.source || '-'}`;

            await sock.sendMessage(m.chat || m.from, {
                image: { url: randomItem.image },
                caption: caption.trim()
            }, { quoted: m });

        } catch (err) {
            console.error(err);
            await m.reply(settings?.mess?.error || err.message);
            return false;
        }
    }
};