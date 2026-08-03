'use client'

import NextLink from 'next/link'
import { ShieldAlert, CheckCircle2, XCircle, AlertTriangle, ClipboardList, ExternalLink } from 'lucide-react'
import { marketGroupFor, productGroupLabel } from '@/lib/product-groups'

// "Kërkesat për këtë treg" (greenlight, vala 1). Shfaq VETËM rregulla VERIFIED (me akt
// ligjor + link + datë verifikimi kur janë ligjore). BLOCKED = tregu i mbyllur me ligj
// (i cituar); MANDATORY me kod certifikimi krahasohet me certifikimet e profilit
// (✓/✗ + "Certifikohu me X"); BUYER_EXPECTED = paralajmërim; PROCEDURAL = checklist.
// Formulimi është informues ("sipas kërkesave të BE-së") — kurrë këshillë ligjore.

export interface MarketReq {
  marketGroup: string
  productGroup: string
  requirementType: string
  certificationCode: string | null
  titleSq: string
  detailSq: string | null
  legalActName: string | null
  legalActUrl: string | null
  unlockPathSq: string | null
  verifiedAt: string | null
  sortOrder: number
}

export function MarketRequirements({ countryCode, requirements, myCerts, myGroups, isFoodSector }: {
  countryCode: string
  requirements: MarketReq[]
  myCerts: string[]
  myGroups: string[]
  isFoodSector: boolean
}) {
  if (!isFoodSector) return null

  if (!myGroups.length) {
    return (
      <div className="rounded-lg border border-blue-200 bg-blue-50/70 px-3 py-2.5 text-xs text-blue-900 mt-4">
        Zgjidh <NextLink href="/dashboard/profili-kompanise" className="font-bold underline">grupet e produkteve në profil</NextLink>{' '}
        që të shohësh kërkesat e sakta të këtij tregu për produktet e tua.
      </div>
    )
  }

  const group = marketGroupFor(countryCode)
  const mine = requirements
    .filter((r) => r.marketGroup === group && myGroups.includes(r.productGroup))
    .sort((a, b) => a.sortOrder - b.sortOrder)
  if (!mine.length) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-900 mt-4">
        Kërkesat e verifikuara për këtë treg dhe produktet e tua janë ende në përgatitje —
        s&apos;shfaqim kërkesa të paverifikuara.
      </div>
    )
  }

  const byProduct = new Map<string, MarketReq[]>()
  for (const r of mine) {
    const arr = byProduct.get(r.productGroup) ?? []
    arr.push(r)
    byProduct.set(r.productGroup, arr)
  }

  return (
    <div className="mt-4">
      <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">Kërkesat për këtë treg — produktet e tua</p>
      <div className="space-y-3">
        {Array.from(byProduct.entries()).map(([pg, rules]) => {
          const blocked = rules.filter((r) => r.requirementType === 'BLOCKED')
          const mandatory = rules.filter((r) => r.requirementType === 'MANDATORY')
          const buyer = rules.filter((r) => r.requirementType === 'BUYER_EXPECTED')
          const procedural = rules.filter((r) => r.requirementType === 'PROCEDURAL')
          return (
            <div key={pg} className="rounded-xl border border-gray-200 overflow-hidden">
              <p className="bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-700 border-b border-gray-200">{productGroupLabel(pg)}</p>
              <div className="p-3 space-y-2">
                {blocked.map((r) => (
                  <div key={r.titleSq} className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5">
                    <p className="text-xs font-bold text-rose-800 flex items-start gap-1.5">
                      <ShieldAlert className="h-4 w-4 flex-none mt-[1px]" />{r.titleSq}
                    </p>
                    {r.detailSq && <p className="text-[11.5px] text-rose-900/85 mt-1">{r.detailSq}</p>}
                    {r.legalActName && (
                      <p className="text-[11px] text-rose-800 mt-1.5 font-semibold">
                        {r.legalActUrl
                          ? <a href={r.legalActUrl} target="_blank" rel="noreferrer" className="underline inline-flex items-center gap-1">{r.legalActName} <ExternalLink className="h-3 w-3" /></a>
                          : r.legalActName}
                        {r.verifiedAt && <span className="font-normal"> · verifikuar {r.verifiedAt}</span>}
                      </p>
                    )}
                    {r.unlockPathSq && <p className="text-[11px] text-rose-900/75 mt-1.5 border-t border-rose-200 pt-1.5"><b>Rruga e zhbllokimit:</b> {r.unlockPathSq}</p>}
                  </div>
                ))}
                {mandatory.map((r) => {
                  const isCert = !!r.certificationCode
                  const have = isCert && myCerts.includes(r.certificationCode as string)
                  return (
                    <div key={r.titleSq} className={`rounded-lg border px-3 py-2 ${isCert ? (have ? 'border-green-200 bg-green-50' : 'border-amber-300 bg-amber-50') : 'border-gray-200 bg-gray-50/60'}`}>
                      <p className="text-xs font-semibold text-gray-800 flex items-start gap-1.5">
                        {isCert ? (have ? <CheckCircle2 className="h-4 w-4 text-green-600 flex-none mt-[1px]" /> : <XCircle className="h-4 w-4 text-amber-600 flex-none mt-[1px]" />) : <ClipboardList className="h-4 w-4 text-gray-400 flex-none mt-[1px]" />}
                        {r.titleSq}
                      </p>
                      {r.detailSq && <p className="text-[11.5px] text-gray-600 mt-0.5 ml-5">{r.detailSq}</p>}
                      {r.legalActName && (
                        <p className="text-[11px] text-gray-500 mt-0.5 ml-5">
                          {r.legalActUrl ? <a href={r.legalActUrl} target="_blank" rel="noreferrer" className="underline">{r.legalActName}</a> : r.legalActName}
                          {r.verifiedAt && <span> · verifikuar {r.verifiedAt}</span>}
                        </p>
                      )}
                      {isCert && !have && (
                        <NextLink href="/dashboard/profili-kompanise" className="ml-5 mt-1 inline-block text-[11.5px] font-bold text-[#1B4F72] underline">
                          Certifikohu / shëno certifikimin në profil →
                        </NextLink>
                      )}
                    </div>
                  )
                })}
                {buyer.length > 0 && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50/60 px-3 py-2">
                    <p className="text-[11px] font-bold text-amber-800 flex items-center gap-1.5 mb-1"><AlertTriangle className="h-3.5 w-3.5" />Të pritura nga blerësit (jo bllok ligjor)</p>
                    {buyer.map((r) => {
                      const have = r.certificationCode ? myCerts.includes(r.certificationCode) : false
                      return <p key={r.titleSq} className="text-[11.5px] text-amber-900/85">{have ? '✓' : '○'} {r.titleSq}</p>
                    })}
                  </div>
                )}
                {procedural.length > 0 && (
                  <div className="rounded-lg border border-gray-200 bg-white px-3 py-2">
                    <p className="text-[11px] font-bold text-gray-500 mb-1">Procedura (checklist)</p>
                    {procedural.map((r) => (
                      <div key={r.titleSq} className="text-[11.5px] text-gray-600">
                        • {r.titleSq}
                        {r.legalActName && <span className="text-gray-400"> — {r.legalActUrl ? <a href={r.legalActUrl} target="_blank" rel="noreferrer" className="underline">{r.legalActName}</a> : r.legalActName}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
      <p className="text-[10.5px] text-gray-400 mt-2">
        Informacion orientues sipas akteve të cituara — jo këshillë ligjore. Konfirmo gjithmonë te
        burimi zyrtar para veprimit.
      </p>
    </div>
  )
}
