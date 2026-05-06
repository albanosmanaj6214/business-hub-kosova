const fs = require('fs')
const path = require('path')

// Load .env into a plain object so PM2 passes them to the child process.
function readEnv(file) {
  if (!fs.existsSync(file)) return {}
  const out = {}
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (!m) continue
    let v = m[2].trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1)
    }
    out[m[1]] = v
  }
  return out
}

module.exports = {
  apps: [
    {
      name: 'businesshub',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      cwd: '/var/www/businesshub',
      env: {
        NODE_ENV: 'production',
        ...readEnv(path.join(__dirname, '.env')),
      },
    },
  ],
}
