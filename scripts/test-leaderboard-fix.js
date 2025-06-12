#!/usr/bin/env node

// 测试排行榜修复功能
import db from '../lib/database.js';

console.log('🧪 测试排行榜修复功能...\n');

async function testLeaderboardFix() {
  try {
    console.log('1️⃣ 创建测试用户（模拟真实Pi用户）...');
    
    // 创建用户A（有游戏记录）
    const userA = await db.createUser('pi_user_A_123', {
      username: 'PlayerA'
    });
    await db.updateUser('pi_user_A_123', {
      stats: {
        totalGames: 10,
        wins: 8,
        losses: 2,
        draws: 0,
        winRate: 80
      }
    });
    console.log('✅ 用户A创建成功 (10局游戏, 80%胜率)');
    
    // 创建用户B（刚登录，无游戏记录）
    const userB = await db.createUser('pi_user_B_456', {
      username: 'PlayerB'
    });
    console.log('✅ 用户B创建成功 (0局游戏)');
    
    // 创建用户C（有游戏记录）
    const userC = await db.createUser('pi_user_C_789', {
      username: 'PlayerC'
    });
    await db.updateUser('pi_user_C_789', {
      stats: {
        totalGames: 5,
        wins: 3,
        losses: 2,
        draws: 0,
        winRate: 60
      }
    });
    console.log('✅ 用户C创建成功 (5局游戏, 60%胜率)');
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('\n2️⃣ 测试排行榜显示...');
    const leaderboard = await db.getLeaderboard(10);
    console.log(`📊 排行榜结果 (${leaderboard.length} 条记录):`);
    
    if (leaderboard.length === 0) {
      console.log('❌ 排行榜为空！这是问题所在。');
    } else {
      leaderboard.forEach((player, index) => {
        console.log(`${index + 1}. ${player.username} - ${player.totalGames}局 (胜率${player.winRate}%)`);
      });
    }
    
    console.log('\n3️⃣ 测试所有用户统计...');
    const allUsers = await db.getAllUsers();
    const realUsers = allUsers.filter(user => 
      user.id.startsWith('pi_user_') &&
      !user.username.includes('测试') &&
      !user.username.includes('test') &&
      !user.username.toLowerCase().includes('mock') &&
      !user.username.includes('玩家') &&
      user.username !== '测试玩家432'
    );
    
    console.log(`📈 用户统计:`);
    console.log(`   总用户数: ${allUsers.length}`);
    console.log(`   真实用户数: ${realUsers.length}`);
    console.log(`   排行榜显示: ${leaderboard.length}`);
    
    realUsers.forEach(user => {
      console.log(`   - ${user.username}: ${user.stats.totalGames}局游戏`);
    });
    
    console.log('\n4️⃣ 期望结果分析...');
    console.log('✅ 期望: 排行榜应该显示所有3个用户');
    console.log('✅ 期望: 用户A排第1 (80%胜率)');
    console.log('✅ 期望: 用户C排第2 (60%胜率)');
    console.log('✅ 期望: 用户B排第3 (0%胜率，新用户)');
    
    if (leaderboard.length === 3) {
      console.log('🎉 排行榜修复成功！所有用户都显示了。');
    } else {
      console.log('❌ 排行榜仍有问题，需要进一步修复。');
    }
    
    console.log('\n5️⃣ 清理测试数据...');
    await db.cleanupTestData();
    // 手动删除测试用户
    ['pi_user_A_123', 'pi_user_B_456', 'pi_user_C_789'].forEach(id => {
      if (db.users.has(id)) {
        db.users.delete(id);
        console.log(`🗑️ 删除测试用户: ${id}`);
      }
    });
    
    console.log('\n🎉 测试完成！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

// 运行测试
testLeaderboardFix();
