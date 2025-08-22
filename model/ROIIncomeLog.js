const mongoose = require('mongoose');
const roiIncomeLogSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  amount_paid: Number,
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ROIIncomeLog', roiIncomeLogSchema);