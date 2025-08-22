const express = require('express');
const { 
  createWithdrawal, 
  getAllWithdrawals, 
  getUserWithdrawals, 
  updateWithdrawalStatus, 
  deleteWithdrawal 
} = require('../controllers/withdrawalController');

const router = express.Router();

// User
router.post('/create', createWithdrawal);
router.get('/user/:userId', getUserWithdrawals);

// Admin
router.get('/all', getAllWithdrawals);
router.put('/update/:withdrawalId', updateWithdrawalStatus);
router.delete('/delete/:withdrawalId', deleteWithdrawal);

module.exports = router;
