import axios from 'axios';

const timeout = 60000;
const maxMediaSize = 50 * 1024 * 1024;

export default {
    name: ['xdl', 'twitterdl'],
    limit: 2,
    premium: false,

    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        const url = args.join(' ').trim();

        if (!url) {
            await m.reply(`*Ex:* ${usedPrefix + commandName} https://x.com/username/status/123456789`);
            return false;
        }

        if (!isXUrl(url)) {
            await m.reply('URL X/Twitter tidak valid');
            return false;
        }

        try {
            if (settings?.mess?.wait)
                await m.reply(settings.mess.wait);

            const apiUrl = `${settings.api}/api/download/x2?url=${encodeURIComponent(url)}&apikey=${settings.key}`;
            const { data } = await axios.get(apiUrl, { timeout });

            if (!data?.status || !Array.isArray(data.data) || !data.data.length) {
                await m.reply(data?.message || 'Media X/Twitter tidak ditemukan');
                return false;
            }

            const items = data.data.filter(item => item?.link);

            if (!items.length) {
                await m.reply('Link media tidak tersedia');
                return false;
            }

            const photos = items.filter(item => /photo|image/i.test(item.resolusi || ''));
            const videos = items.filter(item => /mp4|video/i.test(item.resolusi || ''));

            let selected;

            if (videos.length) {
                selected = videos.reduce((best, item) =>
                    getResolution(item.resolusi) > getResolution(best.resolusi)
                        ? item
                        : best
                );
            } else {
                selected = photos[0] || items[0];
            }

            const response = await axios.get(selected.link, {
                timeout,
                responseType: 'arraybuffer',
                maxContentLength: maxMediaSize,
                maxBodyLength: maxMediaSize,
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });

            const buffer = Buffer.from(response.data);
            const contentType = response.headers['content-type'] || '';

            if (!buffer.length || buffer.length > maxMediaSize) {
                throw new Error('File kosong atau melebihi batas 50 MB');
            }

            const isVideo = contentType.includes('video') ||
                /mp4|video/i.test(selected.resolusi || '');

            if (!isVideo && !contentType.includes('image') &&
                !/photo|image/i.test(selected.resolusi || '')) {
                throw new Error('Format media tidak didukung');
            }

            const caption = [
                '*[ X / TWITTER DOWNLOADER ]*',
                '',
                `> Kualitas: ${selected.resolusi || (isVideo ? 'Video' : 'Photo')}`
            ].join('\n');

            await sock.sendMessage(m.chat, {
                [isVideo ? 'video' : 'image']: buffer,
                mimetype: isVideo ? 'video/mp4' : contentType || 'image/jpeg',
                caption
            }, { quoted: m });

        } catch (err) {
            console.error('[xdl]', err);
            await m.reply(settings?.mess?.error || err.message);
            return false;
        }
    }
};

function getResolution(value) {
    const match = String(value || '').match(/(\d{3,4})p/i);
    return match ? Number(match[1]) : 0;
}

function isXUrl(value) {
    try {
        const url = new URL(value);

        return url.protocol === 'https:' &&
            [
                'x.com',
                'www.x.com',
                'twitter.com',
                'www.twitter.com',
                'mobile.twitter.com'
            ].includes(url.hostname.toLowerCase());
    } catch {
        return false;
    }
}