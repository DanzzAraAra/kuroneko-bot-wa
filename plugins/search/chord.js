import axios from 'axios';

export default {
    name: ['chord'],
    limit: 2,
    premium: false,

    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        try {
            const action = args[0]?.toLowerCase() === 'detail' ? 'detail' : 'search';
            const query = action === 'detail' ? args[1] : args.join(' ');

            if (!query) {
                return m.reply(
                    `*Ex:*\n` +
                    `${usedPrefix}${commandName} menunggumu\n` +
                    `${usedPrefix}${commandName} detail https://www.911tabs.com/tabs/p/peterpan/menunggumu_tab.htm`
                );
            }

            if (settings?.mess?.wait) {
                await m.reply(settings.mess.wait);
            }

            const apiUrl = action === 'detail'
                ? `${settings.api}/api/search/chord?action=detail&url=${encodeURIComponent(query)}&apikey=${settings.key}`
                : `${settings.api}/api/search/chord?action=search&q=${encodeURIComponent(query)}&apikey=${settings.key}`;

            const { data } = await axios.get(apiUrl);

            if (!data?.status) {
                return m.reply('Data chord tidak ditemukan.');
            }

            if (action === 'detail') {
                const song = data.result;

                if (!song?.chord) {
                    return m.reply('Detail chord tidak ditemukan.');
                }

                return m.reply(
                    `*${song.title || 'Chord'}*\n` +
                    `*Artist:* ${song.artist || '-'}\n` +
                    `*Source:* ${song.source || '-'}\n\n` +
                    '```' + song.chord + '```'
                );
            }

            if (!data.result?.length) {
                return m.reply('Lagu tidak ditemukan.');
            }

            const result = data.result.map((song, i) =>
                `*${i + 1}. ${song.title}*\n` +
                `Artist: ${song.artist}\n` +
                `Type: ${song.type}\n` +
                `Source: ${song.source}\n` +
                `URL: ${song.url}`
            ).join('\n\n');

            return m.reply(`*[ HASIL PENCARIAN CHORD ]*\n\n${result}`);
        } catch (err) {
            await m.reply(settings?.mess?.error || err.message);
        }
    }
};