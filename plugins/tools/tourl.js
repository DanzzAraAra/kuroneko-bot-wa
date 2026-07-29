const { downloadMediaMessage } = require('baileys');
const { uploader } = require('../../src/uploader.js'); 

module.exports = {
  name: ['tourl'],
  limit: 1,
  premium: false,
  execute: async (sock, m, args, settings, commandName, usedPrefix) => {
    try {
      const q = m.quoted ? m.quoted : m;
      const mime = (q.msg || q).mimetype || '';

      if (!mime) {
        await m.reply(`Send or reply media with caption *${usedPrefix}${commandName}*`);
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
        await m.reply("Failed to download media from message.");
        return false;
      }

      const url = await uploader(buffer);
      await m.reply(`*SUCCESSFUL UPLOAD*\n\n*URL:* ${url}`);

    } catch (err) {
      console.error(err);
      await m.reply((err.message || String(err)));
      return false;
    }
  }
};
