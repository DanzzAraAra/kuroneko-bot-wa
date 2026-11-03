import { updateUser } from '../../src/database.js';

export default {
    name: ['unreg'],

    execute: async (sock, m) => {
        const reply = text => sock.sendMessage(m.from, { text }, { quoted: m });
        const user = global.db?.users?.[m.sender];

        if (!user?.registered) {
            return reply('Kamu belum terdaftar di database');
        }

        const sentMsg = await sock.sendMessage(m.from, {
            text: `*[ KONFIRMASI UNREG ]*\n\n` +
                'Apakah kamu yakin ingin menghapus akun?\n\n' +
                'Balas pesan ini dengan *iya* untuk melanjutkan.\n\n' +
                '> _Batas waktu: 3 menit_'
        }, { quoted: m });

        const timeout = setTimeout(() => {
            sock.ev.off('messages.upsert', onMessage);
            reply('Waktu konfirmasi unreg telah habis.');
        }, 180000);

        const onMessage = async ({ messages }) => {
            for (const msg of messages) {
                if (msg.key.fromMe || msg.key.remoteJid !== m.from) continue;

                const context = msg.message?.extendedTextMessage?.contextInfo;

                if (context?.stanzaId !== sentMsg.key.id) continue;
                if ((msg.key.participant || msg.key.remoteJid) !== m.sender) continue;

                const text = (
                    msg.message?.conversation ||
                    msg.message?.extendedTextMessage?.text ||
                    ''
                ).trim().toLowerCase();

                if (!['iya', 'ya', 'y', 'yes'].includes(text)) continue;

                clearTimeout(timeout);
                sock.ev.off('messages.upsert', onMessage);

                if (!global.db?.users?.[m.sender]?.registered) {
                    return sock.sendMessage(m.from, {
                        text: 'Status registrasi kamu sudah tidak aktif'
                    }, { quoted: msg });
                }

                await updateUser(m.sender, { registered: false });

                return sock.sendMessage(m.from, {
                    text: '*[ Berhasil keluar! ]*\n> Status registrasi kamu telah dihapus.'
                }, { quoted: msg });
            }
        };

        sock.ev.on('messages.upsert', onMessage);
    }
};