const axios = require('axios');
const { downloadMediaMessage } = require('baileys');
const { uploader } = require('../../src/uploader');

module.exports = {
    name: ['hd', 'remini'],
    limit: 3,
    premium: false,
    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        try {
            const q = m.quoted ? m.quoted : m;
            const mime = (q.msg || q).mimetype || '';

            if (!mime.includes('image')) {
                await m.reply(`*Ex:* Kirim gambar dengan caption *${usedPrefix}${commandName}* atau reply gambar yang sudah dikirim.`);
                return false;
            }

            if (settings?.mess?.wait) await m.reply(settings.mess.wait);

            const buffer = await downloadMediaMessage(
                q,
                'buffer',
                {},
                { 
                    logger: console,
                    reuploadRequest: sock.updateMediaMessage
                }
            );

            if (!buffer) {
                await m.reply('Gagal mengunduh pesan gambar.');
                return false;
            }

            const imageUrl = await uploader(buffer);

            const apiUrl = `${settings.api}/api/tools/hd?url=${encodeURIComponent(imageUrl)}&apikey=${settings.key}`;
            
            const { data } = await axios.get(apiUrl, {
                responseType: 'arraybuffer'
            });

            if (!data) {
                await m.reply('Gagal memproses gambar menjadi HD.');
                return false;
            }

            let caption = `*HD IMAGE*\n\n`;
            caption += `* Result:* Berhasil ditingkatkan`;

            await sock.sendMessage(m.chat || m.from, {
                image: data,
                caption: caption.trim()
            }, { quoted: m });

        } catch (err) {
            console.error(err);
            await m.reply(settings?.mess?.error || err.message);
            return false;
        }
    }
};