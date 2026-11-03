import axios from 'axios';

export default {
    name: ['spotifydl', 'spdl'],
    limit: 2,
    premium: false,

    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        const url = args.join(' ').trim();

        if (!url) {
            await m.reply(`*Ex:* ${usedPrefix + commandName} https://open.spotify.com/track/xxxxx`);
            return false;
        }

        try {
            if (settings?.mess?.wait)
                await m.reply(settings.mess.wait);

            const apiUrl = `${settings.api}/api/download/spotify?url=${encodeURIComponent(url)}&apikey=${settings.key}`;
            const { data } = await axios.get(apiUrl, { timeout: 60000 });

            if (!data?.status || !data?.data) {
                await m.reply('Musik tidak dapat diunduh');
                return false;
            }

            const result = data.data;

            if (!result.download_mp3) {
                await m.reply('Link download tidak tersedia');
                return false;
            }

            const caption = [
                '*[ SPOTIFY ]*',
                '',
                `> Judul: ${result.title || '-'}`,
                `> Artist: ${result.artist || '-'}`,
                `> Album: ${result.album || '-'}`,
                `> Tanggal rilis: ${result.date || '-'}`,
                `> Durasi: ${result.duration || '-'}`,
                `> Link download: ${result.download_mp3}`
            ].join('\n');

            await sock.sendMessage(m.chat, {
                image: { url: result.cover },
                caption
            }, { quoted: m });

            await sock.sendMessage(m.chat, {
                audio: { url: result.download_mp3 },
                mimetype: 'audio/mpeg',
                fileName: `${result.title || 'spotify'}.mp3`
            }, { quoted: m });
        } catch (err) {
            await m.reply(settings?.mess?.error || err.message);
            return false;
        }
    }
};