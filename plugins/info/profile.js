import { updateUser } from "../../src/database.js";

// ngurangin uang jika liat profile user lain bisa lu ubah 30 = Rp30
const VIEW_COST = 30;

const msToTime = duration => {
    const seconds = Math.floor((duration / 1000) % 60);
    const minutes = Math.floor((duration / (1000 * 60)) % 60);
    const hours = Math.floor((duration / (1000 * 60 * 60)) % 24);
    const days = Math.floor(duration / (1000 * 60 * 60 * 24));

    const result = [];

    if (days) result.push(`${days} Hari`);
    if (hours) result.push(`${hours} Jam`);
    if (minutes) result.push(`${minutes} Menit`);
    if (seconds) result.push(`${seconds} Detik`);

    return result.length ? result.join(", ") : "Beberapa saat lagi";
};

const formatMoney = amount =>
    `Rp${(Number(amount) || 0).toLocaleString("id-ID")}`;

const getNumber = jid => {
    if (!jid) return "";
    return String(jid).split("@")[0].split(":")[0].replace(/\D/g, "");
};

export default {
    name: ["profile", "me"],

    execute: async (sock, m, args, settings) => {
        const reply = text => m.reply(text);

        try {
            const ctx = m.message?.extendedTextMessage?.contextInfo;
            const senderId = m.userId || m.sender;
            const users = global.db?.users || {};

            let target =
                ctx?.mentionedJid?.[0] ||
                m.quoted?.jid ||
                ctx?.participantAlt ||
                ctx?.participant;

            if (!target && args[0]) {
                const number = getNumber(args[0]);

                if (number) {
                    target = `${number}@s.whatsapp.net`;
                }
            }

            if (!target) {
                target = senderId;
            }

            if (target.endsWith("@lid")) {
                const mapped = await sock.signalRepository?.lidMapping?.getPNForLID(target);
                target = mapped || target;
            }

            const targetNum = getNumber(target);
            const senderNum = getNumber(senderId);

            const profileId = Object.keys(users).find(id =>
                id === target ||
                (
                    targetNum &&
                    getNumber(id) === targetNum
                )
            );

            if (!profileId) {
                return reply("Pengguna tidak ditemukan dalam database.");
            }

            const isSelf =
                profileId === senderId ||
                (
                    senderNum &&
                    senderNum === getNumber(profileId)
                );

            const user = users[profileId];

            if (!isSelf) {
                const sender = users[senderId] || Object.values(users).find(item =>
                    item && senderNum && getNumber(item.jid) === senderNum
                );

                const senderKey = users[senderId]
                    ? senderId
                    : Object.keys(users).find(id =>
                        senderNum && getNumber(id) === senderNum
                    );

                if (!sender || !senderKey) {
                    return reply("Data akun kamu tidak ditemukan.");
                }

                const balance = Number(sender.money) || 0;

                if (balance < VIEW_COST) {
                    return reply(
                        `Uang kamu tidak cukup untuk melihat profil orang lain.\n\n` +
                        `> Biaya: ${formatMoney(VIEW_COST)}\n` +
                        `> Saldo: ${formatMoney(balance)}`
                    );
                }

                await updateUser(senderKey, {
                    money: balance - VIEW_COST
                });
            }

            const premiumTime = Number(user.premiumTime) || 0;
            const premiumStatus = user.premium
                ? premiumTime > Date.now()
                    ? `Aktif (Sisa: ${msToTime(premiumTime - Date.now())})`
                    : "Kedaluwarsa"
                : "Bukan Premium";

            const teks = `*[ PROFILE ]*
• *Nama:* ${user.name || "Unknown"}
• *Username:* ${user.username ? `@${user.username}` : "Belum diatur"}
• *Umur:* ${user.age ? `${user.age} Tahun` : "Belum diatur"}
• *Nomor:* ${getNumber(profileId) || "-"}
• *Role:* ${user.role || "User"}

*[ STATUS ]*
• Terdaftar: ${user.registered ? "Sudah" : "Belum"}
• Uang: ${formatMoney(user.money)}
• Limit: ${user.limit ?? 0}
• Premium: ${premiumStatus}
• Banned: ${user.banned ? "Ya" : "Tidak"}${!isSelf ? `\n\n> Biaya melihat profil: ${formatMoney(VIEW_COST)}` : ""}`;

            return reply(teks);
        } catch (err) {
            console.error("[profile]", err);
            return reply(settings?.mess?.error || err.message);
        }
    }
};