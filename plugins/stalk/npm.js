const axios = require('axios');

module.exports = {
    name: ['npmstalk'],
    limit: 2,
    premium: false,
    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        try {
            const text = args.join(' ');

            if (!text) {
                await m.reply(`*Ex:* ${usedPrefix}${commandName} express`);
                return false;
            }

            if (settings?.mess?.wait) await m.reply(settings.mess.wait);

            const apiUrl = `${settings.api}/api/stalk/npm?package=${encodeURIComponent(text)}&apikey=${settings.key}`;
            const { data } = await axios.get(apiUrl);

            if (!data.status || !data.result) {
                await m.reply('Package NPM tidak ditemukan.');
                return false;
            }

            const pkg = data.result;

            let caption = `*NPM STALK*\n\n`;
            caption += `* Package:* ${pkg.name || '-'}\n`;
            caption += `* Latest Version:* ${pkg.versionLatest || '-'}\n`;
            caption += `* Latest Publish Time:* ${pkg.latestPublishTime || '-'}\n`;
            caption += `* Publish Version:* ${pkg.versionPublish || '-'}\n`;
            caption += `* Publish Time:* ${pkg.publishTime || '-'}\n`;
            caption += `* Latest Dependencies:* ${pkg.latestDependencies || 0}\n`;
            caption += `* Publish Dependencies:* ${pkg.publishDependencies || 0}\n`;
            caption += `* Version Updates:* ${pkg.versionUpdate || 0}`;

            await sock.sendMessage(m.chat || m.from, {
                text: caption.trim()
            }, { quoted: m });

        } catch (err) {
            console.error(err);
            await m.reply(settings?.mess?.error || err.message);
            return false;
        }
    }
};