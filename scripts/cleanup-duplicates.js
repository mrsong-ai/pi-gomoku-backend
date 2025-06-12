#!/usr/bin/env node

// 清理重复用户数据的脚本
import db from '../lib/database.js';

async function cleanupDuplicates() {
  console.log('🧹 开始清理重复用户数据...\n');
  
  try {
    // 显示清理前的统计
    const allUsers = await db.getAllUsers();
    const piUsers = allUsers.filter(user => user.id.startsWith('pi_user_'));
    
    console.log('📊 清理前统计:');
    console.log(`总用户数: ${allUsers.length}`);
    console.log(`Pi用户数: ${piUsers.length}`);
    
    // 按用户名分组显示重复情况
    const usersByName = new Map();
    piUsers.forEach(user => {
      if (!usersByName.has(user.username)) {
        usersByName.set(user.username, []);
      }
      usersByName.get(user.username).push(user);
    });
    
    const duplicateNames = Array.from(usersByName.entries())
      .filter(([name, users]) => users.length > 1);
    
    console.log(`\n🔍 发现重复用户名: ${duplicateNames.length}个`);
    duplicateNames.forEach(([name, users]) => {
      console.log(`  - ${name}: ${users.length}个账户`);
      users.forEach(user => {
        console.log(`    * ${user.id} (${user.stats.totalGames}局游戏, 最后登录: ${user.lastLoginAt})`);
      });
    });
    
    console.log('\n🚀 开始清理...');
    
    // 执行清理
    const duplicateCount = await db.cleanupDuplicateData();
    const accessTokenDuplicateCount = await db.cleanupAccessTokenBasedDuplicates();
    const testUserCount = await db.cleanupTestData();
    
    // 显示清理后的统计
    const allUsersAfter = await db.getAllUsers();
    const piUsersAfter = allUsersAfter.filter(user => user.id.startsWith('pi_user_'));
    
    console.log('\n✅ 清理完成!');
    console.log(`📊 清理后统计:`);
    console.log(`总用户数: ${allUsersAfter.length} (减少 ${allUsers.length - allUsersAfter.length})`);
    console.log(`Pi用户数: ${piUsersAfter.length} (减少 ${piUsers.length - piUsersAfter.length})`);
    console.log(`\n🗑️ 清理详情:`);
    console.log(`- 按用户名清理的重复用户: ${duplicateCount}`);
    console.log(`- 按accessToken清理的重复用户: ${accessTokenDuplicateCount}`);
    console.log(`- 清理的测试用户: ${testUserCount}`);
    console.log(`- 总计清理: ${duplicateCount + accessTokenDuplicateCount + testUserCount}`);
    
    // 显示剩余用户
    console.log('\n👥 剩余Pi用户:');
    piUsersAfter.forEach(user => {
      console.log(`  - ${user.username} (${user.id}): ${user.stats.totalGames}局游戏, 胜率${user.stats.winRate}%`);
    });
    
  } catch (error) {
    console.error('❌ 清理失败:', error);
    process.exit(1);
  }
}

// 运行清理
cleanupDuplicates().then(() => {
  console.log('\n🎉 清理脚本执行完成!');
  process.exit(0);
});
