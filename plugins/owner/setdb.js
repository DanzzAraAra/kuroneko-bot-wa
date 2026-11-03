import fs from "fs";
import path from "path";
import { switchDB } from "../../src/database.js";

export default {
    name: ["setdb"],
    owner: true,

    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        const reply = text => m.reply(text);

        if (!m.isOwner) return reply(settings.mess.owner);

        const mode = args[0]?.toLowerCase();

        if (!["local", "mongodb"].includes(mode)) {
            return reply(`*Ex:* ${usedPrefix}setdb local\n*Ex:* ${usedPrefix}setdb mongodb`);
        }

        if (settings.database?.mode === mode) {
            return reply(`Database sudah menggunakan mode ${mode}`);
        }

        if (mode === "mongodb" && !settings.database?.mongodb?.uri) {
            return reply("MongoDB URI tidak ditemukan di settings.js");
        }

        const settingsPath = path.join(process.cwd(), "settings.js");
        let original;

        try {
            original = fs.readFileSync(settingsPath, "utf8");

            const pattern = /(\bdatabase\s*:\s*\{[\s\S]*?\bmode\s*:\s*)['"][^'"]+['"]/;

            if (!pattern.test(original)) {
                return reply("Konfigurasi database.mode tidak ditemukan di settings.js");
            }

            const updated = original.replace(pattern, `$1"${mode}"`);

            fs.writeFileSync(settingsPath, updated);

            try {
                await switchDB(mode);
            } catch (err) {
                fs.writeFileSync(settingsPath, original);
                throw err;
            }

            return reply(`Database successfully changed to mode *${mode}*`);
        } catch (err) {
            console.error(err);
            return reply(settings?.mess?.error || err.message);
        }
    }
};