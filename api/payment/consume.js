const db = require("../../lib/database");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    const { userId, amount, purpose } = req.body;

    if (!userId || !amount) {
      return res.status(400).json({
        success: false,
        message: "User ID and amount are required"
      });
    }

    const currentBalance = await db.getBalance(userId);
    const consumeAmount = parseFloat(amount);

    if (currentBalance < consumeAmount) {
      return res.status(400).json({
        success: false,
        message: "Insufficient balance",
        currentBalance,
        requiredAmount: consumeAmount
      });
    }

    const newBalance = await db.updateBalance(userId, -consumeAmount);

    res.json({
      success: true,
      newBalance,
      message: "Balance consumed successfully"
    });

  } catch (error) {
    console.error("Consume balance error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};
