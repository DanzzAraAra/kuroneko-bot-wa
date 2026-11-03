import axios from 'axios';

export default {
  name: ['otakudesu-search'],
  limit: 2,
  premium: false,

  execute: async (sock, m, args, settings, commandName, usedPrefix) => {
    const query = args.join(' ');
    if (!query)
      return m.reply(`*Ex:* ${usedPrefix}${commandName} naruto`);

    try {
      if (settings?.mess?.wait)
        await m.reply(settings.mess.wait);

      const apiUrl = `${settings.api}/api/anime/otakudesu-search?q=${encodeURIComponent(query)}&apikey=${settings.key}`;
      const { data } = await axios.get(apiUrl, { timeout: 60000 });

      if (!data?.status || !Array.isArray(data?.result) || !data.result.length)
        return m.reply(`Anime "${query}" tidak ditemukan`);

      const results = data.result;
      const caption = results.map((anime, i) => [
        `*${i + 1}. ${anime.title || 'Tanpa judul'}*`,
        `Episode: ${anime.episode || '-'}`,
        `Rating: ${anime.rating || '-'}`,
        `Link: ${anime.link || '-'}`,
        `Poster: ${anime.image_url || ''}`
      ].filter(Boolean).join('\n')).join('\n\n');

      const message = [
        '*OTAKUDESU SEARCH*',
        `Kata kunci: ${query}`,
        `Total hasil: ${results.length}`,
        '',
        caption
      ].join('\n');

      const first = results[0];

      if (first?.image_url) {
        try {
          const image = await axios.get(first.image_url, {
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