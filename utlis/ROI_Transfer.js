const cron = require('node-cron');
const UserModel = require('../model/userModel');
const ROIIncomeLog = require('../model/ROIIncomeLog');

cron.schedule('*/1 * * * *', async () => {
    console.log(" ROI Distribution Job Started at", new Date().toLocaleString());

    try {

        const users = await UserModel.find({ investment: { $gt: 0 } });


        for (const user of users) {
            const roiAmount = (user.investment * 3) / 100;

            // Update user wallet

            user.wallets.roi += roiAmount;
            user.wallets.total_Income += roiAmount;

            await user.save();

            // Log ROI income
            await ROIIncomeLog.create({
                user_id: user._id,
                amount_paid: roiAmount,
            });

            console.log(`ROI of ₹${roiAmount.toFixed(2)} added to ${user.email}`);
        }

        console.log("🎉 ROI Distribution Completed");

    } catch (error) {
        console.error("ROI Cron Error:", error.message);
    }
});
