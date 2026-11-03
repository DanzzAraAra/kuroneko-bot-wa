import { writeExif } from '../../src/sticker.js';

export default {
    name: ['sticker', 's', 'stiker'],
    limit: 1,
    premium: false,

    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        try {
            const quote = m.quoted || m;
            const type = sock.getMediaType(quote);

            if (!['image', 'video'].includes(type)) {
                return m.reply(`Kirim atau reply image/video dengan caption *${usedPrefix}${commandName}*`);
            }

            const mediaInfo = sock.getMedia(quote);
            if (type === 'video' && (mediaInfo?.media?.seconds || 0) > 10) {
                return m.reply('Maksimal durasi video 10 detik');
            }

            if (settings?.mess?.wait) {
                await m.reply(settings.mess.wait);
            }

            const buffer = await sock.downloadMedia(quote);

            if (!buffer?.length) {
                return m.reply('Gagal mengunduh media');
            }

            const isImage = type === 'image';

            const sticker = await writeExif({
                mimetype: isImage ? 'image/jpeg' : 'video/mp4',
                data: buffer,
                ext: isImage ? 'jpg' : 'mp4'
            }, {
                packName: m.pushName || 'Unknown',
                packPublish: settings?.botName || 'KuroNeko'
            });

            return sock.sendMessage(m.chat || m.from, {
                sticker
            }, {
                quoted: m
            });
        } catch (err) {
            await m.reply(settings?.mess?.error || err.message);
            return false;
        }
    }
};
