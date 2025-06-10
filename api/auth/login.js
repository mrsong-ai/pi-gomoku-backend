// 模拟数据库
let users = new Map();

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
    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({
        success: false,
        message: 'Access token is required'
      });
    }

    // 模拟用户验证
    const mockUser = {
      piUserId: 'test_user_' + Date.now(),
      username: '测试玩家' + Math.floor(Math.random() * 1000),
      stats: {
        totalGames: Math.floor(Math.random() * 50),
        wins: Math.floor(Math.random() * 30),
        losses: Math.floor(Math.random() * 20),
        winRate: 0,
        score: Math.floor(Math.random() * 1000) + 100,
        rank: Math.floor(Math.random() * 100) + 1
      }
    };

    mockUser.stats.winRate = mockUser.stats.totalGames > 0 
      ? Math.round((mockUser.stats.wins / mockUser.stats.totalGames) * 100) 
      : 0;

    // 保存用户数据
    users.set(mockUser.piUserId, mockUser);

    res.json({
      success: true,
      user: mockUser,
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}
