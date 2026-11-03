import fs from "fs";
import path from "path";

export default {
    name: ["mode", "self", "public"],
    owner: true,

    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        const reply = text => m.reply(text);
        if (!m.isOwner) return reply(settings.mess.owner);

        const mode = ["self", "public"].includes(commandName) ? commandName : args[0]?.toLowerCase();

        if (!["self", "public"].includes(mode)) {
            return reply(`*Example:*
${usedPrefix}mode self
${usedPrefix}mode public
${usedPrefix}self
${usedPrefix}public`);
        }

        if (settings.mode === mode) return reply(`Bot is already in *${mode}* mode`);

        try {
            const file = path.join(process.cwd(), "settings.js");
            let content = fs.readFileSync(file, "utf8");

            content = content.replace(/mode:\s*['"][^'"]+['"]/, `mode: '${mode}'`);

            fs.writeFileSync(file, content);
            settings.mode = mode;

            return reply(`Bot mode changed to *${mode}*`);
        } catch (err) {
            console.error(err);
            return reply(settings.mess.error || err.message);
        }
    }
};