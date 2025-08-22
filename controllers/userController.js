const UserModel = require('../model/userModel');
const Transaction = require('../model/Transaction');
const LevelIncomeLog = require('../model/LevelIncomeLog');


const levelPercentages = {
  1: 10,
  2: 7,
  3: 5,
  4: 3,
};

async function investment(req, res) {
  const { amount, userID } = req.body;

  try {
    // 1. Find the investor
    
    const investor = await UserModel.findById(userID);
    if (!investor) return res.status(404).json({ message: "User not found" });

    // 2. Update user's investment
    investor.investment += amount;
    await investor.save();

    // 3. Create a transaction log
    await Transaction.create({
      user_id: investor._id,
      amount_in_usdt: amount,
      payment_id: `TXN-${Date.now()}`,
      pay_address: "N/A", // fill if crypto used
      status: "paid"
    });

    // 4. Distribute level income
    let currentReferrerCode = investor.referred_by;

    for (let level = 1; level <= 4 && currentReferrerCode; level++) {
      const referrer = await UserModel.findOne({ referral_code: currentReferrerCode });

      if (!referrer) break;

      const percentage = levelPercentages[level];
      const income = (amount * percentage) / 100;

      // Update level income in referrer's wallet
      referrer.wallets.level_income += income;
      referrer.wallets.total_Income += income;
      await referrer.save();

      // Log level income
      await LevelIncomeLog.create({
        user_id: referrer._id,
        referred_user_id: investor._id,
        amount: income,
        level: level,
      });

      // Go to next level referrer
      currentReferrerCode = referrer.referred_by;
    }

    res.status(200).json({ message: "Investment successful and income distributed." });

  } catch (error) {
    console.log("Investment error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
}



// Dashboard Controller
exports.getDashboard = async (req, res) => {
  try {
    const userId = req.user.id; // comes from auth middleware (JWT)
    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ message: "User not found" });

    // Fetch Transactions
    const transactions = await Transaction.find({ user_id: userId }).sort({ createdAt: -1 });

    // Fetch Level Income Logs
    const levelIncomes = await LevelIncomeLog.find({ user_id: userId }).sort({ createdAt: -1 });

    // Profit calculation (3% daily ROI example)
    let profit = 0;
    if (user.investment > 0) {
      const daysInvested = Math.floor((Date.now() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24));
      profit = ((user.investment * 3) / 100) * daysInvested; // 3% daily ROI
    }

    const dashboardData = {
      profile: {
        id: user._id,
        name: user.name,
        email: user.email,
        referral_code: user.referral_code,
        referred_by: user.referred_by,
        createdAt: user.createdAt,
      },
      investment: user.investment,
      profit: user.investment > 0 ? profit : 0,
      wallets: user.wallets,
      transactions,
      levelIncomes,
    };

    res.status(200).json({
      message: "Dashboard fetched successfully",
      dashboard: dashboardData,
    });
  } catch (error) {
    console.error("Dashboard Error:", error);
    res.status(500).json({ message: "Something went wrong", error: error.message });
  }
};


module.exports = {
  investment,
};


