const axios = require('axios');

module.exports = {
  name: ['ytmp4', 'ytv'],
  limit: 2,
  premium: false,
  execute: async (sock, m, args, settings, commandName, usedPrefix) => {
    const url = args[0];

    if (!url || (!url.includes('youtube.com') && !url.includes('youtu.be'))) {
      await m.reply(`*Ex:* ${usedPrefix}${commandName} https://youtu.be/...`);
      return false;
    }

    try {
      if (settings?.mess?.wait) await m.reply(settings.mess.wait);

      const apiUrl = `${settings.api}/api/download/ytmp4?url=${encodeURIComponent(url)}&apikey=${settings.key}`;
      const { data } = await axios.get(apiUrl);

      if (!data.status || !data.result) {
        await m.reply('Gagal mengambil data video dari YouTube.');
        return false;
      }

      const ytData = data.result;

      let caption = `*✨ ʏᴏᴜᴛᴜʙᴇ ᴍᴘ4 ᴅᴏᴡɴʟᴏᴀᴅᴇʀ*\n\n`;
      caption += `*• ᴛɪᴛʟᴇ:* ${ytData.title || '-'}`;

      const getMedia = await axios.get(ytData.download_url, { 
          responseType: 'arraybuffer' 
      });
      const videoBuffer = Buffer.from(getMedia.data, 'binary');

      await sock.sendMessage(m.chat || m.from, {
        video: videoBuffer,
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
