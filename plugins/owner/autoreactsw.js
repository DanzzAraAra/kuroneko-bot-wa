const fs = require('fs');
const path = require('path');

module.exports = {
  name: ['autoreactsw'],
  execute: async (sock, m, args, settings) => {
    const reply = (text) => sock.sendMessage(m.from, { text }, { quoted: m });

    const sender = m.sender || m.key.participant || m.key.remoteJid;
    const senderNumber = sender.split('@')[0].split(':')[0];
    const isOwner = m.key.fromMe || settings.ownerNumber.some(num => num.split('@')[0] === senderNumber);

    if (!isOwner) return reply(settings.mess.owner);

    const option = args[0]?.toLowerCase();
    if (!['on', 'off'].includes(option)) return reply('on/off?');

    const value = option === 'on';
    if (settings.autoreactsw === value) return reply(`Auto react status is already ${option}.`);

    settings.autoreactsw = value;
    const settingsPath = path.join(__dirname, '../../settings.js');

    try {
      let content = fs.readFileSync(settingsPath, 'utf8');
      content = content.replace(/autoreactsw:\s*(true|false)/, `autoreactsw: ${value}`);
      fs.writeFileSync(settingsPath, content);

      reply(`Auto react story ${value ? 'enabled' : 'disabled'}.`);
    } catch (err) {
      console.error(err);
      reply(settings.mess.error);
    }
  }
};