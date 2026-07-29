/*
   * Dandy
   * DO NOT FOR SALE!
   * Github: github.com/DanzzAraAra
*/
const { updateUser } = require('./database');

const handleLimit = async (sock, m, command, user, sender) => {
    if (!command.limit || user.premium || m.isOwner) {
        return { canContinue: true, refund: null };
    }

    if (user.limit < command.limit) {
        const txtLimit = `*LIMIT TIDAK MENCUKUPI*\n\nMaaf, limit kamu tidak cukup untuk menggunakan fitur ini.\n\n- Butuh : *${command.limit} Limit*\n- Sisa  : *${user.limit} Limit*`;
        
        await sock.sendMessage(m.from, { text: txtLimit }, { quoted: m });
        return { canContinue: false, refund: null };
    }

    const text = m.text || m.message?.conversation || m.message?.extendedTextMessage?.text || '';
    const args = text.trim().split(/ +/).slice(1);
    
    const hasQuoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const hasMedia = m.message?.imageMessage || m.message?.videoMessage || m.message?.stickerMessage || m.message?.documentMessage;

    let limitMsg = null;

    user.limit -= command.limit;
    await updateUser(sender, { limit: user.limit });
    
    if (args.length > 0 || hasQuoted || hasMedia) {
        const txtMin = `*[ -${command.limit} Limit ]*`;
        limitMsg = await sock.sendMessage(m.from, { text: txtMin }, { quoted: m });
    }
    
    const refund = async () => {
        user.limit += command.limit;
        await updateUser(sender, { limit: user.limit });
        
        if (limitMsg && limitMsg.key) {
            await sock.sendMessage(m.from, { delete: limitMsg.key }).catch(() => {});
        }
    };

    return { canContinue: true, refund };
};

module.exports = { handleLimit };