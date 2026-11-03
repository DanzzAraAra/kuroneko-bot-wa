import axios from "axios"

export default {
    name: ["ngl", "sendngl"],
    premium: true,

    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        try {
            const query = args.join(" ")

            if (!query.includes("|")) {
                await m.reply(`*Ex:* ${usedPrefix}${commandName} username_target | isi pesan\n*Example:* ${usedPrefix}${commandName} dandy | halo`)
                return false
            }

            const [targetId, ...textParts] = query.split("|")
            const id = targetId.trim()
            const text = textParts.join("|").trim()

            if (!id || !text) {
                await m.reply(`*Ex:* ${usedPrefix}${commandName} username_target | isi pesan`)
                return false
            }

            if (settings?.mess?.wait) await m.reply(settings.mess.wait)

            const apiUrl = `${settings.api}/api/tools/ngl?text=${encodeURIComponent(text)}&id=${encodeURIComponent(id)}&apikey=${settings.key}`
            const { data } = await axios.get(apiUrl)

            if (!data.status) {
                await m.reply("Gagal mengirim pesan NGL. Pastikan ID atau username valid")
                return false
            }

            const caption = [
                `*[ NGL MESSAGE SENT ]*`,
                ``,
                `> *Target ID:* ${id}`,
                `> *Message:* ${text}`,
                `> *Status:* Berhasil terkirim`
            ].join("\n")

            await sock.sendMessage(m.chat || m.from, {
                text: caption
            }, { quoted: m })
        } catch (err) {
            await m.reply(settings?.mess?.error || err.message)
            return false
        }
    }
}