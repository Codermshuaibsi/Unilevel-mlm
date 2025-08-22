const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },

    email: {
        type: String,
        required: true,
        unique: true,
    },

    password: {
        type: String,
        required: true,
    },

    otp: String,

    is_verified: {
        type: Boolean,
        default: false,
    },
    referral_code: String,

    referred_by: String,

    investment: { type: Number, default: 0 },

    wallets: {
        total_Income: { type: Number, default: 0 },
        roi: { type: Number, default: 0 },
        level_income: { type: Number, default: 0 },
    },

    type: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
    },
    is_reset_verified: {
        type: Boolean,
        default: false,
    },
},
    { timestamps: true })

module.exports = mongoose.model('UserModel', userSchema);