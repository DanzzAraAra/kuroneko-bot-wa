import axios from 'axios';

export default {
    name: ['pinterest', 'pin'],
    limit: 1,
    premium: false,

    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        const query = args.join(' ').trim();

        if (!query) {
            return m.reply(`*Ex:* ${usedPrefix + commandName} anna yanami`);
        }

        try {
            if (settings?.mess?.wait) {
                await m.reply(settings.mess.wait);
            }

            const apiUrl = `${settings.api}/api/search/pinterest?query=${encodeURIComponent(query)}&apikey=${settings.key}`;
            const { data } = await axios.get(apiUrl, { timeout: 60000 });

            if (!data?.status || !data?.data?.length) {
                return m.reply('Gambar Pinterest tidak ditemukan.');
            }

            const results = data.data.filter(item => item.image_url);

            if (!results.length) {
                return m.reply('Gambar Pinterest tidak tersedia.');
            }

            const result = results[Math.floor(Math.random() * results.length)];
            const caption = [
                '*[ PINTEREST ]*',
                '',
                `Judul: ${result.grid_title || result.title || result.description || result.seo_alt_text || '-'}`,
                `Board: ${result.board?.name || '-'}`,
                `Uploader: ${result.pinner?.full_name || result.pinner?.username || '-'}`,
                `Rating: ${result.reaction_counts?.['1'] || 0}`,
                `> Link: ${result.pin || '-'}`
            ].join('\n');

            return sock.sendMessage(m.chat || m.from, {
                image: { url: result.image_url },
                caption
            }, { quoted: m });
        } catch (err) {
            await m.reply(settings?.mess?.error || err.message);
            return false;
        }
    }
};