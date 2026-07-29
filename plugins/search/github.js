const axios = require('axios');

module.exports = {
    name: ['ghsearch'],
    limit: 2,
    premium: false,
    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        try {
            const text = args.join(' ');

            if (!text) {
                await m.reply(`*Ex:* ${usedPrefix}${commandName} rest api`);
                return false;
            }

            if (settings?.mess?.wait) await m.reply(settings.mess.wait);

            const apiUrl = `${settings.api}/api/search/github?q=${encodeURIComponent(text)}&apikey=${settings.key}`;
            const { data } = await axios.get(apiUrl);

            if (!data.status || !data.data || data.data.length === 0) {
                await m.reply('Tidak ditemukan repositori dari pencarian GitHub.');
                return false;
            }

            let caption = `*ɢɪᴛʜᴜʙ ꜱᴇᴀʀᴄʜ*\n\n`;
            data.data.slice(0, 5).forEach((repo, index) => {
                caption += `*${index + 1}. ${repo.full_name}*\n`;
                caption += `*• Description:* ${repo.description || '-'}\n`;
                caption += `*• Stars:* ⭐ ${repo.stars} | *Forks:* 🍴 ${repo.forks}\n`;
                caption += `*• URL:* ${repo.url}\n\n`;
            });

            await sock.sendMessage(m.chat || m.from, {
                text: caption.trim(),
                linkPreview: false
            }, { quoted: m });

        } catch (err) {
            console.error(err);
            await m.reply(settings?.mess?.error || err.message);
            return false;
        }
    }
};