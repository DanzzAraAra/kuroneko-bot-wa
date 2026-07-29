const axios = require('axios');

module.exports = {
    name: ['github', 'git', 'ghdl'],
    limit: 3,
    premium: false,
    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        const url = args[0];
        
        if (!url) {
            await m.reply(`Ketik: ${usedPrefix}${commandName} <url repository github>`);
            return false;
        }
        
        if (!url.includes('github.com')) {
            await m.reply('URL harus valid');
            return false;
        }

        if (settings?.mess?.wait) {
            await m.reply(settings.mess.wait);
        }

        try {
            const apiUrl = `${settings.api}/api/download/github?url=${encodeURIComponent(url)}&apikey=${settings.key}`;
            const { data } = await axios.get(apiUrl);

            if (!data.status || !data.data) {
                await m.reply('Gagal mengambil data repository.');
                return false;
            }
            
            const repoData = data.data;

            await sock.sendMessage(m.chat || m.from, {
                document: { url: repoData.download_url },
                fileName: repoData.filename || `${repoData.repo}.zip`,
                mimetype: 'application/zip'
            }, { quoted: m });

        } catch (err) {
            console.error(err);
            await m.reply(settings?.mess?.error || err.message);
            return false;
        }
    }
};
