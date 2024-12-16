const mongoose = require("mongoose");
const schema = require("./schema");
const bcrypt = require("bcrypt");

const Users = mongoose.model("User", schema.userSchema);
const Orders = mongoose.model("Order", schema.orderSchema);
const Broadcast = mongoose.model("Broadcast", schema.upSchema);

async function getUsers() {
    return Users.find();
}

async function createUser(user) {
    // encrypt user password before creating new user
    user.password = await bcrypt.hash(user.password, 10);
    return Users.create(user);
}

async function createBroadcast(broadcast) {
    return Broadcast.create(broadcast);
}

async function updateUser(id, user) {
    return Users.findByIdAndUpdate(id, user, { new: true });
}

async function deleteUser(id) {
    return Users.findByIdAndDelete(id);
}

async function findByName(name) {
    return Users.find({ name: name });
}

async function findOneByEmail(email) {
    return Users.findOne({ email });
}

async function getOrders() {
    return Orders.find();
}

async function createOrder(order) {
    return Orders.create(order);
}

async function updateOrder(id, order) {
    return Orders.findByIdAndUpdate(id, order, { new: true });
}

async function deleteOrder(id) {
    return Orders.findByIdAndDelete(id);
}

async function findByStatus(status) {
    return Orders.find({ status: status });
}

async function findOneByOrderId(orderId) {
    return Orders.findOne({ orderId: orderId });
}

async function findOneByEmail(email) {
    return Users.find({ email: email });
}

async function findOneByTitle(title) {
    return Broadcast.findOne({ title });
}

async function findOneByCaption(caption) {
    return Broadcast.findOne({ caption });
}

async function findOneByChannel(channel) {
    return Broadcast.findOne({ channel });
}

async function findOneByTime(time) {
    return Broadcast.findOne({ time });
}

async function findOneByDate(date) {
    return Broadcast.findOne({ date });
}

async function findOneByTotalBroadcast(totalBroadcast) {
    return Broadcast.findOne({ totalBroadcast });
}

async function getBroadcasts() {
    return Broadcast.find();
}


module.exports = {
    getUsers,
    createUser,
    createBroadcast,
    updateUser,
    deleteUser,
    findByName,
    findOneByEmail,
    getOrders,
    createOrder,
    updateOrder,
    deleteOrder,
    findByStatus,
    findOneByOrderId,
    findOneByEmail,
    findOneByTitle,
    findOneByCaption, 
    findOneByChannel, 
    findOneByTime, 
    findOneByDate, 
    findOneByTotalBroadcast,
    getBroadcasts,
};
