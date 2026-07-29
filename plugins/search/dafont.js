const axios = require('axios');

module.exports = {
    name: ['dafont', 'fontsearch'],
    limit: 3,
    premium: false,
    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        try {
            const text = args.join(' ');

            if (!text) {
                await m.reply(`*Ex:* ${usedPrefix}${commandName} style`);
                return false;
            }

            if (settings?.mess?.wait) await m.reply(settings.mess.wait);

            const apiUrl = `${settings.api}/api/search/dafont?q=${encodeURIComponent(text)}&apikey=${settings.key}`;
            const { data } = await axios.get(apiUrl);

            if (!data.status || !data.result || data.result.length === 0) {
                await m.reply('Tidak ditemukan font dari pencarian Dafont.');
                return false;
            }

            let caption = `*ᴅᴀꜰᴏɴᴛ ꜱᴇᴀʀᴄʜ*\n\n`;
            data.result.slice(0, 10).forEach((item, index) => {
                caption += `*${index + 1}. ${item.name}*\n`;
                caption += `*• Downloads:* ${item.downloads}\n`;
                caption += `*• Download Link:* ${item.download}\n\n`;
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