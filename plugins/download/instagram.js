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
      let mediaList = [];

      if (res.media?.slides && res.media.slides.length > 0) {
        res.media.slides.forEach(slide => {
          if (slide.videos && slide.videos.length > 0) {
            mediaList.push({ url: slide.videos[0].url, type: 'video' });
          } else if (slide.images && slide.images.length > 0) {
            mediaList.push({ url: slide.images[0].url, type: 'image' });
          }
        });
      } else if (res.media?.videos && res.media.videos.length > 0) {
        mediaList.push({ url: res.media.videos[0].url, type: 'video' });
      } else if (res.media?.thumbnail && !res.metadata?.isVideo) {
        mediaList.push({ url: res.media.thumbnail, type: 'image' });
      } else if (res.media?.thumbnail && res.metadata?.isVideo && res.media.videos) {
         mediaList.push({ url: res.media.videos[0].url, type: 'video' });
      }

      if (!mediaList.length) {
        await m.reply('Failed to get media link.');
        return false;
      }

      const authorName = res.author?.username || '-';
      const likesCount = res.metadata?.likeCount ?? '0';
      const commentsCount = res.metadata?.commentCount ?? '0';
      const postCaption = res.metadata?.caption || '';

      let caption = `*✨ ɪɴꜱᴛᴀɢʀᴀᴍ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ*\n\n`;
      caption += `*• ᴀᴜᴛʜᴏʀ:* @${authorName}\n`;
      caption += `*• ʟɪᴋᴇꜱ:* ${likesCount}\n`;
      caption += `*• ᴄᴏᴍᴍᴇɴᴛꜱ:* ${commentsCount}`;
      
      if (postCaption) {
        caption += `\n\n*• ᴄᴀᴘᴛɪᴏɴ:*\n${postCaption}`;
      }

      if (mediaList.length === 1) {
        const item = mediaList[0];
        const isVideo = item.type === 'video' || item.url.includes('.mp4') || res.metadata?.isVideo;

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
