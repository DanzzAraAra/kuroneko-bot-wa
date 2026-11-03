import axios from 'axios';

export default {
  name: ['bypassai'],
  limit: 3,
  premium: false,

  execute: async (sock, m, args, settings, commandName, usedPrefix) => {
    const text = args.join(' ');
    if (!text)
      return m.reply(`*Ex:* ${usedPrefix}${commandName} halo`);

    try {
      if (settings?.mess?.wait)
        await m.reply(settings.mess.wait);

      const apiUrl = `${settings.api}/api/ai/bypassai?q=${encodeURIComponent(text)}&apikey=${settings.key}`;
      const { data } = await axios.get(apiUrl);

      if (!data?.status || !data?.result)
        return m.reply('error');

      await m.reply(data.result);
    } catch (err) {
      await m.reply(settings?.mess?.error || err.message);
    }
  }
};