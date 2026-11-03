import axios from 'axios';

export default {
    name: ['tokopedia', 'tokped'],
    limit: 2,
    premium: false,

    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        const q = args.join(' ').trim();

        if (!q) {
            return m.reply(`*Ex:* ${usedPrefix + commandName} moondrop space travel`);
        }

        try {
            if (settings?.mess?.wait) {
                await m.reply(settings.mess.wait);
            }

            const apiUrl = `${settings.api}/api/search/tokopedia?q=${encodeURIComponent(q)}&page=1&rows=10&apikey=${settings.key}`;
            const { data } = await axios.get(apiUrl, { timeout: 60000 });

            if (!data?.status || !data?.products?.length) {
                return m.reply('Produk Tokopedia tidak ditemukan.');
            }

            const products = data.products.filter(item => item.name && item.url);

            if (!products.length) {
                return m.reply('Data produk Tokopedia tidak tersedia.');
            }

            const caption = [
                '*[ TOKOPEDIA ]*',
                `Pencarian: ${q}`,
                `Halaman: ${data.page || 1}`,
                `Total produk: ${data.totalDataText || data.totalData || products.length}`,
                '',
                ...products.map((item, index) => [
                    `*${index + 1}. ${item.name}*`,
                    `Harga: ${item.price || '-'}`,
                    `Harga awal: ${item.originalPrice || '-'}`,
                    `Rating: ${item.rating || '-'}`,
                    `Terjual: ${item.sold || '-'}`,
                    `Toko: ${item.shopName || '-'}`,
                    `Lokasi: ${item.shopCity || item.badge || '-'}`,
                    `Link: ${item.url}`
                ].join('\n'))
            ].join('\n\n');

            const first = products[0];

            if (first.image) {
                return sock.sendMessage(m.chat || m.from, {
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