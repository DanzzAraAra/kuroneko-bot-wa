import axios from 'axios';

const sessions = new Map();

export default {
  name: ['chatgpt'],
  limit: 2,
  premium: false,

  execute: async (sock, m, args, settings, commandName, usedPrefix) => {
    const prompt = args.join(' ');
    const sender = m.sender || m.key?.participant || m.chat || m.from;

    if (!prompt)
      return m.reply(`*Ex:* ${usedPrefix}${commandName} Hi`);

    try {
      if (settings?.mess?.wait)
        await m.reply(settings.mess.wait);

      const session = sessions.get(sender) || {};
      const apiUrl = `${settings.api}/api/ai/chatgpt?prompt=${encodeURIComponent(prompt)}&chat_id=${encodeURIComponent(session.chat_id || '')}&auth=${encodeURIComponent(session.auth || '')}&apikey=${settings.key}`;
      const { data } = await axios.get(apiUrl, { timeout: 120000 });

      if (!data?.status || !data?.result?.response)
        return m.reply('Gagal mendapatkan respons');

      sessions.set(sender, {
        chat_id: data.result.chat_id || session.chat_id || '',
        auth: data.result.auth || session.auth || ''
      });

      await m.reply(data.result.response);
    } catch (err) {
      await m.reply(settings?.mess?.error || err.message);
      return false;
    }
  }
};