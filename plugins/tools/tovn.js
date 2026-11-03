import { prepareAudioMessage } from '../../src/ffmpeg.js';

export default {
    name: ['tovn', 'toaudio'],
    limit: 1,
    premium: false,

    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        const quoted = m.quoted || m;
        const type = sock.getMediaType(quoted);

        if (!['audio', 'video'].includes(type)) {
            return m.reply(`Reply audio atau video dengan: ${usedPrefix}${commandName}`);
        }

        try {
            if (settings?.mess?.wait) {
                await m.reply(settings.mess.wait);
            }

            const buffer = await sock.downloadMedia(quoted);
            const audio = await prepareAudioMessage(buffer, true);

            return sock.sendMessage(m.chat, {
                audio: audio.audio,
                mimetype: audio.mimetype,
                ptt: audio.ptt,
                waveform: audio.waveform,
                seconds: audio.seconds
            }, { quoted: m });
        } catch (err) {
            await m.reply(settings?.mess?.error || err.message);
            return false;
        }
    }
};