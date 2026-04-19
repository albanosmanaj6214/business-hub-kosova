require('dotenv').config()
const cron = require('node-cron')

const SECRET = process.env.SCRAPER_SECRET
const URL = process.env.SCRAPER_URL || 'http://localhost:3000/api/scraper'
const SCHEDULE = process.env.SCRAPER_CRON || '0 3 * * *'
const TZ = process.env.SCRAPER_TZ || 'Europe/Belgrade'

if (!SECRET) {
  console.error('[scraper] SCRAPER_SECRET missing in env — aborting')
  process.exit(1)
}

async function runScraper() {
  const start = Date.now()
  console.log(`[${new Date().toISOString()}] scraper run starting`)
  try {
    const res = await fetch(URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-scraper-secret': SECRET,
      },
      body: JSON.stringify({ type: 'all' }),
    })
    const data = await res.json().catch(() => ({ error: 'invalid json' }))
    const ms = Date.now() - start
    console.log(`[${new Date().toISOString()}] scraper run complete (${ms}ms) status=${res.status}:`, JSON.stringify(data))
  } catch (err) {
    console.error(`[${new Date().toISOString()}] scraper run FAILED:`, err.message)
  }
}

cron.schedule(SCHEDULE, runScraper, { timezone: TZ })
console.log(`[scraper] daemon started. schedule='${SCHEDULE}' tz='${TZ}' url='${URL}'`)

if (process.env.SCRAPER_RUN_ON_START === '1') {
  setTimeout(runScraper, 5000)
}
