import { readFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { encode } from 'next-auth/jwt'
const BASE = 'http://localhost:3013'
const ENV = Object.fromEntries(readFileSync('/var/www/businesshub/.env', 'utf8').split('\n')
  .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
  .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')] }))
const psql = (s) => execSync('PGPASSWORD=businesshub psql -h localhost -U businesshub -d businesshub_db -t -A', { input: s }).toString().trim()
const uid = psql(`SELECT id FROM "User" WHERE email='demo@kosovabusinesses.aiaohub.com'`)
const jwt = await encode({ token: { id: uid, sub: uid, email: 'demo@kosovabusinesses.aiaohub.com', role: 'KOSOVO_BUSINESS', tier: 'PROFESSIONAL' }, secret: ENV.NEXTAUTH_SECRET, maxAge: 2592000 })
const r = await fetch(`${BASE}/dashboard/directory`, { headers: { cookie: `__Secure-next-auth.session-token=${jwt}` } })
const body = (await r.text()).replace(/<!-- -->/g, '')
let pass = 0, fail = 0
const ck = (n, c) => { if (c) { pass++; console.log('PASS', n) } else { fail++; console.log('FAIL', n) } }
ck('directory 200 (normal user)', r.status === 200)
ck('normal user SEES a test company again', body.includes('Test Software Studio') || body.includes('Test Investor Zurich') || body.includes('Test Tregti'))
ck('does NOT show the empty-state', !body.includes("Ende s'ka biznese publike"))
const m = body.match(/(\d+) \/ (\d+) biznese/)
console.log('  count line:', m ? m[0] : '(not found)')
console.log(`\n==== ${pass} PASS / ${fail} FAIL ====`)
process.exit(fail > 0 ? 1 : 0)
