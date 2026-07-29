/*
   * Dandy
   * DO NOT FOR SALE!
   * Github: github.com/DanzzAraAra
*/
const chalk = require('chalk');
const { addUser, updateUser, addGroup } = require('../src/database');
const { plugins } = require('./loadPlugins');
const { handleAnti } = require('./anti');
const { handleLimit } = require('../src/limit');
const { handleGame } = require('../src/game/handler');

const getNum = (id) => id ? id.split('@')[0].split(':')[0] : '';
const isSameJid = (id1, id2) => getNum(id1) === getNum(id2);

const toJid = (id) => {
    if (!id) return '';
    if (id.includes('@g.us')) return id;
    if (id.includes('@lid')) return `${getNum(id)}@lid`;
    return `${getNum(id)}@s.whatsapp.net`;
};

const groupCache = new Map();

global.regSessions = global.regSessions || new Map();
global.tekateki = global.tekateki || {};
global.tebakbendera = global.tebakbendera || {};

const handleMsg = async (sock, m) => {
    if (!m?.key || (m.key.fromMe && m.key.id.startsWith('BAE5'))) return;

    const text = m.text || '';
    const jid = m.from;
    
    if (!text && !m.message) return;
    
    const sender = toJid(m.sender || m.key.participant || m.key.remoteJid);
    const senderNum = getNum(sender);
    const isOwner = m.key.fromMe || global.settings.ownerNumber.some(n => getNum(n) === senderNum);

    if (!isOwner && global.db.users[sender]?.banned) {
        return;
    }
    
    addUser(sender, m.name || 'Unknown');

    const user = global.db.users[sender];

    if (user && user.premium && user.premiumTime > 0 && Date.now() > user.premiumTime) {
        user.premium = false;
        user.premiumTime = 0;
        await updateUser(sender, { premium: false, premiumTime: 0 });
        await sock.sendMessage(jid, { text: 'Masa premium kamu telah habis! Terima kasih telah menggunakan layanan premium kami.' }, { quoted: m });
    }

    const isRegistered = user?.registered || false;
    const quotedMsgId = m.message?.extendedTextMessage?.contextInfo?.stanzaId;

    if (!isRegistered && quotedMsgId && global.regSessions.has(sender)) {
        const session = global.regSessions.get(sender);
        
        if (session.msgId === quotedMsgId) {
            if (text.trim().toUpperCase() === session.code) {
                clearTimeout(session.timeout);
                
                let currentLimit = user.limit || 0;
                let claimed = user.claimedFreeLimit || false;

                if (!claimed) {
                    currentLimit += 30;
                    claimed = true;
                }

                await updateUser(sender, { 
                    registered: true, 
                    username: session.username, 
                    age: session.age,
                    limit: currentLimit,
                    claimedFreeLimit: claimed
                });
                
                global.regSessions.delete(sender);

                let replyText = `Registrasi berhasil! Halo *${session.username}* (${session.age} tahun), sekarang kamu bisa menggunakan semua fitur bot.`;
                if (!user.claimedFreeLimit) {
                    replyText += `\n\n🎁 *Bonus Pendaftaran:* Kamu mendapatkan 30 Limit!`;
                }
                
                return sock.sendMessage(jid, { text: replyText }, { quoted: m });
            } else {
                return sock.sendMessage(jid, { text: 'Kode salah! Silakan perhatikan kodenya dan reply ulang pesan tersebut dengan kode yang benar.' }, { quoted: m });
            }
        }
    }

    const isGameAnswered = await handleGame(sock, m, text, jid, sender);
    if (isGameAnswered) return;

    const botJid = toJid(sock.user?.id);
    const botLid = sock.user?.lid ? toJid(sock.user.lid) : '';
    const isGroup = jid.endsWith('@g.us');
    
    let isAdmin = false;
    let isBotAdmin = false;
    let groupAdmins = [];

    if (isGroup) {
        addGroup(jid);
        try {
            let meta = groupCache.get(jid);
            if (!meta) {
                meta = await sock.groupMetadata(jid);
                groupCache.set(jid, meta);
                setTimeout(() => groupCache.delete(jid), 5 * 60 * 1000);
            }
            
            groupAdmins = meta.participants
                .filter(p => ['admin', 'superadmin'].includes(p.admin))
                .flatMap(p => [p.id, p.lid].filter(Boolean));
                
            isAdmin = groupAdmins.some(adminId => isSameJid(adminId, sender));
            isBotAdmin = groupAdmins.some(adminId => 
                isSameJid(adminId, botJid) || 
                (botLid && isSameJid(adminId, botLid))
            );
        } catch (e) {
            console.error(chalk.red(`[Debug] Gagal fetch info: ${e.message}`));
        }
    }

    Object.assign(m, {
        isGroup,
        isOwner,
        isAdmin,
        isBotAdmin,
        groupAdmins,
        sender,
        senderNum,
        botJid,
        toJid,
        normalizeJid: toJid
    });

    const isAntiTriggered = await handleAnti(sock, m);
    if (isAntiTriggered) return;

    let cmd = '';
    let args = [];
    let prefix = null;

    if (text.startsWith('>')) {
        cmd = 'eval';
        args = [text.slice(1).trim()];
    } else if (text.startsWith('$')) {
        cmd = 'shell';
        args = [text.slice(1).trim()];
    } else {
        prefix = global.settings.prefix.find(p => text.startsWith(p));
        if (prefix) {
            args = text.slice(prefix.length).trim().split(/\s+/);
            cmd = args.shift().toLowerCase();
        } else {
            const ctx = m.message?.extendedTextMessage?.contextInfo;
            if (ctx?.participant && toJid(ctx.participant) === botJid) {
                cmd = 'gemini';
                args = text.trim().split(/\s+/);
            } else {
                return;
            }
        }
    }

    if (cmd) {
        if (isGroup) {
            const groupData = global.db.groups[jid] || {};
            
            if (groupData.mute && !isOwner) {
                return; 
            }

            if (groupData.onlyadmin && !isAdmin && !isOwner) {
                return;
            }
        }

        if (global.settings.mode === 'self' && !isOwner) return;

        if (!isOwner && !isRegistered && cmd !== 'register') {
            if (!prefix) return; 
            
            return sock.sendMessage(jid, { text: global.settings.mess.register }, { quoted: m });
        }
    }

    const command = plugins.get(cmd);
    if (!command) return;

    if (command.premium && !user.premium && !isOwner) {
        return sock.sendMessage(jid, { text: `Perintah *${prefix || ''}${cmd}* hanya bisa diakses oleh pengguna *Premium*! Silakan hubungi Owner untuk membeli paket premium.` }, { quoted: m });
    }

    const limitData = await handleLimit(sock, m, command, user, sender);
    if (!limitData.canContinue) return;

    try {
        const result = await command.execute(sock, m, args, global.settings, cmd, prefix);
        
        if (result === false && limitData.refund) {
            await limitData.refund();
        }
    } catch (e) {
        console.error(chalk.red(`[Error Command] ${cmd}:`), e);
        if (limitData.refund) {
            await limitData.refund();
        }
    }
};

module.exports = { handleMsg };