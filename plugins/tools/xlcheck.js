import axios from 'axios';

export default {
    name: ['xlcheck'],
    limit: 5,
    premium: false,

    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        const number = args.join(' ').trim();

        if (!number) {
            return m.reply(`*Ex:* ${usedPrefix + commandName} 628xxx`);
        }

        try {
            if (settings?.mess?.wait) {
                await m.reply(settings.mess.wait);
            }

            const apiUrl = `${settings.api}/api/tools/xlcheck?number=${encodeURIComponent(number)}&apikey=${settings.key}`;
            const { data } = await axios.get(apiUrl, { timeout: 60000 });

            if (!data?.status || !data?.result) {
                return m.reply('Gagal mengecek nomor.');
            }

            const result = data.result;
            const volte = result.volte || {};
            const packages = result.packages || [];

            const text = [
                '*[ XL CHECK ]*',
                '',
                `Nomor: ${result.msisdn || number}`,
                `Operator: ${result.operator || '-'}`,
                `Jaringan: ${result.net_type || '-'}`,
                `Verifikasi Identitas: ${result.id_verified || '-'}`,
                `Masa Aktif: ${result.exp_date || '-'}`,
                `Masa Tenggang: ${result.grace_until || '-'}`,
                `Masa Penggunaan: ${result.tenure || '-'}`,
                '',
                '*VoLTE*',
                `Area: ${volte.area ? 'Mendukung' : 'Tidak'}`,
                `Perangkat: ${volte.device ? 'Mendukung' : 'Tidak'}`,
                `Kartu SIM: ${volte.simcard ? 'Mendukung' : 'Tidak'}`,
                '',
                '*[ PAKET AKTIF ]*',
                ...(packages.length
                    ? packages.flatMap((pkg, i) => [
                        `${i + 1}. ${pkg.name || 'Paket'}`,
                        `   Kedaluwarsa: ${pkg.expiry || '-'}`,
                        ...(pkg.quotas || []).map(quota =>
                            `   ${quota.name || 'Kuota'}: ${quota.remaining || '-'} / ${quota.total || '-'} (${quota.percent ?? 0}%)`
                        ),
                        ''
                    ])
                    : ['Tidak ada informasi paket.'])
            ].join('\n');

            return m.reply(text);
        } catch (err) {
            await m.reply(settings?.mess?.error || err.message);
            return false;
        }
    }
};