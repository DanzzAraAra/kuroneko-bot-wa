const axios = require('axios');

function mimeToExt(mime) {
  const map = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
    "video/mp4": "mp4",
    "audio/mpeg": "mp3",
    "audio/ogg": "ogg",
    "application/pdf": "pdf",
    "application/zip": "zip",
    "application/json": "json",
    "text/html": "html",
    "text/plain": "txt",
  };
  return map[mime] || "bin";
}

module.exports = {
  name: ['get'],
  limit: 2,
  premium: true,
  execute: async (sock, m, args, settings, commandName, usedPrefix) => {
    const text = args.join(' ');

    if (!text || !/^https?:\/\//.test(text)) {
      await m.reply(`*Example:* *${usedPrefix}${commandName}* https://example.com`);
      return false;
    }

    const isRaw = text.includes("--raw");
    const url = text.replace("--raw", "").trim();

    const loadingMessage = await sock.sendMessage(
      m.chat,
      { text: settings?.mess?.wait || "*Loading...*" },
      { quoted: m }
    );

    try {
      const res = await axios.get(url, {
        responseType: "arraybuffer",
        headers: {
          "User-Agent": "Mozilla/5.0 (Bot)",
        },
      });

      const contentType = res.headers["content-type"] || "";
      const ext = mimeToExt(contentType);
      const buffer = res.data;

      if (isRaw) {
        await sock.sendMessage(
          m.chat,
          {
            document: buffer,
            mimetype: contentType,
            fileName: `raw.${ext}`,
            caption: `*[🍁] Raw data berhasil diambil*`,
          },
          { quoted: m }
        );
      } else if (contentType.includes("text/html")) {
        const html = buffer.toString("utf-8");
        
        const finalHtml = "```html\n" + html + "\n```";

        await sock.sendMessage(
          m.chat,
          {
            text: finalHtml,
            edit: loadingMessage.key 
          }
        );
      } else if (contentType.includes("application/json")) {
        const json = JSON.parse(buffer.toString("utf-8"));
        const jsonString = JSON.stringify(json, null, 2);
        
        const finalJson = "```json\n" + jsonString + "\n```";

        await sock.sendMessage(
          m.chat,
          {
            text: finalJson,
            edit: loadingMessage.key 
          }
        );
      } else if (contentType.startsWith("image/")) {
        await sock.sendMessage(
          m.chat,
          { image: buffer, caption: `*[🍁] Gambar berhasil diambil*` },
          { quoted: m }
        );
      } else if (contentType.startsWith("audio/")) {
        await sock.sendMessage(
          m.chat,
          { audio: buffer, mimetype: contentType },
          { quoted: m }
        );
      } else if (contentType.startsWith("video/")) {
        await sock.sendMessage(
          m.chat,
          { video: buffer, caption: `*[🍁] Video berhasil diambil*` },
          { quoted: m }
        );
      } else {
        await sock.sendMessage(
          m.chat,
          {
            document: buffer,
            mimetype: contentType,
            fileName: `file.${ext}`,
            caption: `*[🍁] Dokumen berhasil diambil*`,
          },
          { quoted: m }
        );
      }
    } catch (e) {
      console.error(e);
      const errorMessage = e.message || e.toString();
      
      await sock.sendMessage(
        m.chat,
        { 
          text: `[🍂] Gagal mengambil data dari link: ${errorMessage}`,
          edit: loadingMessage.key 
        }
      );
      return false;
    }
  }
};
