import axios from "axios"

export default {
    name: ["ytsum"],
    premium: true,

    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        const input = args.join(" ").trim()
        const match = input.match(/^(https?:\/\/\S+)(?:\s+([a-z]{2}))?$/i)

        if (!match) {
            return m.reply(`*Ex:* ${usedPrefix + commandName} https://youtu.be/VIDEO_ID id`)
        }

        const url = match[1]
        const lang = match[2] || "id"

        try {
            if (settings?.mess?.wait) await m.reply(settings.mess.wait)

            const { data } = await axios.get(
                `${settings.api}/api/tools/ytsum?url=${encodeURIComponent(url)}&lang=${lang}&apikey=${settings.key}`,
                { timeout: 60000 }
            )

            if (!data?.status || !data?.result?.content) {
                return m.reply("Gagal merangkum video YouTube")
            }

            const content = data.result.content
            const chunks = content.match(/[\s\S]{1,60000}/g) || []

            if (chunks.length === 1) return m.reply(content)

            for (let i = 0; i < chunks.length; i++) {
                await sock.sendMessage(m.from, {
                    document: Buffer.from(chunks[i]),
                    mimetype: "text/plain",
                    fileName: `ringkasan-youtube-${i + 1}.txt`,
                    caption: `Ringkasan YouTube bagian ${i + 1}/${chunks.length}`
                }, { quoted: m })
            }
        } catch (err) {
            return m.reply(settings?.mess?.error || err.message)
        }
    }
}