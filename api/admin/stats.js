// 管理员统计接口 - 查看用户活动和游戏数据
import db from "../../lib/database.js";

export default async function handler(req, res) {
  // 设置CORS头
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  try {
    // 获取所有用户数据
    const allUsers = await db.getAllUsers();
    
    // 过滤掉测试用户
    const realUsers = allUsers.filter(user => 
      !user.id.startsWith("test_") && 
      !user.username.includes("测试")
    );

    // 统计数据
    const stats = {
      // 基础统计
      totalUsers: realUsers.length,
      activeUsers: realUsers.filter(user => user.stats.totalGames > 0).length,
      newUsersToday: realUsers.filter(user => {
        const today = new Date().toDateString();
        const userDate = new Date(user.createdAt).toDateString();
        return today === userDate;
      }).length,
      
      // 最近活跃用户（最近24小时有登录记录）
      recentActiveUsers: realUsers.filter(user => {
        const now = new Date();
        const lastLogin = new Date(user.lastLoginAt);
        const hoursDiff = (now - lastLogin) / (1000 * 60 * 60);
        return hoursDiff <= 24;
      }).length,

      // 游戏统计
      totalGames: realUsers.reduce((sum, user) => sum + user.stats.totalGames, 0),
      totalHistoricalGames: realUsers.reduce((sum, user) => 
        sum + (user.historicalStats?.totalGames || 0), 0),
      
      // 用户分布
      usersByGameCount: {
        noGames: realUsers.filter(user => user.stats.totalGames === 0).length,
        oneToFive: realUsers.filter(user => 
          user.stats.totalGames >= 1 && user.stats.totalGames <= 5).length,
        sixToTen: realUsers.filter(user => 
          user.stats.totalGames >= 6 && user.stats.totalGames <= 10).length,
        moreThanTen: realUsers.filter(user => user.stats.totalGames > 10).length,
      },

      // 最近登录的用户列表（最近10个）
      recentUsers: realUsers
        .sort((a, b) => new Date(b.lastLoginAt) - new Date(a.lastLoginAt))
        .slice(0, 10)
        .map(user => ({
          id: user.id.slice(-8), // 只显示ID后8位保护隐私
          username: user.username,
          totalGames: user.stats.totalGames,
          wins: user.stats.wins,
          winRate: user.stats.winRate,
          lastLoginAt: user.lastLoginAt,
          createdAt: user.createdAt,
        })),

      // 活跃用户排行（按游戏局数）
      topActiveUsers: realUsers
        .filter(user => user.stats.totalGames > 0)
        .sort((a, b) => b.stats.totalGames - a.stats.totalGames)
        .slice(0, 10)
        .map(user => ({
          id: user.id.slice(-8),
          username: user.username,
          totalGames: user.stats.totalGames,
          wins: user.stats.wins,
          winRate: user.stats.winRate,
          lastLoginAt: user.lastLoginAt,
        })),

      // 时间分布统计
      usersByHour: getHourlyDistribution(realUsers),
      
      // 系统信息
      serverTime: new Date().toISOString(),
      dataLastUpdated: new Date().toISOString(),
    };

    res.json({
      success: true,
      stats: stats,
      message: "Statistics retrieved successfully",
    });

  } catch (error) {
    console.error("Admin stats error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

// 获取用户按小时分布的统计
function getHourlyDistribution(users) {
  const hourlyStats = Array(24).fill(0);
  
  users.forEach(user => {
    if (user.lastLoginAt) {
      const hour = new Date(user.lastLoginAt).getHours();
      hourlyStats[hour]++;
    }
  });

  return hourlyStats.map((count, hour) => ({
    hour: hour,
    userCount: count,
    timeRange: `${hour.toString().padStart(2, '0')}:00-${(hour + 1).toString().padStart(2, '0')}:00`
  }));
}
