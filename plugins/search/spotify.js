import axios from 'axios';

export default {
    name: ['spotify', 'spsearch'],
    limit: 1,
    premium: false,

    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        const q = args.join(' ').trim();

        if (!q) {
            return m.reply(`*Ex:* ${usedPrefix + commandName} wildflower`);
        }

        try {
            if (settings?.mess?.wait) {
                await m.reply(settings.mess.wait);
            }

            const apiUrl = `${settings.api}/api/search/spotify?q=${encodeURIComponent(q)}&apikey=${settings.key}`;
            const { data } = await axios.get(apiUrl, { timeout: 60000 });

            if (!data?.status || !data?.result?.length) {
                return m.reply('Lagu tidak ditemukan.');
            }

            const results = data.result.filter(item => item.spotifyUrl);

            if (!results.length) {
                return m.reply('Data lagu tidak tersedia.');
            }

            const result = results[Math.floor(Math.random() * results.length)];
            const caption = [
                '*[ SPOTIFY SEARCH ]*',
                '',
                `Judul: ${result.name || '-'}`,
                `Artist: ${result.artist || '-'}`,
                `Album: ${result.album || '-'}`,
                `Durasi: ${result.duration || '-'}`,
                `> Link: ${result.spotifyUrl}`
            ].join('\n');

            return m.reply(caption);
        } catch (err) {
            await m.reply(settings?.mess?.error || err.message);
            return false;
        }
    }
};