export default {
  name: ['runtime', 'uptime'],

  execute: async (sock, m, args, settings) => {
    const uptime = process.uptime()
    const days = Math.floor(uptime / 86400)
    const hours = Math.floor((uptime % 86400) / 3600)
    const minutes = Math.floor((uptime % 3600) / 60)
    const seconds = Math.floor(uptime % 60)
    const botName = settings.botName

    const textRuntime = `*${botName}* telah online selama:
${days} Hari, ${hours} Jam, ${minutes} Menit, ${seconds} Detik`

    return m.reply(textRuntime)
  }
}