const { updateUser } = require('../../src/database.js');

module.exports = {
    name: ['dellimit'],
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
            return m.reply(`*Ex:* ${usedPrefix}${commandName} @user 10`);
        }

        const user = global.db.users[targetJid];
        if (!user) {
            return m.reply('Pengguna tidak ditemukan di database.');
        }

        const opt = args[1] || args[0];
        const currentLimit = user.limit || 0;

        if (opt && opt.toLowerCase() === 'all') {
            await updateUser(targetJid, { limit: 0 });
            return m.reply(`Sukses menghapus seluruh limit untuk *@${targetJid.split('@')[0]}*.\nSisa limit sekarang: *0*`);
        }

        const amount = parseInt(opt);
        if (isNaN(amount) || amount <= 0) {
            return m.reply(`Masukkan jumlah limit yang valid!\n\n*Contoh:* ${usedPrefix}${commandName} @user 10\n*Atau:* ${usedPrefix}${commandName} @user all`);
        }

        const newLimit = Math.max(0, currentLimit - amount);
        await updateUser(targetJid, { limit: newLimit });

        m.reply(`Sukses mengurangi *${amount}* limit untuk *@${targetJid.split('@')[0]}*.\nSisa limit sekarang: *${newLimit}*`);
    }
};