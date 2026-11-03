import axios from 'axios';

export default {
    name: ['cnnindo'],
    limit: 2,
    premium: false,

    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        const limit = Math.min(20, Math.max(1, parseInt(args[0], 10) || 5));

        try {
            if (settings?.mess?.wait)
                await m.reply(settings.mess.wait);

            const apiUrl = `${settings.api}/api/berita/cnnindo?limit=${limit}&apikey=${settings.key}`;
            const { data } = await axios.get(apiUrl, { timeout: 60000 });

            if (!data?.status || !Array.isArray(data?.result) || !data.result.length) {
                await m.reply('Berita tidak ditemukan');
                return false;
            }

            const beritaList = data.result.map((berita, i) => {
                const content = (berita.content || [])
                    .filter(text => text && !/ADVERTISEMENT|SCROLL TO CONTINUE WITH CONTENT|\[Gambas:Video CNN\]/i.test(text))
                    .slice(0, 3);

                const tags = (berita.tags || []).slice(0, 8);

                return [
                    `*${i + 1}. ${berita.title || 'Tanpa judul'}*`,
                    `Kategori: ${berita.category || 'Umum'}`,
                    `Tanggal: ${berita.date || 'Tidak diketahui'}`,
                    '',
                    content.length ? content.join('\n\n') : '',
                    tags.length ? `\n\nTags: ${tags.join(', ')}` : '',
                    berita.url ? `\n\nBaca selengkapnya: ${berita.url}` : ''
                ].filter(Boolean).join('\n');
            });

            await m.reply([
                '*CNN INDONESIA NEWS*',
                `Total berita: ${data.total ?? data.result.length}`,
                '',
                beritaList.join('\n\n━━━━━━━━━━━━━━\n\n')
            ].join('\n'));
        } catch (err) {
            await m.reply(settings?.mess?.error || err.message);
            return false;
        }
    }
};