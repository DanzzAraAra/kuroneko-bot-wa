const axios = require('axios');

module.exports = {
  name: ['deepseek', 'deepsek'],
  limit: 2,
  premium: false,
  execute: async (sock, m, args, settings, commandName, usedPrefix) => {
    const text = args.join(' ');

    if (!text) {
      await m.reply(`*Ex:* ${usedPrefix}${commandName} halo deepseek, apa itu kuroneko api`);
      return false;
    }

    try {
      if (settings?.mess?.wait) await m.reply(settings.mess.wait);

      const apiUrl = `${settings.api}/api/ai/deepsek?q=${encodeURIComponent(text)}&apikey=${settings.key}`;
      const { data } = await axios.get(apiUrl);

      if (!data.status || !data.answer) {
        await m.reply('Gagal mendapatkan balasan dari DeepSeek AI.');
        return false;
      }

      await m.reply(data.answer);

    } catch (err) {
      console.error(err);
      await m.reply(settings?.mess?.error || err.message);
      return false;
    }
  }
};