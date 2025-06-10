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
    const { paymentId, paymentData } = req.body;

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment ID is required'
      });
    }

    // 模拟Pi Network支付审批
    console.log('Processing payment approval:', paymentId);

    res.json({
      success: true,
      paymentId,
      status: 'approved',
      message: 'Payment approved successfully'
    });

  } catch (error) {
    console.error('Payment approval error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
