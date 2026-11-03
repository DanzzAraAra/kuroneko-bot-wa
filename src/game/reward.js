/*
   * Dandy
   * DO NOT FOR SALE!
   * Github: github.com/DanzzAraAra
*/
import { updateUser } from "../database.js";

const addReward = async (jid, amount) => {
    const user = global.db.users[jid];
    if (!user) return false;
    const userId = global.db.users[jid] ? jid : null;
    if (!userId) return false;
    const newMoney = (Number(user.money) || 0) + amount;
    await updateUser(userId, {
        money: newMoney
    });
    return newMoney;
};

export { addReward };