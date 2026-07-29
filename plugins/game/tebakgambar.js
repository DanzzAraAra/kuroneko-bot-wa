const axios = require('axios');

global.tebakgambar = global.tebakgambar || {};

module.exports = {
    name: ['tebakgambar'],
    limit: 1,
    premium: false,
    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        if (global.tebakgambar[m.from]) {
            await sock.sendMessage(m.from, { text: 'Masih ada sesi tebak gambar yang belum diselesaikan di chat ini!' }, { quoted: m });
            return false;
        }

        try {
            const response = await axios.get('https://raw.githubusercontent.com/BochilTeam/database/master/games/tebakgambar.json', {
                timeout: 30000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });
            
            const src = response.data;
            const data = src[Math.floor(Math.random() * src.length)];

            const poin = 5;
            const waktu = 60000; 
            const caption = `*TEBAK GAMBAR*\n\nDeskripsi: ${data.deskripsi || '-'}\n\nWaktu: 60 detik\nBonus: ${poin} Limit\nKetik *nyerah* untuk menyerah.`;
           
            const msg = await sock.sendMessage(m.from, { 
                image: { url: data.img }, 
                caption: caption 
            }, { quoted: m });

            global.tebakgambar[m.from] = {
                sender: m.sender,
                jawaban: data.jawaban.toLowerCase(),
                keterangan: data.deskripsi,
                msgId: msg.key.id,
                poin: poin,
                timeout: setTimeout(() => {
                    if (global.tebakgambar[m.from]) {
                        sock.sendMessage(m.from, { text: `Waktu habis!\nJawaban yang benar adalah: *${data.jawaban}*` }, { quoted: m });
                        delete global.tebakgambar[m.from];
                    }
                }, waktu)
            };

        } catch (error) {
            console.error(error);
            await sock.sendMessage(m.from, { text: settings.mess.error || 'Terjadi kesalahan saat mengambil soal.' }, { quoted: m });
            return false;
        }
    }
};