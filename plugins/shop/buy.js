import {
    proto,
    generateWAMessageFromContent
} from "baileys";
import { updateUser } from "../../src/database.js";

const limitPackages = [
    { amount: 100, price: 2000 },
    { amount: 500, price: 5000 },
    { amount: 1000, price: 9000 },
    { amount: 5000, price: 35000 }
];

const premiumPackages = [
    { days: 7, price: 5000 },
    { days: 30, price: 15000 },
    { days: 90, price: 35000 },
    { days: 365, price: 100000 }
];

const formatMoney = amount =>
    `Rp${amount.toLocaleString("id-ID")}`;

const getOwnerUrl = settings => {
    const number = Array.isArray(settings.ownerNumber)
        ? settings.ownerNumber[0]
        : settings.ownerNumber;

    const owner = number?.split("@")[0]?.replace(/\D/g, "");

    return owner ? `https://wa.me/${owner}` : "";
};

export default {
    name: ["buy"],

    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        try {
            const userId = m.userId || m.sender;
            const user = global.db.users?.[userId];

            if (!user) {
                return m.reply("Data akun kamu tidak ditemukan.");
            }

            const type = args[0]?.toLowerCase();

            if (type === "limit" || type === "premium") {
                const manual = args[1]?.toLowerCase() === "manual";
                const value = Number(args[manual ? 2 : 1]);

                if (!value || !Number.isInteger(value)) {
                    return m.reply(
                        type === "limit"
                            ? `*Ex:* ${usedPrefix}buy limit 100\nManual: ${usedPrefix}buy limit manual 100`
                            : `*Ex:* ${usedPrefix}buy premium 7\nManual: ${usedPrefix}buy premium manual 7`
                    );
                }

                const item = type === "limit"
                    ? limitPackages.find(pkg => pkg.amount === value)
                    : premiumPackages.find(pkg => pkg.days === value);

                if (!item) {
                    return m.reply(
                        `Paket tidak tersedia. Silakan cek daftar harga di ${usedPrefix}buy.`
                    );
                }

                const product = type === "limit"
                    ? `+${item.amount.toLocaleString("id-ID")} Limit`
                    : `Premium ${item.days} Hari`;

                if (manual) {
                    const ownerUrl = getOwnerUrl(settings);

                    if (!ownerUrl) {
                        return m.reply("Nomor owner belum dikonfigurasi.");
                    }

                    const message = [
                        "Halo Owner, saya ingin membeli:",
                        `Produk: ${product}`,
                        `Harga: ${formatMoney(item.price)}`,
                        `Pembeli: ${user.username || user.name || "Unknown"}`,
                        `Nomor: ${userId.split("@")[0]}`
                    ].join("\n");

                    return sock.sendMessage(m.from, {
                        text:
                            `*[ PESANAN MANUAL ]*\n\n` +
                            `> Produk: ${product}\n` +
                            `> Harga: ${formatMoney(item.price)}\n\n` +
                            `> Silakan hubungi owner untuk menyelesaikan pembayaran.\n\n` +
                            `${ownerUrl}?text=${encodeURIComponent(message)}`
                    }, { quoted: m });
                }

                const money = Number(user.money) || 0;

                if (money < item.price) {
                    return m.reply(
                        `*[ Money kamu tidak cukup! ]*\n\n` +
                        `> Harga: ${formatMoney(item.price)}\n` +
                        `> Saldo: ${formatMoney(money)}\n` +
                        `> Kekurangan: ${formatMoney(item.price - money)}`
                    );
                }

                const data = {
                    money: money - item.price
                };

                if (type === "limit") {
                    data.limit = (Number(user.limit) || 0) + item.amount;
                } else {
                    const now = Date.now();
                    const currentTime = Number(user.premiumTime) || 0;
                    const startTime = Math.max(now, currentTime);

                    data.premium = true;
                    data.premiumTime = startTime + item.days * 86400000;
                }

                await updateUser(userId, data);

                return m.reply(
                    `*[ PEMBELIAN BERHASIL! ]*\n\n` +
                    `> Produk: ${product}\n` +
                    `> Harga: ${formatMoney(item.price)}\n` +
                    `> Sisa Money: ${formatMoney(data.money)}\n\n` +
                    `${type === "limit"
                        ? `> Limit sekarang: ${data.limit.toLocaleString("id-ID")}`
                        : `> Premium aktif sampai: ${new Date(data.premiumTime).toLocaleString("id-ID")}`}`
                );
            }

            const ownerUrl = getOwnerUrl(settings);

            const format = items => items
                .map(([name, price]) => `• ${name}: ${formatMoney(price)}`)
                .join("\n");

            const limit = limitPackages.map(pkg => [
                `+${pkg.amount.toLocaleString("id-ID")} Limit`,
                pkg.price
            ]);

            const premium = premiumPackages.map(pkg => [
                `${pkg.days} Hari`,
                pkg.price
            ]);

            const buttons = [];

            if (ownerUrl) {
                buttons.push(
                    proto.Message.InteractiveMessage.NativeFlowMessage.NativeFlowButton.create({
                        name: "cta_url",
                        buttonParamsJson: JSON.stringify({
                            display_text: "Contact Owner",
                            url: ownerUrl,
                            merchant_url: ownerUrl
                        })
                    })
                );
            }

            const interactiveMessage = proto.Message.InteractiveMessage.create({
                header: proto.Message.InteractiveMessage.Header.create({
                    title: `[ ${settings.botName} STORE ]`,
                    hasMediaAttachment: false
                }),
                body: proto.Message.InteractiveMessage.Body.create({
                    text: `
*PAKET LIMIT*

${format(limit)}

*PAKET PREMIUM*

${format(premium)}

*[ CARA PEMBELIAN ]*

*Otomatis menggunakan Money*
• ${usedPrefix}buy limit 100
• ${usedPrefix}buy premium 7

*Manual melalui Owner*
• ${usedPrefix}buy limit manual 100
• ${usedPrefix}buy premium manual 7

*[ INFORMASI ]*

• 1 Money = Rp1
• Limit langsung ditambahkan setelah pembelian otomatis
• Premium menambah masa aktif sebelumnya jika masih aktif
• Pembelian manual diproses oleh owner
`
                }),
                footer: proto.Message.InteractiveMessage.Footer.create({
                    text: settings.botName
                }),
                nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                    buttons,
                    messageParamsJson: "{}",
                    messageVersion: 1
                })
            });

            const message = generateWAMessageFromContent(
                m.from,
                { interactiveMessage },
                { userJid: sock.user.id }
            );

            const bizNode = {
                tag: "biz",
                attrs: {
                    actual_actors: "2",
                    host_storage: "2",
                    privacy_mode_ts: (
                        Math.floor(Date.now() / 1000) - 77980457
                    ).toString()
                },
                content: [
                    {
                        tag: "interactive",
                        attrs: {
                            type: "native_flow",
                            v: "1"
                        },
                        content: [
                            {
                                tag: "native_flow",
                                attrs: {
                                    v: "9",
                                    name: "mixed"
                                }
                            }
                        ]
                    },
                    {
                        tag: "quality_control",
                        attrs: {
                            source_type: "third_party"
                        }
                    }
                ]
            };

            const additionalNodes = m.from.endsWith("@g.us")
                ? [bizNode]
                : [
                    { tag: "bot", attrs: { biz_bot: "1" } },
                    bizNode
                ];

            return sock.relayMessage(m.from, message.message, {
                messageId: message.key.id,
                additionalNodes
            });
        } catch (err) {
            return m.reply(settings?.mess?.error || err.message);
        }
    }
};