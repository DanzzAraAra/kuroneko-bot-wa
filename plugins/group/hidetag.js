module.exports = {
    name: ['hidetag', 'ht'],
    execute: async (sock, m, args, settings) => {
        const reply = (text) => sock.sendMessage(m.from, { text }, { quoted: m });

        const { isGroup, isAdmin, isOwner } = m;

        if (!isGroup) return reply(settings.mess.group);
        if (!isAdmin && !isOwner) return reply(settings.mess.admin);

        try {
            const groupMetadata = await sock.groupMetadata(m.from);
            const participants = groupMetadata.participants.map(p => p.id);
            
            const msgText = args.length > 0 ? `*HIDETAG:* ${args.join(' ')}` : '*HIDETAG:*';

            await sock.sendMessage(m.from, { 
                text: msgText, 
                contextInfo: { mentionedJid: participants } 
            }, { quoted: m });
        } catch (err) {
            console.error(err);
            reply(settings.mess.error);
        }
    }
};