import axios from 'axios';

export default {
    name: ['fbdl', 'facebook'],
    limit: 2,
    premium: false,

    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        const url = args.join(' ').trim();

        if (!url) {
            await m.reply(`*Ex:* ${usedPrefix + commandName} https://www.facebook.com/watch/?v=123456`);
            return false;
        }

        try {
            if (settings?.mess?.wait)
                await m.reply(settings.mess.wait);

            const apiUrl = `${settings.api}/api/download/facebook?url=${encodeURIComponent(url)}&apikey=${settings.key}`;
            const { data } = await axios.get(apiUrl, { timeout: 60000 });

            if (!data?.status || !data?.result?.links?.length) {
                await m.reply('Video tidak ditemukan');
                return false;
            }

            const result = data.result;
            const links = result.links;
            const video = links.find(item => /720p.*HD|HD.*720p/i.test(item.quality))
                || links.find(item => /HD/i.test(item.quality))
                || links[0];

            if (!video?.url) {
                await m.reply('Link video tidak tersedia');
                return false;
            }

            const caption = [
                '*[ FACEBOOK ]*',
                '',
                `> Judul: ${result.title || 'Facebook Video'}`,
                `> Durasi: ${result.duration || '-'}`,
                `> Kualitas: ${video.quality || 'HD'}`
            ].join('\n');

            await sock.sendMessage(m.chat, {
                video: { url: video.url },
                mimetype: 'video/mp4',
                caption
            }, { quoted: m });
        } catch (err) {
            await m.reply(settings?.mess?.error || err.message);
            return false;
        }
    }
};