import axios from 'axios';
import { uploader } from '../../src/uploader.js';

export default {
  name: ['img2prompt'],
  limit: 3,
  premium: false,

  execute: async (sock, m, args, settings, commandName, usedPrefix) => {
    try {
      const q = m.quoted || m;
      const type = sock.getMediaType(q);

      if (type !== 'image')
        return m.reply(`*Ex:* Kirim gambar dengan caption *${usedPrefix}${commandName}* atau reply gambar`);

      if (settings?.mess?.wait)
        await m.reply(settings.mess.wait);

      const buffer = await sock.downloadMedia(q);

      if (!buffer?.length)
        return m.reply('Gagal mengunduh gambar');

      const imageUrl = await uploader(buffer);
      const apiUrl = `${settings.api}/api/ai/img2prompt?url=${encodeURIComponent(imageUrl)}&apikey=${settings.key}`;
      const { data } = await axios.get(apiUrl, { timeout: 60000 });

      if (!data?.status || !data?.prompt)
        return m.reply('error');

      await m.reply(data.prompt);
    } catch (err) {
      await m.reply(settings?.mess?.error || err.message);
      return false;
    }
  }
};
