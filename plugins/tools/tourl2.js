import { uploader2 } from '../../src/uploader2.js';

export default {
    name: ['tourl2'],
    limit: 1,
    premium: false,

    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        const quoted = m.quoted || m;
        const type = sock.getMediaType(quoted);

        if (!['image', 'video', 'audio', 'document', 'sticker'].includes(type)) {
            return m.reply(
                `Kirim atau reply media dengan caption *${usedPrefix}${commandName}*\n\n` +
                `Support: image, video, audio, document, sticker\n\n` +
                `*Expiry:*\n` +
                `30m, 1h, 2h, 12h, 1d, 3d, 1w, 2w, lifetime\n` +
                `Custom: 1m - 30d\n\n` +
                `*Ex:*\n` +
                `${usedPrefix + commandName} 1d\n` +
                `${usedPrefix + commandName} 90m\n` +
                `${usedPrefix + commandName} lifetime`
            );
        }

        const expiry = args[0]?.toLowerCase() || '1d';

        try {
            if (settings?.mess?.wait) {
                await m.reply(settings.mess.wait);
            }

            const buffer = await sock.downloadMedia(quoted);
            const url = await uploader2(buffer, expiry);

            if (!url) {
                throw new Error('Uploader tidak mengembalikan URL.');
            }

            return m.reply(
                `*[ SUCCESSFUL UPLOAD ]*\n\n` +
                `> *Type:* ${type}\n` +
                `> *Size:* ${(buffer.length / 1024).toFixed(2)} KB\n` +
                `> *Expiry:* ${expiry}\n` +
                `> *URL:* ${url}`
            );
        } catch (err) {
            await m.reply(settings?.mess?.error || err.message);
            return false;
        }
    }
};