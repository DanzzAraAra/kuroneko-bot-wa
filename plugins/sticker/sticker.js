const { downloadContentFromMessage } = require('baileys');
const { writeExif } = require('../../src/sticker.js');

module.exports = {
    name: ['sticker', 's', 'stiker'],
    limit: 1,
    premium: false,
    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        try {
            const quote = m.quoted ? m.quoted : m;
            
            let msgType = quote.type || quote.mtype;
            let mediaMessage = quote.msg || quote.message?.imageMessage || quote.message?.videoMessage;

            if (!mediaMessage && quote.message) {
                const wrapped = quote.message.viewOnceMessageV2?.message || quote.message.viewOnceMessage?.message;
                if (wrapped) {
                    mediaMessage = wrapped.imageMessage || wrapped.videoMessage;
                    msgType = wrapped.imageMessage ? 'imageMessage' : 'videoMessage';
                }
            }

            if (!mediaMessage || !['imageMessage', 'videoMessage'].includes(msgType)) {
                await m.reply(`Kirim atau balas gambar/video dengan caption *${usedPrefix}${commandName}*`);
                return false;
            }
            
            if (msgType === 'videoMessage' && mediaMessage.seconds > 10) {
                await m.reply('Maksimal durasi video untuk stiker adalah 10 detik.');
                return false;
            }

            if (settings?.mess?.wait) await m.reply(settings.mess.wait);

            let buffer;
            
            if (typeof quote.download === 'function') {
                buffer = await quote.download();
            } else {
                const stream = await downloadContentFromMessage(mediaMessage, msgType.replace('Message', ''));
                buffer = Buffer.from([]);
                for await (const chunk of stream) {
                    buffer = Buffer.concat([buffer, chunk]);
                }
            }

            const mediaObj = {
                mimetype: msgType === 'imageMessage' ? 'image/jpeg' : 'video/mp4',
                data: buffer,
                ext: msgType === 'imageMessage' ? 'jpg' : 'mp4'
            };

            const metadata = {
                packName: settings?.botName,
                packPublish: settings?.ownerName
            };

            const finalSticker = await writeExif(mediaObj, metadata);

            await sock.sendMessage(m.chat, { sticker: finalSticker }, { quoted: m });

        } catch (err) {
            console.error(err);
            await m.reply(settings?.mess?.error || 'Terjadi kesalahan saat memproses stiker.');
            return false;
        }
    }
};