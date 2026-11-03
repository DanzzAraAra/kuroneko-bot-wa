import { updateGroup } from '../../src/database.js';

export default {
    name: ['setleft'],

    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        const reply = text => sock.sendMessage(m.from, { text }, { quoted: m });

        if (!m.isGroup) return reply(settings.mess.group);
        if (!m.isAdmin && !m.isOwner) return reply(settings.mess.admin);

        const group = global.db.groups[m.from];
        const action = args[0]?.toLowerCase();

        if (['on', 'off'].includes(action)) {
            const enabled = action === 'on';

            await updateGroup(m.from, { left: enabled });

            return reply(`Left message berhasil *${enabled ? 'diaktifkan' : 'dimatikan'}* di grup ini.`);
        }

        if (action === 'reset') {
            await updateGroup(m.from, { leftText: '' });
            return reply('Custom left berhasil direset ke pesan default.');
        }

        if (args.length) {
            const text = args.join(' ').trim();

            await updateGroup(m.from, { leftText: text });

            return reply(
                `Custom left berhasil disimpan!\n\n` +
                `Preview:\n${text}\n\n` +
                `Placeholder:\n` +
                `> @user = Mention anggota\n` +
                `> @group = Nama grup\n` +
                `> @desc = Deskripsi grup`
            );
        }

        return reply(
            `*Status Left:* ${group?.left === true ? 'Aktif' : 'Nonaktif'}\n\n` +
            `*Custom Text:*\n${group?.leftText || 'Menggunakan pesan default'}\n\n` +
            `*Usage:*\n` +
            `> ${usedPrefix + commandName} on\n` +
            `> ${usedPrefix + commandName} off\n` +
            `> ${usedPrefix + commandName} Sampai jumpa @user dari @group!\n` +
            `> ${usedPrefix + commandName} reset`
        );
    }
};