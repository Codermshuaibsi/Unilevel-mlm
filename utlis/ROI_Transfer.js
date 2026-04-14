const cron = require('node-cron');
const UserModel = require('../model/userModel');
const ROIIncomeLog = require('../model/ROIIncomeLog');

cron.schedule('*/1 * * * *', async () => {
    console.log("ROI Distribution Job Started at", new Date().toLocaleString());

    try {
        const users = await UserModel.find({ investment: { $gt: 0 } });

        //  IMPORTANT CHECK
        if (!users.length) {
            console.log("⚠️ No users with investment found. Skipping ROI distribution.");
            return;
        }

        for (const user of users) {

            const roiAmount = (user.investment * 3) / 100;

            // ✅ safe wallet handling
            user.wallets = user.wallets || {};
            user.wallets.roi = (user.wallets.roi || 0) + roiAmount;
            user.wallets.total_Income = (user.wallets.total_Income || 0) + roiAmount;

            await user.save();

            await ROIIncomeLog.create({
                user_id: user._id,
                amount_paid: roiAmount,
            });

            console.log(`ROI ₹${roiAmount.toFixed(2)} added to ${user.email}`);
        }

        console.log("🎉 ROI Distribution Completed");

    } catch (error) {
        console.error("ROI Cron Error:", error.message);
    }
});