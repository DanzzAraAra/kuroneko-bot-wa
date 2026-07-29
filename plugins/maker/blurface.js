const axios = require('axios');
const FormData = require('form-data');
const { downloadContentFromMessage } = require('baileys');

module.exports = {
  name: ['blurface', 'blur', 'faceblur'],
  limit: 4,
  premium: false,
  execute: async (sock, m, args, settings, commandName, usedPrefix) => {
    try {
      const msg = m.quoted || m;
      const mediaMessage =
        msg.message?.imageMessage ||
        msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;

      if (!mediaMessage) {
        await m.reply(`*Ex:* ${usedPrefix}${commandName} reply or send image`);
        return false;
      }

      await m.reply(settings.mess.wait);

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

      const form = new FormData();
      form.append('image', buffer, { filename: 'image.jpg', contentType: 'image/jpeg' });
      form.append('apikey', settings.key);

      const apiUrl = `${settings.api}/api/maker/blurface`;
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
          image: resultBuffer
        },
        { quoted: m }
      );
    } catch (err) {
      await m.reply(err.message || String(err));
      return false;
    }
  }
};