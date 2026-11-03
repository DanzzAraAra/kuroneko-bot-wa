export default {
    name: ['rvo', 'readviewonce'],
    limit: 2,
    premium: false,

    execute: async (sock, m, args, settings, cmd, prefix) => {
        const reply = async text => {
            await m.reply(text);
            return false;
        };

        if (!m.quoted) {
            return reply(`Reply view once message *${prefix + cmd}*`);
        }

        const msg = m.quoted.message || m.quoted.msg;

        if (!msg) {
            return reply('Messages are not supported or expired');
        }

        const wrappers = [
            'viewOnceMessageV2',
            'viewOnceMessageV2Extension',
            'viewOnceMessage'
        ];

        let viewOnce;
        let message = msg;

        while (message) {
            const wrapper = wrappers.find(key => message[key]?.message);

            if (wrapper) {
                viewOnce = message[wrapper];
                message = viewOnce.message;
                break;
            }

            if (message.ephemeralMessage?.message) {
                message = message.ephemeralMessage.message;
                continue;
            }

            break;
        }

        const mediaType = viewOnce
            ? Object.keys(message || {})[0]
            : m.quoted.msg?.viewOnce
                ? m.quoted.mtype || m.quoted.type
                : null;

        if (!mediaType || !m.quoted.msg?.viewOnce && !viewOnce) {
            return reply('Pesan yang direply bukan pesan sekali lihat atau formatnya tidak didukung');
        }

        const type = mediaType.replace('Message', '').toLowerCase();

        if (!['image', 'video', 'audio'].includes(type)) {
            return reply(`Format ${mediaType} tidak didukung`);
        }

        try {
            const media = viewOnce
                ? message[mediaType]
                : m.quoted.msg;

            const buffer = await sock.downloadMedia({
                message: { [mediaType]: media },
                mtype: mediaType
            });

            if (!buffer.length) {
                return reply('Gagal mengunduh media dari pesan');
            }

            let content;

            if (type === 'image') {
                content = {
                    image: buffer,
                    caption: media.caption || ''
                };
            } else if (type === 'video') {
                content = {
                    video: buffer,
                    caption: media.caption || ''
                };
            } else {
                content = {
                    audio: buffer,
                    mimetype: media.mimetype || 'audio/ogg; codecs=opus',
                    ptt: true
                };
            }

            return sock.sendMessage(m.chat || m.from, content, {
                quoted: m
            });
        } catch (err) {
            return reply(settings?.mess?.error || err.message);
        }
    }
};