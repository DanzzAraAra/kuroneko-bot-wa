import { writeExif } from '../../src/sticker.js';

export default {
    name: ['aistick', 'aisticker'],
    premium: true,

    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        try {
            const quote = m.quoted || m;
            const type = sock.getMediaType(quote);

            if (!['image', 'video', 'sticker'].includes(type)) {
                return m.reply(`Kirim gambar/video dengan caption *${usedPrefix}${commandName}* atau reply gambar, video, maupun sticker.`);
            }

            const mediaInfo = sock.getMedia(quote);
            if (type === 'video' && (mediaInfo?.media?.seconds || 0) > 10) {
                return m.reply('Maksimal durasi video untuk stiker adalah 10 detik');
            }

            if (settings?.mess?.wait) {
                await m.reply(settings.mess.wait);
            }

            const buffer = await sock.downloadMedia(quote);

            if (!buffer?.length) {
                return m.reply('Gagal mengunduh media');
            }

            const isImage = type === 'image';
            const isSticker = type === 'sticker';

            const sticker = await writeExif({
                mimetype: isSticker
                    ? 'image/webp'
                    : isImage
                        ? 'image/jpeg'
                        : 'video/mp4',
                data: buffer,
                ext: isSticker
                    ? 'webp'
                    : isImage
                        ? 'jpg'
                        : 'mp4'
            }, {
                packId: 'com.whatsapp.sticker_pack',
                packName: m.pushName || 'Unknown',
                packPublish: settings?.botName || 'KuroNeko',
                androidApp: 'null',
                iOSApp: 'null',
                isAiSticker: 1,
                premium: 1
            });

            if (!sticker) {
                throw new Error('Gagal membuat sticker');
            }

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
