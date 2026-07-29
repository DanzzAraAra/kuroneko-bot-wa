const { updateGroup } = require('../../src/database');

module.exports = {
    name: ['onlyadmin'],
    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        const reply = (text) => sock.sendMessage(m.from, { text }, { quoted: m });
        const { isGroup, isAdmin, isOwner, from } = m;

        if (!isGroup) return reply(settings.mess.group);
        if (!isAdmin && !isOwner) return reply(settings.mess.admin);

        const action = args[0]?.toLowerCase();

        if (action === 'on') {
            await updateGroup(from, { onlyadmin: true });
            reply('Fitur Only Admin diaktifkan');
        } else if (action === 'off') {
            await updateGroup(from, { onlyadmin: false });
            reply('Fitur Only Admin dimatikan');
        } else {
            reply(`*Ex*: ${usedPrefix}${commandName} on or off`);
        }
    }
};