import axios from "axios";

export default {
    name: ["ba"],
    limit: 1,
    premium: false,

    execute: async (sock, m, args, settings) => {
        try {
            if (settings?.mess?.wait) await m.reply(settings.mess.wait);
            
            const { data } = await axios.get(
                `${settings.api}/api/random/bluearchive?apikey=${settings.key}`,
                { responseType: "arraybuffer" }
            );
            
            await sock.sendMessage(m.chat || m.from, {
                image: Buffer.from(data)
            }, { quoted: m });
        } catch (err) {
            await m.reply(settings?.mess?.error || err.message);
        }
    }
};