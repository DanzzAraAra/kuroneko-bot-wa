import { updateGroup } from '../../src/database.js';

export default {
    name: ['autoadmin'],

    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        const reply = text => sock.sendMessage(m.from, { text }, { quoted: m });

        if (!m.isGroup) return reply(settings.mess.group);
        if (!m.isAdmin && !m.isOwner) return reply(settings.mess.admin);

        const action = args[0]?.toLowerCase();

        if (['on', 'off'].includes(action)) {
            const enabled = action === 'on';
            await updateGroup(m.from, { autoadmin: enabled });

            return reply(`Auto Admin berhasil *${enabled ? 'diaktifkan' : 'dimatikan'}* di grup ini.`);
        }

        const enabled = global.db.groups[m.from]?.autoadmin === true;

        return reply(
            `*Status Auto Admin:* ${enabled ? 'Aktif' : 'Nonaktif'}\n\n` +
            `> ${usedPrefix}${commandName} on\n` +
            `> ${usedPrefix}${commandName} off`
        );
    }
};