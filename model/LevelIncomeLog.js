const mongoose = require('mongoose');

const levelIncomeLogSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  referred_user_id: { type: mongoose.Schema.Types.ObjectId },
  amount: Number,
  level: Number,
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('LevelIncomeLog', levelIncomeLogSchema);
