const Withdrawal = require('../model/WithdrawalRequest');
const User = require('../model/userModel');

// ================== Create Withdrawal Request ==================
exports.createWithdrawal = async (req, res) => {
  const { user_id, amount, address, method } = req.body;

  try {
    const user = await User.findById(user_id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Check funds
    if (user.wallets.total_Income < amount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    // Deduct funds
    user.wallets.total_Income -= amount;
    await user.save();

    // Create withdrawal request
    const withdrawal = await Withdrawal.create({
      user_id,
      amount,
      address,
      method,
      status: "pending"
    });

    res.status(201).json({
      message: "Withdrawal request submitted successfully",
      withdrawal
    });

  } catch (err) {
    console.error("Withdrawal error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ================== Get All Withdrawals (Admin) ==================
exports.getAllWithdrawals = async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find().populate("user_id", "name email");
    res.status(200).json(withdrawals);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch withdrawals", error: err.message });
  }
};

// ================== Get User Withdrawals ==================
exports.getUserWithdrawals = async (req, res) => {
  const { userId } = req.params;
  try {
    const withdrawals = await Withdrawal.find({ user_id: userId });
    res.status(200).json(withdrawals);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch user withdrawals", error: err.message });
  }
};

// ================== Update Withdrawal Status (Admin) ==================
exports.updateWithdrawalStatus = async (req, res) => {
  const { withdrawalId } = req.params;
  const { status } = req.body;  // "approved" | "rejected"

  try {
    const withdrawal = await Withdrawal.findById(withdrawalId);
    if (!withdrawal) return res.status(404).json({ message: "Withdrawal not found" });

    withdrawal.status = status;
    await withdrawal.save();

    res.status(200).json({ message: `Withdrawal ${status} successfully`, withdrawal });
  } catch (err) {
    res.status(500).json({ message: "Failed to update withdrawal", error: err.message });
  }
};

// ================== Delete Withdrawal (Admin) ==================
exports.deleteWithdrawal = async (req, res) => {
  const { withdrawalId } = req.params;
  try {
    const withdrawal = await Withdrawal.findByIdAndDelete(withdrawalId);
    if (!withdrawal) return res.status(404).json({ message: "Withdrawal not found" });

    res.status(200).json({ message: "Withdrawal deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete withdrawal", error: err.message });
  }
};
