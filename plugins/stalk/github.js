const axios = require('axios');

module.exports = {
    name: ['githubstalk', 'ghstalk'],
    limit: 2,
    premium: false,
    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        try {
            const text = args.join(' ');

            if (!text) {
                await m.reply(`*Ex:* ${usedPrefix}${commandName} DanzzAraAra`);
                return false;
            }

            if (settings?.mess?.wait) await m.reply(settings.mess.wait);

            const apiUrl = `${settings.api}/api/stalk/githubuser?username=${encodeURIComponent(text)}&apikey=${settings.key}`;
            const { data } = await axios.get(apiUrl);

            if (!data.status || !data.result) {
                await m.reply('Pengguna GitHub tidak ditemukan.');
                return false;
            }

            const user = data.result;

            let caption = `*GITHUB STALK*\n\n`;
            caption += `* Username:* ${user.username || '-'}\n`;
            caption += `* Nickname:* ${user.nickname || '-'}\n`;
            caption += `* Bio:* ${user.bio || '-'}\n`;
            caption += `* Company:* ${user.company || '-'}\n`;
            caption += `* Location:* ${user.location || '-'}\n`;
            caption += `* Blog:* ${user.blog || '-'}\n`;
            caption += `* Repositories:* ${user.public_repo || 0}\n`;
            caption += `* Gists:* ${user.public_gists || 0}\n`;
            caption += `* Followers:* ${user.followers || 0}\n`;
            caption += `* Following:* ${user.following || 0}\n`;
            caption += `* Type:* ${user.type || '-'}\n`;
            caption += `* Created At:* ${user.created_at || '-'}\n`;
            caption += `* Link:* ${user.url || '-'}`;

            await sock.sendMessage(m.chat || m.from, {
                image: { url: user.profile_pic },
                caption: caption.trim()
            }, { quoted: m });

        } catch (err) {
            console.error(err);
            await m.reply(settings?.mess?.error || err.message);
            return false;
        }
    }
};