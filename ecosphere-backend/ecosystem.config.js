// PM2 Configuration for EcoSphere Backend
// Production-ready process management

module.exports = {
    apps: [
        {
            name: 'ecosphere-backend',
            script: './server.js',

            // Instances
            instances: 2, // Run 2 instances for load balancing
            exec_mode: 'cluster', // Cluster mode for better performance

            // Environment
            env: {
                NODE_ENV: 'development',
                PORT: 3001
            },
            env_production: {
                NODE_ENV: 'production',
                PORT: 3001
            },

            // Logging
            error_file: './logs/error.log',
            out_file: './logs/out.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
            merge_logs: true,

            // Restart behavior
            watch: false, // Don't watch files in production
            max_memory_restart: '500M', // Restart if memory exceeds 500MB
            autorestart: true, // Auto restart if crash
            max_restarts: 10, // Max restart attempts
            min_uptime: '10s', // Min uptime before considered stable

            // Graceful shutdown
            kill_timeout: 5000, // Wait 5s before force kill
            wait_ready: true, // Wait for app to be ready
            listen_timeout: 10000, // Wait 10s for app to listen

            // Advanced features
            instance_var: 'INSTANCE_ID',

            // Monitoring
            pmx: true,

            // Source map support
            source_map_support: true,

            // Ignore watch (if watch is enabled)
            ignore_watch: [
                'node_modules',
                'logs',
                '.git',
                '*.log'
            ]
        }
    ],

    // Deployment configuration (optional)
    deploy: {
        production: {
            user: 'deploy',
            host: 'your-server.com',
            ref: 'origin/main',
            repo: 'git@github.com:your-repo/ecosphere.git',
            path: '/var/www/ecosphere-backend',
            'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
            'pre-deploy-local': 'echo "Deploying to production..."'
        }
    }
};
