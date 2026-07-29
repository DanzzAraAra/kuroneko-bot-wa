const axios = require('axios');

module.exports = {
  name: ['txt2img'],
  limit: 4,
  premium: false,
  execute: async (sock, m, args, settings, commandName, usedPrefix) => {
    const text = args.join(' ');

    if (!text) {
      await m.reply(`*Ex:* ${usedPrefix}${commandName} futuristic city --ratio 1:1`);
      return false;
    }

    let prompt = text;
    let ratio = '1:1';

    const ratioMatch = text.match(/--ratio\s+([0-9:]+)/i);
    if (ratioMatch) {
      ratio = ratioMatch[1];
      prompt = text.replace(ratioMatch[0], '').trim();
    }

    try {
      if (settings?.mess?.wait) await m.reply(settings.mess.wait);

      const apiUrl = `${settings.api}/api/ai/txt2img?prompt=${encodeURIComponent(prompt)}&ratio=${encodeURIComponent(ratio)}&apikey=${settings.key}`;
      
      const response = await axios.get(apiUrl, { responseType: 'arraybuffer' });
      const imageBuffer = Buffer.from(response.data);

      let caption = `*✨ ᴛxᴛ2ɪᴍɢ ɢᴇɴᴇʀᴀᴛᴏʀ*\n\n`;
      caption += `*• ᴘʀᴏᴍᴘᴛ:* ${prompt}\n`;
      caption += `*• ʀᴀᴛɪᴏ:* ${ratio}`;

      await sock.sendMessage(m.chat || m.from, {
        image: imageBuffer,
        caption: caption
      }, { quoted: m });

    } catch (err) {
      console.error(err);
      await m.reply(settings?.mess?.error || err.message);
      return false;
    }
  }
};