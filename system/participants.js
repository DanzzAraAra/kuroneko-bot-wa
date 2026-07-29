/*
   * Dandy
   * DO NOT FOR SALE!
   * Github: github.com/DanzzAraAra
*/
const handleParticipants = async (sock, { id, participants, action }) => {
    try {
        const { subject: groupName } = await sock.groupMetadata(id);
        for (const jid of participants) {
            const userMention = `@${jid.split('@')[0]}`;
            if (action !== 'add' && action !== 'remove') continue;
            const isAdd = action === 'add';
            const text = isAdd 
                ? `*━[ WELCOME ]━*\n\nHalo *${userMention}* \nSelamat bergabung di grup *${groupName}*!\nSemoga betah dan jangan lupa patuhi rules grup ya!`
                : `*━[ GOODBYE ]━*\n\nSelamat tinggal *${userMention}* \nTerima kasih sudah pernah meramaikan grup ini!`;
            await sock.sendMessage(id, { text, mentions: [jid] });
        }
    } catch (err) {}
};
module.exports = { handleParticipants };