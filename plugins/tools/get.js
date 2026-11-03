import axios from "axios";

const USER_AGENT =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const mimeToExt = mime => {
    const map = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/gif": "gif",
        "image/webp": "webp",
        "image/avif": "avif",
        "video/mp4": "mp4",
        "video/webm": "webm",
        "audio/mpeg": "mp3",
        "audio/ogg": "ogg",
        "audio/mp4": "m4a",
        "audio/wav": "wav",
        "application/pdf": "pdf",
        "application/zip": "zip",
        "application/json": "json",
        "application/octet-stream": "bin",
        "text/html": "html",
        "text/plain": "txt",
        "text/css": "css",
        "text/javascript": "js",
        "application/javascript": "js",
        "application/xml": "xml",
        "text/xml": "xml"
    };

    return map[mime.split(";")[0].trim().toLowerCase()] || "bin";
};

const getMime = headers =>
    (headers["content-type"] || "application/octet-stream")
        .split(";")[0]
        .trim()
        .toLowerCase();

export default {
    name: ["get"],
    premium: true,
   //owner: true,
   
    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        const input = args.join(" ");
        const isRaw = /(?:^|\s)--raw(?:\s|$)/.test(input);
        const url = input.replace(/(?:^|\s)--raw(?=\s|$)/g, " ").trim();
        const chat = m.chat || m.from;

        if (!url || !/^https?:\/\/\S+$/i.test(url)) {
            await m.reply(
                `*Ex:*\n${usedPrefix}${commandName} https://example.com\n${usedPrefix}${commandName} https://example.com --raw`
            );
            return false;
        }

        let parsedUrl;

        try {
            parsedUrl = new URL(url);
        } catch {
            await m.reply("URL tidak valid.");
            return false;
        }

        if (!["http:", "https:"].includes(parsedUrl.protocol)) {
            await m.reply("Protokol URL tidak didukung.");
            return false;
        }

        const loading = await sock.sendMessage(
            chat,
            { text: settings.mess.wait},
            { quoted: m }
        );

        try {
            const res = await axios.get(parsedUrl.href, {
                responseType: "arraybuffer",
                timeout: 30000,
                maxContentLength: 20 * 1024 * 1024,
                maxBodyLength: 20 * 1024 * 1024,
                headers: {
                    "User-Agent": USER_AGENT,
                    "Accept": "text/html,application/json,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
                    "Accept-Language": "en-US,en;q=0.9,id;q=0.8",
                    "Cache-Control": "no-cache"
                }
            });

            const buffer = Buffer.from(res.data);
            const contentType = getMime(res.headers);
            const ext = mimeToExt(contentType);

            if (isRaw) {
                await sock.sendMessage(chat, {
                    document: buffer,
                    mimetype: contentType,
                    fileName: `raw.${ext}`,
                    caption: "*[🍁] Raw data berhasil diambil*"
                }, { quoted: m });

                await sock.sendMessage(chat, {
                    delete: loading.key
                }).catch(() => {});

                return true;
            }

            if (contentType === "text/html" || contentType === "application/xhtml+xml") {
                const html = buffer.toString("utf-8");

                await sock.sendMessage(chat, {
                    text: `\`\`\`html\n${html.slice(0, 60000)}\n\`\`\`${html.length > 60000 ? "\n\n[Output dipotong karena terlalu panjang. Gunakan --raw untuk mengunduh file.]" : ""}`,
                    edit: loading.key
                });

                return true;
            }

            if (contentType === "application/json" || contentType.endsWith("+json")) {
                const json = JSON.parse(buffer.toString("utf-8"));

                await sock.sendMessage(chat, {
                    text: `\`\`\`json\n${JSON.stringify(json, null, 2).slice(0, 60000)}\n\`\`\``,
                    edit: loading.key
                });

                return true;
            }

            if (contentType.startsWith("image/")) {
                await sock.sendMessage(chat, {
                    image: buffer,
                    caption: "*[🍁] Gambar berhasil diambil*"
                }, { quoted: m });
            } else if (contentType.startsWith("audio/")) {
                await sock.sendMessage(chat, {
                    audio: buffer,
                    mimetype: contentType
                }, { quoted: m });
            } else if (contentType.startsWith("video/")) {
                await sock.sendMessage(chat, {
                    video: buffer,
                    caption: "*[🍁] Video berhasil diambil*"
                }, { quoted: m });
            } else {
                await sock.sendMessage(chat, {
                    document: buffer,
                    mimetype: contentType,
                    fileName: `file.${ext}`,
                    caption: "*[🍁] Dokumen berhasil diambil*"
                }, { quoted: m });
            }

            await sock.sendMessage(chat, {
                delete: loading.key
            }).catch(() => {});

            return true;
        } catch (error) {
            const message = error.response?.status
                ? `HTTP ${error.response.status} ${error.response.statusText || ""}`.trim()
                : error.code === "ECONNABORTED"
                    ? "Request timeout."
                    : error.message || String(error);

            await sock.sendMessage(chat, {
                text: `[🍂] Gagal mengambil data dari link: ${message}`,
                edit: loading.key
            }).catch(() => {
                return m.reply(`[🍂] Gagal mengambil data dari link: ${message}`);
            });

            return false;
        }
    }
};