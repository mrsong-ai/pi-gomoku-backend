import express from "express";

const router = express.Router();

// 模拟用户余额数据
const mockBalances = new Map();

router.post("/", async (req, res) => {
  try {
    const { userId, amount, purpose } = req.body;

    if (!userId || !amount) {
      return res.status(400).json({
        success: false,
        message: "User ID and amount are required",
      });
    }

    const currentBalance = mockBalances.get(userId) || 0;
    const consumeAmount = parseFloat(amount);

    if (currentBalance < consumeAmount) {
      return res.status(400).json({
        success: false,
        message: "Insufficient balance",
        currentBalance,
        requiredAmount: consumeAmount,
      });
    }

    const newBalance = currentBalance - consumeAmount;
    mockBalances.set(userId, newBalance);

    res.json({
      success: true,
      newBalance,
      message: "Balance consumed successfully",
    });
  } catch (error) {
    console.error("Consume balance error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

export default router;
