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

    // 添加一些测试用户数据用于排行榜演示
    const testUsers = [
      {
        id: "test_user_1",
        username: "棋圣大师",
        totalGames: 80,
        wins: 76,
        score: 176,
      },
      {
        id: "test_user_2",
        username: "五子高手",
        totalGames: 75,
        wins: 69,
        score: 169,
      },
      {
        id: "test_user_3",
        username: "连珠达人",
        totalGames: 70,
        wins: 62,
        score: 162,
      },
      {
        id: "test_user_4",
        username: "黑白传说",
        totalGames: 65,
        wins: 56,
        score: 156,
      },
      {
        id: "test_user_5",
        username: "智慧之星",
        totalGames: 68,
        wins: 57,
        score: 157,
      },
    ];

    testUsers.forEach((userData) => {
      const user = {
        id: userData.id,
        username: userData.username,
        walletAddress: "",
        balance: 0,
        stats: {
          totalGames: userData.totalGames,
          wins: userData.wins,
          losses: userData.totalGames - userData.wins,
          draws: 0,
          winRate: Math.round((userData.wins / userData.totalGames) * 100),
          score: userData.score,
          rank: 0,
        },
        gameHistory: [],
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };

      this.users.set(userData.id, user);
    });

    console.log(`已添加 ${testUsers.length} 个测试用户到排行榜`);
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

  // 排行榜操作
  async getLeaderboard(limit = 100) {
    const users = Array.from(this.users.values())
      .filter((user) => user.stats.totalGames >= 60) // 最少60局
      .sort((a, b) => b.stats.score - a.stats.score)
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

    return users;
  }

  // 获取用户排名
  async getUserRank(userId) {
    const allUsers = Array.from(this.users.values())
      .filter((user) => user.stats.totalGames >= 60) // 最少60局
      .sort((a, b) => b.stats.score - a.stats.score);

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
}

// 导出单例实例
const db = new MemoryDatabase();
export default db;
