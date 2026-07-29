module.exports = {
    name: ['runtime', 'uptime'],
    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        const uptime = process.uptime();
        const days = Math.floor(uptime / 86400);
        const hours = Math.floor((uptime % 86400) / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);
        const botName = settings.botName;
        const textRuntime = `*${botName}* telah online selama:\n${days} Hari, ${hours} Jam, ${minutes} Menit, ${seconds} Detik`;
        await m.reply(textRuntime);
    }
};