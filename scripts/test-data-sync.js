#!/usr/bin/env node

// 测试数据同步功能
import db from '../lib/database.js';

console.log('🧪 开始测试数据同步功能...\n');

// 添加数据变更监听器
db.addDataChangeListener((changeType, data) => {
  console.log(`📢 [数据变更通知] 类型: ${changeType}`);
  console.log(`📢 [数据变更通知] 数据:`, data);
  console.log('---');
});

async function testDataSync() {
  try {
    console.log('1️⃣ 测试创建新用户...');
    const newUser = await db.createUser('pi_user_test_123', {
      username: '测试用户123'
    });
    console.log('✅ 新用户创建成功:', newUser.username);
    
    await new Promise(resolve => setTimeout(resolve, 200));
    
    console.log('\n2️⃣ 测试更新用户数据...');
    await db.updateUser('pi_user_test_123', {
      lastLoginAt: new Date().toISOString(),
      stats: {
        totalGames: 5,
        wins: 3,
        losses: 2,
        draws: 0,
        winRate: 60
      }
    });
    console.log('✅ 用户数据更新成功');
    
    await new Promise(resolve => setTimeout(resolve, 200));
    
    console.log('\n3️⃣ 测试获取排行榜...');
    const leaderboard = await db.getLeaderboard(10);
    console.log(`✅ 排行榜获取成功，共 ${leaderboard.length} 条记录`);
    
    console.log('\n4️⃣ 测试获取所有用户...');
    const allUsers = await db.getAllUsers();
    const realUsers = allUsers.filter(user => 
      user.id.startsWith('pi_user_') &&
      !user.username.includes('测试') &&
      !user.username.includes('test') &&
      !user.username.toLowerCase().includes('mock') &&
      !user.username.includes('玩家') &&
      user.username !== '测试玩家432'
    );
    console.log(`✅ 用户统计: 总用户 ${allUsers.length}, 真实用户 ${realUsers.length}`);
    
    console.log('\n5️⃣ 清理测试数据...');
    const deletedCount = await db.cleanupTestData();
    console.log(`✅ 清理完成，删除了 ${deletedCount} 个测试用户`);
    
    console.log('\n🎉 所有测试完成！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

// 运行测试
testDataSync();
