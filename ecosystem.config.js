module.exports = {
  apps: [
    {
      name: 'businesshub',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      cwd: '/var/www/businesshub',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
}
