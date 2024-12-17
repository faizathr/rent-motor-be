const mongoose = require("mongoose");
const schema = require("./schema");
const bcrypt = require("bcrypt");

const Users = mongoose.model("User", schema.userSchema);
const Order = mongoose.model("Order", schema.orderSchema);

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

async function createOrder(email, orderStatus) {
  const newOrder = new Order({ email, orderStatus });
  return newOrder.save();
}

async function updateReturnStatus(id) {
  return Order.findByIdAndUpdate(
    id,
    {
      $set: {
        'orderStatus.0.returnStatus': 'returned',
        'orderStatus.0.returnDate': new Date(),
      },
    },
    { new: true }
  );
}

async function findOrderByEmail(email) {
  return Order.findOne({ email });
}

async function createOrder(email, orderStatus) {
    const newOrder = new Order({ email, orderStatus });
    return await newOrder.save();
}

async function updatePaymentStatusByOrderStatusId(orderStatusId) {
  return Order.findOneAndUpdate(
    { 'orderStatus._id': orderStatusId },
    {
      $set: {
        'orderStatus.$.paymentStatus': 'completed',
        'orderStatus.$.paymentDate': new Date(),
      },
    },
    { new: true }
  );
}

async function updateTakenStatusByOrderStatusId(orderStatusId) {
  return Order.findOneAndUpdate(
    { 'orderStatus._id': orderStatusId },
    {
      $set: {
        'orderStatus.$.takenStatus': 'taken',
        'orderStatus.$.takenDate': new Date(),
      },
    },
    { new: true }
  );
}

async function updateReturnStatusByOrderStatusId(orderStatusId) {
  return Order.findOneAndUpdate(
    { 'orderStatus._id': orderStatusId },
    {
      $set: {
        'orderStatus.$.returnStatus': 'returned',
        'orderStatus.$.returnDate': new Date(),
      },
    },
    { new: true }
  );
}


async function getCompletedPayment(email) {
  try {
    const userOrders = await Order.findOne({ email });

    if (!userOrders || !userOrders.orderStatus) {
      return null; 
    }

    const completedPayments = userOrders.orderStatus.filter(
      (status) => status.paymentStatus === "completed"
    );

    return {
      email: userOrders.email,
      paymentHistory: completedPayments,
    };
  } catch (error) {
    console.error("Error fetching completed payments:", error);
    throw error; 
  }
}

async function getAllOrders() {
  return Order.find(); 
}

async function getOrderById(id) {
  return Order.findById(id); 
}

module.exports = {
    getUsers,
    createUser,
    updateUser,
    deleteUser,
    findByName,
    findOneByEmail,
    findOneByEmail,
    createOrder,
    updatePaymentStatusByOrderStatusId,
    updateTakenStatusByOrderStatusId,
    updateReturnStatusByOrderStatusId,
    getCompletedPayment,
    getAllOrders,
    getOrderById,
    findOrderByEmail,
};
