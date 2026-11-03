import axios from 'axios';

export default {
    name: ['xstalk', 'twitterstalk'],
    limit: 1,
    premium: false,

    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        const username = args.join(' ').trim().replace(/^@/, '');

        if (!username) {
            return m.reply(`*Ex:* ${usedPrefix + commandName} ussername`);
        }

        try {
            if (settings?.mess?.wait) {
                await m.reply(settings.mess.wait);
            }

            const apiUrl = `${settings.api}/api/stalk/twitter?username=${encodeURIComponent(username)}&apikey=${settings.key}`;
            const { data } = await axios.get(apiUrl);

            if (!data?.status || !data?.data) {
                return m.reply(data?.message || 'Akun X tidak ditemukan.');
            }

            const result = data.data;

            const caption = [
                '*[ X / TWITTER STALK ]*',
                '',
                `Nama: ${result.name || '-'}`,
                `Username: @${result.username || username}`,
                `Bio: ${result.bio || '-'}`,
                `Profil: ${result.url || '-'}`
            ].join('\n');

            if (result.profile_pic) {
                return sock.sendMessage(m.chat || m.from, {
                    image: { url: result.profile_pic },
                    caption
                }, { quoted: m });
            }

            return m.reply(caption);
        } catch (err) {
            await m.reply(settings?.mess?.error || err.message);
            return false;
        }
    }
};