import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { plugins } from "../../system/loadPlugins.js";
import { toSmallCaps } from "../../src/font/smallCaps.js";
import { toBoldSerif } from "../../src/font/boldSerif.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default {
    name: ["menu", "help"],
    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        try {
            const pluginDir = path.join(__dirname, "../../plugins");
            const chat = m.chat || m.from;

            if (!fs.existsSync(pluginDir)) {
                throw new Error(`Plugin directory tidak ditemukan: ${pluginDir}`);
            }

            const folders = fs.readdirSync(pluginDir, { withFileTypes: true })
                .filter(item => item.isDirectory() && item.name !== "events")
                .map(item => item.name)
                .sort();

            const menuSections = [];

            for (const folder of folders) {
                const commands = [];

                for (const [name, plugin] of plugins) {
                    if (!plugin?.__file) continue;

                    const relative = path.relative(
                        pluginDir,
                        path.dirname(plugin.__file)
                    );

                    if (relative !== folder) continue;
                    if (["eval", "shell", "menu", "help"].includes(name)) continue;

                    commands.push({
                        name,
                        limit: plugin.limit,
                        premium: !!plugin.premium
                    });
                }

                if (!commands.length) continue;

                commands.sort((a, b) => a.name.localeCompare(b.name));

                const commandList = commands.map(cmd => {
                    const badge = cmd.premium ? " *Ⓟ*" : "";
                    const limit = Number(cmd.limit) > 0 ? ` (${cmd.limit})` : "";

                    return `│ ◦ ${usedPrefix}${toSmallCaps(cmd.name)}${badge}${limit}`;
                }).join("\n");

                menuSections.push(
                    `┌───➤ *${toBoldSerif(folder)}*\n` +
                    `${commandList}\n` +
                    `╰───────────`
                );
            }

            const botName = settings?.botName || "Bot";
            const menuText = `*✨ ${toBoldSerif(botName)}*\n\n${menuSections.join("\n\n")}`;
            const imagePath = path.join(__dirname, "../../src/kuroneko.jpg");

            if (fs.existsSync(imagePath)) {
                await sock.sendMessage(chat, {
                    image: { url: imagePath },
                    caption: menuText,
                    contextInfo: {
                        stanzaId: m.key?.id,
                        participant: m.sender,
                        quotedMessage: m.message,
                        forwardingScore: 9999999,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: settings.channel,
                            newsletterName: botName,
                            serverMessageId: -1
                        }
                    }
                }, { quoted: m });
            } else {
                await sock.sendMessage(chat, {
                    text: menuText
                }, { quoted: m });
            }

            return true;
        } catch (err) {
            console.error(err);
            await m.reply(settings?.mess?.error || err.message);
            return false;
        }
    }
};