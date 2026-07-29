/*
   * Dandy
   * DO NOT FOR SALE!
   * Github: github.com/DanzzAraAra
*/
module.exports = async function albumMessage(sock, jid, medias, m, options = {}) {
    try {
        if (typeof jid !== "string") {
            throw new TypeError(`jid harus string, diterima: ${typeof jid}`);
        }
        if (!Array.isArray(medias) || medias.length < 2) {
            throw new RangeError(`Minimal 2 media diperlukan untuk album. Diterima: ${medias?.length || 0}`);
        }

        const { caption = "", mentions = [], quoted, ephemeralExpiration } = options;
        const albumContent = [];

        for (const media of medias) {
            if (media.type === "image") {
                albumContent.push({ image: media.data });
            } else if (media.type === "video") {
                albumContent.push({ video: media.data });
            }
        }

        if (albumContent.length < 2) {
            throw new RangeError(`Tidak cukup media yang valid (gambar/video) untuk membentuk album. Item valid: ${albumContent.length}`);
        }

        const messageContent = {
            text: caption,
            mentions: mentions,
            album: albumContent
        };

        const sendOptions = {
            quoted: m || quoted || null,
            ephemeralExpiration: ephemeralExpiration || null
        };

        const result = await sock.sendMessage(jid, messageContent, sendOptions);
        return result;

    } catch (error) {
        throw error;
    }
}