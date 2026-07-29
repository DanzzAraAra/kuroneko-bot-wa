const axios = require('axios');

module.exports = {
    name: ['danbooru', 'danboorusearch'],
    limit: 3,
    premium: true,
    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        try {
            const input = args.join(' ');

            if (!input) {
                await m.reply(`*Ex (Safe):* ${usedPrefix}${commandName} hatsune miku\n*Ex (NSFW):* ${usedPrefix}${commandName} hatsune miku --nsfw`);
                return false;
            }

            let mode = 'safe';
            let query = input;

            if (input.toLowerCase().includes('--nsfw')) {
                mode = 'nsfw';
                query = input.replace(/--nsfw/i, '').trim();
            }

            const formattedQuery = query.replace(/\s+/g, '_');

            if (settings?.mess?.wait) await m.reply(settings.mess.wait);

            const apiUrl = `${settings.api}/api/search/danbooru?q=${encodeURIComponent(formattedQuery)}&mode=${encodeURIComponent(mode)}&apikey=${settings.key}`;
            const { data } = await axios.get(apiUrl);

            if (!data.status || !data.result || !data.result.full_file_url) {
                await m.reply('Tidak ditemukan hasil dari Danbooru.');
                return false;
            }

            let caption = `*ᴅᴀɴʙᴏᴏʀᴜ ꜱᴇᴀʀᴄʜ*\n\n`;
            caption += `*• ID:* ${data.result.id || '-'}\n`;
            caption += `*• Rating:* ${data.result.rating || '-'}\n`;
            caption += `*• Tags:* ${data.result.tags || '-'}`;

            await sock.sendMessage(m.chat || m.from, {
                image: { url: data.result.full_file_url },
                caption: caption
            }, { quoted: m });

        } catch (err) {
            console.error(err);
            await m.reply(settings?.mess?.error || err.message);
            return false;
        }
    }
};