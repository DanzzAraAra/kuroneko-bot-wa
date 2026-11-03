import os from "os";
import fs from "fs";

const botStartedAt = Date.now();

const formatDuration = ms => {
    const seconds = Math.floor(ms / 1000);
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor(seconds % 86400 / 3600);
    const minutes = Math.floor(seconds % 3600 / 60);
    const secs = seconds % 60;

    if (days) return `${days}d ${hours}h ${minutes}m ${secs}s`;
    if (hours) return `${hours}h ${minutes}m ${secs}s`;
    if (minutes) return `${minutes}m ${secs}s`;
    return `${secs}s`;
};

const formatBytes = bytes => {
    if (bytes < 1024) return `${bytes} B`;

    const units = ["KB", "MB", "GB", "TB"];
    let value = bytes;
    let i = -1;

    while (value >= 1024 && i < units.length - 1) {
        value /= 1024;
        i++;
    }

    return `${value.toFixed(2)} ${units[i]}`;
};

const getRAMUsage = () => {
    try {
        const data = fs.readFileSync("/proc/meminfo", "utf8");
        const total = Number(data.match(/MemTotal:\s+(\d+)/)?.[1] || 0) * 1024;
        const available = Number(data.match(/MemAvailable:\s+(\d+)/)?.[1] || 0) * 1024;

        if (!total) return ["Unavailable", "Unavailable"];

        return [
            formatBytes(total),
            formatBytes(total - available)
        ];
    } catch {
        return ["Unavailable", "Unavailable"];
    }
};

const getVPSUptime = () => {
    try {
        const seconds = Number(fs.readFileSync("/proc/uptime", "utf8").split(" ")[0]);
        return formatDuration(seconds * 1000);
    } catch {
        return "Unavailable";
    }
};

const getCPU = () => {
    try {
        const data = fs.readFileSync("/proc/cpuinfo", "utf8");
        return data.match(/model name\s*:\s*(.+)/)?.[1]?.trim() || os.arch();
    } catch {
        return os.arch();
    }
};

export default {
    name: ["ping"],

    execute: async (sock, m) => {
        const start = Date.now();
        const memory = process.memoryUsage();
        const [totalRAM, usedRAM] = getRAMUsage();
        const uptime = formatDuration(Date.now() - botStartedAt);

        const output = `*PONG!*

*Response*
├ Latency: ${Date.now() - Number(m.messageTimestamp) * 1000} ms
└ Status: Online

*Bot*
├ Uptime: ${uptime}
├ Started: ${new Date(botStartedAt).toLocaleString("id-ID")}
├ Node.js: ${process.version}
├ Platform: ${process.platform}
├ Architecture: ${process.arch}
├ PID: ${process.pid}
├ Heap Used: ${formatBytes(memory.heapUsed)}
└ Heap Allocated: ${formatBytes(memory.heapTotal)}

*Server*
├ Hostname: ${os.hostname()}
├ OS: ${os.type()} ${os.release()}
├ Architecture: ${os.arch()}
├ CPU: ${getCPU()}
├ RAM Used: ${usedRAM}
├ RAM Total: ${totalRAM}
└ Uptime: ${getVPSUptime()}`;

        return m.reply(output);
    }
};