const fs = require('fs');
const path = require('path');

module.exports = {
  name: ['setreact'],
  execute: async (sock, m, args, settings, commandName, usedPrefix) => {
    const reply = (text) => sock.sendMessage(m.from, { text }, { quoted: m });

    const sender = m.sender || m.key.participant || m.key.remoteJid;
    const senderNumber = sender.split('@')[0].split(':')[0];
    const isOwner = m.key.fromMe || settings.ownerNumber.some(num => num.split('@')[0] === senderNumber);

    if (!isOwner) return reply(settings.mess.owner);

    const emojis = args.join(' ').split(',').map(e => e.trim()).filter(Boolean);
    if (!emojis.length) return reply(`Example:\n${usedPrefix}setreact ❤️,🔥,😂,👍`);

    settings.reactsw = emojis;
    const settingsPath = path.join(__dirname, '../../settings.js');

    try {
      let content = fs.readFileSync(settingsPath, 'utf8');
      content = content.replace(/reactsw:\s*\[[^\]]*\]/, `reactsw: ${JSON.stringify(emojis)}`);
      fs.writeFileSync(settingsPath, content);

      reply(`Reaction emoji updated:\n${emojis.join(' ')}`);
    } catch (err) {
      console.error(err);
      reply(settings.mess.error);
    }
  }
};