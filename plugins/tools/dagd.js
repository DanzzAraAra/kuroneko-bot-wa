import axios from 'axios';

export default {
    name: ['dagd'],
    limit: 1,
    premium: false,

    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        const url = args.join(' ').trim();

        if (!url) {
            return m.reply(`*Ex:* ${usedPrefix + commandName} <url>`);
        }

        try {
            if (settings?.mess?.wait) {
                await m.reply(settings.mess.wait);
            }

            const apiUrl = `${settings.api}/api/tools/dagd?url=${encodeURIComponent(url)}&apikey=${settings.key}`;
            const { data } = await axios.get(apiUrl, { timeout: 60000 });

            if (!data?.status || !data?.data?.short) {
                return m.reply('URL gagal diperpendek.');
            }

            const result = data.data;

            return m.reply([
                '*[ URL SHORTENER ]*',
                '',
                `> Original: ${result.original || url}`,
                `> Short URL: ${result.short}`
            ].join('\n'));
        } catch (err) {
            await m.reply(settings?.mess?.error || err.message);
            return false;
        }
    }
};