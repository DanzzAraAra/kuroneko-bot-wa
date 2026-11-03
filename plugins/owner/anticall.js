import fs from "fs";
import path from "path";

export default {
    name: ["anticall"],
    owner: true,

    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        const reply = text => m.reply(text);
        if (!m.isOwner) return reply(settings.mess.owner);

        const option = args[0]?.toLowerCase();
        if (!["on", "off"].includes(option)) return reply(`*Ex:* ${usedPrefix}anticall on`);

        const value = option === "on";
        if (settings.anticall === value) return reply(`Fitur Anti Call sudah dalam keadaan ${option}`);

        try {
            const file = path.join(process.cwd(), "settings.js");
            let content = fs.readFileSync(file, "utf8");

            content = content.replace(/anticall:\s*(true|false)/, `anticall: ${value}`);

            fs.writeFileSync(file, content);
            settings.anticall = value;

            return reply(`Anti Call berhasil di${value ? "hidupkan" : "matikan"}`);
        } catch (err) {
            console.error(err);
            return reply(settings.mess.error || err.message);
        }
    }
};