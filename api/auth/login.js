const db = require('../../lib/database');
const PiNetworkAPI = require('../../lib/pi-network');

const piAPI = new PiNetworkAPI();

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
    const { accessToken } = req.body;
    
    if (!accessToken) {
      return res.status(400).json({ 
        success: false, 
        message: 'Access token is required' 
      });
    }

    // 验证Pi Network用户
    const piResult = await piAPI.verifyUser(accessToken);
    
    if (!piResult.success) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Pi Network token'
      });
    }

    const { uid, username } = piResult.user;

    // 查找或创建用户
    let user = await db.getUser(uid);
    if (!user) {
      user = await db.createUser(uid, { username });
    } else {
      // 更新最后登录时间
      user.lastLoginAt = new Date().toISOString();
      await db.updateUser(uid, { lastLoginAt: user.lastLoginAt });
    }

    res.json({
      success: true,
      user: {
        piUserId: user.id,
        username: user.username,
        stats: user.stats
      },
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
