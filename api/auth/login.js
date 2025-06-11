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

    // 检查是否已有用户数据
    let user = users.get(piUserId);

    if (!user) {
      // 首次登录，创建新用户（0数据）
      user = {
        piUserId: piUserId,
        username: "测试玩家" + Math.floor(Math.random() * 1000),
        stats: {
          totalGames: 0,
          wins: 0,
          losses: 0,
          winRate: 0,
          score: 100,
          rank: 0,
        },
      };

      // 保存新用户数据
      users.set(piUserId, user);
    }

    res.json({
      success: true,
      user: user,
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
