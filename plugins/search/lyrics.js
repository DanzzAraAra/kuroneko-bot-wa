const axios = require('axios');

module.exports = {
    name: ['lirik', 'lyrics'],
    limit: 2,
    premium: false,
    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        try {
            const text = args.join(' ');

            if (!text) {
                await m.reply(`*Ex:* ${usedPrefix}${commandName} radiohead creep`);
                return false;
            }

            if (settings?.mess?.wait) await m.reply(settings.mess.wait);

            const apiUrl = `${settings.api}/api/search/lyrics?q=${encodeURIComponent(text)}&apikey=${settings.key}`;
            const { data } = await axios.get(apiUrl);

            if (!data.result || data.result.length === 0) {
                await m.reply('Lirik lagu tidak ditemukan. Coba gunakan kata kunci atau judul yang lain.');
                return false;
            }

            let songData = data.result[0];
            
            let durationFormat = '-';
            if (songData.duration) {
                let minutes = Math.floor(songData.duration / 60);
                let seconds = Math.floor(songData.duration % 60).toString().padStart(2, '0');
                durationFormat = `${minutes}:${seconds}`;
            }

            let caption = `*LYRICS SEARCH*\n\n`;
            caption += `*Judul:* ${songData.trackName || '-'}\n`;
            caption += `*Artis:* ${songData.artistName || '-'}\n`;
            caption += `*Album:* ${songData.albumName || '-'}\n`;
            caption += `*Durasi:* ${durationFormat}\n\n`;
            caption += `*Lirik:*\n${songData.plainLyrics || 'Tidak ada lirik.'}`;

            await sock.sendMessage(m.chat || m.from, {
                text: caption.trim(),
                linkPreview: false
            }, { quoted: m });

        } catch (err) {
            console.error(err);
            await m.reply(settings?.mess?.error || err.message);
            return false;
        }
    }
};