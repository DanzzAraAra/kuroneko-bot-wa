import axios from 'axios';

global.tebakgambar = global.tebakgambar || {};

export default {
    name: ['tebakgambar'],
    limit: 1,
    premium: false,

    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        if (global.tebakgambar[m.from]) {
            return sock.sendMessage(m.from, {
                text: 'Masih ada sesi tebak gambar yang belum diselesaikan di chat ini!'
            }, { quoted: m });
        }

        try {
            const { data: src } = await axios.get(
                'https://raw.githubusercontent.com/BochilTeam/database/master/games/tebakgambar.json',
                {
                    timeout: 30000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0'
                    }
                }
            );

            const data = src[Math.floor(Math.random() * src.length)];
            const poin = 5;
            const waktu = 60000;
            const caption = `*TEBAK GAMBAR*\n\nDeskripsi: ${data.deskripsi || '-'}\n\nWaktu: 60 detik\nBonus: ${poin} Limit\nKetik *nyerah* untuk menyerah`;

            const msg = await sock.sendMessage(m.from, {
                image: { url: data.img },
                caption
            }, { quoted: m });

            global.tebakgambar[m.from] = {
                sender: m.sender,
                jawaban: data.jawaban.toLowerCase(),
                keterangan: data.deskripsi,
                msgId: msg.key.id,
                poin,
                timeout: setTimeout(() => {
                    if (!global.tebakgambar[m.from]) return;

                    sock.sendMessage(m.from, {
                        text: `Waktu habis!\nJawaban yang benar adalah: *${data.jawaban}*`
                    }, { quoted: m });

                    delete global.tebakgambar[m.from];
                }, waktu)
            };
        } catch (error) {
            await sock.sendMessage(m.from, {
                text: settings.mess.error
            }, { quoted: m });
        }
    }
};