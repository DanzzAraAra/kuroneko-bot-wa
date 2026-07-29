const axios = require('axios');
const FormData = require('form-data');
const { downloadContentFromMessage } = require('baileys');

module.exports = {
  name: ['toonmix', 'toon'],
  limit: 4,
  premium: false,
  execute: async (sock, m, args, settings, commandName, usedPrefix) => {
    try {
      const msg = m.quoted || m;
      const mediaMessage =
        msg.message?.imageMessage ||
        msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;

      const prompt = args.join(' ');
      let buffer = null;

      if (mediaMessage) {
        if (settings?.mess?.wait) await m.reply(settings.mess.wait);

        if (typeof msg.download === 'function') {
          buffer = await msg.download();
        } else {
          const stream = await downloadContentFromMessage(mediaMessage, 'image');
          buffer = Buffer.alloc(0);

          for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
          }
        }
      } else {
        if (!prompt) {
          await m.reply(`*Ex (Txt2Img):* ${usedPrefix}${commandName} a cute anime girl\n*Ex (Img2Img):* Kirim/balas gambar dengan caption ${usedPrefix}${commandName} anime style`);
          return false;
        }
        if (settings?.mess?.wait) await m.reply(settings.mess.wait);
      }

      const form = new FormData();
      form.append('prompt', prompt || '');
      form.append('apikey', settings.key);
      if (buffer) {
        form.append('image', buffer, { filename: 'image.jpg', contentType: 'image/jpeg' });
      }

      const apiUrl = `${settings.api}/api/ai/toonmix`;
      const { data } = await axios.post(apiUrl, form, {
        headers: {
          ...form.getHeaders()
        }
      });

      if (!data.status || !data.url) {
        await m.reply('Gagal memproses gambar dengan Toonmix.');
        return false;
      }

      let caption = `*✨ ᴛᴏᴏɴᴍɪx ɢᴇɴᴇʀᴀᴛᴏʀ*\n\n`;
      caption += `*• ᴍᴏᴅᴇʟ:* ${data.metadata?.model || '-'}\n`;
      caption += `*• ꜱᴇᴇᴅ:* ${data.metadata?.seed || '-'}\n`;
      caption += `*• ᴘʀᴏᴍᴘᴛ:* ${prompt || '-'}`;

      await sock.sendMessage(m.chat || m.from, {
        image: { url: data.url },
        caption: caption
      }, { quoted: m });

    } catch (err) {
      console.error(err);
      await m.reply(settings?.mess?.error || err.message);
      return false;
    }
  }
};