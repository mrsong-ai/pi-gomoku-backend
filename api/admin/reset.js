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

// 手动修正用户数据的端点
router.post("/fix-user-data", async (req, res) => {
  try {
    console.log("[管理API] 收到修正用户数据请求");

    // 简单的安全检查
    const { adminKey, username, correctStats } = req.body;
    if (adminKey !== "pi_gomoku_admin_2024") {
      return res.status(403).json({
        success: false,
        error: "无效的管理员密钥",
      });
    }

    if (!username || !correctStats) {
      return res.status(400).json({
        success: false,
        error: "缺少用户名或正确的统计数据",
      });
    }

    // 查找用户
    const allUsers = await db.getAllUsers();
    const targetUser = allUsers.find((user) => user.username === username);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: `未找到用户: ${username}`,
      });
    }

    console.log(
      `[管理API] 找到用户: ${targetUser.id}, 当前数据:`,
      targetUser.stats
    );
    console.log(`[管理API] 要修正为:`, correctStats);

    // 备份原始数据
    const originalStats = { ...targetUser.stats };

    // 更新用户统计数据
    const updatedStats = {
      totalGames: correctStats.totalGames || targetUser.stats.totalGames,
      wins: correctStats.wins || targetUser.stats.wins,
      losses: correctStats.losses || targetUser.stats.losses,
      draws: correctStats.draws || targetUser.stats.draws,
      winRate:
        correctStats.winRate !== undefined
          ? correctStats.winRate
          : targetUser.stats.winRate,
      rank: correctStats.rank || targetUser.stats.rank,
    };

    // 计算胜率（如果没有提供）
    if (updatedStats.totalGames > 0 && correctStats.winRate === undefined) {
      updatedStats.winRate = Math.round(
        (updatedStats.wins / updatedStats.totalGames) * 100
      );
    }

    // 更新用户数据
    await db.updateUser(targetUser.id, {
      stats: updatedStats,
      lastUpdatedAt: new Date().toISOString(),
      dataFixedAt: new Date().toISOString(),
    });

    console.log(`[管理API] 用户数据修正完成: ${username}`);

    res.json({
      success: true,
      message: `用户 ${username} 的数据已修正`,
      userId: targetUser.id,
      originalStats,
      updatedStats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[管理API] 用户数据修正失败:", error);
    res.status(500).json({
      success: false,
      error: "用户数据修正失败",
      details: error.message,
    });
  }
});

// 完全重置所有用户数据的端点
router.post("/complete-reset", async (req, res) => {
  try {
    console.log("[管理API] 收到完全重置请求");

    // 简单的安全检查
    const { adminKey, confirmReset } = req.body;
    if (adminKey !== "pi_gomoku_admin_2024") {
      return res.status(403).json({
        success: false,
        error: "无效的管理员密钥",
      });
    }

    if (confirmReset !== "CONFIRM_COMPLETE_RESET") {
      return res.status(400).json({
        success: false,
        error: "需要确认重置标识",
      });
    }

    // 获取重置前的统计
    const allUsersBefore = await db.getAllUsers();
    const piUsersBefore = allUsersBefore.filter((user) =>
      user.id.startsWith("pi_user_")
    );

    console.log(
      `[管理API] 重置前统计: 总用户${allUsersBefore.length}个, Pi用户${piUsersBefore.length}个`
    );

    // 完全清空所有用户数据
    await db.clearAllUsers();

    console.log("[管理API] 所有用户数据已清空");

    // 获取重置后的统计
    const allUsersAfter = await db.getAllUsers();

    res.json({
      success: true,
      message: "所有用户数据已完全重置",
      beforeReset: {
        totalUsers: allUsersBefore.length,
        piUsers: piUsersBefore.length,
      },
      afterReset: {
        totalUsers: allUsersAfter.length,
        piUsers: 0,
      },
      resetTime: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[管理API] 完全重置失败:", error);
    res.status(500).json({
      success: false,
      error: "完全重置失败",
      details: error.message,
    });
  }
});

// 获取系统性能统计
router.post("/system-stats", async (req, res) => {
  try {
    console.log("[管理API] 收到系统性能统计请求");

    // 简单的安全检查
    const { adminKey } = req.body;
    if (adminKey !== "pi_gomoku_admin_2024") {
      return res.status(403).json({
        success: false,
        error: "无效的管理员密钥",
      });
    }

    // 获取系统统计
    const systemStats = db.getSystemStats();
    const userStats = await db.getAllUsers();

    // 计算额外统计
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const recentActiveUsers = userStats.filter(
      (user) => new Date(user.lastLoginAt) > oneHourAgo
    ).length;

    res.json({
      success: true,
      systemStats,
      performance: {
        memoryUsagePercent: Math.round(
          (systemStats.memory.used / systemStats.memory.total) * 100
        ),
        isHighMemoryUsage: systemStats.memory.used > 400, // 超过400MB警告
        recentActiveUsers,
        totalUsers: userStats.length,
        averageGamesPerUser:
          userStats.length > 0
            ? Math.round(
                userStats.reduce(
                  (sum, user) => sum + user.stats.totalGames,
                  0
                ) / userStats.length
              )
            : 0,
      },
      warnings: [
        ...(systemStats.memory.used > 400
          ? ["内存使用量较高，建议考虑升级方案"]
          : []),
        ...(recentActiveUsers > 20 ? ["活跃用户较多，注意性能监控"] : []),
        ...(systemStats.uptime.hours < 1
          ? ["服务最近重启过，数据可能丢失"]
          : []),
      ],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[管理API] 系统性能统计失败:", error);
    res.status(500).json({
      success: false,
      error: "系统性能统计失败",
      details: error.message,
    });
  }
});

export default router;
