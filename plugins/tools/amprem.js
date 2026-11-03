import axios from 'axios';

const maxLength = 4096;

export default {
    name: ['amprem'],
    premium: true,

    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        const [rawMode, email, ...urlParts] = args;
        const mode = rawMode?.toLowerCase();
        const url = urlParts.join(' ').trim();

        if (!mode || !email || !['send', 'verif'].includes(mode)) {
            await m.reply(
                `*Ex:*\n` +
                `> ${usedPrefix + commandName} send email@example.com\n` +
                `> ${usedPrefix + commandName} verif email@example.com https://example.com/verify`
            );
            return false;
        }

        if (
            email.length > 254 ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        ) {
            await m.reply('Format email tidak valid.');
            return false;
        }

        if (mode === 'verif') {
            if (!url || url.length > maxLength) {
                await m.reply(`*Ex:* ${usedPrefix + commandName} verif email@example.com https://example.com/verify`);
                return false;
            }

            try {
                const parsed = new URL(url);

                if (parsed.protocol !== 'https:') {
                    await m.reply('URL verifikasi harus menggunakan HTTPS');
                    return false;
                }
            } catch {
                await m.reply('URL verifikasi tidak valid');
                return false;
            }
        }

        try {
            if (settings?.mess?.wait)
                await m.reply(settings.mess.wait);

            const { data } = await axios.get(
                `${settings.api}/api/tools/alightmotion`,
                {
                    params: {
                        email,
                        options: mode,
                        ...(mode === 'verif' ? { url } : {}),
                        apikey: settings.key
                    },
                    timeout: 60000
                }
            );

            if (!data?.status) {
                await m.reply(data?.message || 'Permintaan gagal.');
                return false;
            }

            if (mode === 'send') {
                await m.reply([
                    '*[ ALIGHT MOTION ]*',
                    '',
                    data.message || 'Link berhasil dikirim.',
                    `> Email: ${email}`
                ].join('\n'));
                return;
            }

            const result = data.data || {};
            const verify = result.verify_data?.result || {};

            await m.reply([
                '*[ ALIGHT MOTION ]*',
                '',
                data.message || 'Verifikasi selesai.',
                `> Email: ${result.email || email}`,
                `> Status: ${verify.status || 'unknown'}`,
                `> Valid: ${formatBoolean(verify.valid)}`,
                `> Auto Renew: ${formatBoolean(verify.autoRenewing)}`
            ].join('\n'));

        } catch (err) {
            const status = err.response?.status;
            const message = err.response?.data?.message;

            if (status === 403) {
                await m.reply(message || 'Khusus user premium. Silakan upgrade akun Anda.');
                return false;
            }

            await m.reply(
                message ||
                settings?.mess?.error ||
                err.message
            );
            return false;
        }
    }
};

function formatBoolean(value) {
    if (value === true) return 'Ya';
    if (value === false) return 'Tidak';
    return 'Unknown';
}