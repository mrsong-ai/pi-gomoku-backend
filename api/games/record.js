// 导入共享数据库
import db from "../../lib/database.js";

export default async function handler(req, res) {
  // 设置CORS头
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  try {
    const { userId, username, gameResult, gameData } = req.body;
    console.log(`[游戏记录API] 收到请求:`, {
      userId,
      username,
      gameResult,
      gameData,
    });

    if (!userId || !gameResult) {
      console.log("[游戏记录API] 错误: 缺少必要参数");
      return res.status(400).json({
        success: false,
        message: "User ID and game result are required",
      });
    }

    // 记录游戏
    const gameId = "game_" + Date.now();
    const game = {
      id: gameId,
      userId,
      username,
      result: gameResult,
      timestamp: new Date().toISOString(),
      ...gameData,
    };

    // 使用共享数据库记录游戏
    const recordedGameId = await db.recordGame({
      userId,
      username,
      result: gameResult,
      ...gameData,
    });

    // 获取更新后的用户数据
    const user = await db.getUser(userId);
    if (!user) {
      console.error("Failed to get user after recording game");
      return res.status(500).json({
        success: false,
        message: "Failed to update user stats",
      });
    }

    res.json({
      success: true,
      gameId: recordedGameId,
      userStats: user.stats,
      message: "Game recorded successfully",
    });
  } catch (error) {
    console.error("Record game error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}
