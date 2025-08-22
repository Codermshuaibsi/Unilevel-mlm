const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  amount_in_usdt: Number,
  payment_id: String,
  pay_address: String,
  status: { type: String, default: 'pending' }, 
  tx_hash: { type: String, default: null }, // transaction address
  proof_type: { type: String, enum: ['image', 'tx_hash'], default: 'image' },
  proof_url: { type: String, default: null },
  submitted_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Transaction', transactionSchema);
