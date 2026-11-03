import axios from 'axios';

export default {
    name: ['roblox'],
    limit: 1,
    premium: false,

    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        const input = args.join(' ').trim();

        if (!input) {
            return m.reply(`*Ex:* ${usedPrefix + commandName} ussername atau id`);
        }

        try {
            if (settings?.mess?.wait) {
                await m.reply(settings.mess.wait);
            }

            const param = /^\d+$/.test(input)
                ? `user_id=${input}`
                : `username=${encodeURIComponent(input)}`;

            const apiUrl = `${settings.api}/api/stalk/roblox?${param}&apikey=${settings.key}`;
            const { data } = await axios.get(apiUrl, { timeout: 60000 });

            if (!data?.status || !data?.data) {
                return m.reply('Akun Roblox tidak ditemukan.');
            }

            const result = data.data;
            const caption = [
                '*[ ROBLOX STALK ]*',
                '',
                `Username: ${result.username || '-'}`,
                `Display Name: ${result.display_name || '-'}`,
                `User ID: ${result.id ?? '-'}`,
                `Bio: ${result.description || '-'}`,
                `Verified: ${result.verified ? 'Ya' : 'Tidak'}`,
                `Banned: ${result.is_banned ? 'Ya' : 'Tidak'}`,
                `Dibuat: ${result.created || '-'}`,
                '',
                '*[ STATISTIK ]*',
                `Followers: ${result.stats?.followers ?? 0}`,
                `Following: ${result.stats?.following ?? 0}`,
                `Friends: ${result.stats?.friends ?? 0}`,
                '',
                `Profil: ${result.url || '-'}`
            ].join('\n');

            if (result.avatar) {
                return sock.sendMessage(m.chat || m.from, {
                    image: { url: result.avatar },
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