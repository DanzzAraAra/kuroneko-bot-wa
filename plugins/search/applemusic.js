const axios = require('axios');

module.exports = {
    name: ['applemusic'],
    limit: 2,
    premium: false,
    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        try {
            const text = args.join(' ');

            if (!text) {
                await m.reply(`*Ex:* ${usedPrefix}${commandName} wildflower`);
                return false;
            }

            if (settings?.mess?.wait) await m.reply(settings.mess.wait);

            const apiUrl = `${settings.api}/api/search/applemusic?q=${encodeURIComponent(text)}&apikey=${settings.key}`;
            const { data } = await axios.get(apiUrl);

            if (!data.status || !data.result || data.result.length === 0) {
                await m.reply('Tidak ditemukan hasil dari Apple Music.');
                return false;
            }

            let caption = `*ᴀᴘᴘʟᴇ ᴍᴜꜱɪᴄ ꜱᴇᴀʀᴄʜ*\n\n`;
            data.result.forEach((item, index) => {
                caption += `*${index + 1}. ${item.title}*\n`;
                caption += `*• Artist:* ${item.artist}\n`;
                caption += `*• Link:* ${item.link}\n\n`;
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