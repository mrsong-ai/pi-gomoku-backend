// 模拟数据库
let users = new Map();
let games = [];

export default async function handler(req, res) {
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
    const gameId = 'game_' + Date.now();
    const game = {
      id: gameId,
      userId,
      username,
      result: gameResult,
      timestamp: new Date().toISOString(),
      ...gameData
    };

    games.push(game);

    // 更新用户统计
    let user = users.get(userId);
    if (!user) {
      user = {
        piUserId: userId,
        username: username || `用户${userId}`,
        stats: { totalGames: 0, wins: 0, losses: 0, winRate: 0, score: 100 }
      };
      users.set(userId, user);
    }

    user.stats.totalGames++;
    if (gameResult === 'win') {
      user.stats.wins++;
      user.stats.score += 10;
    } else if (gameResult === 'loss') {
      user.stats.losses++;
      user.stats.score = Math.max(0, user.stats.score - 5);
    }

    user.stats.winRate = user.stats.totalGames > 0 
      ? Math.round((user.stats.wins / user.stats.totalGames) * 100) 
      : 0;

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
}
