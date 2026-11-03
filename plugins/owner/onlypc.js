import fs from 'fs';
import path from 'path';

export default {
    name: ['onlypc'],
    owner: true,

    execute: async (sock, m, args, settings) => {
        const reply = text => m.reply(text);

        if (!m.isOwner) return reply(settings.mess.owner);
        if (settings.onlyPrivate) return reply('Only Private is already active');

        try {
            const file = path.join(process.cwd(), 'settings.js');
            let content = fs.readFileSync(file, 'utf8');

            content = content
                .replace(/onlyGroup:\s*(true|false)/, 'onlyGroup: false')
                .replace(/onlyPrivate:\s*(true|false)/, 'onlyPrivate: true');

            fs.writeFileSync(file, content);

            settings.onlyGroup = false;
            settings.onlyPrivate = true;

            return reply('Only Private enabled');
        } catch (err) {
            console.error(err);
            return reply(settings.mess.error || err.message);
        }
    }
};