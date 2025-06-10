export default async function handler(req, res) {
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
    const { paymentId, txid, paymentData } = req.body;

    if (!paymentId || !txid) {
      return res.status(400).json({
        success: false,
        message: 'Payment ID and transaction ID are required'
      });
    }

    console.log('Processing payment completion:', paymentId, txid);

    res.json({
      success: true,
      paymentId,
      txid,
      status: 'completed',
      message: 'Payment completed successfully'
    });

  } catch (error) {
    console.error('Payment completion error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}
