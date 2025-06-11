const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());

// 导入API路由
const authLogin = require('./api/auth/login');
const gamesRecord = require('./api/games/record');
const leaderboard = require('./api/leaderboard');
const usersStats = require('./api/users/stats');

// 支付相关API
const paymentApprove = require('./api/payment/approve');
const paymentBalance = require('./api/payment/balance');
const paymentComplete = require('./api/payment/complete');
const paymentConsume = require('./api/payment/consume');
const paymentCreate = require('./api/payment/create');
const paymentVerify = require('./api/payment/verify');

// API路由
app.use('/api/auth/login', authLogin);
app.use('/api/games/record', gamesRecord);
app.use('/api/leaderboard', leaderboard);
app.use('/api/users/stats', usersStats);

// 支付API路由
app.use('/api/payment/approve', paymentApprove);
app.use('/api/payment/balance', paymentBalance);
app.use('/api/payment/complete', paymentComplete);
app.use('/api/payment/consume', paymentConsume);
app.use('/api/payment/create', paymentCreate);
app.use('/api/payment/verify', paymentVerify);

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 根路径
app.get('/', (req, res) => {
  res.json({ 
    message: 'Pi五子棋游戏后端API服务',
    version: '1.0.0',
    endpoints: [
      '/api/auth/login',
      '/api/games/record',
      '/api/leaderboard',
      '/api/users/stats',
      '/api/payment/*'
    ]
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 Pi五子棋后端服务器运行在端口 ${PORT}`);
  console.log(`📍 服务器地址: http://localhost:${PORT}`);
  console.log(`🏥 健康检查: http://localhost:${PORT}/health`);
});

module.exports = app;
