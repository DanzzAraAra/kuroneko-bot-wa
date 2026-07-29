/*
   * Dandy
   * DO NOT FOR SALE!
   * Github: github.com/DanzzAraAra
*/
const { addReward } = require('./reward');

const textNotStarter = 'Hanya pemain yang memulai game yang bisa menyerah!';
const textSurrender = (jawaban, keterangan) => `Kamu menyerah!\nJawaban: *${jawaban}*\n${keterangan || ''}`;
const textCorrect = (jawaban, keterangan, poin) => `🎉 *BENAR!*\n\nJawaban: *${jawaban}*\n${keterangan || ''}\nKamu mendapatkan tambahan *+${poin} Limit*.`;

const processGame = async (sock, m, text, jid, sender, gameName) => {
    if (!global[gameName] || !global[gameName][jid]) return false;
    
    const game = global[gameName][jid];
    const userAnswer = text.toLowerCase().trim();
    
    if (userAnswer === 'nyerah') {
        if (sender !== game.sender) {
            await sock.sendMessage(jid, { text: textNotStarter }, { quoted: m });
            return true;
        }
        clearTimeout(game.timeout);
        delete global[gameName][jid];
        await sock.sendMessage(jid, { text: textSurrender(game.jawaban, game.keterangan) }, { quoted: m });
        return true;
    } 
    
    if (userAnswer === game.jawaban) {
        clearTimeout(game.timeout);
        delete global[gameName][jid];
        await addReward(sender, game.poin);
        await sock.sendMessage(jid, { text: textCorrect(game.jawaban, game.keterangan, game.poin) }, { quoted: m });
        return true;
    }
    
    return false;
};

const processFamily100 = async (sock, m, text, jid, sender) => {
    if (!global.family100 || !global.family100[jid]) return false;
    
    const game = global.family100[jid];
    const userAnswer = text.toLowerCase().trim();
    
    if (userAnswer === 'nyerah') {
        if (sender !== game.sender) {
            await sock.sendMessage(jid, { text: textNotStarter }, { quoted: m });
            return true;
        }
        clearTimeout(game.timeout);
        
        let teks = `Kamu menyerah!\n\nSoal: *${game.soal}*\n\n`;
        for (let i = 0; i < game.jawaban.length; i++) {
            teks += `*${i + 1}.* ${game.jawaban[i].toUpperCase()}\n`;
        }
        
        delete global.family100[jid];
        await sock.sendMessage(jid, { text: teks.trim() }, { quoted: m });
        return true;
    } 
    
    const indexJawaban = game.jawaban.indexOf(userAnswer);
    if (indexJawaban !== -1) {
        
        if (game.terjawab.includes(userAnswer)) {
            return true; 
        }
        
        game.terjawab.push(userAnswer);
        
        const dapetPoin = game.poinMap[indexJawaban];
        await addReward(sender, dapetPoin);
        
        let boardDisplay = '';
        for (let i = 0; i < game.jawaban.length; i++) {
            const jwb = game.jawaban[i];
            if (game.terjawab.includes(jwb)) {
                boardDisplay += `*${i + 1}.* ${jwb.toUpperCase()} *(+${game.poinMap[i]} Limit)*\n`;
            } else {
                boardDisplay += `*${i + 1}.*\n`;
            }
        }

        if (game.terjawab.length === game.jawaban.length) {
            clearTimeout(game.timeout);
            delete global.family100[jid];
            await sock.sendMessage(jid, { 
                text: `🎉 *PERFECT!*\n\nSoal: *${game.soal}*\n\n${boardDisplay}\n*SEMUA JAWABAN BERHASIL DITEBAK!*\nGame diselesaikan.` 
            }, { quoted: m });
        } else {
            const sisa = game.jawaban.length - game.terjawab.length;
            await sock.sendMessage(jid, { 
                text: `*BENAR!*\n\nSoal: *${game.soal}*\n\n${boardDisplay}\n_Masih ada *${sisa}* jawaban lagi yang belum tertebak._` 
            }, { quoted: m });
        }
        return true; 
    }
    
    return false;
};

const handleGame = async (sock, m, text, jid, sender) => {
    const activeGames = ['tekateki', 'caklontong', 'tebakgambar', 'asahotak'];
    
    for (const game of activeGames) {
        if (await processGame(sock, m, text, jid, sender, game)) {
            return true;
        }
    }
    
    if (await processFamily100(sock, m, text, jid, sender)) {
        return true;
    }
    
    return false;
};

module.exports = { handleGame };