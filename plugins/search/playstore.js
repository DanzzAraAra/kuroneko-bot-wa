import axios from 'axios';

export default {
    name: ['playstore'],
    limit: 2,
    premium: false,

    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        const query = args.join(' ').trim();

        if (!query) {
            return m.reply(`*Ex:* ${usedPrefix + commandName} free fire`);
        }

        try {
            if (settings?.mess?.wait) {
                await m.reply(settings.mess.wait);
            }

            const apiUrl = `${settings.api}/api/search/playstore?query=${encodeURIComponent(query)}&apikey=${settings.key}`;
            const { data } = await axios.get(apiUrl, { timeout: 60000 });

            if (!data?.status || !data?.data?.length) {
                return m.reply('Aplikasi tidak ditemukan');
            }

            const results = data.data.filter(item => item.img && item.link);

            if (!results.length) {
                return m.reply('Data aplikasi tidak tersedia');
            }

            const result = results[Math.floor(Math.random() * results.length)];
            const caption = [
                '*[ PLAY STORE ]*',
                '',
                `Nama: ${result.nama || '-'}`,
                `Developer: ${result.developer || '-'}`,
                `Rating: ${result.rate || '-'}`,
                `Link aplikasi: ${result.link || '-'}`,
                `Link developer: ${result.link_dev || '-'}`
            ].join('\n');

            return sock.sendMessage(m.chat || m.from, {
                image: { url: result.img },
                caption
            }, { quoted: m });
        } catch (err) {
            await m.reply(settings?.mess?.error || err.message);
            return false;
        }
    }
};