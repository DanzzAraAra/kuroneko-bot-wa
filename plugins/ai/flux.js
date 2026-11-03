import axios from 'axios';

export default {
  name: ['flux'],
  limit: 3,
  premium: false,

  execute: async (sock, m, args, settings, commandName, usedPrefix) => {
    const prompt = args.join(' ');
    if (!prompt)
      return m.reply(`*Ex:* ${usedPrefix}${commandName} girl in the rain`);

    try {
      if (settings?.mess?.wait)
        await m.reply(settings.mess.wait);

      const apiUrl = `${settings.api}/api/ai/flux?prompt=${encodeURIComponent(prompt)}&apikey=${settings.key}`;
      const { data } = await axios.get(apiUrl, { timeout: 120000 });

      if (!data?.status || !data?.url)
        return m.reply('Gagal generate gambar');

      const response = await axios.get(data.url, {
        responseType: 'arraybuffer',
        timeout: 120000
      });

      await sock.sendMessage(m.chat || m.from, {
        image: Buffer.from(response.data),
        caption: `*FLUX IMAGE GENERATOR*\n\n*Prompt:* ${prompt}`
      }, { quoted: m });
    } catch (err) {
      await m.reply(settings?.mess?.error || err.message);
      return false;
    }
  }
};