import axios from "axios";
import { writeExif } from "../../src/sticker.js";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

export default {
    name: ["brat"],
    limit: 1,
    premium: false,

    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        try {
            const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            let input = args.join(" ");

            if (!input && quoted) {
                input = quoted.conversation || quoted.extendedTextMessage?.text || "";
            }

            if (!input) {
                await m.reply(`Masukan teks atau reply teks dengan perintah *${usedPrefix}${commandName} <teks>*`);
                return false;
            }

            let textPart = input;
            let isAnimated = false;

            if (input.includes("|")) {
                const parts = input.split("|");
                textPart = parts[0].trim();

                if (parts[1]?.trim().toLowerCase() === "animasi") {
                    isAnimated = true;
                } else {
                    textPart = input;
                }
            }

            if (!textPart) {
                await m.reply("Teks tidak boleh kosong");
                return false;
            }

            if (settings?.mess?.wait) await m.reply(settings.mess.wait);

            if (isAnimated) {
                const words = textPart.split(" ").filter(Boolean);
                const files = [];
                const uniqueId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
                const tmpDir = path.join(os.tmpdir(), `brat_animated_${uniqueId}`);

                fs.mkdirSync(tmpDir, { recursive: true });

                try {
                    for (let i = 0; i < words.length; i++) {
                        const word = words.slice(0, i + 1).join(" ");
                        const url = `${settings.api}/api/maker/brat?text=${encodeURIComponent(word)}&apikey=${settings.key}`;
                        const media = (await axios.get(url, {
                            responseType: "arraybuffer",
                            timeout: 15000
                        })).data;

                        const file = path.join(tmpDir, `brat_${i}.mp4`);
                        fs.writeFileSync(file, media);
                        files.push(file);
                    }

                    const listFile = path.join(tmpDir, "cmd.txt");
                    let content = "";

                    for (const file of files) {
                        content += `file '${file.replace(/\\/g, "/")}'\nduration 0.5\n`;
                    }

                    content += `file '${files.at(-1).replace(/\\/g, "/")}'\nduration 3\n`;
                    fs.writeFileSync(listFile, content);

                    const output = path.join(tmpDir, `output_${uniqueId}.mp4`);

                    execSync(
                        `ffmpeg -y -f concat -safe 0 -i "${listFile.replace(/\\/g, "/")}" -vf "fps=30" -c:v libx264 -preset veryfast -pix_fmt yuv420p -t 00:00:10 "${output.replace(/\\/g, "/")}"`
                    );

                    const finalSticker = await writeExif({
                        mimetype: "video/mp4",
                        data: fs.readFileSync(output),
                        ext: "mp4"
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
                } finally {
                    fs.rmSync(tmpDir, { recursive: true, force: true });
                }
            } else {
                const url = `${settings.api}/api/maker/brat?text=${encodeURIComponent(textPart)}&apikey=${settings.key}`;
                const media = (await axios.get(url, {
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
            }
        } catch (err) {
            await m.reply(settings?.mess?.error || err.message);
            return false;
        }
    }
};