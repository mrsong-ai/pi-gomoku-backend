# Pi 五子棋游戏后端 API

## ��� 快速部署

### 1. 部署到 Render

```bash
# 1. 推送到GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main

# 2. 在Render中导入项目
# 访问 https://render.com
# 点击 "New +" -> "Web Service"
# 选择GitHub仓库
# 配置构建设置并点击Deploy
```

### 2. 配置部署设置

在 Render 中配置以下设置：

- **Environment**: Node
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Root Directory**: `houduan` (如果在子目录中)

### 3. 获取 API 地址

部署成功后，您将获得类似这样的地址：

```
https://your-project-name.onrender.com
```

### 4. 更新前端配置

在前端项目中，将 API_BASE_URL 更新为您的后端地址：

```javascript
const API_BASE_URL = "https://your-project-name.onrender.com";
```

## ��� API 端点

### 用户认证

- `POST /api/auth/login` - Pi Network 用户登录

### 用户统计

- `GET /api/users/[uid]/stats` - 获取用户统计数据

### 游戏记录

- `POST /api/games/record` - 记录游戏结果

### 排行榜

- `GET /api/leaderboard` - 获取排行榜

### 支付功能

- `GET /api/payment/balance` - 查询用户余额
- `POST /api/payment/create` - 创建充值订单

## ��� 环境变量

创建 `.env` 文件：

```
PI_API_KEY=your_pi_api_key
PI_APP_ID=your_pi_app_id
```

## ��� 数据存储

当前使用内存存储，重启后数据会丢失。
生产环境建议使用：

- MongoDB Atlas
- PostgreSQL
- Redis

## ��� 功能状态

- ✅ 用户认证和统计
- ✅ 游戏记录存储
- ✅ 实时排行榜
- ✅ 模拟支付功能
- ⏳ 真实 Pi 支付（需要收币地址）
- ⏳ 月度奖励分发（需要收币地址）
