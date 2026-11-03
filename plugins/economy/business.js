import { updateUser } from "../../src/database.js";

const HOUR = 60 * 60 * 1000;
const MAX_OFFLINE = 7 * 24 * HOUR;
const MAX_BUSINESSES = 5;
const MAX_LEVEL = 10;

const BUSINESS_TYPES = {
    kopi: { name: "Warung Kopi", price: 100000, income: 5000 },
    laundry: { name: "Laundry", price: 250000, income: 12000 },
    restoran: { name: "Restoran", price: 500000, income: 25000 },
    hotel: { name: "Hotel", price: 2000000, income: 100000 },
    perusahaan: { name: "Perusahaan", price: 5000000, income: 250000 }
};

const formatMoney = amount =>
    `Rp${Math.floor(Number(amount) || 0).toLocaleString("id-ID")}`;

const getBusinesses = user =>
    Array.isArray(user?.businesses) ? user.businesses : [];

const getIncome = business => {
    const type = BUSINESS_TYPES[business.type];
    if (!type) return 0;

    return Math.floor(
        type.income * (1 + ((Number(business.level) || 1) - 1) * 0.5)
    );
};

const getAccrued = (business, now) => {
    const lastCollectAt = Number(business.lastCollectAt) || now;
    const elapsed = Math.min(Math.max(0, now - lastCollectAt), MAX_OFFLINE);

    return Math.floor(elapsed / HOUR) * getIncome(business);
};

const getUpgradeCost = business => {
    const type = BUSINESS_TYPES[business.type];
    return type ? Math.floor(type.price * business.level * 0.5) : 0;
};

const getBusinessValue = business => {
    const type = BUSINESS_TYPES[business.type];
    if (!type) return 0;

    let value = type.price;

    for (let level = 1; level < business.level; level++) {
        value += Math.floor(type.price * level * 0.5);
    }

    return value;
};

export default {
    name: [
        "business",
        "buybusiness",
        "mybusiness",
        "upgradebusiness",
        "collectbusiness",
        "sellbusiness",
        "businesslb",
        "withdrawbusiness"
    ],

    limit: 0,

    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        try {
            const sender = m.userId || m.sender;
            const userId = global.db.users[sender]
                ? sender
                : Object.keys(global.db.users).find(id =>
                    id === sender ||
                    id.replace(/:\d+@/, "@") === sender?.replace(/:\d+@/, "@")
                );

            const user = global.db.users[userId];

            if (!user) return m.reply("Data pengguna tidak ditemukan.");

            user.businesses = getBusinesses(user);

            const businesses = user.businesses;
            const now = Date.now();
            const command = commandName.toLowerCase();

            const save = async data => {
                await updateUser(userId, data);
                Object.assign(user, data);
            };

            const findBusiness = id =>
                businesses.find(item =>
                    String(item.id).toLowerCase() === String(id || "").toLowerCase()
                );

            if (command === "business") {
                const catalog = Object.entries(BUSINESS_TYPES)
                    .map(([id, item]) =>
                        `*${item.name}* (${id})\n` +
                        `> Harga: ${formatMoney(item.price)}\n` +
                        `> Pendapatan: ${formatMoney(item.income)}/jam`
                    ).join("\n\n");

                return m.reply(
                    `*[ BUSINESS CENTER ]*\n\n${catalog}\n\n` +
                    `> Maksimal bisnis: ${MAX_BUSINESSES}\n` +
                    `> Maksimal level: ${MAX_LEVEL}\n` +
                    `> Pendapatan offline: 7 hari\n\n` +
                    `*Perintah bisnis:*\n` +
                    `> ${usedPrefix}buybusiness kopi\n` +
                    `> ${usedPrefix}mybusiness\n` +
                    `> ${usedPrefix}upgradebusiness ID\n` +
                    `> ${usedPrefix}collectbusiness\n` +
                    `> ${usedPrefix}withdrawbusiness ID jumlah\n` +
                    `> ${usedPrefix}sellbusiness ID\n` +
                    `> ${usedPrefix}businesslb`
                );
            }

            if (command === "buybusiness") {
                const typeId = String(args[0] || "").toLowerCase();
                const type = BUSINESS_TYPES[typeId];

                if (!type) {
                    return m.reply(`Jenis bisnis tidak ditemukan. Gunakan ${usedPrefix}business.`);
                }

                if (businesses.length >= MAX_BUSINESSES) {
                    return m.reply(`Maksimal ${MAX_BUSINESSES} bisnis.`);
                }

                const money = Number(user.money) || 0;

                if (money < type.price) {
                    return m.reply(
                        `Money tidak cukup!\n> Wallet: ${formatMoney(money)}\n` +
                        `> Harga: ${formatMoney(type.price)}`
                    );
                }

                const business = {
                    id: `B${now.toString(36).toUpperCase()}`,
                    type: typeId,
                    name: type.name,
                    level: 1,
                    lastCollectAt: now,
                    totalEarned: 0,
                    balance: 0
                };

                businesses.push(business);

                await save({
                    money: money - type.price,
                    businesses
                });

                return m.reply(
                    `*[ PEMBELIAN BISNIS BERHASIL ]*\n\n` +
                    `> Bisnis: ${type.name}\n` +
                    `> ID: ${business.id}\n` +
                    `> Modal: ${formatMoney(type.price)}\n` +
                    `> Pendapatan: ${formatMoney(type.income)}/jam\n` +
                    `> Kas bisnis: ${formatMoney(0)}`
                );
            }

            if (command === "mybusiness") {
                if (!businesses.length) {
                    return m.reply(`Kamu belum memiliki bisnis. Gunakan ${usedPrefix}business.`);
                }

                const detail = businesses.map((item, index) =>
                    `${index + 1}. *${item.name}*\n` +
                    `> ID: ${item.id}\n` +
                    `> Level: ${item.level}/${MAX_LEVEL}\n` +
                    `> Pendapatan: ${formatMoney(getIncome(item))}/jam\n` +
                    `> Belum dikumpulkan: ${formatMoney(getAccrued(item, now))}\n` +
                    `> Kas bisnis: ${formatMoney(item.balance)}\n` +
                    `> Total pendapatan: ${formatMoney(item.totalEarned)}`
                ).join("\n\n");

                const totalValue = businesses.reduce(
                    (total, item) => total + getBusinessValue(item),
                    0
                );

                return m.reply(
                    `*[ BISNIS SAYA ]*\n\n${detail}\n\n` +
                    `> Jumlah bisnis: ${businesses.length}/${MAX_BUSINESSES}\n` +
                    `> Nilai bisnis: ${formatMoney(totalValue)}`
                );
            }

            if (command === "upgradebusiness") {
                const business = findBusiness(args[0]);

                if (!business) return m.reply("ID bisnis tidak ditemukan.");
                if (business.level >= MAX_LEVEL) return m.reply("Level bisnis sudah maksimal.");

                const cost = getUpgradeCost(business);
                const money = Number(user.money) || 0;

                if (money < cost) {
                    return m.reply(
                        `Money tidak cukup!\n> Wallet: ${formatMoney(money)}\n` +
                        `> Biaya upgrade: ${formatMoney(cost)}`
                    );
                }

                const oldIncome = getIncome(business);
                business.level += 1;

                await save({
                    money: money - cost,
                    businesses
                });

                return m.reply(
                    `*[ UPGRADE BERHASIL ]*\n\n` +
                    `> Bisnis: ${business.name}\n` +
                    `> Level: ${business.level - 1} → ${business.level}\n` +
                    `> Biaya: ${formatMoney(cost)}\n` +
                    `> Pendapatan: ${formatMoney(oldIncome)} → ${formatMoney(getIncome(business))}/jam`
                );
            }

            if (command === "collectbusiness") {
                if (!businesses.length) return m.reply("Kamu belum memiliki bisnis.");

                let total = 0;

                for (const business of businesses) {
                    const income = getAccrued(business, now);

                    total += income;
                    business.balance = (Number(business.balance) || 0) + income;
                    business.totalEarned = (Number(business.totalEarned) || 0) + income;
                    business.lastCollectAt = now;
                }

                if (total < 1) {
                    return m.reply("Belum ada pendapatan yang bisa dikumpulkan. Pendapatan dihitung setiap 1 jam.");
                }

                await save({ businesses });

                return m.reply(
                    `*[ PENDAPATAN BISNIS DIKUMPULKAN ]*\n\n` +
                    `> Total masuk kas: ${formatMoney(total)}\n` +
                    businesses.map(item =>
                        `> ${item.name}: ${formatMoney(item.balance)}`
                    ).join("\n")
                );
            }

            if (command === "withdrawbusiness") {
                const business = findBusiness(args[0]);
                const amount = Math.floor(Number(args[1]));

                if (!business) return m.reply("ID bisnis tidak ditemukan.");

                if (!Number.isFinite(amount) || amount < 1) {
                    return m.reply(`Contoh: ${usedPrefix}withdrawbusiness ${business.id} 50000`);
                }

                const balance = Number(business.balance) || 0;

                if (balance < amount) {
                    return m.reply(
                        `Kas bisnis tidak cukup!\n> Kas: ${formatMoney(balance)}\n` +
                        `> Penarikan: ${formatMoney(amount)}`
                    );
                }

                business.balance -= amount;

                await save({
                    money: (Number(user.money) || 0) + amount,
                    businesses
                });

                return m.reply(
                    `*[ PENARIKAN BERHASIL ]*\n\n` +
                    `> Bisnis: ${business.name}\n` +
                    `> Diterima: ${formatMoney(amount)}\n` +
                    `> Sisa kas: ${formatMoney(business.balance)}`
                );
            }

            if (command === "sellbusiness") {
                const index = businesses.findIndex(item =>
                    String(item.id).toLowerCase() === String(args[0] || "").toLowerCase()
                );

                if (index === -1) return m.reply("ID bisnis tidak ditemukan.");

                const business = businesses[index];
                const pendingIncome = getAccrued(business, now);
                const refund = Math.floor(getBusinessValue(business) * 0.6);
                const total = pendingIncome + refund + (Number(business.balance) || 0);

                businesses.splice(index, 1);

                await save({
                    money: (Number(user.money) || 0) + total,
                    businesses
                });

                return m.reply(
                    `*[ BISNIS BERHASIL DIJUAL ]*\n\n` +
                    `> Bisnis: ${business.name}\n` +
                    `> Harga jual: ${formatMoney(refund)}\n` +
                    `> Pendapatan belum dikumpulkan: ${formatMoney(pendingIncome)}\n` +
                    `> Sisa kas: ${formatMoney(business.balance)}\n` +
                    `> Total diterima: ${formatMoney(total)}`
                );
            }

            if (command === "businesslb") {
                const ranking = Object.entries(global.db.users)
                    .map(([jid, item]) => {
                        const owned = getBusinesses(item).filter(business =>
                            BUSINESS_TYPES[business.type]
                        );

                        return {
                            name: item.username || item.name || jid,
                            count: owned.length,
                            value: owned.reduce(
                                (total, business) => total + getBusinessValue(business),
                                0
                            )
                        };
                    })
                    .filter(item => item.count > 0)
                    .sort((a, b) => b.value - a.value)
                    .slice(0, 10);

                if (!ranking.length) return m.reply("Belum ada user yang memiliki bisnis.");

                const detail = ranking.map((item, index) =>
                    `${index + 1}. *${item.name}*\n` +
                    `> Bisnis: ${item.count}\n` +
                    `> Nilai: ${formatMoney(item.value)}`
                ).join("\n\n");

                return m.reply(`*[ TOP 10 PENGUSAHA ]*\n\n${detail}`);
            }
        } catch (err) {
            console.error(err);
            return m.reply(settings?.mess?.error || err.message);
        }
    }
};