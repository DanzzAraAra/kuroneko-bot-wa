const axios = require('axios');
const FormData = require('form-data');
const { downloadContentFromMessage } = require('baileys');

module.exports = {
    name: ['igstory', 'igs', 'instagramstory'],
    limit: 3,
    premium: false,
    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        try {
            const msg = m.quoted || m;
            const mediaMessage =
                msg.message?.imageMessage ||
                msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;

            if (!mediaMessage) {
                await m.reply(`*Ex:* ${usedPrefix}${commandName} (reply/kirim gambar untuk background story)`);
                return false;
            }

            if (settings?.mess?.wait) await m.reply(settings.mess.wait);

            let buffer;
            if (typeof msg.download === 'function') {
                buffer = await msg.download();
            } else {
                const stream = await downloadContentFromMessage(mediaMessage, 'image');
                buffer = Buffer.alloc(0);

                for await (const chunk of stream) {
                    buffer = Buffer.concat([buffer, chunk]);
                }
            }

            let senderId = m.sender;
            if (m.message?.extendedTextMessage?.contextInfo?.participant) {
                senderId = m.message.extendedTextMessage.contextInfo.participant;
            }

            let username = m.pushName || 'User';
            try {
                let name = await sock.getName(senderId);
                if (name) username = name;
            } catch (e) {}

            let ppUrl = 'https://cdn.jsdelivr.net/gh/Sitiis/image@main/avatar.jpg';
            try {
                ppUrl = await sock.profilePictureUrl(senderId, 'image');
            } catch (e) {}

            let like = '0';
            let comment = '0';
            let repost = '0';

            const input = args.join(' ');
            const likeMatch = input.match(/--like\s+(\d+)/i);
            const commentMatch = input.match(/--comment\s+(\d+)/i);
            const repostMatch = input.match(/--repost\s+(\d+)/i);

            if (likeMatch) like = likeMatch[1];
            if (commentMatch) comment = commentMatch[1];
            if (repostMatch) repost = repostMatch[1];

            const form = new FormData();
            form.append('image', buffer, { filename: 'image.jpg', contentType: 'image/jpeg' });
            form.append('pp_url', ppUrl);
            form.append('username', username);
            form.append('like', like);
            form.append('comment', comment);
            form.append('repost', repost);
            form.append('apikey', settings.key);

            const apiUrl = `${settings.api}/api/maker/igstory`;
            const response = await axios.post(apiUrl, form, {
                headers: {
                    ...form.getHeaders()
                },
                responseType: 'arraybuffer'
            });

            const resultBuffer = Buffer.from(response.data);

            await sock.sendMessage(
                m.chat || m.from,
                {
                    image: resultBuffer,
                    caption: `*✨ ɪɴꜱᴛᴀɢʀᴀᴍ ꜱᴛᴏʀʏ ᴍᴀᴋᴇʀ*`
                },
                { quoted: m }
            );

        } catch (err) {
            console.error(err);
            await m.reply(settings?.mess?.error || err.message);
            return false;
        }
    }
};