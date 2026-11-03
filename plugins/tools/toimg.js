export default {
    name: ['toimg', 'toimage'],
    limit: 1,
    premium: false,

    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        const quoted = m.quoted || m;

        if (sock.getMediaType(quoted) !== 'sticker') {
            return m.reply(`Reply stiker dengan ketik: ${usedPrefix}${commandName}`);
        }

        try {
            if (settings?.mess?.wait) {
                await m.reply(settings.mess.wait);
            }

            const buffer = await sock.downloadMedia(quoted);

            return sock.sendMessage(m.chat || m.from, {
                image: buffer
            }, { quoted: m });
        } catch (err) {
            await m.reply(settings?.mess?.error || err.message);
            return false;
        }
    }
};