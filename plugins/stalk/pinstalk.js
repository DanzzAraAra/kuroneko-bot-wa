import axios from 'axios';

export default {
    name: ['pinstalk'],
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

            const apiUrl = `${settings.api}/api/stalk/pinterest?username=${encodeURIComponent(username)}&apikey=${settings.key}`;
            const { data } = await axios.get(apiUrl, { timeout: 60000 });

            if (data?.status !== 'success' || !data?.profile) {
                return m.reply('Akun Pinterest tidak ditemukan.');
            }

            const result = data.profile;
            const stats = data.stats || {};
            const boards = data.boards || [];

            const caption = [
                '*[ PINTEREST STALK ]*',
                '',
                `Nama: ${result.displayName || '-'}`,
                `Username: ${result.username || '-'}`,
                `Bio: ${result.bio || '-'}`,
                `Followers: ${result.followers ?? 0}`,
                `Following: ${result.following ?? 0}`,
                `Verified: ${result.verified ? 'Ya' : 'Tidak'}`,
                `Website: ${result.website || '-'}`,
                '',
                '*[ STATISTIK ]*',
                `Total Boards: ${stats.totalBoards ?? boards.length}`,
                `Total Pins: ${stats.totalPinsEstimate ?? 0}`,
                `Rata-rata Pins per Board: ${stats.avgPinsPerBoard ?? 0}`,
                `Profile Score: ${stats.profileScore ?? 0}`,
                '',
                '*[ BOARDS ]*',
                ...(boards.length
                    ? boards.map((board, index) =>
                        `${index + 1}. ${board.name || '-'}\n   Pins: ${board.pinCount ?? 0}`
                    )
                    : ['Tidak ada board.'])
            ].join('\n');

            if (result.avatar) {
                return sock.sendMessage(m.chat || m.from, {
                    image: { url: result.avatar },
                    caption: caption.slice(0, 4000)
                }, { quoted: m });
            }

            return m.reply(caption.slice(0, 4000));
        } catch (err) {
            await m.reply(settings?.mess?.error || err.message);
            return false;
        }
    }
};