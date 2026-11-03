import axios from 'axios';

export default {
    name: ['ttstalk', 'tiktokstalk'],
    limit: 1,
    premium: false,

    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        const username = args.join(' ').trim().replace(/^@/, '');

        if (!username) {
            return m.reply(`*Ex:* ${usedPrefix + commandName} danzz_yyyyyy`);
        }

        try {
            if (settings?.mess?.wait) {
                await m.reply(settings.mess.wait);
            }

            const apiUrl = `${settings.api}/api/stalk/tiktok?username=${encodeURIComponent(username)}&apikey=${settings.key}`;
            const { data } = await axios.get(apiUrl, { timeout: 60000 });

            if (!data?.status || !data?.result?.username) {
                return m.reply('Akun TikTok tidak ditemukan.');
            }

            const result = data.result;
            const avatar = result.avatar || {};
            const stats = result.stats || {};
            const commerce = result.commerce || {};

            const formatNumber = value =>
                Number(value || 0).toLocaleString('id-ID');

            const formatDate = value => {
                if (!value) return '-';

                const date = new Date(value);

                if (isNaN(date.getTime())) return value;

                return date.toLocaleString('id-ID', {
                    dateStyle: 'long',
                    timeStyle: 'short',
                    timeZone: 'Asia/Jakarta'
                }) + ' WIB';
            };

            const caption = [
                '*[ TIKTOK STALK ]*',
                '',
                `Nama: ${result.nickname || '-'}`,
                `Username: @${result.username || '-'}`,
                `ID: ${result.user_id || '-'}`,
                `Sec UID: ${result.sec_uid || '-'}`,
                `Dibuat: ${formatDate(result.created_at)}`,
                `Bio: ${result.bio || '-'}`,
                `Bahasa: ${result.language || '-'}`,
                `Region: ${result.region || '-'}`,
                `Verified: ${result.verified ? 'Ya' : 'Tidak'}`,
                `Private: ${result.private_account ? 'Ya' : 'Tidak'}`,
                `Seller: ${commerce.seller ? 'Ya' : 'Tidak'}`,
                '',
                '*[ STATISTIK ]*',
                `Followers: ${formatNumber(stats.followers)}`,
                `Following: ${formatNumber(stats.following)}`,
                `Friends: ${formatNumber(stats.friends)}`,
                `Likes: ${formatNumber(stats.likes)}`,
                `Videos: ${formatNumber(stats.videos)}`,
                '',
                `Profil: ${result.profile_url || '-'}`
            ].join('\n');

            const profilePicture = avatar.large || avatar.medium || avatar.thumb;

            if (profilePicture) {
                return sock.sendMessage(m.chat || m.from, {
                    image: { url: profilePicture },
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