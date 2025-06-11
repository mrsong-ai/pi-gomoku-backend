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

  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  try {
    const { uid } = req.query;
    console.log(`[用户统计API] 收到请求 - UID: ${uid}`);

    if (!uid) {
      console.log("[用户统计API] 错误: 缺少用户ID");
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // 使用共享数据库获取用户数据
    let user = await db.getUser(uid);
    console.log(
      `[用户统计API] 数据库查询结果:`,
      user ? user.stats : "用户不存在"
    );

    if (!user) {
      // 创建新用户
      console.log(`[用户统计API] 创建新用户: ${uid}`);
      user = await db.createUser(uid, {
        username: `用户${uid.slice(-6)}`,
      });
    }

    console.log(`[用户统计API] 返回数据:`, user.stats);
    res.json({
      success: true,
      stats: user.stats,
    });
  } catch (error) {
    console.error("Get user stats error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}
