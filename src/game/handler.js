/*
 * Dandy
 * DO NOT FOR SALE!
 * Github: github.com/DanzzAraAra
 * Note: kalau mau nambahin sistem game untuk handler limit nya kamu add juga di sini logic sendiri jangan manja
 */
import { addReward } from "./reward.js";

const textNotStarter = "Hanya pemain yang memulai game yang bisa menyerah!";

const processGame = async (sock, m, text, jid, sender, gameName) => {
    const game = global[gameName]?.[jid];
    if (!game) return false;

    const answer = text.toLowerCase().trim();

    if (answer === "nyerah") {
        if (sender !== game.sender) {
            await sock.sendMessage(
                jid,
                { text: textNotStarter },
                { quoted: m }
            );

            return true;
        }

        clearTimeout(game.timeout);
        delete global[gameName][jid];

        await sock.sendMessage(jid, {
            text: `Kamu menyerah!\nJawaban: *${game.jawaban}*\n${game.keterangan || ""}`
        }, { quoted: m });

        return true;
    }

    if (answer !== game.jawaban) return false;

    clearTimeout(game.timeout);
    delete global[gameName][jid];

    await addReward(sender, game.poin);

    await sock.sendMessage(jid, {
    text: `🎉 *BENAR!*\n\nJawaban: *${game.jawaban}*\n${game.keterangan || ""}\nKamu mendapatkan tambahan *+${game.poin} Money*.`
}, { quoted: m });

    return true;
};

const processFamily100 = async (sock, m, text, jid, sender) => {
    const game = global.family100?.[jid];
    if (!game) return false;

    const answer = text.toLowerCase().trim();

    if (answer === "nyerah") {
        if (sender !== game.sender) {
            await sock.sendMessage(
                jid,
                { text: textNotStarter },
                { quoted: m }
            );

            return true;
        }

        clearTimeout(game.timeout);

        const answers = game.jawaban
            .map((jawaban, i) => `*${i + 1}.* ${jawaban.toUpperCase()}`)
            .join("\n");

        delete global.family100[jid];

        await sock.sendMessage(jid, {
            text: `Kamu menyerah!\n\nSoal: *${game.soal}*\n\n${answers}`
        }, { quoted: m });

        return true;
    }

    const index = game.jawaban.indexOf(answer);

    if (index === -1) return false;
    if (game.terjawab.includes(answer)) return true;

    game.terjawab.push(answer);

    await addReward(sender, game.poinMap[index]);

    const board = game.jawaban
        .map((jawaban, i) => {
            if (game.terjawab.includes(jawaban)) {
                return `*${i + 1}.* ${jawaban.toUpperCase()} *(+${game.poinMap[i]} Money)*`;
            }

            return `*${i + 1}.*`;
        })
        .join("\n");

    if (game.terjawab.length === game.jawaban.length) {
        clearTimeout(game.timeout);
        delete global.family100[jid];

        await sock.sendMessage(jid, {
            text: `🎉 *PERFECT!*\n\nSoal: *${game.soal}*\n\n${board}\n\n*SEMUA JAWABAN BERHASIL DITEBAK!*\nGame diselesaikan.`
        }, { quoted: m });
    } else {
        const remaining = game.jawaban.length - game.terjawab.length;

        await sock.sendMessage(jid, {
            text: `*BENAR!*\n\nSoal: *${game.soal}*\n\n${board}\n\n_Masih ada *${remaining}* jawaban lagi yang belum tertebak._`
        }, { quoted: m });
    }

    return true;
};

const handleGame = async (sock, m, text, jid, sender) => {
// add juga disini kalau mau nambah game
    const games = [
        "tekateki",
        "caklontong",
        "tebakgambar",
        "asahotak"
    ];

    for (const game of games) {
        if (await processGame(sock, m, text, jid, sender, game)) {
            return true;
        }
    }

    return processFamily100(sock, m, text, jid, sender);
};

export { handleGame };