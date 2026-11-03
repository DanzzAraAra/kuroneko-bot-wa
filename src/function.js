import { downloadContentFromMessage } from 'baileys';

const mediaTypes = {
    imageMessage: 'image',
    stickerMessage: 'sticker',
    videoMessage: 'video',
    ptvMessage: 'video',
    audioMessage: 'audio',
    documentMessage: 'document'
};

const wrappers = [
    'ephemeralMessage',
    'viewOnceMessage',
    'viewOnceMessageV2',
    'viewOnceMessageV2Extension',
    'documentWithCaptionMessage'
];

const getMessage = message => {
    while (message) {
        const wrapper = wrappers.find(key => message[key]?.message);
        if (!wrapper) break;
        message = message[wrapper].message;
    }

    return message;
};

const detectType = quoted => {
    const mtype = (quoted?.mtype || quoted?.type || '')
        .replace(/Message$/i, '')
        .toLowerCase();

    const mime = quoted?.mimetype || quoted?.msg?.mimetype || '';

    if (mtype === 'ptv') return 'video';
    if (['image', 'sticker', 'video', 'audio', 'document'].includes(mtype)) {
        return mtype;
    }

    if (mime.startsWith('image/')) return 'image';
    if (mime.startsWith('video/')) return 'video';
    if (mime.startsWith('audio/')) return 'audio';
    if (mime) return 'document';

    return null;
};

export const getMedia = quoted => {
    const message = getMessage(quoted?.message || quoted);

    if (message) {
        const key = Object.keys(mediaTypes).find(key => message[key]);

        if (key) {
            return {
                type: mediaTypes[key],
                media: message[key]
            };
        }
    }

    const type = detectType(quoted);
    const media = quoted?.msg || quoted?.message?.msg;

    if (type && media) {
        return { type, media };
    }

    return null;
};

export const getMediaType = quoted => {
    return getMedia(quoted)?.type || detectType(quoted);
};

export const downloadMedia = async quoted => {
    if (!quoted) {
        throw new Error('Pesan media tidak ditemukan');
    }

    if (typeof quoted.download === 'function') {
        try {
            const buffer = await quoted.download();

            if (buffer?.length) return Buffer.from(buffer);
        } catch {}
    }

    const result = getMedia(quoted);

    if (!result?.media || !result.type) {
        throw new Error('Media tidak ditemukan atau tidak didukung');
    }

    const stream = await downloadContentFromMessage(
        result.media,
        result.type
    );

    const chunks = [];

    for await (const chunk of stream) {
        chunks.push(chunk);
    }

    const buffer = Buffer.concat(chunks);

    if (!buffer.length) {
        throw new Error('Gagal mengunduh media');
    }

    return buffer;
};

export const attachFunctions = sock => {
    sock.downloadMedia = downloadMedia;
    sock.getMediaType = getMediaType;
    sock.getMedia = getMedia;

    return sock;
};