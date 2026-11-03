import axios from 'axios';

export default {
    name: ['pindl', 'pinterestdl'],
    limit: 2,
    premium: false,

    execute: async (sock, m, args, settings, commandName, usedPrefix) => {
        const url = args.join(' ').trim();

        if (!url) {
            return m.reply(`*Ex:* ${usedPrefix + commandName} https://pin.it/xxxxx`);
        }

        if (!/^https?:\/\/\S+/i.test(url)) {
            return m.reply('URL Pinterest tidak valid');
        }

        try {
            if (settings?.mess?.wait)
                await m.reply(settings.mess.wait);

            const apiUrl = `${settings.api}/api/download/pinterest?url=${encodeURIComponent(url)}&apikey=${settings.key}`;
            const { data } = await axios.get(apiUrl, { timeout: 60000 });

            if (!data?.status) {
                return m.reply('Media tidak ditemukan');
            }

            const pins = Object.values(data.data || {})
                .map(item => item?.data?.v3GetPinQueryv2?.data)
                .filter(Boolean);

            const pin = pins.find(item =>
                item.images_orig?.url ||
                item.imageLargeUrl ||
                item.storyPinData?.pages?.some(page =>
                    page.blocks?.some(block => block.videoDataV2)
                )
            );

            if (!pin) {
                return m.reply('Data media tidak tersedia');
            }

            const videoBlock = pin.storyPinData?.pages
                ?.flatMap(page => page.blocks || [])
                .find(block => block.videoDataV2);

            const videoData = videoBlock?.videoDataV2;
            const videoUrl =
                videoData?.videoList720P?.v720P?.url ||
                videoData?.videoList?.vHLSV3MOBILE?.url ||
                videoData?.v_hlsv4_video_list?.vHLSV4?.url;

            const imageUrl =
                pin.images_orig?.url ||
                pin.imageLargeUrl ||
                pin.images_736x?.url ||
                pin.images_736?.url;

            const caption = [
                '*[ PINTEREST ]*',
                '',
                `> Judul: ${pin.title || pin.gridTitle || pin.closeupUnifiedTitle || 'Pinterest Media'}`,
                `> Creator: ${pin.pinner?.username || pin.nativeCreator?.username || pin.closeupAttribution?.fullName || '-'}`,
                `> Tipe: ${videoUrl ? 'Video' : 'Gambar'}`
            ].join('\n');

            if (videoUrl && !videoUrl.includes('.m3u8')) {
                await sock.sendMessage(m.chat, {
                    video: { url: videoUrl },
                    mimetype: 'video/mp4',
                    caption
                }, { quoted: m });

                return true;
            }

            if (imageUrl) {
                await sock.sendMessage(m.chat, {
                    image: { url: imageUrl },
                    caption
                }, { quoted: m });

                return true;
            }

            if (videoUrl) {
                await m.reply('Video tersedia dalam format streaming HLS yang belum bisa dikirim langsung sebagai video. Coba gunakan pin gambar atau video lain');
                return false;
            }

            return m.reply('URL media Pinterest tidak ditemukan');
        } catch (err) {
            console.error(err);
            return m.reply(settings?.mess?.error || err.message);
        }
    }
};