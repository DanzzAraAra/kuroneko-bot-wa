const { updateUser } = require('../../src/database.js');

module.exports = {
    name: ['addlimit'],
    owner: true,
    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        const isOwner = m.sender.split('@')[0] === '628xxx' || m.isOwner;
        if (!isOwner) return m.reply(settings.mess.owner);

        let targetJid;
        if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            targetJid = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
        } else if (m.message?.extendedTextMessage?.contextInfo?.participant) {
            targetJid = m.message.extendedTextMessage.contextInfo.participant;
        } else if (args[0] && !isNaN(args[0].replace(/[^0-9]/g, ''))) {
            targetJid = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
        }

        if (!targetJid) {
            return m.reply(`*Ex*: ${usedPrefix}${commandName} @user 50`);
        }

        const user = global.db.users[targetJid];
        if (!user) {
            return m.reply('Pengguna tidak ditemukan di database.');
        }

        const amountStr = args[1] || (args[0] && !isNaN(args[0]) ? args[0] : null);
        const amount = parseInt(amountStr);

        if (isNaN(amount) || amount <= 0) {
            return m.reply('Masukkan jumlah limit yang valid');
        }

        const currentLimit = user.limit || 0;
        const newLimit = currentLimit + amount;

        await updateUser(targetJid, { limit: newLimit });

        m.reply(`Sukses menambahkan *${amount}* limit untuk *@${targetJid.split('@')[0]}*.\nSisa limit sekarang: *${newLimit}*`);
    }
};