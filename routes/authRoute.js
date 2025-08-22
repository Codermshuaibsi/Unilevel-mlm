const express = require('express');
const router = express.Router();
const { register, verifyOTP, login, forgotPassword, verifyResetOTP, resetPassword, getMyReferrals } = require('../controllers/authController');

router.post('/register', register);
router.post('/verify-otp', verifyOTP);
router.post('/login', login);

// Reset

router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-otp', verifyResetOTP);
router.post('/reset-password', resetPassword);


//

router.get('/my-referrals/:userId', getMyReferrals);

module.exports = router;
