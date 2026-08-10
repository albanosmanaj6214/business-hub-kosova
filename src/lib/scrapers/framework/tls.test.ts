import { describe, it, expect } from 'vitest'
import { needsChainRepair, caBundleWithIntermediates, GODADDY_G2_INTERMEDIATE, INCOMPLETE_CHAIN_HOSTS } from './tls'

describe('framework/tls — chain repair allowlist', () => {
  it('repairs only the explicit ATK hosts', () => {
    expect(needsChainRepair('https://www.atk-ks.org/feed/')).toBe(true)
    expect(needsChainRepair('https://atk-ks.org/x')).toBe(true)
    expect(needsChainRepair('https://example.com')).toBe(false)
    expect(needsChainRepair('https://evil-atk-ks.org.attacker.com')).toBe(false)
    expect(needsChainRepair('not a url')).toBe(false)
  })
  it('bundle = system roots PLUS the supplied public intermediate (verification stays on)', () => {
    const bundle = caBundleWithIntermediates()
    expect(bundle.length).toBeGreaterThan(100) // system roots present
    expect(bundle).toContain(GODADDY_G2_INTERMEDIATE)
    expect(GODADDY_G2_INTERMEDIATE).toContain('BEGIN CERTIFICATE')
  })
  it('allowlist is tiny + explicit', () => {
    expect(INCOMPLETE_CHAIN_HOSTS.size).toBeLessThanOrEqual(3)
  })
})
