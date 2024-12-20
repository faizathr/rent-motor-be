const mongoose = require('mongoose');

// Define the user schema
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  isAdmin: { type: Boolean, default: false }
});

const inventorySchema = new mongoose.Schema({
  name: String,
  type: { type: String, enum: ['Skuter', 'Sport'], default: 'Skuter'},
  image: String,
  fuel: Number,
  transmission: { type: String, enum: ['Matic', 'Manual'], default: 'Matic'},
  capacity: Number,
  price: Number,
  total: Number,
  available: Number
});

const orderStatusSchema = new mongoose.Schema({
  phoneNumber: { type: String, required: true },
  idCard: { type: String, required: true },
  orderDate: { type: Date, required: true},
  paymentDate: { type: Date, required: false},
  paymentStatus: { type: String, enum: ['completed', 'uncomplete'], default: 'uncomplete'},
  takenDate: { type: Date, required: true},
  takenStatus: { type: String, enum: ['taken', 'untaken'], default: 'untaken'},
  returnDate: { type: Date, required: true},
  returnStatus: { type: String, enum: ['returned', 'unreturned'], default: 'unreturned'},
  motorId: { type: String, required: true },
});

orderStatusSchema.virtual('userEmail').get(() => {
  return this.parent().email;
});

const orderSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    orderStatus: [orderStatusSchema],
  }
);

module.exports = {
  userSchema,
  inventorySchema,
  orderSchema,
};