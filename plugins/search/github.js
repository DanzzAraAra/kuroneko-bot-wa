import axios from 'axios';

export default {
    name: ['gitsearch'],
    limit: 2,
    premium: false,

    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        try {
            const q = args.join(' ');

            if (!q) {
                return m.reply(`*Ex:* ${usedPrefix}${commandName} rest api`);
            }

            if (settings?.mess?.wait) {
                await m.reply(settings.mess.wait);
            }

            const apiUrl = `${settings.api}/api/search/github?q=${encodeURIComponent(q)}&apikey=${settings.key}`;
            const { data } = await axios.get(apiUrl);

            if (!data?.status || !data.data?.length) {
                return m.reply('Repository tidak ditemukan.');
            }

            const result = data.data.map((repo, i) =>
                `*${i + 1}. ${repo.full_name}*\n` +
                `${repo.description || 'Tidak ada deskripsi'}\n` +
                `⭐ Stars: ${repo.stars} | 🍴 Forks: ${repo.forks}\n` +
                `📝 Issues: ${repo.open_issues}\n` +
                `📅 Updated: ${repo.updated_at}\n` +
                `🔗 ${repo.url}\n` +
                `📦 Clone: ${repo.clone_url}`
            ).join('\n\n');

            return m.reply(`*[ GITHUB SEARCH ]*\n\n${result}`);
        } catch (err) {
            await m.reply(settings?.mess?.error || err.message);
        }
    }
};