import { downloadContentFromMessage } from "baileys";
import { writeExif } from "../../src/sticker.js";

export default {
    name: ["swm", "wm"],
    limit: 1,
    premium: false,

    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        try {
            const quote = m.quoted;

            if (!quote) {
                await m.reply(`Reply sticker dengan caption *${usedPrefix}${commandName}* PackName PackPublish`);
                return false;
            }

            const msgType = quote.type || quote.mtype;
            const mediaMessage = quote.msg || quote.message?.stickerMessage;

            if (msgType !== "stickerMessage" && !mediaMessage?.mimetype?.includes("webp")) {
                await m.reply("Reply sticker yang ingin diubah");
                return false;
            }

            if (settings?.mess?.wait) {
                await m.reply(settings.mess.wait);
            }

            const text = args.join(" ").trim();
            const [packName, ...publish] = text.split(/\s+/);
            const packPublish = publish.join(" ");

            if (!packName || !packPublish) {
                await m.reply(`*Ex:* ${usedPrefix}${commandName} KuroNeko Dandy`
                );
                return false;
            }

            let buffer;

            if (typeof quote.download === "function") {
                buffer = await quote.download();
            } else {
                const stream = await downloadContentFromMessage(
                    mediaMessage,
                    "sticker"
                );

                const chunks = [];

                for await (const chunk of stream) {
                    chunks.push(chunk);
                }

                buffer = Buffer.concat(chunks);
            }

            if (!buffer?.length) {
                await m.reply("Gagal mengunduh sticker.");
                return false;
            }

            const sticker = await writeExif({
                mimetype: "image/webp",
                data: buffer,
                ext: "webp"
            }, {
                packName,
                packPublish
            });

            await sock.sendMessage(m.chat || m.from, {
                sticker
            }, {
                quoted: m
            });
        } catch (err) {
            await m.reply(settings?.mess?.error || err.message);
            return false;
        }
    }
};