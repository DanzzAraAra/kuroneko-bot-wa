const axios = require('axios');

module.exports = {
  name: ['videy', 'videydl'],
  limit: 2,
  premium: false,
  execute: async (sock, m, args, settings, commandName, usedPrefix) => {
    const url = args[0];

    if (!url || !url.includes('videy.co')) {
      await m.reply(`*Ex:* ${usedPrefix}${commandName} https://videy.co/v?id=...`);
      return false;
    }

    try {
      if (settings?.mess?.wait) await m.reply(settings.mess.wait);

      const apiUrl = `${settings.api}/api/download/videy?url=${encodeURIComponent(url)}&apikey=${settings.key}`;
      const { data } = await axios.get(apiUrl);

      const videoUrl = data?.result?.url || data?.result || data?.data?.url || data?.data || data?.url;

      if (!data?.status || !videoUrl || typeof videoUrl !== 'string') {
        await m.reply('Gagal mengambil video dari Videy.');
        return false;
      }

      let caption = `*✨ ᴠɪᴅᴇʏ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ*`;

      await sock.sendMessage(m.chat || m.from, {
        video: { url: videoUrl },
        caption: caption,
        mimetype: 'video/mp4'
      }, { quoted: m });

    } catch (err) {
      console.error(err);
      await m.reply(settings?.mess?.error || err.message);
      return false;
    }
  }
};