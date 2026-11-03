import axios from "axios";
import { downloadContentFromMessage } from "baileys";
import { writeExif } from "../../src/sticker.js";
import { uploader } from "../../src/uploader.js";

export default {
    name: ["smeme"],
    limit: 2,
    premium: false,

    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        try {
            const quoted = m.quoted?.message || m.quoted?.msg;
            const mediaMessage = quoted?.imageMessage || quoted?.stickerMessage;
            const mediaType = quoted?.imageMessage ? "image" : quoted?.stickerMessage ? "sticker" : null;

            if (!mediaMessage) {
                await m.reply(`Reply gambar atau stiker dengan caption *${usedPrefix}${commandName} atas|bawah*`);
                return false;
            }

            const [atas = "", bawah = ""] = args.join(" ").split("|").map(v => v.trim());

            if (!atas && !bawah) {
                await m.reply(`*Ex:* ${usedPrefix}${commandName} atas|bawah`);
                return false;
            }

            if (settings?.mess?.wait) {
                await m.reply(settings.mess.wait);
            }

            const stream = await downloadContentFromMessage(mediaMessage, mediaType);
            const chunks = [];

            for await (const chunk of stream) {
                chunks.push(chunk);
            }

            const buffer = Buffer.concat(chunks);

            if (!buffer.length) {
                await m.reply("Gagal mengunduh media");
                return false;
            }

            const uploadedUrl = await uploader(buffer);
            const textAtas = encodeURIComponent(atas || "_");
            const textBawah = encodeURIComponent(bawah || "_");
            const memeUrl = `https://api.memegen.link/images/custom/${textAtas}/${textBawah}.png?background=${encodeURIComponent(uploadedUrl)}`;
            const { data } = await axios.get(memeUrl, {
                responseType: "arraybuffer",
                timeout: 30000
            });

            if (!data?.byteLength) {
                await m.reply("Gagal membuat meme");
                return false;
            }

            const sticker = await writeExif({
                mimetype: "image/png",
                data: Buffer.from(data),
                ext: "png"
            }, {
                packName: m.pushName || "Unknown",
                packPublish: settings?.botName || "KuroNeko"
            });

            await sock.sendMessage(m.chat || m.from, { sticker }, { quoted: m });
        } catch (err) {
            await m.reply(settings?.mess?.error || err.message);
            return false;
        }
    }
};