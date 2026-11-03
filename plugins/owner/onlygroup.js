import fs from 'fs';
import path from 'path';

export default {
    name: ['onlygroup'],
    owner: true,

    execute: async (sock, m, args, settings) => {
        const reply = text => m.reply(text);

        if (!m.isOwner) return reply(settings.mess.owner);
        if (settings.onlyGroup) return reply('Only Group is already active');

        try {
            const file = path.join(process.cwd(), 'settings.js');
            let content = fs.readFileSync(file, 'utf8');

            content = content
                .replace(/onlyGroup:\s*(true|false)/, 'onlyGroup: true')
                .replace(/onlyPrivate:\s*(true|false)/, 'onlyPrivate: false');

            fs.writeFileSync(file, content);

            settings.onlyGroup = true;
            settings.onlyPrivate = false;

            return reply('Only Group enabled.');
        } catch (err) {
            console.error(err);
            return reply(settings.mess.error || err.message);
        }
    }
};