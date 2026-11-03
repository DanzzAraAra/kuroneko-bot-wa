import { resolvePN } from "../../src/serialize.js";

export default {
    name: ["cekwarn"],

    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        const reply = text => m.reply(text);

        if (!m.isGroup) return reply(settings.mess.group);

        const group = global.db.groups[m.from];
        if (!group) return reply("Group data not found");

        const ctx = m.message?.extendedTextMessage?.contextInfo;
        const rawTarget = ctx?.mentionedJid?.[0] || m.quoted?.key?.participant || m.sender;
        const target = await resolvePN(sock, rawTarget);

        if (!target) return reply("Pengguna tidak ditemukan.");

        const warns = group.warns || {};
        const count = Number(warns[target] || 0);
        const max = Number(group.warnLimit || 3);

        return reply(
            `*[ CEK WARNING ]*\n\n` +
            `> User: @${target.split("@")[0]}\n` +
            `> Warning: ${count}/${max}\n` +
            `> Status: ${count >= max ? "Mencapai batas warning" : "Belum mencapai batas warning"}`
        );
    }
};