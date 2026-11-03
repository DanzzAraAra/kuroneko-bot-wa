import axios from 'axios';

export default {
  name: ['kuroneko'],
  limit: 1,
  premium: false,

  execute: async (sock, m, args, settings, commandName, usedPrefix) => {
    const text = args.join(' ');
    if (!text)
      return m.reply(`*Ex:* ${usedPrefix}${commandName} halo`);

    try {
      if (settings?.mess?.wait)
        await m.reply(settings.mess.wait);

      const apiUrl = `${settings.api}/api/ai/kuroneko?q=${encodeURIComponent(text)}&session=&apikey=${settings.key}`;
      const { data } = await axios.get(apiUrl, { timeout: 60000 });

      if (!data?.status || !data?.response)
        return m.reply('error');

      await m.reply(data.response);
    } catch (err) {
      await m.reply(settings?.mess?.error || err.message);
    }
  }
};