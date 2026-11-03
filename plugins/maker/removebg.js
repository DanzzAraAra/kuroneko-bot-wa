import axios from 'axios';
import { uploader } from '../../src/uploader.js';

export default {
    name: ['removebg'],
    limit: 4,
    premium: false,

    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        try {
            const q = m.quoted || m;
            const type = sock.getMediaType(q);

            if (type !== 'image') {
                return m.reply(`*Ex:* Kirim gambar dengan caption *${usedPrefix + commandName}* atau reply gambar yang sudah dikirim`);
            }

            if (settings?.mess?.wait) {
                await m.reply(settings.mess.wait);
            }

            const buffer = await sock.downloadMedia(q);

            if (!buffer?.length) {
                return m.reply('Gagal mengunduh gambar');
            }

            const imageUrl = await uploader(buffer);
            const apiUrl = `${settings.api}/api/maker/removebg?url=${encodeURIComponent(imageUrl)}&apikey=${encodeURIComponent(settings.key)}`;
            const { data } = await axios.get(apiUrl, {
                responseType: 'arraybuffer'
            });

            if (!data?.byteLength) {
                return m.reply('Gagal menghapus background gambar');
            }

            return sock.sendMessage(m.chat || m.from, {
                image: Buffer.from(data),
                caption: '*[ REMOVE BACKGROUND ]*'
            }, { quoted: m });
        } catch (err) {
            await m.reply(settings?.mess?.error || err.message);
            return false;
        }
    }
};
