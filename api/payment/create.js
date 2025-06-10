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
    const { userId, amount, purpose } = req.body;

    if (!userId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'User ID and amount are required'
      });
    }

    // 创建模拟订单
    const orderId = 'order_' + Date.now();
    const order = {
      id: orderId,
      userId,
      amount: parseFloat(amount),
      purpose: purpose || 'recharge',
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    // 模拟支付成功，增加用户余额
    setTimeout(() => {
      let user = users.get(userId);
      if (!user) {
        user = {
          piUserId: userId,
          username: `用户${userId}`,
          balance: 0,
          stats: { totalGames: 0, wins: 0, losses: 0, winRate: 0, score: 100 }
        };
        users.set(userId, user);
      }
      user.balance += parseFloat(amount);
      console.log(`模拟支付完成: 用户 ${userId} 充值 ${amount} π`);
    }, 2000);

    res.json({
      success: true,
      order,
      message: 'Order created successfully (mock payment)'
    });

  } catch (error) {
    console.error('Create payment order error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}
