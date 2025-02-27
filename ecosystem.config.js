module.exports = {
  apps: [
    {
      name: 'selene-api',
      script: 'dist/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'selene-queue',
      script: 'dist/queue-worker.js',
      instances: 2,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        NODE_OPTIONS: '--max-old-space-size=2048'
      }
    },
    {
      name: 'selene-queue-monitor',
      script: 'dist/monitor-queue.js',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
        MONITOR_PORT: 3000,
        QUEUE_ADMIN_USER: 'admin',
        QUEUE_ADMIN_PASS: 'secure_password'
      }
    }
  ]
};
