// 模拟数据库
let users = new Map();

export default async function handler(req, res) {
  // 设置CORS头
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // 获取或创建用户
    let user = users.get(userId);
    if (!user) {
      user = {
        piUserId: userId,
        username: `用户${userId}`,
        balance: 0.0, // 新用户默认余额为0
        stats: { totalGames: 0, wins: 0, losses: 0, winRate: 0, score: 100 },
      };
      users.set(userId, user);
    }

    res.json({
      success: true,
      balance: {
        current: user.balance,
        totalRecharged: 0,
        totalSpent: 0,
      },
    });
  } catch (error) {
    console.error("Get balance error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}
