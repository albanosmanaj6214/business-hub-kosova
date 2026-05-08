import { Wordmark } from '@/components/brand/Wordmark'

const swatches = [
  { name: 'navy', hex: '#1B4F72', role: 'Primary' },
  { name: 'cobalt', hex: '#2E86C1', role: 'Accent' },
  { name: 'success', hex: '#27AE60', role: 'Success' },
  { name: 'warn', hex: '#F39C12', role: 'Warning' },
  { name: 'danger', hex: '#E74C3C', role: 'Danger' },
] as const

export const metadata = {
  title: 'Brand — Kosova Business Hub',
}

export default function BrandPage() {
  return (
    <main className="mx-auto max-w-5xl space-y-16 px-6 py-16">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-brand-cobalt">Identitet vizual</p>
        <h1 className="font-serif text-4xl font-semibold text-brand-navy">Kosova Business Hub</h1>
        <p className="text-neutral-600">Sub-brand i AIAOhub. kosovabusinesses.aiaohub.com</p>
      </header>

      <section className="space-y-6">
        <h2 className="text-sm font-medium uppercase tracking-widest text-neutral-500">Wordmark — primary</h2>
        <div className="space-y-6 rounded-2xl border border-neutral-200 bg-white p-10">
          <Wordmark size="sm" />
          <Wordmark size="md" />
          <Wordmark size="lg" />
          <Wordmark size="xl" />
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-sm font-medium uppercase tracking-widest text-neutral-500">Wordmark — inverse</h2>
        <div className="space-y-6 rounded-2xl bg-brand-navy p-10">
          <Wordmark variant="inverse" size="sm" />
          <Wordmark variant="inverse" size="md" />
          <Wordmark variant="inverse" size="lg" />
          <Wordmark variant="inverse" size="xl" />
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-sm font-medium uppercase tracking-widest text-neutral-500">Wordmark — mono</h2>
        <div className="space-y-6 rounded-2xl bg-neutral-900 p-10 text-emerald-400">
          <Wordmark variant="mono" size="lg" />
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-sm font-medium uppercase tracking-widest text-neutral-500">Favicon & app icon</h2>
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {[16, 32, 64, 128].map((size) => (
            <figure key={size} className="rounded-2xl border border-neutral-200 bg-white p-6 text-center">
              <img
                src={size === 16 ? '/brand/favicon-16.svg' : '/brand/favicon.svg'}
                alt={`Favicon ${size}px`}
                width={size}
                height={size}
                className="mx-auto"
                style={{ width: size, height: size }}
              />
              <figcaption className="mt-3 text-xs text-neutral-500">{size}×{size}</figcaption>
            </figure>
          ))}
          <figure className="rounded-2xl border border-neutral-200 bg-white p-6 text-center">
            <img src="/brand/app-icon.svg" alt="App icon" width={96} height={96} className="mx-auto rounded-2xl" />
            <figcaption className="mt-3 text-xs text-neutral-500">App icon (iOS/Android)</figcaption>
          </figure>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-sm font-medium uppercase tracking-widest text-neutral-500">Color tokens</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          {swatches.map((s) => (
            <div key={s.name} className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
              <div className="h-24" style={{ backgroundColor: s.hex }} />
              <div className="space-y-0.5 p-4">
                <p className="text-sm font-medium text-neutral-900">brand.{s.name}</p>
                <p className="text-xs uppercase tracking-wider text-neutral-500">{s.role}</p>
                <p className="font-mono text-xs text-neutral-400">{s.hex}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
