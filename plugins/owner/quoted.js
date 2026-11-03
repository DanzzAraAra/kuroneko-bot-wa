const wrappers = [
    "ephemeralMessage",
    "viewOnceMessage",
    "viewOnceMessageV2",
    "viewOnceMessageV2Extension",
    "documentWithCaptionMessage"
];

const parse = message => {
    while (message) {
        const key = wrappers.find(key => message[key]?.message);
        if (!key) break;
        message = message[key].message;
    }

    return message;
};

const getContext = message => {
    const data = parse(message);

    const find = obj => {
        if (!obj || typeof obj !== "object") return null;
        if (obj.contextInfo?.stanzaId) return obj.contextInfo;

        for (const value of Object.values(obj)) {
            const result = find(value);
            if (result) return result;
        }

        return null;
    };

    return find(data);
};

const getText = message => {
    const msg = parse(message);
    if (!msg) return "";

    return (
        msg.conversation ||
        msg.extendedTextMessage?.text ||
        msg.imageMessage?.caption ||
        msg.videoMessage?.caption ||
        msg.documentMessage?.caption ||
        ""
    );
};

export default {
    name: ["q"],
    owner: true,

    execute: async (sock, m, args, settings, commandName, prefix, store) => {
        if (!m.isOwner) return m.reply(settings.mess.owner);
        if (!m.quoted?.key?.id) return m.reply("Pesan tidak ditemukan");

        try {
            const quoted = await store?.loadMessage(m.from, m.quoted.key.id) || {
                key: m.quoted.key,
                message: m.quoted.message
            };

            const context = getContext(quoted.message);

            if (!context?.stanzaId) {
                return m.reply("stanzaId tidak ditemukan");
            }

            let target = await store?.loadMessage(m.from, context.stanzaId);

            if (!target?.message && context.quotedMessage) {
                target = {
                    key: {
                        remoteJid: m.from,
                        id: context.stanzaId,
                        fromMe: Boolean(context.fromMe),
                        participant: context.participant || "",
                        participantAlt: context.participantAlt || null
                    },
                    message: context.quotedMessage
                };
            }

            if (!target?.message) {
                return m.reply("Pesan tidak ditemukan di store");
            }

            const type = sock.getMediaType(target);
            const mediaInfo = sock.getMedia(target);
            const text = getText(target.message);

            if (!mediaInfo || !type) {
                return sock.sendMessage(
                    m.from,
                    { text: text || "Pesan kosong" },
                    { quoted: m }
                );
            }

            const buffer = await sock.downloadMedia(target);

            if (!buffer?.length) {
                throw new Error("Gagal mengunduh media");
            }

            let payload;

            if (type === "image") {
                payload = { image: buffer, caption: text };
            } else if (type === "video") {
                payload = { video: buffer, caption: text };
            } else if (type === "audio") {
                payload = {
                    audio: buffer,
                    mimetype: mediaInfo.media.mimetype,
                    ptt: Boolean(mediaInfo.media.ptt)
                };
            } else if (type === "sticker") {
                payload = { sticker: buffer };
            } else if (type === "document") {
                payload = {
                    document: buffer,
                    mimetype: mediaInfo.media.mimetype,
                    fileName: mediaInfo.media.fileName || "file"
                };
            } else {
                throw new Error("Tipe media tidak didukung");
            }

            return sock.sendMessage(m.from, payload, { quoted: m });
        } catch (err) {
            return m.reply(settings.mess.error || err.message);
        }
    }
};
