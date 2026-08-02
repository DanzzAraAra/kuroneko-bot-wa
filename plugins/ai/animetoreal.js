const axios = require('axios');
const { uploader } = require('../../src/uploader.js');

module.exports = {
  name: ['animetoreal', 'toreal'],
  limit: 3,
  premium: false,
  execute: async (sock, m, args, settings, commandName, usedPrefix) => {
    try {
      let url = args[0];
      let q = m.quoted ? m.quoted : m;
      let mime = (q.msg || q).mimetype || '';

      if (mime.includes('image')) {
        if (settings?.mess?.wait) await m.reply(settings.mess.wait);
        let media = await q.download();
        url = await uploader(media);
      } else if (!url || !url.startsWith('http')) {
        await m.reply(`*Ex:* ${usedPrefix}${commandName} <url gambar anime>\nAtau balas/kirim gambar dengan caption ${usedPrefix}${commandName}`);
        return false;
      } else {
        if (settings?.mess?.wait) await m.reply(settings.mess.wait);
      }

      const apiUrl = `${settings.api}/api/ai/animetoreal?url=${encodeURIComponent(url)}&apikey=${settings.key}`;
      const { data } = await axios.get(apiUrl);

      if (!data.status || !data.result || !data.result.result_url) {
        await m.reply('Gagal mengonversi gambar. Pastikan URL valid dan berisi gambar anime.');
        return false;
      }

      const aiData = data.result;

      let caption = `*✨ ᴀɴɪᴍᴇ ᴛᴏ ʀᴇᴀʟ*\n\n`;
      caption += `*• ᴛᴀꜱᴋ ɪᴅ:* ${aiData.task_id || '-'}`;

      await sock.sendMessage(m.chat || m.from, {
        image: { url: aiData.result_url },
        caption: caption
      }, { quoted: m });

    } catch (err) {
      console.error(err);
      await m.reply(settings?.mess?.error || err.message);
      return false;
    }
  }
};
