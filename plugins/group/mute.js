const { updateGroup } = require('../../src/database');

module.exports = {
    name: ['mute'],
    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        const reply = (text) => sock.sendMessage(m.from, { text }, { quoted: m });
        const { isGroup, isOwner, from } = m;

        if (!isGroup) return reply(settings.mess.group);
        if (!isOwner) return reply(settings.mess.owner);

        await updateGroup(from, { mute: true });
        reply('Bot berhasil di mute untuk grup ini');
    }
};