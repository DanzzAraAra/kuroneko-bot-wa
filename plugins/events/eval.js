const util = require('util');
const { exec } = require('child_process');

module.exports = {
  name: ['eval', 'shell'],
  execute: async (sock, m, args, settings, commandName) => {
    const sender = m.sender || m.key.participant || m.key.remoteJid;
    const owner = settings.ownerNumber.map(v => v.split('@')[0].split(':')[0]);
    const senderId = sender.split('@')[0].split(':')[0];

    if (!owner.includes(senderId) && !m.key.fromMe) return;

    const input = args[0];
    if (!input) return;

    if (commandName === 'eval') {
      try {
        const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
        
        const fn = new AsyncFunction(
          'sock', 'm', 'args', 'settings', 'util', 'require', 'module', 'exports', '__filename', '__dirname',
          input
        );

        let result = await fn(sock, m, args, settings, util, require, module, exports, __filename, __dirname);

        if (typeof result !== 'string') {
          result = util.inspect(result, { depth: null, colors: false });
        }

        await sock.sendMessage(m.from, { text: result || 'undefined' }, { quoted: m });
      } catch (err) {
        await sock.sendMessage(m.from, { text: util.format(err) }, { quoted: m });
      }
    }

    if (commandName === 'shell') {
      exec(input, (err, stdout, stderr) => {
        if (err) return sock.sendMessage(m.from, { text: util.format(err) }, { quoted: m });
        if (stderr) return sock.sendMessage(m.from, { text: util.format(stderr) }, { quoted: m });
        
        sock.sendMessage(m.from, { text: stdout || 'Done' }, { quoted: m });
      });
    }
  }
};