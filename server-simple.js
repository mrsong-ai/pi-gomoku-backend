import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());

// 导入API路由
import gamesRecord from "./api/games/record.js";
import usersStats from "./api/users/stats.js";

// API路由
app.use("/api/games/record", gamesRecord);
app.use("/api/users/stats", usersStats);

// 健康检查端点
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// 根路径
app.get("/", (req, res) => {
  res.json({
    message: "Pi五子棋游戏后端API服务",
    version: "1.0.0",
    endpoints: ["/api/games/record", "/api/users/stats"],
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 Pi五子棋后端服务器运行在端口 ${PORT}`);
  console.log(`📍 服务器地址: http://localhost:${PORT}`);
  console.log(`🏥 健康检查: http://localhost:${PORT}/health`);
});

export default app;
