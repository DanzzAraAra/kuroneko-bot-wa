import { updateGroup } from '../../src/database.js'

export default {
  name: ['mute'],

  execute: async (sock, m, args, settings) => {
    const reply = text => sock.sendMessage(m.from, { text }, { quoted: m })
    const { isGroup, isOwner, from } = m

    if (!isGroup) return reply(settings.mess.group)
    if (!isOwner) return reply(settings.mess.owner)

    await updateGroup(from, { mute: true })
    return reply('Bot berhasil di mute untuk grup ini')
  }
}