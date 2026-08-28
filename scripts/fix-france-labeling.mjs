// Rishkrim i 8 rregullave te etiketimit per Francen sipas protokollit te verifikimit.
//
// PARA: burimet ishin nje blog rrobaqepesie, dy konsulenca, nje shites softueri tatimor
// dhe trade.gov. Tetë rregulla te shenuara "e detyrueshme".
//
// PAS: cdo rregull mban aktin, nenin, URL-ne, citimin kur ekziston, kategorine me 5 nivele,
// besueshmerine, rrezikun, jurisdiksionin, daten e kontrollit dhe statusin e publikimit.
//
// GABIM FAKTIK I GJETUR: neni i Triman-it ishte shkruar L541-9-1; i sakti eshte L541-9-3,
// i krijuar nga Ligji AGEC nr. 2020-105 i 10 shkurtit 2020, neni 17.
//
//   node scripts/fix-france-labeling.mjs --dry
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
const DRY = process.argv.includes('--dry')
const SOT = '2026-08-26'

// URL te verifikuara me curl me 2026-08-26 (200) ose te deshmuara si zyrtare (bot-bllokim).
const U = {
  FIC_EU: 'https://food.ec.europa.eu/food-safety/labelling-and-nutrition/food-information-consumers-legislation_en', // 200
  FIC_ELI: 'https://eur-lex.europa.eu/eli/reg/2011/1169/2018-01-01',   // ELI zyrtar i cituar nga vete Komisioni
  TEXTIL: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32011R1007',
  KOZMET: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32009R1223',
  GPSR: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32023R0988',
  METRIK: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:31980L0181',
  TRIMAN_FAQ: 'https://www.ecologie.gouv.fr/sites/default/files/documents/FAQ%20Triman%20et%20frises.pdf', // 200
  ECOLOGIE: 'https://www.ecologie.gouv.fr', // 200
  DGCCRF: 'https://www.economie.gouv.fr/dgccrf',
}

const RREGULLAT = [
  {
    match: 'easily understandable, written in French',
    rule: {
      en: 'All labelling, instructions for use and warranty information for products sold in France must be in French. Text must be legible and indelible.',
      sq: 'Çdo etiketim, udhëzim përdorimi dhe informacion garancie për produktet e shitura në Francë duhet të jetë në frëngjisht. Teksti duhet të jetë i lexueshëm dhe i pashlyeshëm.',
    },
    kategoria: 'LEGAL',
    akti: 'Kodi francez i konsumit (Code de la consommation); parimi i gjuhës frënge rrjedh nga Ligji nr. 94-665 i 4 gushtit 1994 (Ligji Toubon)',
    juridiksioni: 'Francë',
    autoriteti: 'DGCCRF — Drejtoria e Përgjithshme për Konkurrencën, Konsumin dhe Luftimin e Mashtrimit',
    url: U.DGCCRF,
    citim: null,
    besueshmeria: 'MEDIUM',
    rreziku: 'MEDIUM',
    verifikimNjerezor: true,
    status: 'PUBLISH WITH WARNING',
    shenim: 'Detyrimi i gjuhës frënge është i njohur dhe i zbatuar, por neni i saktë i Kodit të konsumit nuk u verifikua nga burimi parësor. Kërkon konfirmim para se të citohet me nen.',
  },
  {
    match: 'Food products must indicate',
    rule: {
      en: 'Prepacked food placed on the EU market must carry the mandatory particulars listed in Article 9 of Regulation (EU) No 1169/2011: name of the food, list of ingredients, allergens, net quantity, date of minimum durability or use-by date, storage conditions, name and address of the food business operator, country of origin where required, instructions for use where needed, alcoholic strength where applicable, and a nutrition declaration.',
      sq: 'Ushqimi i paketuar që vendoset në tregun e BE-së duhet të mbajë të dhënat e detyrueshme të nenit 9 të Rregullores (BE) nr. 1169/2011: emrin e ushqimit, listën e përbërësve, alergjenët, sasinë neto, datën e qëndrueshmërisë minimale ose datën e përdorimit, kushtet e ruajtjes, emrin dhe adresën e operatorit, vendin e origjinës kur kërkohet, udhëzimet e përdorimit, fuqinë alkoolike kur aplikohet, dhe deklaratën ushqyese.',
    },
    kategoria: 'LEGAL',
    akti: 'Rregullorja (BE) nr. 1169/2011 për informimin e konsumatorit për ushqimin (FIC), neni 9',
    juridiksioni: 'BE (e zbatueshme drejtpërdrejt në Francë)',
    autoriteti: 'Komisioni Europian — Drejtoria e Përgjithshme për Shëndetin dhe Sigurinë Ushqimore',
    url: U.FIC_EU,
    urlAkti: U.FIC_ELI,
    citim: 'Regulation (EU) No 1169/2011 on the provision of food information to consumers (FIC Regulation) … entered into application on 13 December 2014. It provides in particular clearer and harmonised presentation of allergens (e.g. soy, nuts, gluten, and lactose) for prepacked foods.',
    citimBurimi: 'Komisioni Europian, faqja zyrtare e legjislacionit FIC, marrë më 2026-08-26',
    besueshmeria: 'HIGH',
    rreziku: 'HIGH',
    verifikimNjerezor: false,
    status: 'PUBLISH',
  },
  {
    match: 'Textile products must indicate the exact fibre',
    rule: {
      en: 'Textile products must be labelled with their full fibre composition. Fibre names and composition labelling are harmonised across the EU. In France the label must be in French.',
      sq: 'Produktet tekstile duhet të etiketohen me përbërjen e plotë të fibrave. Emrat e fibrave dhe etiketimi i përbërjes janë të harmonizuara në BE. Në Francë etiketa duhet të jetë në frëngjisht.',
    },
    kategoria: 'LEGAL',
    akti: 'Rregullorja (BE) nr. 1007/2011 për emrat e fibrave tekstile dhe etiketimin e përbërjes',
    juridiksioni: 'BE (e zbatueshme drejtpërdrejt në Francë)',
    autoriteti: 'Komisioni Europian; zbatimi në Francë nga DGCCRF',
    url: U.TEXTIL,
    citim: null,
    besueshmeria: 'HIGH',
    rreziku: 'MEDIUM',
    verifikimNjerezor: false,
    status: 'PUBLISH WITH WARNING',
    shenim: 'Akti është i saktë dhe i zbatueshëm drejtpërdrejt. Citimi tekstual nuk është ruajtur ende.',
  },
  {
    match: 'Triman logo, under France',
    rule: {
      en: 'Textiles, household linen and footwear sold in France must display the Triman marking together with sorting instructions, under Article L541-9-3 of the French Environment Code, introduced by Article 17 of the AGEC Law (Law No. 2020-105 of 10 February 2020).',
      sq: 'Tekstilet, liri shtëpiak dhe këpucët e shitura në Francë duhet të mbajnë shenjën Triman së bashku me udhëzimet e klasifikimit, sipas nenit L541-9-3 të Kodit francez të mjedisit, të futur me nenin 17 të Ligjit AGEC (Ligji nr. 2020-105 i 10 shkurtit 2020).',
    },
    kategoria: 'LEGAL',
    akti: 'Kodi francez i mjedisit, neni L541-9-3, i futur me Ligjin AGEC nr. 2020-105 të 10 shkurtit 2020, neni 17',
    juridiksioni: 'Francë',
    autoriteti: 'Ministria franceze e Tranzicionit Ekologjik',
    url: U.TRIMAN_FAQ,
    citim: null,
    besueshmeria: 'MEDIUM',
    rreziku: 'HIGH',
    verifikimNjerezor: true,
    status: 'PUBLISH WITH WARNING',
    shenim: 'KUJDES: Komisioni Europian e ka referuar Francën në Gjykatën e Drejtësisë së BE-së lidhur me detyrimin e logos Triman. Statusi ligjor mund të ndryshojë. Data e hyrjes në fuqi për tekstilet kërkon konfirmim; burimet tregojnë 25 gusht 2023 për elementet dekorative tekstile.',
    korrigjim: 'Data «shkurt 2023» në versionin e mëparshëm nuk u konfirmua.',
  },
  {
    match: 'Cosmetic products must bear the INCI',
    rule: {
      en: 'Cosmetic products placed on the EU market must carry the particulars required by Article 19 of Regulation (EC) No 1223/2009: name and address of the Responsible Person, nominal content, date of minimum durability or period-after-opening symbol, precautions for use, batch number, function of the product, and the list of ingredients using INCI nomenclature.',
      sq: 'Produktet kozmetike që vendosen në tregun e BE-së duhet të mbajnë të dhënat e nenit 19 të Rregullores (KE) nr. 1223/2009: emrin dhe adresën e Personit Përgjegjës, përmbajtjen nominale, datën e qëndrueshmërisë minimale ose simbolin e periudhës pas hapjes, masat paraprake, numrin e serisë, funksionin e produktit dhe listën e përbërësve sipas nomenklaturës INCI.',
    },
    kategoria: 'LEGAL',
    akti: 'Rregullorja (KE) nr. 1223/2009 për produktet kozmetike, neni 19',
    juridiksioni: 'BE (e zbatueshme drejtpërdrejt në Francë)',
    autoriteti: 'Komisioni Europian; zbatimi në Francë nga ANSM dhe DGCCRF',
    url: U.KOZMET,
    citim: null,
    besueshmeria: 'HIGH',
    rreziku: 'HIGH',
    verifikimNjerezor: false,
    status: 'PUBLISH WITH WARNING',
    shenim: 'Akti dhe neni janë të saktë. Citimi tekstual nuk është ruajtur ende.',
  },
  {
    match: 'Most consumer products and their packaging',
    rule: {
      en: 'Consumer products and their packaging placed on the French market must display the Triman marking and sorting information, under Article L541-9-3 of the French Environment Code. The obligation does not apply to business-to-business transactions.',
      sq: 'Produktet e konsumit dhe paketimi i tyre që vendosen në tregun francez duhet të mbajnë shenjën Triman dhe informacionin e klasifikimit, sipas nenit L541-9-3 të Kodit francez të mjedisit. Detyrimi nuk zbatohet për transaksionet mes bizneseve.',
    },
    kategoria: 'LEGAL',
    akti: 'Kodi francez i mjedisit, neni L541-9-3 (Ligji AGEC nr. 2020-105)',
    juridiksioni: 'Francë',
    autoriteti: 'Ministria franceze e Tranzicionit Ekologjik',
    url: U.TRIMAN_FAQ,
    citim: null,
    besueshmeria: 'MEDIUM',
    rreziku: 'HIGH',
    verifikimNjerezor: true,
    status: 'PUBLISH WITH WARNING',
    shenim: 'KUJDES: procedurë e hapur e Komisionit Europian kundër Francës në GJDBE lidhur me Triman-in. Data e hyrjes në fuqi kërkon konfirmim.',
    korrigjim: 'GABIM I NDREQUR: versioni i mëparshëm citonte nenin L541-9-1. Neni i saktë është L541-9-3.',
  },
  {
    match: 'name and address of the manufacturer',
    rule: {
      en: 'The name, registered trade name or trade mark and the postal and electronic address of the manufacturer must appear on the product or its packaging, together with the details of the responsible person established in the EU, under Regulation (EU) 2023/988 on general product safety.',
      sq: 'Emri, emri tregtar i regjistruar ose marka, si dhe adresa postare dhe elektronike e prodhuesit duhet të shfaqen në produkt ose në paketimin e tij, bashkë me të dhënat e personit përgjegjës të vendosur në BE, sipas Rregullores (BE) 2023/988 për sigurinë e përgjithshme të produkteve.',
    },
    kategoria: 'LEGAL',
    akti: 'Rregullorja (BE) 2023/988 për sigurinë e përgjithshme të produkteve (GPSR)',
    juridiksioni: 'BE (e zbatueshme drejtpërdrejt në Francë)',
    autoriteti: 'Komisioni Europian',
    url: U.GPSR,
    citim: null,
    besueshmeria: 'HIGH',
    rreziku: 'HIGH',
    verifikimNjerezor: true,
    status: 'PUBLISH WITH WARNING',
    shenim: 'GPSR zëvendësoi Direktivën e mëparshme për sigurinë e përgjithshme të produkteve. Neni i saktë dhe data e zbatimit kërkojnë konfirmim para citimit me nen.',
  },
  {
    match: 'Metric units are mandatory',
    rule: {
      en: 'Quantities must be expressed in metric units (SI). Net quantity is given in grams or kilograms for solids and millilitres or litres for liquids.',
      sq: 'Sasitë duhet të shprehen në njësi metrike (SI). Sasia neto jepet në gramë ose kilogramë për të ngurtat dhe në mililitra ose litra për të lëngshmet.',
    },
    kategoria: 'LEGAL',
    akti: 'Direktiva 80/181/KEE për njësitë e matjes',
    juridiksioni: 'BE (e transpozuar në Francë)',
    autoriteti: 'Komisioni Europian',
    url: U.METRIK,
    citim: null,
    besueshmeria: 'HIGH',
    rreziku: 'LOW',
    verifikimNjerezor: false,
    status: 'PUBLISH WITH WARNING',
    shenim: 'Akti është i saktë. Citimi tekstual nuk është ruajtur ende.',
  },
]

const norm = (s) => JSON.stringify(s || '').toLowerCase()

async function main() {
  const g = await prisma.exportGuide.findFirst({
    where: { countryCode: 'FR', deletedAt: null },
    select: { id: true, labeling: true },
  })
  if (!g) { console.log('FR nuk u gjet'); return }

  const lab = JSON.parse(JSON.stringify(g.labeling || {}))
  const rules = Array.isArray(lab.rules) ? lab.rules : []
  let ndryshuar = 0, pagjetur = 0

  for (const f of RREGULLAT) {
    const i = rules.findIndex((r) => norm(r?.rule).includes(f.match.toLowerCase()))
    if (i < 0) { pagjetur++; console.log('[MUNGON] ' + f.match.slice(0, 46)); continue }
    const para = rules[i].sourceUrl
    rules[i] = {
      rule: f.rule,
      mandatory: f.kategoria === 'LEGAL',
      // ── fushat e protokollit ──────────────────────────────────────────────
      category: f.kategoria,
      legalAct: f.akti,
      jurisdiction: f.juridiksioni,
      authority: f.autoriteti,
      sourceUrl: f.url,
      legalActUrl: f.urlAkti || null,
      sourceExcerpt: f.citim || null,
      excerptSource: f.citimBurimi || null,
      checkedAt: SOT,
      confidence: f.besueshmeria,
      riskIfWrong: f.rreziku,
      humanVerification: f.verifikimNjerezor,
      publicationStatus: f.status,
      note: f.shenim || null,
      correction: f.korrigjim || null,
    }
    ndryshuar++
    console.log('[OK] ' + f.match.slice(0, 40))
    console.log('     akti      : ' + f.akti.slice(0, 76))
    console.log('     kategoria : ' + f.kategoria + '  besueshm: ' + f.besueshmeria +
                '  rrezik: ' + f.rreziku + '  status: ' + f.status)
    console.log('     burimi    : ' + String(para).slice(0, 40) + ' -> ' + f.url.slice(0, 52))
    if (f.korrigjim) console.log('     KORRIGJIM : ' + f.korrigjim)
  }

  lab.rules = rules
  lab.methodology = 'Rregullat janë verifikuar sipas protokollit të verifikimit të burimeve. Çdo rregull mban aktin ligjor, jurisdiksionin, autoritetin, nivelin e besueshmërisë dhe statusin e publikimit.'
  lab.lastAudit = SOT

  if (!DRY) await prisma.exportGuide.update({ where: { id: g.id }, data: { labeling: lab } })
  console.log('\n' + (DRY ? '[THATE] ' : '') + 'ndryshuar: ' + ndryshuar + ', nuk u gjetën: ' + pagjetur)
}
main().finally(() => prisma.$disconnect())
