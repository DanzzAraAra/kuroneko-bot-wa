module.exports = {
    name: 'add',
    execute: async (sock, m, args, settings) => {
        const reply = (text) => sock.sendMessage(m.from, { text }, { quoted: m });
        const { isGroup, isAdmin, isBotAdmin, isOwner, normalizeJid } = m;

        if (!isGroup) return reply(settings.mess.group);
        if (!isAdmin && !isOwner) return reply(settings.mess.admin);
        if (!isBotAdmin) return reply(settings.mess.botAdmin);

        const ctx = m.message?.extendedTextMessage?.contextInfo;
        let rawTarget = ctx?.participant || ctx?.mentionedJid?.[0] || '';
        
        if (!rawTarget && args[0]) {
            rawTarget = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
        }
        
        const target = normalizeJid(rawTarget);

        if (!target || target === '@s.whatsapp.net') return reply('Tag, reply to a message, or enter a target number.');

        try {
            const res = await sock.groupParticipantsUpdate(m.from, [target], 'add');
            const status = res[0]?.status;

            if (status === 200) {
                reply('User added successfully.');
            } else if (status === 403) {
                reply('User cannot be added directly. Invitation sent via chat.');
            } else if (status === 409) {
                reply('User is already in this group.');
            } else {
                reply('Failed to add user.');
            }
        } catch (err) {
            const errMsg = err?.message?.toLowerCase() || '';
            if (errMsg.includes('admin') || errMsg.includes('not-authorized') || errMsg.includes('forbidden')) {
                return reply(settings.mess.botAdmin);
            }
            reply(settings.mess.error);
        }
    }
};