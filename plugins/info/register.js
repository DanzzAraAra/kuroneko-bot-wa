const crypto = require('crypto');

module.exports = {
    name: 'register',
    execute: async (sock, m, args, settings, cmd, prefix) => {
        const { sender, chat } = m;
        const usedPrefix = prefix || '';

        if (global.db?.users?.[sender]?.registered) {
            return sock.sendMessage(chat, { text: '*Kamu sudah terdaftar.*' }, { quoted: m });
        }

        const username = args[0];
        const ageInput = args[1];

        if (!username || !ageInput) {
            return sock.sendMessage(chat, { text: `*Ex:* ${usedPrefix}register danzz_kuroneko 18` }, { quoted: m });
        }

        const age = parseInt(ageInput);
        if (isNaN(age)) {
            return sock.sendMessage(chat, { text: 'Umur harus berupa angka!' }, { quoted: m });
        }

        if (age < 12) {
            return sock.sendMessage(chat, { text: 'Maaf, pendaftaran ditolak! Umur kamu masih di bawah 12 tahun.' }, { quoted: m });
        }

        if (age > 30) {
            return sock.sendMessage(chat, { text: 'Maaf, pendaftaran ditolak! Batas maksimal umur untuk mendaftar adalah 30 tahun.' }, { quoted: m });
        }

        const isTaken = Object.values(global.db.users).some(
            u => u.registered && u.username && u.username.toLowerCase() === username.toLowerCase()
        );

        if (isTaken) {
            return sock.sendMessage(chat, { text: `Maaf, username *${username}* sudah terdaftar.\nSilakan coba daftar dengan username lain.` }, { quoted: m });
        }

        global.regSessions ??= new Map();
        if (global.regSessions.has(sender)) {
            return sock.sendMessage(chat, { text: '*Sesi verifikasi masih aktif.*\nSelesaikan atau tunggu waktunya habis.' }, { quoted: m });
        }

        const code = crypto.randomBytes(3).toString('hex').toUpperCase().slice(0, 5);
        const caption = `*VERIFIKASI REGISTRASI*\n\nUsername: *${username}*\nUmur: *${age} tahun*\nKode: \`${code}\`\n\nBalas pesan ini dengan kode di atas untuk menyelesaikan pendaftaran.\n\n_Batas waktu: 3 menit._`;
        
        const sentMsg = await sock.sendMessage(chat, { text: caption }, { quoted: m });

        const timeout = setTimeout(async () => {
            const session = global.regSessions.get(sender);
            
            if (session?.msgId === sentMsg.key.id) {
                global.regSessions.delete(sender);
                
                await sock.sendMessage(chat, { 
                    text: `*WAKTU HABIS*\n\nSesi kedaluwarsa. Ketik ulang *${usedPrefix}register <username> <umur>* untuk mendaftar.`, 
                    edit: sentMsg.key 
                });
            }
        }, 3 * 60 * 1000);

        global.regSessions.set(sender, {
            code,
            username,
            age,
            msgId: sentMsg.key.id,
            key: sentMsg.key,
            timeout
        });
    }
};