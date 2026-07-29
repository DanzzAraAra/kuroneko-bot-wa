const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

module.exports = {
  name: 'backup',
  execute: async (sock, m, args, settings) => {
    const reply = (text) => sock.sendMessage(m.from, { text }, { quoted: m });

    const sender = m.sender || m.key.participant || m.key.remoteJid;
    const groupMeta = m.from.endsWith('@g.us') ? await sock.groupMetadata(m.from).catch(() => null) : null;
    const participantInfo = groupMeta?.participants.find(p => p.id === sender);
    const realSender = participantInfo?.jid || sender;

    const isOwner = settings.ownerNumber.some(num => num.split('@')[0] === realSender.split('@')[0]);
    if (!isOwner) return reply(settings.mess.owner);

    try {
      const backupItems = ['database.json', 'index.js', 'package.json', 'settings.js', 'plugins', 'src', 'system'];
      const date = new Date();
      const dateString = `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getFullYear()).slice(-2)}`;
      const zipFileName = `backup_${dateString}.zip`;
      const zipFilePath = path.resolve(zipFileName);

      const itemsToZip = backupItems.filter(item => fs.existsSync(path.resolve(item)));
      if (!itemsToZip.length) return reply('No valid files found for backup.');

      await reply(settings.mess.wait);

      const zip = new AdmZip();
      itemsToZip.forEach(item => {
        const filePath = path.resolve(item);
        if (fs.statSync(filePath).isDirectory()) {
          zip.addLocalFolder(filePath, path.basename(item));
        } else {
          zip.addLocalFile(filePath);
        }
      });

      zip.writeZip(zipFilePath);

      await sock.sendMessage(realSender, {
        document: fs.readFileSync(zipFilePath),
        fileName: zipFileName,
        mimetype: 'application/zip',
        caption: `Backup file created successfully.\nDate: ${dateString}`
      });

      if (m.from.endsWith('@g.us')) {
        reply('Backup completed. The file has been sent to your private chat.');
      }

      fs.unlinkSync(zipFilePath);
    } catch (err) {
      console.error(err);
      reply(settings.mess.error);
    }
  }
};