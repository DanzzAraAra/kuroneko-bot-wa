import axios from 'axios';
import yts from 'yt-search';

export default {
    name: ['play'],
    limit: 2,
    premium: false,

    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        const query = args.join(' ').trim();

        if (!query) {
            return m.reply(`*Ex:* ${usedPrefix + commandName} l'amour toujours`);
        }

        try {
            if (settings?.mess?.wait) {
                await m.reply(settings.mess.wait);
            }

            const search = await yts(query);
            const video = search.videos?.[0];

            if (!video) {
                return m.reply('Audio tidak ditemukan.');
            }

            const apiUrl = `${settings.api}/api/download/ytmp3?url=${encodeURIComponent(video.url)}&apikey=${settings.key}`;
            const { data } = await axios.get(apiUrl, { timeout: 60000 });

            if (!data?.status || !data?.result?.downloadUrl) {
                return m.reply('Gagal mengunduh audio');
            }

            const result = data.result;
            const title = result.title || video.title;

            await m.reply([
                '*[ YOUTUBE PLAY ]*',
                '',
                `Judul: ${title}`,
                `Uploader: ${result.uploader || video.author?.name || '-'}`,
                `Durasi: ${video.timestamp || result.duration || '-'}`,
                `Quality: ${result.quality || '-'}`,
                `Ukuran: ${result.filesize_human || '-'}`,
                `URL: ${video.url}`
            ].join('\n'));

            return sock.sendMessage(m.chat, {
                audio: { url: result.downloadUrl },
                mimetype: 'audio/mpeg',
                fileName: `${title}.mp3`,
                contextInfo: {
                    externalAdReply: {
                        title,
                        body: result.uploader || video.author?.name || 'YouTube',
                        thumbnailUrl: video.thumbnail,
                        sourceUrl: video.url,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, {
                quoted: m
            });
        } catch (err) {
            await m.reply(settings?.mess?.error || err.message);
            return false;
        }
    }
};