/*
 * Dandy
 * DO NOT FOR SALE!
 * Github: github.com/DanzzAraAra
 */
import chalk from "chalk";

const logMessage = m => {
    if (!m?.message) return;

    const jid = m.key?.remoteJid || "";
    const participant = m.sender || m.key?.participantAlt || m.key?.participant || jid;
    const name = m.name || m.pushName || "Unknown";

    const text = m.text
        || m.msg?.conversation
        || m.msg?.extendedTextMessage?.text
        || m.msg?.imageMessage?.caption
        || m.msg?.videoMessage?.caption
        || m.msg?.documentMessage?.caption
        || m.msg?.audioMessage?.caption
        || "[Media/Lainnya]";

    const time = chalk.dim(
        `[${new Date().toLocaleTimeString("id-ID", { hour12: false })}]`
    );

    let label;
    let senderColor;
    let idColor;
    let id;

    if (jid === "status@broadcast") {
        label = chalk.bgYellow.black.bold(" STORY ");
        senderColor = chalk.yellowBright.bold;
        idColor = chalk.yellow;
        id = participant;
    } else if (jid.endsWith("@g.us")) {
        label = chalk.bgBlue.white.bold(" GROUP ");
        senderColor = chalk.cyanBright.bold;
        idColor = chalk.cyan;
        id = participant;
    } else if (jid.endsWith("@newsletter")) {
        label = chalk.bgGreen.white.bold(" CHANNEL ");
        senderColor = chalk.greenBright.bold;
        idColor = chalk.green;
        id = jid;
    } else {
        label = chalk.bgMagenta.white.bold(" PRIVATE ");
        senderColor = chalk.magentaBright.bold;
        idColor = chalk.magenta;
        id = participant;
    }

    console.log(
        `${time} ${label} ${senderColor(name)} ${idColor(`(${id})`)}\n` +
        ` ↳ ${chalk.white(text)}\n`
    );
};

export { logMessage };