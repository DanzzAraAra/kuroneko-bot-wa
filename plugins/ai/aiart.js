const axios = require('axios');

module.exports = {
  name: ['aiart', 'txt2img'],
  limit: 3,
  premium: false,
  execute: async (sock, m, args, settings, commandName, usedPrefix) => {
    const prompt = args.join(' ');

    if (!prompt) {
      await m.reply(`*Ex:* ${usedPrefix}${commandName} girl in the rain`);
      return false;
    }

    try {
      if (settings?.mess?.wait) await m.reply(settings.mess.wait);

      const apiUrl = `${settings.api}/api/ai/aiart?q=${encodeURIComponent(prompt)}&apikey=${settings.key}`;
      const { data } = await axios.get(apiUrl);

      if (!data.status || !data.data || !data.data.url) {
        await m.reply('Gagal menghasilkan gambar dari AI.');
        return false;
      }

      const aiData = data.data;

      let caption = `*✨ ᴀɪ ᴀʀᴛ ɢᴇɴᴇʀᴀᴛᴏʀ*\n\n`;
      caption += `*• ᴘʀᴏᴍᴘᴛ:* ${aiData.prompt}`;

      await sock.sendMessage(m.chat || m.from, {
        image: { url: aiData.url },
        caption: caption
      }, { quoted: m });

    } catch (err) {
      console.error(err);
      await m.reply(settings?.mess?.error || err.message);
      return false;
    }
  }
};