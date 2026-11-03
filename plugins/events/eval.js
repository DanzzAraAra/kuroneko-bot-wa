import util from "util";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const MAX_LENGTH = 60000;

const sendResult = async (sock, m, result, filename = "output.txt") => {
    const output = typeof result === "string"
        ? result
        : util.inspect(result, {
            depth: null,
            colors: false,
            maxArrayLength: null,
            maxStringLength: null
        });

    if (output.length <= MAX_LENGTH) {
        await sock.sendMessage(m.from, {
            text: output || "undefined"
        }, { quoted: m });

        return;
    }

    await sock.sendMessage(m.from, {
        document: Buffer.from(output, "utf-8"),
        mimetype: "text/plain",
        fileName: filename,
        caption: `Output berhasil dibuat menjadi file.\nUkuran: ${(Buffer.byteLength(output, "utf-8") / 1024).toFixed(2)} KB`
    }, { quoted: m });
};

export default {
    name: ["eval", "shell"],

    execute: async (sock, m, args, settings, commandName, prefix, store) => {
        if (!m.isOwner) return false;

        const input = args.join(" ").trim();
        if (!input) return false;

        try {
            if (commandName === "eval") {
                const code = /^(?:return\b|throw\b|if\b|for\b|while\b|switch\b|try\b|const\b|let\b|var\b|class\b|function\b|;)/.test(input)
                    ? input
                    : `return (${input});`;

                const fn = new AsyncFunction(
                    "sock",
                    "m",
                    "args",
                    "settings",
                    "util",
                    "store",
                    code
                );

                const result = await fn(sock, m, args, settings, util, store);

                await sendResult(sock, m, result, "eval-output.txt");
                return true;
            }

            if (commandName === "shell") {
                try {
                    const { stdout, stderr } = await execAsync(input, {
                        timeout: 30000,
                        maxBuffer: 50 * 1024 * 1024,
                        encoding: "utf8"
                    });

                    await sendResult(
                        sock,
                        m,
                        stdout || stderr || "Done",
                        "shell-output.txt"
                    );

                    return true;
                } catch (err) {
                    const output = [
                        err.stdout,
                        err.stderr,
                        err.message
                    ].filter(Boolean).join("\n\n");

                    await sendResult(
                        sock,
                        m,
                        output || util.format(err),
                        "shell-error.txt"
                    );

                    return false;
                }
            }

            return false;
        } catch (err) {
            await sendResult(
                sock,
                m,
                util.format(err),
                `${commandName}-error.txt`
            );

            return false;
        }
    }
};