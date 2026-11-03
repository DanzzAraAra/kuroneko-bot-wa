import axios from 'axios';

global.caklontong = global.caklontong || {};

export default {
    name: ['caklontong'],
    limit: 1,
    premium: false,

    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        if (global.caklontong[m.from]) {
            return sock.sendMessage(m.from, {
                text: 'Masih ada sesi caklontong yang belum diselesaikan di chat ini!'
            }, { quoted: m });
        }

        try {
            const { data: src } = await axios.get(
                'https://raw.githubusercontent.com/BochilTeam/database/master/games/caklontong.json',
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
            const soal = `*CAK LONTONG*\n\n${data.soal}\n\nWaktu: 60 detik\nBonus: ${poin} Limit\nKetik *nyerah* untuk menyerah`;

            const msg = await sock.sendMessage(
                m.from,
                { text: soal },
                { quoted: m }
            );

            global.caklontong[m.from] = {
                sender: m.sender,
                jawaban: data.jawaban.toLowerCase(),
                keterangan: data.deskripsi,
                poin,
                timeout: setTimeout(() => {
                    if (!global.caklontong[m.from]) return;

                    sock.sendMessage(m.from, {
                        text: `Waktu habis!\nJawaban: *${data.jawaban}*\n${data.deskripsi}`
                    }, { quoted: m });

                    delete global.caklontong[m.from];
                }, waktu)
            };
        } catch (error) {
            await sock.sendMessage(m.from, {
                text: settings.mess.error
            }, { quoted: m });
        }
    }
};