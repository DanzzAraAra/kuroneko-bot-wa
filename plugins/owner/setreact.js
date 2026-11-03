import fs from "fs";
import path from "path";

export default {
    name: ["setreact"],
    owner: true,

    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        const reply = text => m.reply(text);
        if (!m.isOwner) return reply(settings.mess.owner);

        const emojis = args.join(" ").split(",").map(e => e.trim()).filter(Boolean);
        if (!emojis.length) return reply(`*Ex:* ${usedPrefix}setreact ❤️,🔥,😂,👍`);

        try {
            const file = path.join(process.cwd(), "settings.js");
            let content = fs.readFileSync(file, "utf8");

            content = content.replace(/reactsw:\s*\[[^\]]*\]/, `reactsw: ${JSON.stringify(emojis)}`);

            fs.writeFileSync(file, content);
            settings.reactsw = emojis;

            return reply(`Reaction emoji updated:\n${emojis.join(" ")}`);
        } catch (err) {
            console.error(err);
            return reply(settings.mess.error || err.message);
        }
    }
};