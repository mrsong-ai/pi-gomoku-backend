// PM2 生产环境配置文件
module.exports = {
  apps: [{
    name: 'pi-gomoku-backend',
    script: 'server.js',
    cwd: '/var/www/pi-gomoku/houduan',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
      PORT: 3001
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: '/var/log/pm2/pi-gomoku-error.log',
    out_file: '/var/log/pm2/pi-gomoku-out.log',
    log_file: '/var/log/pm2/pi-gomoku-combined.log',
    time: true,
    // 自动重启配置
    min_uptime: '10s',
    max_restarts: 10,
    // 内存监控
    max_memory_restart: '500M',
    // 健康检查
    health_check_grace_period: 3000,
    // 集群模式（可选）
    // instances: 'max',
    // exec_mode: 'cluster'
  }]
};
