import axios from 'axios';

export default {
    name: ['yts', 'ytsearch'],
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

            const apiUrl = `${settings.api}/api/search/yts?q=${encodeURIComponent(q)}&apikey=${settings.key}`;
            const { data } = await axios.get(apiUrl, { timeout: 60000 });

            if (!data?.status || !data?.result?.length) {
                return m.reply('Video YouTube tidak ditemukan.');
            }

            const results = data.result.filter(item => item.url);

            if (!results.length) {
                return m.reply('Data video YouTube tidak tersedia.');
            }

            const caption = [
                '*[ YOUTUBE SEARCH ]*',
                '',
                ...results.map((result, index) => [
                    `*${index + 1}. ${result.title || '-'}*`,
                    `> Durasi: ${result.duration || '-'}`,
                    `> Views: ${result.views || '-'}`,
                    `> Upload: ${result.uploaded || '-'}`,
                    `> Link: ${result.url}`
                ].join('\n'))
            ].join('\n\n');

            const first = results[0];

            if (first.thumbnail) {
                return sock.sendMessage(m.chat || m.from, {
                    image: { url: first.thumbnail },
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