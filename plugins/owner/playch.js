import axios from 'axios';
import yts from 'yt-search';
import { prepareAudioMessage } from '../../src/ffmpeg.js';

export default {
    name: ['playch'],
    owner: true,

    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        if (!m.isOwner) {
            return m.reply(settings.mess.owner);
        }

        const channelJid = args[0];
        const query = args.slice(1).join(' ').trim();

        if (!channelJid || !channelJid.endsWith('@newsletter') || !query) {
            return m.reply(`*Ex:* ${usedPrefix + commandName} 120363xxxxxxxxxx@newsletter l'amour toujours`);
        }

        try {
            if (settings?.mess?.wait) {
                await m.reply(settings.mess.wait);
            }

            const search = await yts(query);
            const video = search.videos?.[0];

            if (!video) {
                return m.reply('Audio tidak ditemukan.');
            }

            const apiUrl = `${settings.api}/api/download/ytmp3?url=${encodeURIComponent(video.url)}&apikey=${settings.key}`;
            const { data } = await axios.get(apiUrl, {
                timeout: 60000
            });

            if (!data?.status || !data?.result?.downloadUrl) {
                return m.reply('Gagal mengunduh audio.');
            }

            const result = data.result;
            const title = result.title || video.title;

            const response = await axios.get(result.downloadUrl, {
                responseType: 'arraybuffer',
                timeout: 120000
            });

            const buffer = Buffer.from(response.data);
            const audio = await prepareAudioMessage(buffer, true);

            await sock.sendMessage(channelJid, {
                audio: audio.audio,
                mimetype: audio.mimetype,
                ptt: audio.ptt,
                waveform: audio.waveform,
                seconds: audio.seconds
            });

            return m.reply([
                `*[ Berhasil mengirim VN ke channel! ]*`,
                '',
                `> Judul: ${title}`,
                `> Uploader: ${video.author?.name || '-'}`,
                `> Durasi: ${video.timestamp || '-'}`,
                `> Channel: ${channelJid}`
            ].join('\n'));
        } catch (err) {
            await m.reply(settings?.mess?.error || err.message);
            return false;
        }
    }
};