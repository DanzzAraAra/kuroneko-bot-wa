import axios from 'axios';

export default {
    name: ['ytmp4'],
    limit: 3,
    premium: false,

    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        const url = args[0];
        const quality = args[1] || '';

        if (!url) {
            return m.reply(
                `*Ex:* ${usedPrefix + commandName} <url> [quality]\n\n` +
                '*Quality:* 144, 240, 360, 480, 720, 1080'
            );
        }

        if (quality && !['144', '240', '360', '480', '720', '1080'].includes(quality)) {
            return m.reply('Quality tersedia: 144, 240, 360, 480, 720, 1080');
        }

        try {
            if (settings?.mess?.wait) {
                await m.reply(settings.mess.wait);
            }

            const apiUrl = `${settings.api}/api/download/ytmp4?url=${encodeURIComponent(url)}&quality=${quality}&apikey=${settings.key}`;
            const { data } = await axios.get(apiUrl, { timeout: 60000 });

            if (!data?.status || !data?.result?.downloadUrl) {
                return m.reply('Gagal mengunduh video');
            }

            const result = data.result;
            const caption = [
                '*[ YOUTUBE VIDEO ]*',
                '',
                `Judul: ${result.title || '-'}`,
                `Durasi: ${result.duration || '-'} detik`,
                `Quality: ${result.quality || '-'}`,
                `Ukuran: ${result.filesize_human || '-'}`,
                `Format: ${result.format || 'mp4'}`
            ].join('\n');

            return sock.sendMessage(m.chat, {
                video: { url: result.downloadUrl },
                mimetype: 'video/mp4',
                fileName: `${result.title || 'video'}.mp4`,
                caption
            }, {
                quoted: m
            });
        } catch (err) {
            await m.reply(settings?.mess?.error || err.message);
            return false;
        }
    }
};