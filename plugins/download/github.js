import axios from 'axios';

export default {
    name: ['github', 'git'],
    limit: 2,
    premium: false,

    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        const url = args.join(' ').trim();

        if (!url) {
            await m.reply(`*Ex:* ${usedPrefix + commandName} https://github.com/DanzzAraAra/kuroneko-base-api`);
            return false;
        }

        try {
            if (settings?.mess?.wait)
                await m.reply(settings.mess.wait);

            const apiUrl = `${settings.api}/api/download/github?url=${encodeURIComponent(url)}&apikey=${settings.key}`;
            const { data } = await axios.get(apiUrl, { timeout: 60000 });

            if (!data?.status || !data?.data?.download_url) {
                await m.reply('Repository gagal diunduh atau tidak ditemukan');
                return false;
            }

            const repo = data.data;
            const response = await axios.get(repo.download_url, {
                responseType: 'arraybuffer',
                timeout: 120000,
                maxContentLength: 200 * 1024 * 1024,
                maxBodyLength: 200 * 1024 * 1024
            });

            const filename = repo.filename || `${repo.user || 'github'}-${repo.repo || 'repository'}.zip`;

            await sock.sendMessage(m.chat, {
                document: Buffer.from(response.data),
                mimetype: 'application/zip',
                fileName: filename,
                caption: [
                    '*[ GITHUB ]*',
                    '',
                    `> Repository: ${repo.repo || '-'}`,
                    `> Owner: ${repo.user || '-'}`,
                    `> File: ${filename}`
                ].join('\n')
            }, { quoted: m });
        } catch (err) {
            await m.reply(settings?.mess?.error || err.message);
            return false;
        }
    }
};