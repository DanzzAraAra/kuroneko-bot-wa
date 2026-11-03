import axios from 'axios';
import { uploader } from '../../src/uploader.js';

export default {
    name: ['removevocal', 'rvocal'],
    premium: true,

    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        try {
            const quoted = m.quoted || m;
            const type = sock.getMediaType(quoted);
            const url = args.join(' ').trim();

            if (!url && type !== 'audio') {
                return m.reply(
                    `*Ex:* Kirim atau reply audio dengan caption *${usedPrefix}${commandName}*, atau masukkan URL audio`
                );
            }

            if (settings?.mess?.wait) {
                await m.reply(settings.mess.wait);
            }

            let audioUrl = url;

            if (!audioUrl) {
                const buffer = await sock.downloadMedia(quoted);

                if (!buffer?.length) {
                    throw new Error('Gagal mengunduh audio');
                }

                audioUrl = await uploader(buffer);
            }

            const params = new URLSearchParams({
                url: audioUrl,
                apikey: settings.key
            });

            const { data } = await axios.get(
                `${settings.api}/api/tools/removevocal?${params.toString()}`,
                { timeout: 60000 }
            );

            if (!data?.status || !data?.result) {
                throw new Error('Gagal memisahkan vocal dan instrumental');
            }

            const result = data.result;

            if (result.instrumental) {
                await sock.sendMessage(m.chat || m.from, {
                    audio: { url: result.instrumental },
                    mimetype: 'audio/mpeg',
                    fileName: 'instrumental.mp3'
                }, { quoted: m });
            }

            if (result.vocal) {
                await sock.sendMessage(m.chat || m.from, {
                    audio: { url: result.vocal },
                    mimetype: 'audio/mpeg',
                    fileName: 'vocal.mp3'
                }, { quoted: m });
            }
        } catch (err) {
            await m.reply(settings?.mess?.error || err.message);
            return false;
        }
    }
};