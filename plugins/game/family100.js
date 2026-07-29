const axios = require('axios');

global.family100 = global.family100 || {};

module.exports = {
    name: ['family100'],
    limit: 1,
    premium: false,
    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        if (global.family100[m.from]) {
            await sock.sendMessage(m.from, { text: 'Masih ada sesi Family 100 yang belum diselesaikan di chat ini!' }, { quoted: m });
            return false;
        }

        try {
            const response = await axios.get('https://raw.githubusercontent.com/BochilTeam/database/master/games/family100.json', {
                timeout: 30000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });
            
            const src = response.data;
            const data = src[Math.floor(Math.random() * src.length)];

            const waktu = 120000; 

            const jawaban = data.jawaban.map(v => v.toLowerCase().trim());
            
            const pilihanPoin = [3, 5, 7, 10, 12, 15, 20, 25];
            const poinMap = jawaban.map(() => pilihanPoin[Math.floor(Math.random() * pilihanPoin.length)]);

            let boardDisplay = '';
            for (let i = 0; i < jawaban.length; i++) {
                boardDisplay += `*${i + 1}.*\n`;
            }

            const soal = `*FAMILY 100*\n\nSoal: *${data.soal}*\n\n${boardDisplay}\nWaktu: 2 Menit\nKetik *nyerah* untuk menyerah.`;
            
            const msg = await sock.sendMessage(m.from, { text: soal }, { quoted: m });

            global.family100[m.from] = {
                sender: m.sender,
                soal: data.soal,
                jawaban: jawaban,
                poinMap: poinMap,
                terjawab: [],
                msgId: msg.key.id,
                timeout: setTimeout(() => {
                    if (global.family100[m.from]) {
                        const game = global.family100[m.from];
                        let teks = `Waktu habis!\n\nSoal: *${game.soal}*\n\n`;
                        
                        for (let i = 0; i < game.jawaban.length; i++) {
                            teks += `*${i + 1}.* ${game.jawaban[i].toUpperCase()}\n`;
                        }
                        
                        sock.sendMessage(m.from, { text: teks.trim() }, { quoted: m });
                        delete global.family100[m.from];
                    }
                }, waktu)
            };

        } catch (error) {
            console.error(error);
            await sock.sendMessage(m.from, { text: settings.mess.error }, { quoted: m });
            return false;
        }
    }
};