const axios = require('axios');

module.exports = {
  name: ['feeb', 'feelbetter'],
  limit: 3,
  premium: false,
  execute: async (sock, m, args, settings, commandName, usedPrefix) => {
    const text = args.join(' ');

    if (!text) {
      await m.reply(`*Ex:* ${usedPrefix}${commandName} halo, aku mau cerita nih`);
      return false;
    }

    try {
      if (settings?.mess?.wait) await m.reply(settings.mess.wait);

      const sessionId = m.sender ? m.sender.split('@')[0] : 'default';
      const apiUrl = `${settings.api}/api/ai/feeb?q=${encodeURIComponent(text)}&session=${sessionId}&apikey=${settings.key}`;
      
      const { data } = await axios.get(apiUrl);

      if (!data.status || !data.result) {
        await m.reply('Gagal mendapatkan balasan dari FeelBetterBot.');
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