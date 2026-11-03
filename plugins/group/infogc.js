
export default {
  name: ['infogc'],

  execute: async (sock, m, args, settings, commandName, usedPrefix) => {
    const reply = text => sock.sendMessage(m.from, { text }, { quoted: m })
    const { isGroup, isAdmin, isOwner, from } = m

    if (!isGroup) return reply(settings.mess.group)
    if (!isAdmin && !isOwner) return reply(settings.mess.admin)

    const group = global.db.groups[from]

    if (!group) return reply('Group setup data not found')

    const status = value => value ? 'ON' : 'OFF'
    const metadata = await sock.groupMetadata(from).catch(() => null)
    const schedule = group.schedule || {}

    const text = `
*[ GROUP INFORMATION ]*

Nama Grup: ${metadata?.subject || 'Unknown'}
ID Grup: ${from}
Jumlah Member: ${metadata?.participants?.length ?? 'Unknown'}

*[ GROUP SECURITY ]*
> Anti Delete: ${status(group.antidelete)}
> Anti Link: ${status(group.antilink)}
> Anti Link Channel: ${status(group.antilinkch)}
> Anti Tag SW: ${status(group.antitagsw)}
> Anti Toxic: ${status(group.antitoxic)}
> Anti NSFW: ${status(group.antinsfw)}

*[ GROUP SETTINGS ]*
> Welcome: ${status(group.welcome)}
> Left Message: ${status(group.left)}
> Auto Admin: ${status(group.autoadmin)}
> Auto Back: ${status(group.autoback)}
> Mute: ${status(group.mute)}
> Only Admin: ${status(group.onlyadmin)}
> NSFW: ${status(group.nsfw)}

*[ AUTO SCHEDULE ]*
> Status: ${status(schedule.enabled)}
> Tutup Grup: ${schedule.closeTime || '22:00'} WIB
> Pesan Tutup: ${schedule.closeText || 'Tidak ada'}
> Buka Grup: ${schedule.openTime || '05:00'} WIB
> Pesan Buka: ${schedule.openText || 'Tidak ada'}
> Status Terakhir: ${
  schedule.lastState === 'closed'
    ? 'Grup Ditutup'
    : schedule.lastState === 'open'
      ? 'Grup Dibuka'
      : 'Belum Diketahui'
}
> Zona Waktu: Asia/Jakarta (WIB)
`.trim()

    return reply(text)
  }
}