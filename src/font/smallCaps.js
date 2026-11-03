const normal = 'abcdefghijklmnopqrstuvwxyz'
const smallCaps = 'ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘǫʀꜱᴛᴜᴠᴡxʏᴢ'

const toSmallCaps = text => {
  if (!text) return ''

  return String(text).replace(/[a-z]/gi, char => {
    return smallCaps[normal.indexOf(char.toLowerCase())]
  })
}

export { toSmallCaps }