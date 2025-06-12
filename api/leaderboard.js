import express from "express";
import db from "../lib/database.js";

const router = express.Router();

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
    const { limit = 100, refresh = false } = req.query;
    console.log(`[排行榜API] 获取排行榜，限制: ${limit}, 强制刷新: ${refresh}`);

    // 使用真实数据库获取排行榜
    const leaderboard = await db.getLeaderboard(parseInt(limit));
    console.log(`[排行榜API] 返回 ${leaderboard.length} 条记录`);

    // 获取总用户数统计
    const allUsers = await db.getAllUsers();
    const totalRealUsers = allUsers.filter(
      (user) =>
        user.id.startsWith("pi_user_") &&
        !user.username.includes("测试") &&
        !user.username.includes("test") &&
        !user.username.toLowerCase().includes("mock") &&
        !user.username.includes("玩家") &&
        user.username !== "测试玩家432"
    ).length;

    res.json({
      success: true,
      leaderboard: leaderboard,
      total: leaderboard.length,
      totalUsers: totalRealUsers,
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
    console.log(`[排行榜API] 获取用户排名，用户ID: ${userId}`);

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required for rank query",
      });
    }

    // 使用真实数据库获取用户排名
    const rank = await db.getUserRank(userId);
    console.log(`[排行榜API] 用户 ${userId} 排名: ${rank}`);

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

// 调试端点：查看所有用户数据
router.get("/debug", async (req, res) => {
  try {
    const allUsers = await db.getAllUsers();
    res.json({
      success: true,
      users: allUsers.map((user) => ({
        id: user.id,
        username: user.username,
        stats: user.stats,
        gameHistory: user.gameHistory,
      })),
      total: allUsers.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Debug endpoint error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// 获取实时统计信息
router.get("/stats", async (req, res) => {
  try {
    const allUsers = await db.getAllUsers();

    // 过滤真实Pi用户
    const realUsers = allUsers.filter(
      (user) =>
        user.id.startsWith("pi_user_") &&
        !user.username.includes("测试") &&
        !user.username.includes("test") &&
        !user.username.toLowerCase().includes("mock") &&
        !user.username.includes("玩家") &&
        user.username !== "测试玩家432"
    );

    // 有游戏记录的用户
    const activeUsers = realUsers.filter((user) => user.stats.totalGames > 0);

    res.json({
      success: true,
      stats: {
        totalUsers: realUsers.length,
        activeUsers: activeUsers.length,
        totalGames: activeUsers.reduce(
          (sum, user) => sum + user.stats.totalGames,
          0
        ),
        onlineUsers: realUsers.filter((user) => {
          const now = new Date();
          const lastLogin = new Date(user.lastLoginAt);
          const hoursDiff = (now - lastLogin) / (1000 * 60 * 60);
          return hoursDiff <= 1; // 1小时内登录的用户
        }).length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Stats endpoint error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// 清理测试数据端点
router.post("/cleanup", async (req, res) => {
  try {
    const deletedCount = await db.cleanupTestData();
    res.json({
      success: true,
      message: `已清理 ${deletedCount} 个测试用户`,
      deletedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cleanup endpoint error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

export default router;
