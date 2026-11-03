import { updateUser } from "../../src/database.js";
import { addReward } from "../../src/game/reward.js";

const symbols = ["🍒", "🍋", "🍇", "🍉", "⭐", "💎"];
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const formatMoney = amount => `Rp${Number(amount || 0).toLocaleString("id-ID")}`;
const randomSlot = () => Array.from({ length: 3 }, () => symbols[Math.floor(Math.random() * symbols.length)]);

const getReward = (result, bet) => {
    if (result.every(item => item === result[0])) {
        return { multiplier: 5, reward: bet * 5, message: "JACKPOT! TIGA SIMBOL SAMA!" };
    }

    if (result[0] === result[1] || result[0] === result[2] || result[1] === result[2]) {
        return { multiplier: 1.5, reward: Math.floor(bet * 1.5), message: "DUA SIMBOL SAMA! Kamu menang!" };
    }

    return { multiplier: 0, reward: 0, message: "YAHH, KAMU KALAH!" };
};

const slotText = (result, bet, status) =>
    `🎰 *SLOT MACHINE*\n\n┏━━━━━━━━━┓\n┃  ${result[0]}     │   ${result[1]}   │  ${result[2]}   ┃\n┗━━━━━━━━━┛\n\n> Taruhan: ${formatMoney(bet)}\n${status}`;

export default {
    name: ["slot"],
    limit: 1,
    premium: false,

    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        const senderId = m.userId || m.sender;
        const users = global.db?.users || {};
        const user = users[senderId];
        const bet = Number(args[0]);

        if (!user) return m.reply("Data akun kamu tidak ditemukan.");

        if (!Number.isSafeInteger(bet) || bet < 10 || bet > 10000) {
            return m.reply(
                `*SLOT MACHINE* 🎰\n\n> Minimal: ${formatMoney(10)}\n> Maksimal: ${formatMoney(10000)}\n\n*Ex:* ${usedPrefix + commandName} 100`
            );
        }

        const balance = Number(user.money) || 0;
        if (balance < bet) {
            return m.reply(`Uang kamu tidak cukup!\n\n> Taruhan: ${formatMoney(bet)}\n> Saldo: ${formatMoney(balance)}`);
        }

        try {
            await updateUser(senderId, { money: balance - bet });

            const chat = m.chat || m.from;
            const spinMessage = await sock.sendMessage(
                chat,
                { text: slotText(["❔", "❔", "❔"], bet, "🎲 Memutar slot...") },
                { quoted: m }
            );

            const frames = [
                ["🍒", "🍋", "🍇"],
                ["⭐", "🍉", "💎"],
                ["🍇", "🍒", "🍋"],
                ["🍉", "💎", "⭐"]
            ];

            for (const frame of frames) {
                await delay(650);
                await sock.sendMessage(chat, {
                    text: slotText(frame, bet, "🎲 Memutar slot..."),
                    edit: spinMessage.key
                });
            }

            const result = randomSlot();
            const outcome = getReward(result, bet);

            if (outcome.reward > 0) await addReward(senderId, outcome.reward);

            const finalBalance = Number(users[senderId]?.money) || 0;

            await sock.sendMessage(chat, {
                text:
                    `🎰 *SLOT RESULT*\n\n┏━━━━━━━━━┓\n┃  ${result[0]}     │   ${result[1]}   │  ${result[2]}   ┃\n┗━━━━━━━━━┛\n\n` +
                    `*${outcome.message}*\n\n` +
                    `> Taruhan: ${formatMoney(bet)}\n` +
                    `> Perkalian: ${outcome.multiplier}x\n` +
                    `> Hadiah: ${formatMoney(outcome.reward)}\n` +
                    `> Saldo akhir: ${formatMoney(finalBalance)}`,
                edit: spinMessage.key
            });
        } catch (err) {
            console.error("[SLOT]", err);
            await m.reply(settings?.mess?.error || err.message);
            return false;
        }
    }
};