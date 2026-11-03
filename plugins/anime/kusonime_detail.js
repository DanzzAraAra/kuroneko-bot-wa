import axios from 'axios';

export default {
  name: ['kusonime-detail'],
  limit: 2,
  premium: false,

  execute: async (sock, m, args, settings, commandName, usedPrefix) => {
    const url = args[0];

    if (!url)
      return m.reply(`*Ex:* ${usedPrefix}${commandName} https://kusonime.com/onihana-la-subtitle-indonesia/`);

    if (!/^https?:\/\/(www\.)?kusonime\.com\//i.test(url))
      return m.reply('Masukkan URL anime dari Kusonime');

    try {
      if (settings?.mess?.wait)
        await m.reply(settings.mess.wait);

      const apiUrl = `${settings.api}/api/anime/kusonime-detail?url=${encodeURIComponent(url)}&apikey=${settings.key}`;
      const { data } = await axios.get(apiUrl, { timeout: 60000 });
      const anime = data?.result;

      if (!data?.status || !anime)
        return m.reply('Gagal mengambil detail');

      const details = [
        `*${anime.title || 'KUSONIME DETAIL'}*`,
        anime.japanese ? `*Japanese:* ${anime.japanese}` : '',
        anime.type ? `*Type:* ${anime.type}` : '',
        anime.status ? `*Status:* ${anime.status}` : '',
        anime.total_episode ? `*Total Episode:* ${anime.total_episode}` : '',
        anime.duration ? `*Duration:* ${anime.duration}` : '',
        anime.released_on ? `*Released:* ${anime.released_on}` : '',
        anime.score ? `*Score:* ${anime.score}` : '',
        anime.producers ? `*Producers:* ${anime.producers}` : '',
        anime.genres?.length ? `*Genres:* ${anime.genres.join(', ')}` : '',
        anime.synopsis ? `\n*Synopsis:*\n${anime.synopsis}` : ''
      ].filter(Boolean).join('\n');

      const downloads = (anime.downloads || []).map(item => {
        const qualities = (item.links || []).map(quality => {
          const links = (quality.links || []).map(link =>
            `  • ${link.host}: ${link.url}`
          ).join('\n');

          return `*${quality.quality || 'Download'}*\n${links}`;
        }).join('\n\n');

        return `\n*${item.title || 'Download'}*\n${qualities}`;
      }).join('\n');

      const message = `${details}\n\n*Anime URL:*\n${anime.url || url}${downloads ? `\n\n*DOWNLOAD LINKS*\n${downloads}` : ''}`;

      if (anime.thumbnail) {
        try {
          const image = await axios.get(anime.thumbnail, {
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