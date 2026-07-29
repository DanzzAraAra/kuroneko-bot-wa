const fs = require('fs');
const path = require('path');

module.exports = {
  name: ['mode', 'self', 'public'],
  execute: async (sock, m, args, settings, commandName) => {
    const reply = (text) => sock.sendMessage(m.from, { text }, { quoted: m });

    const sender = m.sender || m.key.participant || m.key.remoteJid;
    let isOwner = m.key.fromMe;

    if (!isOwner) {
      let realSender = sender;
      if (m.from.endsWith('@g.us')) {
        const groupMeta = await sock.groupMetadata(m.from).catch(() => null);
        const participant = groupMeta?.participants?.find(p => p.id === sender);
        realSender = participant?.jid || sender;
      }
      isOwner = settings.ownerNumber.some(num => num.split('@')[0] === realSender.split('@')[0]);
    }

    if (!isOwner) return reply(settings.mess.owner);

    let targetMode = '';
    if (commandName === 'self' || commandName === 'public') {
      targetMode = commandName;
    } else if (['self', 'public'].includes(args[0]?.toLowerCase())) {
      targetMode = args[0].toLowerCase();
    }

    if (!targetMode) {
      return reply(`Example:\n.mode self\n.mode public\n.self\n.public`);
    }

    if (settings.mode === targetMode) {
      return reply(`Bot is already in ${targetMode} mode.`);
    }

    settings.mode = targetMode;
    const settingsPath = path.join(__dirname, '../../settings.js');

    try {
      let content = fs.readFileSync(settingsPath, 'utf8');

      if (content.includes('mode:')) {
        content = content.replace(/mode:\s*['"][^'"]+['"]/g, `mode: '${targetMode}'`);
      } else {
        content = content.replace(/(module\.exports\s*=\s*\{)/, `$1\n    mode: '${targetMode}',`);
      }

      fs.writeFileSync(settingsPath, content);
      reply(`Bot mode changed to ${targetMode}.`);
    } catch (err) {
      console.error(err);
      reply(settings.mess.error);
    }
  }
};