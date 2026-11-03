import axios from 'axios';

export default {
    name: ['tiktok', 'tt', 'ttdl'],
    limit: 3,
    premium: false,

    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        const url = args.join(' ').trim();

        if (!url) {
            await m.reply(`*Ex:* ${usedPrefix + commandName} https://www.tiktok.com/@user/video/123456`);
            return false;
        }

        try {
            if (settings?.mess?.wait)
                await m.reply(settings.mess.wait);

            const apiUrl = `${settings.api}/api/download/tiktok?url=${encodeURIComponent(url)}&apikey=${settings.key}`;
            const { data } = await axios.get(apiUrl, { timeout: 60000 });

            if (!data?.status || !data?.result) {
                await m.reply('Video tidak ditemukan atau gagal diunduh');
                return false;
            }

            const result = data.result;
            const videoUrl = result.downloads?.nowm?.[0];
            const mp3Url = result.mp3?.[0];

            if (!videoUrl) {
                await m.reply('Link video tanpa watermark tidak tersedia');
                return false;
            }

            const caption = [
                '*[ TIKTOK ]*',
                '',
                `> Username: @${result.username || '-'}`,
                `> Durasi: ${result.duration || '-'}`,
                `> Views: ${result.views || '0'}`,
                `> Likes: ${result.likes || '0'}`,
                `> Komentar: ${result.comments || '0'}`,
                `> Shares: ${result.shares || '0'}`,
                `> Bookmarks: ${result.bookmarks || '0'}`
            ].join('\n');

            const videoResponse = await axios.get(videoUrl, {
                responseType: 'arraybuffer',
                timeout: 120000,
                maxContentLength: 200 * 1024 * 1024
            });

            await sock.sendMessage(m.chat, {
                video: Buffer.from(videoResponse.data),
                mimetype: 'video/mp4',
                caption
            }, { quoted: m });

            if (mp3Url) {
                try {
                    const audioResponse = await axios.get(mp3Url, {
                        responseType: 'arraybuffer',
                        timeout: 120000,
                        maxContentLength: 50 * 1024 * 1024
                    });

                    await sock.sendMessage(m.chat, {
                        audio: Buffer.from(audioResponse.data),
                        mimetype: 'audio/mpeg',
                        fileName: `tiktok_${result.username || 'audio'}.mp3`
                    }, { quoted: m });
                } catch (err) {
                    await m.reply('Video berhasil dikirim, tetapi audio gagal diunduh');
                }
            }
        } catch (err) {
            await m.reply(settings?.mess?.error || err.message);
            return false;
        }
    }
};