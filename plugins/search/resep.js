import axios from 'axios';

export default {
    name: ['resep', 'resepkoki'],
    limit: 3,
    premium: false,

    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        const q = args.join(' ').trim();

        if (!q) {
            return m.reply(`*Ex:* ${usedPrefix + commandName} nasi goreng`);
        }

        try {
            if (settings?.mess?.wait) {
                await m.reply(settings.mess.wait);
            }

            const apiUrl = `${settings.api}/api/search/resepkoki?q=${encodeURIComponent(q)}&apikey=${settings.key}`;
            const { data } = await axios.get(apiUrl, { timeout: 60000 });

            if (!data?.status || !data?.result?.length) {
                return m.reply('Resep masakan tidak ditemukan.');
            }

            const results = data.result.filter(item => item.judul);

            if (!results.length) {
                return m.reply('Data resep tidak tersedia.');
            }

            const result = results[Math.floor(Math.random() * results.length)];
            const caption = [
                '*[ RESEP MASAKAN ]*',
                '',
                `Judul: ${result.judul || '-'}`,
                `Hasil: ${result.hasil || '-'}`,
                `Waktu memasak: ${result.waktu_masak || '-'}`,
                `Tingkat kesulitan: ${result.tingkat_kesulitan || '-'}`,
                '',
                '*[ Bahan-bahan ]:*',
                result.bahan?.trim() || '-',
                '',
                '*[ Langkah-langkah ]:*',
                result.langkah_langkah?.trim() || '-'
            ].join('\n');

            if (result.thumb) {
                return sock.sendMessage(m.chat || m.from, {
                    image: { url: result.thumb },
                    caption: caption.slice(0, 4000)
                }, { quoted: m });
            }

            return m.reply(caption.slice(0, 4000));
        } catch (err) {
            await m.reply(settings?.mess?.error || err.message);
            return false;
        }
    }
};