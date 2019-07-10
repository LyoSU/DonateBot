const mongoose = require('mongoose')


const paymentSchema = mongoose.Schema({
  orderId: {
    type: String,
    index: true,
    unique: true,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  amount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    require: true,
  },
  type: String,
  info: Object,
}, {
  timestamps: true,
})


module.exports = paymentSchema
