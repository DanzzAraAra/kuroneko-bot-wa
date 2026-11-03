export default {
    name: ["cekidch"],
    limit: 1,
    premium: false,

    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        try {
            const url = args[0] || m.quoted?.text || "";
            const match = url.match(/(?:https?:\/\/)?(?:www\.)?whatsapp\.com\/channel\/([A-Za-z0-9]+)/i);

            if (!match) {
                return m.reply(`*Ex:* ${usedPrefix + commandName} https://whatsapp.com/channel/xxxxx`);
            }

            const metadata = await sock.newsletterMetadata("invite", match[1]);

            if (!metadata?.id) {
                return m.reply("Metadata channel tidak ditemukan.");
            }

            const channel = await sock.newsletterMetadata("jid", metadata.id);

            if (!channel) {
                return m.reply("Gagal mengambil metadata channel.");
            }

            const formatTime = value => {
                if (!value) return "-";
                return new Date(Number(value) * 1000).toLocaleString("id-ID", {
                    dateStyle: "long",
                    timeStyle: "short"
                });
            };

            return m.reply(
                `*[ WHATSAPP CHANNEL INFO ]*\n\n` +
                `> *Nama:* ${channel.name || "-"}\n` +
                `> *ID:* ${channel.id || metadata.id}\n` +
                `> *Deskripsi:* ${channel.description || "-"}\n` +
                `> *Pengikut:* ${channel.subscribers ?? "-"}\n` +
                `> *Verifikasi:* ${channel.verification || "-"}\n` +
                `> *Status:* ${channel.state?.type || "-"}\n` +
                `> *Dibuat:* ${formatTime(channel.creation_time)}`
            );
        } catch (err) {
            return m.reply(settings?.mess?.error || err.message);
        }
    }
};