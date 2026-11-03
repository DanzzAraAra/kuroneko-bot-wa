import axios from "axios";
import { writeExif } from "../../src/sticker.js";

export default {
    name: ["emojimix"],
    limit: 1,
    premium: false,

    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        try {
            let input = args.join("").replace(/[\s+]/g, "");
            const emojis = [...input];

            if (emojis.length < 2) {
                await m.reply(`*Ex:* ${usedPrefix}${commandName} 🫩 🥱 or 🫩+🥱`);
                return false;
            }

            const emoji1 = emojis[0];
            const emoji2 = emojis[1];

            if (settings?.mess?.wait) await m.reply(settings.mess.wait);

            const apiUrl = `${settings.api}/api/maker/emojikitchen?emoji1=${encodeURIComponent(emoji1)}&emoji2=${encodeURIComponent(emoji2)}&apikey=${settings.key}`;
            const { data } = await axios.get(apiUrl);

            if (!data?.status || !data?.result?.image) {
                await m.reply("Gagal menggabungkan emoji");
                return false;
            }

            const imageUrl = data.result.image;
            const media = (await axios.get(imageUrl, {
                responseType: "arraybuffer",
                timeout: 15000
            })).data;

            const finalSticker = await writeExif({
                mimetype: "image/png",
                data: media,
                ext: "png"
            }, {
                packName: m.pushName || "Unknown",
                packPublish: settings?.botName || "KuroNeko"
            });

            await sock.sendMessage(m.chat || m.from, {
                sticker: finalSticker
            }, { quoted: m });

        } catch (err) {
            await m.reply(settings?.mess?.error || err.message);
            return false;
        }
    }
};