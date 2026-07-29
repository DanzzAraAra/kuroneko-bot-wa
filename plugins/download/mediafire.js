const axios = require('axios');

module.exports = {
    name: ['mediafire', 'mf', 'mfdl'],
    limit: 2,
    premium: false,
    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        const url = args[0];
        
        if (!url) {
            await m.reply(`Ketik: ${usedPrefix}${commandName} <url mediafire>`);
            return false;
        }
        
        if (!url.includes('mediafire.com')) {
            await m.reply('URL harus valid');
            return false;
        }

        if (settings?.mess?.wait) {
            await m.reply(settings.mess.wait);
        }

        try {
            const apiUrl = `${settings.api}/api/download/mediafire?url=${encodeURIComponent(url)}&apikey=${settings.key}`;
            const { data } = await axios.get(apiUrl);

            if (!data.status || !data.result) {
                await m.reply('Gagal mengambil data file.');
                return false;
            }
            
            const mfData = data.result;

            let caption = `*✨ ᴍᴇᴅɪᴀꜰɪʀᴇ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ*\n\n`;
            caption += `*• ɴᴀᴍᴇ:* ${mfData.filename || '-'}\n`;
            caption += `*• ꜱɪᴢᴇ:* ${mfData.filesize || '-'}\n`;
            caption += `*• ᴛʏᴘᴇ:* ${mfData.filetype || '-'}\n`;
            caption += `*• ᴜᴘʟᴏᴀᴅ:* ${mfData.upload_date || '-'}`;

            await sock.sendMessage(m.chat || m.from, {
                document: { url: mfData.link },
                fileName: mfData.filename,
                mimetype: 'application/octet-stream',
                caption: caption
            }, { quoted: m });

        } catch (err) {
            console.error(err);
            await m.reply(settings?.mess?.error || err.message);
            return false;
        }
    }
};