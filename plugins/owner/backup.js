import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";

export default {
    name: ["backup"],
    owner: true,

    execute: async (sock, m, args, settings) => {
        const reply = text => m.reply(text);
        if (!m.isOwner) return reply(settings.mess.owner);

        const nama = `backup_${new Date().toLocaleDateString("en-GB").replace(/\//g, "-")}.zip`;
        const pantat = path.resolve(nama);

        try {
            const ignore = [
                "node_modules",
                "session",
                ".npm",
                ".git",
                "package-lock.json"
            ];

            const zip = new AdmZip();
            const root = process.cwd();

            zip.addLocalFolder(root, "", name => {
                const parts = name.split(/[\\/]/);
                return !parts.some(part => ignore.includes(part));
            });

            await reply(settings.mess.wait);
            zip.writeZip(pantat);

            await sock.sendMessage(m.sender, {
                document: fs.readFileSync(pantat),
                fileName: nama,
                mimetype: "application/zip",
                caption: `Date: ${new Date().toLocaleDateString("id-ID")}`
            });

            if (m.from.endsWith("@g.us")) {
                await reply("Backup completed. The file has been sent to your private chat");
            }
        } catch (err) {
            console.error(err);
            return reply(settings.mess.error || err.message);
        } finally {
            if (fs.existsSync(pantat)) fs.unlinkSync(pantat);
        }
    }
};