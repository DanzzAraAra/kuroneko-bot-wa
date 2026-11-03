import fs from "fs";
import path from "path";

export default {
    name: ["totalcmd"],

    execute: async (sock, m, args, settings) => {
        const countFiles = dir => {
            let total = 0;

            for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
                const file = path.join(dir, item.name);

                if (item.isDirectory()) {
                    total += countFiles(file);
                } else if (item.isFile() && /\.(js|mjs|cjs)$/.test(item.name)) {
                    total++;
                }
            }
            return total;
        };

        try {
            const total = countFiles(path.resolve("plugins"));
            return m.reply(`Total Plugin: *${total}*`);
        } catch (err) {
            console.error(err);
            return m.reply(settings?.mess?.error || err.message);
        }
    }
};