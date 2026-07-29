const axios = require('axios');

module.exports = {
    name: ['carbon', 'codeimage'],
    limit: 2,
    premium: false,
    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        try {
            const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            let input = args.join(' ');
            
            if (!input && quoted) {
                input = quoted.conversation || quoted.extendedTextMessage?.text || '';
            }

            if (!input) {
                await m.reply(`*Ex:* ${usedPrefix}${commandName} console.log('Hello World');`);
                return false;
            }

            if (settings?.mess?.wait) await m.reply(settings.mess.wait);

            const apiUrl = `${settings.api}/api/maker/carbon?code=${encodeURIComponent(input)}&apikey=${settings.key}`;
            const { data } = await axios.get(apiUrl);

            if (!data.status || !data.result || !data.result.image) {
                await m.reply('Gagal menghasilkan gambar Carbon.');
                return false;
            }

            let caption = `*✨ ᴄᴀʀʙᴏɴ ᴄᴏᴅᴇ ɢᴇɴᴇʀᴀᴛᴏʀ*\n\n`;
            caption += `*• ᴛʜᴇᴍᴇ:* ${data.result.theme || '-'}\n`;
            caption += `*• ꜰᴏɴᴛ:* ${data.result.font || '-'}`;

            await sock.sendMessage(m.chat || m.from, {
                image: { url: data.result.image },
                caption: caption
            }, { quoted: m });

        } catch (err) {
            console.error(err);
            await m.reply(settings?.mess?.error || err.message);
            return false;
        }
    }
};