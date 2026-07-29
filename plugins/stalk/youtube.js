const axios = require('axios');

module.exports = {
    name: ['ytstalk', 'youtubestalk'],
    limit: 2,
    premium: false,
    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        try {
            const text = args.join(' ');

            if (!text) {
                await m.reply(`*Ex:* ${usedPrefix}${commandName} mrbeast`);
                return false;
            }

            if (settings?.mess?.wait) await m.reply(settings.mess.wait);

            const apiUrl = `${settings.api}/api/stalk/youtube?username=${encodeURIComponent(text)}&apikey=${settings.key}`;
            const { data } = await axios.get(apiUrl);

            if (!data.status || !data.data) {
                await m.reply('Channel YouTube tidak ditemukan.');
                return false;
            }

            const yt = data.data;

            let caption = `*YOUTUBE STALK*\n\n`;
            caption += `* Title:* ${yt.title || '-'}\n`;
            caption += `* Custom URL:* ${yt.custom_url || '-'}\n`;
            caption += `* Channel ID:* ${yt.channel_id || '-'}\n`;
            caption += `* Country:* ${yt.country || '-'}\n`;
            caption += `* Subscribers:* ${yt.subscriber_count || 0}\n`;
            caption += `* Total Videos:* ${yt.video_count || 0}\n`;
            caption += `* Total Views:* ${yt.view_count || 0}\n`;
            caption += `* Joined:* ${yt.published_at || '-'}\n`;
            caption += `* Link:* ${yt.handle_url || '-'}\n`;
            caption += `* Description:* ${yt.description ? yt.description.substring(0, 100) + '...' : '-'}`;

            const avatarUrl = yt.thumbnails?.high?.url || yt.thumbnails?.medium?.url || yt.thumbnails?.default?.url;

            await sock.sendMessage(m.chat || m.from, {
                image: { url: avatarUrl },
                caption: caption.trim()
            }, { quoted: m });

        } catch (err) {
            console.error(err);
            await m.reply(settings?.mess?.error || err.message);
            return false;
        }
    }
};