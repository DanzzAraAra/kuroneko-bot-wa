import axios from 'axios';

export default {
    name: ['kodepos'],
    limit: 2,
    premium: false,

    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        try {
            const q = args.join(' ');

            if (!q) {
                return m.reply(`*Ex:* ${usedPrefix}${commandName} Yogyakarta`);
            }

            if (settings?.mess?.wait) {
                await m.reply(settings.mess.wait);
            }

            const apiUrl = `${settings.api}/api/search/kodepos?q=${encodeURIComponent(q)}&apikey=${settings.key}`;
            const { data } = await axios.get(apiUrl);

            if (!data?.status || !data.result?.length) {
                return m.reply('Data kode pos tidak ditemukan.');
            }

            const result = data.result.map((item, i) =>
                `*${i + 1}. ${item.desa}*\n` +
                `Kecamatan: ${item.kecamatan}\n` +
                `Kota: ${item.kota}\n` +
                `Provinsi: ${item.provinsi}\n` +
                `Kode Pos: ${item.kodepos}`
            ).join('\n\n');

            return m.reply(`*[ HASIL PENCARIAN KODE POS ]*\n\n${result}`);
        } catch (err) {
            await m.reply(settings?.mess?.error || err.message);
        }
    }
};