import { updateUser } from "../../src/database.js";

const formatMoney = amount =>
    `Rp${Number(amount).toLocaleString("id-ID")}`;

const getNumber = jid => {
    if (!jid || jid.endsWith("@lid")) return "";
    return jid.split("@")[0].split(":")[0].replace(/\D/g, "");
};

export default {
    name: ["transfer", "tf"],

    execute: async (sock, m, args, settings) => {
        const reply = text => m.reply(text);

        try {
            const ctx = m.message?.extendedTextMessage?.contextInfo;

            let target =
                ctx?.mentionedJid?.[0] ||
                m.quoted?.jid ||
                ctx?.participantAlt ||
                ctx?.participant;

            if (!target) {
                return reply("Tag atau reply pengguna yang ingin menerima transfer.");
            }

            if (target.endsWith("@lid")) {
                const mapped = await sock.signalRepository?.lidMapping?.getPNForLID(target);
                target = mapped || target;
            }

            const users = global.db.users || {};
            const targetNum = getNumber(target);

            const receiverId = Object.keys(users).find(id =>
                id === target ||
                (
                    targetNum &&
                    getNumber(id) === targetNum
                )
            );

            if (!receiverId) {
                return reply("Data penerima tidak ditemukan di database.");
            }

            const senderId = m.userId || m.sender;

            if (receiverId === senderId) {
                return reply("Tidak bisa transfer ke diri sendiri.");
            }

            const amount = Number(args.find(arg => /^\d+$/.test(arg)));

            if (!Number.isSafeInteger(amount) || amount < 1) {
                return reply("Masukkan nominal transfer yang valid.\nContoh: .transfer @user 1000");
            }

            const sender = users[senderId];
            const receiver = users[receiverId];

            if (!sender || !receiver) {
                return reply("Data pengirim atau penerima tidak ditemukan.");
            }

            const fee = Math.ceil(amount * 0.05);
            const total = amount + fee;
            const balance = Number(sender.money) || 0;

            if (balance < total) {
                return reply(
                    `*[ MONEY KAMU TIDAK CUKUP ]*\n\n` +
                    `> Nominal: ${formatMoney(amount)}\n` +
                    `> Biaya admin: ${formatMoney(fee)}\n` +
                    `> Total: ${formatMoney(total)}\n` +
                    `> Saldo: ${formatMoney(balance)}`
                );
            }

            await updateUser(senderId, {
                money: balance - total
            });

            await updateUser(receiverId, {
                money: (Number(receiver.money) || 0) + amount
            });

            return m.reply(
                `*[ TRANSFER BERHASIL ]*\n\n` +
                `> Penerima: @${targetNum || receiverId.split("@")[0]}\n` +
                `> Nominal: ${formatMoney(amount)}\n` +
                `> Biaya admin: ${formatMoney(fee)}\n` +
                `> Total dibayar: ${formatMoney(total)}\n` +
                `> Sisa saldo: ${formatMoney(balance - total)}`,
                { mentions: [receiverId] }
            );
        } catch (err) {
            console.error(err);
            return reply(settings?.mess?.error || err.message);
        }
    }
};