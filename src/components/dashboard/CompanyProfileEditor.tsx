'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Building2, User as UserIcon, Mail, Phone, Globe, MapPin, Users,
  Camera, FileText, Rocket, Compass, ShieldCheck, Save, Loader2, CheckCircle2,
  AlertTriangle, Info,
} from 'lucide-react'
import { SECTORS } from '@/lib/sectors'
import { OfferingsSection } from '@/components/dashboard/OfferingsSection'
import { EMPLOYEE_COUNT_BUCKETS, EMPLOYEE_COUNT_LABEL } from '@/lib/employee-count'

const ACTIVITY_OPTIONS = [
  { value: 'prodhues-perpunues', label: 'Prodhues / Përpunues' },
  { value: 'sherbime', label: 'Shërbime' },
  { value: 'tregti', label: 'Tregti' },
  { value: 'bujqesi', label: 'Bujqësi' },
]

const VISIBILITY_OPTIONS = [
  { value: 'PRIVATE', label: 'Privat', hint: 'S\'shfaqet askund. Vetëm ti e sheh.' },
  { value: 'MEMBERS', label: 'Vetëm anëtarëve', hint: 'Shfaqet vetëm te bizneset e regjistruar në KBH.' },
  { value: 'PUBLIC', label: 'Publik', hint: 'Shfaqet edhe te vizitorët e pakyçur.' },
]

const KOSOVO_MUNICIPALITIES = [
  'Deçan', 'Dragash', 'Drenas (Gllogovc)', 'Ferizaj', 'Fushë Kosovë', 'Gjakovë', 'Gjilan', 'Hani i Elezit',
  'Istog', 'Junik', 'Kaçanik', 'Klinë', 'Kllokot', 'Leposaviq', 'Lipjan', 'Malishevë', 'Mamushë', 'Mitrovicë',
  'Novobërdë', 'Obiliq', 'Partesh', 'Pejë', 'Podujevë', 'Prishtinë', 'Prizren', 'Rahovec', 'Ranillug',
  'Shtërpcë', 'Shtime', 'Skenderaj', 'Suharekë', 'Viti', 'Vushtrri', 'Zubin Potok', 'Zveçan',
]

const BUSINESS_INTERESTS = [
  { value: 'looking_for_buyer', label: 'Kërkoj blerës për produktet e mia' },
  { value: 'looking_for_distributor', label: 'Kërkoj distributor' },
  { value: 'looking_for_investor', label: 'Kërkoj investitor' },
  { value: 'looking_for_partner', label: 'Kërkoj partner strategjik' },
  { value: 'looking_for_supplier', label: 'Kërkoj furnizues' },
  { value: 'export_ready', label: 'Jam i gatshëm për eksport' },
  { value: 'import_interested', label: 'Kam interes për importim' },
]

const STARTUP_STAGES = [
  { value: 'IDEA', label: 'Ide (ende s\'kam filluar regjistrimin)' },
  { value: 'IN_REGISTRATION', label: 'Në regjistrim' },
  { value: 'REGISTERED_NO_REVENUE', label: 'I regjistruar, ende pa të hyra' },
  { value: 'EARLY_REVENUE', label: 'Të hyra fillestare' },
  { value: 'GROWING', label: 'Në rritje' },
]

const LEGAL_FORMS = [
  { value: 'BIZNES_INDIVIDUAL', label: 'Biznes Individual (B.I.)' },
  { value: 'SHPK', label: 'Shoqëri me Përgjegjësi të Kufizuar (SH.P.K.)' },
  { value: 'SHA', label: 'Shoqëri Aksionare (Sh.A.)' },
  { value: 'ORTAKERI_E_PERGJITHSHME', label: 'Ortakëri e Përgjithshme' },
  { value: 'ORTAKERI_E_KUFIZUAR', label: 'Ortakëri e Kufizuar' },
  { value: 'DEGE_E_HUAJ', label: 'Degë e Shoqërisë së Huaj' },
]

const STARTUP_NEEDS = [
  'ARBK', 'NACE', 'Statut', 'Bankë', 'ATK/EDI', 'Kontabilist',
  'Grant', 'Mentorim', 'Business Plan', 'Investitor', 'Buyer', 'Distributor',
]

const DIASPORA_SUB_ROLES = [
  { value: 'BUYER', label: 'Buyer (Blerës)' },
  { value: 'INVESTOR', label: 'Investor' },
  { value: 'DISTRIBUTOR', label: 'Distributor' },
  { value: 'IMPORTER', label: 'Importer' },
  { value: 'PARTNER', label: 'Partner Strategjik' },
  { value: 'SERVICE_PROVIDER', label: 'Ofrues Shërbimesh' },
]

interface Props {
  initial: any
}

export function CompanyProfileEditor({ initial }: Props) {
  const [form, setForm] = useState<any>({
    ...initial,
    startupStage: initial.startupProfile?.stage ?? '',
    intendedLegalForm: initial.startupProfile?.intendedLegalForm ?? '',
    startupNeeds: initial.startupProfile?.needs ?? [],
    hasProduct: initial.startupProfile?.hasProduct ?? false,
    prototypeUrl: initial.startupProfile?.prototypeUrl ?? '',
    countryOfOperation: initial.diasporaProfile?.countryOfOperation ?? '',
    city: initial.diasporaProfile?.city ?? '',
    countriesActive: initial.diasporaProfile?.countriesActive ?? [],
    subRoles: initial.diasporaProfile?.subRoles ?? [],
    sectorsOfInterest: initial.diasporaProfile?.sectorsOfInterest ?? [],
    productsSought: initial.diasporaProfile?.productsSought ?? [],
    productsOffered: initial.diasporaProfile?.productsOffered ?? [],
    purposeSummary: initial.diasporaProfile?.purposeSummary ?? '',
    investmentBudget: initial.diasporaProfile?.investmentBudget ?? '',
    marketShare: initial.diasporaProfile?.marketShare ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  const isDiaspora = initial.roleType === 'DIASPORA'
  const isStartup = initial.roleType === 'STARTUP'
  const isKosovo = initial.roleType === 'KOSOVO_BUSINESS'

  // Progress calculation
  const progress = useMemo(() => {
    const required: [string, any][] = [
      ['name', form.name],
      ['activityType', isDiaspora ? true : form.activityType],
      ['municipality', isDiaspora ? true : form.municipality],
      ['country', form.country],
      ['email', form.email],
      ['contactPerson', form.contactPerson],
    ]
    const optional: [string, any][] = [
      ['phone', form.phone],
      ['website', form.website],
      ['logoUrl', form.logoUrl],
      ['shortDescription', form.shortDescription],
      ['longDescription', form.longDescription],
      ['sectors', form.sectors?.length > 0],
      ['employeeCount', form.employeeCount],
      ['interests', form.interests?.length > 0],
    ]
    if (isDiaspora) {
      required.push(['countryOfOperation', form.countryOfOperation])
      required.push(['city', form.city])
      required.push(['subRoles', form.subRoles?.length > 0])
      required.push(['sectorsOfInterest', form.sectorsOfInterest?.length > 0])
    }
    if (isStartup) {
      required.push(['startupStage', form.startupStage])
    }
    const filled = [...required, ...optional].filter(([_, v]) => !!v).length
    const total = required.length + optional.length
    return Math.round((filled / total) * 100)
  }, [form, isDiaspora, isStartup])

  const toggleInArray = (field: string, value: string) => {
    setForm((f: any) => ({
      ...f,
      [field]: (f[field] ?? []).includes(value)
        ? (f[field] ?? []).filter((v: string) => v !== value)
        : [...(f[field] ?? []), value],
    }))
  }

  async function save(submitForReview = false) {
    setSaving(true); setErr(null); setMsg(null)
    try {
      const res = await fetch('/api/company', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, submitForReview }),
      })
      const data = await res.json()
      if (!res.ok) { setErr(data.error || 'Ruajtja dështoi'); return }
      setSubmitted(submitForReview)
      setMsg(submitForReview ? 'U dorëzua për shqyrtim nga admini!' : 'U ruajt.')
      setTimeout(() => setMsg(null), 3000)
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Progress + Status */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Kompletimi i profilit</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Statusi:{' '}
                <span className={`font-semibold ${
                  form.profileStatus === 'APPROVED' ? 'text-green-700' :
                  form.profileStatus === 'PENDING' ? 'text-amber-700' :
                  form.profileStatus === 'REJECTED' ? 'text-red-700' :
                  'text-gray-700'
                }`}>
                  {form.profileStatus === 'DRAFT' && 'Draft (në punë)'}
                  {form.profileStatus === 'PENDING' && 'Në pritje të shqyrtimit'}
                  {form.profileStatus === 'APPROVED' && 'Aprovuar'}
                  {form.profileStatus === 'REJECTED' && 'Refuzuar'}
                </span>
              </p>
            </div>
            <span className="text-3xl font-bold text-[#1B4F72]">{progress}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#1B4F72] to-[#2E86C1] transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {msg && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 flex items-center gap-2 text-sm text-green-800">
          <CheckCircle2 className="h-4 w-4" /> {msg}
        </div>
      )}
      {err && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 flex items-center gap-2 text-sm text-red-700">
          <AlertTriangle className="h-4 w-4" /> {err}
        </div>
      )}

      {/* Të dhëna bazë */}
      <Section icon={Building2} title="Të dhëna bazë">
        <Input
          id="name"
          label={isDiaspora ? 'Emri i biznesit ose personit *' : 'Emri i biznesit *'}
          value={form.name || ''}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        {!isDiaspora && (
          <Input
            id="legalName"
            label="Emri ligjor i plotë (nëse ndryshon)"
            value={form.legalName || ''}
            onChange={(e) => setForm({ ...form, legalName: e.target.value })}
          />
        )}

        {!isDiaspora && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Aktiviteti *</label>
            <select
              value={form.activityType || ''}
              onChange={(e) => setForm({ ...form, activityType: e.target.value, sectors: [] })}
              required
              className="flex h-11 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E86C1]"
            >
              <option value="">Zgjidh</option>
              {ACTIVITY_OPTIONS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
          </div>
        )}

        {!isDiaspora && (form.activityType === 'prodhues-perpunues' || form.activityType === 'sherbime') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sektori kryesor</label>
            <p className="text-xs text-gray-500 mb-2">Zgjidh një sektor. Nëse vepron në më shumë se një, na kontakto për qasje shtesë.</p>
            <div className="flex flex-wrap gap-1.5">
              {SECTORS
                .filter((s) => form.activityType === 'prodhues-perpunues' ? s.group === 'production' : s.group === 'services')
                .map((s) => (
                  <label
                    key={s.slug}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border cursor-pointer ${
                      (form.sectors || []).includes(s.slug)
                        ? 'bg-[#1B4F72] text-white border-[#1B4F72]'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-[#2E86C1]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="sector"
                      className="sr-only"
                      checked={(form.sectors || []).includes(s.slug)}
                      onChange={() => setForm({ ...form, sectors: [s.slug] })}
                    />
                    {s.sq}
                  </label>
                ))}
            </div>
          </div>
        )}

        {!isDiaspora && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Numri i të punësuarve</label>
            <select
              value={form.employeeCount || ''}
              onChange={(e) => setForm({ ...form, employeeCount: e.target.value })}
              className="flex h-11 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E86C1]"
            >
              <option value="">Zgjidh</option>
              {EMPLOYEE_COUNT_BUCKETS.map((b) => (
                <option key={b} value={b}>{EMPLOYEE_COUNT_LABEL[b].sq}</option>
              ))}
            </select>
          </div>
        )}
      </Section>

      {/* Vendndodhja */}
      <Section icon={MapPin} title="Vendndodhja">
        {!isDiaspora && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Komuna *</label>
            <select
              value={form.municipality || ''}
              onChange={(e) => setForm({ ...form, municipality: e.target.value })}
              required
              className="flex h-11 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E86C1]"
            >
              <option value="">Zgjidh komunën</option>
              {KOSOVO_MUNICIPALITIES.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        )}

        {isDiaspora && (
          <>
            <Input
              id="countryOfOperation"
              label="Vendi ku operon *"
              value={form.countryOfOperation || ''}
              onChange={(e) => setForm({ ...form, countryOfOperation: e.target.value })}
              placeholder="p.sh. Gjermani"
              required
            />
            <Input
              id="city"
              label="Qyteti *"
              value={form.city || ''}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              placeholder="p.sh. Berlin"
              required
            />
          </>
        )}

        <Input
          id="country"
          label={isDiaspora ? 'Vendi kryesor' : 'Shteti'}
          value={form.country || (isDiaspora ? '' : 'Kosovë')}
          onChange={(e) => setForm({ ...form, country: e.target.value })}
        />
        <Input
          id="address"
          label="Adresa e plotë (opsionale)"
          value={form.address || ''}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
        />
      </Section>

      {/* Produktet/Shërbimet (§3) — vetëm rolet me ofertë konkrete */}
      {!isDiaspora && <OfferingsSection />}

      {/* Kontakti */}
      <Section icon={Mail} title="Kontakti">
        <Input id="email" label="Email zyrtar *" type="email" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <Input id="contactPerson" label="Personi i kontaktit *" value={form.contactPerson || ''} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} required />
        <Input id="phone" label="Telefoni" value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+383 ..." />
        <Input id="website" label="Website" value={form.website || ''} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://..." />
      </Section>

      {/* Prezantimi */}
      <Section icon={Camera} title="Prezantimi publik">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Logoja</label>
          <div className="flex items-center gap-3">
            {form.logoBase64 ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={form.logoBase64} alt="Logo" className="w-16 h-16 rounded-lg object-cover border border-gray-200 bg-gray-50" />
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={`/api/media/company-logo/${initial.id}`} alt="Logo" className="w-16 h-16 rounded-lg object-cover border border-gray-200 bg-gray-50" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
            )}
            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
              <Camera className="h-4 w-4" /> Ngarko logo (JPG/PNG)
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (!f) return
                  if (f.size > 1_500_000) { setErr('Logoja duhet të jetë nën 1.5MB.'); return }
                  const reader = new FileReader()
                  reader.onload = () => setForm({ ...form, logoBase64: String(reader.result) })
                  reader.readAsDataURL(f)
                }}
              />
            </label>
            {form.logoBase64 && (
              <button type="button" onClick={() => setForm({ ...form, logoBase64: undefined })} className="text-xs text-gray-500 hover:text-gray-700">Anulo</button>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-1">Deri 1.5MB. Zëvendëson logon aktuale në profilin publik.</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Përshkrim i shkurtër (max 500 karaktere)</label>
          <textarea
            value={form.shortDescription || ''}
            onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
            rows={2}
            maxLength={500}
            className="w-full px-3 py-2 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E86C1]"
            placeholder="Një fjali që përshkruan biznesin tuaj"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Përshkrim i gjatë</label>
          <textarea
            value={form.longDescription || ''}
            onChange={(e) => setForm({ ...form, longDescription: e.target.value })}
            rows={5}
            maxLength={5000}
            className="w-full px-3 py-2 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E86C1]"
            placeholder="Historia e biznesit, produktet/shërbimet, arritjet, vizioni..."
          />
        </div>
      </Section>

      {/* Interesat për bashkëpunim */}
      {!isDiaspora && (
        <Section icon={Users} title="Bashkëpunimi që kërkon (për Matchmaking dhe Directory)">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {BUSINESS_INTERESTS.map((i) => (
              <label
                key={i.value}
                className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                  (form.interests || []).includes(i.value)
                    ? 'border-[#2E86C1] bg-[#2E86C1]/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={(form.interests || []).includes(i.value)}
                  onChange={() => toggleInArray('interests', i.value)}
                  className="sr-only"
                />
                <span className="text-sm text-gray-700">{i.label}</span>
              </label>
            ))}
          </div>
        </Section>
      )}

      {/* Startup specifike */}
      {isStartup && (
        <Section icon={Rocket} title="Fazë dhe nevoja (Startup)">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Faza aktuale *</label>
            <select
              value={form.startupStage || ''}
              onChange={(e) => setForm({ ...form, startupStage: e.target.value })}
              required
              className="flex h-11 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E86C1]"
            >
              <option value="">Zgjidh fazën</option>
              {STARTUP_STAGES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Forma ligjore e synuar</label>
            <select
              value={form.intendedLegalForm || ''}
              onChange={(e) => setForm({ ...form, intendedLegalForm: e.target.value })}
              className="flex h-11 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E86C1]"
            >
              <option value="">Zgjidh</option>
              {LEGAL_FORMS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Cka të nevojitet aktualisht</label>
            <div className="flex flex-wrap gap-1.5">
              {STARTUP_NEEDS.map((n) => (
                <label
                  key={n}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border cursor-pointer ${
                    (form.startupNeeds || []).includes(n)
                      ? 'bg-[#1B4F72] text-white border-[#1B4F72]'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-[#2E86C1]'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={(form.startupNeeds || []).includes(n)}
                    onChange={() => toggleInArray('startupNeeds', n)}
                  />
                  {n}
                </label>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.hasProduct || false} onChange={(e) => setForm({ ...form, hasProduct: e.target.checked })} />
            <span className="text-sm text-gray-700">Kam produkt ose prototip</span>
          </label>
          {form.hasProduct && (
            <Input id="prototypeUrl" label="URL i prototipit/demo-s" value={form.prototypeUrl || ''} onChange={(e) => setForm({ ...form, prototypeUrl: e.target.value })} />
          )}
        </Section>
      )}

      {/* Diaspora specifike */}
      {isDiaspora && (
        <Section icon={Compass} title="Interesa dhe rolet (Diasporë)">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nën-rolet *</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {DIASPORA_SUB_ROLES.map((r) => (
                <label
                  key={r.value}
                  className={`flex items-center p-3 rounded-lg border-2 cursor-pointer ${
                    (form.subRoles || []).includes(r.value)
                      ? 'border-[#2E86C1] bg-[#2E86C1]/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={(form.subRoles || []).includes(r.value)}
                    onChange={() => toggleInArray('subRoles', r.value)}
                    className="sr-only"
                  />
                  <span className="text-sm text-gray-700">{r.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sektorët e interesit *</label>
            <div className="flex flex-wrap gap-1.5">
              {SECTORS.map((s) => (
                <label
                  key={s.slug}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border cursor-pointer ${
                    (form.sectorsOfInterest || []).includes(s.slug)
                      ? 'bg-[#1B4F72] text-white border-[#1B4F72]'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-[#2E86C1]'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={(form.sectorsOfInterest || []).includes(s.slug)}
                    onChange={() => toggleInArray('sectorsOfInterest', s.slug)}
                  />
                  {s.sq}
                </label>
              ))}
            </div>
          </div>

          <ChipInput
            label="Produkte që kërkon nga Kosova (shto me Enter)"
            values={form.productsSought || []}
            onChange={(v) => setForm({ ...form, productsSought: v })}
            placeholder="p.sh. karriga, verë, mjaltë..."
          />
          <ChipInput
            label="Produkte/shërbime që ofron"
            values={form.productsOffered || []}
            onChange={(v) => setForm({ ...form, productsOffered: v })}
            placeholder="p.sh. konsulencë, IT services..."
          />
          <ChipInput
            label="Shtete të tjera ku ke aktivitet"
            values={form.countriesActive || []}
            onChange={(v) => setForm({ ...form, countriesActive: v })}
            placeholder="p.sh. Gjermani, Zvicër, Austri..."
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Qëllimi kryesor</label>
            <textarea
              value={form.purposeSummary || ''}
              onChange={(e) => setForm({ ...form, purposeSummary: e.target.value })}
              rows={3}
              maxLength={2000}
              className="w-full px-3 py-2 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E86C1]"
              placeholder="Shpjego shkurtimisht çka kërkon nga bashkëpunimi me Kosovën"
            />
          </div>
          <Input id="investmentBudget" label="Buxheti orientues për investim (opsionale)" value={form.investmentBudget || ''} onChange={(e) => setForm({ ...form, investmentBudget: e.target.value })} placeholder="p.sh. 50,000 - 200,000 EUR" />
        </Section>
      )}

      {/* Visibility */}
      <Section icon={ShieldCheck} title="Dukshmëria">
        <div className="space-y-2">
          {VISIBILITY_OPTIONS.map((v) => (
            <label
              key={v.value}
              className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer ${
                form.visibilityLevel === v.value
                  ? 'border-[#2E86C1] bg-[#2E86C1]/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="visibility"
                value={v.value}
                checked={form.visibilityLevel === v.value}
                onChange={() => setForm({ ...form, visibilityLevel: v.value })}
                className="mt-0.5"
              />
              <div>
                <p className="text-sm font-medium text-gray-900">{v.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{v.hint}</p>
              </div>
            </label>
          ))}
        </div>

        <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 flex items-start gap-2">
          <Info className="h-4 w-4 text-blue-700 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-900 leading-relaxed">
            Kur je gati me profilin, kliko <strong>&quot;Dorëzo për shqyrtim&quot;</strong>. Admini KBH e shqyrton për
            saktësi para se të bëhet publik në Directory. Kontakti direkt nuk shfaqet — vetëm përmes "Kërko Kontakt".
          </p>
        </div>
      </Section>

      {/* Action buttons */}
      <div className="flex flex-wrap items-center gap-3 sticky bottom-0 bg-white p-4 border-t border-gray-200 rounded-lg shadow-lg -mx-2 sm:mx-0">
        <Button
          onClick={() => save(false)}
          disabled={saving}
          variant="outline"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Ruaj si Draft
        </Button>
        <Button
          onClick={() => save(true)}
          disabled={saving || progress < 60}
          className="bg-[#1B4F72] hover:bg-[#2E86C1] text-white"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
          Dorëzo për shqyrtim
        </Button>
        {progress < 60 && (
          <span className="text-xs text-amber-700">Duhet të plotësosh më shumë (60%+) para se ta dorëzosh.</span>
        )}
      </div>
    </div>
  )
}

function Section({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
          <Icon className="h-4 w-4 text-[#1B4F72]" />
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        </div>
        {children}
      </CardContent>
    </Card>
  )
}

function ChipInput({ label, values, onChange, placeholder }: { label: string; values: string[]; onChange: (next: string[]) => void; placeholder?: string }) {
  const [draft, setDraft] = useState('')
  const add = () => {
    const v = draft.trim()
    if (v && !values.includes(v)) onChange([...values, v])
    setDraft('')
  }
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {values.map((v) => (
          <span key={v} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-[#1B4F72] text-white">
            {v}
            <button onClick={() => onChange(values.filter((x) => x !== v))} className="hover:opacity-70">×</button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder={placeholder}
          className="flex-1 h-10 px-3 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E86C1]"
        />
        <button type="button" onClick={add} className="px-3 py-1.5 rounded-md border border-gray-300 text-sm hover:bg-gray-50">Shto</button>
      </div>
    </div>
  )
}
