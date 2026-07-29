const axios = require('axios');

module.exports = {
    name: ['ssweb'],
    limit: 2,
    premium: false,
    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        try {
            const url = args[0];

            if (!url) {
                await m.reply(`*Ex:* ${usedPrefix}${commandName} https://sylvatica.my.id`);
                return false;
            }

            if (settings?.mess?.wait) await m.reply(settings.mess.wait);

            const apiUrl = `${settings.api}/api/tools/ssweb?url=${encodeURIComponent(url)}&apikey=${settings.key}`;
            
            const { data } = await axios.get(apiUrl, {
                responseType: 'arraybuffer'
            });

            if (!data) {
                await m.reply('Gagal mengambil screenshot website.');
                return false;
            }

            let caption = `*SSWEB RESULT*\n\n`;
            caption += `* URL:* ${url}`;

            await sock.sendMessage(m.chat || m.from, {
                image: data,
                caption: caption.trim()
            }, { quoted: m });

        } catch (err) {
            console.error(err);
            await m.reply(settings?.mess?.error || err.message);
            return false;
        }
    }
};