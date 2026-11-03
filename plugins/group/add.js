export default {
    name: ['antidelete'],
    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        const reply = text =>
            sock.sendMessage(m.from, { text }, { quoted: m });

        if (!m.isGroup) return reply(settings.mess.group);
        if (!m.isAdmin && !m.isOwner) return reply(settings.mess.admin);

        const option = args[0]?.toLowerCase();

        if (!['on', 'off'].includes(option)) {
            return reply(`Ex: ${usedPrefix + commandName} on or off`);
        }

        const { updateGroup } = await import('../../src/database.js');
        const enabled = option === 'on';

        await updateGroup(m.from, { antidelete: enabled });

        return reply(
            `Anti Delete berhasil ${enabled ? 'diaktifkan' : 'dinonaktifkan'} di grup ini.`
        );
    }
};