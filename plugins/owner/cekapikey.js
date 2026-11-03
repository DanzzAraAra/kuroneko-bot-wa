export default {
    name: ["cekapikey"],
    owner: true,

    execute: async (sock, m, args, settings) => {
        const reply = text => m.reply(text);
        if (!m.isOwner) return reply(settings.mess.owner);
        try {
            const url = `${settings.api}/api/info/cekapikey?apikey=${encodeURIComponent(settings.key)}`;
            const response = await fetch(url);
            const result = await response.json();

            if (!response.ok || !result.status) {
                return reply(result.message);
            }
            return reply(
                `*API KEY INFORMATION*\n\n` +
                `> Name: ${result.result.name}\n` +
                `> Role: ${result.result.role}\n` +
                `> Limit: ${result.result.limit}\n` +
                `> Usage: ${result.result.usage}\n` +
                `> Sisa Hari: ${result.result.sisa_hari}`
            );
        } catch (err) {
            return reply(settings?.mess?.error || err.message);
        }
    }
};