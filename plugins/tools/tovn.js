const { downloadContentFromMessage } = require('baileys');
const { prepareAudioMessage } = require('../../src/ffmpeg.js');

module.exports = {
    name: ['tovn', 'toaudio'],
    limit: 1,
    premium: false,
    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        const quoted = m.quoted ? m.quoted : m;
        const mime = quoted.mimetype || quoted.msg?.mimetype || '';

        if (!/audio|video/.test(mime)) {
            await m.reply(`Reply audio atau video dengan ketik: ${usedPrefix}${commandName}`);
            return false;
        }

        if (settings?.mess?.wait) await m.reply(settings.mess.wait);

        try {
            let mediaBuffer;
            if (typeof sock.downloadMedia === 'function') {
                mediaBuffer = await sock.downloadMedia(quoted);
            } else {
                const stream = await downloadContentFromMessage(
                    quoted.msg || quoted.message?.audioMessage || quoted.message?.videoMessage, 
                    /video/.test(mime) ? 'video' : 'audio'
                );
                let buffer = Buffer.from([]);
                for await (const chunk of stream) {
                    buffer = Buffer.concat([buffer, chunk]);
                }
                mediaBuffer = buffer;
            }

            const audioData = await prepareAudioMessage(mediaBuffer, true);

            await sock.sendMessage(m.chat, { 
                audio: audioData.audio,
                mimetype: audioData.mimetype,
                ptt: audioData.ptt,
                waveform: audioData.waveform,
                seconds: audioData.seconds
            }, { quoted: m });

        } catch (err) {
            console.error(err);
            await m.reply(`Gagal mengonversi ke VN: ${err.message}`);
            return false;
        }
    }
};
