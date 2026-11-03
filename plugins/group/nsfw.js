import { updateGroup } from '../../src/database.js';

export default {
    name: ['nsfw'],

    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        if (!m.isGroup) return m.reply(settings.mess.group);
        if (!m.isAdmin && !m.isOwner) return m.reply(settings.mess.admin);

        const action = args[0]?.toLowerCase();
        const group = global.db.groups[m.from];

        if (!['on', 'off'].includes(action)) {
            return m.reply(
                `*NSFW GROUP SETTINGS*\n\n` +
                `> Status: ${group?.nsfw ? 'ON' : 'OFF'}\n\n` +
                `*Usage:*\n` +
                `> ${usedPrefix + commandName} on\n` +
                `> ${usedPrefix + commandName} off`
            );
        }

        const enabled = action === 'on';

        if (group?.nsfw === enabled) {
            return m.reply(`Fitur NSFW sudah *${action.toUpperCase()}*.`);
        }

        await updateGroup(m.from, { nsfw: enabled });

        return m.reply(`Fitur NSFW berhasil *${action.toUpperCase()}* untuk grup ini.`);
    }
};