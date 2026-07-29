const { downloadContentFromMessage } = require('baileys');
const axios = require('axios');
const { writeExif } = require('../../src/sticker.js');
const { uploader } = require('../../src/uploader.js');

module.exports = {
    name: ['smeme'],
    limit: 2,
    premium: false,
    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        try {
            const isQuoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const quote = isQuoted ? m.message.extendedTextMessage.contextInfo.quotedMessage : m.message;
            
            const mediaMessage = quote?.imageMessage || quote?.stickerMessage;
            const mediaType = quote?.imageMessage ? 'image' : (quote?.stickerMessage ? 'sticker' : null);

            if (!mediaMessage) {
                await m.reply(`Reply to image or sticker with caption: *${usedPrefix}${commandName} atas|bawah*`);
                return false;
            }

            const text = args.join(" ") || "";
            const [atas, bawah] = text.split("|").map(s => s.trim());
            
            if (!atas && !bawah) {
                await m.reply(`*Ex:* ${usedPrefix}${commandName} atas|bawah`);
                return false;
            }

            if (settings?.mess?.wait) await m.reply(settings.mess.wait);
            
            const stream = await downloadContentFromMessage(mediaMessage, mediaType);
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            const uploadedUrl = await uploader(buffer);

            const textAtas = encodeURIComponent(atas || "_");
            const textBawah = encodeURIComponent(bawah || "_");
            const memeUrl = `https://api.memegen.link/images/custom/${textAtas}/${textBawah}.png?background=${uploadedUrl}`;
            
            const { data: memeBuffer } = await axios.get(memeUrl, { responseType: 'arraybuffer' });

            const mediaObj = {
                mimetype: 'image/png',
                data: Buffer.from(memeBuffer),
                ext: 'png'
            };

            const metadata = {
                packName: settings.botName,
                packPublish: settings.ownerName
            };

            const finalSticker = await writeExif(mediaObj, metadata);

            await sock.sendMessage(m.chat, { sticker: finalSticker }, { quoted: m });

        } catch (err) {
            console.error(err);
            await m.reply(settings.mess.error);
            return false;
        }
    }
};