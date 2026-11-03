import { updateGroup } from '../../src/database.js';

export default {
    name: ['antinsfw'],

    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        const reply = text => sock.sendMessage(m.from, { text }, { quoted: m });

        if (!m.isGroup) return reply(settings.mess.group);
        if (!m.isAdmin && !m.isOwner) return reply(settings.mess.admin);

        const action = args[0]?.toLowerCase();

        if (!['on', 'off'].includes(action)) {
            return reply(`Ex: ${usedPrefix + commandName} on or off`);
        }

        const enabled = action === 'on';
        await updateGroup(m.from, { antinsfw: enabled });

        return reply(
            `Anti NSFW berhasil *${enabled ? 'diaktifkan' : 'dimatikan'}* di grup ini${enabled ? '\n\nSetiap foto/stiker yang mengandung unsur NSFW akan otomatis dihapus' : ''}`
        );
    }
};