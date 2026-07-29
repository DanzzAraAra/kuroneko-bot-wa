const fs = require('fs');
const path = require('path');
const { toSmallCaps } = require('../../src/font/smallCaps.js'); 
const { toBoldSerif } = require('../../src/font/boldSerif.js'); 

module.exports = {
  name: ['menu', 'help'],
  execute: async (sock, m, args, settings, commandName, usedPrefix) => {
    const pluginDir = path.join(__dirname, '../../plugins'); 

    const folders = fs.readdirSync(pluginDir, { withFileTypes: true })
      .filter(d => d.isDirectory() && d.name !== 'events')
      .map(d => d.name);

    const menuSections = folders.map(folder => {
      const folderPath = path.join(pluginDir, folder);
      
      const commands = fs.readdirSync(folderPath)
        .filter(file => file.endsWith('.js'))
        .map(file => {
          try {
            const pluginPath = path.join(folderPath, file);
            delete require.cache[require.resolve(pluginPath)];
            const plugin = require(pluginPath);
            
            const name = Array.isArray(plugin.name) ? plugin.name[0] : plugin.name;
            return {
              name: name,
              premium: !!plugin.premium
            };
          } catch {
            return null;
          }
        })
        .filter(cmd => cmd && cmd.name && !['eval', 'shell'].includes(cmd.name));

      if (!commands.length) return null;

      const commandList = commands.map(cmd => {
        const premiumBadge = cmd.premium ? ' *Ⓟ*' : ''; 
        return `│ ◦ ${usedPrefix}${toSmallCaps(cmd.name)}${premiumBadge}`;
      }).join('\n');
      
      return `┌───➤ *${toBoldSerif(folder)}*\n${commandList}\n╰──────────────`;
    }).filter(Boolean);

    const botNameStr = settings.botName;
    
    let menuText = `*✨ ${toBoldSerif(botNameStr)}*\n\n`;
    menuText += menuSections.join('\n\n');

    try {
      await sock.sendMessage(m.chat || m.from, { 
        image: { url: './src/kuroneko.jpg' }, 
        caption: menuText,
        contextInfo: {
          stanzaId: m.key.id,
          participant: m.sender,
          quotedMessage: m.message,
          forwardingScore: 9999999,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: "120363405217880860@newsletter",
            newsletterName: botNameStr,
            serverMessageId: -1,
          }
        }
      }, { quoted: m });
    } catch (err) {
      console.error(err);
      await sock.sendMessage(m.chat || m.from, { text: menuText }, { quoted: m });
    }
  }
};