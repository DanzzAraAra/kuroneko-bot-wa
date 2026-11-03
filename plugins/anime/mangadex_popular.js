import axios from 'axios';

export default {
  name: ['mangadex-popular'],
  limit: 1,
  premium: false,

  execute: async (sock, m, args, settings, commandName, usedPrefix) => {
    const page = Math.max(1, parseInt(args[0], 10) || 1);

    try {
      if (settings?.mess?.wait)
        await m.reply(settings.mess.wait);

      const apiUrl = `${settings.api}/api/anime/mangadex-popular?page=${page}&apikey=${settings.key}`;
      const { data } = await axios.get(apiUrl, { timeout: 60000 });

      if (!data?.success || !Array.isArray(data?.data) || !data.data.length)
        return m.reply(`Manga populer tidak ditemukan di halaman ${page}.`);

      const mangaList = data.data.map((manga, i) => {
        const tags = (manga.tags || [])
          .map(tag => tag.name)
          .filter(Boolean)
          .slice(0, 8);

        const languages = (manga.availableTranslatedLanguages || []).join(', ');
        const index = ((data.pagination?.page || page) - 1) * (data.pagination?.limit || 20) + i + 1;

        return [
          `*${index}. ${manga.title || 'Tanpa judul'}*`,
          manga.year ? `Tahun: ${manga.year}` : '',
          manga.status ? `Status: ${manga.status}` : '',
          manga.publicationDemographic ? `Demografi: ${manga.publicationDemographic}` : '',
          manga.lastChapter ? `Chapter terakhir: ${manga.lastChapter}` : '',
          manga.lastVolume ? `Volume terakhir: ${manga.lastVolume}` : '',
          manga.originalLanguage ? `Bahasa asli: ${manga.originalLanguage}` : '',
          tags.length ? `Genre: ${tags.join(', ')}` : '',
          languages ? `Terjemahan: ${languages}` : '',
          `Rating konten: ${manga.contentRating || 'Unknown'}`,
          `ID: ${manga.id}`,
          `https://mangadex.org/title/${manga.id}`
        ].filter(Boolean).join('\n');
      }).join('\n\n');

      const pagination = data.pagination || {};
      const message = [
        '*MANGADEX POPULAR*',
        `Halaman: ${pagination.page || page}`,
        `Total manga: ${pagination.total ?? data.data.length}`,
        `Jumlah hasil: ${data.data.length}`,
        '',
        mangaList,
        '',
        `Halaman berikutnya: ${pagination.hasNext ? `${usedPrefix}${commandName} ${page + 1}` : 'Tidak tersedia'}`
      ].join('\n');

      await m.reply(message);
    } catch (err) {
      await m.reply(settings?.mess?.error || err.message);
      return false;
    }
  }
};