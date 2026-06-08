module.exports = {
  apps: [
    {
      name: 'holywins',
      script: 'server/index.js',
      cwd: '/var/www/holywins',
      instances: 1,
      exec_mode: 'fork',
      env: {
        PORT: 4001,
        NODE_ENV: 'production',
        SESSION_SAMESITE: 'none',
        INGEST_NGINX: 'true',
        NGINX_ACCESS_LOG: '/var/log/nginx/holywinscorumba_access.log',
      },
      output: '/var/www/holywins/logs/holywins-out.log',
      error: '/var/www/holywins/logs/holywins-err.log',
      log_date_format: 'YYYY-MM-DD HH:mm Z',
    },
  ],
}
