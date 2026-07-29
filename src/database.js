/*
   * Dandy
   * DO NOT FOR SALE!
   * Github: github.com/DanzzAraAra
*/
const mongoose = require('mongoose');
const chalk = require('chalk');

const userSchema = new mongoose.Schema({
    jid: { type: String, required: true, unique: true },
    name: { type: String, default: 'Unknown' },
    username: { type: String, default: null },
    age: { type: Number, default: null },
    role: { type: String, default: 'user' },
    banned: { type: Boolean, default: false },
    registered: { type: Boolean, default: false },
    limit: { type: Number, default: 0 },
    claimedFreeLimit: { type: Boolean, default: false },
    premium: { type: Boolean, default: false },
    premiumTime: { type: Number, default: 0 },
    lastClaim: { type: Number, default: 0 },
    claimedFreePremium: { type: Boolean, default: false }
}, { timestamps: true });

const groupSchema = new mongoose.Schema({
    jid: { type: String, required: true, unique: true },
    antilink: { type: Boolean, default: false },
    antitagsw: { type: Boolean, default: false },
    antitoxic: { type: Boolean, default: false },
    antinsfw: { type: Boolean, default: false },
    mute: { type: Boolean, default: false },
    onlyadmin: { type: Boolean, default: false },
    antibot: { type: Boolean, default: false }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
const Group = mongoose.model('Group', groupSchema);

global.db = { users: {}, groups: {}, chats: {}, settings: {} };

const connectDB = async (uri) => {
    try {
        await mongoose.connect(uri);
        console.log(chalk.greenBright('[DB] Connected to MongoDB'));
        
        const users = await User.find();
        users.forEach(u => {
            global.db.users[u.jid] = { 
                name: u.name, 
                username: u.username, 
                age: u.age, 
                role: u.role, 
                banned: u.banned, 
                registered: u.registered,
                limit: u.limit || 0,
                claimedFreeLimit: u.claimedFreeLimit || false,
                premium: u.premium || false,
                premiumTime: u.premiumTime || 0,
                lastClaim: u.lastClaim || 0,
                claimedFreePremium: u.claimedFreePremium || false
            };
        });

        const groups = await Group.find();
        groups.forEach(g => {
            global.db.groups[g.jid] = { 
                antilink: g.antilink, 
                antitagsw: g.antitagsw, 
                antitoxic: g.antitoxic, 
                antinsfw: g.antinsfw, 
                mute: g.mute, 
                onlyadmin: g.onlyadmin,
                antibot: g.antibot
            };
        });
    } catch (error) {
        console.error(chalk.red(`[DB ERROR] ${error.message}`));
    }
};

const addUser = (jid, pushName) => {
    const name = pushName || 'Unknown';
    if (!global.db.users[jid]) {
        global.db.users[jid] = { 
            name, 
            username: null, 
            age: null, 
            role: 'user', 
            banned: false, 
            registered: false, 
            limit: 0, 
            claimedFreeLimit: false,
            premium: false,
            premiumTime: 0,
            lastClaim: 0,
            claimedFreePremium: false
        };
        User.findOneAndUpdate(
            { jid },
            { $setOnInsert: { name, username: null, age: null, role: 'user', banned: false, registered: false, limit: 0, claimedFreeLimit: false, premium: false, premiumTime: 0, lastClaim: 0, claimedFreePremium: false } },
            { upsert: true }
        ).catch(err => console.error(err));
    }
};

const updateUser = async (jid, data) => {
    if (global.db.users[jid]) {
        Object.assign(global.db.users[jid], data);
        await User.updateOne({ jid }, { $set: data }).catch(err => console.error(err));
    }
};

const addGroup = (jid) => {
    if (!global.db.groups[jid]) {
        global.db.groups[jid] = { antilink: false, antitagsw: false, antitoxic: false, antinsfw: false, mute: false, onlyadmin: false, antibot: false };
        Group.findOneAndUpdate(
            { jid },
            { $setOnInsert: { antilink: false, antitagsw: false, antitoxic: false, antinsfw: false, mute: false, onlyadmin: false, antibot: false } },
            { upsert: true }
        ).catch(err => console.error(err));
    }
};

const updateGroup = async (jid, data) => {
    if (global.db.groups[jid]) {
        Object.assign(global.db.groups[jid], data);
        await Group.updateOne({ jid }, { $set: data }).catch(err => console.error(err));
    }
};

module.exports = { User, Group, connectDB, addUser, updateUser, addGroup, updateGroup };