const axios = require('axios');

module.exports = {
  name: ['img2prompt', 'i2p', 'image2prompt'],
  limit: 3,
  premium: false,
  execute: async (sock, m, args, settings, commandName, usedPrefix) => {
    const url = args[0];

    if (!url || !url.startsWith('http')) {
      await m.reply(`*Ex:* ${usedPrefix}${commandName} <url gambar>`);
      return false;
    }

    try {
      if (settings?.mess?.wait) await m.reply(settings.mess.wait);

      const apiUrl = `${settings.api}/api/ai/img2prompt?url=${encodeURIComponent(url)}&apikey=${settings.key}`;
      const { data } = await axios.get(apiUrl);

      if (!data.status || !data.prompt) {
        await m.reply('Gagal menghasilkan prompt dari gambar.');
        return false;
      }

      let caption = `*✨ ɪᴍɢ ᴛᴏ ᴘʀᴏᴍᴘᴛ*\n\n`;
      caption += `${data.prompt}`;

      await m.reply(caption);

    } catch (err) {
      console.error(err);
      await m.reply(settings?.mess?.error || err.message);
      return false;
    }
  }
};