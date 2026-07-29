const fs = require('fs');
const path = require('path');

module.exports = {
  name: ['autoreadgc'],
  execute: async (sock, m, args, settings) => {
    const reply = (text) => sock.sendMessage(m.from, { text }, { quoted: m });

    const sender = m.sender || m.key.participant || m.key.remoteJid;
    const senderNumber = sender.split('@')[0].split(':')[0];
    const isOwner = m.key.fromMe || settings.ownerNumber.some(num => num.split('@')[0] === senderNumber);

    if (!isOwner) return reply(settings.mess.owner);

    const option = args[0]?.toLowerCase();
    if (!['on', 'off'].includes(option)) return reply('*Ex:* .autoreadgc on');

    const value = option === 'on';
    
    if (settings.autoreadgc === value) return reply(`Auto read group sudah dalam keadaan ${option}.`);

    settings.autoreadgc = value;
    const settingsPath = path.join(__dirname, '../../settings.js');

    try {
      let content = fs.readFileSync(settingsPath, 'utf8');
      content = content.replace(/autoreadgc:\s*(true|false)/, `autoreadgc: ${value}`);
      fs.writeFileSync(settingsPath, content);

      reply(`*[ 🍀 ]* Auto read group berhasil di${value ? 'hidupkan' : 'matikan'}.`);
    } catch (err) {
      console.error(err);
      reply(settings.mess.error);
    }
  }
};