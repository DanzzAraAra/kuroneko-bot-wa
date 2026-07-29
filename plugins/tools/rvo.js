const { downloadContentFromMessage } = require('baileys');

module.exports = {
    name: ['rvo', 'readviewonce', 'vo'],
    limit: 2,
    premium: false,
    execute: async (sock, m, args, settings, cmd, prefix) => {
        const reply = async (text) => {
            await sock.sendMessage(m.from, { text }, { quoted: m });
            return false;
        };

        if (!m.quoted) {
            return reply(`Reply view once message *${prefix + cmd}*`);
        }

        const msg = m.quoted.message || m.quoted.msg;
        if (!msg) return reply('Messages are not supported or expired.');

        const viewOnceMsg = msg.viewOnceMessageV2 || msg.viewOnceMessageV2Extension || msg.viewOnceMessage;
        
        let mediaType, mediaData;
        
        if (viewOnceMsg) {
            mediaType = Object.keys(viewOnceMsg.message)[0];
            mediaData = viewOnceMsg.message[mediaType];
        } else {
            if (m.quoted.msg && m.quoted.msg.viewOnce) {
                mediaType = m.quoted.mtype || m.quoted.type || (m.quoted.message ? Object.keys(m.quoted.message)[0] : null);
                mediaData = m.quoted.msg;
            } else {
                return reply('Pesan yang direply bukan pesan sekali lihat');
            }
        }

        if (!mediaType || typeof mediaType !== 'string') {
            return reply('Failed to detect the media type in this message.');
        }

        try {
            const stream = await downloadContentFromMessage(
                mediaData, 
                mediaType.replace('Message', '')
            );
            
            let chunks = [];
            for await (const chunk of stream) {
                chunks.push(chunk);
            }
            const buffer = Buffer.concat(chunks);

            if (!buffer) return reply('Failed to download media from this message.');

            const caption = mediaData.caption ? `${mediaData.caption}` : '';

            if (mediaType === 'imageMessage') {
                await sock.sendMessage(m.from, { image: buffer, caption: caption }, { quoted: m });
            } else if (mediaType === 'videoMessage') {
                await sock.sendMessage(m.from, { video: buffer, caption: caption }, { quoted: m });
            } else if (mediaType === 'audioMessage') {
                await sock.sendMessage(m.from, { audio: buffer, mimetype: mediaData.mimetype, ptt: true }, { quoted: m });
            } else {
                await reply(`Format ${mediaType} Not supported`);
            }

        } catch (e) {
            console.error(e);
            await reply(`${e.message}`);
            return false;
        }
    }
};
