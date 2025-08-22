const mongoose = require('mongoose');

const withdrawalSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  address: { type: String, required: true },   // crypto wallet address
  amount: { type: Number, required: true },

  method: { type: String, required: true },    // e.g. USDT, BTC, ETH
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },

}, { timestamps: true });  // adds createdAt & updatedAt automatically

module.exports = mongoose.model('Withdrawal', withdrawalSchema);
