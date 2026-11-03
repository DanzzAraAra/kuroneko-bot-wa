import axios from 'axios';

global.family100 = global.family100 || {};

export default {
    name: ['family100'],
    limit: 1,
    premium: false,

    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        if (global.family100[m.from]) {
            return sock.sendMessage(m.from, {
                text: 'Masih ada sesi Family 100 yang belum diselesaikan di chat ini!'
            }, { quoted: m });
        }

        try {
            const { data: src } = await axios.get(
                'https://raw.githubusercontent.com/BochilTeam/database/master/games/family100.json',
                {
                    timeout: 30000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0'
                    }
                }
            );

            const data = src[Math.floor(Math.random() * src.length)];
            const waktu = 120000;
            const jawaban = data.jawaban.map(v => v.toLowerCase().trim());
            const pilihanPoin = [3, 5, 7, 10, 12, 15, 20, 25];
            const poinMap = jawaban.map(() => pilihanPoin[Math.floor(Math.random() * pilihanPoin.length)]);

            let boardDisplay = '';
            for (let i = 0; i < jawaban.length; i++) {
                boardDisplay += `*${i + 1}.*\n`;
            }

            const soal = `*FAMILY 100*\n\nSoal: *${data.soal}*\n\n${boardDisplay}\nWaktu: 2 Menit\nKetik *nyerah* untuk menyerah`;

            const msg = await sock.sendMessage(
                m.from,
                { text: soal },
                { quoted: m }
            );

            global.family100[m.from] = {
                sender: m.sender,
                soal: data.soal,
                jawaban,
                poinMap,
                terjawab: [],
                msgId: msg.key.id,
                timeout: setTimeout(() => {
                    const game = global.family100[m.from];
                    if (!game) return;

                    let teks = `Waktu habis!\n\nSoal: *${game.soal}*\n\n`;

                    for (let i = 0; i < game.jawaban.length; i++) {
                        teks += `*${i + 1}.* ${game.jawaban[i].toUpperCase()}\n`;
                    }

                    sock.sendMessage(m.from, {
                        text: teks.trim()
                    }, { quoted: m });

                    delete global.family100[m.from];
                }, waktu)
            };
        } catch (error) {
            await sock.sendMessage(m.from, {
                text: settings.mess.error
            }, { quoted: m });
        }
    }
};