module.exports = {
    name: 'open',
    execute: async (sock, m, args, settings) => {
        const reply = (text) => sock.sendMessage(m.from, { text }, { quoted: m });
        const { isGroup, isAdmin, isBotAdmin, isOwner } = m;

        if (!isGroup) return reply(settings.mess.group);
        if (!isAdmin && !isOwner) return reply(settings.mess.admin);
        if (!isBotAdmin) return reply(settings.mess.botAdmin);

        try {
            await sock.groupSettingUpdate(m.from, 'not_announcement');
            reply('Group opened. All members can send messages now.');
        } catch (err) {
            const errMsg = err?.message?.toLowerCase() || '';
            if (errMsg.includes('admin') || errMsg.includes('not-authorized') || errMsg.includes('forbidden')) {
                return reply(settings.mess.botAdmin);
            }
            reply(settings.mess.error);
        }
    }
};