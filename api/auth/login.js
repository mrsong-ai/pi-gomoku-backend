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
    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({
        success: false,
        message: "Access token is required",
      });
    }

    // 生成用户ID（基于accessToken确保一致性）
    const piUserId =
      "pi_user_" + Buffer.from(accessToken).toString("base64").slice(0, 10);

    console.log(`[登录API] Pi用户登录: ${piUserId}`);

    // 使用共享数据库检查用户数据
    let user = await db.getUser(piUserId);

    if (!user) {
      // 首次登录，创建新用户（0数据）
      console.log(`[登录API] 创建新Pi用户: ${piUserId}`);
      user = await db.createUser(piUserId, {
        username: "Pi用户" + Math.floor(Math.random() * 1000),
      });
    } else {
      // 更新最后登录时间
      user.lastLoginAt = new Date().toISOString();
      await db.updateUser(piUserId, { lastLoginAt: user.lastLoginAt });
      console.log(
        `[登录API] 用户重新登录: ${piUserId}, 用户名: ${user.username}`
      );
    }

    res.json({
      success: true,
      user: {
        piUserId: user.id,
        username: user.username,
        stats: user.stats,
      },
      message: "Login successful",
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}
