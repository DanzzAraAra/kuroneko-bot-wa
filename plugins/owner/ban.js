const { User } = require('../../src/database');

module.exports = {
  name: ['ban', 'unban'],
  execute: async (sock, m, args, settings, cmd) => {
    const reply = (text) => sock.sendMessage(m.from, { text }, { quoted: m });

    if (!m.isOwner) return reply(settings.mess.owner);

    let target = m.message?.extendedTextMessage?.contextInfo?.participant || 
                 m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];

    if (!target && args[0]) {
      let number = args[0].replace(/[^0-9]/g, '');
      if (number) target = `${number}@s.whatsapp.net`;
    }

    if (!target) {
      return reply(`*Ex*: *${settings.prefix[0]}${cmd} <@tag/nomor/reply>*`);
    }

    const targetNum = target.split('@')[0];
    const isTargetOwner = settings.ownerNumber.some(num => num.split('@')[0] === targetNum);
    if (isTargetOwner) return reply('Tidak dapat melakukan ban/unban pada Owner!');

    try {
      const isBanning = cmd === 'ban';
      const updatedUser = await User.findOneAndUpdate(
        { jid: target },
        { $set: { banned: isBanning } },
        { returnDocument: 'after', upsert: true }
      );

      if (!global.db.users[target]) {
        global.db.users[target] = { 
          name: updatedUser.name || 'Unknown', 
          role: updatedUser.role || 'user', 
          banned: isBanning 
        };
      } else {
        global.db.users[target].banned = isBanning;
      }

      reply(`Berhasil *${isBanning ? 'BANNED' : 'UNBANNED'}* user: @${targetNum}`);
    } catch (err) {
      console.error(err);
      reply(settings.mess.error);
    }
  }
};