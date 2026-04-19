// Seed the fruit-juice / beverages A-Z export guide in SQ/EN/DE.
// Idempotent: re-running updates the existing row keyed by country+titleEn.

require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const TITLE_SQ = 'Udhëzim i Plotë Eksporti: Lëngje Frutash & Pije (A–Z)'
const TITLE_EN = 'Complete Export Guide: Fruit Juices & Beverages (A–Z)'
const TITLE_DE = 'Kompletter Exportleitfaden: Fruchtsäfte & Getränke (A–Z)'

const CONTENT_SQ = `# Udhëzim i Plotë për Eksportin e Lëngjeve të Frutave dhe Pijeve (A–Z)

Ky udhëzues është krijuar posaçërisht për prodhuesit Kosovarë të lëngjeve të frutave, nektareve, pijeve freskuese dhe pijeve energjike që duan të eksportojnë në tregjet e Bashkimit Evropian, Zvicrën, Britaninë e Madhe dhe më gjerë. Çdo seksion përfaqëson një hap praktik — nga ideja deri te kontejneri që del nga Hani i Elezit.

## A — Analiza fillestare e tregut

Para se të investoni në ambalazh ose etiketim, zgjidhni një treg objektiv. Për lëngje frutash tregjet më të arritshme për Kosovën janë: Gjermania, Austria, Zvicra, Italia, Suedia, vendet Skandinave dhe diaspora shqiptare.

- Studioni kërkesën (p.sh. lëngje 100% natyrale, pa sheqer të shtuar, bio).
- Vizitoni platformat si Trade Map (ITC), Eurostat Comext, dhe Access2Markets.
- Përcaktoni çmimin FOB dhe CIF para se të bisedoni me klientët.

## B — Bashkëpunimi me KIESA dhe Odat Ekonomike

KIESA (Agjencia për Investime dhe Përkrahjen e Ndërmarrjeve) dhe Oda Ekonomike e Kosovës ofrojnë:
- Bashkëpunime B2B në panaire ndërkombëtare.
- Bashkëfinancim për analiza laboratorike dhe etiketim.
- Udhëzime mbi Marrëveshjen e Stabilizim–Asociimit me BE-në.

## C — Certifikimet e nevojshme

Certifikimet ju hapin dyert e supermarketeve. Minimumi praktik për eksport:
- **HACCP** — detyrueshëm në BE për siguri ushqimore.
- **ISO 22000** — sistem i menaxhimit të sigurisë ushqimore.
- **IFS Food / BRCGS** — kërkohet nga zinxhirët e mëdhenj si Lidl, Rewe, Coop, Migros.
- **Halal** — nëse targetoni Turqinë, Emiratet, Arabinë Saudite.
- **EU Organic (EC 848/2018)** — nëse shitni "bio/organic".
- **Kosher** — për tregjet amerikane dhe izraelite.

## D — Dokumentacioni tregtar

Për çdo dërgesë ju nevojiten:
- Faturë tregtare (Commercial Invoice) — vlera, Incoterms, HS code.
- Packing List — numri i paletave, peshë neto/bruto.
- CMR ose Bill of Lading për transportin.
- Certifikatë origjine (EUR.1 për BE — ju jep preferencë tarifore zero për pijet jo-alkoolike të kategorive të caktuara).
- Certifikatë shëndetësore nga AUV (Agjencia e Ushqimit dhe Veterinarisë).
- Certifikatë analizash laboratorike.
- Fitosanitare nëse përmban fruta të përpunuara pjesërisht.

## E — Etiketimi sipas BE-së (Rregullorja 1169/2011)

Çdo etiketë e lëngut/pijes e destinuar për BE duhet të përmbajë:
- Emrin ligjor (p.sh. "Lëng molle 100% nga koncentrat" ose "Nektar vishnje").
- Listën e përbërësve me përqindje për fruta.
- Sasinë neto në ml ose L.
- Datën e skadencës "I konsumueshëm deri" / "Best before".
- Kushtet e ruajtjes.
- Emrin dhe adresën e prodhuesit/importuesit në BE.
- Vendin e origjinës.
- Vlerat ushqyese për 100 ml (energjia, yndyrna, karbohidrate, sheqernat, proteinat, kripa).
- Alergjenët e theksuar (bold) nëse ka.
- Gjuha: në gjuhën zyrtare të shtetit ku shitet. Përdorni etiketa shumë-gjuhëshe (AL/EN/DE) për diaspora dhe eksportues paralel.

## F — Formulimi dhe standardi i produktit

BE-ja ka rregullore specifike për kategorinë:
- **Direktiva e Lëngjeve (2001/112/EC)** — përcakton çka mund të quhet "juice", "juice from concentrate", "nectar", "fruit drink".
- Lëngu 100% nuk lejon shtimin e sheqerit.
- Nektaret kanë kufij minimumi për përmbajtjen e frutit (p.sh. 25% për vishnje, 50% për mollë).
- Pijet freskuese (soft drinks) rregullohen si kategori më e lirë, por sheqeri i shtuar taksohet në shumë vende (UK Sugar Levy, Norvegji, Irlandë).

## G — Gjetja e klientëve

Kanale praktike:
- **Panaire ushqimore:** Anuga (Kёln — tetor, çdo 2 vjet), SIAL (Paris), Gulfood (Dubai), ISM/ProSweets, Biofach (bio).
- **Platforma B2B:** Alibaba Europe, Europages, Wer-liefert-was, Kompass.
- **Supermarket buyers:** Edeka, Rewe, Metro, Lidl, Coop Swiss, Migros, Spar.
- **Distributorë etnikë:** zinxhirët e diasporës shqiptare në Zvicër, Gjermani, Austri, Suedi.
- **Broker & importues të specializuar:** kërkoni "fruit juice importer Germany" në LinkedIn Sales Navigator.

## H — Hulumtimi i çmimeve dhe struktura e kostos

Ndërtoni një **cost sheet FOB + CIF**:
- Kosto e frutit ose koncentratit.
- Sheqer / acid citrik / konservues (nëse lejohen).
- Shishja (PET, qelq), kapaku, etiketa, shrink.
- Ambalazhi sekondar (tray + shrink + paletë EUR).
- Punë, energji, amortizim.
- Marzhi për distributorin (zakonisht 15–25%).
- Transporti nga Prishtina deri te porti (Durrësi, Rijeka, Selanik, Koper).
- Taksa portuale, doganë, sigurim.

## I — Incoterms që të nënshkruhen qartë

Incoterms 2020 të përdorur më shpesh për pije:
- **EXW (Ex Works)** — klienti merr nga fabrika juaj. Më i thjeshti për ju.
- **FCA Prishtinë** — ju i dorëzoni në terminal.
- **FOB Durrës/Rijeka** — ju paguani transportin e brendshëm.
- **CIF Hamburg/Genova** — ju paguani ngarkesën dhe sigurimin.
- **DAP** / **DDP** — ju dorëzoni te dera e klientit, DDP përfshin edhe doganën në vendin mbërritës (më rreziku, por çmimi më i lartë).

## J — Juridike: kontratat

Kontrata me distributor duhet të mbulojë:
- Territorin ekskluziv ose jo-ekskluziv.
- Sasinë minimale vjetore.
- Afatin e pagesës (30/60/90 ditë).
- Garancinë e cilësisë dhe politikën e produkteve të prishura.
- Pronësinë intelektuale (brand, logo).
- Gjuhën e kontratës dhe gjykatën zgjidhëse (zakonisht Vjena ICC ose Cyrihu ose LCIA në Londër).
- Force Majeure dhe INCOTERMS e zbatuar.

## K — Kodi HS (Harmonized System)

Lëngjet e frutave: **2009** (me nënkategori sipas frutit dhe nëse është i koncentruar apo jo).
- 2009.71 / 2009.79 — Lëng molle
- 2009.81 — Lëng boronice
- 2009.89 — Lëngje të tjera / përzierje

Shiko tarifat preferenciale përmes Access2Markets: kosovari zakonisht përfiton tarifë **0%** në BE për shumicën e nën-kategorive 2009.

## L — Logjistika dhe transporti

- Kontejner 40' mund të ngarkojë ~20 paleta EUR me shishe PET 1L.
- Paleta EUR 80x120, maksimumi ~1400 shishe 1L.
- Transporti deri Durrës ~200€ / kontejner, Rijeka ~550€, Hamburg kamion direkt ~2200–2800€.
- Bashkëpunoni me 2–3 shpediterë (Ekspedita Express, DHL Global Forwarding, Kuehne+Nagel, Deugro).
- Për pije me gaz, kontejneri duhet të jetë i ventiluar dhe jo në diell të drejtpërdrejtë.

## M — Menaxhimi i cilësisë në linjën e prodhimit

- Pasterizim i vlefshëm (HTST/UHT) i regjistruar.
- Testim mikrobiologjik për çdo batch.
- Traceability — numri i batch-it lidhet me lotin e frutit dhe datën e prodhimit.
- Mbajeni një **mock recall** çdo 6 muaj.

## N — Normat e sigurisë ushqimore

- Kufiri i patulinës: ≤50 µg/kg (për lëng molle).
- Metalet e rënda: plumb ≤0.05 mg/kg, kadmium ≤0.020 mg/kg.
- Pesticidet: MRL sipas EU Regulation 396/2005.
- BPA-free nëse përdorni kanaçe.
- pH < 4.6 për shumicën e lëngjeve të frutave.

## O — Origjina preferenciale (EUR.1)

Dokumenti EUR.1 ose deklarata e faturës e lëshuar nga eksportues i autorizuar ju jep **zero tarifa** për shumicën e lëngjeve në BE. Plotësoni kërkesat:
- Fruta/koncentrati duhet të konsiderohet "i originuar" sipas rregullave PEM.
- Mbani dokumente të vleftshme për 3 vjet.
- Aplikimin bëheni në Doganën e Kosovës.

## P — Paketimi (shishet, ambalazhi)

- PET 200ml / 330ml / 500ml / 1L / 1.5L — më i lirë, më i lehtë.
- Qelq 250ml / 750ml — segment premium, bio, Hotel-Restaurant-Cafe.
- Tetra Pak — shkëlqyeshëm për eksport, i qëndrueshëm, pa zinxhir frigoriferik.
- **Direktiva e Paketimit (94/62/EC + 2018/852)** — kërkohet reciklueshmëria e paketimit dhe në disa vende (Gjermani, Austri) duhet regjistrimi në sistemet si DSD / ARA (Green Dot).
- Regjistrimi **LUCID** në Gjermani është i detyrueshëm përpara se të shisni njësinë e parë.

## Q — Qasja në treg (Market access)

- BE-ja: nuk ka kufij sasiorë, por kërkesa teknike të rrepta.
- Britania (UK): pas Brexit-it — kërkohet Importer i regjistruar UK dhe etiketë me adresë UK/NI.
- Zvicra: kërkohet përputhshmëri me Ligjin e Ushqimit (LMG).
- SHBA: kërkohet **FDA Food Facility Registration** + FSVP + etiketë FDA.
- Emiratet: **ESMA** + etiketimi arab.
- Shërbyeni nga një **konsulent lokal** për tregun e parë — 2000–5000€ është investim i ligjshëm.

## R — Rimbursimi i TVSH-së dhe taksat

- Eksporti nga Kosova është i përjashtuar nga TVSH (0%), ju kërkoni rimbursim për TVSH-në e materialeve të blera.
- Deklaroni çdo eksport në Doganat e Kosovës (ASYCUDA).
- Mbani dosje për 6 vjet sipas ligjit.

## S — Strategjia e markës

- Dizajn etikete profesional (Adobe Illustrator / Figma).
- Emri i markës i regjistrueshëm në EUIPO (~850€ për klasë Nice 32).
- Storytelling: "Mollët e Opojës", "Vishnjet e Rahovecit", "Bio nga Dukagjini".
- QR Code në etiketë → faqe me video, burim, certifikata.

## T — Teknologjia e përpunimit

- Shtypja e ftohtë (cold pressed) → segment premium.
- Pasterizim HTST 90–95°C / 15–30 s.
- Pakim aseptik (Tetra Pak) → jetëgjatësi 12 muaj jashtë frigoriferit.
- Kontroll i rendimentit të frutit (≥70% për mollë, ≥55% për vishnje).

## U — Udhëtimet e shitjes

- Vizitoni së paku 2 panaire në vit (Anuga + një i specializuar).
- Rezervoni stendë në pavijonin e KIESA-s (kostoja zakonisht 50% e subvencionuar).
- Përgatitni samplar (sample kit) në shishe 200ml, me fletushkë sq/en/de.

## V — Vlerësimi i distributorit

Para se të nënshkruani, kërkoni:
- Regjistrin tregtar (Handelsregister për DE/AT, Zefix për CH).
- Referencat e 2 markave që i distribuojnë aktualisht.
- Kontratën e magazinës dhe flotës së tyre.
- Dëshmi të një transaksioni të ngjashëm (proof of shipment).

## W — Wëbfaqja dhe marketingu dixhital

- Subdomain export.firmatjuaj.com me info për importues.
- Prezantim PDF në sq/en/de.
- Video 60 sekondëshe për linjën e prodhimit.
- LinkedIn Sales Navigator për B2B outreach.

## X — X-faktori: çfarë ju bën të ndryshëm

Prodhuesit Kosovarë që kanë sukses në eksport ndajnë disa tipare:
- Fokus në një produkt (p.sh. vetëm lëng malli apo smoothies bio).
- Kontroll të fortë të cilësisë — çdo batch analizohet.
- Flexibilitet në paketim (private label për supermarketet, brand vetjak për HORECA).
- Vizita personale te klientët në 60 ditët e para pas kontratës.

## Y — Yield & produktiviteti

Llogaritni çdo ditë:
- Kg frutë / L lëng të gatshëm (yield).
- L në orë (throughput).
- Ankthet (defekte) / 1000 shishe (OEE).
- Produktiviteti për punëtor (kosto e punës / L).

## Z — Zinxhiri i ftohtë dhe pas-shitjes

- Për lëng të pa-pasterizuar: 0–4°C në gjithë rrugëtimin.
- Bashkëpunoni me shpediterë me kontejnerë reefer (p.sh. Maersk Star Cool).
- Ofroni garanci 12 muaj për Tetra Pak, 9 muaj për PET.
- Mbani një kanal të shpejtë ankesash (email i dedikuar + WhatsApp Business).
- Rishqyrtoni kontratën çdo 12 muaj — rrisni çmimet me CPI ose me formulë materiale.

---

**Hap i parë i rekomanduar për ju sot:** rezervoni 2 orë, shkarkoni nga Access2Markets tarifën për kodin tuaj 2009.XX në Gjermani dhe Zvicër, dhe llogaritni çmimin tuaj CIF për një paletë EUR. Nëse marzhi neto ≥ 15% — vazhdoni me certifikimin IFS. Nëse jo — optimizoni koston para se të vazhdoni.`

const CONTENT_EN = `# Complete Export Guide for Fruit Juice & Beverage Producers (A–Z)

This guide is written specifically for Kosovar producers of fruit juices, nectars, soft drinks and energy beverages who want to export to the EU, Switzerland, the UK and beyond. Each section is a practical step from idea to the container leaving Hani i Elezit.

## A — Initial Market Analysis

Before investing in packaging or labelling, pick a target market. The most accessible markets for Kosovar juice makers are Germany, Austria, Switzerland, Italy, Sweden, the Nordics and the Albanian diaspora network.

- Study demand (100% natural, no added sugar, organic).
- Use Trade Map (ITC), Eurostat Comext, Access2Markets.
- Work out your FOB and CIF price before you ever talk to a buyer.

## B — Working with KIESA and Chambers

KIESA (Kosovo Investment and Enterprise Support Agency) and the Kosovo Chamber of Commerce offer:
- B2B matchmaking at international fairs.
- Co-funding for lab tests and labelling redesign.
- Guidance on the EU Stabilisation and Association Agreement.

## C — Required Certifications

Certifications open supermarket doors. Practical minimum:
- **HACCP** — mandatory in the EU.
- **ISO 22000** — food-safety management system.
- **IFS Food / BRCGS** — required by Lidl, Rewe, Coop, Migros.
- **Halal** — if you target Türkiye, UAE, Saudi Arabia.
- **EU Organic (EC 848/2018)** — if you claim "organic".
- **Kosher** — for the US and Israel.

## D — Trade Documentation

For every shipment you need:
- Commercial invoice (value, Incoterms, HS code).
- Packing list (pallet count, net/gross).
- CMR or Bill of Lading.
- Certificate of origin (EUR.1 for EU — gives you zero preferential tariff on most juices).
- Health certificate from AUV (Kosovo Food and Veterinary Agency).
- Lab-test certificate.
- Phytosanitary certificate if partially processed fruit is involved.

## E — Labelling under EU 1169/2011

Every label sold in the EU must show:
- Legal name ("100% apple juice from concentrate", "cherry nectar").
- Ingredient list with percentages for fruit.
- Net quantity in ml or L.
- "Best before" / "Use by" date.
- Storage conditions.
- Producer/importer name and EU address.
- Country of origin.
- Nutrition table per 100 ml.
- Allergens in bold.
- Language: the official language of the country of sale. Use trilingual (AL/EN/DE) labels for parallel export and diaspora.

## F — Product Formulation and Standards

- **Fruit Juice Directive 2001/112/EC** defines "juice", "juice from concentrate", "nectar", "fruit drink".
- 100% juice cannot contain added sugar.
- Nectars have minimum fruit content (25% for sour cherry, 50% for apple).
- Soft drinks are more permissive but added sugar is taxed in the UK, Ireland, Norway.

## G — Finding Customers

Practical channels:
- **Food fairs:** Anuga (Cologne, Oct, every 2 years), SIAL Paris, Gulfood Dubai, ISM, Biofach.
- **B2B platforms:** Alibaba Europe, Europages, Wer-liefert-was, Kompass.
- **Supermarket buyers:** Edeka, Rewe, Metro, Lidl, Coop Swiss, Migros, Spar.
- **Ethnic distributors:** Albanian-diaspora chains in Switzerland, Germany, Austria, Sweden.
- **Specialised brokers/importers:** LinkedIn Sales Navigator ("fruit juice importer Germany").

## H — Pricing and Cost Structure

Build a **cost sheet FOB + CIF**:
- Fruit or concentrate cost.
- Sugar / citric acid / preservatives (when allowed).
- Bottle (PET, glass), cap, label, shrink.
- Secondary packaging (tray, shrink, EUR pallet).
- Labour, energy, depreciation.
- Distributor margin (typically 15–25%).
- Transport from Prishtina to port (Durres, Rijeka, Thessaloniki, Koper).
- Port fees, customs, insurance.

## I — Incoterms to sign cleanly

Most-used Incoterms 2020 for beverages:
- **EXW** — buyer picks up.
- **FCA Prishtina** — you deliver to terminal.
- **FOB Durres/Rijeka** — you pay inland transport.
- **CIF Hamburg/Genoa** — you pay freight + insurance.
- **DAP / DDP** — DDP includes destination customs (highest price, highest risk).

## J — Legal: contracts

A distributor contract must cover:
- Exclusive / non-exclusive territory.
- Minimum annual volume.
- Payment terms (30/60/90 days).
- Quality warranty and spoilage policy.
- IP (brand, logo).
- Governing law and forum (ICC Vienna, Zurich, LCIA London).
- Force majeure and Incoterms.

## K — HS Code

Fruit juices: **2009** with sub-lines per fruit and concentrate status.
- 2009.71 / 2009.79 — Apple juice
- 2009.81 — Cranberry
- 2009.89 — Other / mixtures

Check preferential tariffs on Access2Markets — Kosovo usually benefits from **0%** duty in the EU for most 2009 lines.

## L — Logistics

- 40' container ≈ 20 EUR pallets of 1L PET.
- EUR pallet 80×120, max ~1400 × 1L bottles.
- Transport to Durres ~€200/cont., Rijeka ~€550, Hamburg truck direct ~€2200–2800.
- Use 2–3 forwarders (Ekspedita Express, DHL Global Forwarding, Kuehne+Nagel, Deugro).
- Carbonated drinks need ventilated containers out of direct sun.

## M — Production-line QA

- Validated pasteurisation (HTST/UHT) with recorder.
- Microbiology test per batch.
- Traceability — batch links to fruit lot and production date.
- Run a mock recall every 6 months.

## N — Food-safety limits

- Patulin ≤ 50 µg/kg (apple juice).
- Heavy metals: lead ≤ 0.05 mg/kg, cadmium ≤ 0.020 mg/kg.
- Pesticides: MRLs per EU 396/2005.
- BPA-free cans.
- pH < 4.6 for most fruit juices.

## O — Preferential Origin (EUR.1)

A EUR.1 certificate or invoice declaration from an authorised exporter gives you **zero tariff** on most juices in the EU. Make sure:
- Fruit/concentrate qualifies as originating under PEM rules.
- You keep proof for 3 years.
- You file at Kosovo Customs.

## P — Packaging

- PET 200/330/500ml/1L/1.5L — cheapest and lightest.
- Glass 250/750ml — premium, organic, HoReCa.
- Tetra Pak — excellent for export, ambient-stable.
- **Packaging Directive 94/62/EC + 2018/852** requires recyclability. Germany/Austria require Green Dot / ARA / LUCID registration before first sale.
- **LUCID** registration in Germany is mandatory.

## Q — Market Access

- EU: no quotas, strict technical rules.
- UK (post-Brexit): UK-based importer and UK/NI address on the label.
- Switzerland: LMG compliance.
- USA: FDA Food Facility Registration + FSVP + FDA-style label.
- UAE: ESMA + Arabic labelling.
- Hire a local consultant for the first market (€2k–5k is a legitimate investment).

## R — VAT and Taxes

- Exports from Kosovo are VAT-zero; reclaim input VAT.
- Declare every export in ASYCUDA (Kosovo Customs).
- Keep dossiers 6 years.

## S — Brand Strategy

- Professional label design (Illustrator / Figma).
- Register brand at EUIPO (~€850, Nice class 32).
- Storytelling: "Apples of Opoja", "Cherries of Rahovec", "Bio from Dukagjini".
- QR code on label → landing page with video, source, certificates.

## T — Processing Technology

- Cold pressed → premium segment.
- HTST 90–95 °C / 15–30 s pasteurisation.
- Aseptic fill (Tetra Pak) → 12 months ambient shelf-life.
- Fruit yield (≥70% apple, ≥55% sour cherry).

## U — Sales Travel

- At least 2 fairs per year (Anuga + one niche).
- Book a stand in the KIESA pavilion (often 50% subsidised).
- Prepare a 200 ml sample kit with a trilingual leaflet (sq/en/de).

## V — Vetting the Distributor

Before signing, request:
- Trade register (Handelsregister DE/AT, Zefix CH).
- Two references from brands they already carry.
- Warehouse and fleet contract.
- Proof of a similar past shipment.

## W — Website & Digital Marketing

- Subdomain export.yourfirm.com for importers.
- sq/en/de PDF sales kit.
- 60-second production-line video.
- LinkedIn Sales Navigator for B2B outreach.

## X — X-factor

Successful Kosovar exporters share:
- Focus on one product (one juice or one smoothies line).
- Strong QA — every batch tested.
- Packaging flexibility (private label for retail, branded for HoReCa).
- Personal on-site visits within 60 days of contract.

## Y — Yield & Productivity

Track daily:
- Kg fruit per L finished juice (yield).
- L per hour (throughput).
- Defects per 1000 bottles (OEE).
- Productivity per worker (labour cost per L).

## Z — Cold Chain and After-sales

- Unpasteurised juice: 0–4 °C end-to-end.
- Reefer-capable forwarders (Maersk Star Cool).
- Guarantee 12 months for Tetra Pak, 9 for PET.
- Dedicated complaint channel (email + WhatsApp Business).
- Re-negotiate yearly with a CPI- or raw-material-indexed formula.

---

**Recommended first step today:** block 2 hours, pull the import tariff for your 2009.XX code for Germany and Switzerland from Access2Markets, and compute your CIF price for one EUR pallet. If your net margin ≥ 15% — continue with IFS certification. If not — optimise cost before you move on.`

const CONTENT_DE = `# Kompletter Exportleitfaden für Fruchtsaft- und Getränkehersteller (A–Z)

Dieser Leitfaden richtet sich an kosovarische Hersteller von Fruchtsäften, Nektaren, Erfrischungsgetränken und Energy-Drinks, die in die EU, die Schweiz, Großbritannien und darüber hinaus exportieren möchten. Jeder Abschnitt ist ein praktischer Schritt — von der Idee bis zum Container, der Hani i Elezit verlässt.

## A — Marktanalyse

Bevor Sie in Verpackung oder Etikett investieren, wählen Sie einen Zielmarkt. Die leichtesten Märkte für kosovarische Säfte sind: Deutschland, Österreich, Schweiz, Italien, Schweden, Nordics und die albanische Diaspora.

- Nachfrage analysieren (100 % natürlich, ohne Zuckerzusatz, Bio).
- Trade Map (ITC), Eurostat Comext, Access2Markets verwenden.
- FOB- und CIF-Preis kalkulieren, bevor Sie mit Käufern sprechen.

## B — Zusammenarbeit mit KIESA und Kammern

KIESA (Kosovo Investment and Enterprise Support Agency) und die Handelskammer des Kosovo bieten:
- B2B-Matchmaking auf internationalen Messen.
- Kofinanzierung für Laboranalysen und Etikettenredesign.
- Beratung zum EU-Stabilisierungs- und Assoziierungsabkommen.

## C — Erforderliche Zertifizierungen

Zertifikate öffnen Supermarkttüren. Praktisches Minimum:
- **HACCP** — in der EU Pflicht.
- **ISO 22000** — Lebensmittelsicherheit.
- **IFS Food / BRCGS** — wird von Lidl, Rewe, Coop, Migros verlangt.
- **Halal** — für Türkei, VAE, Saudi-Arabien.
- **EU-Bio (VO 848/2018)** — wenn Sie "Bio" ausloben.
- **Kosher** — für USA und Israel.

## D — Handelsdokumentation

Für jede Sendung benötigen Sie:
- Handelsrechnung (Wert, Incoterms, HS-Code).
- Packliste (Palettenanzahl, Netto/Brutto).
- CMR oder Bill of Lading.
- Ursprungszeugnis (EUR.1 — 0 % Präferenzzoll für die meisten Säfte in der EU).
- Gesundheitszeugnis der AUV (kosovarische Lebensmittelbehörde).
- Laborzertifikat.
- Pflanzengesundheitszeugnis bei teilverarbeiteten Früchten.

## E — Kennzeichnung nach EU-VO 1169/2011

Jedes in der EU verkaufte Etikett muss enthalten:
- Gesetzliche Bezeichnung ("Apfelsaft aus Apfelsaftkonzentrat 100 %", "Kirschnektar").
- Zutatenliste mit Fruchtprozenten.
- Nettofüllmenge in ml/L.
- Mindesthaltbarkeits- oder Verbrauchsdatum.
- Lagerbedingungen.
- Name und EU-Anschrift des Herstellers/Importeurs.
- Ursprungsland.
- Nährwerttabelle pro 100 ml.
- Allergene in Fettschrift.
- Sprache: Amtssprache des Verkaufslandes. Mehrsprachige Etiketten (AL/EN/DE) für Diaspora und Parallelexport.

## F — Produktformulierung und Standards

- **Fruchtsaftrichtlinie 2001/112/EG** definiert "Saft", "Saft aus Konzentrat", "Nektar", "Fruchtgetränk".
- 100 %-Saft: kein Zuckerzusatz.
- Nektare: Mindestfruchtgehalt (25 % Sauerkirsche, 50 % Apfel).
- Erfrischungsgetränke: liberaler, aber Zuckersteuer in UK, Irland, Norwegen.

## G — Kunden finden

Kanäle:
- **Lebensmittelmessen:** Anuga (Köln, Okt., alle 2 Jahre), SIAL Paris, Gulfood Dubai, ISM, Biofach.
- **B2B-Plattformen:** Alibaba Europe, Europages, Wer-liefert-was, Kompass.
- **Supermarkt-Buyer:** Edeka, Rewe, Metro, Lidl, Coop CH, Migros, Spar.
- **Ethnische Distributoren:** albanische Diaspora-Ketten in CH, DE, AT, SE.
- **Fachbroker:** LinkedIn Sales Navigator ("fruit juice importer Germany").

## H — Preisbildung und Kostenstruktur

Erstellen Sie ein **Kostenblatt FOB + CIF**:
- Frucht- oder Konzentratkosten.
- Zucker / Zitronensäure / Konservierungsstoffe (sofern erlaubt).
- Flasche (PET, Glas), Verschluss, Etikett, Shrink.
- Sekundärverpackung (Tray, Shrink, EUR-Palette).
- Personal, Energie, Abschreibung.
- Händlermarge (15–25 %).
- Transport Prishtina → Hafen (Durres, Rijeka, Thessaloniki, Koper).
- Hafengebühren, Zoll, Versicherung.

## I — Saubere Incoterms

Gängigste Incoterms 2020 für Getränke:
- **EXW** — Käufer holt ab.
- **FCA Prishtina** — Lieferung zum Terminal.
- **FOB Durres/Rijeka** — Sie zahlen den Binnentransport.
- **CIF Hamburg/Genua** — Sie zahlen Fracht + Versicherung.
- **DAP / DDP** — DDP inkl. Einfuhrzoll (höchster Preis, höchstes Risiko).

## J — Rechtliches: Verträge

Ein Distributorvertrag sollte regeln:
- Gebiet (exklusiv / nicht-exklusiv).
- Jahresmindestmenge.
- Zahlungsziel (30/60/90 Tage).
- Qualitätsgewährleistung und Verderbspolitik.
- IP (Marke, Logo).
- Anwendbares Recht und Gerichtsstand (ICC Wien, Zürich, LCIA London).
- Force Majeure und Incoterms.

## K — HS-Code

Fruchtsäfte: **2009**, Unterpositionen je Frucht und Konzentratstatus.
- 2009.71 / 2009.79 — Apfelsaft
- 2009.81 — Preiselbeere
- 2009.89 — Sonstige / Mischungen

Access2Markets prüfen: Kosovo hat in der EU auf den meisten 2009-Linien **0 %** Zoll.

## L — Logistik

- 40-Fuß-Container ≈ 20 EUR-Paletten 1L-PET.
- EUR-Palette 80×120, max. ~1400 × 1L-Flaschen.
- Transport Durres ~200 €/Cont., Rijeka ~550 €, Hamburg LKW direkt ~2200–2800 €.
- 2–3 Spediteure (Ekspedita Express, DHL Global Forwarding, Kuehne+Nagel, Deugro).
- Kohlensäurehaltige Getränke: belüfteter Container, keine direkte Sonne.

## M — Qualitätssicherung in der Linie

- Validierte Pasteurisation (HTST/UHT) mit Recorder.
- Mikrobiologie je Batch.
- Rückverfolgbarkeit — Charge verbindet Fruchtcharge und Produktionsdatum.
- Mock Recall alle 6 Monate.

## N — Grenzwerte für Lebensmittelsicherheit

- Patulin ≤ 50 µg/kg (Apfelsaft).
- Schwermetalle: Blei ≤ 0,05 mg/kg, Cadmium ≤ 0,020 mg/kg.
- Pestizide: MRL nach VO 396/2005.
- BPA-frei bei Dosen.
- pH < 4,6 für die meisten Fruchtsäfte.

## O — Präferenzursprung (EUR.1)

EUR.1 oder Rechnungserklärung eines ermächtigten Ausführers verschaffen **0 % Zoll** in der EU. Voraussetzungen:
- Frucht/Konzentrat erfüllt PEM-Ursprungsregeln.
- Nachweise 3 Jahre archivieren.
- Antrag beim kosovarischen Zoll.

## P — Verpackung

- PET 200/330/500 ml/1L/1,5L — günstig und leicht.
- Glas 250/750 ml — Premium, Bio, HoReCa.
- Tetra Pak — ideal für Export, ambient-stabil.
- **Verpackungs-Richtlinie 94/62/EG + 2018/852**: Recyclingfähigkeit. DE/AT: Green Dot / ARA / LUCID-Registrierung vor dem ersten Verkauf.
- **LUCID**-Registrierung in Deutschland ist Pflicht.

## Q — Marktzugang

- EU: keine Quoten, strenge technische Vorgaben.
- UK (nach Brexit): UK-Importeur + UK/NI-Adresse auf dem Etikett.
- Schweiz: LMG-Konformität.
- USA: FDA Food Facility Registration + FSVP + FDA-Etikett.
- VAE: ESMA + arabisches Label.
- Lokalen Consultant für den ersten Markt engagieren (2–5 k € ist sinnvoll).

## R — USt und Steuern

- Exporte aus dem Kosovo sind steuerfrei (0 %); Vorsteuerrückerstattung nutzen.
- Jeden Export in ASYCUDA deklarieren.
- Unterlagen 6 Jahre aufbewahren.

## S — Markenstrategie

- Professionelles Etikettendesign (Illustrator / Figma).
- Marke beim EUIPO eintragen (~850 €, Nizza-Klasse 32).
- Storytelling: "Äpfel aus Opoja", "Kirschen aus Rahovec", "Bio aus Dukagjini".
- QR-Code auf dem Etikett → Landingpage mit Video, Herkunft, Zertifikaten.

## T — Verfahrenstechnik

- Kaltgepresst → Premium.
- Pasteurisation HTST 90–95 °C / 15–30 s.
- Aseptische Abfüllung (Tetra Pak) → 12 Monate Haltbarkeit bei Raumtemperatur.
- Fruchtausbeute (≥ 70 % Apfel, ≥ 55 % Sauerkirsche).

## U — Vertriebsreisen

- Mindestens 2 Messen/Jahr (Anuga + 1 Nische).
- Stand im KIESA-Pavillon buchen (oft 50 % Subvention).
- Sample-Kit 200 ml mit dreisprachigem Flyer (sq/en/de).

## V — Distributoren-Due-Diligence

Vor Unterzeichnung anfordern:
- Handelsregister (DE/AT) bzw. Zefix (CH).
- Zwei Referenzen aus dem aktuellen Portfolio.
- Lager- und Flottenverträge.
- Nachweis einer vergleichbaren früheren Sendung.

## W — Website & Digital-Marketing

- Subdomain export.ihrefirma.com für Importeure.
- PDF-Salespack in sq/en/de.
- 60-Sekunden-Produktionsvideo.
- LinkedIn Sales Navigator für B2B-Outreach.

## X — X-Faktor

Erfolgreiche kosovarische Exporteure teilen:
- Fokus auf ein Produkt.
- Starke QA — jede Charge geprüft.
- Verpackungsflexibilität (Handelsmarke + Eigenmarke).
- Persönliche Vor-Ort-Besuche in den ersten 60 Tagen nach Vertrag.

## Y — Yield & Produktivität

Täglich tracken:
- Kg Frucht pro L Saft (Yield).
- L pro Stunde (Durchsatz).
- Fehler pro 1000 Flaschen (OEE).
- Produktivität pro Mitarbeiter (Arbeitskosten/L).

## Z — Kühlkette & Aftersales

- Nicht pasteurisierter Saft: 0–4 °C durchgängig.
- Reefer-fähige Spediteure (Maersk Star Cool).
- 12 Monate Garantie Tetra Pak, 9 Monate PET.
- Eigenes Beschwerdemanagement (E-Mail + WhatsApp Business).
- Jährliche Neuverhandlung mit CPI- oder Materialformel.

---

**Empfohlener erster Schritt heute:** 2 Stunden blocken, auf Access2Markets den Einfuhrzoll Ihres 2009.XX-Codes für Deutschland und die Schweiz ziehen, und den CIF-Preis pro EUR-Palette kalkulieren. Nettomarge ≥ 15 % → IFS-Zertifizierung starten. Sonst erst Kosten optimieren.`

const SECTORS = ['Food & Beverage', 'Fruit Juices', 'Agriculture', 'Export']
const TAGS = ['a-to-z', 'fruit-juice', 'beverages', 'eu-export', 'certifications', 'incoterms']

async function main() {
  // Upsert by (country + titleEn) — we key on title uniqueness in code because
  // there's no natural unique index; look for existing row and update it.
  const existing = await prisma.exportGuide.findFirst({
    where: { country: 'EU', titleEn: TITLE_EN },
  })

  const data = {
    title: TITLE_EN,
    titleEn: TITLE_EN,
    titleSq: TITLE_SQ,
    titleDe: TITLE_DE,
    content: CONTENT_EN,
    contentEn: CONTENT_EN,
    contentSq: CONTENT_SQ,
    contentDe: CONTENT_DE,
    country: 'EU',
    sectors: SECTORS,
    tags: TAGS,
    isPublished: true,
  }

  if (existing) {
    await prisma.exportGuide.update({ where: { id: existing.id }, data })
    console.log('Updated fruit-juice export guide:', existing.id)
  } else {
    const created = await prisma.exportGuide.create({ data })
    console.log('Created fruit-juice export guide:', created.id)
  }
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1 })
  .finally(() => prisma.$disconnect())
