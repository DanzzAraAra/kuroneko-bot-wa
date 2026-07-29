const axios = require('axios');

module.exports = {
  name: ['ytmp3', 'yta'],
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

      const apiUrl = `${settings.api}/api/download/ytmp3?url=${encodeURIComponent(url)}&apikey=${settings.key}`;
      const { data } = await axios.get(apiUrl);

      if (!data.status || !data.data) {
        await m.reply('Gagal mengambil data audio dari YouTube.');
        return false;
      }

      const ytData = data.data;

      let caption = `*✨ ʏᴏᴜᴛᴜʙᴇ ᴍᴘ3 ᴅᴏᴡɴʟᴏᴀᴅᴇʀ*\n\n`;
      caption += `*• ᴛɪᴛʟᴇ:* ${ytData.title || '-'}\n`;
      caption += `*• ᴅᴜʀᴀᴛɪᴏɴ:* ${ytData.duration || '-'}\n`;
      if (ytData.size) {
          caption += `*• ꜱɪᴢᴇ:* ${ytData.size}`;
      }

      await sock.sendMessage(m.chat || m.from, {
        image: { url: ytData.thumbnail },
        caption: caption
      }, { quoted: m });

      await sock.sendMessage(m.chat || m.from, {
        document: { url: ytData.url },
        mimetype: 'audio/mpeg',
        fileName: `${ytData.title || 'audio'}.mp3`
      }, { quoted: m });

    } catch (err) {
      console.error(err);
      await m.reply(settings?.mess?.error || err.message);
      return false;
    }
  }
};