export default {
    name: 'promote',

    execute: async (sock, m, args, settings) => {
        const reply = text => sock.sendMessage(m.from, { text }, { quoted: m });

        if (!m.isGroup) return reply(settings.mess.group);
        if (!m.isAdmin && !m.isOwner) return reply(settings.mess.admin);
        if (!m.isBotAdmin) return reply(settings.mess.botAdmin);

        const ctx = m.message?.extendedTextMessage?.contextInfo;
        let rawTarget = ctx?.participant || ctx?.mentionedJid?.[0] || '';

        if (!rawTarget && args[0]) {
            rawTarget = `${args[0].replace(/[^0-9]/g, '')}@s.whatsapp.net`;
        }

        const target = m.normalizeJid(rawTarget);

        if (!target || target === '@s.whatsapp.net') {
            return reply('Tag, reply to a message, or enter a target number');
        }

        try {
            await sock.groupParticipantsUpdate(m.from, [target], 'promote');
            return reply('User is now a group admin');
        } catch (err) {
            const errMsg = err?.message?.toLowerCase() || '';

            if (errMsg.includes('admin') || errMsg.includes('not-authorized') || errMsg.includes('forbidden')) {
                return reply(settings.mess.botAdmin);
            }

            return reply(settings.mess.error);
        }
    }
};