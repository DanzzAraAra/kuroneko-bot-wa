import axios from 'axios';

export default {
  name: ['kusonime-genres'],
  limit: 3,
  premium: false,

  execute: async (sock, m, args, settings, commandName, usedPrefix) => {
    try {
      if (settings?.mess?.wait)
        await m.reply(settings.mess.wait);

      const apiUrl = `${settings.api}/api/anime/kusonime-genres?apikey=${settings.key}`;
      const { data } = await axios.get(apiUrl, { timeout: 60000 });

      if (!data?.status || !Array.isArray(data?.result) || !data.result.length)
        return m.reply('Gagal mengambil daftar genre');

      const genres = data.result.map((genre, i) => [
        `*${i + 1}. ${genre.name}*`,
        `Slug: ${genre.slug}`,
        `URL: ${genre.url}`
      ].join('\n')).join('\n\n');

      await m.reply(`*KUSONIME GENRES*\nTotal genre: ${data.result.length}\n\n${genres}\n\nGunakan:\n${usedPrefix}kusonime-genre romance 1`);
    } catch (err) {
      await m.reply(settings?.mess?.error || err.message);
      return false;
    }
  }
};