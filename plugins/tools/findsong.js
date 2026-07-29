const axios = require('axios');
const { downloadMediaMessage } = require('baileys');
const { uploader } = require('../../src/uploader');

module.exports = {
    name: ['findsong', 'whatsong', 'carilagu'],
    limit: 3,
    premium: false,
    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        try {
            const q = m.quoted ? m.quoted : m;
            const mime = (q.msg || q).mimetype || '';

            if (!mime.includes('audio') && !mime.includes('video')) {
                await m.reply(`*Ex:* Reply pesan audio/rekaman suara dengan perintah *${usedPrefix}${commandName}*`);
                return false;
            }

            if (settings?.mess?.wait) await m.reply(settings.mess.wait);

            const buffer = await downloadMediaMessage(
                q,
                'buffer',
                {},
                { 
                    logger: console,
                    reuploadRequest: sock.updateMediaMessage
                }
            );

            if (!buffer) {
                await m.reply('Gagal mengunduh pesan media.');
                return false;
            }

            const audioUrl = await uploader(buffer);

            const apiUrl = `${settings.api}/api/tools/findsong?url=${encodeURIComponent(audioUrl)}&apikey=${settings.key}`;
            const { data } = await axios.get(apiUrl);

            if (!data.status || !data.data) {
                await m.reply('Lagu tidak ditemukan atau tidak dikenali.');
                return false;
            }

            const song = data.data;
            
            const title = song.spotify?.name || song.title || '-';
            const artist = song.spotify?.artists?.[0]?.name || song.artist || '-';
            const album = song.spotify?.album?.name || song.album || '-';
            const release = song.release_date || '-';
            const label = song.label || '-';
            const timecode = song.timecode || '-';
            const listenLink = song.song_link || '-';
            const spotifyLink = song.spotify?.external_urls?.spotify || '-';

            const coverImage = song.spotify?.album?.images?.[0]?.url || 'https://i.ibb.co/G9yR96W/music-placeholder.png';

            let caption = `*FIND SONG RESULT*\n\n`;
            caption += `* Title:* ${title}\n`;
            caption += `* Artist:* ${artist}\n`;
            caption += `* Album:* ${album}\n`;
            caption += `* Release Date:* ${release}\n`;
            caption += `* Label:* ${label}\n`;
            caption += `* Match Timecode:* ${timecode}\n\n`;
            
            caption += `*Links:*\n`;
            if (listenLink !== '-') caption += `* Listen:* ${listenLink}\n`;
            if (spotifyLink !== '-') caption += `* Spotify:* ${spotifyLink}`;

            await sock.sendMessage(m.chat || m.from, {
                image: { url: coverImage },
                caption: caption.trim()
            }, { quoted: m });

        } catch (err) {
            console.error(err);
            await m.reply(settings?.mess?.error || err.message);
            return false;
        }
    }
};