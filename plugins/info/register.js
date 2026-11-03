import crypto from 'crypto';

export default {
    name: ['register'],
    premium: false,

    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        const reply = text => m.reply(text);

        const userId = m.userId || m.sender;

        if (global.db?.users?.[userId]?.registered) {
        return reply('*Kamu sudah terdaftar*');
        }

        const username = args[0]?.trim();
        const ageInput = args[1];

        if (!username || !ageInput) {
            return reply(`*Ex:* ${usedPrefix + commandName} danzz_kuroneko 18`);
        }

        if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
            return reply('Username harus 3-20 karakter dan hanya boleh berisi huruf, angka, atau underscore.');
        }

        if (!/^\d+$/.test(ageInput)) {
            return reply('Umur harus berupa angka!');
        }

        const age = Number(ageInput);

        if (age < 12) {
            return reply('Maaf, pendaftaran ditolak! Umur kamu masih di bawah 12 tahun');
        }

        if (age > 30) {
            return reply('Maaf, pendaftaran ditolak! Batas maksimal umur untuk mendaftar adalah 30 tahun');
        }

        const users = Object.values(global.db?.users || {});
        const isTaken = users.some(
            user => user.registered && user.username?.toLowerCase() === username.toLowerCase()
        );

        if (isTaken) {
            return reply(
                `Maaf, username *${username}* sudah terdaftar\n` +
                'Silakan coba daftar dengan username lain'
            );
        }

        global.regSessions ??= new Map();

        if (global.regSessions.has(userId)) {
        return reply('*Sesi verifikasi masih aktif*\nSelesaikan atau tunggu waktunya habis');
}

        const code = crypto.randomBytes(3).toString('hex').toUpperCase().slice(0, 5);
        const caption = `*[ VERIFIKASI REGISTRASI ]*

Username: *${username}*
Umur: *${age} tahun*
Kode: \`${code}\`

Balas pesan ini dengan kode di atas untuk menyelesaikan pendaftaran.

> _Batas waktu: 3 menit_`;

        const sentMsg = await sock.sendMessage(m.chat, {
            text: caption
        }, { quoted: m });

        const timeout = setTimeout(async () => {
            const session = global.regSessions.get(m.sender);

            if (session?.msgId !== sentMsg.key.id) return;

            global.regSessions.delete(m.sender);

            try {
                await sock.sendMessage(m.chat, {
                    text: `*[ WAKTU HABIS ]*\n\nSesi kedaluwarsa. Ketik ulang *${usedPrefix + commandName} <username> <umur>* untuk mendaftar`,
                    edit: sentMsg.key
                });
            } catch (err) {
                console.error(err);
            }
        }, 180000);

        global.regSessions.set(userId, {
        code,
        username,
        age,
        msgId: sentMsg.key.id,
        key: sentMsg.key,
        timeout
     });
    }
};