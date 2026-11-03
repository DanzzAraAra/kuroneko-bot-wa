/*
 * Dandy
 * DO NOT FOR SALE!
 * Github: github.com/DanzzAraAra
 */
import { updateGroup } from './database.js';
import { resolvePN } from './serialize.js';

export const addWarning = async (sock, jid, rawTarget, reason = 'Tidak ada alasan') => {
    const target = await resolvePN(sock, rawTarget);

    if (!target) {
        return { success: false, message: 'PN user tidak ditemukan' };
    }

    const group = global.db?.groups?.[jid];

    if (!group) {
        return { success: false, message: 'Group data not found' };
    }

    const metadata = await sock.groupMetadata(jid).catch(() => null);

    if (!metadata) {
        return { success: false, message: 'Gagal mengambil data grup' };
    }

    let participant;

    for (const p of metadata.participants || []) {
        const ids = [p.id, p.jid, p.lid, p.phoneNumber].filter(Boolean);

        for (const id of ids) {
            if (await resolvePN(sock, id) === target) {
                participant = p;
                break;
            }
        }

        if (participant) break;
    }

    if (!participant) {
        return { success: false, message: 'User tidak ditemukan di grup' };
    }

    if (participant.admin) {
        return { success: false, message: 'Tidak bisa memberikan warning kepada admin grup' };
    }

    const warns = { ...(group.warns || {}) };
    const count = (warns[target] || 0) + 1;
    const max = group.warnLimit || 3;

    warns[target] = count;
    await updateGroup(jid, { warns });

    if (count >= max) {
        try {
            await sock.groupParticipantsUpdate(jid, [participant.id], 'remove');

            delete warns[target];
            await updateGroup(jid, { warns });

            return {
                success: true,
                target,
                count,
                max,
                kicked: true,
                reason
            };
        } catch {
            return {
                success: true,
                target,
                count,
                max,
                kicked: false,
                reason,
                message: 'Gagal mengeluarkan user. Pastikan bot menjadi admin grup.'
            };
        }
    }

    return {
        success: true,
        target,
        count,
        max,
        kicked: false,
        reason
    };
};