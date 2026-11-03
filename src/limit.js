/*
 * Dandy
 * DO NOT FOR SALE!
 * Github: github.com/DanzzAraAra
 */
import { updateUser } from "./database.js";

const sendLimitMessage = async (m, limit, required) => {
    return m.reply(
        `*[ LIMIT TIDAK CUKUP ]*\n\n` +
        `Maaf, limit kamu tidak cukup untuk menggunakan fitur ini\n\n` +
        `- Butuh : *${required} Limit*\n` +
        `- Sisa  : *${limit} Limit*\n\n` +
        `Gunakan .buy untuk membeli limit atau .daily untuk klaim limit harian`
    );
};

const handleLimit = async (sock, m, command, user, userId, prefix = ".") => {
    if (!command.limit || user?.premium || m.isOwner) {
        return { canContinue: true, refund: null };
    }

    const limit = Number(user?.limit) || 0;

    if (limit < command.limit) {
        await sendLimitMessage(m, limit, command.limit);
        return { canContinue: false, refund: null };
    }

    const text = m.text || m.message?.conversation ||
        m.message?.extendedTextMessage?.text || "";

    const args = text.trim().split(/ +/).slice(1);
    const context = m.message?.extendedTextMessage?.contextInfo;
    const hasQuoted = Boolean(context?.quotedMessage);
    const hasMedia = Boolean(
        m.message?.imageMessage ||
        m.message?.videoMessage ||
        m.message?.stickerMessage ||
        m.message?.documentMessage
    );

    user.limit = limit - command.limit;
    await updateUser(userId, { limit: user.limit });

    let limitMsg;

    if (args.length || hasQuoted || hasMedia) {
        limitMsg = await sock.sendMessage(m.from, {
            text: `*[ -${command.limit} Limit ]*`
        }, { quoted: m });
    }

    let refunded = false;

    const refund = async () => {
        if (refunded) return;
        refunded = true;

        user.limit = (Number(user.limit) || 0) + command.limit;
        await updateUser(userId, { limit: user.limit });

        if (limitMsg?.key) {
            await sock.sendMessage(m.from, {
                delete: limitMsg.key
            }).catch(() => {});
        }
    };

    return { canContinue: true, refund };
};

export { handleLimit };