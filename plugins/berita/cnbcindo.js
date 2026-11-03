import axios from 'axios';

export default {
    name: ['cnbcindo'],
    limit: 2,
    premium: false,

    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        const limit = Math.min(20, Math.max(1, parseInt(args[0], 10) || 5));

        try {
            if (settings?.mess?.wait)
                await m.reply(settings.mess.wait);

            const apiUrl = `${settings.api}/api/berita/cnbcindo?limit=${limit}&apikey=${settings.key}`;
            const { data } = await axios.get(apiUrl, { timeout: 60000 });

            if (!data?.status || !Array.isArray(data?.result) || !data.result.length) {
                await m.reply('Berita tidak ditemukan');
                return false;
            }

            const berita = data.result.slice(0, limit);

            const cleanTitle = title => title
                ?.replace(/\s+/g, ' ')
                .replace(/^(FOTO Internasional|FOTO|Internasional)\s+/i, '')
                .replace(/\s+(News|Opini|Market|Tech|Lifestyle|Research|TV)\s+\d+\s+(menit|jam|hari) yang lalu$/i, '')
                .trim() || 'Tanpa judul';

            const beritaList = berita.map((item, i) => [
                `*${i + 1}. ${cleanTitle(item.title)}*`,
                `Kategori: ${item.category || 'Umum'}`,
                item.date ? `Waktu: ${item.date}` : '',
                item.url ? `Link: ${item.url}` : ''
            ].filter(Boolean).join('\n'));

            const message = [
                '*CNBC INDONESIA NEWS*',
                `Total berita: ${data.total ?? data.result.length}`,
                `Ditampilkan: ${berita.length}`,
                '',
                beritaList.join('\n\n━━━━━━━━━━━━━━\n\n')
            ].join('\n');

            const thumbnail = berita[0]?.image;

            if (thumbnail) {
                try {
                    const image = await axios.get(thumbnail, {
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