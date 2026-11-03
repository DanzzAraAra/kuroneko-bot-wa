/*
 * Dandy
 * DO NOT FOR SALE!
 * Github: github.com/DanzzAraAra
 */
import readline from "node:readline";
import fs from "node:fs/promises";
import path from "node:path";
import mongoose from "mongoose";
import chalk from "chalk";
import {
    saveDB,
    switchDB,
    configureDatabase,
    getDatabaseStatus,
    getDatabaseStats,
    listRecords,
    searchRecords,
    getRecord,
    updateRecord,
    updateUserData,
    deleteRecord,
    exportRecords
} from "../src/database.js";

let terminal;
let dbMode = false;
let pendingConfirm = null;
let closing = false;

const pageSize = 10;

const color = {
    title: chalk.cyanBright,
    success: chalk.green,
    error: chalk.red,
    info: chalk.gray,
    warning: chalk.yellow
};

const printTitle = title => {
    console.log(`\n${color.title(`━━ ${title} ━━`)}`);
};

const printHelp = () => {
    printTitle("KuroNeko CLI");
    console.log(`
  ${chalk.cyan("/help")}       Show available commands
  ${chalk.cyan("/db")}         Open database manager
  ${chalk.cyan("/setdb")}      Configure database backend
  ${chalk.cyan("/status")}     Show bot process and database status
  ${chalk.cyan("/plugins")}    List plugin files
  ${chalk.cyan("/clear")}      Clear terminal
  ${chalk.cyan("/exit")}       Stop the bot

  ${color.info("Use /db to manage users and groups.")}
`);
};

const printDBHelp = () => {
    printTitle("Database Manager");
    console.log(`
  ${chalk.cyan("help")}                         Show database commands
  ${chalk.cyan("stats")}                        Show database statistics
  ${chalk.cyan("users [page]")}                 List users
  ${chalk.cyan("groups [page]")}                List groups
  ${chalk.cyan("search <keyword>")}              Search users and groups
  ${chalk.cyan("user <jid>")}                   Show user details
  ${chalk.cyan("group <jid>")}                  Show group details
  ${chalk.cyan("role <jid> <role>")}            Change user role
  ${chalk.cyan("ban <jid>")}                    Ban a user
  ${chalk.cyan("unban <jid>")}                  Unban a user
  ${chalk.cyan("set <jid> <field> <value>")}    Edit a user field
  ${chalk.cyan("delete <jid>")}                 Delete a user or group
  ${chalk.cyan("export users")}                 Export users to JSON
  ${chalk.cyan("export groups")}               Export groups to JSON
  ${chalk.cyan("save")}                         Save Local database
  ${chalk.cyan("back")}                         Return to main CLI
`);
};

const printSetDBHelp = () => {
    printTitle("Database Configuration");
    console.log(`
  ${chalk.cyan("/setdb status")}                         Show database configuration
  ${chalk.cyan("/setdb local")}                          Switch to Local
  ${chalk.cyan("/setdb mongodb")}                        Switch to MongoDB
  ${chalk.cyan("/setdb local path <path>")}              Change Local directory
  ${chalk.cyan("/setdb local autosave <true|false>")}    Toggle Local autosave
  ${chalk.cyan("/setdb local pretty <true|false>")}      Toggle JSON formatting
  ${chalk.cyan("/setdb mongodb uri <uri>")}              Set MongoDB URI

  ${color.info("Switching backend does not copy or migrate data.")}
`);
};

const setPrompt = () => {
    if (!terminal || closing) return;

    terminal.setPrompt(
        dbMode ? chalk.green("KuroNeko:db > ") : chalk.cyan("KuroNeko > ")
    );

    terminal.prompt();
};

const normalizeJid = jid => {
    const value = jid?.trim();
    if (!value) return "";

    return value.includes("@")
        ? value
        : `${value.replace(/\D/g, "")}@s.whatsapp.net`;
};

const normalizeGroupJid = jid => {
    const value = jid?.trim();
    if (!value) return "";

    return value.includes("@")
        ? value
        : `${value.replace(/\D/g, "")}@g.us`;
};

const parseValue = value => {
    if (value === "true") return true;
    if (value === "false") return false;
    if (value === "null") return null;

    if (value !== "" && !Number.isNaN(Number(value))) {
        return Number(value);
    }

    return value;
};

const printJSON = data => {
    console.log(JSON.stringify(data, null, 2));
};

const showDatabaseStatus = () => {
    const status = getDatabaseStatus();

    printTitle("Database Configuration");
    console.log(`Mode       : ${status.mode.toUpperCase()}`);
    console.log(`Local Path : ${status.local.path}`);
    console.log(`Autosave   : ${status.local.autosave}`);
    console.log(`Pretty JSON: ${status.local.pretty}`);
    console.log(`Mongo URI  : ${status.mongodb.configured ? "Configured" : "Not configured"}`);
    console.log(`MongoDB    : ${
        status.mongodb.connected
            ? color.success("Connected")
            : color.error("Disconnected")
    }`);
};

const handleSetDB = async args => {
    const [target, option, ...values] = args;
    const value = values.join(" ");

    if (!target || target === "help") {
        printSetDBHelp();
        return;
    }

    if (target === "status") {
        showDatabaseStatus();
        return;
    }

    if (target === "local" || target === "mongodb") {
        if (!option) {
            await switchDB(target);
            showDatabaseStatus();
            return;
        }

        if (target === "local" && ["path", "autosave", "pretty"].includes(option)) {
            if (!value) {
                console.log(color.warning(`Gunakan: /setdb local ${option} <value>`));
                return;
            }

            const status = await configureDatabase(option, value);
            console.log(color.success(`Pengaturan Local ${option} berhasil diperbarui.`));
            printJSON(status.local);
            return;
        }

        if (target === "mongodb" && option === "uri") {
            if (!value) {
                console.log(color.warning("Gunakan: /setdb mongodb uri <uri>"));
                return;
            }

            await configureDatabase("uri", value);
            console.log(color.success("MongoDB URI berhasil diperbarui."));
            return;
        }
    }

    console.log(color.error("Pengaturan database tidak dikenal."));
    printSetDBHelp();
};

const showStats = async () => {
    const stats = await getDatabaseStats();
    const status = getDatabaseStatus();

    printTitle("Database Statistics");
    console.log(`Mode    : ${status.mode.toUpperCase()}`);
    console.log(`Users   : ${stats.users}`);
    console.log(`Groups  : ${stats.groups}`);
    console.log(`Banned  : ${stats.banned}`);
    console.log(`Premium : ${stats.premium}`);
    console.log(`MongoDB : ${
        status.mongodb.connected
            ? color.success("Connected")
            : color.error("Disconnected")
    }`);
};

const listDBRecords = async (type, page = 1) => {
    const result = await listRecords(type, page, pageSize);
    const { records, total, pages } = result;

    if (!Number.isInteger(page) || page < 1 || page > pages) {
        console.log(color.error(`Page tidak tersedia. Total halaman: ${pages}`));
        return;
    }

    printTitle(`${type.toUpperCase()} (${total})`);

    if (!records.length) {
        console.log(color.info("Data masih kosong."));
        return;
    }

    records.forEach((record, index) => {
        const number = (page - 1) * pageSize + index + 1;

        if (type === "users") {
            console.log(
                `${number}. ${record.name || "Unknown"} | ${record.jid} | role=${record.role || "user"} | banned=${Boolean(record.banned)}`
            );
            return;
        }

        console.log(
            `${number}. ${record.jid} | antilink=${Boolean(record.antilink)} | mute=${Boolean(record.mute)}`
        );
    });

    console.log(color.info(
        `Page ${page}/${pages} | Gunakan ${type} ${page + 1} untuk halaman berikutnya.`
    ));
};

const searchDBRecords = async keyword => {
    if (!keyword) {
        console.log(color.warning("Gunakan: search <keyword>"));
        return;
    }

    const { users, groups } = await searchRecords(keyword);

    printTitle("Search Results");
    console.log(color.title(`Users (${users.length})`));

    if (!users.length) console.log(color.info("Tidak ada user ditemukan."));

    users.forEach(user => {
        console.log(`- ${user.name || "Unknown"} | ${user.jid} | role=${user.role || "user"}`);
    });

    console.log(color.title(`Groups (${groups.length})`));

    if (!groups.length) console.log(color.info("Tidak ada grup ditemukan."));

    groups.forEach(group => console.log(`- ${group.jid}`));
};

const showRecord = async (type, input) => {
    const jid = type === "users"
        ? normalizeJid(input)
        : normalizeGroupJid(input);

    if (!jid) {
        console.log(color.warning(`Gunakan: ${type === "users" ? "user" : "group"} <jid>`));
        return;
    }

    const record = await getRecord(type, jid);

    if (!record) {
        console.log(color.error("Data tidak ditemukan."));
        return;
    }

    printTitle(type === "users" ? "User Details" : "Group Details");
    printJSON(record);
};

const updateUserField = async (jidInput, field, rawValue) => {
    const jid = normalizeJid(jidInput);

    if (!jid || !field || rawValue === undefined) {
        console.log(color.warning("Gunakan: set <jid> <field> <value>"));
        return;
    }

    try {
        const updated = await updateRecord(
            "users",
            jid,
            field,
            parseValue(rawValue)
        );

        if (!updated) {
            console.log(color.error("User tidak ditemukan."));
            return;
        }

        console.log(color.success(`Field ${field} berhasil diperbarui.`));
        printJSON({ [field]: updated[field] });
    } catch (err) {
        console.log(color.error(`Gagal mengubah field: ${err.message}`));
    }
};

const updateRole = async (jidInput, role) => {
    const jid = normalizeJid(jidInput);

    if (!jid || !role) {
        console.log(color.warning("Gunakan: role <jid> <role>"));
        return;
    }

    const updated = await updateUserData(jid, { role });

    if (!updated) {
        console.log(color.error("User tidak ditemukan."));
        return;
    }

    console.log(color.success(`Role ${jid} berhasil diubah menjadi ${role}.`));
};

const setBanned = async (jidInput, banned) => {
    const jid = normalizeJid(jidInput);

    if (!jid) {
        console.log(color.warning(`Gunakan: ${banned ? "ban" : "unban"} <jid>`));
        return;
    }

    const updated = await updateUserData(jid, { banned });

    if (!updated) {
        console.log(color.error("User tidak ditemukan."));
        return;
    }

    console.log(color.success(
        `${jid} ${banned ? "berhasil di-ban" : "berhasil di-unban"}.`
    ));
};

const askConfirmation = (message, callback) => {
    pendingConfirm = callback;
    console.log(
        `${color.warning(message)} ${chalk.white("Ketik YES untuk melanjutkan atau NO untuk membatalkan.")}`
    );
};

const deleteDBRecord = async input => {
    if (!input?.trim()) {
        console.log(color.warning("Gunakan: delete <jid>"));
        return;
    }

    let jid = input.trim();
    const type = jid.endsWith("@g.us") ? "groups" : "users";

    jid = type === "groups"
        ? normalizeGroupJid(jid)
        : normalizeJid(jid);

    const record = await getRecord(type, jid);

    if (!record) {
        console.log(color.error("Data tidak ditemukan."));
        return;
    }

    askConfirmation(`Hapus ${type === "groups" ? "group" : "user"} ${jid}?`, async answer => {
        if (answer !== "YES") {
            console.log(color.info("Penghapusan dibatalkan."));
            return;
        }

        const deleted = await deleteRecord(type, jid);

        console.log(
            deleted
                ? color.success(`${jid} berhasil dihapus.`)
                : color.error("Data gagal dihapus.")
        );
    });
};

const exportDBRecords = async type => {
    if (!["users", "groups"].includes(type)) {
        console.log(color.warning("Gunakan: export users atau export groups"));
        return;
    }

    const records = await exportRecords(type);
    const filename = `${type}-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
    const filepath = path.resolve(process.cwd(), filename);

    await fs.writeFile(filepath, JSON.stringify(records, null, 2));

    console.log(color.success(
        `Berhasil mengekspor ${records.length} data ke ${filepath}`
    ));
};

const listPlugins = async () => {
    const root = path.resolve(process.cwd(), "plugins");

    const walk = async directory => {
        let entries;

        try {
            entries = await fs.readdir(directory, { withFileTypes: true });
        } catch {
            return [];
        }

        const files = [];

        for (const entry of entries) {
            const fullPath = path.join(directory, entry.name);

            if (entry.isDirectory()) {
                files.push(...await walk(fullPath));
            } else if (entry.isFile() && entry.name.endsWith(".js")) {
                files.push(path.relative(root, fullPath));
            }
        }

        return files;
    };

    const files = (await walk(root)).sort();

    printTitle(`Plugins (${files.length})`);

    if (!files.length) {
        console.log(color.info("Tidak ada file plugin ditemukan."));
        return;
    }

    files.forEach(file => console.log(`- ${file}`));
};

const runDBCommand = async input => {
    const [command, ...args] = input.trim().split(/\s+/);

    switch (command?.toLowerCase()) {
        case "help":
            printDBHelp();
            break;

        case "stats":
            await showStats();
            break;

        case "users":
        case "groups":
            await listDBRecords(command.toLowerCase(), Number(args[0] || 1));
            break;

        case "search":
            await searchDBRecords(args.join(" "));
            break;

        case "user":
            await showRecord("users", args[0]);
            break;

        case "group":
            await showRecord("groups", args[0]);
            break;

        case "role":
            await updateRole(args[0], args[1]);
            break;

        case "ban":
            await setBanned(args[0], true);
            break;

        case "unban":
            await setBanned(args[0], false);
            break;

        case "set":
            await updateUserField(args[0], args[1], args.slice(2).join(" "));
            break;

        case "delete":
            await deleteDBRecord(args[0]);
            break;

        case "export":
            await exportDBRecords(args[0]);
            break;

        case "save":
            if (getDatabaseStatus().mode !== "local") {
                console.log(color.warning("Command save hanya berlaku untuk Local."));
                break;
            }

            await saveDB();
            console.log(color.success("Database Local berhasil disimpan."));
            break;

        case "back":
        case "/back":
            dbMode = false;
            console.log(color.success("Kembali ke CLI utama."));
            break;

        case "":
            break;

        default:
            console.log(color.error(`Command database tidak dikenal: ${command}`));
            console.log(color.info("Ketik help untuk melihat daftar command."));
    }
};

const handleMainCommand = async input => {
    const [command, ...args] = input.trim().split(/\s+/);

    switch (command.toLowerCase()) {
        case "/help":
            printHelp();
            break;

        case "/db":
            dbMode = true;
            printDBHelp();
            break;

        case "/setdb":
            await handleSetDB(args);
            break;

        case "/status": {
            const status = getDatabaseStatus();

            printTitle("Bot Status");
            console.log(`Uptime  : ${Math.floor(process.uptime())} seconds`);
            console.log(`Memory  : ${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)} MB`);
            console.log(`Database: ${status.mode.toUpperCase()}`);
            console.log(`MongoDB : ${
                status.mongodb.connected
                    ? color.success("Connected")
                    : color.error("Disconnected")
            }`);
            break;
        }

        case "/plugins":
            await listPlugins();
            break;

        case "/clear":
            console.clear();
            break;

        case "/exit":
            askConfirmation("Yakin ingin menghentikan bot?", async answer => {
                if (answer !== "YES") {
                    console.log(color.info("Perintah exit dibatalkan"));
                    return;
                }

                closing = true;
                terminal.close();

                try {
                    await saveDB();
                    await mongoose.disconnect();
                } catch {}

                process.exit(0);
            });
            break;

        default:
            console.log(color.error(`Command tidak dikenal: ${command}`));
            console.log(color.info("Ketik /help untuk melihat daftar command."));
    }
};

export const startCLI = () => {
    if (terminal) return terminal;

    terminal = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: true
    });

    terminal.on("line", async rawInput => {
        const input = rawInput.trim();

        if (pendingConfirm) {
            const callback = pendingConfirm;

            if (!["YES", "NO"].includes(input.toUpperCase())) {
                console.log(color.warning("Masukkan YES atau NO."));
                setPrompt();
                return;
            }
            pendingConfirm = null;
            try {
                await callback(input.toUpperCase());
            } catch (err) {
                console.log(color.error(err.message));
            }
            setPrompt();
            return;
        }

        if (!input) {
            setPrompt();
            return;
        }

        try {
            if (dbMode) {
                if (input === "/back") {
                    dbMode = false;
                    console.log(color.success("Kembali ke main menu"));
                } else if (input === "/help") {
                    printDBHelp();
                } else {
                    await runDBCommand(input);
                }
            } else {
                await handleMainCommand(input);
            }
        } catch (err) {
            console.log(color.error(`${err.message}`));
        }
        setPrompt();
    });

    terminal.on("close", () => {
        if (!closing) {
            terminal = null;
            console.log(color.warning("terminal ditutup"));
        }
    });

    printHelp();
    setPrompt();

    return terminal;
};