import { updateGroup } from '../../src/database.js';

export default {
    name: ['setwelcome'],

    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        const reply = text => sock.sendMessage(m.from, { text }, { quoted: m });

        if (!m.isGroup) return reply(settings.mess.group);
        if (!m.isAdmin && !m.isOwner) return reply(settings.mess.admin);

        const group = global.db.groups[m.from];
        const action = args[0]?.toLowerCase();

        if (['on', 'off'].includes(action)) {
            const enabled = action === 'on';

            await updateGroup(m.from, { welcome: enabled });

            return reply(`Welcome berhasil *${enabled ? 'diaktifkan' : 'dimatikan'}* di grup ini.`);
        }

        if (action === 'reset') {
            await updateGroup(m.from, { welcomeText: '' });
            return reply('Custom welcome berhasil direset ke pesan default.');
        }

        if (args.length) {
            const text = args.join(' ').trim();

            await updateGroup(m.from, { welcomeText: text });

            return reply(
                `Custom welcome berhasil disimpan!\n\n` +
                `Preview:\n${text}\n\n` +
                `Placeholder:\n` +
                `> @user = Mention anggota\n` +
                `> @group = Nama grup\n` +
                `> @desc = Deskripsi grup`
            );
        }

        return reply(
            `*Welcome status:* ${group?.welcome === true ? 'Aktif' : 'Nonaktif'}\n\n` +
            `*Custom Text:*\n${group?.welcomeText || 'Menggunakan pesan default'}\n\n` +
            `*Usage:*\n` +
            `> ${usedPrefix + commandName} on\n` +
            `> ${usedPrefix + commandName} off\n` +
            `> ${usedPrefix + commandName} Hai @user, welcome to @group!\n` +
            `> ${usedPrefix + commandName} reset`
        );
    }
};