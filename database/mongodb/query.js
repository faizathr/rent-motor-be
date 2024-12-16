const mongoose = require("mongoose");
const schema = require("./schema");
const bcrypt = require("bcrypt");

const Users = mongoose.model("User", schema.userSchema);
const Complete = mongoose.model("Complete", schema.completeSchema)

async function getUsers() {
    return Users.find();
}

async function createUser(user) {
    // encrypt user password before creating new user
    user.password = await bcrypt.hash(user.password, 10);
    return Users.create(user);
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
    return Users.findOne({ email: email });
}

const getCompletedPayment = async (userId) => {
    return await Complete.findById(userId)
      .select('paymentHistory')
  };

module.exports = {
    getUsers,
    createUser,
    updateUser,
    deleteUser,
    findByName,
    findOneByEmail,
    findOneByEmail,
    getCompletedPayment,
};
