import { updateGroup } from '../../src/database.js';

export default {
    name: 'setschedule',

    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        const reply = text => sock.sendMessage(m.from, { text }, { quoted: m });

        if (!m.isGroup) return reply(settings.mess.group);
        if (!m.isAdmin && !m.isOwner) return reply(settings.mess.admin);
        if (!m.isBotAdmin) return reply(settings.mess.botAdmin);

        global.db.groups[m.from] ||= {};

        const group = global.db.groups[m.from];

        group.schedule ||= {
            enabled: false,
            closeTime: '22:00',
            openTime: '05:00',
            closeText: '',
            openText: '',
            lastState: '',
            lastRun: ''
        };

        const schedule = group.schedule;
        const action = args[0]?.toLowerCase();

        if (!action) {
            return reply(
                '*[ GROUP SCHEDULE SETTING ]*\n\n' +
                `${usedPrefix + commandName} close 22:00 goodnight semua\n` +
                `${usedPrefix + commandName} open 05:00 goodmorning semua\n` +
                `${usedPrefix + commandName} close 22:00\n` +
                `${usedPrefix + commandName} open 05:00\n` +
                `${usedPrefix + commandName} status\n` +
                `${usedPrefix + commandName} on\n` +
                `${usedPrefix + commandName} off`
            );
        }

        if (action === 'status') {
            return reply(
                '*[ GROUP SCHEDULE ]*\n\n' +
                `> Status: ${schedule.enabled ? 'ON' : 'OFF'}\n` +
                `> Tutup: ${schedule.closeTime} WIB\n` +
                `> Pesan tutup: ${schedule.closeText || '-'}\n` +
                `> Buka: ${schedule.openTime} WIB\n` +
                `> Pesan buka: ${schedule.openText || '-'}\n` +
                `> Status terakhir: ${schedule.lastState === 'closed'
                    ? 'Grup ditutup'
                    : schedule.lastState === 'open'
                        ? 'Grup dibuka'
                        : 'Belum ada'}\n` +
                '> Zona waktu: Asia/Jakarta'
            );
        }

        if (['on', 'off'].includes(action)) {
            schedule.enabled = action === 'on';

            await updateGroup(m.from, { schedule: { ...schedule } });

            return reply(`Jadwal grup berhasil ${schedule.enabled ? 'diaktifkan' : 'dinonaktifkan'}.`);
        }

        if (!['close', 'open'].includes(action)) {
            return reply('Pilihan tidak valid. Gunakan close, open, status, on, atau off.');
        }

        const time = args[1];

        if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time || '')) {
            return reply(`Format waktu salah.\nContoh: ${usedPrefix + commandName} close 22:00`);
        }

        if (action === 'close') {
            schedule.closeTime = time;
            schedule.closeText = args.slice(2).join(' ').trim();
        } else {
            schedule.openTime = time;
            schedule.openText = args.slice(2).join(' ').trim();
        }

        schedule.enabled = true;

        await updateGroup(m.from, { schedule: { ...schedule } });

        return reply(
            '*[ SCHEDULE BERHASIL DIATUR ]*\n\n' +
            `> Aksi: ${action === 'close' ? 'Tutup grup' : 'Buka grup'}\n` +
            `> Waktu: ${time} WIB\n` +
            `> Pesan: ${(action === 'close' ? schedule.closeText : schedule.openText) || '-'}\n` +
            '> Status jadwal: Aktif'
        );
    }
};