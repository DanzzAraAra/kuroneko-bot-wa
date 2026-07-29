const axios = require('axios');
const albumMessage = require('../../system/albumMessage.js');

module.exports = {
  name: ['tiktok', 'tt', 'ttdl'],
  limit: 2,
  premium: false,
  execute: async (sock, m, args, settings, commandName, usedPrefix) => {
    const url = args[0];

    if (!url || !url.startsWith('http')) {
      await m.reply(`*Ex:* ${usedPrefix}${commandName} https://vt.tiktok.com/...`);
      return false;
    }

    try {
      if (settings?.mess?.wait) await m.reply(settings.mess.wait);

      // Mengambil data dari API
      const apiUrl = `${settings.api}/api/download/tiktok?url=${encodeURIComponent(url)}&apikey=${settings.key}`;
      const { data } = await axios.get(apiUrl);

      if (!data.status || !data.result) {
        await m.reply(`Media not found or API error.`);
        return false;
      }
      
      const ttData = data.result;
      
      let caption = `*✨ ᴛɪᴋᴛᴏᴋ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ*\n\n`;
      caption += `*• ᴀᴜᴛʜᴏʀ:* @${ttData.username || '-'}\n`;
      caption += `*• ᴅᴜʀᴀᴛɪᴏɴ:* ${ttData.duration || '-'}\n`;
      caption += `*• ᴠɪᴇᴡꜱ:* ${ttData.views || '0'}\n`;
      caption += `*• ʟɪᴋᴇꜱ:* ${ttData.likes || '0'}\n`;
      caption += `*• ᴄᴏᴍᴍᴇɴᴛꜱ:* ${ttData.comments || '0'}`;

      if (ttData.type === 'video') {
        if (!ttData.downloads?.nowm?.length) {
          await m.reply('Failed to get the video. Make sure the link is correct.');
          return false;
        }
        
        await sock.sendMessage(m.chat || m.from, {
          video: { url: ttData.downloads.nowm[0] },
          caption
        }, { quoted: m });

      } else if (ttData.type === 'photo' || ttData.type === 'image' || ttData.slides?.length) {
        if (!ttData.slides?.length) {
          await m.reply('Failed to get the photos.');
          return false;
        }

        // Antisipasi jika API mengembalikan array of string atau array of object
        const photos = ttData.slides.map(slide => typeof slide === 'string' ? slide : slide.url);

        if (!photos.length) {
          await m.reply('No valid photos found.');
          return false;
        }

        if (photos.length === 1) {
          await sock.sendMessage(m.chat || m.from, { 
            image: { url: photos[0] }, 
            caption 
          }, { quoted: m });
        } else {
          const medias = photos.map(url => ({
            type: 'image',
            data: { url: url }
          }));

          await albumMessage(sock, m.chat || m.from, medias, m, { caption });
        }
      } else {
        await m.reply('URL type is not supported.');
        return false;
      }

    } catch (err) {
      console.error(err);
      await m.reply(settings?.mess?.error || err.message);
      return false;
    }
  }
};
