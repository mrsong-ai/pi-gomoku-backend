import fs from "fs";
import path from "path";

// 持久化内存数据库 (带文件备份)
class MemoryDatabase {
  constructor() {
    this.users = new Map();
    this.games = new Map();
    this.leaderboard = [];
    this.lastResetMonth = new Date().getMonth(); // 记录上次重置的月份
    this.dataChangeListeners = []; // 数据变更监听器

    // 数据文件路径
    this.dataDir = path.join(process.cwd(), "data");
    this.usersFile = path.join(this.dataDir, "users.json");
    this.gamesFile = path.join(this.dataDir, "games.json");

    // 确保数据目录存在
    this.ensureDataDirectory();

    // 先加载持久化数据，再初始化
    this.loadPersistedData();
    this.initTestData();
    this.startMonthlyResetScheduler(); // 启动月度重置调度器

    // 定期保存数据
    this.startAutoSave();
  }

  // 确保数据目录存在
  ensureDataDirectory() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
        console.log(`[数据库] 创建数据目录: ${this.dataDir}`);
      }
    } catch (error) {
      console.error("[数据库] 创建数据目录失败:", error);
    }
  }

  // 添加数据变更监听器
  addDataChangeListener(callback) {
    this.dataChangeListeners.push(callback);
  }

  // 移除数据变更监听器
  removeDataChangeListener(callback) {
    const index = this.dataChangeListeners.indexOf(callback);
    if (index > -1) {
      this.dataChangeListeners.splice(index, 1);
    }
  }

  // 触发数据变更通知
  notifyDataChange(changeType, data) {
    console.log(`[数据库] 数据变更通知: ${changeType}`, data);
    this.dataChangeListeners.forEach((callback) => {
      try {
        callback(changeType, data);
      } catch (error) {
        console.error("[数据库] 数据变更监听器执行错误:", error);
      }
    });

    // 数据变更时触发保存
    this.saveDataAsync();
  }

  // 加载持久化数据
  loadPersistedData() {
    try {
      console.log("[数据库] 开始加载持久化数据...");

      // 加载用户数据
      if (fs.existsSync(this.usersFile)) {
        const usersData = fs.readFileSync(this.usersFile, "utf8");
        const usersArray = JSON.parse(usersData);

        // 将数组转换为Map
        this.users = new Map();
        usersArray.forEach((user) => {
          this.users.set(user.id, user);
        });

        console.log(`[数据库] 成功加载 ${this.users.size} 个用户数据`);
      } else {
        console.log("[数据库] 用户数据文件不存在，使用空数据");
      }

      // 加载游戏数据
      if (fs.existsSync(this.gamesFile)) {
        const gamesData = fs.readFileSync(this.gamesFile, "utf8");
        const gamesArray = JSON.parse(gamesData);

        // 将数组转换为Map
        this.games = new Map();
        gamesArray.forEach((game) => {
          this.games.set(game.id, game);
        });

        console.log(`[数据库] 成功加载 ${this.games.size} 条游戏记录`);
      } else {
        console.log("[数据库] 游戏数据文件不存在，使用空数据");
      }
    } catch (error) {
      console.error("[数据库] 加载持久化数据失败:", error);
      console.log("[数据库] 将使用空数据重新开始");
      this.users = new Map();
      this.games = new Map();
    }
  }

  // 保存数据到文件（同步）
  saveData() {
    try {
      // 保存用户数据
      const usersArray = Array.from(this.users.values());
      fs.writeFileSync(this.usersFile, JSON.stringify(usersArray, null, 2));

      // 保存游戏数据
      const gamesArray = Array.from(this.games.values());
      fs.writeFileSync(this.gamesFile, JSON.stringify(gamesArray, null, 2));

      console.log(
        `[数据库] 数据保存成功: ${usersArray.length} 用户, ${gamesArray.length} 游戏`
      );
    } catch (error) {
      console.error("[数据库] 数据保存失败:", error);
    }
  }

  // 异步保存数据（防抖）
  saveDataAsync() {
    // 清除之前的保存定时器
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
    }

    // 延迟保存，避免频繁写入
    this.saveTimer = setTimeout(() => {
      this.saveData();
    }, 1000); // 1秒后保存
  }

  // 启动自动保存
  startAutoSave() {
    // 每5分钟自动保存一次
    setInterval(() => {
      this.saveData();
    }, 5 * 60 * 1000); // 5分钟

    console.log("[数据库] 自动保存已启动（每5分钟）");
  }

  // 初始化测试数据
  initTestData() {
    console.log("初始化内存数据库...");
    console.log(
      `数据库初始化完成，当前用户数: ${this.users.size}, 游戏记录: ${this.games.size}`
    );

    // 启动时清理可能存在的测试数据和重复数据
    setTimeout(() => {
      this.cleanupTestData();
      this.cleanupDuplicateData();
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

    // 触发数据变更通知
    this.notifyDataChange("USER_CREATED", {
      userId: userId,
      username: user.username,
      totalUsers: this.users.size,
    });

    return user;
  }

  async updateUser(userId, updates) {
    const user = this.users.get(userId);
    if (!user) return null;

    const oldStats = { ...user.stats };
    Object.assign(user, updates);
    this.users.set(userId, user);

    // 如果统计数据发生变化，触发通知
    if (updates.stats || updates.lastLoginAt) {
      this.notifyDataChange("USER_UPDATED", {
        userId: userId,
        username: user.username,
        oldStats: oldStats,
        newStats: user.stats,
        updateType: updates.stats ? "STATS" : "LOGIN",
      });
    }

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
    } else if (gameData.result === "loss") {
      user.stats.losses++;
      user.historicalStats.losses++;
    } else if (gameData.result === "draw") {
      user.stats.draws++;
      user.historicalStats.draws++;
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

    // 使用Map去重，确保每个用户ID只出现一次，并过滤测试用户
    const uniqueUsers = new Map();
    allUsers.forEach((user) => {
      // 只包含真实Pi用户：
      // 1. 用户ID以pi_user_开头（移除游戏局数限制）
      // 2. 用户名不包含测试相关字样
      const isRealUser =
        user.id.startsWith("pi_user_") &&
        !user.username.includes("测试") &&
        !user.username.includes("test") &&
        !user.username.toLowerCase().includes("mock") &&
        !user.username.includes("玩家") &&
        user.username !== "测试玩家432";

      if (isRealUser) {
        // 如果用户已存在，保留数据更新的那个
        if (
          !uniqueUsers.has(user.id) ||
          user.lastLoginAt > uniqueUsers.get(user.id).lastLoginAt
        ) {
          uniqueUsers.set(user.id, user);
        }
      }
    });

    const users = Array.from(uniqueUsers.values())
      .sort((a, b) => {
        // 优化排序逻辑
        // 1. 首先按胜率排序（高到低）
        if (b.stats.winRate !== a.stats.winRate) {
          return b.stats.winRate - a.stats.winRate;
        }
        // 2. 胜率相同时，按胜场数排序（高到低）
        if (b.stats.wins !== a.stats.wins) {
          return b.stats.wins - a.stats.wins;
        }
        // 3. 胜场数相同时，按总局数排序（高到低）
        if (b.stats.totalGames !== a.stats.totalGames) {
          return b.stats.totalGames - a.stats.totalGames;
        }
        // 4. 最后按用户ID排序（确保稳定排序）
        return a.id.localeCompare(b.id);
      })
      .slice(0, limit)
      .map((user, index) => ({
        rank: index + 1,
        userId: user.id,
        username: user.username,
        totalGames: user.stats.totalGames,
        wins: user.stats.wins,
        winRate: user.stats.winRate,
      }));

    console.log(`[数据库] 排行榜结果:`, users);
    return users;
  }

  // 获取用户排名
  async getUserRank(userId) {
    // 如果是测试用户，不参与排名
    const user = this.users.get(userId);
    if (!user || !userId.startsWith("pi_user_")) {
      return 0;
    }

    // 使用Map去重，确保每个用户ID只出现一次，并过滤测试用户
    const uniqueUsers = new Map();
    Array.from(this.users.values()).forEach((user) => {
      // 只包含真实Pi用户（与排行榜逻辑保持一致）
      const isRealUser =
        user.id.startsWith("pi_user_") &&
        !user.username.includes("测试") &&
        !user.username.includes("test") &&
        !user.username.toLowerCase().includes("mock") &&
        !user.username.includes("玩家") &&
        user.username !== "测试玩家432";

      if (isRealUser) {
        // 如果用户已存在，保留数据更新的那个
        if (
          !uniqueUsers.has(user.id) ||
          user.lastLoginAt > uniqueUsers.get(user.id).lastLoginAt
        ) {
          uniqueUsers.set(user.id, user);
        }
      }
    });

    const allUsers = Array.from(uniqueUsers.values()).sort((a, b) => {
      // 优化排序逻辑（与排行榜保持一致）
      // 1. 首先按胜率排序（高到低）
      if (b.stats.winRate !== a.stats.winRate) {
        return b.stats.winRate - a.stats.winRate;
      }
      // 2. 胜率相同时，按胜场数排序（高到低）
      if (b.stats.wins !== a.stats.wins) {
        return b.stats.wins - a.stats.wins;
      }
      // 3. 胜场数相同时，按总局数排序（高到低）
      if (b.stats.totalGames !== a.stats.totalGames) {
        return b.stats.totalGames - a.stats.totalGames;
      }
      // 4. 最后按用户ID排序（确保稳定排序）
      return a.id.localeCompare(b.id);
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
      if (
        userId.startsWith("test_") ||
        user.username.startsWith("测试用户") ||
        user.username.includes("test")
      ) {
        testUserIds.push(userId);
      }
    }

    testUserIds.forEach((userId) => {
      this.users.delete(userId);
      console.log(`[数据库] 删除测试用户: ${userId}`);
    });

    return testUserIds.length;
  }

  // 清理重复数据
  async cleanupDuplicateData() {
    console.log(`[数据库] 开始清理重复数据...`);

    const usersByUsername = new Map();
    const duplicateIds = [];

    // 按用户名分组，找出重复的用户
    for (const [userId, user] of this.users.entries()) {
      const username = user.username;

      if (usersByUsername.has(username)) {
        const existingUser = usersByUsername.get(username);

        // 比较两个用户，保留数据更完整的那个
        if (
          user.stats.totalGames > existingUser.stats.totalGames ||
          (user.stats.totalGames === existingUser.stats.totalGames &&
            user.lastLoginAt > existingUser.lastLoginAt)
        ) {
          // 当前用户数据更好，删除之前的用户
          duplicateIds.push(existingUser.id);
          usersByUsername.set(username, user);
        } else {
          // 之前的用户数据更好，删除当前用户
          duplicateIds.push(userId);
        }
      } else {
        usersByUsername.set(username, user);
      }
    }

    // 删除重复的用户
    duplicateIds.forEach((userId) => {
      this.users.delete(userId);
      console.log(`[数据库] 删除重复用户: ${userId}`);
    });

    console.log(`[数据库] 清理完成，删除了 ${duplicateIds.length} 个重复用户`);
    return duplicateIds.length;
  }

  // 清理基于accessToken生成的重复用户ID
  async cleanupAccessTokenBasedDuplicates() {
    console.log(`[数据库] 开始清理基于accessToken的重复用户...`);

    const usersByUsername = new Map();
    const duplicateIds = [];
    let cleanedCount = 0;

    // 收集所有用户，按用户名分组
    for (const [userId, user] of this.users.entries()) {
      // 只处理Pi用户
      if (!userId.startsWith("pi_user_")) continue;

      const username = user.username;

      if (!usersByUsername.has(username)) {
        usersByUsername.set(username, []);
      }
      usersByUsername.get(username).push({ id: userId, user });
    }

    // 处理每个用户名组
    for (const [username, userList] of usersByUsername.entries()) {
      if (userList.length > 1) {
        console.log(
          `[数据库] 发现重复用户名: ${username}, 共${userList.length}个账户`
        );

        // 按数据完整度和最后登录时间排序
        userList.sort((a, b) => {
          // 优先保留有游戏数据的用户
          if (a.user.stats.totalGames !== b.user.stats.totalGames) {
            return b.user.stats.totalGames - a.user.stats.totalGames;
          }
          // 游戏数据相同时，保留最近登录的
          return new Date(b.user.lastLoginAt) - new Date(a.user.lastLoginAt);
        });

        // 保留第一个（最好的），删除其他的
        const keepUser = userList[0];
        const removeUsers = userList.slice(1);

        console.log(
          `[数据库] 保留用户: ${keepUser.id} (${keepUser.user.stats.totalGames}局游戏)`
        );

        removeUsers.forEach(({ id, user }) => {
          console.log(
            `[数据库] 删除重复用户: ${id} (${user.stats.totalGames}局游戏)`
          );
          this.users.delete(id);
          duplicateIds.push(id);
          cleanedCount++;
        });
      }
    }

    console.log(
      `[数据库] accessToken重复清理完成，删除了 ${cleanedCount} 个重复用户`
    );
    return cleanedCount;
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

  // 完全清空所有用户数据
  async clearAllUsers() {
    console.log(`[数据库] 开始清空所有用户数据...`);

    const userCount = this.users.size;
    const gameCount = this.games.size;

    // 清空用户数据
    this.users.clear();

    // 清空游戏记录
    this.games.clear();

    console.log(
      `[数据库] 已清空 ${userCount} 个用户和 ${gameCount} 条游戏记录`
    );

    return {
      clearedUsers: userCount,
      clearedGames: gameCount,
      timestamp: new Date().toISOString(),
    };
  }

  // 获取系统性能统计
  getSystemStats() {
    const memUsage = process.memoryUsage();
    const uptime = process.uptime();

    return {
      memory: {
        used: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
        total: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
        rss: Math.round(memUsage.rss / 1024 / 1024), // MB
        external: Math.round(memUsage.external / 1024 / 1024), // MB
      },
      uptime: {
        seconds: Math.round(uptime),
        hours: Math.round((uptime / 3600) * 100) / 100,
        formatted: this.formatUptime(uptime),
      },
      database: {
        users: this.users.size,
        games: this.games.size,
        activeConnections: this.activeConnections || 0,
      },
      timestamp: new Date().toISOString(),
    };
  }

  formatUptime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours}h ${minutes}m ${secs}s`;
  }
}

// 导出单例实例
const db = new MemoryDatabase();

// 优雅关闭处理
process.on("SIGINT", () => {
  console.log("\n[数据库] 收到关闭信号，正在保存数据...");
  db.saveData();
  console.log("[数据库] 数据保存完成，服务器关闭");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n[数据库] 收到终止信号，正在保存数据...");
  db.saveData();
  console.log("[数据库] 数据保存完成，服务器关闭");
  process.exit(0);
});

export default db;
