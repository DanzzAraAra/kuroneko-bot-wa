const { updateUser } = require('../../src/database.js');

const parseDuration = (str) => {
    if (!str) return null;
    const num = parseFloat(str);
    const unit = str.replace(num, '').toLowerCase().trim();
    switch (unit) {
        case 's': return num * 1000;
        case 'm': return num * 60 * 1000;
        case 'h': return num * 60 * 60 * 1000;
        case 'd': return num * 24 * 60 * 60 * 1000;
        default: return null;
    }
};

module.exports = {
    name: ['addprem', 'delprem'],
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
            return m.reply(`*Ex* ${usedPrefix}delprem @user`);
        }

        const user = global.db.users[targetJid];
        if (!user) {
            return m.reply('Pengguna tidak ditemukan di database.');
        }

        if (commandName === 'addprem') {
            const timeStr = args[1] || (args[0] && isNaN(args[0]) ? args[0] : null);
            const duration = parseDuration(timeStr);

            if (!duration) {
                return m.reply(`*Ex:* ${usedPrefix}addprem @user 30d`);
            }

            const baseTime = (user.premium && user.premiumTime > Date.now()) ? user.premiumTime : Date.now();
            const newPremTime = baseTime + duration;

            await updateUser(targetJid, {
                premium: true,
                premiumTime: newPremTime
            });

            m.reply(`Sukses menambahkan Premium untuk *@${targetJid.split('@')[0]}* selama *${timeStr}*.\n\nPremium berakhir pada: ${new Date(newPremTime).toLocaleString('id-ID')}`);
        }

        if (commandName === 'delprem') {
            if (!user.premium) return m.reply('Pengguna tersebut memang bukan user premium.');

            await updateUser(targetJid, {
                premium: false,
                premiumTime: 0
            });

            m.reply(`Status Premium untuk *@${targetJid.split('@')[0]}* telah dihapus.`);
        }
    }
};