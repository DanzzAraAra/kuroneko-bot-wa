import axios from 'axios';

export default {
    name: ['lazada-flashsale'],
    limit: 2,
    premium: false,

    execute: async (sock, m, args, settings) => {
        try {
            if (settings?.mess?.wait) {
                await m.reply(settings.mess.wait);
            }

            const apiUrl = `${settings.api}/api/search/lazada-flashsale?apikey=${settings.key}`;
            const { data } = await axios.get(apiUrl);

            if (!data.status || !data.result?.items?.length) {
                return m.reply('Tidak ada produk flash sale Lazada saat ini.');
            }

            const result = data.result;
            const items = result.items;

            const formatDate = date => {
                if (!date) return '-';

                return new Date(date).toLocaleString('id-ID', {
                    timeZone: 'Asia/Jakarta',
                    dateStyle: 'medium',
                    timeStyle: 'short'
                });
            };

            const caption = [
                '*[ LAZADA FLASH SALE ]*',
                '',
                `Total produk: ${result.total_items}`,
                `Mulai: ${formatDate(result.start_date)}`,
                `Berakhir: ${formatDate(result.expired_date)}`,
                '',
                ...items.map((item, index) => [
                    `*${index + 1}. ${item.name}*`,
                    `Harga: ${item.currency} ${item.price}`,
                    `Harga asli: ${item.currency} ${item.original_price}`,
                    item.discount ? `Diskon: ${item.discount}` : null,
                    `Stok: ${item.stock}`,
                    `Terjual: ${item.sold_count}`,
                    `Status: ${item.in_stock ? 'Tersedia' : 'Habis'}`,
                    `> Link: ${item.url}`
                ].filter(Boolean).join('\n'))
            ].join('\n');

            const image = items[0]?.image;

            if (image) {
                return sock.sendMessage(m.chat || m.from, {
                    image: { url: image },
                    caption: caption.slice(0, 4000)
                }, { quoted: m });
            }

            return m.reply(caption.slice(0, 4000));
        } catch (err) {
            await m.reply(settings?.mess?.error || err.message);
        }
    }
};