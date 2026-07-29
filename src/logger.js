/*
   * Dandy
   * DO NOT FOR SALE!
   * Github: github.com/DanzzAraAra
*/
const chalk = require('chalk');

const logMessage = (msg) => {
    if (!msg.message) return;

    const jid = msg.key.remoteJid;
    const participant = msg.key.participant || jid; 
    const name = msg.pushName || 'Unknown';
    const m = msg.message;
    const text = m.conversation || 
                 m.extendedTextMessage?.text || 
                 m.imageMessage?.caption || 
                 m.videoMessage?.caption || 
                 m.documentMessage?.caption ||
                 '[Media/Lainnya]';
                 
    const time = chalk.dim(`[${new Date().toLocaleTimeString('id-ID', { hour12: false })}]`);
    
    let label, sender, idStr;

    if (jid === 'status@broadcast') {
        label = chalk.bgYellow.bold.black(' STORY ');
        sender = chalk.yellowBright.bold(name);
        idStr = chalk.yellow(`(${participant})`);
    } else if (jid.endsWith('@g.us')) {
        label = chalk.bgBlue.bold.white(' GROUP ');
        sender = chalk.cyanBright.bold(name);
        idStr = chalk.cyan(`(${participant})`);
    } else if (jid.endsWith('@newsletter')) {
        label = chalk.bgGreen.bold.white(' CHANNEL ');
        sender = chalk.greenBright.bold(name);
        idStr = chalk.green(`(${jid})`);
    } else {
        label = chalk.bgMagenta.bold.white(' PRIVATE ');
        sender = chalk.magentaBright.bold(name);
        idStr = chalk.magenta(`(${jid})`);
    }

    console.log(`${time} ${label} ${sender} ${idStr}\n ↳ ${chalk.white(text)}\n`);
};

module.exports = { logMessage };