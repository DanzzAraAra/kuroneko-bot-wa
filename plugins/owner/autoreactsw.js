import fs from "fs";
import path from "path";

export default {
    name: ["autoreactsw"],
    owner: true,

    execute: async (sock, m, args, settings) => {
        const reply = text => m.reply(text);
        if (!m.isOwner) return reply(settings.mess.owner);

        const option = args[0]?.toLowerCase();
        if (!["on", "off"].includes(option)) return reply("on/off?");

        const value = option === "on";
        if (settings.autoreactsw === value) return reply(`Auto react status is already ${option}`);

        try {
            const file = path.join(process.cwd(), "settings.js");
            let content = fs.readFileSync(file, "utf8");

            content = content.replace(/autoreactsw:\s*(true|false)/, `autoreactsw: ${value}`);

            fs.writeFileSync(file, content);
            settings.autoreactsw = value;

            return reply(`Auto react story ${value ? "enabled" : "disabled"}`);
        } catch (err) {
            console.error(err);
            return reply(settings.mess.error || err.message);
        }
    }
};