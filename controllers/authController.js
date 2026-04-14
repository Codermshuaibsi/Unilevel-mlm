const User = require('../model/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

// Generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();


// =================== REGISTER ===================
exports.register = async (req, res) => {
    const { name, email, password, referred_by } = req.body;

    try {
        const existing = await User.findOne({ email: email.toLowerCase() });
        if (existing && existing.is_verified)
            return res.status(400).json({ message: 'User already registered' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const otp = generateOTP();
        const otp_expiry = Date.now() + 5 * 60 * 1000; // 5 mins
        const referral_code = Math.random().toString(36).substring(2, 8);

        // Create or update pending user (temporary storage)
        const user = await User.findOneAndUpdate(
            { email: email.toLowerCase() },
            {
                name,
                email: email.toLowerCase(),
                password: hashedPassword,
                otp,
                otp_expiry,
                referral_code,
                referred_by,
                is_verified: false,
            },
            { upsert: true, new: true }
        );

        // Gmail transporter (reusable)
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });


        // Send OTP Email
        const mailOptions = {
            from: `"CodeWithShuaib" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Verify Your Email - OTP Inside!',
            html: `
        <div style="font-family:sans-serif;">
          <h2>Hello ${name},</h2>
          <p>Your OTP for email verification is:</p>
          <h1 style="color:#3498db">${otp}</h1>
          <p>This OTP will expire in 5 minutes.</p>
          <br />
          <p>Thanks,<br/>Team CodeWithShuaib</p>
        </div>
      `,
        };

        await transporter.sendMail(mailOptions);

        res.status(201).json({ message: 'OTP sent to email for verification' });

    } catch (err) {
        console.error("Registration error:", err);
        res.status(500).json({ message: 'Registration failed', error: err.message });
    }
};

// =================== VERIFY OTP ===================
exports.verifyOTP = async (req, res) => {
    const { email, otp } = req.body;
    try {
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) return res.status(400).json({ message: 'User not found' });
        if (user.is_verified) return res.status(400).json({ message: 'Already verified' });

        if (user.otp !== otp)
            return res.status(400).json({ message: 'Invalid OTP' });

        if (user.otp_expiry < Date.now())
            return res.status(400).json({ message: 'OTP expired. Please register again.' });

        // Mark verified
        user.is_verified = true;
        user.otp = null;
        user.otp_expiry = null;
        await user.save();

        res.json({ message: 'Email verified successfully. You can now log in.' });
    } catch (err) {
        res.status(500).json({ message: 'OTP verification failed', error: err.message });
    }
};

// =================== LOGIN ===================
exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user || !user.is_verified)
            return res.status(400).json({ message: 'Invalid or unverified user' });

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(400).json({ message: 'Incorrect password' });

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                referral_code: user.referral_code,
                referred_by: user.referred_by,
                investment: user.investment,
                wallets: user.wallets,
                type: user.type,
                createdAt: user.createdAt,
            }
        });
    } catch (err) {
        res.status(500).json({ message: 'Login failed', error: err.message });
    }
};

// =================== FORGOT PASSWORD ===================
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) return res.status(400).json({ message: 'User not found' });

        const otp = generateOTP();
        user.otp = otp;
        user.otp_expiry = Date.now() + 5 * 60 * 1000;
        await user.save();

        const mailOptions = {
            from: `"CodeWithShuaib" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Reset Password - OTP Inside!',
            html: `
  <div style="font-family: 'Poppins', sans-serif; background-color: #f4f6f8; padding: 30px; text-align: center;">
    <div style="
      background: #fff;
      border-radius: 12px;
      max-width: 420px;
      margin: auto;
      padding: 30px;
      box-shadow: 0 6px 18px rgba(0,0,0,0.1);
      border-top: 6px solid #4f46e5;
      ">
      
      <h2 style="color:#333;">Hello <span style="color:#4f46e5;">${user.name}</span>,</h2>
      <p style="font-size: 15px; color:#555; margin-bottom: 25px;">
        Your OTP for <strong>${type === 'reset' ? 'password reset' : 'email verification'}</strong> is:
      </p>
      
      <div style="
        display: flex;
        justify-content: center;
        gap: 10px;
        margin-bottom: 25px;
      ">
        ${otp.split('').map(digit => `
          <div style="
            background: #4f46e5;
            color: white;
            font-size: 22px;
            font-weight: bold;
            padding: 12px 18px;
            border-radius: 8px;
            animation: pulse 1s ease-in-out infinite;
            display: inline-block;
          ">
            ${digit}
          </div>
        `).join('')}
      </div>
      
      <p style="color:#555; font-size: 14px;">
        This OTP will expire in <strong>5 minutes</strong>.  
        Please use it to complete your process.
      </p>
      
      <br/>
      <p style="color:#4f46e5; font-weight:600;">Team CodeWithShuaib 🚀</p>
    </div>
    
    <style>
      @keyframes pulse {
        0% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.1); opacity: 0.85; }
        100% { transform: scale(1); opacity: 1; }
      }
    </style>
  </div>
`

        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'OTP sent to email for password reset' });

    } catch (err) {
        res.status(500).json({ message: 'Forgot password failed', error: err.message });
    }
};

// =================== VERIFY RESET OTP ===================
exports.verifyResetOTP = async (req, res) => {
    const { email, otp } = req.body;
    try {
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user || user.otp !== otp)
            return res.status(400).json({ message: 'Invalid OTP' });

        if (user.otp_expiry < Date.now())
            return res.status(400).json({ message: 'OTP expired' });

        user.is_reset_verified = true;
        await user.save();

        res.json({ message: 'OTP verified. You can now reset your password.' });
    } catch (err) {
        res.status(500).json({ message: 'OTP verification failed', error: err.message });
    }
};

// =================== RESET PASSWORD ===================
exports.resetPassword = async (req, res) => {
    const { email, newPassword } = req.body;
    try {
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user || !user.is_reset_verified)
            return res.status(400).json({ message: 'Unauthorized reset attempt' });

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.otp = null;
        user.is_reset_verified = false;
        await user.save();

        res.json({ message: 'Password reset successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Password reset failed', error: err.message });
    }
};

// =================== GET REFERRALS ===================
exports.getMyReferrals = async (req, res) => {
    try {
        const userId = req.params.userId;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const referredUsers = await User.find({ referred_by: user.referral_code });

        res.json({
            message: "Referral members fetched successfully",
            totalReferred: referredUsers.length,
            members: referredUsers.map(u => ({
                id: u._id,
                name: u.name,
                email: u.email,
                joinedAt: u.createdAt
            }))
        });

    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch referrals', error: err.message });
    }
};
