import { updateGroup } from '../../src/database.js';
import { resolvePN } from '../../src/serialize.js';
import { addWarning } from '../../src/warn.js';

export default {
    name: ['warn', 'warning'],

    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        const reply = text => sock.sendMessage(m.from, { text }, { quoted: m });

        if (!m.isGroup) return reply(settings.mess.group);
        if (!m.isAdmin && !m.isOwner) return reply(settings.mess.admin);

        const group = global.db.groups[m.from];

        if (!group) return reply('Group data not found');

        const ctx = m.message?.extendedTextMessage?.contextInfo;
        const action = args[0]?.toLowerCase();

        if (['on', 'off'].includes(action)) {
            await updateGroup(m.from, { warnEnabled: action === 'on' });

            return reply(
                action === 'on'
                    ? 'Auto warning berhasil diaktifkan.'
                    : 'Auto warning berhasil dimatikan. Pesan pelanggaran tetap dihapus.'
            );
        }

        if (action === 'set') {
            const limit = Number(args[1]);

            if (!Number.isInteger(limit) || limit < 1 || limit > 10) {
                return reply(`Ex: ${usedPrefix + commandName} set 3`);
            }

            await updateGroup(m.from, { warnLimit: limit });

            return reply(`Batas maksimal warning berhasil diatur menjadi *${limit}x*`);
        }

        if (action === 'resetall') {
            await updateGroup(m.from, { warns: {} });
            return reply('Semua warning di grup berhasil direset');
        }

        const isReply = Boolean(ctx?.quotedMessage);
        const isMention = Boolean(ctx?.mentionedJid?.length);

        let rawTarget = '';
        let reasonArgs = args;

        if (isMention) {
            rawTarget = ctx.mentionedJid[0];
            reasonArgs = args.slice(1);
        } else if (isReply) {
            rawTarget = m.quoted?.key?.participant || '';
        } else if (args[0] && action !== 'reset') {
            const number = args[0].replace(/[^0-9]/g, '');

            if (number) {
                rawTarget = `${number}@s.whatsapp.net`;
                reasonArgs = args.slice(1);
            }
        }

        const target = await resolvePN(sock, rawTarget);

        if (!target) {
            return reply(
                `*Usage:*\n` +
                `> ${usedPrefix + commandName} @user alasan\n` +
                `> Reply pesan user: ${usedPrefix + commandName} alasan\n` +
                `> ${usedPrefix + commandName} nomor alasan\n` +
                `> ${usedPrefix + commandName} set 3\n` +
                `> ${usedPrefix + commandName} on\n` +
                `> ${usedPrefix + commandName} off\n` +
                `> ${usedPrefix + commandName} reset @user\n` +
                `> ${usedPrefix + commandName} resetall`
            );
        }

        if (action === 'reset') {
            const warns = { ...(group.warns || {}) };

            if (!warns[target]) {
                return reply('User tersebut tidak memiliki warning');
            }

            delete warns[target];
            await updateGroup(m.from, { warns });

            return reply(`Warning untuk user *${target.split('@')[0]}* berhasil direset.`);
        }

        if (!m.isBotAdmin) return reply(settings.mess.botAdmin);

        const sender = await resolvePN(sock, m.sender);

        if (sender && target === sender) {
            return reply('Kamu tidak bisa memberikan warning kepada diri sendiri');
        }

        const reason = reasonArgs.join(' ').trim() || 'Tidak ada alasan';
        const result = await addWarning(sock, m.from, rawTarget, reason);

        if (!result.success) return reply(result.message);

        if (result.kicked) {
            return reply(
                `*[ MAXIMUM WARNING ]*\n\n` +
                `> User: ${result.target.split('@')[0]}\n` +
                `> Alasan: ${reason}\n` +
                `> Warning: ${result.count}/${result.max}\n\n` +
                `> User telah mencapai batas warning dan dikeluarkan dari grup`
            );
        }

        if (result.count >= result.max) {
            return reply(
                `*[ MAXIMUM WARNING ]*\n\n` +
                `> User: ${result.target.split('@')[0]}\n` +
                `> Alasan: ${reason}\n` +
                `> Warning: ${result.count}/${result.max}\n\n` +
                `> ${result.message || 'Gagal mengeluarkan user dari grup'}`
            );
        }

        return reply(
            `*[ WARNING ]*\n\n` +
            `> User: ${result.target.split('@')[0]}\n` +
            `> Alasan: ${reason}\n` +
            `> Warning: ${result.count}/${result.max}\n\n` +
            `> Jika mencapai ${result.max} warning, user akan dikeluarkan dari grup.`
        );
    }
};