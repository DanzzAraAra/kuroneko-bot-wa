import axios from 'axios';

global.tekateki = global.tekateki || {};

export default {
    name: ['tekateki'],
    limit: 1,
    premium: false,

    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        if (global.tekateki[m.from]) {
            return sock.sendMessage(m.from, {
                text: 'Masih ada sesi teka teki yang belum diselesaikan di chat ini!'
            }, { quoted: m });
        }

        try {
            const { data: src } = await axios.get(
                'https://raw.githubusercontent.com/BochilTeam/database/master/games/tekateki.json',
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
            const soal = `*TEKA - TEKI*\n\n${data.soal}\n\nWaktu: 60 detik\nBonus: ${poin} Limit\nKetik *nyerah* untuk menyerah`;

            const msg = await sock.sendMessage(
                m.from,
                { text: soal },
                { quoted: m }
            );

            global.tekateki[m.from] = {
                sender: m.sender,
                soal: data.soal,
                jawaban: data.jawaban.toLowerCase(),
                msgId: msg.key.id,
                poin,
                timeout: setTimeout(() => {
                    if (!global.tekateki[m.from]) return;

                    sock.sendMessage(m.from, {
                        text: `Waktu habis!\nJawaban yang benar adalah: *${data.jawaban}*`
                    }, { quoted: m });

                    delete global.tekateki[m.from];
                }, waktu)
            };
        } catch (error) {
            await sock.sendMessage(m.from, {
                text: settings.mess.error
            }, { quoted: m });
        }
    }
};