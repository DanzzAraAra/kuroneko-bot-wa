const settings = {
    botName: 'KuroNeko',
    ownerName: 'Dandy',
    ownerNumber: ['628xxx@s.whatsapp.net'],
    channel: "120363405217880860@newsletter",
    prefix: ['!', '.', '#'],
    mode: 'public', //"self" or "public"
    onlyGroup: false,
    onlyPrivate: false,
    onlyJoinGroup: "", // ngga usah di isi
    onlyJoinGroupUrl: "", // ngga usah di isi
    autoreadsw: false, 
    autoreactsw: false,
    reactsw: ['😍'],
    autoreadgc: false,
    autoreadpc: false,
    anticall: false,

/*
untuk mendapatkan apikey, buka https://sylvatica.my.id lalu daftar atau login ke akun kalian. setelah itu buka profile, salin apikey kamu, lalu tempel di bagian key pada config ini
*/
    api: 'https://sylvatica.my.id',
    key: "", // ISI
    
database: {
    mode: "local", // "local" or "mongodb"
    local: {
        path: "./database",
        autosave: true,
        pretty: true
    },
    mongodb: {
        uri: "" //wajib isi kalau mode "mongodb" bisa ambil di https://mongodb.com
    }
},

    mess: {
        owner: '*[ 🍀 ]* ᴏᴡɴᴇʀ ᴏɴʟʏ',
        admin: '*[ 🍀 ]* ᴀᴅᴍɪɴ ᴏɴʟʏ',
        group: '*[ 🍀 ]* ɢʀᴏᴜᴘ ᴏɴʟʏ',
        botAdmin: '*[ 🍀 ]* ʙᴏᴛ ᴍᴜꜱᴛ ʙᴇ ᴀᴅᴍɪɴ',
        private: '*[ 🍀 ]* ᴘʀɪᴠᴀᴛᴇ ᴄʜᴀᴛ ᴏɴʟʏ',
        banned: '*[ 🍀 ]* ʏᴏᴜ ᴀʀᴇ ʙᴀɴɴᴇᴅ',
        register: '*[ 🍀 ]* ᴘʟᴇᴀꜱᴇ *.ʀᴇɢɪꜱᴛᴇʀ* ꜰɪʀꜱᴛ',
        wait: '*[ 🍀 ]* ᴘʀᴏᴄᴇꜱꜱɪɴɢ...',
        error: '*[ 🍀 ]* ᴇʀʀᴏʀ ᴏᴄᴄᴜʀʀᴇᴅ',
        nsfw: '*[ 🍀 ]* ɴꜱꜰᴡ ꜰᴇᴀᴛᴜʀᴇ ɪꜱ ᴅɪꜱᴀʙʟᴇᴅ ɪɴ ᴛʜɪꜱ ɢʀᴏᴜᴘ',
        anticall: '*[ 🍀 ]* ᴍᴀᴀꜰ, ʙᴏᴛ ᴛɪᴅᴀᴋ ᴍᴇɴᴇʀɪᴍᴀ ᴘᴀɴɢɢɪʟᴀɴ ᴛᴇʟᴇᴘᴏɴ/ᴠɪᴅᴇᴏ. ᴘᴀɴɢɢɪʟᴀɴ ᴏᴛᴏᴍᴀᴛɪꜱ ᴅɪᴛᴏʟᴀᴋ!'
    }
};

export default settings;