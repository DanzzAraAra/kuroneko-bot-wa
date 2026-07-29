/*
   * Dandy
   * DO NOT FOR SALE!
   * Github: github.com/DanzzAraAra
*/
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const chokidar = require('chokidar');

const plugins = new Map();
const pluginPath = path.join(__dirname, '../plugins');

const getJsFiles = (dir) => {
    let files = [];
    const items = fs.readdirSync(dir, { withFileTypes: true });

    for (const item of items) {
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory()) {
            files = files.concat(getJsFiles(fullPath));
        } else if (item.name.endsWith('.js')) {
            files.push(fullPath);
        }
    }
    return files;
};

const loadPlugins = () => {
    if (!fs.existsSync(pluginPath)) {
        fs.mkdirSync(pluginPath, { recursive: true });
    }

    const files = getJsFiles(pluginPath);
    plugins.clear();

    for (const file of files) {
        try {
            const fullPath = require.resolve(file);
            delete require.cache[fullPath]; 
            const plugin = require(fullPath);

            if (!plugin || typeof plugin !== 'object' || !plugin.name) continue;

            const pluginNames = Array.isArray(plugin.name) ? plugin.name : [plugin.name];
            for (const name of pluginNames) {
                plugins.set(name, plugin);
            }
        } catch (error) {
            console.error(chalk.red(`[ERROR PLUGIN] Gagal memuat ${path.basename(file)}:`), error.message);
        }
    }

    console.log(chalk.greenBright(`[INFO] Berhasil memuat ${plugins.size} command dari folder plugins.`));
};

const watchPlugins = () => {
    chokidar.watch(pluginPath, {
        persistent: true,
        ignoreInitial: true,
        awaitWriteFinish: {
            stabilityThreshold: 500, // Tunggu file selesai disave sempurna
            pollInterval: 100
        }
    }).on('all', (event, filePath) => {
        if (!filePath.endsWith('.js')) return;

        const file = path.basename(filePath);

        if (event === 'unlink') {
            console.log(chalk.yellow(`[PLUGIN] File ${file} dihapus.`));
        } else if (event === 'change' || event === 'add') {
            console.log(chalk.blue(`[PLUGIN] File ${file} diperbarui.`));
        }
        loadPlugins();
    });
};

module.exports = {
    plugins,
    loadPlugins,
    watchPlugins
};