import express from "express";
import cors from "cors";
import path from "path";

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());

// 导入API路由
import authLogin from "./api/auth/login.js";
import gamesRecord from "./api/games/record.js";
import leaderboard from "./api/leaderboard.js";
import usersStats from "./api/users/stats.js";

// 支付相关API
import paymentApprove from "./api/payment/approve.js";
import paymentBalance from "./api/payment/balance.js";
import paymentComplete from "./api/payment/complete.js";
import paymentConsume from "./api/payment/consume.js";
import paymentCreate from "./api/payment/create.js";
import paymentVerify from "./api/payment/verify.js";

// API路由
app.use("/api/auth/login", authLogin);
app.use("/api/games/record", gamesRecord);
app.use("/api/leaderboard", leaderboard);
app.use("/api/users/stats", usersStats);

// 支付API路由
app.use("/api/payment/approve", paymentApprove);
app.use("/api/payment/balance", paymentBalance);
app.use("/api/payment/complete", paymentComplete);
app.use("/api/payment/consume", paymentConsume);
app.use("/api/payment/create", paymentCreate);
app.use("/api/payment/verify", paymentVerify);

// 管理API路由
import adminReset from "./api/admin/reset.js";
app.use("/api/admin/reset", adminReset);

// 健康检查端点
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    platform: "Render.com",
    uptime: process.uptime(),
  });
});

// API根路径
app.get("/api", (req, res) => {
  res.json({
    message: "Pi五子棋游戏API",
    version: "1.0.0",
    availableEndpoints: [
      "/api/auth/login",
      "/api/games/record",
      "/api/users/stats",
      "/api/leaderboard",
      "/api/payment/approve",
      "/api/payment/balance",
      "/api/payment/complete",
      "/api/payment/consume",
      "/api/payment/create",
      "/api/payment/verify",
    ],
  });
});

// 根路径
app.get("/", (req, res) => {
  res.json({
    message: "Pi五子棋游戏后端API服务",
    version: "1.0.0",
    endpoints: [
      "/api/auth/login",
      "/api/games/record",
      "/api/leaderboard",
      "/api/users/stats",
      "/api/payment/*",
    ],
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 Pi五子棋后端服务器运行在端口 ${PORT}`);
  console.log(`📍 服务器地址: http://localhost:${PORT}`);
  console.log(`🏥 健康检查: http://localhost:${PORT}/health`);
});

export default app;
