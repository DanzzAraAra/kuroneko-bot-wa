export default {
  name: 'getpp',
  limit: 2,

  execute: async (sock, m, args, settings) => {
    const ctx = m.message?.extendedTextMessage?.contextInfo
    const raw = ctx?.mentionedJid?.[0] || ctx?.participant || (args[0] ? `${args[0].replace(/\D/g, '')}@s.whatsapp.net` : '')
    const target = raw ? m.normalizeJid(raw) : ''

    if (!target || target === '@s.whatsapp.net') {
      return m.reply('Reply, tag, or enter a phone number.')
    }

    await m.reply(settings.mess.wait)

    try {
      const url = await sock.profilePictureUrl(target, 'image')

      if (!url?.startsWith('https://')) {
        return m.reply('Profile picture not found')
      }

      return sock.sendMessage(m.from, {
        image: { url },
        caption: `Profile picture of @${target.split('@')[0]}`,
        mentions: [target]
      }, { quoted: m })
    } catch {
      return m.reply('Profile picture not found')
    }
  }
}