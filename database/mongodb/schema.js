const mongoose = require('mongoose');

// Define the user schema
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
});

const orderSchema = new mongoose.Schema({
  email: String,
  name: String,
  status: String,
});

const upSchema = new mongoose.Schema({
  title: String,
  caption: String,
  channel: [String],
  date: Date,
  media: String,
  createdDate: Date,
  totalBroadcast: Number,
  status: {
    type: String,
    enum: ['Pending', 'Finish'],
    default: 'Pending',
  },
});

module.exports = {
  userSchema,
  orderSchema,
  upSchema,
};
