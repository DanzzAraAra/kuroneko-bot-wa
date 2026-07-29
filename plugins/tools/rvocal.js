const axios = require('axios');
const { downloadMediaMessage } = require('baileys');
const { uploader } = require('../../src/uploader');

module.exports = {
    name: ['rvocal', 'removevocal'],
    limit: 4,
    premium: false,
    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        try {
            const q = m.quoted ? m.quoted : m;
            const mime = (q.msg || q).mimetype || '';

            if (!mime.includes('audio')) {
                await m.reply(`*Ex:* Reply pesan audio/mp3 dengan perintah *${usedPrefix}${commandName}*`);
                return false;
            }

            if (settings?.mess?.wait) await m.reply(settings.mess.wait);

            const buffer = await downloadMediaMessage(
                q,
                'buffer',
                {},
                { 
                    logger: console,
                    reuploadRequest: sock.updateMediaMessage
                }
            );

            if (!buffer) {
                await m.reply('Gagal mengunduh pesan audio.');
                return false;
            }

            const audioUrl = await uploader(buffer);

            const apiUrl = `${settings.api}/api/tools/removevocal?url=${encodeURIComponent(audioUrl)}&apikey=${settings.key}`;
            const { data } = await axios.get(apiUrl);

            if (!data.status || !data.result || !data.result.instrumental || !data.result.vocal) {
                await m.reply('Gagal memisahkan vokal dan instrumen dari API.');
                return false;
            }

            const { vocal, instrumental } = data.result;

            await sock.sendMessage(m.chat || m.from, {
                audio: { url: instrumental },
                mimetype: 'audio/mpeg',
                fileName: 'Instrumental.mp3',
                ptt: false
            }, { quoted: m });

            await sock.sendMessage(m.chat || m.from, {
                audio: { url: vocal },
                mimetype: 'audio/mpeg',
                fileName: 'Vocal.mp3',
                ptt: false
            }, { quoted: m });

        } catch (err) {
            console.error(err);
            await m.reply(settings?.mess?.error || err.message);
            return false;
        }
    }
};