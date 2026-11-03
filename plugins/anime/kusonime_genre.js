import axios from 'axios';

export default {
  name: ['kusonime-genre'],
  limit: 3,
  premium: false,

  execute: async (sock, m, args, settings, commandName, usedPrefix) => {
    const genre = args[0]?.trim();
    const page = Math.max(1, parseInt(args[1], 10) || 1);

    if (!genre)
      return m.reply(`*Ex:* ${usedPrefix}${commandName} romance 1`);

    try {
      if (settings?.mess?.wait)
        await m.reply(settings.mess.wait);

      const apiUrl = `${settings.api}/api/anime/kusonime-genre?genre=${encodeURIComponent(genre)}&page=${page}&apikey=${settings.key}`;
      const { data } = await axios.get(apiUrl, { timeout: 60000 });

      const result = data?.result;
      const results = result?.results;

      if (!data?.status || !Array.isArray(results) || !results.length)
        return m.reply(`Anime genre "${genre}" tidak ditemukan di halaman ${page}.`);

      const caption = results.map((anime, i) => [
        `*${i + 1}. ${anime.title || 'Tanpa judul'}*`,
        anime.genres || '',
        anime.posted_by || '',
        anime.posted_on || '',
        anime.url || ''
      ].filter(Boolean).join('\n')).join('\n\n');

      const message = [
        '*KUSONIME GENRE*',
        `Genre: ${(result.genre || genre).toUpperCase()}`,
        `Halaman: ${result.page || page}`,
        `Total: ${result.total ?? results.length}`,
        '',
        caption
      ].join('\n');

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