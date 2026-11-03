import fs from 'fs';
import path from 'path';

export default {
    name: ['onlyjoingroup'],
    owner: true,

    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        const reply = text => m.reply(text);

        if (!m.isOwner) return reply(settings.mess.owner);

        const url = args[0];

        if (!url) {
            return reply(`Ex: ${usedPrefix + commandName} https://chat.whatsapp.com/xxx or ${usedPrefix + commandName} off`);
        }

        try {
            const file = path.join(process.cwd(), 'settings.js');
            let content = fs.readFileSync(file, 'utf8');

            if (url.toLowerCase() === 'off') {
                content = content
                    .replace(/onlyJoinGroup:\s*["'][^"']*["']/, 'onlyJoinGroup: ""')
                    .replace(/onlyJoinGroupUrl:\s*["'][^"']*["']/, 'onlyJoinGroupUrl: ""');

                fs.writeFileSync(file, content);

                settings.onlyJoinGroup = '';
                settings.onlyJoinGroupUrl = '';

                return reply('Only Join Group disabled.');
            }

            const code = url.match(/chat\.whatsapp\.com\/([a-zA-Z0-9]+)/)?.[1];

            if (!code) return reply('Link grup WhatsApp tidak valid.');

            const info = await sock.groupGetInviteInfo(code);

            if (!info?.id) return reply('Gagal mendapatkan informasi grup.');

            const groupId = info.id;

            content = content
                .replace(/onlyJoinGroup:\s*["'][^"']*["']/, `onlyJoinGroup: "${groupId}"`)
                .replace(/onlyJoinGroupUrl:\s*["'][^"']*["']/, `onlyJoinGroupUrl: "${url}"`);

            fs.writeFileSync(file, content);

            settings.onlyJoinGroup = groupId;
            settings.onlyJoinGroupUrl = url;

            return reply(
                `*[ ONLY JOIN GROUP ]*\n\n` +
                `Bot hanya aktif di grup:\n> ${url}`
            );
        } catch (err) {
            return reply(settings.mess.error || err.message);
        }
    }
};