import { createHash } from "node:crypto";
import { proto, getBinaryNodeChild } from "baileys";

export default {
    name: ["vote"],
    limit: 1,
    premium: false,

    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        try {
            const url = args[0] || "";
            const option = Number(args[1]);

            const match = url.match(
                /channel\/([A-Za-z0-9+/=_-]+)\/(\d+)/i
            );

            if (!match || !Number.isInteger(option) || option < 1) {
                return m.reply(
                    `*Contoh:*\n${usedPrefix + commandName} https://whatsapp.com/channel/0029VbBQG1n3QxRsqN7XkS06/1128 2`
                );
            }

            const [, inviteCode, serverId] = match;

            await m.reply("Sedang membaca polling channel...");

            const metadata = await sock.newsletterMetadata(
                "invite",
                inviteCode
            );

            const jid = metadata?.id || metadata?.jid;

            if (!jid) throw new Error("Channel tidak ditemukan.");

            const fetched = await sock.newsletterFetchMessages(
                jid,
                30,
                0,
                0
            );

            const container =
                getBinaryNodeChild(fetched, "messages") || fetched;

            const nodes = container?.content || [];
            let poll;

            for (const node of nodes) {
                const id = node?.attrs?.server_id || node?.attrs?.id;

                if (String(id) !== serverId) continue;

                const payload = getBinaryNodeChild(node, "payload");

                if (!payload?.content) continue;

                const decoded = proto.Message.decode(
                    Buffer.from(String(payload.content), "base64")
                );

                const creation =
                    decoded.pollCreationMessage ||
                    decoded.pollCreationMessageV2 ||
                    decoded.pollCreationMessageV3;

                if (creation?.options?.length) {
                    poll = creation;
                    break;
                }
            }

            if (!poll) throw new Error("Polling tidak ditemukan.");

            const selected = poll.options[option - 1];

            if (!selected) {
                throw new Error(
                    `Pilihan tidak tersedia. Poll hanya memiliki ${poll.options.length} opsi.`
                );
            }

            if (typeof sock.newsletterVotePoll !== "function") {
                throw new Error(
                    "Method newsletterVotePoll belum tersedia pada Baileys yang digunakan."
                );
            }

            const hash = createHash("sha256")
                .update(Buffer.from(selected.name))
                .digest();

            await sock.newsletterVotePoll(
                jid,
                serverId,
                [hash]
            );

            return m.reply(
                `Berhasil mengirim vote!\n\n` +
                `> Poll: ${poll.name || "-"}\n` +
                `> Pilihan: ${option}. ${selected.name}`
            );
        } catch (err) {
            return m.reply(settings?.mess?.error || err.message);
        }
    }
};