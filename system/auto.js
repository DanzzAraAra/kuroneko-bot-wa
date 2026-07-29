/*
   * Dandy
   * DO NOT FOR SALE!
   * Github: github.com/DanzzAraAra
   * Function Auto Detect Admin and Autoreadsw Autoreactsw Autoreadgc Autoreadpc
*/
const textNotif = {
    promote: "Selamat {user}, kamu sekarang telah menjadi *Admin* grup!",
    demote: "Yahh {user}, jabatanmu telah diturunkan menjadi *Member* biasa."
};

const auto = async (sock, msg) => {
    if (msg.key.fromMe) return;

    const isStatus = msg.key.remoteJid === 'status@broadcast';
    const isGroup = msg.key.remoteJid.endsWith('@g.us');
    const isPrivate = msg.key.remoteJid.endsWith('@s.whatsapp.net') && !isStatus;

    const settings = global.settings;

    try {
        if (isStatus) {
            const jid = msg.key.participant;
            const senderName = msg.pushName || jid.split('@')[0];

            if (settings.autoreadsw) {
                setTimeout(async () => {
                    await sock.readMessages([msg.key]).catch(() => {});
                    console.log(`[Status] Melihat status dari ${senderName}`);
                }, 1500);
            }
            
            if (settings.autoreactsw && settings.reactsw) {
                setTimeout(async () => {
                    const emojis = settings.reactsw;
                    const emoji = Array.isArray(emojis) ? emojis[Math.floor(Math.random() * emojis.length)] : emojis;
                    
                    await sock.sendMessage("status@broadcast", {
                        react: { text: emoji, key: msg.key }
                    }, { statusJidList: [jid] }).catch(() => {});
                    
                    console.log(`[Status] React ${emoji} ke status ${senderName}`);
                }, 3000);
            }
        } else if (isGroup && settings.autoreadgc) {
            await sock.readMessages([msg.key]).catch(() => {});
        } else if (isPrivate && settings.autoreadpc) {
            await sock.readMessages([msg.key]).catch(() => {});
        }
    } catch (err) {
        console.error('[Auto Feature Error]', err);
    }
};

const autoAdmin = async (sock, update) => {
    const { id, participants, action } = update;

    try {
        if (action === 'promote') {
            for (const participant of participants) {
                const username = `@${participant.split('@')[0]}`;
                const txt = textNotif.promote.replace('{user}', username);
                await sock.sendMessage(id, {
                    text: txt,
                    mentions: [participant]
                });
                console.log(`[Group] ${participant.split('@')[0]} dipromosikan menjadi admin di grup ${id}`);
            }
        } else if (action === 'demote') {
            for (const participant of participants) {
                const username = `@${participant.split('@')[0]}`;
                const txt = textNotif.demote.replace('{user}', username);
                await sock.sendMessage(id, {
                    text: txt,
                    mentions: [participant]
                });
                console.log(`[Group] ${participant.split('@')[0]} diturunkan dari admin di grup ${id}`);
            }
        }
    } catch (err) {
        console.error('[Auto Admin Error]', err);
    }
};

module.exports = { auto, autoAdmin };