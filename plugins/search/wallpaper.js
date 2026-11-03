import axios from 'axios';

export default {
    name: ['wallpaper', 'wallcraft'],
    limit: 1,
    premium: false,

    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        const ratingOptions = ['new', 'popular', 'top_rated'];
        const categoryOptions = ['video', 'parallax', 'ai_art', 'exclusive'];

        const query = args.filter(arg =>
            !ratingOptions.includes(arg.toLowerCase()) &&
            !categoryOptions.includes(arg.toLowerCase())
        ).join(' ').trim();

        const rating = args.find(arg =>
            ratingOptions.includes(arg.toLowerCase())
        )?.toLowerCase() || '';

        const category = args.find(arg =>
            categoryOptions.includes(arg.toLowerCase())
        )?.toLowerCase() || '';

        if (!query && !rating && !category) {
            return m.reply(`*Ex:* ${usedPrefix + commandName} anime popular`);
        }

        try {
            if (settings?.mess?.wait) {
                await m.reply(settings.mess.wait);
            }

            const apiUrl = `${settings.api}/api/search/wallcraft?query=${encodeURIComponent(query)}&rating=${rating}&category=${category}&apikey=${settings.key}`;
            const { data } = await axios.get(apiUrl, { timeout: 60000 });

            if (!data?.status || !data?.data?.length) {
                return m.reply('Wallpaper tidak ditemukan.');
            }

            const result = data.data[Math.floor(Math.random() * data.data.length)];
            const image = result.urls?.original || result.urls?.adapted;

            if (!image) {
                return m.reply('Data wallpaper tidak tersedia.');
            }

            const caption = [
                '*[ WALLPAPER SEARCH ]*',
                '',
                `Deskripsi: ${result.description || '-'}`,
                `Author: ${result.author || '-'}`,
                `Rating: ${result.rating ?? 0}`,
                `Downloads: ${result.downloads ?? 0}`,
                `Favorites: ${result.favorites ?? 0}`,
                `Tags: ${result.tags?.join(', ') || '-'}`,
                `Uploaded: ${result.uploaded_at || '-'}`,
                `Portrait: ${result.urls?.adapted || '-'}`,
                `Landscape: ${result.urls?.adapted_landscape || '-'}`,
                `Original: ${result.urls?.original || '-'}`
            ].join('\n');

            return sock.sendMessage(m.chat || m.from, {
                image: { url: image },
                caption
            }, { quoted: m });
        } catch (err) {
            await m.reply(settings?.mess?.error || err.message);
            return false;
        }
    }
};