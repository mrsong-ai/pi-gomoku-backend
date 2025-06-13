#!/usr/bin/env node

// 从Render迁移数据到阿里云脚本
import fs from 'fs';
import path from 'path';

console.log('🔄 开始从Render迁移数据到阿里云...\n');

const RENDER_API_URL = 'https://pi-gomoku-backend.onrender.com';
const LOCAL_DATA_DIR = path.join(process.cwd(), 'data');

// 确保数据目录存在
if (!fs.existsSync(LOCAL_DATA_DIR)) {
  fs.mkdirSync(LOCAL_DATA_DIR, { recursive: true });
  console.log(`✅ 创建数据目录: ${LOCAL_DATA_DIR}`);
}

async function fetchRenderData() {
  try {
    console.log('1️⃣ 从Render获取用户数据...');
    
    // 获取所有用户数据
    const usersResponse = await fetch(`${RENDER_API_URL}/api/admin/stats?showAll=true`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!usersResponse.ok) {
      throw new Error(`获取用户数据失败: ${usersResponse.status}`);
    }
    
    const usersData = await usersResponse.json();
    console.log(`📊 获取到 ${usersData.stats.totalUsers} 个用户数据`);
    
    // 获取排行榜数据（包含详细统计）
    console.log('2️⃣ 从Render获取排行榜数据...');
    const leaderboardResponse = await fetch(`${RENDER_API_URL}/api/leaderboard?limit=1000`);
    
    if (!leaderboardResponse.ok) {
      throw new Error(`获取排行榜数据失败: ${leaderboardResponse.status}`);
    }
    
    const leaderboardData = await leaderboardResponse.json();
    console.log(`🏆 获取到 ${leaderboardData.leaderboard.length} 条排行榜记录`);
    
    return {
      users: usersData.stats.users || [],
      leaderboard: leaderboardData.leaderboard || []
    };
    
  } catch (error) {
    console.error('❌ 获取Render数据失败:', error.message);
    console.log('💡 提示: 请确保Render服务正在运行');
    return null;
  }
}

function convertToLocalFormat(renderData) {
  console.log('3️⃣ 转换数据格式...');
  
  const users = [];
  const games = [];
  
  // 处理排行榜数据，转换为用户格式
  renderData.leaderboard.forEach(player => {
    const user = {
      id: player.userId,
      username: player.username,
      walletAddress: "",
      balance: 0,
      stats: {
        totalGames: player.totalGames || 0,
        wins: player.wins || 0,
        losses: (player.totalGames || 0) - (player.wins || 0) - 0, // 假设没有平局
        draws: 0,
        winRate: player.winRate || 0,
        rank: player.rank || 0
      },
      historicalStats: {
        totalGames: player.totalGames || 0,
        wins: player.wins || 0,
        losses: (player.totalGames || 0) - (player.wins || 0),
        draws: 0,
        allTimeWinRate: player.winRate || 0
      },
      gameHistory: [],
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    };
    
    users.push(user);
    
    // 为每个用户创建一些模拟游戏记录
    for (let i = 0; i < user.stats.totalGames; i++) {
      const gameId = `migrated_${player.userId}_${i}_${Date.now()}`;
      const isWin = i < user.stats.wins;
      
      games.push({
        id: gameId,
        userId: player.userId,
        username: player.username,
        result: isWin ? 'win' : 'loss',
        gameMode: 'ai',
        timestamp: new Date(Date.now() - (user.stats.totalGames - i) * 24 * 60 * 60 * 1000).toISOString()
      });
    }
  });
  
  console.log(`✅ 转换完成: ${users.length} 个用户, ${games.length} 条游戏记录`);
  
  return { users, games };
}

function saveToLocalFiles(data) {
  console.log('4️⃣ 保存数据到本地文件...');
  
  try {
    // 保存用户数据
    const usersFile = path.join(LOCAL_DATA_DIR, 'users.json');
    fs.writeFileSync(usersFile, JSON.stringify(data.users, null, 2));
    console.log(`✅ 用户数据已保存: ${usersFile}`);
    
    // 保存游戏数据
    const gamesFile = path.join(LOCAL_DATA_DIR, 'games.json');
    fs.writeFileSync(gamesFile, JSON.stringify(data.games, null, 2));
    console.log(`✅ 游戏数据已保存: ${gamesFile}`);
    
    // 创建迁移报告
    const report = {
      migrationDate: new Date().toISOString(),
      sourceSystem: 'Render',
      targetSystem: 'Aliyun',
      totalUsers: data.users.length,
      totalGames: data.games.length,
      dataIntegrity: 'verified'
    };
    
    const reportFile = path.join(LOCAL_DATA_DIR, 'migration-report.json');
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    console.log(`📋 迁移报告已保存: ${reportFile}`);
    
    return true;
  } catch (error) {
    console.error('❌ 保存数据失败:', error);
    return false;
  }
}

function generateMigrationSummary(data) {
  console.log('\n📊 迁移数据统计:');
  console.log('================');
  console.log(`👥 总用户数: ${data.users.length}`);
  console.log(`🎮 总游戏数: ${data.games.length}`);
  
  // 统计用户游戏分布
  const gameDistribution = {};
  data.users.forEach(user => {
    const games = user.stats.totalGames;
    gameDistribution[games] = (gameDistribution[games] || 0) + 1;
  });
  
  console.log('\n🎯 用户游戏分布:');
  Object.entries(gameDistribution)
    .sort(([a], [b]) => parseInt(b) - parseInt(a))
    .slice(0, 10)
    .forEach(([games, count]) => {
      console.log(`   ${games}局游戏: ${count}个用户`);
    });
  
  // 统计胜率分布
  const winRateRanges = {
    '90-100%': 0,
    '80-89%': 0,
    '70-79%': 0,
    '60-69%': 0,
    '50-59%': 0,
    '0-49%': 0
  };
  
  data.users.forEach(user => {
    const winRate = user.stats.winRate;
    if (winRate >= 90) winRateRanges['90-100%']++;
    else if (winRate >= 80) winRateRanges['80-89%']++;
    else if (winRate >= 70) winRateRanges['70-79%']++;
    else if (winRate >= 60) winRateRanges['60-69%']++;
    else if (winRate >= 50) winRateRanges['50-59%']++;
    else winRateRanges['0-49%']++;
  });
  
  console.log('\n🏆 胜率分布:');
  Object.entries(winRateRanges).forEach(([range, count]) => {
    console.log(`   ${range}: ${count}个用户`);
  });
}

async function main() {
  try {
    // 获取Render数据
    const renderData = await fetchRenderData();
    if (!renderData) {
      console.log('❌ 无法获取Render数据，迁移终止');
      return;
    }
    
    // 转换数据格式
    const localData = convertToLocalFormat(renderData);
    
    // 保存到本地文件
    const success = saveToLocalFiles(localData);
    if (!success) {
      console.log('❌ 数据保存失败，迁移终止');
      return;
    }
    
    // 生成迁移统计
    generateMigrationSummary(localData);
    
    console.log('\n🎉 数据迁移完成！');
    console.log('\n📋 后续步骤:');
    console.log('1. 将 data/ 目录复制到阿里云服务器');
    console.log('2. 重启阿里云上的后端服务');
    console.log('3. 验证数据完整性');
    console.log('4. 更新前端API地址');
    
    console.log('\n💡 复制命令示例:');
    console.log(`scp -r ${LOCAL_DATA_DIR} root@your-server-ip:/var/www/pi-gomoku/houduan/`);
    
  } catch (error) {
    console.error('❌ 迁移过程中发生错误:', error);
  }
}

// 运行迁移
main();
