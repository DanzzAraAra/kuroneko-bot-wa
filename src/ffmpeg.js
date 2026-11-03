/*
 * Dandy
 * DO NOT FOR SALE!
 * Github: github.com/DanzzAraAra
 */
import ff from "fluent-ffmpeg";
import { PassThrough } from "stream";

ff.setFfmpegPath("/usr/bin/ffmpeg");

const runFFmpeg = (inputBuffer, setup) => new Promise((resolve, reject) => {
    const input = new PassThrough();
    const output = new PassThrough();
    const chunks = [];

    input.end(inputBuffer);

    output.on("data", chunk => chunks.push(chunk));
    output.on("error", reject);
    output.on("end", () => resolve(Buffer.concat(chunks)));

    const command = setup(ff(input));

    command
        .on("error", reject)
        .pipe(output);
});

const processMedia = (inputBuffer, args = [], format = "ogg") => runFFmpeg(
    inputBuffer,
    command => {
        if (format === "ogg") {
            command
                .audioCodec("libopus")
                .outputOptions([
                    "-vn",
                    "-b:a 64k",
                    "-ac 2",
                    "-ar 48000",
                    ...args
                ]);
        } else {
            command.outputOptions(args);
        }

        return command.format(format);
    }
);

const generateWaveform = inputBuffer => new Promise((resolve, reject) => {
    const input = new PassThrough();
    const chunks = [];

    input.end(inputBuffer);

    ff(input)
        .audioChannels(1)
        .audioFrequency(16000)
        .format("s16le")
        .on("error", reject)
        .on("end", () => {
            const raw = Buffer.concat(chunks);
            const amplitudes = [];

            for (let i = 0; i + 1 < raw.length; i += 2) {
                amplitudes.push(Math.abs(raw.readInt16LE(i)) / 32768);
            }

            const bars = 64;
            const blockSize = Math.max(1, Math.ceil(amplitudes.length / bars));
            const averages = [];

            for (let i = 0; i < bars; i++) {
                const start = i * blockSize;
                const block = amplitudes.slice(start, start + blockSize);

                const average = block.length
                    ? block.reduce((sum, value) => sum + value, 0) / block.length
                    : 0;

                averages.push(average);
            }

            const max = Math.max(...averages, 1);
            const waveform = averages.map(value => Math.floor(value / max * 100));

            resolve(Buffer.from(waveform).toString("base64"));
        })
        .pipe()
        .on("data", chunk => chunks.push(chunk));
});

const convertToOpus = inputBuffer => runFFmpeg(
    inputBuffer,
    command => command
        .noVideo()
        .audioCodec("libopus")
        .format("ogg")
        .audioBitrate("48k")
        .audioChannels(1)
        .audioFrequency(48000)
        .outputOptions([
            "-map_metadata", "-1",
            "-application", "voip",
            "-compression_level", "10",
            "-page_duration", "20000"
        ])
);

const getAudioDuration = inputBuffer => new Promise((resolve, reject) => {
    const input = new PassThrough();
    input.end(inputBuffer);

    ff(input).ffprobe((error, data) => {
        if (error) return reject(error);

        resolve(data.format.duration || 1);
    });
});

const convertForPTT = async inputBuffer => {
    const [audio, waveform, duration] = await Promise.all([
        convertToOpus(inputBuffer),
        generateWaveform(inputBuffer),
        getAudioDuration(inputBuffer)
    ]);

    return {
        audio,
        waveform,
        duration: Math.round(duration)
    };
};

const prepareAudioMessage = async (audioBuffer, ptt = true) => {
    const audio = await convertToOpus(audioBuffer);

    if (!ptt) {
        return {
            audio,
            mimetype: "audio/ogg; codecs=opus",
            ptt: false
        };
    }

    const [waveform, duration] = await Promise.all([
        generateWaveform(audioBuffer),
        getAudioDuration(audioBuffer)
    ]);

    return {
        audio,
        mimetype: "audio/ogg; codecs=opus",
        ptt: true,
        waveform,
        seconds: Math.round(duration)
    };
};

export {
    processMedia,
    generateWaveform,
    convertToOpus,
    convertForPTT,
    getAudioDuration,
    prepareAudioMessage
};