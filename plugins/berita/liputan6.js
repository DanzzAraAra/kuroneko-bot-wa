import axios from 'axios';

export default {
    name: ['liputan6'],
    limit: 2,
    premium: false,

    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        try {
            if (settings?.mess?.wait)
                await m.reply(settings.mess.wait);

            const apiUrl = `${settings.api}/api/berita/liputan6?apikey=${settings.key}`;
            const { data } = await axios.get(apiUrl, { timeout: 60000 });

            if (!data?.status || !data?.result) {
                await m.reply('Berita tidak ditemukan');
                return false;
            }

            const result = data.result;
            const main = result.headlineMain;
            const headlines = Array.isArray(result.headline) ? result.headline.slice(0, 9) : [];
            const recommendations = Array.isArray(result.rekomendasi) ? result.rekomendasi.slice(0, 10) : [];
            const popular = Array.isArray(result.terpopuler) ? result.terpopuler.slice(0, 5) : [];
            const videos = Array.isArray(result.video) ? result.video.slice(0, 10) : [];

            const formatList = (items, title) => {
                if (!items.length) return '';

                return [
                    `*${title}*`,
                    ...items.map((item, i) => [
                        `\n${i + 1}. *${item.title || 'Tanpa judul'}*`,
                        item.channel ? `Kategori: ${item.channel}` : '',
                        item.time ? `Waktu: ${new Date(item.time).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}` : '',
                        item.duration ? `Durasi: ${item.duration}` : '',
                        item.url ? `Link: ${item.url}` : ''
                    ].filter(Boolean).join('\n'))
                ].join('\n');
            };

            const message = [
                '*LIPUTAN6 NEWS*',
                '',
                main ? [
                    '*HEADLINE UTAMA*',
                    `*${main.title || 'Tanpa judul'}*`,
                    main.channel ? `Kategori: ${main.channel}` : '',
                    main.time ? `Waktu: ${new Date(main.time).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}` : '',
                    main.url ? `Link: ${main.url}` : ''
                ].filter(Boolean).join('\n') : '',
                '',
                formatList(headlines, 'HEADLINE TERBARU'),
                '',
                formatList(recommendations, 'REKOMENDASI'),
                '',
                formatList(popular, 'TERPOPULER'),
                '',
                formatList(videos, 'VIDEO LIPUTAN6')
            ].filter(Boolean).join('\n');

            if (main?.image) {
                try {
                    const image = await axios.get(main.image, {
                        responseType: 'arraybuffer',
                        timeout: 30000
                    });

                    await sock.sendMessage(m.chat, {
                        image: Buffer.from(image.data),
                        caption: message
                    }, { quoted: m });
                } catch {
                    await m.reply(message);
                }
            } else {
                await m.reply(message);
            }
        } catch (err) {
            await m.reply(settings?.mess?.error || err.message);
            return false;
        }
    }
};