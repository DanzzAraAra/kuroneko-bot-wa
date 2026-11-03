/*
 * Dandy
 * DO NOT FOR SALE!
 * Github: github.com/DanzzAraAra
 */
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import chokidar from "chokidar";

const pluginPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "../plugins");
const plugins = new Map();

function getJsFiles(dir) {
    if (!fs.existsSync(dir)) return [];

    return fs.readdirSync(dir, { withFileTypes: true }).flatMap(item => {
        const file = path.join(dir, item.name);

        if (item.isDirectory()) return getJsFiles(file);
        return item.isFile() && file.endsWith(".js") ? [file] : [];
    });
}

async function loadPlugins() {
    fs.mkdirSync(pluginPath, { recursive: true });

    const files = getJsFiles(pluginPath);
    const loaded = new Map();
    let failed = 0;
    let skipped = 0;

    for (const file of files) {
        const relative = path.relative(pluginPath, file);

        try {
            const url = pathToFileURL(file);
            url.searchParams.set("t", Date.now());

            const module = await import(url.href);
            const plugin = module.default || module;

            if (!plugin || typeof plugin !== "object" || !plugin.name) {
                skipped++;
                continue;
            }

            if (typeof plugin.execute !== "function") {
                failed++;
                console.error(`[PLUGIN] ${relative}: execute() tidak ditemukan`);
                continue;
            }

            plugin.__file = file;

            const names = Array.isArray(plugin.name) ? plugin.name : [plugin.name];

            for (const name of names) {
                if (name) loaded.set(String(name).toLowerCase(), plugin);
            }
        } catch (err) {
            failed++;
            console.error(`[PLUGIN] ${relative}: ${err.message}`);
        }
    }

    plugins.clear();

    for (const [name, plugin] of loaded) {
        plugins.set(name, plugin);
    }

    console.log(
        `[PLUGIN] ${new Set(plugins.values()).size}/${files.length} loaded | ${plugins.size} commands` +
        (failed ? ` | ${failed} error` : "") +
        (skipped ? ` | ${skipped} skip` : "")
    );
}

function watchPlugins() {
    fs.mkdirSync(pluginPath, { recursive: true });

    let reloading = false;
    let pending = false;

    async function reload() {
        if (reloading) {
            pending = true;
            return;
        }

        reloading = true;

        try {
            do {
                pending = false;
                await loadPlugins();
            } while (pending);
        } finally {
            reloading = false;
        }
    }

    chokidar.watch(pluginPath, {
        ignoreInitial: true,
        awaitWriteFinish: {
            stabilityThreshold: 500,
            pollInterval: 100
        }
    }).on("all", (event, file) => {
        if (!["add", "change", "unlink"].includes(event) || path.extname(file) !== ".js") {
            return;
        }

        console.log(`[PLUGIN] ${event}: ${path.relative(pluginPath, file)}`);
        reload().catch(err => console.error("[PLUGIN] Reload error:", err.message));
    });
}

export { plugins, loadPlugins, watchPlugins };