import axios from 'axios';

export default {
    name: ['danbooru'],
    limit: 3,
    nsfw: true,

    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        try {
            const nsfw = args.includes('--r18');
            const q = args.filter(arg => arg !== '--r18').join('_');

            if (!q) {
                return m.reply(
                    `*Ex:*\n` +
                    `${usedPrefix}${commandName} yanami anna\n` +
                    `${usedPrefix}${commandName} yanami anna --r18`
                );
            }

            if (settings?.mess?.wait) {
                await m.reply(settings.mess.wait);
            }

            const apiUrl = `${settings.api}/api/search/danbooru?q=${encodeURIComponent(q)}&mode=${nsfw ? 'nsfw' : 'safe'}&apikey=${settings.key}`;
            const { data } = await axios.get(apiUrl);

            const result = data?.result;

            if (!data?.status || !result?.full_file_url) {
                return m.reply('Gambar tidak ditemukan.');
            }

            return sock.sendMessage(m.chat || m.from, {
                image: { url: result.full_file_url },
                caption:
                    `*DANBOORU ${nsfw ? 'R18' : 'SAFE'}*\n\n` +
                    `*ID:* ${result.id}\n` +
                    `*Rating:* ${result.rating}\n` +
                    `*Tags:* ${result.tags.replace(/_/g, ' ')}\n` +
                    `*Source:* ${result.source || '-'}`
            }, { quoted: m });
        } catch (err) {
            await m.reply(settings?.mess?.error || err.message);
        }
    }
};