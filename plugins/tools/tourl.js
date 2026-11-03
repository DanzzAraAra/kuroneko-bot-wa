import { uploader } from '../../src/uploader.js';

export default {
    name: ['tourl'],
    limit: 1,
    premium: false,

    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        const quoted = m.quoted || m;
        const type = sock.getMediaType(quoted);

        if (!['image', 'video', 'audio', 'document', 'sticker'].includes(type)) {
            return m.reply(
                `Kirim atau reply media dengan caption *${usedPrefix}${commandName}*\n\nSupport: image, video, audio, document, sticker`
            );
        }

        try {
            if (settings?.mess?.wait) {
                await m.reply(settings.mess.wait);
            }

            const buffer = await sock.downloadMedia(quoted);
            const url = await uploader(buffer);

            if (!url) {
                throw new Error('Uploader tidak mengembalikan URL.');
            }

            return m.reply(
                `*[ SUCCESSFUL UPLOAD ]*\n\n` +
                `> *Type:* ${type}\n` +
                `> *Size:* ${(buffer.length / 1024).toFixed(2)} KB\n` +
                `> *URL:* ${url}`
            );
        } catch (err) {
            await m.reply(settings?.mess?.error || err.message);
            return false;
        }
    }
};