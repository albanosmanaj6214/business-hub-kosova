import { describe, it, expect } from 'vitest'
import { assertSafeUrl, isPrivateOrReservedIp, UnsafeUrlError } from '@/lib/ingestion/safe-url'

describe('isPrivateOrReservedIp', () => {
  it('flags loopback, private, link-local, metadata, CGNAT', () => {
    for (const ip of ['127.0.0.1', '10.0.0.5', '172.16.0.1', '172.31.255.255', '192.168.1.1', '169.254.169.254', '0.0.0.0', '100.64.0.1', '224.0.0.1', '::1', 'fe80::1', 'fc00::1', '::ffff:127.0.0.1']) {
      expect(isPrivateOrReservedIp(ip), ip).toBe(true)
    }
  })
  it('allows public IPs', () => {
    for (const ip of ['8.8.8.8', '1.1.1.1', '93.184.216.34', '172.15.0.1', '172.32.0.1']) {
      expect(isPrivateOrReservedIp(ip), ip).toBe(false)
    }
  })
})

describe('assertSafeUrl', () => {
  const rejects = async (u: string) => {
    await expect(assertSafeUrl(u)).rejects.toBeInstanceOf(UnsafeUrlError)
  }
  it('rejects non-http(s) protocols', async () => {
    await rejects('ftp://example.com')
    await rejects('file:///etc/passwd')
    await rejects('gopher://x')
  })
  it('rejects localhost + loopback + metadata by literal', async () => {
    await rejects('http://localhost/admin')
    await rejects('http://127.0.0.1:3000/')
    await rejects('http://[::1]/')
    await rejects('http://169.254.169.254/latest/meta-data/')
  })
  it('rejects private ranges by literal IP', async () => {
    await rejects('http://10.0.0.1/')
    await rejects('http://192.168.0.1/')
    await rejects('http://172.16.0.1/')
  })
  it('rejects embedded credentials', async () => {
    await rejects('https://user:pass@example.com/')
  })
  it('accepts a public IP literal over https', async () => {
    const u = await assertSafeUrl('https://8.8.8.8/')
    expect(u.protocol).toBe('https:')
  })
})
