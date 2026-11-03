/*
 * Dandy
 * DO NOT FOR SALE!
 * Github: github.com/DanzzAraAra
 */
const handleParticipants = async (sock, { id, participants, action }) => {
    if (!['add', 'remove'].includes(action)) return

    const group = global.db?.groups?.[id]

    if (!group || (action === 'add' ? !group.welcome : !group.left)) return

    try {
        const metadata = await sock.groupMetadata(id)
        const list = Array.isArray(participants) ? participants : [participants]

        for (const item of list) {
            const participant = typeof item === 'string'
                ? item
                : item?.id || item?.jid

            if (typeof participant !== 'string' || !participant) continue

            const user = `@${participant.split('@')[0]}`
            const subject = metadata.subject || 'grup ini'
            const desc = metadata.desc || 'Tidak ada deskripsi'

            // text default kalau belum di set
            const defaultText = action === 'add'
                ? `*━[ WELCOME ]━*\n\nHalo *${user}*\nSelamat bergabung di grup *${subject}*!\nSemoga betah dan jangan lupa patuhi rules grup ya!`
                : `*━[ GOODBYE ]━*\n\nSelamat tinggal *${user}*\nTerima kasih sudah pernah meramaikan grup ini!`

            const customText = action === 'add'
                ? group.welcomeText
                : group.leftText

            const text = (customText || defaultText)
                .replace(/@user/g, user)
                .replace(/@group/g, subject)
                .replace(/@desc/g, desc)

            await sock.sendMessage(id, {
                text,
                mentions: [participant]
            })
        }
    } catch (err) {
        console.error('[Participants]', err.message)
    }
}

export { handleParticipants }