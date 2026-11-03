/*
 * Dandy
 * DO NOT FOR SALE!
 * Github: github.com/DanzzAraAra
 */
import { updateGroup, updateUser } from "../src/database.js";

const textNotif = {
    promote: "Selamat {user}, kamu sekarang telah menjadi *Admin* grup!",
    demote: "Yahh {user}, jabatanmu telah diturunkan menjadi *Member* biasa."
};

let scheduleTimer = null;
let checkingSchedule = false;
let checkingLoans = false;

const DAY = 24 * 60 * 60 * 1000;
const REMINDER_BEFORE = 60 * 60 * 1000;
const LATE_RATE = 1;
const MAX_LATE_RATE = 30;

const formatMoney = amount =>
    `Rp${Math.floor(Number(amount) || 0).toLocaleString("id-ID")}`;

const getLateFee = (item, now) => {
    if (item.paid || now <= item.dueAt) return 0;

    const daysLate = Math.floor((now - item.dueAt) / DAY);

    return Math.floor(
        item.amount * Math.min(daysLate, MAX_LATE_RATE) * LATE_RATE / 100
    );
};

const checkLoanNotifications = async sock => {
    if (checkingLoans) return;
    checkingLoans = true;

    try {
        const users = global.db?.users || {};
        const now = Date.now();

        for (const [jid, user] of Object.entries(users)) {
            const loan = user?.loan;

            if (!loan?.active || !Array.isArray(loan.installments)) {
                continue;
            }

            let changed = false;

            for (let i = 0; i < loan.installments.length; i++) {
                const item = loan.installments[i];

                if (item.paid) continue;

                if (
                    now >= item.dueAt - REMINDER_BEFORE &&
                    now < item.dueAt &&
                    !item.reminderSent
                ) {
                    try {
                        await sock.sendMessage(jid, {
                            text:
                                `*[ PENGINGAT CICILAN BANK ]*\n\n` +
                                `Cicilan ke-${i + 1} akan jatuh tempo dalam 1 jam.\n\n` +
                                `> Cicilan: ${formatMoney(item.amount)}\n` +
                                `> Jatuh tempo: ${new Date(item.dueAt).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}\n\n` +
                                `Gunakan .bayar untuk membayar cicilan.`
                        });

                        item.reminderSent = true;
                        changed = true;
                    } catch (err) {
                        console.error("[Bank Reminder]", err.message);
                    }
                }

                if (now >= item.dueAt && !item.overdueNoticeSent) {
                    try {
                        await sock.sendMessage(jid, {
                            text:
                                `*[ CICILAN TERLAMBAT ]*\n\n` +
                                `Cicilan ke-${i + 1} telah melewati jatuh tempo\n\n` +
                                `> Cicilan: ${formatMoney(item.amount)}\n` +
                                `> Denda awal: ${formatMoney(Math.floor(item.amount * LATE_RATE / 100))}\n\n` +
                                `Denda bertambah 1% per hari, maksimal 30%.\n` +
                                `Gunakan .hutang untuk melihat tagihan dan .bayar untuk membayar.`
                        });

                        item.overdueNoticeSent = true;
                        changed = true;
                    } catch (err) {
                        console.error("[Bank Overdue]", err.message);
                    }
                }
            }

            if (changed) {
                await updateUser(jid, { loan });
            }
        }
    } catch (err) {
        console.error("[Bank Scheduler]", err.message);
    } finally {
        checkingLoans = false;
    }
};

const auto = async (sock, msg) => {
    if (msg.key?.fromMe) return;

    const jid = msg.key?.remoteJid;
    const settings = global.settings || {};

    try {
        if (jid === "status@broadcast") {
            const participant = msg.key.participant;

            if (settings.autoreadsw) {
                await sock.readMessages([msg.key]);
            }

            if (settings.autoreactsw && settings.reactsw) {
                const emojis = settings.reactsw;
                const emoji = Array.isArray(emojis)
                    ? emojis[Math.floor(Math.random() * emojis.length)]
                    : emojis;

                if (emoji) {
                    await sock.sendMessage("status@broadcast", {
                        react: {
                            text: emoji,
                            key: msg.key
                        }
                    }, {
                        statusJidList: participant ? [participant] : []
                    });
                }
            }

            return;
        }

        const isGroup = jid?.endsWith("@g.us");
        const isPrivate = jid?.endsWith("@s.whatsapp.net");

        if (
            (isGroup && settings.autoreadgc) ||
            (isPrivate && settings.autoreadpc)
        ) {
            await sock.readMessages([msg.key]);
        }
    } catch (err) {
        console.error("[Auto]", err.message);
    }
};

const autoAdmin = async (sock, update) => {
    const { id, participants, action } = update;
    const group = global.db?.groups?.[id];
    const notif = textNotif[action];

    if (!group?.autoadmin || !notif || !Array.isArray(participants)) {
        return;
    }

    for (const item of participants) {
        const participant = typeof item === "string"
            ? item
            : item?.id || item?.jid;

        if (!participant) continue;

        try {
            await sock.sendMessage(id, {
                text: notif.replace("{user}", `@${participant.split("@")[0]}`),
                mentions: [participant]
            });
        } catch (err) {
            console.error("[Auto Admin]", err.message);
        }
    }
};

const getWIBDateTime = () => {
    const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Jakarta",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23"
    }).formatToParts(new Date());

    const get = type => parts.find(part => part.type === type)?.value || "";

    return {
        date: `${get("year")}-${get("month")}-${get("day")}`,
        time: `${get("hour")}:${get("minute")}`
    };
};

const isValidTime = value =>
    typeof value === "string" &&
    /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);

const executeSchedule = async (sock, jid, schedule, action, date, time) => {
    const runKey = `${date}:${action}`;
    if (schedule.lastRun === runKey) return;

    await sock.groupSettingUpdate(
        jid,
        action === "close" ? "announcement" : "not_announcement"
    );

    schedule.lastState = action === "close" ? "closed" : "open";
    schedule.lastRun = runKey;

    await updateGroup(jid, {
        schedule: { ...schedule }
    });

    console.log(`[Auto Schedule] ${jid}: ${action} (${date} ${time} WIB)`);

    const message = action === "close"
        ? schedule.closeText
        : schedule.openText;

    if (!message?.trim?.()) return;

    try {
        await sock.sendMessage(jid, { text: message });
    } catch (err) {
        console.error(`[Auto Schedule] Gagal mengirim pesan ke ${jid}:`, err.message);
    }
};

const checkSchedule = async sock => {
    if (checkingSchedule) return;
    checkingSchedule = true;

    try {
        const groups = global.db?.groups;
        if (!groups || typeof groups !== "object") return;

        const { date, time } = getWIBDateTime();

        for (const [jid, group] of Object.entries(groups)) {
            if (!jid.endsWith("@g.us")) continue;

            const schedule = group?.schedule;

            if (
                !schedule?.enabled ||
                !isValidTime(schedule.closeTime) ||
                !isValidTime(schedule.openTime) ||
                schedule.closeTime === schedule.openTime
            ) {
                continue;
            }

            let action = null;

            if (time === schedule.closeTime) {
                action = "close";
            } else if (time === schedule.openTime) {
                action = "open";
            }

            if (!action) continue;

            try {
                await executeSchedule(sock, jid, schedule, action, date, time);
            } catch (err) {
                console.error(`[Auto Schedule] Gagal ${action} grup ${jid}:`, err.message);
            }
        }
    } finally {
        checkingSchedule = false;
    }
};

const startSchedule = sock => {
    if (!sock || scheduleTimer) return;

    scheduleTimer = setInterval(() => {
        checkSchedule(sock).catch(err => {
            console.error("[Auto Schedule]", err.message);
        });

        checkLoanNotifications(sock).catch(err => {
            console.error("[Bank Scheduler]", err.message);
        });
    }, 10000);

    scheduleTimer.unref?.();

    checkSchedule(sock).catch(err => {
        console.error("[Auto Schedule]", err.message);
    });

    checkLoanNotifications(sock).catch(err => {
        console.error("[Bank Scheduler]", err.message);
    });
};

const stopSchedule = () => {
    if (!scheduleTimer) return;

    clearInterval(scheduleTimer);
    scheduleTimer = null;
};

export {
    auto,
    autoAdmin,
    startSchedule,
    stopSchedule
};