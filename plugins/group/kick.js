module.exports = {
    name: ['kick'],
    execute: async (sock, m, args, settings) => {
        const reply = (text) => sock.sendMessage(m.from, { text }, { quoted: m });

        const { isGroup, isAdmin, isBotAdmin, isOwner, sender, normalizeJid, botJid, groupAdmins } = m;

        if (!isGroup) return reply(settings.mess.group);
        if (!isAdmin && !isOwner) return reply(settings.mess.admin);
        if (!isBotAdmin) return reply(settings.mess.botAdmin); 

        const ctx = m.message?.extendedTextMessage?.contextInfo;
        let rawTarget = ctx?.participant || ctx?.mentionedJid?.[0] || '';
        
        if (!rawTarget && args[0]) {
            rawTarget = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
        }
        const target = normalizeJid(rawTarget);
        if (!target || target === '@s.whatsapp.net') return reply('Tag, reply pesan, atau masukkan nomor target.');
        if (target === botJid) return reply('Bot tidak bisa mengeluarkan dirinya sendiri.');
        if (target === sender) return reply('Kamu tidak bisa mengeluarkan dirimu sendiri.');

        try {
            await sock.groupParticipantsUpdate(m.from, [target], 'remove');
            reply('Berhasil mengeluarkan member.');
            
        } catch (err) {
            const errMsg = err?.message?.toLowerCase() || '';
            if (errMsg.includes('admin') || errMsg.includes('not-authorized') || errMsg.includes('forbidden')) {
                return reply(settings.mess.botAdmin);
            }
            console.error(err);
            reply(settings.mess.error);
        }
    }
};