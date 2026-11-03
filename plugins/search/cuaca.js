import axios from 'axios';

export default {
    name: ['cuaca', 'weather'],
    limit: 1,
    premium: false,

    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        try {
            const q = args.join(' ');

            if (!q) {
                return m.reply(`*Ex:* ${usedPrefix}${commandName} Yogyakarta`);
            }

            if (settings?.mess?.wait) {
                await m.reply(settings.mess.wait);
            }

            const apiUrl = `${settings.api}/api/search/cuaca?q=${encodeURIComponent(q)}&apikey=${settings.key}`;
            const { data } = await axios.get(apiUrl);

            if (!data?.status || !data.data) {
                return m.reply('Data cuaca tidak ditemukan.');
            }

            const weather = data.data;
            const main = weather.main;
            const condition = weather.weather?.[0];

            return m.reply(
                `*CUACA ${weather.name}, ${weather.sys?.country || ''}*\n\n` +
                `*Kondisi:* ${condition?.description || '-'}\n` +
                `*Suhu:* ${main.temp}°C\n` +
                `*Terasa seperti:* ${main.feels_like}°C\n` +
                `*Suhu minimum:* ${main.temp_min}°C\n` +
                `*Suhu maksimum:* ${main.temp_max}°C\n` +
                `*Kelembapan:* ${main.humidity}%\n` +
                `*Tekanan udara:* ${main.pressure} hPa\n` +
                `*Tutupan awan:* ${weather.clouds?.all ?? '-'}%\n` +
                `*Kecepatan angin:* ${weather.wind?.speed ?? '-'} m/s\n` +
                `*Visibilitas:* ${weather.visibility != null ? `${weather.visibility / 1000} km` : '-'}`
            );
        } catch (err) {
            await m.reply(settings?.mess?.error || err.message);
        }
    }
};