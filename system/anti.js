/*
   * Dandy
   * DO NOT FOR SALE!
   * Github: github.com/DanzzAraAra
*/
const chalk = require('chalk');
const https = require('https');
const { downloadContentFromMessage } = require('baileys');
const { addGroup } = require('../src/database');
const toxicWords = require('../src/toxic.json');

const spamRecords = new Map();
const botWarnings = new Map();
const SPAM_LIMIT = 5;
const TIME_WINDOW = 4000;
const PENALTY_TIME = 5;

async function detectNSFW(imageBuffer, mimeType) {
    return new Promise((resolve, reject) => {
        const base64Data = 'data:' + mimeType + ';base64,' + imageBuffer.toString('base64');
        const payload = JSON.stringify({ data: base64Data });
        
        const options = {
            hostname: 'www.nyckel.com',
            path: '/v1/functions/o2f0jzcdyut2qxhu/invoke',
            method: 'POST',
            headers: {
                'Accept': 'application/json, text/javascript, */*; q=0.01',
                'X-Requested-With': 'XMLHttpRequest',
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            }
        };
        
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    if (result.message) {
                        reject({ error: result.message });
                    } else {
                        resolve({
                            labelName: result.labelName,
                            labelId: result.labelId,
                            confidence: result.confidence,
                            isNSFW: result.labelName === 'Porn',
                            confidencePercent: (result.confidence * 100).toFixed(2) + '%'
                        });
                    }
                } catch (error) {
                    reject({ error: error.message, raw: data });
                }
            });
        });
        
        req.on('error', (error) => reject({ error: error.message }));
        req.write(payload);
        req.end();
    });
}

const handleAnti = async (sock, m) => {
    const jid = m.from;
    const text = m.text || '';
    const { isAdmin, isOwner, isBotAdmin, sender, senderNum, key, message, isGroup } = m;

    if (!isOwner && text) {
        const isCommand = text.startsWith('>') || text.startsWith('$') || 
            (global.settings && global.settings.prefix && global.settings.prefix.some(p => text.startsWith(p)));

        if (isCommand) {
            const now = Date.now();
            const spamData = spamRecords.get(sender) || { count: 0, lastMessage: now, banUntil: 0 };

            if (now < spamData.banUntil) {
                return true;
            }

            if (now - spamData.lastMessage > TIME_WINDOW) {
                spamData.count = 0;
            }

            spamData.count += 1;
            spamData.lastMessage = now;

            if (spamData.count >= SPAM_LIMIT) {
                spamData.banUntil = now + (PENALTY_TIME * 1000); 
                spamData.count = 0;
                spamRecords.set(sender, spamData);

                await sock.sendMessage(jid, {
                    text: '*ANTI SPAM*\n\n@' + senderNum + ', kamu mengirim command terlalu cepat!\nSistem otomatis memblokir selama *' + PENALTY_TIME + ' detik*',
                    mentions: [sender]
                }, { quoted: m });

                return true;
            }

            spamRecords.set(sender, spamData);
        }
    }

    if (!isGroup) return false;

    addGroup(jid);

    const groupData = global.db.groups[jid] || {};

    if (groupData.antibot) {
        const msgId = m.key.id || '';
        const isBotMessage = (msgId.startsWith('3EB0') || msgId.startsWith('BAE5')) && msgId.length === 22 && !m.key.fromMe;

        if (isBotMessage && !isAdmin && !isOwner) {
            if (isBotAdmin) {
                const botKey = `${jid}-${sender}`;
                let warnings = botWarnings.get(botKey) || 0;
                warnings += 1;
                botWarnings.set(botKey, warnings);

                await sock.sendMessage(jid, { delete: m.key });

                if (warnings >= 3) {
                    await sock.sendMessage(jid, {
                        text: `*PERINGATAN ANTI BOT*\n\n@${senderNum} telah mencapai batas peringatan (3x)!\nSistem akan mengeluarkan bot ini dari grup otomatis.`,
                        mentions: [sender]
                    });
                    
                    await sock.groupParticipantsUpdate(jid, [sender], 'remove');
                    botWarnings.delete(botKey);
                } else {
                    await sock.sendMessage(jid, {
                        text: `*PERINGATAN ANTI BOT*\n\n@${senderNum} terdeteksi sebagai bot lain!\n\n*(Peringatan ${warnings}/3)*\nJika peringatan mencapai 3, bot akan otomatis dikeluarkan.`,
                        mentions: [sender]
                    });
                }
                return true;
            } else {
                console.log(chalk.yellow('[Anti-Bot] Terdeteksi bot lain, tapi bot kamu bukan admin grup.'));
            }
        }
    }

    const msgType = m.type || m.mtype;
    const isImage = msgType === 'imageMessage';
    const isSticker = msgType === 'stickerMessage';
    
    if ((isImage || isSticker) && groupData.antinsfw) {
        if (!isAdmin && !isOwner) {
            try {
                let buffer;
                
                if (typeof m.download === 'function') {
                    buffer = await m.download();
                } else {
                    const msgData = m.msg || m.message[msgType];
                    const stream = await downloadContentFromMessage(msgData, isImage ? 'image' : 'sticker');
                    buffer = Buffer.from([]);
                    for await (const chunk of stream) {
                        buffer = Buffer.concat([buffer, chunk]);
                    }
                }
                
                const mime = m.msg?.mimetype || m.message?.[msgType]?.mimetype || (isImage ? 'image/jpeg' : 'image/webp');
                const nsfwResult = await detectNSFW(buffer, mime);
                
                if (nsfwResult.isNSFW) {
                    if (isBotAdmin) {
                        await sock.sendMessage(jid, { delete: m.key });
                        await sock.sendMessage(jid, { 
                            text: '*PERINGATAN ANTI NSFW*\n\n@' + senderNum + ' terdeteksi mengirim media mengandung konten NSFW!\n\n*(Tingkat Akurasi: ' + nsfwResult.confidencePercent + ')*\n\nPesan otomatis dihapus.', 
                            mentions: [sender] 
                        });
                        return true;
                    } else {
                        console.log(chalk.yellow('[Anti-NSFW] Bot mendeteksi konten NSFW, tapi tidak bisa menghapus karena bukan admin.'));
                    }
                }
            } catch (err) {
                console.error(chalk.red('[Anti-NSFW] Gagal memproses deteksi media:'), err);
            }
        }
    }

    if (text && groupData.antitoxic) {
        const isToxic = toxicWords.some(word => {
            const regex = new RegExp('\\b' + word + '\\b', 'i');
            return regex.test(text);
        });

        if (isToxic) {
            if (!isAdmin && !isOwner) {
                if (isBotAdmin) {
                    await sock.sendMessage(jid, { delete: m.key });
                    await sock.sendMessage(jid, { 
                        text: '*PERINGATAN!*\n\n@' + senderNum + ' terdeteksi menggunakan kata kasar/toxic!\n\nPesan kamu telah dihapus karena fitur Anti Toxic aktif di grup ini.', 
                        mentions: [sender] 
                    });
                    return true;
                } else {
                    console.log(chalk.yellow('Bot mendeteksi kata toxic, tapi tidak bisa menghapus karena bot bukan admin.'));
                }
            }
        }
    }

    const isUrl = text.match(/(chat\.whatsapp\.com\/(?:invite\/)?([0-9A-Za-z]{20,24}))/i);
    
    if (isUrl && groupData.antilink) {
        if (!isAdmin && !isOwner) {
            if (isBotAdmin) {
                await sock.sendMessage(jid, { delete: m.key });
                await sock.sendMessage(jid, { 
                    text: '*PERINGATAN!*\n\n@' + senderNum + ' terdeteksi mengirim link WhatsApp Group!\n\nPesan kamu telah dihapus karena fitur Anti Link aktif di grup ini.', 
                    mentions: [sender] 
                });
                return true; 
            } else {
                console.log(chalk.yellow('Bot mendeteksi link, tapi tidak bisa menghapus karena bot bukan admin.'));
            }
        }
    }

    const isTagSW = m.mtype === 'groupStatusMentionMessage' || m.type === 'groupStatusMentionMessage' || (message && JSON.stringify(message).includes('groupStatusMentionMessage'));
    
    if (isTagSW && groupData.antitagsw) {
        if (!isAdmin && !isOwner) {
            if (isBotAdmin) {
                await sock.sendMessage(jid, { delete: m.key });
                await sock.sendMessage(jid, { 
                    text: '*PERINGATAN!*\n\n@' + senderNum + ' terdeteksi melakukan tag status!\n\nPesan kamu telah dihapus karena fitur Anti Tag SW aktif di grup ini.', 
                    mentions: [sender] 
                });
                return true;
            } else {
                console.log(chalk.yellow('Bot mendeteksi Tag SW, tapi tidak bisa hapus pesan karena bukan admin.'));
            }
        }
    }

    return false;
};

const handleCall = async (sock, calls, settings) => {
    if (!settings.anticall) return;

    for (const call of calls) {
        if (call.status === 'offer') {
            console.log(chalk.yellow(`[Anti-Call] Menolak panggilan dari ${call.from}`));
            try {
                await sock.rejectCall(call.id, call.from);
                
            } catch (err) {
                console.error(chalk.red('[Anti-Call] Gagal menolak panggilan:'), err);
            }
        }
    }
};

module.exports = { handleAnti, handleCall };
