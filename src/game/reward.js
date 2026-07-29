/*
   * Dandy
   * DO NOT FOR SALE!
   * Github: github.com/DanzzAraAra
*/
const { updateUser } = require('../database.js');

const addReward = async (jid, amount) => {
    const user = global.db.users[jid];
    if (!user) return false;
    
    const newLimit = (user.limit || 0) + amount;
    await updateUser(jid, { limit: newLimit });
    
    return newLimit;
};

module.exports = { addReward };