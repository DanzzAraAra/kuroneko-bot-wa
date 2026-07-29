const axios = require('axios');
const { writeExif } = require('../../src/sticker.js');

module.exports = {
    name: ['qc'],
    limit: 2,
    premium: false,
    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        try {
            const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            let input = args.join(' ');
            
            if (!input && quoted) {
                input = quoted.conversation || quoted.extendedTextMessage?.text || '';
            }

            if (!input) {
                await m.reply(`Masukan teks atau reply pesan dengan perintah *${usedPrefix}${commandName} <teks>*`);
                return false;
            }

            if (settings?.mess?.wait) await m.reply(settings.mess.wait);

            let senderId = m.sender;
            if (quoted && m.message?.extendedTextMessage?.contextInfo?.participant) {
                senderId = m.message.extendedTextMessage.contextInfo.participant;
            }

            let pushName = m.pushName || 'User';
            try {
                let name = await sock.getName(senderId);
                if (name) pushName = name;
            } catch (e) {}

            let ppUrl = 'https://cdn.jsdelivr.net/gh/Sitiis/image@main/avatar.jpg';
            try {
                ppUrl = await sock.profilePictureUrl(senderId, 'image');
            } catch (e) {}

            const apiUrl = `${settings.api}/api/maker/qc?text=${encodeURIComponent(input)}&nama=${encodeURIComponent(pushName)}&url=${encodeURIComponent(ppUrl)}&apikey=${settings.key}`;
            
            const response = await axios.get(apiUrl, { responseType: 'arraybuffer' });
            const buffer = Buffer.from(response.data);

            const finalSticker = await writeExif(
                {
                    mimetype: 'image',
                    data: buffer,
                },
                {
                    packName: settings.botName,
                    packPublish: settings.ownerName,
                }
            );

            await sock.sendMessage(m.chat, { sticker: finalSticker }, { quoted: m });

        } catch (err) {
            console.error(err);
            await m.reply(settings?.mess?.error || err.message);
            return false;
        }
    }
};