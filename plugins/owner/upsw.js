const { generateWAMessage } = require('baileys');
const crypto = require('crypto');
const { PassThrough } = require('stream');
const ffmpeg = require('fluent-ffmpeg');

async function toVN(inputBuffer) {
    return new Promise((resolve, reject) => {
        const inStream = new PassThrough();
        const outStream = new PassThrough();
        const chunks = [];

        inStream.end(inputBuffer);

        ffmpeg(inStream)
            .noVideo()
            .audioCodec('libopus')
            .format('ogg')
            .audioBitrate('48k')
            .audioChannels(1)
            .audioFrequency(48000)
            .outputOptions([
                '-map_metadata', '-1',
                '-application', 'voip',
                '-compression_level', '10',
                '-page_duration', '20000'
            ])
            .on('error', reject)
            .on('end', () => resolve(Buffer.concat(chunks)))
            .pipe(outStream, { end: true });

        outStream.on('data', c => chunks.push(c));
    });
}

async function generateWaveform(inputBuffer, bars = 64) {
    return new Promise((resolve, reject) => {
        const inputStream = new PassThrough();
        inputStream.end(inputBuffer);

        const chunks = [];

        ffmpeg(inputStream)
            .audioChannels(1)
            .audioFrequency(16000)
            .format('s16le')
            .on('error', reject)
            .on('end', () => {
                const rawData = Buffer.concat(chunks);
                const samples = rawData.length / 2;

                const amplitudes = [];
                for (let i = 0; i < samples; i++) {
                    let val = rawData.readInt16LE(i * 2);
                    amplitudes.push(Math.abs(val) / 32768);
                }

                let blockSize = Math.floor(amplitudes.length / bars);
                let avg = [];
                for (let i = 0; i < bars; i++) {
                    let block = amplitudes.slice(i * blockSize, (i + 1) * blockSize);
                    avg.push(block.reduce((a, b) => a + b, 0) / block.length);
                }

                let max = Math.max(...avg);
                let normalized = avg.map(v => Math.floor((v / max) * 100));

                resolve(new Uint8Array(normalized));
            })
            .pipe()
            .on('data', chunk => chunks.push(chunk));
    });
}

module.exports = {
    name: ['upsw', 'sw'],
    execute: async (sock, m, args, settings, cmd, prefix) => {
        const reply = (text) => sock.sendMessage(m.from, { text }, { quoted: m });

        if (!m.isOwner) return reply(settings.mess.owner);

        const q = m.quoted ? m.quoted : m;
        const mime = (q.msg || q).mimetype || '';
        const caption = args.join(' ').trim();

        let payload = {};

        try {
            if (/image/.test(mime)) {
                payload = { image: await q.download(), caption };
            } else if (/video/.test(mime)) {
                payload = { video: await q.download(), caption };
            } else if (/audio/.test(mime)) {

                const buffer = await q.download();
                if (!buffer) return reply('Failed to download audio!');

                const audioVn = await toVN(buffer);
                const audioWaveform = await generateWaveform(buffer);

                payload = {
                    audio: audioVn,
                    waveform: audioWaveform,
                    mimetype: 'audio/ogg; codecs=opus',
                    ptt: true
                };
            } else if (/sticker/.test(mime)) {
                payload = { sticker: await q.download() };
            } else if (/document/.test(mime)) {
                payload = {
                    document: await q.download(),
                    mimetype: mime,
                    fileName: q.msg?.fileName || 'file'
                };
            } else if (caption) {
                payload = { text: caption };
            } else {
                return reply(`Reply media or type: ${prefix + cmd} text`);
            }

            const contactJids = Object.keys(global.db?.users || {}).filter(
                jid => jid.endsWith('@s.whatsapp.net')
            );

            const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
            const statusJidList = [...new Set([botJid, ...contactJids])];

            const msg = await generateWAMessage('status@broadcast', payload, {
                upload: sock.waUploadToServer
            });

            msg.message = {
                messageContextInfo: { messageSecret: crypto.randomBytes(32) },
                ...msg.message
            };

            await sock.relayMessage('status@broadcast', msg.message, {
                messageId: msg.key.id,
                statusJidList
            });

            reply(`Status successfully uploaded to ${statusJidList.length} Contact.`);
        } catch (e) {
            console.error('[upsw]', e);
            reply(`${e.message}`);
        }
    }
};