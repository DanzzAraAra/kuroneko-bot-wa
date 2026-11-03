import axios from 'axios';

export default {
    name: ['ytmp3'],
    limit: 2,
    premium: false,

    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        const url = args[0];

        if (!url) {
            return m.reply(`*Ex:* ${usedPrefix + commandName} <url>`);
        }

        try {
            if (settings?.mess?.wait) {
                await m.reply(settings.mess.wait);
            }

            const apiUrl = `${settings.api}/api/download/ytmp3?url=${encodeURIComponent(url)}&apikey=${settings.key}`;
            const { data } = await axios.get(apiUrl, { timeout: 60000 });

            if (!data?.status || !data?.result?.downloadUrl) {
                return m.reply('Gagal mengunduh audio');
            }

            const result = data.result;

            await m.reply([
                '*[ YOUTUBE AUDIO ]*',
                '',
                `Judul: ${result.title || '-'}`,
                `Uploader: ${result.uploader || '-'}`,
                `Durasi: ${result.duration || '-'} detik`,
                `Quality: ${result.quality || '-'}`,
                `Ukuran: ${result.filesize_human || '-'}`,
                `Format: ${result.format || 'mp3'}`
            ].join('\n'));

            return sock.sendMessage(m.chat, {
                audio: { url: result.downloadUrl },
                mimetype: 'audio/mpeg',
                fileName: `${result.title || 'audio'}.mp3`
            }, {
                quoted: m
            });
        } catch (err) {
            await m.reply(settings?.mess?.error || err.message);
            return false;
        }
    }
};