module.exports = {
    name: 'ping',
    execute: async (sock, m) => {
        const timestamp = m.messageTimestamp;
        const ping = Date.now() - (Number(timestamp) * 1000);
        await m.reply(`Pong! *${ping} ms*`);
    }
};