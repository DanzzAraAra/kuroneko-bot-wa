import axios from 'axios';

export default {
    name: ['telegram'],
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

            const apiUrl = `${settings.api}/api/stalk/telegram?username=${encodeURIComponent(username)}&apikey=${settings.key}`;
            const { data } = await axios.get(apiUrl, { timeout: 60000 });

            if (!data?.status || !data?.data) {
                return m.reply('Akun Telegram tidak ditemukan.');
            }

            const result = data.data;
            const caption = [
                '*[ TELEGRAM STALK ]*',
                '',
                `Nama: ${result.name || '-'}`,
                `Username: ${result.username || '-'}`,
                `Bio: ${result.bio || '-'}`,
                `Tipe: ${result.type || '-'}`,
                `Subscribers: ${result.subscribers || '-'}`,
                `Verified: ${result.verified ? 'Ya' : 'Tidak'}`,
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