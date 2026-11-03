import axios from 'axios';

export default {
    name: ['instagram', 'igdl'],
    limit: 2,
    premium: false,

    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        const url = args.join(' ').trim();

        if (!url) {
            await m.reply(`*Ex:* ${usedPrefix + commandName} https://www.instagram.com/reel/xxxx/`);
            return false;
        }

        try {
            if (settings?.mess?.wait)
                await m.reply(settings.mess.wait);

            const apiUrl = `${settings.api}/api/download/instagram?url=${encodeURIComponent(url)}&apikey=${settings.key}`;
            const { data } = await axios.get(apiUrl, { timeout: 60000 });

            if (!data?.status || !data?.result?.media?.length) {
                await m.reply('Media Instagram tidak ditemukan atau gagal diunduh.');
                return false;
            }

            const result = data.result;
            const author = result.author || {};
            const caption = [
                '*[ INSTAGRAM ]*',
                '',
                `> Username: ${author.username ? `@${author.username}` : '-'}`,
                `> Tipe: ${result.type || 'Media'}`,
                `> Likes: ${result.stats?.like ?? 0}`,
                `> Komentar: ${result.stats?.comments ?? 0}`,
                '',
                result.caption || ''
            ].join('\n');

            for (let i = 0; i < result.media.length; i++) {
                const mediaUrl = result.media[i];

                try {
                    const response = await axios.get(mediaUrl, {
                        responseType: 'arraybuffer',
                        timeout: 120000,
                        maxContentLength: 200 * 1024 * 1024
                    });

                    const buffer = Buffer.from(response.data);
                    const contentType = response.headers['content-type'] || '';
                    const isVideo = result.type === 'video' || contentType.includes('video');
                    const isImage = contentType.includes('image');

                    await sock.sendMessage(m.chat, {
                        ...(isVideo
                            ? { video: buffer, mimetype: 'video/mp4' }
                            : isImage
                                ? { image: buffer }
                                : { document: buffer, mimetype: contentType || 'application/octet-stream', fileName: `instagram_${i + 1}` }),
                        caption: i === 0 ? caption : `Media ${i + 1}`
                    }, { quoted: m });
                } catch {
                    await m.reply(`Gagal mengambil media ke-${i + 1}.`);
                }
            }
        } catch (err) {
            await m.reply(settings?.mess?.error || err.message);
            return false;
        }
    }
};