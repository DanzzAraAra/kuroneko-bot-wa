import fs from "fs";
import path from "path";

export default {
    name: ["setapikey"],
    owner: true,

    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        const reply = text => m.reply(text);

        if (!m.isOwner) return reply(settings.mess.owner);

        const apikey = args.join(" ").trim();

        if (!apikey) {
            return reply(`*Ex:* ${usedPrefix}setapikey sylva-xxxx`);
        }

        if (apikey === settings.key) {
            return reply("API Key is already in use.");
        }

        try {
            const url = `${settings.api}/api/info/cekapikey?apikey=${encodeURIComponent(apikey)}`;
            const response = await fetch(url);
            const result = await response.json();

            if (!response.ok || !result.status) {
                return reply(result.message || "API Key tidak valid.");
            }

            const file = path.join(process.cwd(), "settings.js");
            let content = fs.readFileSync(file, "utf8");

            content = content.replace(
                /key:\s*(['"])[\s\S]*?\1/,
                `key: ${JSON.stringify(apikey)}`
            );

            fs.writeFileSync(file, content);
            settings.key = apikey;

            return reply(
                `*API Key berhasil diperbarui!*\n\n` +
                `> Name: ${result.result.name}\n` +
                `> Role: ${result.result.role}\n` +
                `> Limit: ${result.result.limit}\n` +
                `> Usage: ${result.result.usage}\n` +
                `> Sisa Hari: ${result.result.sisa_hari}`
            );
        } catch (err) {
            return reply(settings?.mess?.error || err.message);
        }
    }
};