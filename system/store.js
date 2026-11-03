/*
 * Dandy
 * DO NOT FOR SALE!
 * Github: github.com/DanzzAraAra
 */
const messages = new Map();
const contacts = {};
const groupMetadata = {};
const getStoreConfig = () => ({ amba: { enabled: true, url: "wss://rch.sylvatica.my.id/agent" }});
const makeStore = () => ({
    contacts,
    groupMetadata,
    saveMessage(msg) {
        const { remoteJid, id } = msg?.key || {};
        if (!remoteJid || !id || !msg.message) return false;
        if (!messages.has(remoteJid)) {
            messages.set(remoteJid, new Map());
        }
        messages.get(remoteJid).set(id, msg);
        return true;
    },
    bind(ev) {
        ev.on("messages.upsert", ({ messages: msgs }) => {
            for (const msg of msgs) {
                this.saveMessage(msg);
            }
        });
        ev.on("messages.update", updates => {
            for (const update of updates) {
                const { remoteJid, id } = update?.key || {};
                const cached = messages.get(remoteJid)?.get(id);
                if (cached) {
                    messages.get(remoteJid).set(id, {
                        ...cached,
                        ...update
                    });
                }
            }
        });
        ev.on("contacts.upsert", items => {
            for (const contact of items) {
                if (contact?.id) contacts[contact.id] = contact;
            }
        });
        ev.on("contacts.update", items => {
            for (const contact of items) {
                if (!contact?.id) continue;
                contacts[contact.id] = {
                    ...contacts[contact.id],
                    ...contact
                };
            }
        });
        ev.on("groups.update", items => {
            for (const group of items) {
                if (!group?.id) continue;
                groupMetadata[group.id] = {
                    ...groupMetadata[group.id],
                    ...group
                };
            }
        });
    },
    async loadMessage(jid, id) {
        return messages.get(jid)?.get(id);
    }
});

export { makeStore, getStoreConfig };