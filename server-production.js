import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());

// 导入API路由
import gamesRecord from "./api/games/record.js";
import usersStats from "./api/users/stats.js";
import leaderboard from "./api/leaderboard.js";

// API路由
app.use("/api/games/record", gamesRecord);
app.use("/api/users/stats", usersStats);
app.use("/api/leaderboard", leaderboard);

// 认证API（简化版本）
app.post("/api/auth/login", (req, res) => {
  const { accessToken } = req.body;
  
  // 简化的认证逻辑
  if (accessToken) {
    res.json({
      success: true,
      user: {
        uid: "authenticated_user",
        username: "Pi用户",
        balance: 0,
        stats: {
          totalGames: 0,
          wins: 0,
          losses: 0,
          draws: 0,
          winRate: 0,
          monthlyScore: 100,
          rank: 0
        }
      }
    });
  } else {
    res.status(401).json({
      success: false,
      message: "Invalid access token"
    });
  }
});

// 健康检查端点
app.get("/health", (req, res) => {
  res.json({ 
    status: "healthy", 
    timestamp: new Date().toISOString(),
    platform: "Render.com",
    uptime: process.uptime()
  });
});

// 根路径
app.get("/", (req, res) => {
  res.json({
    message: "Pi五子棋游戏后端API服务",
    version: "1.0.0",
    endpoints: [
      "/api/games/record",
      "/api/users/stats", 
      "/api/leaderboard",
      "/api/auth/login"
    ],
  });
});

// API根路径
app.get("/api", (req, res) => {
  res.json({
    message: "Pi五子棋游戏API",
    version: "1.0.0",
    availableEndpoints: [
      "/api/games/record",
      "/api/users/stats",
      "/api/leaderboard", 
      "/api/auth/login"
    ]
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({
    error: "Endpoint not found",
    path: req.path,
    availableEndpoints: [
      "/api",
      "/health",
      "/api/games/record",
      "/api/users/stats",
      "/api/leaderboard",
      "/api/auth/login"
    ]
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 Pi五子棋后端服务器运行在端口 ${PORT}`);
  console.log(`📍 服务器地址: http://localhost:${PORT}`);
  console.log(`🏥 健康检查: http://localhost:${PORT}/health`);
  console.log(`📋 可用API端点:`);
  console.log(`   - POST /api/auth/login`);
  console.log(`   - POST /api/games/record`);
  console.log(`   - GET  /api/users/stats`);
  console.log(`   - GET  /api/leaderboard`);
});

export default app;
