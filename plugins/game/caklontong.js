const axios = require('axios');

global.caklontong = global.caklontong || {};

module.exports = {
    name: ['caklontong'],
    limit: 1,
    premium: false,
    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        if (global.caklontong[m.from]) {
            await sock.sendMessage(m.from, { text: 'Masih ada sesi caklontong yang belum diselesaikan di chat ini!' }, { quoted: m });
            return false;
        }

        try {
            const response = await axios.get('https://raw.githubusercontent.com/BochilTeam/database/master/games/caklontong.json', {
                timeout: 30000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                },
            });
            
            const src = response.data;
            const data = src[Math.floor(Math.random() * src.length)];

            const poin = 5;
            const waktu = 60000;
            const soal = `*CAK LONTONG*\n\n${data.soal}\n\nWaktu: 60 detik\nBonus: ${poin} Limit\nKetik *nyerah* untuk menyerah.`;

            const msg = await sock.sendMessage(m.from, { text: soal }, { quoted: m });

            global.caklontong[m.from] = {
                sender: m.sender,
                jawaban: data.jawaban.toLowerCase(),
                keterangan: data.deskripsi,
                poin: poin,
                timeout: setTimeout(() => {
                    if (global.caklontong[m.from]) {
                        sock.sendMessage(m.from, { text: `Waktu habis!\nJawaban: *${data.jawaban}*\n${data.deskripsi}` }, { quoted: m });
                        delete global.caklontong[m.from];
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