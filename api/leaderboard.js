const db = require("../lib/database");

module.exports = async (req, res) => {
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
    const { limit = 100, userId } = req.query;

    // 如果请求用户排名
    if (req.url.includes("/rank")) {
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "User ID is required for rank query",
        });
      }

      const rank = await db.getUserRank(userId);
      return res.json({
        success: true,
        rank,
        timestamp: new Date().toISOString(),
      });
    }

    // 获取排行榜
    const leaderboard = await db.getLeaderboard(parseInt(limit));

    res.json({
      success: true,
      leaderboard,
      total: leaderboard.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Get leaderboard error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
