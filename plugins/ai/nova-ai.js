const axios = require('axios');

module.exports = {
  name: ['nova', 'novaai'],
  limit: 2,
  premium: false,
  execute: async (sock, m, args, settings, commandName, usedPrefix) => {
    const text = args.join(' ');

    if (!text) {
      await m.reply(`*Ex:* ${usedPrefix}${commandName} halo nova`);
      return false;
    }

    try {
      if (settings?.mess?.wait) await m.reply(settings.mess.wait);

      const apiUrl = `${settings.api}/api/ai/nova?q=${encodeURIComponent(text)}&apikey=${settings.key}`;
      const { data } = await axios.get(apiUrl);

      if (!data.status || !data.result || !data.result.text) {
        await m.reply('Gagal mendapatkan balasan dari Nova AI.');
        return false;
      }

      await m.reply(data.result.text);

    } catch (err) {
      console.error(err);
      await m.reply(settings?.mess?.error || err.message);
      return false;
    }
  }
};