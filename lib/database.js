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
    console.log('初始化内存数据库...');
  }

  // 用户相关操作
  async getUser(userId) {
    return this.users.get(userId);
  }

  async createUser(userId, userData) {
    const user = {
      id: userId,
      username: userData.username || `User_${userId.slice(-6)}`,
      walletAddress: userData.walletAddress || '',
      balance: 0,
      stats: {
        totalGames: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        winRate: 0,
        score: 100,
        rank: 0
      },
      gameHistory: [],
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
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
      timestamp: new Date().toISOString()
    });
    
    // 更新用户统计
    const user = this.users.get(gameData.userId);
    if (user) {
      user.stats.totalGames++;
      
      if (gameData.result === 'win') {
        user.stats.wins++;
        user.stats.score++;
      } else if (gameData.result === 'loss') {
        user.stats.losses++;
        user.stats.score--;
      } else if (gameData.result === 'draw') {
        user.stats.draws++;
      }
      
      user.stats.winRate = user.stats.totalGames > 0 
        ? Math.round((user.stats.wins / user.stats.totalGames) * 100) 
        : 0;
      
      user.gameHistory.push(gameId);
      this.users.set(gameData.userId, user);
    }
    
    return gameId;
  }

  // 排行榜操作
  async getLeaderboard(limit = 100) {
    const users = Array.from(this.users.values())
      .filter(user => user.stats.totalGames >= 60) // 最少60局
      .sort((a, b) => b.stats.score - a.stats.score)
      .slice(0, limit)
      .map((user, index) => ({
        rank: index + 1,
        username: user.username,
        totalGames: user.stats.totalGames,
        wins: user.stats.wins,
        winRate: user.stats.winRate,
        score: user.stats.score
      }));
    
    return users;
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
    return user ? (user.balance || 0) : 0;
  }
}

// 导出单例实例
const db = new MemoryDatabase();
module.exports = db;
