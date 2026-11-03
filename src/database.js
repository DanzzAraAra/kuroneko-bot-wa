/*
 * Dandy
 * DO NOT FOR SALE!
 * Github: github.com/DanzzAraAra
 */
import mongoose from "mongoose";
import fs from "fs/promises";
import path from "path";
import settings from "../settings.js";

const configFile = path.resolve("database.config.json");
let mode = settings.database?.mode || "local";
let localPath = path.resolve(settings.database?.local?.path || "database");
let autosave = settings.database?.local?.autosave ?? true;
let pretty = settings.database?.local?.pretty ?? true;
let saveQueue = Promise.resolve();

const userSchema = new mongoose.Schema({
    jid: { type: String, required: true, unique: true },
    name: { type: String, default: "Unknown" },
    username: { type: String, default: null },
    age: { type: Number, default: null },
    role: { type: String, default: "user" },
    banned: { type: Boolean, default: false },
    bank: { type: Number, default: 0 },
    lastBankInterest: { type: Number, default: 0 },
    loan: {
        type: mongoose.Schema.Types.Mixed,
        default: () => ({
            active: false,
            history: []
        })
    },
    depositos: {
        type: mongoose.Schema.Types.Mixed,
        default: []
    },
    creditScore: {
        type: Number,
        default: 600
    },
    creditHistory: {
        type: mongoose.Schema.Types.Mixed,
        default: []
    },
    businesses: {
        type: mongoose.Schema.Types.Mixed,
        default: []
    },
    registered: { type: Boolean, default: false },
    limit: { type: Number, default: 0 },
    claimedFreeLimit: { type: Boolean, default: false },
    premium: { type: Boolean, default: false },
    premiumTime: { type: Number, default: 0 },
    money: { type: Number, default: 0 },
    lastClaim: { type: Number, default: 0 },
    lastWeekly: { type: Number, default: 0 },
    claimedFreePremium: { type: Boolean, default: false }
}, { timestamps: true });

const groupSchema = new mongoose.Schema({
    jid: { type: String, required: true, unique: true },
    antilink: { type: Boolean, default: false },
    antilinkch: { type: Boolean, default: false },
    antitagsw: { type: Boolean, default: false },
    antitoxic: { type: Boolean, default: false },
    antinsfw: { type: Boolean, default: false },
    autoback: { type: Boolean, default: false },
    mute: { type: Boolean, default: false },
    nsfw: { type: Boolean, default: false },
    onlyadmin: { type: Boolean, default: false },
    welcome: { type: Boolean, default: false },
    left: { type: Boolean, default: false },
    welcomeText: { type: String, default: "" },
    leftText: { type: String, default: "" },
    autoadmin: { type: Boolean, default: false },
    antidelete: { type: Boolean, default: false },
    warnLimit: { type: Number, default: 3 },
    warns: { type: mongoose.Schema.Types.Mixed, default: {} },
    warnEnabled: { type: Boolean, default: true },
    schedule: {
        enabled: { type: Boolean, default: false },
        closeTime: { type: String, default: "22:00" },
        openTime: { type: String, default: "05:00" },
        closeText: { type: String, default: "" },
        openText: { type: String, default: "" },
        lastState: { type: String, default: "" },
        lastRun: { type: String, default: "" }
    }
}, { timestamps: true });

const commandStatSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    count: { type: Number, default: 0 }
});

const CommandStat = mongoose.models.CommandStat ||
    mongoose.model("CommandStat", commandStatSchema);

const User = mongoose.models.User || mongoose.model("User", userSchema);
const Group = mongoose.models.Group || mongoose.model("Group", groupSchema);

const defaultUser = {
    name: "Unknown",
    username: null,
    age: null,
    role: "user",
    banned: false,
    bank: 0,
    lastBankInterest: 0,
    loan: {
        active: false,
        history: []
    },
    depositos: [],
    businesses: [],
    creditScore: 600,
    creditHistory: [],
    registered: false,
    limit: 0,
    claimedFreeLimit: false,
    premium: false,
    premiumTime: 0,
    money: 0,
    lastClaim: 0,
    lastWeekly: 0,
    claimedFreePremium: false
};

const defaultGroup = {
    antilink: false,
    antilinkch: false,
    antitagsw: false,
    antitoxic: false,
    antinsfw: false,
    autoback: false,
    mute: false,
    nsfw: false,
    onlyadmin: false,
    welcome: false,
    left: false,
    welcomeText: "",
    leftText: "",
    autoadmin: false,
    antidelete: false,
    warnLimit: 3,
    warns: {},
    warnEnabled: true,
    schedule: {
        enabled: false,
        closeTime: "22:00",
        openTime: "05:00",
        closeText: "",
        openText: "",
        lastState: "",
        lastRun: ""
    }
};

global.db = {
    users: {},
    groups: {},
    chats: {},
    settings: {}
};

const clone = value => {
    if (value === undefined || value === null) return value;
    return structuredClone(value);
};

const getModel = type => {
    if (type === "users") return User;
    if (type === "groups") return Group;
    throw new Error("Jenis database tidak valid.");
};

const getCache = type => {
    if (type === "users") return global.db.users;
    if (type === "groups") return global.db.groups;
    throw new Error("Jenis database tidak valid.");
};

const readJSON = async (file, fallback = {}) => {
    try {
        return JSON.parse(
            await fs.readFile(path.join(localPath, file), "utf8")
        );
    } catch (err) {
        if (err.code === "ENOENT") return fallback;
        throw err;
    }
};

const writeJSON = async (file, data) => {
    const target = path.join(localPath, file);
    const temp = `${target}.tmp`;

    await fs.writeFile(
        temp,
        JSON.stringify(data, null, pretty ? 2 : 0)
    );

    await fs.rename(temp, target);
};

const readConfig = async () => {
    try {
        const data = JSON.parse(await fs.readFile(configFile, "utf8"));

        mode = data.mode || mode;
        localPath = path.resolve(data.local?.path || localPath);
        autosave = data.local?.autosave ?? autosave;
        pretty = data.local?.pretty ?? pretty;

        if (data.mongodb?.uri !== undefined) {
            settings.database.mongodb.uri = data.mongodb.uri;
        }
    } catch (err) {
        if (err.code !== "ENOENT") throw err;
    }

    settings.database ||= {};
    settings.database.mode = mode;
    settings.database.local = {
        ...(settings.database.local || {}),
        path: path.relative(process.cwd(), localPath) || ".",
        autosave,
        pretty
    };
};

const saveConfig = async () => {
    const data = {
        mode,
        local: {
            path: path.relative(process.cwd(), localPath) || ".",
            autosave,
            pretty
        },
        mongodb: {
            uri: settings.database?.mongodb?.uri || ""
        }
    };

    await fs.writeFile(configFile, JSON.stringify(data, null, 2));
};

const normalizeUser = user => ({
    ...clone(defaultUser),
    ...user,
    loan: {
        ...clone(defaultUser.loan),
        ...(user.loan || {}),
        history: clone(user.loan?.history || [])
    },
    depositos: clone(user.depositos || []),
    businesses: clone(user.businesses || []),
    creditHistory: clone(user.creditHistory || [])
});

const normalizeGroup = group => ({
    ...clone(defaultGroup),
    ...group,
    warns: clone(group.warns || {}),
    schedule: {
        ...clone(defaultGroup.schedule),
        ...(group.schedule || {})
    }
});

const cleanMongoRecord = record => {
    const {
        jid,
        _id,
        __v,
        createdAt,
        updatedAt,
        ...data
    } = record;

    return data;
};

const loadMongoRecords = async () => {
    const [users, groups, commands] = await Promise.all([
        User.find().lean(),
        Group.find().lean(),
        CommandStat.find().lean()
    ]);

    return {
        users: Object.fromEntries(
            users.map(record => [
                record.jid,
                normalizeUser(cleanMongoRecord(record))
            ])
        ),
        groups: Object.fromEntries(
            groups.map(record => [
                record.jid,
                normalizeGroup(cleanMongoRecord(record))
            ])
        ),
        chats: {},
        settings: {
            topcmd: Object.fromEntries(
                commands.map(({ name, count }) => [name, count])
            )
        }
    };
};

const loadLocalRecords = async () => {
    const [users, groups, chats, botSettings] = await Promise.all([
        readJSON("users.json"),
        readJSON("groups.json"),
        readJSON("chats.json"),
        readJSON("settings.json")
    ]);

    return {
        users: Object.fromEntries(
            Object.entries(users).map(([jid, user]) => [
                jid,
                normalizeUser(user)
            ])
        ),
        groups: Object.fromEntries(
            Object.entries(groups).map(([jid, group]) => [
                jid,
                normalizeGroup(group)
            ])
        ),
        chats,
        settings: botSettings
    };
};

const applyData = data => {
    global.db.users = data.users || {};
    global.db.groups = data.groups || {};
    global.db.chats = data.chats || {};
    global.db.settings = data.settings || {};
};

const saveDB = () => {
    if (mode !== "local") return Promise.resolve();

    const snapshot = {
        users: { ...global.db.users },
        groups: { ...global.db.groups },
        chats: { ...global.db.chats },
        settings: { ...global.db.settings }
    };

    saveQueue = saveQueue.catch(() => {}).then(async () => {
        await fs.mkdir(localPath, { recursive: true });

        await Promise.all([
            writeJSON("users.json", snapshot.users),
            writeJSON("groups.json", snapshot.groups),
            writeJSON("chats.json", snapshot.chats),
            writeJSON("settings.json", snapshot.settings)
        ]);
    });

    return saveQueue;
};

const saveIfNeeded = async () => {
    if (mode === "local" && autosave) {
        await saveDB();
    }
};

const connectMongo = async () => {
    const uri = settings.database?.mongodb?.uri;

    if (!uri) {
        throw new Error("MongoDB URI tidak ditemukan.");
    }

    if (mongoose.connection.readyState !== 1) {
        await mongoose.connect(uri);
    }
};

const connectDB = async () => {
    await readConfig();

    if (mode === "local") {
        await fs.mkdir(localPath, { recursive: true });

        const data = await loadLocalRecords();
        applyData(data);

        console.log(
            `[JSON] Loaded ${Object.keys(data.users).length} users and ${Object.keys(data.groups).length} groups`
        );
        return;
    }

    if (mode !== "mongodb") {
        throw new Error(`Mode database tidak dikenal: ${mode}`);
    }

    mongoose.connection.on("connected", () => {
        console.log("[MONGODB] Connected");
    });

    mongoose.connection.on("disconnected", () => {
        console.log("[MONGODB] Disconnected");
    });

    mongoose.connection.on("error", err => {
        console.error("[MONGODB] Error:", err.message);
    });

    await connectMongo();

    const data = await loadMongoRecords();
    applyData(data);

    console.log(
        `[MONGODB] Loaded ${Object.keys(data.users).length} users and ${Object.keys(data.groups).length} groups`
    );
};

const switchDB = async nextMode => {
    if (!["local", "mongodb"].includes(nextMode)) {
        throw new Error("Mode database harus local atau mongodb.");
    }

    if (mode === nextMode) {
        return getDatabaseStatus();
    }

    if (mode === "local") {
        await saveQueue;
        await saveDB();
    }

    let data;

    if (nextMode === "mongodb") {
        await connectMongo();
        data = await loadMongoRecords();
    } else {
        await fs.mkdir(localPath, { recursive: true });
        data = await loadLocalRecords();
    }

    const previousMode = mode;
    mode = nextMode;

    try {
        await saveConfig();
    } catch (err) {
        mode = previousMode;

        if (nextMode === "mongodb") {
            await mongoose.disconnect().catch(() => {});
        }

        throw err;
    }

    settings.database.mode = mode;
    applyData(data);

    if (nextMode === "local" && mongoose.connection.readyState === 1) {
        await mongoose.disconnect();
    }

    console.log(`[DATABASE] Switched to ${nextMode}`);

    return getDatabaseStatus();
};

const configureDatabase = async (option, value) => {
    if (option === "path") {
        if (!value?.trim()) {
            throw new Error("Path Local tidak boleh kosong.");
        }

        if (mode === "local") {
            await saveQueue;
            if (autosave) await saveDB();
        }

        const previousPath = localPath;
        const nextPath = path.resolve(value);

        if (nextPath === previousPath) return getDatabaseStatus();

        localPath = nextPath;

        try {
            await fs.mkdir(localPath, { recursive: true });

            if (mode === "local") {
                applyData(await loadLocalRecords());
            }

            await saveConfig();
        } catch (err) {
            localPath = previousPath;
            throw err;
        }
    } else if (option === "autosave") {
        if (!["true", "false"].includes(String(value))) {
            throw new Error("Autosave hanya menerima true atau false.");
        }

        autosave = String(value) === "true";
        await saveConfig();
    } else if (option === "pretty") {
        if (!["true", "false"].includes(String(value))) {
            throw new Error("Pretty hanya bisa true atau false.");
        }

        pretty = String(value) === "true";
        await saveConfig();
    } else if (option === "uri") {
        if (!value?.trim()) {
            throw new Error("MongoDB URI tidak boleh kosong.");
        }

        if (mode === "mongodb") {
            throw new Error("Ubah URI saat mode Local, lalu switch ke MongoDB.");
        }

        settings.database.mongodb.uri = value.trim();
        await saveConfig();
    } else {
        throw new Error("Pengaturan database tidak dikenal.");
    }

    settings.database.mode = mode;
    settings.database.local = {
        ...(settings.database.local || {}),
        path: path.relative(process.cwd(), localPath) || ".",
        autosave,
        pretty
    };

    return getDatabaseStatus();
};

const getDatabaseStatus = () => ({
    mode,
    local: {
        path: path.relative(process.cwd(), localPath) || ".",
        autosave,
        pretty
    },
    mongodb: {
        configured: Boolean(settings.database?.mongodb?.uri),
        connected: mongoose.connection.readyState === 1
    }
});

const getDatabaseStats = async () => {
    if (mode === "mongodb") {
        const [users, groups, banned, premium] = await Promise.all([
            User.countDocuments(),
            Group.countDocuments(),
            User.countDocuments({ banned: true }),
            User.countDocuments({ premium: true })
        ]);

        return { users, groups, banned, premium };
    }

    const users = Object.values(global.db.users);
    const groups = Object.values(global.db.groups);

    return {
        users: users.length,
        groups: groups.length,
        banned: users.filter(user => user.banned).length,
        premium: users.filter(user => user.premium).length
    };
};

const listRecords = async (type, page = 1, pageSize = 10) => {
    const Model = getModel(type);
    let records;

    if (mode === "mongodb") {
        const total = await Model.countDocuments();
        const pages = Math.max(1, Math.ceil(total / pageSize));

        if (!Number.isInteger(page) || page < 1 || page > pages) {
            return { records: [], total, pages };
        }

        records = await Model.find()
            .sort({ createdAt: -1 })
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .lean();

        return { records, total, pages };
    }

    records = Object.entries(getCache(type))
        .map(([jid, data]) => ({ jid, ...data }))
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    const total = records.length;
    const pages = Math.max(1, Math.ceil(total / pageSize));

    if (!Number.isInteger(page) || page < 1 || page > pages) {
        return { records: [], total, pages };
    }

    const start = (page - 1) * pageSize;

    return {
        records: records.slice(start, start + pageSize),
        total,
        pages
    };
};

const searchRecords = async keyword => {
    if (!keyword?.trim()) return { users: [], groups: [] };

    const value = keyword.trim();

    if (mode === "mongodb") {
        const regex = new RegExp(
            value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
            "i"
        );

        const [users, groups] = await Promise.all([
            User.find({
                $or: [
                    { jid: regex },
                    { name: regex },
                    { username: regex },
                    { role: regex }
                ]
            }).limit(20).lean(),
            Group.find({ jid: regex }).limit(20).lean()
        ]);

        return { users, groups };
    }

    const match = text => String(text || "")
        .toLowerCase()
        .includes(value.toLowerCase());

    const users = Object.entries(global.db.users)
        .filter(([jid, user]) =>
            match(jid) ||
            match(user.name) ||
            match(user.username) ||
            match(user.role)
        )
        .slice(0, 20)
        .map(([jid, user]) => ({ jid, ...user }));

    const groups = Object.entries(global.db.groups)
        .filter(([jid]) => match(jid))
        .slice(0, 20)
        .map(([jid, group]) => ({ jid, ...group }));

    return { users, groups };
};

const getRecord = async (type, jid) => {
    if (mode === "mongodb") {
        return getModel(type).findOne({ jid }).lean();
    }

    const record = getCache(type)[jid];

    return record ? { jid, ...record } : null;
};

const setNestedValue = (object, field, value) => {
    const keys = field.split(".");
    let current = object;

    for (const key of keys.slice(0, -1)) {
        if (
            !current[key] ||
            typeof current[key] !== "object" ||
            Array.isArray(current[key])
        ) {
            current[key] = {};
        }

        current = current[key];
    }

    current[keys[keys.length - 1]] = value;
};

const updateRecord = async (type, jid, field, value) => {
    const Model = getModel(type);

    if (!field || field === "jid" || field.startsWith("_")) {
        throw new Error("Field tidak boleh diubah.");
    }

    if (!Model.schema.path(field)) {
        throw new Error("Field tidak ditemukan di schema.");
    }

    if (mode === "mongodb") {
        return Model.findOneAndUpdate(
            { jid },
            { $set: { [field]: value } },
            { returnDocument: "after", runValidators: true }
        ).lean();
    }

    const record = getCache(type)[jid];

    if (!record) return null;

    setNestedValue(record, field, value);
    await saveIfNeeded();

    return { jid, ...record };
};

const updateUserData = async (jid, data) => {
    if (mode === "mongodb") {
        return User.findOneAndUpdate(
            { jid },
            { $set: data },
            { returnDocument: "after", runValidators: true }
        ).lean();
    }

    const user = global.db.users[jid];

    if (!user) return null;

    Object.assign(user, data);
    await saveIfNeeded();

    return { jid, ...user };
};

const deleteRecord = async (type, jid) => {
    const Model = getModel(type);

    if (mode === "mongodb") {
        const result = await Model.deleteOne({ jid });
        return result.deletedCount > 0;
    }

    const cache = getCache(type);

    if (!cache[jid]) return false;

    delete cache[jid];
    await saveIfNeeded();

    return true;
};

const exportRecords = async type => {
    if (mode === "mongodb") {
        return getModel(type).find().lean();
    }

    return Object.entries(getCache(type)).map(([jid, data]) => ({
        jid,
        ...data
    }));
};

const addUser = (jid, pushName) => {
    if (global.db.users[jid]) return;

    const data = normalizeUser({
        name: pushName || defaultUser.name
    });

    global.db.users[jid] = data;

    if (mode === "local") {
        saveIfNeeded().catch(err => {
            console.error("[JSON] Failed to save users:", err.message);
        });
        return;
    }

    User.findOneAndUpdate(
        { jid },
        { $setOnInsert: { jid, ...data } },
        { upsert: true }
    ).catch(err => {
        console.error("[MONGODB] Failed to add user:", err.message);
    });
};

const updateUser = async (jid, data) => {
    if (!global.db.users[jid]) return;

    Object.assign(global.db.users[jid], data);

    if (mode === "local") {
        await saveIfNeeded();
        return;
    }

    await User.updateOne({ jid }, { $set: data }, { upsert: true });
};

const addGroup = jid => {
    if (global.db.groups[jid]) return;

    const data = normalizeGroup({});
    global.db.groups[jid] = data;

    if (mode === "local") {
        saveIfNeeded().catch(err => {
            console.error("[JSON] Failed to save groups:", err.message);
        });
        return;
    }

    Group.findOneAndUpdate(
        { jid },
        { $setOnInsert: { jid, ...data } },
        { upsert: true }
    ).catch(err => {
        console.error("[MONGODB] Failed to add group:", err.message);
    });
};

const updateGroup = async (jid, data) => {
    if (!global.db.groups[jid]) addGroup(jid);

    const group = global.db.groups[jid];
    const update = { ...data };

    if (data.schedule) {
        group.schedule = {
            ...defaultGroup.schedule,
            ...group.schedule,
            ...data.schedule
        };

        update.schedule = group.schedule;
    }

    Object.assign(group, update);

    if (mode === "local") {
        await saveIfNeeded();
        return;
    }

    await Group.updateOne(
        { jid },
        { $set: update },
        { upsert: true }
    );
};

const trackCommand = async name => {
    if (!name) return;

    const command = name.toLowerCase();
    global.db.settings.topcmd ||= {};

    if (mode === "mongodb") {
        const result = await CommandStat.findOneAndUpdate(
            { name: command },
            { $inc: { count: 1 } },
            { returnDocument: "after", upsert: true }
        );

        global.db.settings.topcmd[command] = result.count;
        return;
    }

    global.db.settings.topcmd[command] =
        (global.db.settings.topcmd[command] || 0) + 1;

    await saveIfNeeded();
};

export {
    User,
    Group,
    connectDB,
    addUser,
    updateUser,
    addGroup,
    updateGroup,
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
    exportRecords,
    trackCommand
};