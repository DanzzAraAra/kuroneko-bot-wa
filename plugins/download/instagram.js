const axios = require('axios');
const albumMessage = require('../../system/albumMessage.js');

module.exports = {
  name: ['instagram', 'ig', 'igdl'],
  limit: 2,
  premium: false,
  execute: async (sock, m, args, settings, commandName, usedPrefix) => {
    const url = args[0];

    if (!url || !/instagram\.com|instagr\.am/.test(url)) {
      await m.reply(`*Ex:* ${usedPrefix}${commandName} https://www.instagram.com/p/...`);
      return false;
    }

    try {
      if (settings?.mess?.wait) await m.reply(settings.mess.wait);

      const apiUrl = `${settings.api}/api/download/instagram?url=${encodeURIComponent(url)}&apikey=${settings.key}`;
      const { data } = await axios.get(apiUrl);

      if (!data || !data.status || !data.data) {
        await m.reply('Media not found or API error.');
        return false;
      }

      const res = data.data;
      const mediaList = res.mediaUrls && res.mediaUrls.length > 0 
        ? res.mediaUrls 
        : (res.downloadUrl ? [{ url: res.downloadUrl, type: res.type === 'reel' || res.type === 'video' ? 'video' : 'image' }] : []);

      if (!mediaList.length) {
        await m.reply('Failed to get media link.');
        return false;
      }

      // Menyusun caption
      let caption = `*✨ ɪɴꜱᴛᴀɢʀᴀᴍ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ*\n\n`;
      caption += `*• ᴀᴜᴛʜᴏʀ:* ${res.author || '-'}\n`;
      caption += `*• ᴛɪᴛʟᴇ:* ${res.title || '-'}\n`;
      caption += `*• ʟɪᴋᴇꜱ:* ${res.likes ?? '0'}\n`;
      caption += `*• ᴄᴏᴍᴍᴇɴᴛꜱ:* ${res.comments ?? '0'}`;
      
      if (res.caption_full) {
        caption += `\n\n*• ᴄᴀᴘᴛɪᴏɴ:* ${res.caption_full}`;
      }

      if (mediaList.length === 1) {
        const item = mediaList[0];
        const isVideo = item.type === 'video' || item.url.includes('.mp4') || res.type === 'reel';

        if (isVideo) {
          await sock.sendMessage(m.chat || m.from, {
            video: { url: item.url },
            caption
          }, { quoted: m });
        } else {
          await sock.sendMessage(m.chat || m.from, {
            image: { url: item.url },
            caption
          }, { quoted: m });
        }
      } else {
        const medias = mediaList.map(item => ({
          type: item.type === 'video' || item.url.includes('.mp4') ? 'video' : 'image',
          data: { url: item.url }
        }));

        await albumMessage(sock, m.chat || m.from, medias, m, { caption });
      }

    } catch (err) {
      console.error(err);
      await m.reply(settings?.mess?.error || err.message);
      return false;
    }
  }
};