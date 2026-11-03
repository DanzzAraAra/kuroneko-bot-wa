export default {
    name: ['setpp'],
    owner: true,

    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        try {
            const q = m.quoted || m;
            const type = sock.getMediaType(q);
            if (type !== 'image') {
                return m.reply(`*Ex:* Kirim gambar dengan caption *${usedPrefix}${commandName}* atau reply gambar`);
            }
            if (settings?.mess?.wait) {
                await m.reply(settings.mess.wait);
            }
            const buffer = await sock.downloadMedia(q);
            if (!buffer?.length) {
                return m.reply('Gagal mengunduh gambar');
            }
            await sock.updateProfilePicture(sock.user.id, buffer);
            return m.reply('Foto profil berhasil diperbarui');
        } catch (err) {
            await m.reply(settings?.mess?.error || err.message);
            return false;
        }
    }
};