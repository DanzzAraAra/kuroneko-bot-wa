import axios from 'axios';

export default {
  name: ['kusonime-search'],
  limit: 2,
  premium: false,

  execute: async (sock, m, args, settings, commandName, usedPrefix) => {
    const query = args.join(' ');
    if (!query)
      return m.reply(`*Ex:* ${usedPrefix}${commandName} naruto`);

    try {
      if (settings?.mess?.wait)
        await m.reply(settings.mess.wait);

      const apiUrl = `${settings.api}/api/anime/kusonime-search?q=${encodeURIComponent(query)}&apikey=${settings.key}`;
      const { data } = await axios.get(apiUrl, { timeout: 60000 });

      if (!data?.status || !Array.isArray(data?.result?.results) || !data.result.results.length)
        return m.reply(`Anime "${query}" tidak ditemukan`);

      const results = data.result.results;
      const caption = results.map((anime, i) => [
        `*${i + 1}. ${anime.title || 'Tanpa judul'}*`,
        anime.genres || '',
        anime.posted_by || '',
        anime.posted_on || '',
        anime.url || ''
      ].filter(Boolean).join('\n')).join('\n\n');

      const message = `*KUSONIME SEARCH*\nKata kunci: ${data.result.query || query}\nTotal: ${data.result.total ?? results.length}\n\n${caption}`;
      const first = results[0];

      if (first?.thumbnail) {
        try {
          const image = await axios.get(first.thumbnail, {
            responseType: 'arraybuffer',
            timeout: 30000
          });

          await sock.sendMessage(m.chat || m.from, {
            image: Buffer.from(image.data),
            caption: message
          }, { quoted: m });
        } catch {
          await m.reply(message);
        }
      } else {
        await m.reply(message);
      }
    } catch (err) {
      await m.reply(settings?.mess?.error || err.message);
      return false;
    }
  }
};