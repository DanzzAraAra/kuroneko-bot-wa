const { updateGroup } = require('../../src/database');

module.exports = {
    name: ['antitagsw'],
    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        const reply = (text) => sock.sendMessage(m.from, { text }, { quoted: m });
        const { isGroup, isAdmin, isOwner, from } = m;

        if (!isGroup) return reply(settings.mess.group);
        if (!isAdmin && !isOwner) return reply(settings.mess.admin);

        const action = args[0]?.toLowerCase();

        if (action === 'on') {
            await updateGroup(from, { antitagsw: true });
            reply('Anti Tag SW berhasil *diaktifkan* di grup ini.');
        } else if (action === 'off') {
            await updateGroup(from, { antitagsw: false });
            reply('Anti Tag SW berhasil *dimatikan* di grup ini.');
        } else {
            reply(`*Gunakan perintah:*\n- *${usedPrefix}${commandName} on*\n- *${usedPrefix}${commandName} off*`);
        }
    }
};