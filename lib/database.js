// 内存数据库模拟 (生产环境建议使用真实数据库)
class MemoryDatabase {
  constructor() {
    this.users = new Map();
    this.games = new Map();
    this.leaderboard = [];
    this.initTestData();
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

    user.stats.totalGames++;

    if (gameData.result === "win") {
      user.stats.wins++;
      user.stats.score += 10; // 胜利+10分
    } else if (gameData.result === "loss") {
      user.stats.losses++;
      user.stats.score = Math.max(100, user.stats.score - 5); // 失败-5分，最低100分
    } else if (gameData.result === "draw") {
      user.stats.draws++;
      user.stats.score += 1; // 平局+1分
    }

    user.stats.winRate =
      user.stats.totalGames > 0
        ? Math.round((user.stats.wins / user.stats.totalGames) * 100)
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
      .filter((user) => user.stats.totalGames >= 1) // 最少1局即可上榜
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
    const allUsers = Array.from(this.users.values())
      .filter((user) => user.stats.totalGames >= 1) // 最少1局即可上榜
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
}

// 导出单例实例
const db = new MemoryDatabase();
export default db;
