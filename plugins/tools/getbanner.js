
export default {
  name: 'getbanner',
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
      const profile = await sock.getBusinessProfile(target)
      const cover = profile?.rawProfile?.content?.find(v => v.tag === 'cover_photo')
      const url = cover?.content?.toString()

      if (!url?.startsWith('https://')) {
        return m.reply('Business banner not found.')
      }

      return sock.sendMessage(m.from, {
        image: { url }
      }, { quoted: m })
    } catch {
      return m.reply(settings.mess.error)
    }
  }
}