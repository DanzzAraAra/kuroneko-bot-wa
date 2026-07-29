/*
   * Dandy
   * DO NOT FOR SALE!
   * Github: github.com/DanzzAraAra
*/
const ff = require("fluent-ffmpeg")
const { PassThrough } = require("stream")

ff.setFfmpegPath("/usr/bin/ffmpeg")

const processMedia = (inputBuffer, args = [], format = "ogg") => {
  return new Promise((resolve, reject) => {
    const inputStream = new PassThrough()
    inputStream.end(inputBuffer)

    const outputStream = new PassThrough()
    const chunks = []

    const command = ff(inputStream)

    if (format === "ogg") {
      command.audioCodec("libopus")
      command.outputOptions([
        "-vn",
        "-b:a 64k",
        "-ac 2",
        "-ar 48000",
        ...args
      ])
    } else {
      command.outputOptions(args).format(format)
    }

    command
      .format(format)
      .on("error", reject)
      .on("end", () => resolve(Buffer.concat(chunks)))
      .pipe(outputStream, { end: true })

    outputStream.on("data", chunk => chunks.push(chunk))
  })
}

const generateWaveform = (inputBuffer, bars = 64) => {
  return new Promise((resolve, reject) => {
    const inputStream = new PassThrough()
    inputStream.end(inputBuffer)

    const chunks = []

    ff(inputStream)
      .audioChannels(1)
      .audioFrequency(16000)
      .format("s16le")
      .on("error", reject)
      .on("end", () => {
        const rawData = Buffer.concat(chunks)
        const samples = rawData.length / 2

        const amplitudes = []
        for (let i = 0; i < samples; i++) {
          let val = rawData.readInt16LE(i * 2)
          amplitudes.push(Math.abs(val) / 32768)
        }

        let blockSize = Math.floor(amplitudes.length / bars)
        let avg = []
        for (let i = 0; i < bars; i++) {
          let block = amplitudes.slice(i * blockSize, (i + 1) * blockSize)
          avg.push(block.reduce((a, b) => a + b, 0) / block.length)
        }

        let max = Math.max(...avg)
        let normalized = avg.map(v => Math.floor((v / max) * 100))

        let buf = Buffer.from(new Uint8Array(normalized))
        resolve(buf.toString("base64"))
      })
      .pipe()
      .on("data", chunk => chunks.push(chunk))
  })
}

const convertToOpus = (inputBuffer) => {
  return new Promise((resolve, reject) => {
    const inStream = new PassThrough()
    const outStream = new PassThrough()
    const chunks = []

    inStream.end(inputBuffer)

    ff(inStream)
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
      .on("error", reject)
      .on("end", () => resolve(Buffer.concat(chunks)))
      .pipe(outStream, { end: true })

    outStream.on("data", c => chunks.push(c))
  })
}

const convertForPTT = async (inputBuffer) => {
    const audioBuffer = await convertToOpus(inputBuffer)
    const waveform = await generateWaveform(inputBuffer)
    const duration = await getAudioDuration(inputBuffer)
    
    return {
      audio: audioBuffer,
      waveform: waveform,
      duration: Math.round(duration)
    }
}

const getAudioDuration = (inputBuffer) => {
  return new Promise((resolve, reject) => {
    const inputStream = new PassThrough()
    inputStream.end(inputBuffer)

    ff(inputStream)
      .ffprobe((err, data) => {
        if (err) reject(err)
        else resolve(data.format.duration || 1)
      })
  })
}

const prepareAudioMessage = async (audioBuffer, ptt = true) => {
  try {
    if (ptt) {
      const { audio, waveform, duration } = await convertForPTT(audioBuffer)
      return {
        audio: audio,
        mimetype: 'audio/ogg; codecs=opus',
        ptt: true,
        waveform: waveform,
        seconds: duration
      }
    } else {
      const audio = await convertToOpus(audioBuffer)
      return {
        audio: audio,
        mimetype: 'audio/ogg; codecs=opus',
        ptt: false
      }
    }
  } catch (error) {
    console.error('Error preparing audio message:', error)
    const audio = await convertToOpus(audioBuffer)
    return {
      audio: audio,
      mimetype: 'audio/ogg; codecs=opus',
      ptt: ptt,
      seconds: 1
    }
  }
}

module.exports = {
  processMedia,
  generateWaveform,
  convertToOpus,
  convertForPTT,
  getAudioDuration,
  prepareAudioMessage
}