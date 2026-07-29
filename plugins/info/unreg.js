const { updateUser } = require('../../src/database');

module.exports = {
    name: 'unreg',
    execute: async (sock, m, args, settings) => {
        const user = global.db.users[m.sender];

        if (!user || !user.registered) {
            return sock.sendMessage(m.from, { text: 'Kamu memang belum terdaftar di database.' }, { quoted: m });
        }

        await updateUser(m.sender, { registered: false });

        await sock.sendMessage(
            m.from, 
            { text: 'Berhasil keluar! Status registrasi kamu telah dihapus.' }, 
            { quoted: m }
        );
    }
};