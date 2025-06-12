// 内存数据库模拟 (生产环境建议使用真实数据库)
class MemoryDatabase {
  constructor() {
    this.users = new Map();
    this.games = new Map();
    this.leaderboard = [];
    this.lastResetMonth = new Date().getMonth(); // 记录上次重置的月份
    this.initTestData();
    this.startMonthlyResetScheduler(); // 启动月度重置调度器
  }

  // 初始化测试数据
  initTestData() {
    console.log("初始化内存数据库...");
    // 不再添加测试数据，使用真实用户数据
    console.log("数据库初始化完成，等待真实用户数据");

    // 启动时清理可能存在的测试数据
    setTimeout(() => {
      this.cleanupTestData();
    }, 5000); // 5秒后清理，确保服务器完全启动
  }

  // 用户相关操作
  async getUser(userId) {
    return this.users.get(userId);
  }

  async createUser(userId, userData) {
    const user = {
      id: userId,
      username: userData.username || `User_${userId.slice(-6)}`,
      walletAddress: userData.walletAddress || "",
      balance: 0,
      stats: {
        totalGames: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        winRate: 0,
        score: 100,
        rank: 0,
      },
      // 历史统计数据（永不重置）
      historicalStats: {
        totalGames: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        allTimeWinRate: 0,
      },
      gameHistory: [],
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    this.users.set(userId, user);
    return user;
  }

  async updateUser(userId, updates) {
    const user = this.users.get(userId);
    if (!user) return null;

    Object.assign(user, updates);
    this.users.set(userId, user);
    return user;
  }

  // 游戏记录操作
  async recordGame(gameData) {
    const gameId = Date.now().toString();

    // 检查是否为数据同步请求
    if (gameData.result === "sync" && gameData.syncData) {
      console.log(`[数据库] 处理数据同步请求: ${gameData.userId}`);
      return await this.syncUserData(
        gameData.userId,
        gameData.username,
        gameData.syncData
      );
    }

    this.games.set(gameId, {
      id: gameId,
      ...gameData,
      timestamp: new Date().toISOString(),
    });

    // 更新用户统计
    let user = this.users.get(gameData.userId);
    if (!user) {
      // 如果用户不存在，创建新用户
      user = await this.createUser(gameData.userId, {
        username: gameData.username || `用户${gameData.userId.slice(-6)}`,
      });
    }

    // 更新用户名（确保与前端保持一致）
    if (gameData.username && gameData.username !== user.username) {
      user.username = gameData.username;
      console.log(
        `[数据库] 更新用户名: ${gameData.userId} -> ${gameData.username}`
      );
    }

    // 更新月度统计
    user.stats.totalGames++;

    // 更新历史统计（永不重置）
    if (!user.historicalStats) {
      user.historicalStats = {
        totalGames: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        allTimeWinRate: 0,
      };
    }
    user.historicalStats.totalGames++;

    if (gameData.result === "win") {
      user.stats.wins++;
      user.historicalStats.wins++;
      user.stats.score += 10; // 胜利+10分
    } else if (gameData.result === "loss") {
      user.stats.losses++;
      user.historicalStats.losses++;
      user.stats.score = Math.max(100, user.stats.score - 5); // 失败-5分，最低100分
    } else if (gameData.result === "draw") {
      user.stats.draws++;
      user.historicalStats.draws++;
      user.stats.score += 1; // 平局+1分
    }

    // 计算月度胜率
    user.stats.winRate =
      user.stats.totalGames > 0
        ? Math.round((user.stats.wins / user.stats.totalGames) * 100)
        : 0;

    // 计算历史胜率
    user.historicalStats.allTimeWinRate =
      user.historicalStats.totalGames > 0
        ? Math.round(
            (user.historicalStats.wins / user.historicalStats.totalGames) * 100
          )
        : 0;

    user.gameHistory.push(gameId);
    this.users.set(gameData.userId, user);

    return gameId;
  }

  // 同步用户数据（从前端本地数据恢复）
  async syncUserData(userId, username, syncData) {
    console.log(`[数据库] 同步用户数据: ${userId}`, syncData);

    let user = this.users.get(userId);
    if (!user) {
      // 创建新用户
      user = await this.createUser(userId, { username });
    }

    // 更新用户统计数据（使用前端传来的本地数据）
    user.username = username || syncData.username || user.username;
    user.stats = {
      totalGames: syncData.totalGames || 0,
      wins: syncData.wins || 0,
      losses: syncData.losses || 0,
      draws: syncData.draws || 0,
      winRate: syncData.winRate || 0,
      score: syncData.score || 100,
      rank: syncData.rank || 0,
    };

    this.users.set(userId, user);
    console.log(`[数据库] 用户数据同步完成: ${userId}`, user.stats);

    return "sync_" + Date.now();
  }

  // 排行榜操作
  async getLeaderboard(limit = 100) {
    console.log(`[数据库] 获取排行榜，当前用户数量: ${this.users.size}`);

    const allUsers = Array.from(this.users.values());
    console.log(
      `[数据库] 所有用户:`,
      allUsers.map((u) => ({
        id: u.id,
        username: u.username,
        totalGames: u.stats.totalGames,
        wins: u.stats.wins,
        winRate: u.stats.winRate,
      }))
    );

    const users = allUsers
      .filter((user) => {
        // 过滤条件：1. 最少1局游戏 2. 不是测试用户
        return (
          user.stats.totalGames >= 1 &&
          !user.id.startsWith("test_") &&
          !user.username.includes("测试")
        );
      })
      .sort((a, b) => {
        // 按胜率排序，胜率相同时按总局数排序
        if (b.stats.winRate !== a.stats.winRate) {
          return b.stats.winRate - a.stats.winRate;
        }
        return b.stats.totalGames - a.stats.totalGames;
      })
      .slice(0, limit)
      .map((user, index) => ({
        rank: index + 1,
        userId: user.id,
        username: user.username,
        totalGames: user.stats.totalGames,
        wins: user.stats.wins,
        winRate: user.stats.winRate,
        score: user.stats.score,
      }));

    console.log(`[数据库] 排行榜结果:`, users);
    return users;
  }

  // 获取用户排名
  async getUserRank(userId) {
    // 如果是测试用户，不参与排名
    const user = this.users.get(userId);
    if (!user || userId.startsWith("test_") || user.username.includes("测试")) {
      return 0;
    }

    const allUsers = Array.from(this.users.values())
      .filter((user) => {
        // 过滤条件：1. 最少1局游戏 2. 不是测试用户
        return (
          user.stats.totalGames >= 1 &&
          !user.id.startsWith("test_") &&
          !user.username.includes("测试")
        );
      })
      .sort((a, b) => {
        // 按胜率排序，胜率相同时按总局数排序
        if (b.stats.winRate !== a.stats.winRate) {
          return b.stats.winRate - a.stats.winRate;
        }
        return b.stats.totalGames - a.stats.totalGames;
      });

    const userIndex = allUsers.findIndex((user) => user.id === userId);
    return userIndex >= 0 ? userIndex + 1 : 0;
  }

  // 支付相关操作
  async updateBalance(userId, amount) {
    const user = this.users.get(userId);
    if (!user) return null;

    user.balance = (user.balance || 0) + amount;
    this.users.set(userId, user);
    return user.balance;
  }

  async getBalance(userId) {
    const user = this.users.get(userId);
    return user ? user.balance || 0 : 0;
  }

  // 调试方法：获取所有用户数据
  async getAllUsers() {
    return Array.from(this.users.values());
  }

  // 清理测试数据
  async cleanupTestData() {
    const testUserIds = [];
    for (const [userId, user] of this.users.entries()) {
      if (userId.startsWith("test_") || user.username.includes("测试")) {
        testUserIds.push(userId);
      }
    }

    testUserIds.forEach((userId) => {
      this.users.delete(userId);
      console.log(`[数据库] 删除测试用户: ${userId}`);
    });

    return testUserIds.length;
  }

  // 月度重置调度器
  startMonthlyResetScheduler() {
    // 每小时检查一次是否需要重置
    setInterval(() => {
      this.checkAndPerformMonthlyReset();
    }, 60 * 60 * 1000); // 1小时

    // 启动时也检查一次
    setTimeout(() => {
      this.checkAndPerformMonthlyReset();
    }, 5000);
  }

  // 检查并执行月度重置
  async checkAndPerformMonthlyReset() {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();

    // 如果月份发生变化，执行重置
    if (currentMonth !== this.lastResetMonth) {
      console.log(
        `[数据库] 检测到月份变化，执行月度重置: ${this.lastResetMonth} -> ${currentMonth}`
      );
      await this.performMonthlyReset();
      this.lastResetMonth = currentMonth;
    }
  }

  // 执行月度重置
  async performMonthlyReset() {
    console.log(`[数据库] 开始执行月度重置...`);

    let resetCount = 0;
    for (const [userId, user] of this.users.entries()) {
      // 保存当前月度数据到历史记录（可选）
      const monthlyRecord = {
        month: new Date().toISOString().slice(0, 7), // YYYY-MM格式
        stats: { ...user.stats },
        timestamp: new Date().toISOString(),
      };

      // 重置月度统计数据
      user.stats = {
        totalGames: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        winRate: 0,
        score: 100, // 重置为初始分数
        rank: 0,
      };

      // 确保历史统计数据存在且不被重置
      if (!user.historicalStats) {
        user.historicalStats = {
          totalGames: 0,
          wins: 0,
          losses: 0,
          draws: 0,
          allTimeWinRate: 0,
        };
      }

      // 添加月度记录到用户历史（可选功能）
      if (!user.monthlyHistory) {
        user.monthlyHistory = [];
      }
      user.monthlyHistory.push(monthlyRecord);

      // 只保留最近12个月的记录
      if (user.monthlyHistory.length > 12) {
        user.monthlyHistory = user.monthlyHistory.slice(-12);
      }

      this.users.set(userId, user);
      resetCount++;
    }

    console.log(`[数据库] 月度重置完成，重置了 ${resetCount} 个用户的月度数据`);
    console.log(`[数据库] 历史数据已保留，月度排行榜已重新开始`);
  }

  // 手动触发月度重置（用于测试）
  async manualMonthlyReset() {
    await this.performMonthlyReset();
    this.lastResetMonth = new Date().getMonth();
    return { success: true, message: "月度重置已完成" };
  }
}

// 导出单例实例
const db = new MemoryDatabase();
export default db;
