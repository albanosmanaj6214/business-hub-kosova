/**
 * Ndreqja e 15 pretendimeve që mbështeteshin në burime të ndaluara nga protokolli:
 * Wikipedia, një blog rrobaqepësie, një faqe e pastrehë në Vercel, dhe privacyshield.gov —
 * skemë e shfuqizuar nga GJDBE me vendimin Schrems II (C-311/18, 16 korrik 2020).
 *
 * Gjatë verifikimit dolën edhe DY GABIME FAKTIKE, jo thjesht burime të dobëta:
 *   • Bullgaria renditej si palë e CEFTA-s. Bullgaria u tërhoq nga CEFTA më 1 janar 2007.
 *   • Zvicra renditej si palë e CEFTA-s. Zvicra nuk ka qenë kurrë palë e CEFTA-s.
 *
 *   npx tsx scripts/ndreq-burimet-e-ndaluara.ts --dry
 */
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
const DRY = process.argv.includes('--dry')
const SOT = '2026-08-26'

type Patch = Record<string, unknown>
interface Rregullim {
  vend: string
  fusha: 'labeling' | 'sectorRules' | 'tradeAgreements' | 'requiredDocs' | 'certifications' | 'customs'
  gjej: string // nënvarg i tekstit
  patch: Patch
  tekstIRi?: { sq: string; en: string } | string
}

const RREGULLIMET: Rregullim[] = [
  // ── FRANCË: dy pretendime nga një blog rrobaqepësie ─────────────────────────
  {
    vend: 'FR', fusha: 'sectorRules', gjej: 'Food labels must be fully in French',
    patch: {
      legalAct: 'Rregullorja (BE) nr. 1169/2011 për informimin e konsumatorit për ushqimin (FIC), neni 9',
      legalActUrl: 'https://eur-lex.europa.eu/eli/reg/2011/1169/2018-01-01',
      sourceUrl: 'https://food.ec.europa.eu/food-safety/labelling-and-nutrition/food-information-consumers-legislation_en',
      sourceExcerpt: 'Regulation (EU) No 1169/2011 on the provision of food information to consumers (FIC Regulation) … entered into application on 13 December 2014.',
      authority: 'Komisioni Europian — Siguria Ushqimore; zbatimi në Francë nga DGCCRF',
      jurisdiction: 'BE + Francë', category: 'LEGAL', confidence: 'HIGH', riskIfWrong: 'HIGH',
      humanVerification: false, publicationStatus: 'PUBLISH', checkedAt: SOT,
      correction: 'Burimi i mëparshëm ishte një blog rrobaqepësie. U zëvendësua me aktin bazë.',
    },
  },
  {
    vend: 'FR', fusha: 'sectorRules', gjej: 'The cosmetic product label must contain',
    patch: {
      legalAct: 'Rregullorja (KE) nr. 1223/2009 për produktet kozmetike, neni 19',
      sourceUrl: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32009R1223',
      authority: 'Komisioni Europian; zbatimi në Francë nga ANSM dhe DGCCRF',
      jurisdiction: 'BE + Francë', category: 'LEGAL', confidence: 'HIGH', riskIfWrong: 'HIGH',
      humanVerification: false, publicationStatus: 'PUBLISH WITH WARNING', checkedAt: SOT,
      note: 'Akti dhe neni janë të saktë; citimi tekstual nuk është ruajtur ende.',
      correction: 'Burimi i mëparshëm ishte një blog rrobaqepësie.',
    },
  },

  // ── SLLOVAKI: tre pretendime nga privacyshield.gov ──────────────────────────
  {
    vend: 'SK', fusha: 'labeling', gjej: 'State Language Law',
    patch: {
      legalAct: 'Ligji i Këshillit Kombëtar të Republikës Sllovake nr. 270/1995 Coll. për gjuhën shtetërore',
      sourceUrl: 'https://www.slov-lex.sk/pravne-predpisy/SK/ZZ/1995/270/',
      authority: 'Slov-Lex — sistemi zyrtar i informacionit juridik i Republikës Sllovake; mbikëqyrja nga Ministria e Kulturës',
      jurisdiction: 'Sllovaki', category: 'LEGAL', confidence: 'HIGH', riskIfWrong: 'MEDIUM',
      humanVerification: false, publicationStatus: 'PUBLISH WITH WARNING', checkedAt: SOT,
      note: 'Ligji hyri në fuqi më 1 janar 1996 dhe është ndryshuar disa herë; përdorni versionin e konsoliduar në Slov-Lex.',
      correction: 'GABIM I RËNDË I NDREQUR: burimi i mëparshëm ishte privacyshield.gov — skemë e shfuqizuar nga GJDBE (Schrems II, C-311/18, 16.07.2020) dhe pa asnjë lidhje me të drejtën sllovake.',
    },
  },
  {
    vend: 'SK', fusha: 'labeling', gjej: 'Manufacturers are advised to take note',
    patch: {
      legalAct: 'Ligji nr. 270/1995 Coll. për gjuhën shtetërore, i lidhur me Ligjin nr. 250/2007 Coll. për mbrojtjen e konsumatorit',
      sourceUrl: 'https://www.slov-lex.sk/pravne-predpisy/SK/ZZ/1995/270/',
      authority: 'Slov-Lex — Republika Sllovake',
      jurisdiction: 'Sllovaki', category: 'LEGAL', confidence: 'MEDIUM', riskIfWrong: 'MEDIUM',
      humanVerification: true, publicationStatus: 'PUBLISH WITH WARNING', checkedAt: SOT,
      note: 'Referimi te Ligji nr. 250/2007 për mbrojtjen e konsumatorit kërkon konfirmim me nen.',
      correction: 'Burimi i mëparshëm ishte privacyshield.gov (skemë e shfuqizuar).',
    },
  },
  {
    vend: 'SK', fusha: 'sectorRules', gjej: 'CE mark mandatory for machinery',
    patch: {
      legalAct: 'Rregullorja (KE) nr. 765/2008, Shtojca II, e lidhur me direktivat sektoriale të harmonizimit',
      sourceUrl: 'https://single-market-economy.ec.europa.eu/single-market/goods/ce-marking/manufacturers_en',
      legalActUrl: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32008R0765',
      authority: 'Komisioni Europian — Tregu i Brendshëm',
      jurisdiction: 'BE', category: 'LEGAL', confidence: 'HIGH', riskIfWrong: 'HIGH',
      humanVerification: false, publicationStatus: 'PUBLISH', checkedAt: SOT,
      correction: 'Burimi i mëparshëm ishte privacyshield.gov (skemë e shfuqizuar).',
    },
  },

  // ── SLLOVENI: madhësia e shenjës CE, nga Wikipedia ─────────────────────────
  {
    vend: 'SI', fusha: 'labeling', gjej: 'size of the CE marking',
    tekstIRi: {
      en: 'Where the applicable harmonisation legislation does not impose specific dimensions, the CE marking must be at least 5 mm high. If it is reduced or enlarged, the proportions of the official graduated drawing must be respected.',
      sq: 'Kur legjislacioni i harmonizuar i zbatueshëm nuk cakton përmasa të veçanta, shenja CE duhet të jetë së paku 5 mm e lartë. Nëse zvogëlohet ose zmadhohet, duhen respektuar përpjesëtimet e vizatimit zyrtar të graduar.',
    },
    patch: {
      legalAct: 'Rregullorja (KE) nr. 765/2008, Shtojca II',
      sourceUrl: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32008R0765',
      sourceExcerpt: 'Where specific legislation does not impose specific dimensions, the CE marking shall be at least 5 mm high.',
      excerptSource: 'Rregullorja (KE) nr. 765/2008, Shtojca II, marrë më 2026-08-26',
      authority: 'Parlamenti Europian dhe Këshilli',
      jurisdiction: 'BE', category: 'LEGAL', confidence: 'HIGH', riskIfWrong: 'MEDIUM',
      humanVerification: false, publicationStatus: 'PUBLISH', checkedAt: SOT,
      correction: 'Burimi i mëparshëm ishte Wikipedia. Teksti u plotësua me kushtëzimin ligjor '
        + '«kur legjislacioni i posaçëm nuk cakton përmasa», i cili mungonte dhe e bënte rregullin absolut pa qenë i tillë.',
    },
  },

  // ── CEFTA: dy gabime faktike dhe një burim i gabuar ────────────────────────
  {
    vend: 'BG', fusha: 'tradeAgreements', gjej: 'Central European Free Trade Agreement',
    tekstIRi: {
      en: 'Bulgaria is NOT a CEFTA party. Bulgaria withdrew from CEFTA on its accession to the European Union on 1 January 2007. Kosovo–Bulgaria trade is governed by the Stabilisation and Association Agreement between the European Union and Kosovo.',
      sq: 'Bullgaria NUK është palë e CEFTA-s. Bullgaria u tërhoq nga CEFTA me anëtarësimin në Bashkimin Europian më 1 janar 2007. Tregtia Kosovë–Bullgari rregullohet nga Marrëveshja e Stabilizim-Asociimit mes Bashkimit Europian dhe Kosovës.',
    },
    patch: {
      legalAct: 'Marrëveshja e Stabilizim-Asociimit BE–Kosovë',
      sourceUrl: 'https://cefta.int/about/',
      sourceExcerpt: 'Building on the original CEFTA, substantially enlarged and modern CEFTA was signed in December 2006 by Albania, Bosnia and Herzegovina, Bulgaria, Croatia, North Macedonia, Moldova, Montenegro, Romania, Serbia and UNMIK/Kosovo. Romania, Bulgaria and Croatia have withdrawn from CEFTA on their accession to the EU.',
      excerptSource: 'Sekretariati i CEFTA-s, faqja «About», marrë më 2026-08-26',
      legalActUrl: 'https://neighbourhood-enlargement.ec.europa.eu/enlargement-policy/kosovo_en',
      authority: 'Sekretariati i CEFTA-s', jurisdiction: 'Bullgari', category: 'LEGAL',
      confidence: 'HIGH', riskIfWrong: 'HIGH', humanVerification: false,
      publicationStatus: 'PUBLISH', checkedAt: SOT,
      correction: 'GABIM FAKTIK I NDREQUR: Bullgaria paraqitej si palë e CEFTA-s. Nuk është që nga 1 janari 2007. '
        + 'Burimi i mëparshëm ishte Wikipedia.',
      sourceNote: 'cefta.int shërben me zinxhir TLS të paplotë (mungon certifikata e ndërmjetme); shfletuesit e hapin normalisht.',
    },
  },
  {
    vend: 'CH', fusha: 'tradeAgreements', gjej: 'CEFTA',
    tekstIRi: {
      en: 'Switzerland is NOT a CEFTA party. Switzerland is a member of EFTA. The EFTA–Kosovo Free Trade Agreement was signed on 22 January 2025 in Davos; as of the date of this check its entry into force is still pending ratification. Until it enters into force, Kosovo-origin goods enter Switzerland under Switzerland\'s general tariff.',
      sq: 'Zvicra NUK është palë e CEFTA-s. Zvicra është anëtare e EFTA-s. Marrëveshja e Tregtisë së Lirë EFTA–Kosovë u nënshkrua më 22 janar 2025 në Davos; deri në datën e këtij kontrolli hyrja e saj në fuqi pret ende ratifikimin. Deri atëherë, mallrat me origjinë nga Kosova hyjnë në Zvicër sipas tarifës së përgjithshme zvicerane.',
    },
    patch: {
      legalAct: 'Marrëveshja e Tregtisë së Lirë EFTA–Kosovë (nënshkruar 22.01.2025, ende jo në fuqi)',
      sourceUrl: 'https://www.efta.int/trade-relations/free-trade-network/kosovo',
      authority: 'Sekretariati i EFTA-s', jurisdiction: 'Zvicër', category: 'LEGAL',
      confidence: 'MEDIUM', riskIfWrong: 'HIGH', humanVerification: true,
      publicationStatus: 'PUBLISH WITH WARNING', checkedAt: SOT,
      note: 'Statusi i hyrjes në fuqi duhet rikontrolluar te efta.int para çdo këshillimi për tarifa preferenciale. '
        + 'Nëse marrëveshja hyn në fuqi, ky zë ndryshon plotësisht.',
      correction: 'GABIM FAKTIK I NDREQUR: Zvicra paraqitej si palë e CEFTA-s. Nuk ka qenë kurrë. Burimi ishte Wikipedia.',
    },
  },
  {
    vend: 'MD', fusha: 'tradeAgreements', gjej: 'Central European Free Trade Agreement',
    patch: {
      legalAct: 'Marrëveshja CEFTA 2006',
      sourceUrl: 'https://cefta.int/legal-documents/',
      sourceExcerpt: 'Building on the original CEFTA, substantially enlarged and modern CEFTA was signed in December 2006 by Albania, Bosnia and Herzegovina, Bulgaria, Croatia, North Macedonia, Moldova, Montenegro, Romania, Serbia and UNMIK/Kosovo.',
      excerptSource: 'Sekretariati i CEFTA-s, faqja «About», marrë më 2026-08-26',
      authority: 'Sekretariati i CEFTA-s', jurisdiction: 'Moldavi', category: 'LEGAL',
      confidence: 'HIGH', riskIfWrong: 'HIGH', humanVerification: false,
      publicationStatus: 'PUBLISH', checkedAt: SOT,
      correction: 'Fakti ishte i saktë; burimi ishte Wikipedia dhe u zëvendësua me Sekretariatin e CEFTA-s.',
      sourceNote: 'cefta.int shërben me zinxhir TLS të paplotë; shfletuesit e hapin normalisht.',
    },
  },

  // ── IZRAEL: dy zëra që s'janë marrëveshje tregtare ──────────────────────────
  {
    vend: 'IL', fusha: 'tradeAgreements', gjej: 'Diplomatic Relations',
    tekstIRi: {
      en: 'Kosovo and Israel established diplomatic relations in 2021. This is a diplomatic milestone, not a trade agreement: it grants no tariff preference. No free trade agreement between Kosovo and Israel is recorded, so Kosovo-origin goods enter Israel under Israel\'s general tariff.',
      sq: 'Kosova dhe Izraeli vendosën marrëdhënie diplomatike në vitin 2021. Ky është hap diplomatik, jo marrëveshje tregtare: nuk jep asnjë lehtësi tarifore. Nuk figuron marrëveshje tregtie të lirë mes Kosovës dhe Izraelit, prandaj mallrat me origjinë nga Kosova hyjnë në Izrael sipas tarifës së përgjithshme izraelite.',
    },
    patch: {
      mandatory: false, category: 'DIPLOMATIC',
      sourceUrl: 'https://www.mfa-ks.net/',
      authority: 'Ministria e Punëve të Jashtme dhe Diasporës e Republikës së Kosovës',
      jurisdiction: 'Izrael', confidence: 'MEDIUM', riskIfWrong: 'HIGH',
      humanVerification: true, publicationStatus: 'PUBLISH WITH WARNING', checkedAt: SOT,
      note: 'Mungesa e një marrëveshjeje tregtare është pohim negativ dhe duhet konfirmuar me Doganën e Kosovës '
        + 'ose Ministrinë e Industrisë përpara se të përdoret për llogaritje tarifore.',
      correction: 'Burimi i mëparshëm ishte Wikipedia. Zëri ishte radhitur si marrëveshje tregtare, çka linte '
        + 'përshtypjen e gabuar se sjell lehtësi tarifore.',
    },
  },
  {
    vend: 'IL', fusha: 'tradeAgreements', gjej: 'Visa-Free Travel',
    tekstIRi: {
      en: 'Visa-free travel arrangement (2024). This concerns movement of persons, not goods: it grants no customs or tariff preference for exports.',
      sq: 'Marrëveshje për udhëtim pa viza (2024). Kjo prek lëvizjen e personave, jo mallrat: nuk jep asnjë lehtësi doganore apo tarifore për eksportin.',
    },
    patch: {
      mandatory: false, category: 'DIPLOMATIC',
      sourceUrl: 'https://www.mfa-ks.net/',
      authority: 'Ministria e Punëve të Jashtme dhe Diasporës e Republikës së Kosovës',
      jurisdiction: 'Izrael', confidence: 'MEDIUM', riskIfWrong: 'LOW',
      humanVerification: true, publicationStatus: 'PUBLISH WITH WARNING', checkedAt: SOT,
      correction: 'Burimi i mëparshëm ishte Wikipedia. Zëri ishte radhitur si marrëveshje tregtare.',
    },
  },

  // ── EBA: dy pretendime nga një faqe e pastrehë në Vercel ────────────────────
  {
    vend: 'AE', fusha: 'sectorRules', gjej: 'Food products must be registered',
    patch: {
      sourceUrl: 'https://www.moiat.gov.ae/en',
      authority: 'Ministria e Industrisë dhe Teknologjisë së Avancuar, Emiratet e Bashkuara Arabe',
      jurisdiction: 'EBA', category: 'LEGAL', confidence: 'LOW', riskIfWrong: 'HIGH',
      humanVerification: true, publicationStatus: 'HUMAN REVIEW', checkedAt: SOT,
      note: 'Rregulli mbetet i pakonfirmuar. Regjistrimi i ushqimit në EBA administrohet nga autoritete '
        + 'lokale të emirateve (p.sh. Dubai Municipality, ADAFSA në Abu Dabi); autoriteti i saktë dhe '
        + 'procedura duhen verifikuar para se ky rregull të paraqitet si i detyrueshëm.',
      correction: 'Burimi i mëparshëm ishte një faqe pa botues të identifikueshëm, e strehuar në Vercel.',
    },
  },
  {
    vend: 'AE', fusha: 'sectorRules', gjej: 'Perfumes and aromatic products',
    patch: {
      sourceUrl: 'https://www.moiat.gov.ae/en',
      authority: 'Ministria e Industrisë dhe Teknologjisë së Avancuar, Emiratet e Bashkuara Arabe',
      jurisdiction: 'EBA', category: 'LEGAL', confidence: 'LOW', riskIfWrong: 'MEDIUM',
      humanVerification: true, publicationStatus: 'HUMAN REVIEW', checkedAt: SOT,
      note: 'Standardi i saktë (seria GSO/UAE.S) duhet identifikuar para publikimit si i detyrueshëm.',
      correction: 'Burimi i mëparshëm ishte një faqe pa botues të identifikueshëm, e strehuar në Vercel.',
    },
  },

  // ── INDI: Letër Kredie e paraqitur si dokument i detyrueshëm ───────────────
  {
    vend: 'IN', fusha: 'requiredDocs', gjej: 'Letter of Credit',
    patch: {
      mandatory: false, category: 'COMMERCIAL',
      sourceUrl: null,
      authority: null,
      jurisdiction: 'Indi', confidence: 'HIGH', riskIfWrong: 'LOW',
      humanVerification: false, publicationStatus: 'PUBLISH WITH WARNING', checkedAt: SOT,
      note: 'Letra e kredisë është instrument pagese që bihet dakord mes shitësit dhe blerësit, '
        + 'jo dokument i kërkuar nga dogana. Nuk ka bazë ligjore sepse nuk është detyrim ligjor.',
      correction: 'GABIM I NDREQUR: ishte shënuar si dokument i detyrueshëm dhe i atribuohej privacyshield.gov, '
        + 'skemë e shfuqizuar nga GJDBE (Schrems II) pa lidhje me temën.',
    },
  },

  // ── ISLANDË: rregullorja për OMGJ-të ───────────────────────────────────────
  {
    vend: 'IS', fusha: 'labeling', gjej: 'Genetically Modified Organisms',
    patch: {
      legalAct: 'Rregullorja (KE) nr. 1829/2003 dhe Rregullorja (KE) nr. 1830/2003, të inkorporuara në '
        + 'legjislacionin islandez përmes Marrëveshjes për Zonën Ekonomike Europiane',
      sourceUrl: 'https://www.mast.is/',
      authority: 'MAST — Autoriteti Islandez i Ushqimit dhe Veterinarisë',
      jurisdiction: 'Islandë', category: 'LEGAL', confidence: 'MEDIUM', riskIfWrong: 'HIGH',
      humanVerification: true, publicationStatus: 'PUBLISH WITH WARNING', checkedAt: SOT,
      note: 'Numri i rregullores islandeze zbatuese dhe data e saktë kërkojnë konfirmim te MAST ose te '
        + 'Stjórnartíðindi (gazeta zyrtare). Baza e BE-së përmes MEE-së është e sigurt.',
      correction: 'Burimi i mëparshëm ishte privacyshield.gov, skemë e shfuqizuar nga GJDBE (Schrems II), '
        + 'pa asnjë lidhje me OMGJ-të apo me Islandën.',
    },
  },
]

// ── zbatimi ────────────────────────────────────────────────────────────────
function tekstiI(o: any): string {
  const t = o?.rule ?? o?.name ?? o?.requirement ?? o?.title ?? o?.benefit
  if (!t) return ''
  return typeof t === 'string' ? t : (t.en || t.sq || t.de || '')
}

function zbato(o: any, gjej: string, r: Rregullim, stat: { n: number }): boolean {
  if (Array.isArray(o)) return o.some((v) => zbato(v, gjej, r, stat))
  if (!o || typeof o !== 'object') return false
  if (tekstiI(o).toLowerCase().includes(gjej.toLowerCase())) {
    if (r.tekstIRi) {
      const çelësi = ['rule', 'name', 'requirement', 'title', 'benefit'].find((k) => k in o)
      if (çelësi) o[çelësi] = r.tekstIRi
    }
    Object.assign(o, r.patch)
    stat.n++
    return true
  }
  let gjetur = false
  for (const v of Object.values(o)) if (v && typeof v === 'object') gjetur = zbato(v, gjej, r, stat) || gjetur
  return gjetur
}

async function main() {
  let ndryshuar = 0, munguan = 0
  const perVend: Record<string, any> = {}

  for (const r of RREGULLIMET) {
    if (!perVend[r.vend]) {
      const g = await prisma.exportGuide.findFirst({
        where: { countryCode: r.vend, deletedAt: null },
        select: { id: true, labeling: true, sectorRules: true, tradeAgreements: true,
          requiredDocs: true, certifications: true, customs: true },
      })
      if (!g) { console.log('[MUNGON UDHËZUESI] ' + r.vend); munguan++; continue }
      perVend[r.vend] = JSON.parse(JSON.stringify(g))
    }
    const g = perVend[r.vend]
    const stat = { n: 0 }
    zbato(g[r.fusha], r.gjej, r, stat)
    if (stat.n === 0) { console.log('[NUK U GJET] ' + r.vend + '/' + r.fusha + ' « ' + r.gjej + ' »'); munguan++; continue }
    ndryshuar += stat.n
    console.log('[OK ' + r.vend + '] ' + r.gjej)
    if (r.patch.correction) console.log('     → ' + String(r.patch.correction).slice(0, 130))
  }

  if (!DRY) {
    for (const [vend, g] of Object.entries(perVend)) {
      const { id, ...te } = g as any
      await prisma.exportGuide.update({ where: { id }, data: te })
      console.log('  ruajtur: ' + vend)
    }
  }
  console.log('\n' + (DRY ? '[THATË] ' : '') + 'pretendime të ndrequra: ' + ndryshuar + ' | pa u gjetur: ' + munguan)
  await prisma.$disconnect()
}
main()
