/**
 * ⚡ PM2 ECOSYSTEM CONFIGURATION
 * 
 * PM2 is a production-grade process manager for Node.js applications.
 * It provides load balancing, auto-restart, logging, and monitoring.
 * 
 * Installation: npm install -g pm2
 * Usage: pm2 start ecosystem.config.cjs
 * 
 * Benefits over cluster.js:
 * - Better process management
 * - Built-in logging and monitoring
 * - Web dashboard
 * - Zero-downtime deployments
 * - Automatic restarts
 */

module.exports = {
  apps: [
    {
      name: 'food-fantasy-api',
      script: './server.js',
      instances: 'max', // Use all CPU cores (or specify number: 4)
      exec_mode: 'cluster', // Cluster mode for load balancing
      
      // ⚡ Environment variables
      env: {
        NODE_ENV: 'production',
        PORT: 8000,
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 8000,
      },
      
      // ⚡ Auto-restart configuration
      autorestart: true,
      watch: false, // Disable in production
      max_memory_restart: '500M', // Restart if memory exceeds 500MB
      
      // ⚡ Error handling
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2-combined.log',
      time: true, // Add timestamp to logs
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // ⚡ Restart policies
      min_uptime: '10s', // Consider app stable after 10s
      max_restarts: 10, // Max restarts in 1 minute
      restart_delay: 4000, // Wait 4s before restart
      
      // ⚡ Load balancing options
      instance_var: 'INSTANCE_ID', // Environment variable for instance ID
      
      // ⚡ Advanced settings
      kill_timeout: 5000, // Wait 5s before force kill
      listen_timeout: 3000, // Wait 3s for app to listen
      wait_ready: false, // Don't wait for ready signal
      
      // ⚡ Merge logs from all instances
      merge_logs: true,
      
      // ⚡ Source map support
      source_map_support: true,
      
      // ⚡ Ignore watch patterns
      ignore_watch: [
        'node_modules',
        'logs',
        'uploads',
        '.git',
        '*.log',
      ],
    },
  ],
  
  // ⚡ Deployment configuration (optional)
  deploy: {
    production: {
      user: 'deploy',
      host: ['your-server.com'],
      ref: 'origin/main',
      repo: 'git@github.com:your-username/food-fantasy-backend.git',
      path: '/var/www/food-fantasy-api',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.cjs --env production',
      'pre-setup': '',
      ssh_options: 'StrictHostKeyChecking=no',
    },
  },
};

