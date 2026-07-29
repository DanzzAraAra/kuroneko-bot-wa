const axios = require('axios');

module.exports = {
  name: ['capcut', 'cc', 'ccdl'],
  limit: 2,
  premium: false,
  execute: async (sock, m, args, settings, commandName, usedPrefix) => {
    const url = args[0];

    if (!url || !url.startsWith('http')) {
      await m.reply(`*Ex:* ${usedPrefix}${commandName} https://www.capcut.com/t/...`);
      return false;
    }

    try {
      if (settings?.mess?.wait) await m.reply(settings.mess.wait);

      const apiUrl = `${settings.api}/api/download/capcut?url=${encodeURIComponent(url)}&apikey=${settings.key}`;
      const { data } = await axios.get(apiUrl);

      if (!data.status || !data.data) {
        await m.reply('Gagal mengambil data dari CapCut.');
        return false;
      }

      const ccData = data.data;

      let caption = `*✨ ᴄᴀᴘᴄᴜᴛ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ*\n\n`;
      caption += `*• ᴛɪᴛʟᴇ:* ${ccData.title || '-'}\n`;
      caption += `*• ᴀᴜᴛʜᴏʀ:* ${ccData.author || '-'}`;

      if (ccData.video_url) {
        await sock.sendMessage(m.chat || m.from, {
          video: { url: ccData.video_url },
          caption: caption,
          mimetype: 'video/mp4'
        }, { quoted: m });
      } else {
        await m.reply('URL Video tidak ditemukan.');
      }

    } catch (err) {
      console.error(err);
      await m.reply(settings?.mess?.error || err.message);
      return false;
    }
  }
};