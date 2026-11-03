import { updateUser } from "../../src/database.js";

const INTEREST_RATE = 1.5;
const DAY = 24 * 60 * 60 * 1000;
const LATE_RATE = 1;
const MAX_LATE_RATE = 30;

const DEPOSIT_RATES = {
    3: 2,
    7: 5,
    14: 11,
    30: 25
};

const MIN_CREDIT_SCORE = 300;
const MAX_CREDIT_SCORE = 850;

const formatMoney = amount =>
    `Rp${Math.floor(Number(amount) || 0).toLocaleString("id-ID")}`;

const formatDate = timestamp =>
    new Date(timestamp).toLocaleString("id-ID", {
        timeZone: "Asia/Jakarta"
    });

const getLoan = user => user.loan || {
    active: false,
    history: []
};

const getInstallments = loan => loan.installments || [];

const getDepositos = user => Array.isArray(user.depositos)
    ? user.depositos
    : [];

const getCreditScore = user =>
    Math.min(MAX_CREDIT_SCORE, Math.max(
        MIN_CREDIT_SCORE,
        Number(user.creditScore) || 600
    ));

const getLateFee = (item, now = Date.now()) => {
    if (item.paid || now <= item.dueAt) return 0;

    const daysLate = Math.floor((now - item.dueAt) / DAY);

    return Math.floor(
        item.amount * Math.min(daysLate, MAX_LATE_RATE) * LATE_RATE / 100
    );
};

const getRemainingDebt = (loan, now = Date.now()) =>
    getInstallments(loan)
        .filter(item => !item.paid)
        .reduce(
            (total, item) => total + item.amount + getLateFee(item, now),
            0
        );

const getDueTotal = (loan, now = Date.now()) =>
    getInstallments(loan)
        .filter(item => !item.paid && item.dueAt <= now)
        .reduce(
            (total, item) => total + item.amount + getLateFee(item, now),
            0
        );

const getLoanStatus = loan => {
    if (!loan.active) return "Tidak ada pinjaman aktif";

    const installments = getInstallments(loan);
    const paid = installments.filter(item => item.paid).length;

    return `${paid}/${installments.length} cicilan dibayar`;
};

const getCreditGrade = score => {
    if (score >= 800) return "Excellent";
    if (score >= 740) return "Very Good";
    if (score >= 670) return "Good";
    if (score >= 580) return "Fair";
    if (score >= 450) return "Poor";
    return "Very Poor";
};

const addCreditHistory = (user, change, reason, now) => {
    const history = Array.isArray(user.creditHistory)
        ? user.creditHistory
        : [];

    const previous = getCreditScore(user);
    const next = Math.min(
        MAX_CREDIT_SCORE,
        Math.max(MIN_CREDIT_SCORE, previous + change)
    );

    const actualChange = next - previous;

    user.creditScore = next;
    user.creditHistory = [
        ...history,
        {
            change: actualChange,
            score: next,
            reason,
            date: now
        }
    ].slice(-50);

    return actualChange;
};

const getDepositInterest = deposit =>
    Math.floor(deposit.amount * deposit.rate / 100);

export default {
    name: [
        "bank",
        "deposit",
        "withdraw",
        "pinjam",
        "hutang",
        "bayar",
        "lunasi",
        "riwayatbank",
        "deposito",
        "depositolist",
        "depositoclaim",
        "creditscore",
        "creditreport"
    ],

    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        const reply = text => m.reply(text);

        try {
            const userId = m.userId || m.sender;
            const user = global.db.users[userId];

            if (!user) {
                return reply("Data pengguna tidak ditemukan.");
            }

            user.depositos = getDepositos(user);
            user.creditHistory = Array.isArray(user.creditHistory)
                ? user.creditHistory
                : [];

            let money = Number(user.money) || 0;
            let bank = Number(user.bank) || 0;
            let lastInterest = Number(user.lastBankInterest) || 0;
            let loan = getLoan(user);
            let creditScore = getCreditScore(user);

            const command = commandName.toLowerCase();
            const now = Date.now();

            const save = async data => {
                await updateUser(userId, data);

                Object.assign(user, data);

                money = Number(user.money) || 0;
                bank = Number(user.bank) || 0;
                loan = getLoan(user);
                creditScore = getCreditScore(user);
            };

            const applyInterest = async () => {
                if (!lastInterest) {
                    lastInterest = now;

                    await save({
                        lastBankInterest: now
                    });

                    return 0;
                }

                const elapsed = Math.floor((now - lastInterest) / DAY);

                if (elapsed < 1) return 0;

                const interest = bank > 0
                    ? Math.floor(
                        bank * (
                            Math.pow(1 + INTEREST_RATE / 100, elapsed) - 1
                        )
                    )
                    : 0;

                bank += interest;
                lastInterest += elapsed * DAY;

                await save({
                    bank,
                    lastBankInterest: lastInterest
                });

                return interest;
            };

            const applyOverdueCreditPenalty = async () => {
                const installments = getInstallments(loan);
                let changed = false;

                for (const item of installments) {
                    if (
                        item.paid ||
                        item.dueAt > now ||
                        item.scoreApplied
                    ) {
                        continue;
                    }

                    addCreditHistory(
                        user,
                        -10,
                        "Cicilan terlambat",
                        now
                    );

                    item.scoreApplied = true;
                    changed = true;
                }

                if (changed) {
                    await save({
                        loan,
                        creditScore: user.creditScore,
                        creditHistory: user.creditHistory
                    });
                }
            };

            if (command === "bank") {
                const interest = await applyInterest();

                return reply(
                    `*[ ${settings.botName || "KuroNeko"} BANK ]*\n\n` +
                    `> Wallet: ${formatMoney(money)}\n` +
                    `> Bank: ${formatMoney(bank)}\n` +
                    `> Total aset: ${formatMoney(money + bank)}\n` +
                    `> Bunga tabungan: ${INTEREST_RATE}% / 24 jam\n` +
                    `> Credit Score: ${creditScore} (${getCreditGrade(creditScore)})\n\n` +
                    `*Informasi pinjaman:*\n` +
                    `> Status: ${getLoanStatus(loan)}\n` +
                    `> Sisa hutang: ${formatMoney(getRemainingDebt(loan, now))}\n` +
                    `> Tagihan sekarang: ${formatMoney(getDueTotal(loan, now))}\n\n` +
                    `*Cara penggunaan:*\n` +
                    `> ${usedPrefix}deposit 1000\n` +
                    `> ${usedPrefix}withdraw 1000\n` +
                    `> ${usedPrefix}pinjam 10000 3\n` +
                    `> ${usedPrefix}hutang\n` +
                    `> ${usedPrefix}bayar\n` +
                    `> ${usedPrefix}lunasi\n` +
                    `> ${usedPrefix}riwayatbank\n` +
                    `> ${usedPrefix}deposito 10000 7\n` +
                    `> ${usedPrefix}depositolist\n` +
                    `> ${usedPrefix}depositoclaim\n` +
                    `> ${usedPrefix}creditscore\n` +
                    `> ${usedPrefix}creditreport` +
                    (interest > 0
                        ? `\n\n> Bunga diterima: +${formatMoney(interest)}`
                        : "")
                );
            }

            if (command === "deposit" || command === "withdraw") {
                await applyInterest();

                const amount = Number(args[0]);

                if (!Number.isSafeInteger(amount) || amount < 1) {
                    return reply(
                        `Masukkan nominal yang valid.\n\n` +
                        `Contoh: ${usedPrefix}${command} 1000`
                    );
                }

                if (command === "deposit") {
                    if (money < amount) {
                        return reply(
                            `Money kamu tidak cukup!\n\n` +
                            `> Wallet: ${formatMoney(money)}\n` +
                            `> Deposit: ${formatMoney(amount)}`
                        );
                    }

                    await save({
                        money: money - amount,
                        bank: bank + amount
                    });

                    return reply(
                        `*[ DEPOSIT BERHASIL ]*\n\n` +
                        `> Jumlah: ${formatMoney(amount)}\n` +
                        `> Wallet: ${formatMoney(money)}\n` +
                        `> Bank: ${formatMoney(bank)}`
                    );
                }

                if (bank < amount) {
                    return reply(
                        `Saldo bank tidak cukup!\n\n` +
                        `> Bank: ${formatMoney(bank)}\n` +
                        `> Withdraw: ${formatMoney(amount)}`
                    );
                }

                await save({
                    money: money + amount,
                    bank: bank - amount
                });

                return reply(
                    `*[ WITHDRAW BERHASIL ]*\n\n` +
                    `> Jumlah: ${formatMoney(amount)}\n` +
                    `> Wallet: ${formatMoney(money)}\n` +
                    `> Bank: ${formatMoney(bank)}`
                );
            }

            if (command === "deposito") {
                const amount = Number(args[0]);
                const term = Number(args[1]);

                if (!Number.isSafeInteger(amount) || amount < 1000) {
                    return reply(
                        `Minimal deposito Rp1.000.\n\n` +
                        `Contoh: ${usedPrefix}deposito 10000 7`
                    );
                }

                if (!DEPOSIT_RATES[term]) {
                    return reply(
                        `*Pilihan tenor deposito:*\n\n` +
                        Object.entries(DEPOSIT_RATES)
                            .map(([days, rate]) =>
                                `> ${days} hari: bunga ${rate}%`
                            )
                            .join("\n") +
                        `\n\nContoh: ${usedPrefix}deposito 10000 7`
                    );
                }

                if (bank < amount) {
                    return reply(
                        `Saldo bank tidak cukup!\n\n` +
                        `> Saldo bank: ${formatMoney(bank)}\n` +
                        `> Nominal deposito: ${formatMoney(amount)}`
                    );
                }

                const deposit = {
                    id: `DEP${now}`,
                    amount,
                    termDays: term,
                    rate: DEPOSIT_RATES[term],
                    startAt: now,
                    dueAt: now + term * DAY
                };

                user.depositos.push(deposit);

                await save({
                    bank: bank - amount,
                    depositos: user.depositos
                });

                return reply(
                    `*[ DEPOSITO BERHASIL ]*\n\n` +
                    `> ID: ${deposit.id}\n` +
                    `> Nominal: ${formatMoney(amount)}\n` +
                    `> Tenor: ${term} hari\n` +
                    `> Bunga: ${deposit.rate}%\n` +
                    `> Estimasi keuntungan: ${formatMoney(getDepositInterest(deposit))}\n` +
                    `> Total pencairan: ${formatMoney(amount + getDepositInterest(deposit))}\n\n` +
                    `> Jatuh tempo: ${formatDate(deposit.dueAt)}\n\n` +
                    `Gunakan ${usedPrefix}depositolist untuk melihat deposito.`
                );
            }

            if (command === "depositolist") {
                const deposits = user.depositos;

                if (!deposits.length) {
                    return reply("Kamu belum memiliki deposito aktif.");
                }

                const detail = deposits.map((item, index) => {
                    const status = now >= item.dueAt
                        ? "SIAP DICAIRKAN"
                        : `Jatuh tempo: ${formatDate(item.dueAt)}`;

                    return (
                        `${index + 1}. *${item.id}*\n` +
                        `> Nominal: ${formatMoney(item.amount)}\n` +
                        `> Tenor: ${item.termDays} hari\n` +
                        `> Bunga: ${item.rate}%\n` +
                        `> Keuntungan: ${formatMoney(getDepositInterest(item))}\n` +
                        `> Status: ${status}`
                    );
                }).join("\n\n");

                return reply(
                    `*[ DEPOSITO SAYA ]*\n\n${detail}\n\n` +
                    `Gunakan ${usedPrefix}depositoclaim untuk mencairkan deposito yang jatuh tempo.`
                );
            }

            if (command === "depositoclaim") {
                const matured = user.depositos.filter(
                    item => item.dueAt <= now
                );

                if (!matured.length) {
                    return reply(
                        "Belum ada deposito yang jatuh tempo."
                    );
                }

                const totalPrincipal = matured.reduce(
                    (total, item) => total + item.amount,
                    0
                );

                const totalInterest = matured.reduce(
                    (total, item) => total + getDepositInterest(item),
                    0
                );

                const claimedIds = new Set(
                    matured.map(item => item.id)
                );

                user.depositos = user.depositos.filter(
                    item => !claimedIds.has(item.id)
                );

                await save({
                    bank: bank + totalPrincipal + totalInterest,
                    depositos: user.depositos
                });

                return reply(
                    `*[ DEPOSITO BERHASIL DICAIRKAN ]*\n\n` +
                    `> Jumlah deposito: ${matured.length}\n` +
                    `> Modal: ${formatMoney(totalPrincipal)}\n` +
                    `> Bunga: ${formatMoney(totalInterest)}\n` +
                    `> Total diterima: ${formatMoney(totalPrincipal + totalInterest)}\n` +
                    `> Saldo bank sekarang: ${formatMoney(bank)}`
                );
            }

            if (command === "creditscore") {
                await applyOverdueCreditPenalty();

                return reply(
                    `*[ CREDIT SCORE ]*\n\n` +
                    `> Skor: ${creditScore}/850\n` +
                    `> Grade: ${getCreditGrade(creditScore)}\n\n` +
                    `*Kategori skor:*\n` +
                    `> 800–850: Excellent\n` +
                    `> 740–799: Very Good\n` +
                    `> 670–739: Good\n` +
                    `> 580–669: Fair\n` +
                    `> 450–579: Poor\n` +
                    `> 300–449: Very Poor\n\n` +
                    `Gunakan ${usedPrefix}creditreport untuk melihat riwayat skor.`
                );
            }

            if (command === "creditreport") {
                await applyOverdueCreditPenalty();

                const history = user.creditHistory
                    .slice(-10)
                    .reverse();

                const detail = history.length
                    ? history.map((item, index) => {
                        const change = item.change > 0
                            ? `+${item.change}`
                            : item.change;

                        return (
                            `${index + 1}. ${item.reason}\n` +
                            `> Perubahan: ${change}\n` +
                            `> Skor: ${item.score}\n` +
                            `> Tanggal: ${formatDate(item.date)}`
                        );
                    }).join("\n\n")
                    : "Belum ada riwayat perubahan credit score.";

                return reply(
                    `*[ CREDIT REPORT ]*\n\n` +
                    `> Skor sekarang: ${creditScore}/850\n` +
                    `> Grade: ${getCreditGrade(creditScore)}\n\n` +
                    `*Riwayat perubahan:*\n${detail}`
                );
            }

            if (command === "pinjam") {
                const amount = Number(args[0]);
                const term = Number(args[1]);

                if (!Number.isSafeInteger(amount) || amount < 1000) {
                    return reply(
                        `Minimal pinjaman Rp1.000.\n\n` +
                        `Contoh: ${usedPrefix}pinjam 10000 3`
                    );
                }

                if (![3, 6].includes(term)) {
                    return reply(
                        `*Pilihan tenor pinjaman:*\n\n` +
                        `> 3 hari: bunga 5% per hari\n` +
                        `> 6 hari: bunga 4% per hari\n\n` +
                        `Contoh: ${usedPrefix}pinjam 10000 3`
                    );
                }

                if (loan.active) {
                    return reply(
                        `Kamu masih memiliki pinjaman aktif!\n\n` +
                        `> Sisa hutang: ${formatMoney(getRemainingDebt(loan, now))}\n` +
                        `> Tagihan: ${formatMoney(getDueTotal(loan, now))}\n\n` +
                        `Lunasi pinjaman sebelumnya terlebih dahulu.`
                    );
                }

                const rate = term === 3 ? 5 : 4;
                const totalDebt = Math.ceil(
                    amount * (1 + rate * term / 100)
                );

                const installmentAmount = Math.floor(totalDebt / term);
                const installments = [];

                for (let i = 0; i < term; i++) {
                    installments.push({
                        amount: i === term - 1
                            ? totalDebt - installmentAmount * (term - 1)
                            : installmentAmount,
                        dueAt: now + (i + 1) * DAY,
                        paid: false,
                        paidAt: 0,
                        reminderSent: false,
                        overdueNoticeSent: false,
                        scoreApplied: false
                    });
                }

                loan = {
                    active: true,
                    principal: amount,
                    totalDebt,
                    remainingDebt: totalDebt,
                    termDays: term,
                    interestRate: rate,
                    startAt: now,
                    installments,
                    history: loan.history || []
                };

                loan.history.push({
                    type: "loan",
                    amount,
                    date: now
                });

                await save({
                    money: money + amount,
                    loan
                });

                return reply(
                    `*[ PINJAMAN BERHASIL ]*\n\n` +
                    `> Pinjaman: ${formatMoney(amount)}\n` +
                    `> Tenor: ${term} hari\n` +
                    `> Bunga: ${rate}% / hari\n` +
                    `> Total bunga: ${formatMoney(totalDebt - amount)}\n` +
                    `> Total pembayaran: ${formatMoney(totalDebt)}\n` +
                    `> Cicilan harian: ${formatMoney(installmentAmount)}\n\n` +
                    `Cicilan pertama jatuh tempo dalam 24 jam.\n` +
                    `Gunakan ${usedPrefix}hutang untuk melihat tagihan.`
                );
            }

            if (command === "hutang") {
                if (!loan.active) {
                    return reply("Kamu tidak memiliki pinjaman aktif.");
                }

                await applyOverdueCreditPenalty();

                const installments = getInstallments(loan);

                const detail = installments.map((item, index) => {
                    const status = item.paid
                        ? "LUNAS"
                        : now >= item.dueAt
                            ? `TERLAMBAT | Denda ${formatMoney(getLateFee(item, now))}`
                            : `Jatuh tempo ${formatDate(item.dueAt)}`;

                    return `${index + 1}. ${formatMoney(item.amount)}\n   ${status}`;
                }).join("\n");

                return reply(
                    `*[ INFORMASI PINJAMAN ]*\n\n` +
                    `> Pinjaman awal: ${formatMoney(loan.principal)}\n` +
                    `> Total hutang: ${formatMoney(loan.totalDebt)}\n` +
                    `> Sisa hutang: ${formatMoney(getRemainingDebt(loan, now))}\n` +
                    `> Tagihan sekarang: ${formatMoney(getDueTotal(loan, now))}\n` +
                    `> Status: ${getLoanStatus(loan)}\n` +
                    `> Credit Score: ${creditScore}/850\n\n` +
                    `*Daftar cicilan:*\n${detail}\n\n` +
                    `Gunakan ${usedPrefix}bayar untuk membayar tagihan.`
                );
            }

            if (command === "bayar") {
                if (!loan.active) {
                    return reply("Kamu tidak memiliki pinjaman aktif.");
                }

                const installments = getInstallments(loan);
                const dueInstallments = installments.filter(
                    item => !item.paid && item.dueAt <= now
                );

                if (!dueInstallments.length) {
                    return reply("Belum ada cicilan yang jatuh tempo.");
                }

                const dueAmount = getDueTotal(loan, now);

                if (money < dueAmount) {
                    return reply(
                        `Money kamu tidak cukup!\n\n` +
                        `> Wallet: ${formatMoney(money)}\n` +
                        `> Tagihan: ${formatMoney(dueAmount)}`
                    );
                }

                let scoreChange = 0;

                for (const item of dueInstallments) {
                    item.paid = true;
                    item.paidAt = now;

                    if (!item.scoreApplied) {
                        const late = now > item.dueAt;

                        scoreChange += addCreditHistory(
                            user,
                            late ? -10 : 5,
                            late ? "Pembayaran cicilan terlambat" : "Pembayaran cicilan tepat waktu",
                            now
                        );

                        item.scoreApplied = true;
                    }
                }

                loan.remainingDebt = getRemainingDebt(loan, now);

                const completed = installments.every(item => item.paid);

                loan.history.push({
                    type: "payment",
                    amount: dueAmount,
                    date: now
                });

                if (completed) {
                    loan.active = false;
                    loan.remainingDebt = 0;

                    loan.history.push({
                        type: "completed",
                        amount: 0,
                        date: now
                    });
                }

                await save({
                    money: money - dueAmount,
                    loan,
                    creditScore: user.creditScore,
                    creditHistory: user.creditHistory
                });

                return reply(
                    `*[ PEMBAYARAN BERHASIL ]*\n\n` +
                    `> Dibayar: ${formatMoney(dueAmount)}\n` +
                    `> Sisa hutang: ${formatMoney(loan.remainingDebt)}\n` +
                    `> Status: ${completed ? "LUNAS" : "Masih berjalan"}\n` +
                    `> Perubahan skor: ${scoreChange > 0 ? "+" : ""}${scoreChange}\n` +
                    `> Credit Score: ${creditScore}/850`
                );
            }

            if (command === "lunasi") {
                if (!loan.active) {
                    return reply("Kamu tidak memiliki pinjaman aktif.");
                }

                await applyOverdueCreditPenalty();

                const remaining = getRemainingDebt(loan, now);

                if (money < remaining) {
                    return reply(
                        `Money kamu tidak cukup!\n\n` +
                        `> Wallet: ${formatMoney(money)}\n` +
                        `> Total pelunasan: ${formatMoney(remaining)}`
                    );
                }

                let scoreChange = 0;

                loan.installments = getInstallments(loan).map(item => {
                    if (!item.paid && !item.scoreApplied) {
                        const late = now > item.dueAt;

                        scoreChange += addCreditHistory(
                            user,
                            late ? -10 : 5,
                            late ? "Pelunasan cicilan terlambat" : "Pelunasan lebih awal",
                            now
                        );

                        return {
                            ...item,
                            paid: true,
                            paidAt: now,
                            scoreApplied: true
                        };
                    }

                    return {
                        ...item,
                        paid: true,
                        paidAt: item.paidAt || now
                    };
                });

                loan.remainingDebt = 0;
                loan.active = false;

                loan.history.push({
                    type: "early_payment",
                    amount: remaining,
                    date: now
                });

                await save({
                    money: money - remaining,
                    loan,
                    creditScore: user.creditScore,
                    creditHistory: user.creditHistory
                });

                return reply(
                    `*[ PINJAMAN LUNAS ]*\n\n` +
                    `> Total pembayaran: ${formatMoney(remaining)}\n` +
                    `> Sisa hutang: Rp0\n` +
                    `> Perubahan skor: ${scoreChange > 0 ? "+" : ""}${scoreChange}\n` +
                    `> Credit Score: ${creditScore}/850\n\n` +
                    `Terima kasih telah menggunakan layanan bank!`
                );
            }

            if (command === "riwayatbank") {
                const history = loan.history || [];

                if (!history.length) {
                    return reply("Belum ada riwayat pinjaman.");
                }

                const detail = history.slice(-10).reverse().map(item => {
                    return (
                        `> ${item.type} | ${formatMoney(item.amount || 0)}\n` +
                        `  ${formatDate(item.date)}`
                    );
                }).join("\n\n");

                return reply(`*[ RIWAYAT BANK ]*\n\n${detail}`);
            }
        } catch (err) {
            console.error(err);
            return reply(settings?.mess?.error || err.message);
        }
    }
};