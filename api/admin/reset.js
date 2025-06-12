import express from "express";
import db from "../../lib/database.js";

const router = express.Router();

// 手动触发月度重置（管理员功能）
router.post("/monthly", async (req, res) => {
  try {
    console.log("[管理API] 收到手动月度重置请求");

    // 简单的安全检查（生产环境应该使用更强的认证）
    const { adminKey } = req.body;
    if (adminKey !== "pi_gomoku_admin_2024") {
      return res.status(403).json({
        success: false,
        error: "无效的管理员密钥",
      });
    }

    // 执行月度重置
    const result = await db.manualMonthlyReset();

    console.log("[管理API] 月度重置完成");

    res.json({
      success: true,
      message: "月度重置已完成",
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (error) {
    console.error("[管理API] 月度重置失败:", error);
    res.status(500).json({
      success: false,
      error: "月度重置失败",
      details: error.message,
    });
  }
});

// 获取重置状态信息
router.get("/status", async (req, res) => {
  try {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const lastResetMonth = db.lastResetMonth;

    res.json({
      success: true,
      currentMonth,
      lastResetMonth,
      needsReset: currentMonth !== lastResetMonth,
      currentTime: currentDate.toISOString(),
      nextResetDate: new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        1
      ).toISOString(),
    });
  } catch (error) {
    console.error("[管理API] 获取重置状态失败:", error);
    res.status(500).json({
      success: false,
      error: "获取重置状态失败",
      details: error.message,
    });
  }
});

// 清理重复数据
router.post("/cleanup", async (req, res) => {
  try {
    console.log("[管理API] 收到清理重复数据请求");

    // 简单的安全检查
    const { adminKey } = req.body;
    if (adminKey !== "pi_gomoku_admin_2024") {
      return res.status(403).json({
        success: false,
        error: "无效的管理员密钥",
      });
    }

    // 执行数据清理
    const duplicateCount = await db.cleanupDuplicateData();
    const accessTokenDuplicateCount =
      await db.cleanupAccessTokenBasedDuplicates();
    const testUserCount = await db.cleanupTestData();

    console.log("[管理API] 数据清理完成");

    res.json({
      success: true,
      message: "数据清理已完成",
      duplicateUsersRemoved: duplicateCount,
      accessTokenDuplicatesRemoved: accessTokenDuplicateCount,
      testUsersRemoved: testUserCount,
      totalRemoved: duplicateCount + accessTokenDuplicateCount + testUserCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[管理API] 数据清理失败:", error);
    res.status(500).json({
      success: false,
      error: "数据清理失败",
      details: error.message,
    });
  }
});

// 专门清理accessToken重复用户的端点
router.post("/cleanup-access-token-duplicates", async (req, res) => {
  try {
    console.log("[管理API] 收到清理accessToken重复用户请求");

    // 简单的安全检查
    const { adminKey } = req.body;
    if (adminKey !== "pi_gomoku_admin_2024") {
      return res.status(403).json({
        success: false,
        error: "无效的管理员密钥",
      });
    }

    // 获取清理前的统计
    const allUsersBefore = await db.getAllUsers();
    const piUsersBefore = allUsersBefore.filter((user) =>
      user.id.startsWith("pi_user_")
    );

    // 按用户名分组显示重复情况
    const usersByName = new Map();
    piUsersBefore.forEach((user) => {
      if (!usersByName.has(user.username)) {
        usersByName.set(user.username, []);
      }
      usersByName.get(user.username).push(user);
    });

    const duplicateNamesBefore = Array.from(usersByName.entries()).filter(
      ([name, users]) => users.length > 1
    );

    console.log(
      `[管理API] 清理前发现重复用户名: ${duplicateNamesBefore.length}个`
    );
    duplicateNamesBefore.forEach(([name, users]) => {
      console.log(`[管理API] - ${name}: ${users.length}个账户`);
    });

    // 执行专门的accessToken重复清理
    const accessTokenDuplicateCount =
      await db.cleanupAccessTokenBasedDuplicates();

    // 获取清理后的统计
    const allUsersAfter = await db.getAllUsers();
    const piUsersAfter = allUsersAfter.filter((user) =>
      user.id.startsWith("pi_user_")
    );

    console.log("[管理API] accessToken重复用户清理完成");

    res.json({
      success: true,
      message: "accessToken重复用户清理已完成",
      beforeCleanup: {
        totalUsers: allUsersBefore.length,
        piUsers: piUsersBefore.length,
        duplicateUsernames: duplicateNamesBefore.length,
      },
      afterCleanup: {
        totalUsers: allUsersAfter.length,
        piUsers: piUsersAfter.length,
        usersRemoved: piUsersBefore.length - piUsersAfter.length,
      },
      accessTokenDuplicatesRemoved: accessTokenDuplicateCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[管理API] accessToken重复用户清理失败:", error);
    res.status(500).json({
      success: false,
      error: "accessToken重复用户清理失败",
      details: error.message,
    });
  }
});

export default router;
