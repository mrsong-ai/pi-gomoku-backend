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

    // 模拟支付成功（实际环境中需要Pi Network支付流程）
    setTimeout(async () => {
      try {
        // 模拟支付完成，增加用户余额
        await db.updateBalance(userId, parseFloat(amount));
        console.log(`模拟支付完成: 用户 ${userId} 充值 ${amount} π`);
      } catch (error) {
        console.error('模拟支付处理失败:', error);
      }
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
};
