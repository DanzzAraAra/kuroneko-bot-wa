const axios = require('axios');

module.exports = {
    name: ['saveweb', 'web2zip'],
    limit: 3,
    premium: true,
    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        try {
            const url = args[0];

            if (!url) {
                await m.reply(`*Ex:* ${usedPrefix}${commandName} https://sylvatica.my.id`);
                return false;
            }

            if (settings?.mess?.wait) await m.reply(settings.mess.wait);

            const apiUrl = `${settings.api}/api/tools/saveweb?url=${encodeURIComponent(url)}&apikey=${settings.key}`;
            const { data } = await axios.get(apiUrl);

            if (!data.status || !data.result) {
                await m.reply('Gagal menyimpan website. Pastikan URL valid.');
                return false;
            }

            const { download_url, file_count, url: webUrl } = data.result;

            let caption = `*SAVE WEB RESULT*\n\n`;
            caption += `* Source URL:* ${webUrl || '-'}\n`;
            caption += `* File Count:* ${file_count || 0}\n`;
            caption += `* Link Download:* ${download_url || '-'}`;

            await sock.sendMessage(m.chat || m.from, {
                document: { url: download_url },
                mimetype: 'application/zip',
                fileName: 'saveweb_result.zip',
                caption: caption.trim()
            }, { quoted: m });

        } catch (err) {
            console.error(err);
            await m.reply(settings?.mess?.error || err.message);
            return false;
        }
    }
};