const User = require('../model/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

// Generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();



exports.register = async (req, res) => {
    const { name, email, password, referred_by } = req.body;

    try {
        console.log('EMAIL_USER:', process.env.EMAIL_USER);
        console.log('EMAIL_PASS:', process.env.EMAIL_PASS);

        const existing = await User.findOne({ email });
        if (existing) return res.status(400).json({ message: 'User already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const otp = generateOTP();
        const referral_code = Math.random().toString(36).substring(2, 8);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            otp,
            referral_code,
            referred_by,
        });

        // Gmail transporter

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const mailOptions = {
            from: `"CodeWithShuaib " <${process.env.EMAIL_USER}>`,
            to: email,
            subject: ' Verify Your Email - OTP Inside!',
            html: `<div style="font-family:sans-serif;">
              <h2>Hello ${name},</h2>
              <p>Your OTP for email verification is:</p>
              <h1 style="color:#3498db">${otp}</h1>
              <p>Use this to complete your registration.</p>
              <br />
              <p>Thanks,<br/>Team CodeWithShuaib</p>
            </div>`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error("Email send error:", error);
                return res.status(500).json({
                    message: 'Failed to send OTP email',
                    error: error.message,
                });
            } else {
                console.log(" Email sent:", info.response);
                return res.status(201).json({ message: 'OTP sent to email' });
            }
        });

    } catch (err) {
        console.error(" Registration error:", err);
        res.status(500).json({ message: 'Registration failed', error: err.message });
    }
};

exports.verifyOTP = async (req, res) => {
    const { email, otp } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user || user.otp !== otp)
            return res.status(400).json({ message: 'Invalid OTP' });

        user.is_verified = true;
        user.otp = null;
        await user.save();
        res.json({ message: 'Email verified successfully' });
    } catch (err) {
        res.status(500).json({ message: 'OTP Verification failed', error: err.message });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
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


// =================== Forgot Password ===================
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'User not found' });

        const otp = generateOTP();
        user.otp = otp;
        await user.save();

        // Mail transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const mailOptions = {
            from: `"CodeWithShuaib " <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Reset Password - OTP Inside!',
            html: `<div style="font-family:sans-serif;">
              <h2>Hello ${user.name},</h2>
              <p>Your OTP for password reset is:</p>
              <h1 style="color:#e74c3c">${otp}</h1>
              <p>Use this OTP to reset your password.</p>
              <br />
              <p>Thanks,<br/>Team CodeWithShuaib</p>
            </div>`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) return res.status(500).json({ message: 'Failed to send reset OTP', error: error.message });
            res.status(200).json({ message: 'OTP sent to email for password reset' });
        });

    } catch (err) {
        res.status(500).json({ message: 'Forgot password failed', error: err.message });
    }
};

// =================== Verify Reset OTP ===================
exports.verifyResetOTP = async (req, res) => {
    const { email, otp } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user || user.otp !== otp)
            return res.status(400).json({ message: 'Invalid OTP' });

        user.is_reset_verified = true;
        await user.save();

        res.json({ message: 'OTP verified, you can now reset password' });
    } catch (err) {
        res.status(500).json({ message: 'OTP verification failed', error: err.message });
    }
};

// =================== Reset Password ===================
exports.resetPassword = async (req, res) => {
    const { email, newPassword } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user || !user.is_reset_verified)
            return res.status(400).json({ message: 'Unauthorized reset attempt' });

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.otp = null;
        user.is_reset_verified = true;
        await user.save();

        res.json({ message: 'Password reset successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Password reset failed', error: err.message });
    }
};


exports.getMyReferrals = async (req, res) => {
    try {
        const userId = req.params.userId;

        // Find the user
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Find all users who used this user's referral_code
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
