const axios = require('axios');

module.exports = {
  name: ['pinterest', 'pin', 'pindl'],
  limit: 2,
  premium: false,
  execute: async (sock, m, args, settings, commandName, usedPrefix) => {
    const url = args[0];

    if (!url || !url.startsWith('http')) {
      await m.reply(`*Ex:* ${usedPrefix}${commandName} https://id.pinterest.com/pin/...`);
      return false;
    }

    try {
      if (settings?.mess?.wait) await m.reply(settings.mess.wait);

      const apiUrl = `${settings.api}/api/download/pinterest?url=${encodeURIComponent(url)}&apikey=${settings.key}`;
      const { data } = await axios.get(apiUrl);

      if (!data.status || !data.data) {
        await m.reply('Failed to get media from Pinterest.');
        return false;
      }

      const pinData = data.data.d1?.data?.v3GetPinQueryv2?.data;

      if (!pinData) {
        await m.reply('Media data not found in API response.');
        return false;
      }

      const title = pinData.title || pinData.gridTitle || '-';
      let caption = `*✨ ᴘɪɴᴛᴇʀᴇꜱᴛ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ*\n\n`;
      caption += `*• ᴛɪᴛʟᴇ:* ${title}\n`;
      
      if (pinData.nativeCreator?.fullName) {
          caption += `*• ᴄʀᴇᴀᴛᴏʀ:* ${pinData.nativeCreator.fullName}\n`;
      }

      const storyPinPages = pinData.storyPinData?.pages;
      const isVideo = storyPinPages && storyPinPages.length > 0 && storyPinPages[0].blocks && storyPinPages[0].blocks.length > 0 && storyPinPages[0].blocks[0].videoDataV2;

      if (isVideo) {
          const videoBlocks = storyPinPages[0].blocks[0].videoDataV2;
          const videoUrl = videoBlocks.videoList720P?.v720P?.url || videoBlocks.videoList?.vHLSV3MOBILE?.url || videoBlocks.v_hlsv4_video_list?.vHLSV4?.url;
          
          if (!videoUrl) {
               await m.reply('Video URL not found.');
               return false;
          }

          if(videoUrl.includes('.m3u8')){
               await m.reply('Only HLS stream (.m3u8) found. Direct MP4 is required to send as video.');
               return false;
          }

          await sock.sendMessage(m.chat || m.from, {
              video: { url: videoUrl },
              caption: caption
          }, { quoted: m });
          
      } else {
          const imageUrl = pinData.images_orig?.url || pinData.imageLargeUrl;
          
          if (!imageUrl) {
               await m.reply('Image URL not found.');
               return false;
          }

          await sock.sendMessage(m.chat || m.from, {
              image: { url: imageUrl },
              caption: caption
          }, { quoted: m });
      }

    } catch (err) {
      console.error(err);
      await m.reply(settings?.mess?.error || err.message);
      return false;
    }
  }
};