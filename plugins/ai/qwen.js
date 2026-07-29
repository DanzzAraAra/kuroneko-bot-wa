const axios = require('axios');

module.exports = {
  name: ['qwen', 'qwenai'],
  limit: 2,
  premium: false,
  execute: async (sock, m, args, settings, commandName, usedPrefix) => {
    const text = args.join(' ');

    if (!text) {
      await m.reply(`*Ex:* ${usedPrefix}${commandName} halo qwen`);
      return false;
    }

    try {
      if (settings?.mess?.wait) await m.reply(settings.mess.wait);

      const apiUrl = `${settings.api}/api/ai/qwen?q=${encodeURIComponent(text)}&apikey=${settings.key}`;
      const { data } = await axios.get(apiUrl);

      if (!data.status || !data.result) {
        await m.reply('Gagal mendapatkan balasan dari Qwen AI.');
        return false;
      }

      await m.reply(data.result);

    } catch (err) {
      console.error(err);
      await m.reply(settings?.mess?.error || err.message);
      return false;
    }
  }
};