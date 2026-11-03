import axios from 'axios';

const sessions = new Map();

export default {
  name: ['aiseek'],
  limit: 2,
  premium: false,

  execute: async (sock, m, args, settings, commandName, usedPrefix) => {
    const text = args.join(' ');
    if (!text)
      return m.reply(`*Ex:* ${usedPrefix}${commandName} halo`);

    try {
      if (settings?.mess?.wait)
        await m.reply(settings.mess.wait);

      const sender = m.sender || m.key?.participant || m.key?.remoteJid;
      const apiUrl = `${settings.api}/api/ai/aiseek?prompt=${encodeURIComponent(text)}&session_id=${encodeURIComponent(sessions.get(sender) || '')}&apikey=${settings.key}`;
      const { data } = await axios.get(apiUrl);

      if (!data?.status || !data?.result?.response)
        return m.reply('error');

      if (data.result.session_id)
        sessions.set(sender, data.result.session_id);

      await m.reply(data.result.response);
    } catch (err) {
      await m.reply(settings?.mess?.error || err.message);
    }
  }
};