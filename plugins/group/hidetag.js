export default {
  name: ['hidetag', 'ht'],

  execute: async (sock, m, args, settings) => {
    const reply = text => sock.sendMessage(m.from, { text }, { quoted: m })
    const { isGroup, isAdmin, isOwner } = m

    if (!isGroup) return reply(settings.mess.group)
    if (!isAdmin && !isOwner) return reply(settings.mess.admin)

    try {
      const metadata = await sock.groupMetadata(m.from)
      const participants = metadata.participants.map(p => p.id)
      const msgText = args.length ? `*HIDETAG:* ${args.join(' ')}` : '*HIDETAG:*'

      return sock.sendMessage(m.from, {
        text: msgText,
        contextInfo: { mentionedJid: participants }
      }, { quoted: m })
    } catch (err) {
      return reply(settings.mess.error)
    }
  }
}