const axios = require('axios');
const { writeExif } = require('../../src/sticker.js');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

module.exports = {
    name: ['brat'],
    limit: 1,
    premium: false,
    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        try {
            const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            let input = args.join(' ');
            
            if (!input && quoted) {
                input = quoted.conversation || quoted.extendedTextMessage?.text || '';
            }

            if (!input) {
                await m.reply(`Masukan teks atau reply teks dengan perintah *${usedPrefix}${commandName} <teks>*`);
                return false;
            }

            let textPart = input;
            let isAnimated = false;

            if (input.includes('|')) {
                const parts = input.split('|');
                textPart = parts[0].trim();
                const option = parts[1] ? parts[1].trim().toLowerCase() : '';
                
                if (option === 'animasi') {
                    isAnimated = true;
                } else {
                    textPart = input; 
                }
            }

            if (!textPart) {
                await m.reply('Teks tidak boleh kosong.');
                return false;
            }

            if (settings?.mess?.wait) await m.reply(settings.mess.wait);

            if (isAnimated) {
                let txt = textPart.split(' ').filter(v => v);
                let array = [];
                const uniqueId = Date.now() + "_" + Math.random().toString(36).substring(2, 8);
                let tmpDirBase = path.join(os.tmpdir(), `brat_animated_${uniqueId}`);

                fs.mkdirSync(tmpDirBase, { recursive: true });

                try {
                    for (let i = 0; i < txt.length; i++) {
                        let word = txt.slice(0, i + 1).join(" ");
                        let media = (
                            await axios.get(
                                `${settings.api}/api/maker/brat?text=${encodeURIComponent(word)}&apikey=${settings.key}`,
                                { responseType: "arraybuffer", timeout: 15000 }
                            )
                        ).data;
                        let tmpFilePath = path.join(tmpDirBase, `brat_${i}.mp4`);
                        fs.writeFileSync(tmpFilePath, media);
                        array.push(tmpFilePath);
                    }

                    let fileTxt = path.join(tmpDirBase, `cmd.txt`);
                    let content = "";
                    for (let i = 0; i < array.length; i++) {
                        content += `file '${array[i].replace(/\\/g, "/")}'\n`;
                        content += `duration 0.5\n`;
                    }
                    content += `file '${array[array.length - 1].replace(/\\/g, "/")}'\n`;
                    content += `duration 3\n`;
                    fs.writeFileSync(fileTxt, content);

                    let output = path.join(tmpDirBase, `output_${uniqueId}.mp4`);
                    execSync(
                        `ffmpeg -y -f concat -safe 0 -i "${fileTxt.replace(/\\/g, "/")}" -vf "fps=30" -c:v libx264 -preset veryfast -pix_fmt yuv420p -t 00:00:10 "${output.replace(/\\/g, "/")}"`
                    );

                    const finalSticker = await writeExif(
                        {
                            mimetype: "video",
                            data: fs.readFileSync(output),
                        },
                        {
                            packName: settings.botName,
                            packPublish: settings.ownerName,
                        }
                    );

                    await sock.sendMessage(m.chat, { sticker: finalSticker }, { quoted: m });
                } catch (err) {
                    console.error(err);
                    await m.reply(settings.mess.error);
                    return false;
                } finally {
                    fs.rmSync(tmpDirBase, { recursive: true, force: true });
                }
            } else {
                try {
                    let media = (
                        await axios.get(
                            `${settings.api}/api/maker/brat?text=${encodeURIComponent(textPart)}&apikey=${settings.key}`,
                            { responseType: "arraybuffer", timeout: 15000 }
                        )
                    ).data;

                    const finalSticker = await writeExif(
                        {
                            mimetype: "image",
                            data: media,
                        },
                        {
                            packName: settings.botName,
                            packPublish: settings.ownerName,
                        }
                    );

                    await sock.sendMessage(m.chat, { sticker: finalSticker }, { quoted: m });
                } catch (err) {
                    console.error(err);
                    await m.reply(settings.mess.error);
                    return false;
                }
            }
        } catch (error) {
            console.error(error);
            await m.reply(settings.mess.error);
            return false;
        }
    }
};