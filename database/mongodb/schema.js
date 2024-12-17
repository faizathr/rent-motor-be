const mongoose = require('mongoose');

// Define the user schema
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  isAdmin: Boolean,
});

const inventorySchema = new mongoose.Schema({
  name: String,
  total: Number,
  available: Number
});

const orderSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    orderStatus: [
      {
        phoneNumber: { type: String, required: true },
        idCard: { type: String, required: true },
        orderDate: { type: Date, required: true},
        paymentDate: { type: Date, required: false},
        paymentStatus: { type: String, enum: ['completed', 'uncomplete'], default: 'uncomplete'},
        takenDate: { type: Date, required: true},
        takenStatus: { type: String, enum: ['taken', 'untaken'], default: 'untaken'},
        returnDate: { type: Date, required: true},
        returnStatus: { type: String, enum: ['returned', 'unreturned'], default: 'unreturned'},
      },
    ],
  }
);

module.exports = {
  userSchema,
  inventorySchema,
  orderSchema,
};
