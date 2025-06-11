import express from "express";

const router = express.Router();

// 模拟数据库
const mockLeaderboard = [
  { userId: "user1", username: "玩家1", wins: 15, losses: 3, winRate: 83.3 },
  { userId: "user2", username: "玩家2", wins: 12, losses: 5, winRate: 70.6 },
  { userId: "user3", username: "玩家3", wins: 10, losses: 4, winRate: 71.4 },
];

router.get("/", async (req, res) => {
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
    const { limit = 100 } = req.query;

    // 返回模拟排行榜数据
    const limitedLeaderboard = mockLeaderboard.slice(0, parseInt(limit));

    res.json({
      success: true,
      leaderboard: limitedLeaderboard,
      total: limitedLeaderboard.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Get leaderboard error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// 获取用户排名
router.get("/rank", async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required for rank query",
      });
    }

    // 模拟用户排名
    const userIndex = mockLeaderboard.findIndex(
      (user) => user.userId === userId
    );
    const rank = userIndex >= 0 ? userIndex + 1 : null;

    res.json({
      success: true,
      rank,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Get user rank error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

export default router;
