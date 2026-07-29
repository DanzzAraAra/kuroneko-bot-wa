const axios = require('axios');

module.exports = {
  name: ['facebook', 'fb', 'fbdl'],
  limit: 2,
  premium: false,
  execute: async (sock, m, args, settings, commandName, usedPrefix) => {
    const url = args[0];

    if (!url || !url.startsWith('http')) {
      await m.reply(`*Ex:* ${usedPrefix}${commandName} https://www.facebook.com/...`);
      return false; 
    }

    try {
      if (settings?.mess?.wait) await m.reply(settings.mess.wait);

      const apiUrl = `${settings.api}/api/download/facebook?url=${encodeURIComponent(url)}&apikey=${settings.key}`;
      const { data } = await axios.get(apiUrl);

      if (!data.status || !data.data) {
        await m.reply('Failed to get video link or API error.');
        return false;
      }

      const { title, description, hd, sd } = data.data;
      const vid = hd || sd; 

      if (!vid) {
        await m.reply('Failed to get video link.');
        return false;
      }

      let caption = `*✨ ꜰᴀᴄᴇʙᴏᴏᴋ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ*\n\n`;
      caption += `*• ᴛɪᴛʟᴇ:* ${title || '-'}`;
      
      if (description && description !== "No Description" && !description.includes("No video description")) {
          caption += `\n\n*• ᴅᴇꜱᴄ:* ${description.trim()}`;
      }

      await sock.sendMessage(m.chat || m.from, {
        video: { url: vid },
        caption: caption
      }, { quoted: m });

    } catch (err) {
      console.error(err);
      await m.reply(settings?.mess?.error || err.message);
      return false;
    }
  }
};