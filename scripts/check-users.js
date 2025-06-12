#!/usr/bin/env node

// 快速查看用户统计的命令行脚本
import db from "../lib/database.js";

async function checkUserStats() {
  console.log("🎮 五子棋游戏用户统计");
  console.log("=" * 50);
  
  try {
    // 获取所有用户
    const allUsers = await db.getAllUsers();
    
    // 过滤真实用户
    const realUsers = allUsers.filter(user => 
      !user.id.startsWith("test_") && 
      !user.username.includes("测试")
    );

    // 基础统计
    console.log("\n📊 基础统计:");
    console.log(`总用户数: ${realUsers.length}`);
    console.log(`活跃用户: ${realUsers.filter(u => u.stats.totalGames > 0).length}`);
    console.log(`总游戏局数: ${realUsers.reduce((sum, u) => sum + u.stats.totalGames, 0)}`);

    // 最近24小时活跃用户
    const recentActive = realUsers.filter(user => {
      const now = new Date();
      const lastLogin = new Date(user.lastLoginAt);
      const hoursDiff = (now - lastLogin) / (1000 * 60 * 60);
      return hoursDiff <= 24;
    });
    console.log(`24小时内活跃: ${recentActive.length}`);

    // 今日新用户
    const today = new Date().toDateString();
    const newToday = realUsers.filter(user => {
      const userDate = new Date(user.createdAt).toDateString();
      return today === userDate;
    });
    console.log(`今日新用户: ${newToday.length}`);

    // 用户分布
    console.log("\n🎯 用户游戏分布:");
    const noGames = realUsers.filter(u => u.stats.totalGames === 0).length;
    const oneToFive = realUsers.filter(u => u.stats.totalGames >= 1 && u.stats.totalGames <= 5).length;
    const sixToTen = realUsers.filter(u => u.stats.totalGames >= 6 && u.stats.totalGames <= 10).length;
    const moreThanTen = realUsers.filter(u => u.stats.totalGames > 10).length;
    
    console.log(`未游戏: ${noGames}`);
    console.log(`1-5局: ${oneToFive}`);
    console.log(`6-10局: ${sixToTen}`);
    console.log(`10局以上: ${moreThanTen}`);

    // 最近登录的用户
    console.log("\n👥 最近登录用户 (最新5个):");
    const recentUsers = realUsers
      .sort((a, b) => new Date(b.lastLoginAt) - new Date(a.lastLoginAt))
      .slice(0, 5);
    
    recentUsers.forEach((user, index) => {
      const timeDiff = getTimeDiff(user.lastLoginAt);
      console.log(`${index + 1}. ${user.username} - ${user.stats.totalGames}局 - ${timeDiff}`);
    });

    // 活跃用户排行
    console.log("\n🏆 活跃用户排行 (前5名):");
    const topUsers = realUsers
      .filter(u => u.stats.totalGames > 0)
      .sort((a, b) => b.stats.totalGames - a.stats.totalGames)
      .slice(0, 5);
    
    topUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.username} - ${user.stats.totalGames}局 (胜率${user.stats.winRate}%)`);
    });

    console.log(`\n⏰ 统计时间: ${new Date().toLocaleString('zh-CN')}`);
    
  } catch (error) {
    console.error("❌ 获取统计数据失败:", error);
  }
}

// 计算时间差
function getTimeDiff(timeString) {
  const now = new Date();
  const time = new Date(timeString);
  const diffMs = now - time;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 7) return `${diffDays}天前`;
  
  return time.toLocaleDateString('zh-CN');
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  checkUserStats();
}

export default checkUserStats;
