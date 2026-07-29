const { downloadContentFromMessage } = require('baileys');
const { ezgif } = require('../../src/convert.js');

module.exports = {
    name: ['togif'],
    limit: 1,
    premium: false,
    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        const quoted = m.quoted ? m.quoted : m;
        const mime = quoted.mimetype || quoted.msg?.mimetype || '';

        if (!/webp/.test(mime)) {
            await m.reply(`Reply stiker dengan ketik: ${usedPrefix}${commandName}`);
            return false;
        }

        if (settings?.mess?.wait) await m.reply(settings.mess.wait);

        try {
            let mediaBuffer;
            if (typeof sock.downloadMedia === 'function') {
                mediaBuffer = await sock.downloadMedia(quoted);
            } else {
                const stream = await downloadContentFromMessage(
                    quoted.msg || quoted.message?.stickerMessage, 
                    'sticker'
                );
                let buffer = Buffer.from([]);
                for await (const chunk of stream) {
                    buffer = Buffer.concat([buffer, chunk]);
                }
                mediaBuffer = buffer;
            }

            const resultUrl = await ezgif({
                buffer: mediaBuffer,
                from: 'webp',
                to: 'mp4'
            });

            await sock.sendMessage(m.chat, { 
                video: { url: resultUrl },
                gifPlayback: true
            }, { quoted: m });

        } catch (err) {
            console.error(err);
            await m.reply(`${err.message}`);
            return false;
        }
    }
};
