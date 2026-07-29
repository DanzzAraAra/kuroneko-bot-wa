const axios = require('axios');

module.exports = {
    name: ['ttstalk'],
    limit: 2,
    premium: false,
    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        try {
            const text = args.join(' ');

            if (!text) {
                await m.reply(`*Ex:* ${usedPrefix}${commandName} danzz_yyyyyy`);
                return false;
            }

            if (settings?.mess?.wait) await m.reply(settings.mess.wait);

            const apiUrl = `${settings.api}/api/stalk/tiktok?username=${encodeURIComponent(text)}&apikey=${settings.key}`;
            const { data } = await axios.get(apiUrl);

            if (!data.status || !data.data) {
                await m.reply('Pengguna TikTok tidak ditemukan.');
                return false;
            }

            const { user, stats, about, status, avatar } = data.data;

            let caption = `*TIKTOK STALK*\n\n`;
            caption += `* Username:* ${user.username || '-'}\n`;
            caption += `* Nickname:* ${user.nickname || '-'}\n`;
            caption += `* Bio:* ${about.bio || '-'}\n`;
            caption += `* Followers:* ${stats.followers || 0}\n`;
            caption += `* Following:* ${stats.following || 0}\n`;
            caption += `* Friends:* ${stats.friends || 0}\n`;
            caption += `* Total Likes:* ${stats.likes || 0}\n`;
            caption += `* Total Videos:* ${stats.videos || 0}\n`;
            caption += `* Private Account:* ${status.private ? 'Yes' : 'No'}\n`;
            caption += `* Verified:* ${status.verified ? 'Yes' : 'No'}\n`;
            caption += `* Seller:* ${status.seller ? 'Yes' : 'No'}\n`;
            caption += `* Link:* ${user.url || '-'}`;

            await sock.sendMessage(m.chat || m.from, {
                image: { url: avatar.large || avatar.medium },
                caption: caption.trim()
            }, { quoted: m });

        } catch (err) {
            console.error(err);
            await m.reply(settings?.mess?.error || err.message);
            return false;
        }
    }
};