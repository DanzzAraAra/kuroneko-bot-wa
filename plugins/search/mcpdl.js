import axios from 'axios';

export default {
    name: ['mcpdl'],
    limit: 2,
    premium: false,

    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        const q = args.join(' ').trim();

        if (!q) {
            return m.reply(`*Ex:* ${usedPrefix + commandName} dark heroes`);
        }

        try {
            if (settings?.mess?.wait) {
                await m.reply(settings.mess.wait);
            }

            const apiUrl = `${settings.api}/api/search/mcpedl?q=${encodeURIComponent(q)}&apikey=${settings.key}`;
            const { data } = await axios.get(apiUrl, { timeout: 60000 });

            if (!data?.status || !data?.result?.length) {
                return m.reply('Hasil pencarian MCPEDL tidak ditemukan.');
            }

            const results = data.result;
            const caption = [
                '*[ MCPEDL SEARCH ]*',
                '',
                ...results.map((item, index) => [
                    `*${index + 1}. ${item.title || 'Tanpa judul'}*`,
                    `Rating: ${item.rating || '-'}`,
                    `Link: ${item.link || '-'}`
                ].join('\n'))
            ].join('\n\n');

            const first = results[0];

            if (first.image) {
                return sock.sendMessage(m.chat, {
                    image: { url: first.image },
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