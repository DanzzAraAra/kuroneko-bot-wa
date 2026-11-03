import { User } from "../../src/database.js";

export default {
    name: ["ban", "unban"],

    execute: async (sock, m, args, settings, commandName) => {
        const reply = text => m.reply(text);

        if (!m.isOwner) {
            return reply(settings.mess.owner);
        }

        const ctx = m.message?.extendedTextMessage?.contextInfo;

let target =
    m.mentions?.[0] ||
    m.quoted?.jid ||
    ctx?.mentionedJid?.[0] ||
    ctx?.participantAlt ||
    ctx?.participant;

if (target?.endsWith("@lid")) {
    target = await sock.signalRepository?.lidMapping?.getPNForLID(target) || target;
}

        if (!target && args[0]) {
            const number = args[0].replace(/\D/g, "");
            if (number) target = `${number}@s.whatsapp.net`;
        }

        if (!target) {
            return reply(`*Ex:* ${settings.prefix[0]}${commandName} <@tag/nomor/reply>`);
        }

        const targetNum = target.split("@")[0];
        const owners = settings.ownerNumber || [];
        const isTargetOwner = owners.some(num => num.split("@")[0] === targetNum);

        if (isTargetOwner || targetNum === m.sender?.split("@")[0]) {
            return reply("Tidak dapat melakukan ban/unban pada Owner!");
        }

        try {
            const isBanning = commandName.toLowerCase() === "ban";
            const updatedUser = await User.findOneAndUpdate(
                { jid: target },
                { $set: { banned: isBanning } },
                { returnDocument: "after", upsert: true }
            );

            global.db.users ||= {};

            if (!global.db.users[target]) {
                global.db.users[target] = {
                    name: updatedUser?.name || "Unknown",
                    role: updatedUser?.role || "user",
                    banned: isBanning
                };
            } else {
                global.db.users[target].banned = isBanning;
            }

            return reply(`Berhasil *${isBanning ? "BANNED" : "UNBANNED"}* user: @${targetNum}`);
        } catch (err) {
            console.error(err);
            return reply(settings.mess.error || err.message);
        }
    }
};