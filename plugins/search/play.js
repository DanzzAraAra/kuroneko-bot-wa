const axios = require('axios');

module.exports = {
    name: ['play', 'playaudio'],
    limit: 2,
    premium: false,
    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        try {
            const text = args.join(' ');

            if (!text) {
                await m.reply(`*Ex:* ${usedPrefix}${commandName} wildflower`);
                return false;
            }

            if (settings?.mess?.wait) await m.reply(settings.mess.wait);

            const apiUrl = `${settings.api}/api/search/play?q=${encodeURIComponent(text)}&apikey=${settings.key}`;
            const { data } = await axios.get(apiUrl);

            if (!data.status || !data.result || !data.result.url) {
                await m.reply('Audio tidak ditemukan.');
                return false;
            }

            const audioData = data.result;

            let caption = `*PLAY AUDIO*\n\n`;
            caption += `* Title:* ${audioData.filename || '-'}\n`;
            caption += `\n_Sedang mengirim audio..._`;

            await sock.sendMessage(m.chat || m.from, {
                text: caption.trim()
            }, { quoted: m });

            await sock.sendMessage(m.chat || m.from, {
                audio: { url: audioData.url },
                mimetype: 'audio/mpeg',
                fileName: audioData.filename,
                ptt: false
            }, { quoted: m });

        } catch (err) {
            console.error(err);
            await m.reply(settings?.mess?.error || err.message);
            return false;
        }
    }
};