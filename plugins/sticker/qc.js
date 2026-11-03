import axios from 'axios';
import { writeExif } from '../../src/sticker.js';

export default {
    name: ['qc'],
    limit: 1,
    premium: false,

    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        try {
            const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const text = args.join(' ').trim()
                || quoted?.conversation
                || quoted?.extendedTextMessage?.text
                || '';

            if (!text) {
                return m.reply(`*Ex:* ${usedPrefix + commandName} halo sayang`);
            }

            if (settings?.mess?.wait) {
                await m.reply(settings.mess.wait);
            }

            const sender = m.sender || m.key?.participant || m.key?.remoteJid;
            const pushName = m.pushName || 'User';

            let ppUrl;

            try {
                ppUrl = await sock.profilePictureUrl(sender, 'image');
            } catch {
                ppUrl = 'https://i.ibb.co/3Fh9V6p/avatar-contact.png';
            }

            const apiUrl = `${settings.api}/api/maker/qc?text=${encodeURIComponent(text)}&nama=${encodeURIComponent(pushName)}&url=${encodeURIComponent(ppUrl)}&color=%23ffffff&apikey=${encodeURIComponent(settings.key)}`;
            const { data } = await axios.get(apiUrl, {
                responseType: 'arraybuffer',
                timeout: 15000
            });

            if (!data?.byteLength) {
                return m.reply('Gagal membuat quote.');
            }

            const sticker = await writeExif({
                mimetype: 'image/png',
                data: Buffer.from(data),
                ext: 'png'
            }, {
                packName: pushName,
                packPublish: settings?.botName || 'KuroNeko'
            });

            return sock.sendMessage(m.chat || m.from, {
                sticker
            }, { quoted: m });
        } catch (err) {
            await m.reply(settings?.mess?.error || err.message);
            return false;
        }
    }
};