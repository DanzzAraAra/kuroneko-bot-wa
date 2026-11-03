import fs from "fs";
import path from "path";

export default {
    name: ["autoreadsw"],
    owner: true,

    execute: async (sock, m, args, settings) => {
        const reply = text => m.reply(text);
        if (!m.isOwner) return reply(settings.mess.owner);

        const option = args[0]?.toLowerCase();
        if (!["on", "off"].includes(option)) return reply("on/off?");

        const value = option === "on";
        if (settings.autoreadsw === value) return reply(`Auto read story is already ${option}`);

        try {
            const file = path.join(process.cwd(), "settings.js");
            let content = fs.readFileSync(file, "utf8");

            content = content.replace(/autoreadsw:\s*(true|false)/, `autoreadsw: ${value}`);

            fs.writeFileSync(file, content);
            settings.autoreadsw = value;

            return reply(`Auto read story ${value ? "enabled" : "disabled"}`);
        } catch (err) {
            console.error(err);
            return reply(settings.mess.error || err.message);
        }
    }
};