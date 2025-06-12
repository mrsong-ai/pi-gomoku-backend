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
    const { accessToken, userInfo } = req.body;

    if (!accessToken) {
      return res.status(400).json({
        success: false,
        message: "Access token is required",
      });
    }

    // 生成用户ID（基于用户唯一标识符确保一致性）
    let piUserId;
    if (userInfo && userInfo.uid) {
      // 使用Pi Network返回的用户唯一标识符
      piUserId = "pi_user_" + userInfo.uid;
      console.log(
        `[登录API] 使用Pi UID生成用户ID: ${piUserId}, 用户名: ${userInfo.username}`
      );
    } else {
      // 兼容旧版本：基于accessToken生成（但这会导致重复用户问题）
      piUserId =
        "pi_user_" + Buffer.from(accessToken).toString("base64").slice(0, 10);
      console.log(
        `[登录API] ⚠️ 使用accessToken生成用户ID: ${piUserId} (可能导致重复用户)`
      );
    }

    // 额外的安全检查：如果使用用户名查找到现有用户但ID不同，记录警告
    if (userInfo && userInfo.username) {
      const allUsers = await db.getAllUsers();
      const existingUserWithSameName = allUsers.find(
        (u) => u.username === userInfo.username && u.id !== piUserId
      );

      if (existingUserWithSameName) {
        console.log(`[登录API] ⚠️ 警告：发现同名用户但ID不同`);
        console.log(
          `[登录API] 现有用户: ${existingUserWithSameName.id}, 新用户: ${piUserId}`
        );
        console.log(`[登录API] 用户名: ${userInfo.username}`);
      }
    }

    // 使用共享数据库检查用户数据
    let user = await db.getUser(piUserId);

    if (!user) {
      // 首次登录，创建新用户（0数据）
      console.log(`[登录API] 创建新Pi用户: ${piUserId}`);
      const username =
        userInfo && userInfo.username
          ? userInfo.username
          : "Pi用户" + Math.floor(Math.random() * 1000);
      user = await db.createUser(piUserId, {
        username: username,
      });

      // 触发数据变更通知（新用户创建）
      console.log(`[登录API] 触发新用户创建数据刷新通知`);
      setTimeout(() => {
        // 延迟触发，确保数据库操作完成
        db.notifyDataChange &&
          db.notifyDataChange("USER_LOGIN", {
            userId: piUserId,
            username: username,
            isNewUser: true,
          });
      }, 100);
    } else {
      // 更新最后登录时间和用户名（如果有新的用户名）
      user.lastLoginAt = new Date().toISOString();
      const updates = { lastLoginAt: user.lastLoginAt };

      // 如果传入了新的用户名，更新用户名
      if (
        userInfo &&
        userInfo.username &&
        userInfo.username !== user.username
      ) {
        updates.username = userInfo.username;
        user.username = userInfo.username;
      }

      await db.updateUser(piUserId, updates);
      console.log(
        `[登录API] 用户重新登录: ${piUserId}, 用户名: ${user.username}`
      );

      // 触发数据变更通知（用户重新登录）
      console.log(`[登录API] 触发用户重新登录数据刷新通知`);
      setTimeout(() => {
        // 延迟触发，确保数据库操作完成
        db.notifyDataChange &&
          db.notifyDataChange("USER_LOGIN", {
            userId: piUserId,
            username: user.username,
            isNewUser: false,
          });
      }, 100);
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
