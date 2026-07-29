const { updateGroup } = require('../../src/database');

module.exports = {
    name: ['antibot'],
    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        const reply = (text) => sock.sendMessage(m.from, { text }, { quoted: m });
        const { isGroup, isAdmin, isOwner, from } = m;

        if (!isGroup) return reply(settings.mess.group);
        if (!isAdmin && !isOwner) return reply(settings.mess.admin);

        const action = args[0]?.toLowerCase();

        if (action === 'on') {
            await updateGroup(from, { antibot: true });
            reply('Anti Bot berhasil *diaktifkan* di grup ini.');
        } else if (action === 'off') {
            await updateGroup(from, { antibot: false });
            reply('Anti Bot berhasil *dimatikan* di grup ini.');
        } else {
            reply(`*Gunakan perintah:*\n- *${usedPrefix}${commandName} on*\n- *${usedPrefix}${commandName} off*`);
        }
    }
};