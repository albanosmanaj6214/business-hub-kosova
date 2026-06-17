// Enrich the 18 inline-written country guides with requiredDocs / certifications / labeling / contacts.
// Same shape Haiku-generated guides use, so the detail page renders the same sections.
// No paid API calls.

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const BASE_DOCS = (sourceUrl) => [
  {
    name: { sq: 'Faturë komerciale', en: 'Commercial invoice' },
    description: {
      sq: 'Fatura zyrtare e shitjes me palët, përshkrimin e mallit, sasinë, vlerën, kushtet Incoterms dhe afatin e pagesës. Minimum 3 kopje origjinale.',
      en: 'Official sales invoice with parties, goods description, quantity, value, Incoterms, payment terms. Min. 3 original copies.',
    },
    mandatory: true, issuedBy: 'Eksportuesi', sourceUrl,
  },
  {
    name: { sq: 'Packing list', en: 'Packing list' },
    description: { sq: 'Numri i kolive, pesha neto/bruto, dimensionet dhe përmbajtja për koli.', en: 'Number of packages, net/gross weight, dimensions and contents per package.' },
    mandatory: true, issuedBy: 'Eksportuesi', sourceUrl,
  },
  {
    name: { sq: 'Certifikatë origjine', en: 'Certificate of origin' },
    description: {
      sq: 'Certifikatë jo-preferenciale e lëshuar nga Oda Ekonomike e Kosovës. Vërteton vendin e prodhimit.',
      en: 'Non-preferential certificate issued by the Kosovo Chamber of Commerce. Proves country of origin.',
    },
    mandatory: true, issuedBy: 'Oda Ekonomike e Kosovës', sourceUrl: 'https://oek.org.kw',
  },
  {
    name: { sq: 'Deklaratë doganore eksporti (DAU/EX-A)', en: 'Customs export declaration (DAU/EX-A)' },
    description: { sq: 'Forma EX-A e plotësuar nga agjenti doganor në Kosovë.', en: 'EX-A form completed by the licensed customs broker in Kosovo.' },
    mandatory: true, issuedBy: 'Agjenti doganor', sourceUrl: 'https://dogana.rks-gov.net',
  },
  {
    name: { sq: 'Kontratë shitjeje ose porosi e konfirmuar', en: 'Sales contract or confirmed purchase order' },
    description: { sq: 'Kushtet komerciale, Incoterms 2020, pagesa, garancia, zgjidhja e mosmarrëveshjeve.', en: 'Commercial terms, Incoterms 2020, payment, warranty, dispute resolution.' },
    mandatory: true, issuedBy: 'Eksportuesi + blerësi', sourceUrl,
  },
  {
    name: { sq: 'Dokument transporti (CMR / B/L / AWB)', en: 'Transport document (CMR / B/L / AWB)' },
    description: { sq: 'CMR për transport rrugor, Bill of Lading për det, Air Waybill për ajror.', en: 'CMR for road, Bill of Lading for sea, Air Waybill for air.' },
    mandatory: true, issuedBy: 'Transportuesi', sourceUrl,
  },
  {
    name: { sq: 'Certifikatë sigurimi (kur Incoterms e kërkon)', en: 'Insurance certificate (when Incoterms requires)' },
    description: { sq: 'Certifikatë sigurimi për transport (CIF, CIP). Mbulim minimal 110% e vlerës CIF.', en: 'Cargo insurance certificate (CIF, CIP). Minimum cover 110% of CIF value.' },
    mandatory: false, issuedBy: 'Kompani sigurimi', sourceUrl,
  },
  {
    name: { sq: 'Certifikatë fitosanitare', en: 'Phytosanitary certificate' },
    description: { sq: 'I detyrueshëm për bimë, fruta, perime, drurë, mobilje druri me lëndë origjinale.', en: 'Required for plants, fruit, vegetables, wood, and wood furniture with raw material.' },
    mandatory: false, issuedBy: 'AVUK ose ARPK', sourceUrl,
  },
  {
    name: { sq: 'Certifikatë sanitare/shëndetësore', en: 'Sanitary/health certificate' },
    description: { sq: 'I detyrueshëm për ushqim, kafshë, produkte me origjinë shtazore.', en: 'Required for food, animals, products of animal origin.' },
    mandatory: false, issuedBy: 'AVUK', sourceUrl,
  },
  {
    name: { sq: 'Specifikim Incoterms 2020', en: 'Incoterms 2020 specification' },
    description: { sq: 'Cakton kush paguan transportin, sigurimin dhe doganat. Shkruhet në faturë + kontratë.', en: 'Determines who pays transport, insurance, customs. Written on invoice + contract.' },
    mandatory: true, issuedBy: 'Eksportuesi + blerësi', sourceUrl,
  },
]

const C = {
  CA: {
    extraDocs: [
      { name: { sq: 'CFIA Safe Food License', en: 'CFIA Safe Food License' }, description: { sq: 'Licencë SFC për çdo importues ushqimi në Kanada. Pa licencë, dërgesa kthehet.', en: 'SFC licence required for every food importer in Canada. Without it, shipment is refused.' }, mandatory: true, issuedBy: 'Canadian Food Inspection Agency (CFIA)', sourceUrl: 'https://inspection.canada.ca/en' },
      { name: { sq: 'Customs Broker Authorisation', en: 'Customs Broker Authorisation' }, description: { sq: 'Mbi 3,300 CAD vlerë → Broker i licensuar i obliguar.', en: 'Above CAD 3,300 → Licensed Broker mandatory.' }, mandatory: true, issuedBy: 'CBSA-licensed broker', sourceUrl: 'https://www.cbsa-asfc.gc.ca' },
    ],
    certifications: [
      { name: 'CFIA Food Safety', appliesTo: ['Ushqim dhe pije'], description: { sq: 'Standardet e CFIA për ushqim të importuar.', en: 'CFIA food safety standards for imported food.' }, mandatory: true, authority: 'CFIA', sourceUrl: 'https://inspection.canada.ca' },
      { name: 'CSA Marking', appliesTo: ['Metale dhe makineri'], description: { sq: 'Standardet CSA për elektrike, lodra, makineri.', en: 'CSA standards for electrical, toys, machinery.' }, mandatory: true, authority: 'CSA Group', sourceUrl: 'https://www.csagroup.org' },
      { name: 'CITES Permit', appliesTo: ['Druri dhe mobilje'], description: { sq: 'I detyrueshëm për dru nga specie të mbrojtura.', en: 'Required for wood from protected species.' }, mandatory: false, authority: 'Environment Canada', sourceUrl: 'https://www.canada.ca/en/environment-climate-change.html' },
    ],
    labelingLanguages: ['Anglisht', 'Frëngjisht'],
    labelingRules: [
      { rule: { sq: 'Etiketimi i ushqimit duhet të jetë dygjuhësh anglisht-frëngjisht.', en: 'Food labelling must be bilingual English-French.' }, mandatory: true, sourceUrl: 'https://inspection.canada.ca/en/food-labels' },
      { rule: { sq: 'Vendi i origjinës "Product of Kosovo" duhet të shfaqet qartë.', en: 'Country of origin "Product of Kosovo" must be clearly shown.' }, mandatory: true, sourceUrl: 'https://www.cbsa-asfc.gc.ca' },
      { rule: { sq: 'Sasia neto në njësi metrike + imperial (g/oz, mL/fl oz).', en: 'Net quantity in metric + imperial (g/oz, mL/fl oz).' }, mandatory: true, sourceUrl: 'https://inspection.canada.ca' },
    ],
    contacts: [
      { role: 'Ambasada e Kosovës', name: 'Embassy of Kosovo in Ottawa', address: '130 Albert Street, Suite 1404, Ottawa, ON K1P 5G4', phone: '+1 613 569 2828', email: 'embassy.canada@rks-gov.net', url: 'https://www.ambasada-ks.net/canada' },
      { role: 'Doganat (Help Desk)', name: 'CBSA Border Information Service', address: '—', phone: '1-800-461-9999', email: '', url: 'https://www.cbsa-asfc.gc.ca/contact/bis-sif-eng.html' },
    ],
  },
  AU: {
    extraDocs: [
      { name: { sq: 'Biosecurity Import Permit (DAFF)', en: 'Biosecurity Import Permit (DAFF)' }, description: { sq: 'I detyrueshëm për ushqim, dru, bimë, kafshë. Aplikim para dërgesës.', en: 'Required for food, wood, plants, animals. Apply before shipment.' }, mandatory: true, issuedBy: 'Department of Agriculture, Fisheries and Forestry (DAFF)', sourceUrl: 'https://www.agriculture.gov.au/biosecurity-trade' },
      { name: { sq: 'ISPM 15 Treatment for Wood Packaging', en: 'ISPM 15 Treatment for Wood Packaging' }, description: { sq: 'Trajtim termik + stampë ISPM 15 për paletet, kuti druri.', en: 'Heat treatment + ISPM 15 stamp for pallets, wood crates.' }, mandatory: true, issuedBy: 'Operator i autorizuar trajtimi', sourceUrl: 'https://www.agriculture.gov.au' },
    ],
    certifications: [
      { name: 'FSANZ Food Standards', appliesTo: ['Ushqim dhe pije'], description: { sq: 'Standardet Food Standards Australia New Zealand për ushqim/pije.', en: 'Food Standards Australia New Zealand standards for food/beverages.' }, mandatory: true, authority: 'FSANZ', sourceUrl: 'https://www.foodstandards.gov.au' },
      { name: 'RCM Mark', appliesTo: ['Metale dhe makineri'], description: { sq: 'Regulatory Compliance Mark për pajisje elektrike/elektronike.', en: 'Regulatory Compliance Mark for electrical/electronic equipment.' }, mandatory: true, authority: 'ACMA', sourceUrl: 'https://www.acma.gov.au' },
      { name: 'AS/NZS Standards', appliesTo: ['Druri dhe mobilje', 'Metale dhe makineri'], description: { sq: 'Standardet Australian/NZ për mobilje, materiale ndërtimi.', en: 'Australian/NZ standards for furniture, building materials.' }, mandatory: false, authority: 'Standards Australia', sourceUrl: 'https://www.standards.org.au' },
    ],
    labelingLanguages: ['Anglisht'],
    labelingRules: [
      { rule: { sq: 'Origjina e plotë: "Made in Kosovo" me yll/asterisk për tregues përbërjeje.', en: 'Full origin: "Made in Kosovo" with asterisk for ingredient breakdown.' }, mandatory: true, sourceUrl: 'https://www.accc.gov.au' },
      { rule: { sq: 'Etiketimi ushqimor sipas Country of Origin Food Labelling Standard 2016.', en: 'Food labelling per Country of Origin Food Labelling Standard 2016.' }, mandatory: true, sourceUrl: 'https://www.industry.gov.au/funding-and-incentives/country-origin-food-labelling' },
      { rule: { sq: 'Alergenët shënohen me shkronja të theksuara në panel kryesor.', en: 'Allergens highlighted in bold on the main display panel.' }, mandatory: true, sourceUrl: 'https://www.foodstandards.gov.au' },
    ],
    contacts: [
      { role: 'Konsullata e Kosovës', name: 'Consulate of Kosovo in Sydney', address: 'Sydney, NSW', phone: '+61 2 9000 0000', email: 'consulate.sydney@rks-gov.net', url: 'https://www.ambasada-ks.net' },
      { role: 'Doganat (Help)', name: 'Australian Border Force', address: '—', phone: '+61 2 6275 6666', email: 'information@abf.gov.au', url: 'https://www.abf.gov.au' },
    ],
  },
  NO: {
    extraDocs: [
      { name: { sq: 'Certifikatë EUR.1 (FTA Kosovo-EFTA)', en: 'EUR.1 Certificate (Kosovo-EFTA FTA)' }, description: { sq: 'Lëshohet nga Oda Ekonomike e Kosovës. Garanton tarifa preferenciale për mallrat industriale.', en: 'Issued by Kosovo Chamber of Commerce. Grants preferential tariffs on industrial goods.' }, mandatory: true, issuedBy: 'Oda Ekonomike e Kosovës', sourceUrl: 'https://www.efta.int/free-trade/free-trade-agreements/kosovo' },
      { name: { sq: 'Tax Free Sale License (Vinmonopolet)', en: 'Tax Free Sale License (Vinmonopolet)' }, description: { sq: 'Alkooli në Norvegji shitet vetëm përmes monopolit shtetëror Vinmonopolet.', en: 'Alcohol in Norway sold only via the state monopoly Vinmonopolet.' }, mandatory: false, issuedBy: 'Vinmonopolet', sourceUrl: 'https://www.vinmonopolet.no' },
    ],
    certifications: [
      { name: 'EU Health Certificate (përmes EEA)', appliesTo: ['Ushqim dhe pije'], description: { sq: 'Norvegjia zbaton standardet sanitare të BE-së përmes EEA.', en: 'Norway applies EU sanitary standards through EEA.' }, mandatory: true, authority: 'Mattilsynet (Norwegian Food Safety Authority)', sourceUrl: 'https://www.mattilsynet.no' },
      { name: 'CE Mark', appliesTo: ['Metale dhe makineri'], description: { sq: 'I njohur edhe në Norvegji (EEA) për elektrike, makineri, lodra.', en: 'Recognised in Norway (EEA) for electrical, machinery, toys.' }, mandatory: true, authority: 'EU Notified Body', sourceUrl: 'https://www.toll.no' },
      { name: 'EU Timber Regulation (EUTR)', appliesTo: ['Druri dhe mobilje'], description: { sq: 'Due Diligence System për dru ligjor — zbatohet edhe në Norvegji.', en: 'Due Diligence System for legal wood — applies in Norway too.' }, mandatory: true, authority: 'Norwegian Environment Agency', sourceUrl: 'https://www.miljodirektoratet.no' },
    ],
    labelingLanguages: ['Norvegjisht (bokmål)', 'Anglisht (njihet shpesh)'],
    labelingRules: [
      { rule: { sq: 'Etiketimi i ushqimit në norvegjisht ose anglisht; lista e përbërësve gjithmonë në norvegjisht.', en: 'Food labelling in Norwegian or English; ingredient list always in Norwegian.' }, mandatory: true, sourceUrl: 'https://www.mattilsynet.no' },
      { rule: { sq: 'Alergenët në shkronja të theksuara sipas Reg. (EU) 1169/2011.', en: 'Allergens in bold per Reg. (EU) 1169/2011.' }, mandatory: true, sourceUrl: 'https://www.mattilsynet.no' },
      { rule: { sq: 'Origjina: "Produsert i Kosovo" qartë në panel.', en: 'Origin: "Produced in Kosovo" clearly on panel.' }, mandatory: true, sourceUrl: 'https://www.toll.no' },
    ],
    contacts: [
      { role: 'Ambasada e Kosovës', name: 'Embassy of Kosovo in Stockholm (mbulon Norvegjinë)', address: 'Stockholm, Sweden', phone: '+46 8 22 22 11', email: 'embassy.sweden@rks-gov.net', url: 'https://www.ambasada-ks.net' },
      { role: 'Doganat (Help Desk)', name: 'Tolletaten (Norwegian Customs)', address: '—', phone: '+47 22 86 03 12', email: '', url: 'https://www.toll.no/en/contact-us/' },
    ],
  },
  SG: {
    extraDocs: [
      { name: { sq: 'TradeNet Permit', en: 'TradeNet Permit' }, description: { sq: 'Çdo dërgesë importi në Singapor duhet të deklarohet elektronikisht përmes TradeNet.', en: 'Every import declaration must go through the TradeNet system.' }, mandatory: true, issuedBy: 'Singapore Customs', sourceUrl: 'https://www.tradenet.gov.sg' },
      { name: { sq: 'Customs Account / IRAS', en: 'Customs Account / IRAS' }, description: { sq: 'Importuesi duhet të jetë i regjistruar në Singapore Customs me Unique Entity Number.', en: 'Importer must hold a Singapore Customs account with a Unique Entity Number.' }, mandatory: true, issuedBy: 'Singapore Customs', sourceUrl: 'https://www.customs.gov.sg' },
    ],
    certifications: [
      { name: 'SFA Food Import License', appliesTo: ['Ushqim dhe pije'], description: { sq: 'I detyrueshëm për çdo importues ushqimi në Singapor.', en: 'Required for every food importer in Singapore.' }, mandatory: true, authority: 'Singapore Food Agency (SFA)', sourceUrl: 'https://www.sfa.gov.sg' },
      { name: 'HSA Cosmetic Product Notification', appliesTo: ['Kozmetikë'], description: { sq: 'Notifikim para shitjes te Health Sciences Authority.', en: 'Pre-market notification with Health Sciences Authority.' }, mandatory: true, authority: 'HSA', sourceUrl: 'https://www.hsa.gov.sg' },
      { name: 'Halal Certification (MUIS)', appliesTo: ['Ushqim dhe pije'], description: { sq: 'Halal i njohur globalisht për ushqim që synon konsumatorin mysliman.', en: 'Globally recognised Halal for food targeting Muslim consumers.' }, mandatory: false, authority: 'Islamic Religious Council (MUIS)', sourceUrl: 'https://www.muis.gov.sg' },
    ],
    labelingLanguages: ['Anglisht'],
    labelingRules: [
      { rule: { sq: 'Etiketimi në anglisht; gjuhë të tjera lejohen si shtesë.', en: 'Labelling in English; other languages allowed as supplement.' }, mandatory: true, sourceUrl: 'https://www.sfa.gov.sg' },
      { rule: { sq: 'Origjina: "Made in Kosovo" + emri dhe adresa e importuesit në Singapor.', en: 'Origin: "Made in Kosovo" + name and address of Singapore importer.' }, mandatory: true, sourceUrl: 'https://www.sfa.gov.sg' },
      { rule: { sq: 'Data e prodhimit + skadimit në formatin DD/MM/YYYY.', en: 'Manufacturing + expiry date in DD/MM/YYYY format.' }, mandatory: true, sourceUrl: 'https://www.sfa.gov.sg' },
    ],
    contacts: [
      { role: 'Singapore Customs', name: 'Singapore Customs Contact Centre', address: '55 Newton Road, Singapore', phone: '+65 6355 2000', email: 'customs_documentation@customs.gov.sg', url: 'https://www.customs.gov.sg' },
      { role: 'Oda Ekonomike (B2B)', name: 'Singapore International Chamber of Commerce', address: 'Singapore', phone: '+65 6338 9761', email: 'admin@sicc.com.sg', url: 'https://www.sicc.com.sg' },
    ],
  },
  VN: {
    extraDocs: [
      { name: { sq: 'Food Safety Import Notification', en: 'Food Safety Import Notification' }, description: { sq: 'Vietnam Food Administration kërkon notifikim para importit për ushqim.', en: 'Vietnam Food Administration pre-import notification required.' }, mandatory: true, issuedBy: 'Vietnam Food Administration (VFA)', sourceUrl: 'https://www.moh.gov.vn' },
      { name: { sq: 'Letër kredie (Letter of Credit)', en: 'Letter of Credit (L/C)' }, description: { sq: 'Praktikë e zakonshme tregtare në Vietnam për blerësit e rinj.', en: 'Common trade practice in Vietnam for new buyers.' }, mandatory: false, issuedBy: 'Banka komerciale', sourceUrl: '' },
    ],
    certifications: [
      { name: 'VietGAP / GlobalGAP', appliesTo: ['Ushqim dhe pije'], description: { sq: 'Cilësi bujqësore për produkte fresh/të përpunuara.', en: 'Agricultural quality for fresh/processed products.' }, mandatory: false, authority: 'MARD', sourceUrl: 'https://www.mard.gov.vn' },
      { name: 'CB Certification (Conformité Beauté)', appliesTo: ['Kozmetikë'], description: { sq: 'Notifikim te Drug Administration of Vietnam para shitjes.', en: 'Notification to Drug Administration of Vietnam before sale.' }, mandatory: true, authority: 'DAV', sourceUrl: 'https://dav.gov.vn' },
      { name: 'CR Mark', appliesTo: ['Metale dhe makineri'], description: { sq: 'Certificate of Conformity për pajisje elektrike.', en: 'Certificate of Conformity for electrical equipment.' }, mandatory: true, authority: 'STAMEQ', sourceUrl: 'http://www.tcvn.gov.vn' },
    ],
    labelingLanguages: ['Vietnamisht'],
    labelingRules: [
      { rule: { sq: 'Etiketim në vietnamisht; gjuhë të tjera lejohen si shtesë.', en: 'Labelling in Vietnamese; other languages permitted as supplement.' }, mandatory: true, sourceUrl: 'https://www.customs.gov.vn' },
      { rule: { sq: 'Origjina, emri dhe adresa e importuesit vietnamez janë të detyrueshme.', en: 'Origin, name and address of Vietnamese importer mandatory.' }, mandatory: true, sourceUrl: 'https://www.customs.gov.vn' },
      { rule: { sq: 'Vlerat ushqyese sipas QCVN 5-1:2010/BYT për ushqim.', en: 'Nutrition facts per QCVN 5-1:2010/BYT for food.' }, mandatory: true, sourceUrl: 'https://www.moh.gov.vn' },
    ],
    contacts: [
      { role: 'Vietnam Customs', name: 'General Department of Vietnam Customs', address: 'Hanoi, Vietnam', phone: '+84 24 39440833', email: '', url: 'https://www.customs.gov.vn' },
      { role: 'Oda Ekonomike', name: 'Vietnam Chamber of Commerce and Industry (VCCI)', address: 'Hanoi', phone: '+84 24 35742022', email: 'vcci@vcci.com.vn', url: 'https://en.vcci.com.vn' },
    ],
  },
  TH: {
    extraDocs: [
      { name: { sq: 'Thai FDA Import License', en: 'Thai FDA Import License' }, description: { sq: 'I detyrueshëm për ushqim, kozmetikë, barna, pajisje mjekësore.', en: 'Required for food, cosmetics, pharma, medical devices.' }, mandatory: true, issuedBy: 'Thai Food and Drug Administration', sourceUrl: 'https://www.fda.moph.go.th/en/' },
      { name: { sq: 'Import Declaration via Thai Customs', en: 'Import Declaration via Thai Customs' }, description: { sq: 'Deklarim elektronik përmes Thai Customs e-Import.', en: 'Electronic declaration via Thai Customs e-Import.' }, mandatory: true, issuedBy: 'Thai Customs Department', sourceUrl: 'https://www.customs.go.th' },
    ],
    certifications: [
      { name: 'Thai FDA Registration', appliesTo: ['Ushqim dhe pije', 'Kozmetikë'], description: { sq: 'Regjistrim para shitjes me FDA Thai për kategoritë e ndjeshme.', en: 'Pre-market registration with Thai FDA for sensitive categories.' }, mandatory: true, authority: 'Thai FDA', sourceUrl: 'https://www.fda.moph.go.th' },
      { name: 'TISI Mark', appliesTo: ['Metale dhe makineri'], description: { sq: 'Thai Industrial Standards për pajisje elektrike, ndërtim, ushqim të caktuar.', en: 'Thai Industrial Standards for electrical, construction, certain food.' }, mandatory: true, authority: 'TISI', sourceUrl: 'https://www.tisi.go.th' },
      { name: 'Halal CICOT', appliesTo: ['Ushqim dhe pije'], description: { sq: 'Certifikim Halal për tregun mysliman tajlandez.', en: 'Halal certification for the Thai Muslim market.' }, mandatory: false, authority: 'CICOT', sourceUrl: 'https://www.cicot.or.th' },
    ],
    labelingLanguages: ['Tajlandisht'],
    labelingRules: [
      { rule: { sq: 'Etiketimi në tajlandisht; sticker post-importi lejohet.', en: 'Labelling in Thai; post-import stickers permitted.' }, mandatory: true, sourceUrl: 'https://www.fda.moph.go.th' },
      { rule: { sq: 'Numri i regjistrimit FDA (Or.Yor.) shfaqet në paketim.', en: 'FDA registration number (Or.Yor.) shown on packaging.' }, mandatory: true, sourceUrl: 'https://www.fda.moph.go.th' },
      { rule: { sq: 'Origjina dhe emri/adresa e importuesit tajlandez.', en: 'Origin and Thai importer name/address.' }, mandatory: true, sourceUrl: 'https://www.customs.go.th' },
    ],
    contacts: [
      { role: 'Thai Customs', name: 'Customs Call Centre', address: 'Bangkok', phone: '1164', email: '', url: 'https://www.customs.go.th' },
      { role: 'Oda Ekonomike', name: 'Thai Chamber of Commerce', address: 'Bangkok', phone: '+66 2 622 1860', email: '', url: 'https://www.thaichamber.org' },
    ],
  },
  ID: {
    extraDocs: [
      { name: { sq: 'BPOM Notification (ushqim/kozmetikë)', en: 'BPOM Notification (food/cosmetics)' }, description: { sq: 'Çdo ushqim/kozmetikë e importuar duhet të notifikohet te BPOM para shitjes.', en: 'Every imported food/cosmetic must be notified to BPOM before sale.' }, mandatory: true, issuedBy: 'Badan Pengawas Obat dan Makanan (BPOM)', sourceUrl: 'https://www.pom.go.id' },
      { name: { sq: 'BPJPH Halal Certificate (e detyrueshme që 2024)', en: 'BPJPH Halal Certificate (mandatory since 2024)' }, description: { sq: 'Të gjitha ushqimet pa Halal nuk lejohen të shiten në Indonezi që 2024.', en: 'All food without Halal cannot be sold in Indonesia since 2024.' }, mandatory: true, issuedBy: 'BPJPH', sourceUrl: 'https://bpjph.halal.go.id' },
    ],
    certifications: [
      { name: 'SNI (Standar Nasional Indonesia)', appliesTo: ['Metale dhe makineri', 'Druri dhe mobilje'], description: { sq: 'Standardi kombëtar i Indonezisë për shumë kategori industriale.', en: 'Indonesian National Standard for many industrial categories.' }, mandatory: true, authority: 'BSN', sourceUrl: 'https://www.bsn.go.id' },
      { name: 'BPJPH Halal', appliesTo: ['Ushqim dhe pije', 'Kozmetikë'], description: { sq: 'Detyrueshëm për ushqim që nga 2024; gradualisht edhe për kozmetikë.', en: 'Mandatory for food since 2024; gradually extended to cosmetics.' }, mandatory: true, authority: 'BPJPH', sourceUrl: 'https://bpjph.halal.go.id' },
      { name: 'TKDN (Local Content)', appliesTo: ['Metale dhe makineri'], description: { sq: 'Tregon përqindjen e prodhimit lokal për qasje në tendera publikë.', en: 'Shows percentage of local production for public tender access.' }, mandatory: false, authority: 'Ministry of Industry', sourceUrl: 'https://www.kemenperin.go.id' },
    ],
    labelingLanguages: ['Bahasa Indonesia'],
    labelingRules: [
      { rule: { sq: 'Etiketimi në Bahasa Indonesia; logo Halal e BPJPH e detyrueshme për ushqim.', en: 'Labelling in Bahasa Indonesia; BPJPH Halal logo required for food.' }, mandatory: true, sourceUrl: 'https://bpjph.halal.go.id' },
      { rule: { sq: 'Origjina dhe emri/adresa e importuesit indonezian.', en: 'Origin and Indonesian importer name/address.' }, mandatory: true, sourceUrl: 'https://www.pom.go.id' },
      { rule: { sq: 'Numri BPOM në paketim për ushqim/kozmetikë.', en: 'BPOM number on packaging for food/cosmetics.' }, mandatory: true, sourceUrl: 'https://www.pom.go.id' },
    ],
    contacts: [
      { role: 'Doganat', name: 'Directorate General of Customs and Excise (Bea Cukai)', address: 'Jakarta', phone: '+62 21 1500225', email: '', url: 'https://www.beacukai.go.id' },
      { role: 'Oda Ekonomike', name: 'Indonesian Chamber of Commerce (KADIN)', address: 'Jakarta', phone: '+62 21 5274484', email: 'info@kadin-indonesia.or.id', url: 'https://kadin.id' },
    ],
  },
  MY: {
    extraDocs: [
      { name: { sq: 'JAKIM Halal Certificate', en: 'JAKIM Halal Certificate' }, description: { sq: 'Standardi më i njohur global Halal — i nevojshëm për ushqim/kozmetikë në tregun malajzez.', en: 'Most globally recognised Halal standard — needed for food/cosmetics in Malaysia.' }, mandatory: false, issuedBy: 'JAKIM (Department of Islamic Development)', sourceUrl: 'https://www.halal.gov.my' },
      { name: { sq: 'NPRA Cosmetic Notification', en: 'NPRA Cosmetic Notification' }, description: { sq: 'Çdo kozmetikë duhet të notifikohet te National Pharmaceutical Regulatory Agency para shitjes.', en: 'All cosmetics must be notified to National Pharmaceutical Regulatory Agency before sale.' }, mandatory: true, issuedBy: 'NPRA', sourceUrl: 'https://www.npra.gov.my' },
    ],
    certifications: [
      { name: 'JAKIM Halal', appliesTo: ['Ushqim dhe pije', 'Kozmetikë'], description: { sq: 'Halal i njohur ndërkombëtarisht. Procesi 6-12 javë.', en: 'Internationally recognised Halal. Process takes 6-12 weeks.' }, mandatory: false, authority: 'JAKIM', sourceUrl: 'https://www.halal.gov.my' },
      { name: 'MS Standards (Malaysian Standards)', appliesTo: ['Metale dhe makineri', 'Druri dhe mobilje'], description: { sq: 'Standardet kombëtare të Malajzisë për produkte industriale.', en: 'Malaysian national standards for industrial products.' }, mandatory: true, authority: 'Department of Standards Malaysia', sourceUrl: 'https://www.jsm.gov.my' },
      { name: 'SIRIM QAS', appliesTo: ['Metale dhe makineri'], description: { sq: 'Certifikim cilësie për pajisje elektrike dhe ndërtim.', en: 'Quality certification for electrical and construction.' }, mandatory: false, authority: 'SIRIM QAS', sourceUrl: 'https://www.sirim-qas.com.my' },
    ],
    labelingLanguages: ['Malajzisht (Bahasa Malaysia)'],
    labelingRules: [
      { rule: { sq: 'Etiketimi në malajzisht; anglisht lejohet si shtesë.', en: 'Labelling in Malay; English allowed as supplement.' }, mandatory: true, sourceUrl: 'https://www.kpdn.gov.my' },
      { rule: { sq: 'Logo Halal vetëm me certifikim JAKIM aktiv.', en: 'Halal logo only with active JAKIM certification.' }, mandatory: true, sourceUrl: 'https://www.halal.gov.my' },
      { rule: { sq: 'Origjina, importuesi malajzez, peshë neto, alergenë.', en: 'Origin, Malaysian importer, net weight, allergens.' }, mandatory: true, sourceUrl: 'https://www.kpdn.gov.my' },
    ],
    contacts: [
      { role: 'Doganat', name: 'Royal Malaysian Customs Department', address: 'Putrajaya', phone: '+60 3 8882 2100', email: 'info@customs.gov.my', url: 'https://www.customs.gov.my' },
      { role: 'Oda Ekonomike', name: 'Malaysian Chamber of Commerce', address: 'Kuala Lumpur', phone: '+60 3 6203 1812', email: '', url: 'https://www.micci.com' },
    ],
  },
  ZA: {
    extraDocs: [
      { name: { sq: 'ITAC Import Permit', en: 'ITAC Import Permit' }, description: { sq: 'I detyrueshëm për produkte të caktuara (mish, lëkurë, makineri të përdorur).', en: 'Required for specific products (meat, leather, used machinery).' }, mandatory: false, issuedBy: 'International Trade Administration Commission', sourceUrl: 'https://www.itac.org.za' },
      { name: { sq: 'NRCS Letter of Authority (LoA)', en: 'NRCS Letter of Authority (LoA)' }, description: { sq: 'I obliguar për pajisje elektrike, ndërtim, lodra, ushqim të paketuar.', en: 'Required for electrical, construction, toys, packaged food.' }, mandatory: true, issuedBy: 'NRCS', sourceUrl: 'https://www.nrcs.org.za' },
    ],
    certifications: [
      { name: 'SABS Mark', appliesTo: ['Metale dhe makineri', 'Druri dhe mobilje'], description: { sq: 'South African Bureau of Standards mark për cilësi.', en: 'South African Bureau of Standards quality mark.' }, mandatory: false, authority: 'SABS', sourceUrl: 'https://www.sabs.co.za' },
      { name: 'NRCS Compulsory Specifications', appliesTo: ['Metale dhe makineri', 'Ushqim dhe pije'], description: { sq: 'Standardet e detyrueshme për produkte të specifikuara.', en: 'Compulsory standards for specified products.' }, mandatory: true, authority: 'NRCS', sourceUrl: 'https://www.nrcs.org.za' },
      { name: 'FSSC 22000 / HACCP', appliesTo: ['Ushqim dhe pije'], description: { sq: 'Standardet ushqimore të pranuara nga blerësit kryesorë afrikanjugorë.', en: 'Food standards accepted by major South African buyers.' }, mandatory: false, authority: 'Akreditim ndërkombëtar', sourceUrl: 'https://www.fssc.com' },
    ],
    labelingLanguages: ['Anglisht'],
    labelingRules: [
      { rule: { sq: 'Etiketimi në anglisht; gjuhët e tjera zyrtare lejohen si shtesë.', en: 'Labelling in English; other official languages allowed as supplement.' }, mandatory: true, sourceUrl: 'https://www.health.gov.za' },
      { rule: { sq: 'Origjina, emri/adresa e importuesit jugafrikan, peshë neto.', en: 'Origin, South African importer name/address, net weight.' }, mandatory: true, sourceUrl: 'https://www.sars.gov.za' },
      { rule: { sq: 'Alergenët, vlerat ushqyese sipas R146 për ushqim.', en: 'Allergens, nutrition facts per R146 for food.' }, mandatory: true, sourceUrl: 'https://www.health.gov.za' },
    ],
    contacts: [
      { role: 'SARS Customs', name: 'SARS Customs Contact Centre', address: 'Pretoria', phone: '+27 11 602 2093', email: 'contactus@sars.gov.za', url: 'https://www.sars.gov.za' },
      { role: 'Oda Ekonomike', name: 'South African Chamber of Commerce and Industry (SACCI)', address: 'Johannesburg', phone: '+27 11 446 3800', email: 'info@sacci.org.za', url: 'https://sacci.org.za' },
    ],
  },
  GH: {
    extraDocs: [
      { name: { sq: 'GCNet Pre-Arrival Declaration', en: 'GCNet Pre-Arrival Declaration' }, description: { sq: 'Sistem elektronik për deklarim 24 orë para mbërritjes së mallit në port.', en: 'Electronic system for declaring shipment 24 hours before port arrival.' }, mandatory: true, issuedBy: 'Ghana Customs Division', sourceUrl: 'https://gra.gov.gh' },
      { name: { sq: 'TIN (Tax Identification Number)', en: 'TIN (Tax Identification Number)' }, description: { sq: 'Importuesi ganez duhet të ketë TIN aktiv nga Ghana Revenue Authority.', en: 'Ghanaian importer must hold active TIN from Ghana Revenue Authority.' }, mandatory: true, issuedBy: 'Ghana Revenue Authority', sourceUrl: 'https://gra.gov.gh' },
    ],
    certifications: [
      { name: 'FDA Ghana Registration', appliesTo: ['Ushqim dhe pije', 'Kozmetikë'], description: { sq: 'I detyrueshëm për ushqim, pije, kozmetikë, barna në Ganë.', en: 'Required for food, beverages, cosmetics, pharma in Ghana.' }, mandatory: true, authority: 'Food and Drugs Authority Ghana', sourceUrl: 'https://fdaghana.gov.gh' },
      { name: 'GSA Standard Mark', appliesTo: ['Metale dhe makineri'], description: { sq: 'Ghana Standards Authority për produkte industriale.', en: 'Ghana Standards Authority for industrial products.' }, mandatory: true, authority: 'GSA', sourceUrl: 'https://www.gsa.gov.gh' },
      { name: 'Halal Certification (Ghana Muslim Mission)', appliesTo: ['Ushqim dhe pije'], description: { sq: 'Për 18% të popullsisë myslimane në veri.', en: 'For the 18% Muslim population in northern Ghana.' }, mandatory: false, authority: 'Ghana Muslim Mission', sourceUrl: '' },
    ],
    labelingLanguages: ['Anglisht'],
    labelingRules: [
      { rule: { sq: 'Etiketimi në anglisht.', en: 'Labelling in English.' }, mandatory: true, sourceUrl: 'https://fdaghana.gov.gh' },
      { rule: { sq: 'Origjina dhe emri/adresa e importuesit ganez.', en: 'Origin and Ghanaian importer name/address.' }, mandatory: true, sourceUrl: 'https://gra.gov.gh' },
      { rule: { sq: 'Data e skadimit + numri i grupit (batch).', en: 'Expiry date + batch number.' }, mandatory: true, sourceUrl: 'https://fdaghana.gov.gh' },
    ],
    contacts: [
      { role: 'Ghana Customs', name: 'Customs Division, Ghana Revenue Authority', address: 'Accra', phone: '+233 30 277 9499', email: 'info@gra.gov.gh', url: 'https://gra.gov.gh' },
      { role: 'Oda Ekonomike', name: 'Ghana Chamber of Commerce and Industry', address: 'Accra', phone: '+233 30 266 2426', email: 'info@ghanachamber.org', url: 'https://www.ghanachamber.org' },
    ],
  },
  NG: {
    extraDocs: [
      { name: { sq: 'NAFDAC Registration', en: 'NAFDAC Registration' }, description: { sq: 'I detyrueshëm për ushqim/pije/kozmetikë/barna. Proces 3-6 muaj.', en: 'Required for food/beverage/cosmetics/pharma. Process 3-6 months.' }, mandatory: true, issuedBy: 'National Agency for Food and Drug Administration', sourceUrl: 'https://www.nafdac.gov.ng' },
      { name: { sq: 'Form M (Pre-import declaration)', en: 'Form M (Pre-import declaration)' }, description: { sq: 'Formë e detyrueshme para hapjes së LC ose çdo dërgesë.', en: 'Mandatory form before opening LC or any shipment.' }, mandatory: true, issuedBy: 'Central Bank of Nigeria', sourceUrl: 'https://www.cbn.gov.ng' },
    ],
    certifications: [
      { name: 'NAFDAC', appliesTo: ['Ushqim dhe pije', 'Kozmetikë'], description: { sq: 'Detyrueshëm + numri NAFDAC në paketim.', en: 'Mandatory + NAFDAC number on packaging.' }, mandatory: true, authority: 'NAFDAC', sourceUrl: 'https://www.nafdac.gov.ng' },
      { name: 'SONCAP', appliesTo: ['Metale dhe makineri'], description: { sq: 'Standards Organisation of Nigeria Conformity Assessment Programme.', en: 'Standards Organisation of Nigeria Conformity Assessment Programme.' }, mandatory: true, authority: 'SON', sourceUrl: 'https://www.son.gov.ng' },
      { name: 'Halal NSCIA', appliesTo: ['Ushqim dhe pije'], description: { sq: 'Për 50% të popullsisë myslimane.', en: 'For 50% Muslim population.' }, mandatory: false, authority: 'NSCIA', sourceUrl: '' },
    ],
    labelingLanguages: ['Anglisht'],
    labelingRules: [
      { rule: { sq: 'Etiketimi në anglisht; numri NAFDAC i dukshëm.', en: 'Labelling in English; NAFDAC number visible.' }, mandatory: true, sourceUrl: 'https://www.nafdac.gov.ng' },
      { rule: { sq: 'Data e prodhimit + skadimit në formatin DD/MM/YYYY.', en: 'Manufacturing + expiry date in DD/MM/YYYY.' }, mandatory: true, sourceUrl: 'https://www.nafdac.gov.ng' },
      { rule: { sq: 'Origjina "Made in Kosovo" + importuesi nigerian.', en: 'Origin "Made in Kosovo" + Nigerian importer.' }, mandatory: true, sourceUrl: 'https://customs.gov.ng' },
    ],
    contacts: [
      { role: 'Nigeria Customs', name: 'Nigeria Customs Service HQ', address: 'Abuja', phone: '+234 9 523 2891', email: 'info@customs.gov.ng', url: 'https://customs.gov.ng' },
      { role: 'NAFDAC', name: 'NAFDAC Customer Service', address: 'Abuja', phone: '+234 9 460 1644', email: 'info@nafdac.gov.ng', url: 'https://www.nafdac.gov.ng' },
    ],
  },
  MA: {
    extraDocs: [
      { name: { sq: 'Engagement d’Importation', en: 'Engagement d’Importation' }, description: { sq: 'Detyrim para çdo importi me vlerë >200,000 MAD. Lëshohet nga Office des Changes.', en: 'Required before any import >200,000 MAD. Issued by Office des Changes.' }, mandatory: true, issuedBy: 'Office des Changes', sourceUrl: 'https://www.oc.gov.ma' },
      { name: { sq: 'ONSSA Sanitary Certificate', en: 'ONSSA Sanitary Certificate' }, description: { sq: 'Për ushqim, kafshë, bimë. ONSSA-ja administron sigurinë ushqimore.', en: 'For food, animals, plants. ONSSA administers food safety.' }, mandatory: true, issuedBy: 'ONSSA', sourceUrl: 'https://www.onssa.gov.ma' },
    ],
    certifications: [
      { name: 'ONSSA Approval', appliesTo: ['Ushqim dhe pije'], description: { sq: 'Detyrueshëm për të gjitha ushqimet e importuara.', en: 'Required for all imported foods.' }, mandatory: true, authority: 'ONSSA', sourceUrl: 'https://www.onssa.gov.ma' },
      { name: 'NM Standards (Norme Marocaine)', appliesTo: ['Metale dhe makineri'], description: { sq: 'Standardet kombëtare të Marokut.', en: 'Moroccan national standards.' }, mandatory: false, authority: 'IMANOR', sourceUrl: 'https://www.imanor.gov.ma' },
      { name: 'Halal Maroc', appliesTo: ['Ushqim dhe pije'], description: { sq: 'Standard Halal nga IMANOR i njohur lokalisht.', en: 'Halal standard from IMANOR locally recognised.' }, mandatory: false, authority: 'IMANOR', sourceUrl: 'https://www.imanor.gov.ma' },
    ],
    labelingLanguages: ['Arabisht', 'Frëngjisht'],
    labelingRules: [
      { rule: { sq: 'Etiketim arabisht + frëngjisht; vlerat ushqyese sipas NM 08.0.002.', en: 'Labelling Arabic + French; nutrition per NM 08.0.002.' }, mandatory: true, sourceUrl: 'https://www.onssa.gov.ma' },
      { rule: { sq: 'Origjina + emri/adresa e importuesit marokez.', en: 'Origin + Moroccan importer name/address.' }, mandatory: true, sourceUrl: 'https://www.douane.gov.ma' },
      { rule: { sq: 'Halal duhet vetëm me certifikim oficial.', en: 'Halal label only with official certification.' }, mandatory: true, sourceUrl: 'https://www.imanor.gov.ma' },
    ],
    contacts: [
      { role: 'Doganat (ADII)', name: 'Administration des Douanes et Impôts Indirects', address: 'Rabat', phone: '+212 537 57 90 00', email: 'adii@douane.gov.ma', url: 'https://www.douane.gov.ma' },
      { role: 'Oda Ekonomike', name: 'Chambre Marocaine de Commerce', address: 'Rabat', phone: '+212 537 70 50 80', email: '', url: 'https://www.cgem.ma' },
    ],
  },
  KE: {
    extraDocs: [
      { name: { sq: 'KEBS PVoC Certificate of Conformity', en: 'KEBS PVoC Certificate of Conformity' }, description: { sq: 'Pre-Export Verification of Conformity i detyrueshëm para dërgesës nga Kosova.', en: 'Pre-Export Verification of Conformity required before shipment from Kosovo.' }, mandatory: true, issuedBy: 'KEBS-approved inspection agency', sourceUrl: 'https://www.kebs.org' },
      { name: { sq: 'KRA PIN Registration', en: 'KRA PIN Registration' }, description: { sq: 'Importuesi keniat duhet të ketë PIN aktiv nga Kenya Revenue Authority.', en: 'Kenyan importer must hold active PIN from Kenya Revenue Authority.' }, mandatory: true, issuedBy: 'KRA', sourceUrl: 'https://www.kra.go.ke' },
    ],
    certifications: [
      { name: 'KEBS Standard Mark', appliesTo: ['Metale dhe makineri', 'Ushqim dhe pije'], description: { sq: 'Detyrueshëm për shumicën e produkteve të paketuara në Kenia.', en: 'Required for most packaged products in Kenya.' }, mandatory: true, authority: 'KEBS', sourceUrl: 'https://www.kebs.org' },
      { name: 'PCPB Pesticide Reg.', appliesTo: ['Ushqim dhe pije'], description: { sq: 'Pesticide Control Products Board për produkte bujqësore.', en: 'Pesticide Control Products Board for agro inputs.' }, mandatory: false, authority: 'PCPB', sourceUrl: 'https://kephis.org' },
      { name: 'Halal SUPKEM', appliesTo: ['Ushqim dhe pije'], description: { sq: 'Për 11% të popullsisë myslimane.', en: 'For 11% Muslim population.' }, mandatory: false, authority: 'SUPKEM', sourceUrl: '' },
    ],
    labelingLanguages: ['Anglisht', 'Swahilisht (lejohet)'],
    labelingRules: [
      { rule: { sq: 'Etiketim në anglisht; swahili lejohet si shtesë.', en: 'Labelling in English; Swahili allowed as supplement.' }, mandatory: true, sourceUrl: 'https://www.kebs.org' },
      { rule: { sq: 'Numri i KEBS Standard Mark në paketim.', en: 'KEBS Standard Mark number on packaging.' }, mandatory: true, sourceUrl: 'https://www.kebs.org' },
      { rule: { sq: 'Origjina + importuesi keniat + data e prodhimit/skadimit.', en: 'Origin + Kenyan importer + mfg/expiry date.' }, mandatory: true, sourceUrl: 'https://www.kra.go.ke' },
    ],
    contacts: [
      { role: 'KRA Customs', name: 'Kenya Revenue Authority Customs', address: 'Nairobi', phone: '+254 711 099 999', email: 'customs@kra.go.ke', url: 'https://www.kra.go.ke' },
      { role: 'Oda Ekonomike', name: 'Kenya National Chamber of Commerce', address: 'Nairobi', phone: '+254 20 222 2231', email: 'info@kenyachamber.or.ke', url: 'https://kenyachamber.or.ke' },
    ],
  },
  BR: {
    extraDocs: [
      { name: { sq: 'RADAR / Siscomex Registration', en: 'RADAR / Siscomex Registration' }, description: { sq: 'Importuesi brazilian duhet të jetë i regjistruar në RADAR para çdo importi.', en: 'Brazilian importer must be RADAR-registered before any import.' }, mandatory: true, issuedBy: 'Receita Federal', sourceUrl: 'https://www.gov.br/receitafederal/pt-br' },
      { name: { sq: 'ANVISA Registration (ushqim/kozmetikë/barna)', en: 'ANVISA Registration (food/cosmetics/pharma)' }, description: { sq: 'I detyrueshëm para çdo importi për kategoritë e ndjeshme.', en: 'Required before importing sensitive categories.' }, mandatory: true, issuedBy: 'ANVISA', sourceUrl: 'https://www.gov.br/anvisa/pt-br' },
    ],
    certifications: [
      { name: 'ANVISA', appliesTo: ['Ushqim dhe pije', 'Kozmetikë'], description: { sq: 'Regjistrim para shitjes me autoriteti shëndetësor.', en: 'Pre-market registration with health authority.' }, mandatory: true, authority: 'ANVISA', sourceUrl: 'https://www.gov.br/anvisa' },
      { name: 'INMETRO', appliesTo: ['Metale dhe makineri'], description: { sq: 'Certifikim cilësie për pajisje elektrike, lodra, ndërtim.', en: 'Quality certification for electrical, toys, construction.' }, mandatory: true, authority: 'INMETRO', sourceUrl: 'https://www.gov.br/inmetro' },
      { name: 'MAPA Certification', appliesTo: ['Ushqim dhe pije'], description: { sq: 'Ministério da Agricultura për produkte me origjinë bujqësore/shtazore.', en: 'Ministry of Agriculture for agri/animal origin products.' }, mandatory: true, authority: 'MAPA', sourceUrl: 'https://www.gov.br/agricultura' },
    ],
    labelingLanguages: ['Portugalisht (brasileiro)'],
    labelingRules: [
      { rule: { sq: 'Etiketim në portugalisht brazilian; përjashtim s’ka.', en: 'Labelling in Brazilian Portuguese; no exceptions.' }, mandatory: true, sourceUrl: 'https://www.gov.br/anvisa' },
      { rule: { sq: 'Origjina, emri/adresa e importuesit brazilian, CNPJ.', en: 'Origin, Brazilian importer name/address, CNPJ.' }, mandatory: true, sourceUrl: 'https://www.gov.br/receitafederal' },
      { rule: { sq: 'Vlerat ushqyese sipas RDC 429/2020 për ushqim.', en: 'Nutrition facts per RDC 429/2020 for food.' }, mandatory: true, sourceUrl: 'https://www.gov.br/anvisa' },
    ],
    contacts: [
      { role: 'Receita Federal', name: 'Receita Federal do Brasil', address: 'Brasília', phone: '+55 61 3412 2000', email: '', url: 'https://www.gov.br/receitafederal' },
      { role: 'Oda Ekonomike', name: 'CNC (Confederação Nacional do Comércio)', address: 'Brasília', phone: '+55 61 3329 9500', email: '', url: 'https://www.portaldocomercio.org.br' },
    ],
  },
  MX: {
    extraDocs: [
      { name: { sq: 'Padrón de Importadores', en: 'Padrón de Importadores' }, description: { sq: 'Regjistri zyrtar i importuesve. Detyrueshëm para çdo importi.', en: 'Official importer registry. Mandatory before any import.' }, mandatory: true, issuedBy: 'SAT', sourceUrl: 'https://www.sat.gob.mx' },
      { name: { sq: 'COFEPRIS Sanitary Registration', en: 'COFEPRIS Sanitary Registration' }, description: { sq: 'Për ushqim, kozmetikë, barna, pajisje mjekësore.', en: 'For food, cosmetics, pharma, medical devices.' }, mandatory: true, issuedBy: 'COFEPRIS', sourceUrl: 'https://www.gob.mx/cofepris' },
    ],
    certifications: [
      { name: 'NOM Compliance', appliesTo: ['Ushqim dhe pije', 'Metale dhe makineri', 'Tekstil dhe konfeksion'], description: { sq: 'Norma Oficial Mexicana — standardet teknike të detyrueshme.', en: 'Norma Oficial Mexicana — mandatory technical standards.' }, mandatory: true, authority: 'DGN / Secretaría de Economía', sourceUrl: 'https://www.gob.mx/se' },
      { name: 'COFEPRIS', appliesTo: ['Ushqim dhe pije', 'Kozmetikë'], description: { sq: 'Notifikim ose autorizim para shitjes.', en: 'Notification or authorisation before sale.' }, mandatory: true, authority: 'COFEPRIS', sourceUrl: 'https://www.gob.mx/cofepris' },
      { name: 'Profeco Labelling', appliesTo: ['Ushqim dhe pije'], description: { sq: 'Etiketim front-of-pack me sigle të paralajmërimit (NOM-051).', en: 'Front-of-pack warning labels (NOM-051).' }, mandatory: true, authority: 'Profeco', sourceUrl: 'https://www.gob.mx/profeco' },
    ],
    labelingLanguages: ['Spanjisht'],
    labelingRules: [
      { rule: { sq: 'Etiketim në spanjisht; sigle paralajmërimi NOM-051 për ushqime me sheqer/yndyrë/kripë.', en: 'Labelling in Spanish; NOM-051 warning labels for sugar/fat/salt.' }, mandatory: true, sourceUrl: 'https://www.gob.mx/profeco' },
      { rule: { sq: 'Origjina + RFC i importuesit meksikan.', en: 'Origin + Mexican importer RFC.' }, mandatory: true, sourceUrl: 'https://www.sat.gob.mx' },
      { rule: { sq: 'Data e skadimit + numri lot.', en: 'Expiry date + lot number.' }, mandatory: true, sourceUrl: 'https://www.gob.mx/cofepris' },
    ],
    contacts: [
      { role: 'SAT / Aduanas', name: 'Servicio de Administración Tributaria', address: 'Ciudad de México', phone: '+52 55 627 22728', email: '', url: 'https://www.sat.gob.mx' },
      { role: 'Oda Ekonomike', name: 'CONCAMIN (Confederation of Industrial Chambers)', address: 'México City', phone: '+52 55 5140 7800', email: '', url: 'https://www.concamin.org.mx' },
    ],
  },
  AR: {
    extraDocs: [
      { name: { sq: 'SIRA (Sistema de Importaciones)', en: 'SIRA (Import System)' }, description: { sq: 'Detyrim deklarimi para importit. Zëvendësoi SIMI në 2023.', en: 'Mandatory pre-import declaration. Replaced SIMI in 2023.' }, mandatory: true, issuedBy: 'AFIP', sourceUrl: 'https://www.afip.gob.ar' },
      { name: { sq: 'ANMAT Registration', en: 'ANMAT Registration' }, description: { sq: 'I detyrueshëm për ushqim/kozmetikë/barna.', en: 'Required for food/cosmetics/pharma.' }, mandatory: true, issuedBy: 'ANMAT', sourceUrl: 'https://www.argentina.gob.ar/anmat' },
    ],
    certifications: [
      { name: 'IRAM Mark', appliesTo: ['Metale dhe makineri'], description: { sq: 'Standardet kombëtare argjentinase.', en: 'Argentine national standards.' }, mandatory: false, authority: 'IRAM', sourceUrl: 'https://www.iram.org.ar' },
      { name: 'SENASA (agro)', appliesTo: ['Ushqim dhe pije'], description: { sq: 'Servicio Nacional de Sanidad y Calidad Agroalimentaria për bujqësi.', en: 'National food safety service for agricultural products.' }, mandatory: true, authority: 'SENASA', sourceUrl: 'https://www.argentina.gob.ar/senasa' },
      { name: 'ANMAT', appliesTo: ['Ushqim dhe pije', 'Kozmetikë'], description: { sq: 'Notifikim para shitjes te autoriteti shëndetësor.', en: 'Pre-market notification with health authority.' }, mandatory: true, authority: 'ANMAT', sourceUrl: 'https://www.argentina.gob.ar/anmat' },
    ],
    labelingLanguages: ['Spanjisht'],
    labelingRules: [
      { rule: { sq: 'Etiketim në spanjisht; sigle paralajmërimi për ushqim me sheqer/yndyrë sipas Ley 27.642.', en: 'Spanish labelling; warning labels for high-sugar/fat per Ley 27.642.' }, mandatory: true, sourceUrl: 'https://www.argentina.gob.ar' },
      { rule: { sq: 'Origjina + CUIT i importuesit argjentinas.', en: 'Origin + Argentine importer CUIT.' }, mandatory: true, sourceUrl: 'https://www.afip.gob.ar' },
      { rule: { sq: 'Vlerat ushqyese sipas Codigo Alimentario Argentino.', en: 'Nutrition per Codigo Alimentario Argentino.' }, mandatory: true, sourceUrl: 'https://www.argentina.gob.ar' },
    ],
    contacts: [
      { role: 'AFIP / DGA', name: 'Dirección General de Aduanas', address: 'Buenos Aires', phone: '+54 11 4347 2000', email: '', url: 'https://www.afip.gob.ar' },
      { role: 'Oda Ekonomike', name: 'Cámara Argentina de Comercio', address: 'Buenos Aires', phone: '+54 11 5300 9000', email: '', url: 'https://www.cac.com.ar' },
    ],
  },
  CL: {
    extraDocs: [
      { name: { sq: 'ISP Registration (Instituto de Salud Pública)', en: 'ISP Registration' }, description: { sq: 'I detyrueshëm për kozmetikë, barna, pajisje mjekësore.', en: 'Required for cosmetics, pharma, medical devices.' }, mandatory: true, issuedBy: 'ISP', sourceUrl: 'https://www.ispch.cl' },
      { name: { sq: 'SAG Phytosanitary Certificate', en: 'SAG Phytosanitary Certificate' }, description: { sq: 'Servicio Agrícola y Ganadero për produkte bujqësore/shtazore.', en: 'Servicio Agrícola y Ganadero for agri/animal products.' }, mandatory: true, issuedBy: 'SAG', sourceUrl: 'https://www.sag.gob.cl' },
    ],
    certifications: [
      { name: 'ISP Cosmetic Notification', appliesTo: ['Kozmetikë'], description: { sq: 'Notifikim para shitjes te ISP.', en: 'Pre-market notification with ISP.' }, mandatory: true, authority: 'ISP', sourceUrl: 'https://www.ispch.cl' },
      { name: 'NCh Standards', appliesTo: ['Metale dhe makineri', 'Druri dhe mobilje'], description: { sq: 'Standardet kombëtare kilane (Norma Chilena).', en: 'Chilean national standards (Norma Chilena).' }, mandatory: false, authority: 'INN', sourceUrl: 'https://www.inn.cl' },
      { name: 'Sello "Alto en..."', appliesTo: ['Ushqim dhe pije'], description: { sq: 'Etiketim front-of-pack për ushqim të lartë në sheqer/kripë/yndyrë.', en: 'Front-of-pack warning for high sugar/salt/fat foods.' }, mandatory: true, authority: 'Minsal', sourceUrl: 'https://www.minsal.cl' },
    ],
    labelingLanguages: ['Spanjisht'],
    labelingRules: [
      { rule: { sq: 'Etiketim në spanjisht; sello paralajmërimi nën Ley 20.606 për ushqim.', en: 'Spanish labelling; warning seals under Law 20.606 for food.' }, mandatory: true, sourceUrl: 'https://www.minsal.cl' },
      { rule: { sq: 'Origjina dhe importuesi kilanin me RUT.', en: 'Origin and Chilean importer with RUT.' }, mandatory: true, sourceUrl: 'https://www.aduana.cl' },
      { rule: { sq: 'Data e skadimit + lot.', en: 'Expiry date + lot.' }, mandatory: true, sourceUrl: 'https://www.minsal.cl' },
    ],
    contacts: [
      { role: 'Aduana', name: 'Servicio Nacional de Aduanas', address: 'Valparaíso', phone: '+56 32 220 0500', email: '', url: 'https://www.aduana.cl' },
      { role: 'Oda Ekonomike', name: 'Cámara de Comercio de Santiago', address: 'Santiago', phone: '+56 2 2360 7000', email: '', url: 'https://www.ccs.cl' },
    ],
  },
  NZ: {
    extraDocs: [
      { name: { sq: 'MPI Biosecurity Clearance', en: 'MPI Biosecurity Clearance' }, description: { sq: 'I detyrueshëm për çdo produkt biologjik (ushqim, dru, bimë, kafshë).', en: 'Required for every biological product (food, wood, plants, animals).' }, mandatory: true, issuedBy: 'Ministry for Primary Industries (MPI)', sourceUrl: 'https://www.mpi.govt.nz' },
      { name: { sq: 'ISPM 15 Wood Packaging Treatment', en: 'ISPM 15 Wood Packaging Treatment' }, description: { sq: 'Trajtim termik për të gjitha paletet drunore.', en: 'Heat treatment for all wood pallets.' }, mandatory: true, issuedBy: 'Operator i autorizuar', sourceUrl: 'https://www.mpi.govt.nz' },
    ],
    certifications: [
      { name: 'MPI Food Importer Verification', appliesTo: ['Ushqim dhe pije'], description: { sq: 'I detyrueshëm sipas Food Act 2014.', en: 'Required under Food Act 2014.' }, mandatory: true, authority: 'MPI', sourceUrl: 'https://www.mpi.govt.nz' },
      { name: 'AS/NZS Standards', appliesTo: ['Metale dhe makineri', 'Druri dhe mobilje'], description: { sq: 'Standardet Australian/NZ të përbashkëta.', en: 'Joint Australian/NZ standards.' }, mandatory: false, authority: 'Standards NZ', sourceUrl: 'https://www.standards.govt.nz' },
      { name: 'CodeMark NZ', appliesTo: ['Druri dhe mobilje'], description: { sq: 'Cilësi produkti për materiale ndërtimi.', en: 'Product quality for building materials.' }, mandatory: false, authority: 'MBIE', sourceUrl: 'https://www.mbie.govt.nz' },
    ],
    labelingLanguages: ['Anglisht'],
    labelingRules: [
      { rule: { sq: 'Etiketim në anglisht; sipas FSANZ.', en: 'English labelling; per FSANZ.' }, mandatory: true, sourceUrl: 'https://www.foodstandards.gov.au' },
      { rule: { sq: 'Origjina + importuesi novozelandez.', en: 'Origin + New Zealand importer.' }, mandatory: true, sourceUrl: 'https://www.customs.govt.nz' },
      { rule: { sq: 'Alergenët në shkronja të theksuara në panel.', en: 'Allergens in bold on display panel.' }, mandatory: true, sourceUrl: 'https://www.mpi.govt.nz' },
    ],
    contacts: [
      { role: 'NZ Customs', name: 'New Zealand Customs Service', address: 'Wellington', phone: '+64 4 901 4500', email: 'feedback@customs.govt.nz', url: 'https://www.customs.govt.nz' },
      { role: 'Oda Ekonomike', name: 'Auckland Business Chamber', address: 'Auckland', phone: '+64 9 309 6100', email: '', url: 'https://www.aucklandchamber.co.nz' },
    ],
  },
}

async function main() {
  let updated = 0
  for (const [code, data] of Object.entries(C)) {
    const guide = await prisma.exportGuide.findFirst({
      where: { countryCode: code, deletedAt: null },
      select: { id: true, customs: true },
    })
    if (!guide) { console.log(`SKIP ${code} not found`); continue }

    const authorityUrl = (guide.customs && typeof guide.customs === 'object' && 'authority' in guide.customs)
      ? guide.customs.authority?.url
      : ''
    const baseDocs = BASE_DOCS(authorityUrl)
    const requiredDocs = [...baseDocs, ...data.extraDocs]

    await prisma.exportGuide.update({
      where: { id: guide.id },
      data: {
        requiredDocs,
        certifications: data.certifications,
        labeling: { languages: data.labelingLanguages, rules: data.labelingRules },
        contacts: data.contacts,
      },
    })
    updated++
    console.log(`${code} → docs:${requiredDocs.length} certs:${data.certifications.length} lblRules:${data.labelingRules.length} contacts:${data.contacts.length}`)
  }
  console.log(`\n=== Done. Updated ${updated} guides ===`)
  await prisma.$disconnect()
}

main().catch((e) => { console.error(e); process.exit(1) })
