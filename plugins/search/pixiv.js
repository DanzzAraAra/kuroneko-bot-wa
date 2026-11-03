import axios from 'axios';

export default {
    name: ['pixiv'],
    limit: 2,
    premium: false,

    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        const q = args.join(' ').trim();

        if (!q) {
            return m.reply(`*Ex:* ${usedPrefix + commandName} yanami anna`);
        }

        try {
            if (settings?.mess?.wait) {
                await m.reply(settings.mess.wait);
            }

            const apiUrl = `${settings.api}/api/search/pixiv?q=${encodeURIComponent(q)}&total=5&apikey=${settings.key}`;
            const { data } = await axios.get(apiUrl, { timeout: 60000 });

            if (!data?.status || !data?.result?.length) {
                return m.reply('Gambar tidak ditemukan');
            }

            const results = data.result.filter(item => item.urls?.length);

            if (!results.length) {
                return m.reply('Gambar tidak tersedia');
            }

            const result = results[Math.floor(Math.random() * results.length)];
            const image = result.urls[Math.floor(Math.random() * result.urls.length)];

            return sock.sendMessage(m.chat || m.from, {
                image: { url: image },
                caption: [
                    '*[ PIXIV ]*',
                    '',
                    `Judul: ${result.title || '-'}`,
                    `Author: ${result.author || '-'}`,
                    `ID: ${result.id || '-'}`,
                    `Jumlah halaman: ${result.pageCount ?? '-'}`,
                    `> Link: https://www.pixiv.net/artworks/${result.id}`
                ].join('\n')
            }, { quoted: m });
        } catch (err) {
            await m.reply(settings?.mess?.error || err.message);
            return false;
        }
    }
};