import axios from 'axios';

export default {
  name: ['kusonime-latest'],
  limit: 1,
  premium: false,

  execute: async (sock, m, args, settings, commandName, usedPrefix) => {
    const page = Math.max(1, parseInt(args[0], 10) || 1);

    try {
      if (settings?.mess?.wait)
        await m.reply(settings.mess.wait);

      const apiUrl = `${settings.api}/api/anime/kusonime-latest?page=${page}&apikey=${settings.key}`;
      const { data } = await axios.get(apiUrl, { timeout: 60000 });

      if (!data?.status || !Array.isArray(data?.result?.results) || !data.result.results.length)
        return m.reply(`Tidak ada anime terbaru di halaman ${page}.`);

      const results = data.result.results;
      const caption = results.map((anime, i) => [
        `*${i + 1}. ${anime.title || 'Tanpa judul'}*`,
        anime.genres || '',
        anime.posted_by || '',
        anime.posted_on || '',
        anime.url || ''
      ].filter(Boolean).join('\n')).join('\n\n');

      const message = `*KUSONIME LATEST*\nHalaman: ${page}\nTotal: ${data.result.total ?? results.length}\n\n${caption}`;
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