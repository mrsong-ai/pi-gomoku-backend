const db = require('../../lib/database');

module.exports = async (req, res) => {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { userId, username, gameResult, gameData } = req.body;
    
    if (!userId || !gameResult) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID and game result are required' 
      });
    }

    // 记录游戏
    const gameId = await db.recordGame({
      userId,
      username,
      result: gameResult,
      ...gameData
    });

    // 获取更新后的用户统计
    const user = await db.getUser(userId);

    res.json({
      success: true,
      gameId,
      userStats: user.stats,
      message: 'Game recorded successfully'
    });

  } catch (error) {
    console.error('Record game error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
