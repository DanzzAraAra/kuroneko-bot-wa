import axios from 'axios';

export default {
    name: ['fbstalk'],
    limit: 1,
    premium: false,

    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        const username = args.join(' ').trim().replace(/^@/, '');

        if (!username) {
            return m.reply(`*Ex:* ${usedPrefix + commandName} kuronekoyaaa`);
        }

        try {
            if (settings?.mess?.wait) {
                await m.reply(settings.mess.wait);
            }

            const apiUrl = `${settings.api}/api/stalk/facebook?username=${encodeURIComponent(username)}&apikey=${settings.key}`;
            const { data } = await axios.get(apiUrl, { timeout: 60000 });

            if (!data?.status || !data?.data) {
                return m.reply('Akun Facebook tidak ditemukan.');
            }

            const result = data.data;
            const caption = [
                '*[ FACEBOOK STALK ]*',
                '',
                `Nama: ${result.name || '-'}`,
                `Username: ${result.username || '-'}`,
                `Followers: ${result.stats?.followers || '0'}`,
                `Talking: ${result.stats?.talking || '-'}`,
                `Deskripsi: ${result.description || '-'}`,
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