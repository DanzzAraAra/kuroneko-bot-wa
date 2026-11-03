/*
 * Dandy
 * DO NOT FOR SALE!
 * Github: github.com/DanzzAraAra
 */
import fs from "node:fs";
import Crypto from "node:crypto";
import path from "node:path";
import ff from "fluent-ffmpeg";
import webp from "node-webpmux";

const temp = process.platform === "win32" ? process.env.TEMP : "/tmp";

const tempFile = ext =>
    path.join(temp, `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.${ext}`);

const convertToWebp = (media, options = []) => {
    const input = tempFile(media?.ext || "png");
    const output = tempFile("webp");

    fs.writeFileSync(input, media.data);

    return new Promise((resolve, reject) => {
        ff(input)
            .addOutputOptions([
                "-vcodec", "libwebp",
                "-vf", "scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15,pad=320:320:-1:-1:color=white@0.0,split[a][b];[a]palettegen=reserve_transparent=on:transparency_color=000000[p];[b][p]paletteuse",
                ...options
            ])
            .toFormat("webp")
            .on("error", async error => {
                await Promise.allSettled([
                    fs.promises.unlink(input),
                    fs.promises.unlink(output)
                ]);
                reject(error);
            })
            .on("end", async () => {
                try {
                    const buffer = await fs.promises.readFile(output);
                    await Promise.allSettled([
                        fs.promises.unlink(input),
                        fs.promises.unlink(output)
                    ]);
                    resolve(buffer);
                } catch (error) {
                    reject(error);
                }
            })
            .saveToFile(output);
    });
};

const imageToWebp = media =>
    convertToWebp(media);

const videoToWebp = media =>
    convertToWebp(media, [
        "-loop", "0",
        "-ss", "00:00:00",
        "-t", "00:00:05",
        "-preset", "default",
        "-an",
        "-vsync", "0"
    ]);

const writeExif = async (media, metadata = {}) => {
    let wMedia;

    if (/webp/.test(media.mimetype)) {
        wMedia = media.data;
    } else if (/image/.test(media.mimetype)) {
        wMedia = await imageToWebp(media);
    } else if (/video/.test(media.mimetype)) {
        wMedia = await videoToWebp(media);
    } else {
        return;
    }

    const json = {
    "sticker-pack-id": metadata.packId || "com.whatsapp.sticker_pack",
    "sticker-pack-name": metadata.packName || "",
    "sticker-pack-publisher": metadata.packPublish || "",
    "android-app-store-link": metadata.androidApp || "null",
    "ios-app-store-link": metadata.iOSApp || "null",
    emojis: metadata.emojis || ["😋", "😎", "🤣", "😂", "😁"],
    "is-ai-sticker": metadata.isAiSticker ?? 0,
    "premium": metadata.premium ?? 0
};

    const exifAttr = Buffer.from([
        0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00,
        0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x16, 0x00, 0x00, 0x00
    ]);

    const jsonBuff = Buffer.from(JSON.stringify(json));
    const exif = Buffer.concat([exifAttr, jsonBuff]);

    exif.writeUIntLE(jsonBuff.length, 14, 4);

    const img = new webp.Image();
    await img.load(wMedia);
    img.exif = exif;

    return img.save(null);
};

export {
    writeExif,
    videoToWebp,
    imageToWebp
};