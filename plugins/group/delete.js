module.exports = {
    name: ['delete', 'del'],
    execute: async (sock, m, args, settings) => {
        const reply = (text) => sock.sendMessage(m.from, { text }, { quoted: m });
        const { isGroup, isAdmin, isBotAdmin, isOwner } = m;

        if (!isGroup) return reply(settings.mess.group);
        if (!isAdmin && !isOwner) return reply(settings.mess.admin);
        if (!isBotAdmin) return reply(settings.mess.botAdmin);

        const ctx = m.message?.extendedTextMessage?.contextInfo;

        if (!ctx?.stanzaId || !ctx?.participant) return reply('Reply to a message to delete it.');

        try {
            await sock.sendMessage(m.from, {
                delete: {
                    remoteJid: m.from,
                    id: ctx.stanzaId,
                    participant: ctx.participant,
                    fromMe: false
                }
            });
        } catch (err) {
            const errMsg = err?.message?.toLowerCase() || '';
            if (errMsg.includes('admin') || errMsg.includes('not-authorized') || errMsg.includes('forbidden')) {
                return reply(settings.mess.botAdmin);
            }
            reply(settings.mess.error);
        }
    }
};