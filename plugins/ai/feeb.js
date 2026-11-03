import axios from 'axios';

const sessions = new Map();

export default {
  name: ['feeb'],
  limit: 2,
  premium: false,

  execute: async (sock, m, args, settings, commandName, usedPrefix) => {
    const text = args.join(' ');
    if (!text)
      return m.reply(`*Ex:* ${usedPrefix}${commandName} hai`);

    try {
      if (settings?.mess?.wait)
        await m.reply(settings.mess.wait);

      const sender = m.sender || m.key?.participant || m.key?.remoteJid;
      const apiUrl = `${settings.api}/api/ai/feeb?q=${encodeURIComponent(text)}&session=${encodeURIComponent(sessions.get(sender) || '')}&apikey=${settings.key}`;
      const { data } = await axios.get(apiUrl, { timeout: 60000 });

      if (!data?.status || !data?.result)
        return m.reply('error');

      if (data.sessionId)
        sessions.set(sender, data.sessionId);

      await m.reply(data.result);
    } catch (err) {
      await m.reply(settings?.mess?.error || err.message);
    }
  }
};