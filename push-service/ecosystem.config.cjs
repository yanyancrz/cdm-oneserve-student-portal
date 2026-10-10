/**
 * PM2 process definition for the notification service.
 *
 *   npx pm2 start ecosystem.config.cjs
 *   npx pm2 startup        (then run the command it prints, once)
 *   npx pm2 save
 *
 * The service reads its whole configuration from push-service/.env, so the
 * environment never has to be exported into the shell or the systemd unit.
 */
module.exports = {
    apps: [
        {
            name: "cdm-oneserve-push",
            script: "src/server.js",
            cwd: __dirname,
            instances: 1,
            exec_mode: "fork",
            autorestart: true,
            // The claim step is atomic, so more than ONE worker is also safe
            // - keep it at 1 unless your batch volume justifies more.
            max_restarts: 10,
            min_uptime: "10s",
            restart_delay: 5000,
            max_memory_restart: "256M",
            time: true,
            out_file: "logs/push-out.log",
            error_file: "logs/push-error.log",
            merge_logs: true,
            env: {
                NODE_ENV: "production",
                TZ: "Asia/Manila",
            },
        },
    ],
};
