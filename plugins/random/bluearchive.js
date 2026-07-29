const axios = require('axios');

module.exports = {
    name: ['bluearchive', 'ba'],
    limit: 1,
    premium: false,
    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        try {
            if (settings?.mess?.wait) await m.reply(settings.mess.wait);

            const apiUrl = `${settings.api}/api/random/bluearchive?apikey=${settings.key}`;
            const response = await axios.get(apiUrl, { responseType: 'arraybuffer' });
            const buffer = Buffer.from(response.data);

            await sock.sendMessage(
                m.chat || m.from,
                {
                    image: buffer,
                    caption: `*✨ ʀᴀɴᴅᴏᴍ ʙʟᴜᴇ ᴀʀᴄʜɪᴠᴇ*`
                },
                { quoted: m }
            );

        } catch (err) {
            console.error(err);
            await m.reply(settings?.mess?.error || err.message);
            return false;
        }
    }
};