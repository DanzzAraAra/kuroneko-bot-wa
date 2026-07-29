const axios = require('axios');

module.exports = {
    name: ['google', 'gsearch'],
    limit: 2,
    premium: false,
    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        try {
            const text = args.join(' ');

            if (!text) {
                await m.reply(`*Ex:* ${usedPrefix}${commandName} makeine too many losing heroines`);
                return false;
            }

            if (settings?.mess?.wait) await m.reply(settings.mess.wait);

            const apiUrl = `${settings.api}/api/search/google?q=${encodeURIComponent(text)}&apikey=${settings.key}`;
            const { data } = await axios.get(apiUrl);

            if (!data.status || !data.result || data.result.length === 0) {
                await m.reply('Tidak ditemukan hasil dari pencarian Google.');
                return false;
            }

            let caption = `*ɢᴏᴏɢʟᴇ ꜱᴇᴀʀᴄʜ*\n\n`;
            data.result.slice(0, 5).forEach((item, index) => {
                caption += `*${index + 1}. ${item.resource_title}*\n`;
                caption += `*• Sumber:* ${item.origin_node} (${item.temporal_stamp || '-'})\n`;
                caption += `*• Link:* ${item.resolved_endpoint}\n\n`;
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