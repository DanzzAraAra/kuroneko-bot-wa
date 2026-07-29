const baileys = require('baileys');
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

        let buf = Buffer.from(new Uint8Array(normalized));
        resolve(buf.toString('base64'));
      })
      .pipe()
      .on('data', chunk => chunks.push(chunk));
  });
}

async function groupStatus(sock, jid, content) {
  const inside = await baileys.generateWAMessageContent(content, {
    upload: sock.waUploadToServer
  });

  const messageSecret = crypto.randomBytes(32);
  const msg = baileys.generateWAMessageFromContent(
    jid,
    {
      messageContextInfo: { messageSecret },
      groupStatusMessageV2: {
        message: {
          ...inside,
          messageContextInfo: { messageSecret }
        }
      }
    },
    {}
  );

  await sock.relayMessage(jid, msg.message, { messageId: msg.key.id });
  return msg;
}

module.exports = {
  name: ['swgc'],
  execute: async (sock, m, args, settings) => {
    const reply = (text) => sock.sendMessage(m.from, { text }, { quoted: m });

    if (!m.isGroup) return reply(settings.mess.group);
    if (!m.isOwner) return reply(settings.mess.owner);

    const text = args.join(' ').trim();
    let [textInput, url] = text.split('|');

    let id;
    if (url) {
      try {
        const inviteCode = url.split('/').pop().split('?')[0];
        let geti = await sock.groupGetInviteInfo(inviteCode);
        id = geti.id;
      } catch {
        return reply('Failed to get JID group');
      }
    } else {
      id = m.from;
    }

    let q = m.quoted ? m.quoted : m;
    let mime = (q.msg || q).mimetype || '';
    let cap = q.caption || textInput;

    try {
      if (!mime && textInput) {
        await groupStatus(sock, id, { text: textInput });
      } else if (/image/.test(mime)) {
        const buffer = await q.download().catch(() => null);
        if (!buffer) return reply('Failed to get image!');
        await groupStatus(sock, id, { image: buffer, caption: cap });
      } else if (/video/.test(mime)) {
        const buffer = await q.download().catch(() => null);
        if (!buffer) return reply('Failed to get video!');
        await groupStatus(sock, id, { video: buffer, caption: cap });
      } else if (/audio/.test(mime)) {
        const buffer = await q.download().catch(() => null);
        if (!buffer) return reply('Failed to get audio!');
        const audioVn = await toVN(buffer);
        const audioWaveform = await generateWaveform(buffer);
        await groupStatus(sock, id, {
          audio: audioVn,
          waveform: audioWaveform,
          mimetype: 'audio/ogg; codecs=opus',
          ptt: true
        });
      } else {
        return reply('Reply with media (image/video/audio)');
      }

      return reply('*[🍀]* successful upload status');
    } catch (e) {
      console.error(e);
      return reply(settings.mess.error);
    }
  }
};