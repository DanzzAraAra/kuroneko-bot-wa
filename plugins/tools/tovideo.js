import { ezgif } from '../../src/convert.js';

export default {
    name: ['tovid', 'tovideo', 'tomp4'],
    limit: 1,
    premium: false,

    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        const quoted = m.quoted || m;

        if (sock.getMediaType(quoted) !== 'sticker') {
            return m.reply(`Reply stiker dengan ketik: ${usedPrefix}${commandName}`);
        }

        try {
            if (settings?.mess?.wait) {
                await m.reply(settings.mess.wait);
            }

            const buffer = await sock.downloadMedia(quoted);
            const resultUrl = await ezgif({
                buffer,
                from: 'webp',
                to: 'mp4'
            });

            return sock.sendMessage(m.chat || m.from, {
                video: { url: resultUrl }
            }, { quoted: m });
        } catch (err) {
            await m.reply(settings?.mess?.error || err.message);
            return false;
        }
    }
};