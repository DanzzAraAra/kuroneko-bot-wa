import axios from 'axios';

export default {
    name: ['spotify-lirik', 'splyrics', 'lirikspotify'],
    limit: 2,
    premium: false,

    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        const id = args.join(' ').trim();

        if (!id) {
            return m.reply(`*Ex:* ${usedPrefix + commandName} https://open.spotify.com/track/xxxxx`);
        }

        try {
            if (settings?.mess?.wait) {
                await m.reply(settings.mess.wait);
            }

            const apiUrl = `${settings.api}/api/search/spotify-lyrics?id=${encodeURIComponent(id)}&apikey=${settings.key || ''}`;
            const { data } = await axios.get(apiUrl, { timeout: 60000 });

            if (!data?.status || !data?.result) {
                return m.reply('Lirik lagu tidak ditemukan.');
            }

            const result = data.result;
            const lyrics = result.plain_lyrics?.trim();

            if (!lyrics) {
                return m.reply('Lirik lagu tidak tersedia.');
            }

            const duration = Math.floor((result.duration_ms || 0) / 1000);
            const minutes = Math.floor(duration / 60);
            const seconds = String(duration % 60).padStart(2, '0');

            const caption = [
                '*[ SPOTIFY LYRICS ]*',
                '',
                `Judul: ${result.track_name || '-'}`,
                `Artist: ${result.artist_name || '-'}`,
                `Album: ${result.album_name || '-'}`,
                `Durasi: ${minutes}:${seconds}`,
                `Sumber: ${result.source || '-'}`,
                `Lirik tersinkronisasi: ${result.has_synced ? 'Ya' : 'Tidak'}`,
                '',
                '*Lirik:*',
                lyrics
            ].join('\n');

            const chunks = caption.match(/[\s\S]{1,3500}/g) || [];

            for (const chunk of chunks) {
                await m.reply(chunk);
            }
        } catch (err) {
            await m.reply(settings?.mess?.error || err.message);
            return false;
        }
    }
};