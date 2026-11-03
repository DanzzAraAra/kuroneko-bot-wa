import axios from 'axios';

export default {
    name: ['gitstalk', 'githubstalk'],
    limit: 1,
    premium: false,

    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        const username = args.join(' ').trim().replace(/^@/, '');

        if (!username) {
            return m.reply(`*Ex:* ${usedPrefix + commandName} DanzzAraAra`);
        }

        try {
            if (settings?.mess?.wait) {
                await m.reply(settings.mess.wait);
            }

            const apiUrl = `${settings.api}/api/stalk/githubuser?username=${encodeURIComponent(username)}&apikey=${settings.key}`;
            const { data } = await axios.get(apiUrl, { timeout: 60000 });

            if (!data?.status || !data?.result) {
                return m.reply('Akun GitHub tidak ditemukan.');
            }

            const result = data.result;
            const caption = [
                '*[ GITHUB STALK ]*',
                '',
                `Nama: ${result.nickname || '-'}`,
                `Username: ${result.username || '-'}`,
                `ID: ${result.id ?? '-'}`,
                `Bio: ${result.bio || '-'}`,
                `Company: ${result.company || '-'}`,
                `Lokasi: ${result.location || '-'}`,
                `Email: ${result.email || '-'}`,
                `Blog: ${result.blog || '-'}`,
                '',
                `Followers: ${result.followers ?? 0}`,
                `Following: ${result.following ?? 0}`,
                `Public Repository: ${result.public_repo ?? 0}`,
                `Public Gists: ${result.public_gists ?? 0}`,
                `Admin: ${result.admin ? 'Ya' : 'Tidak'}`,
                `Tipe: ${result.type || '-'}`,
                `Dibuat: ${result.created_at || '-'}`,
                `Diperbarui: ${result.updated_at || '-'}`,
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