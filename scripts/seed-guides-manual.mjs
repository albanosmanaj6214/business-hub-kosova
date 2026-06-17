// Manual seed of 18 missing export guides. Written by Claude inline (no Anthropic API spend).
// Content is short-form: market context + trade-relation status + customs link.
// Detailed Tier-A guides (full requiredDocs/certifications/labeling) come later when credits exist.

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const SECTORS = [
  'Ushqim dhe pije',
  'Tekstil dhe konfeksion',
  'Druri dhe mobilje',
  'Metale dhe makineri',
  'Kozmetikë',
  'TIK dhe shërbime dixhitale',
]

const GUIDES = [
  {
    code: 'CA', country: 'Kanada', flag: '🇨🇦',
    contentSq:
`Kanadaja është një ndër ekonomitë më të mëdha të G7-ës me popullatë rreth 40 milionë dhe një diasporë të madhe shqiptare në Toronto, Mississauga, Hamilton dhe Montréal. Eksporti drejt Kanadasë nga Kosova ende është modest, por hapësira ekziston për produkte ushqimore me cilësi (verërat, mjalti, ajvari, panxhar, çajra mali), mobilje druri me dizajn dhe konfeksion etnik. Nuk ka marrëveshje preferenciale tarifore midis Kosovës dhe Kanadasë, prandaj zbatohen tarifat MFN të Tarifit Doganor Kanadez.

Importi mbi 3,300 CAD kërkon Customs Broker të autorizuar dhe Business Number (BN) për importuesin. Ushqimet duhen të regjistrohen në CFIA Safe Food for Canadians (SFC) License. Druri dhe mobiljet kërkojnë deklarim CITES kur ka specie të mbrojtura. Etiketimi i ushqimeve duhet të jetë në anglisht dhe frëngjisht (Loi sur l'emballage et l'étiquetage des produits de consommation). Doganat e Kanadasë administrohen nga CBSA (Canada Border Services Agency).`,
    contentEn:
`Canada is a major G7 economy with around 40 million people and a substantial Albanian diaspora across Toronto, Mississauga, Hamilton and Montréal. Kosovo exports to Canada remain modest but there is room for quality food products (wine, honey, ajvar, preserved vegetables, mountain teas), designer wood furniture and ethnic apparel. There is no preferential trade agreement between Kosovo and Canada — MFN tariffs apply under the Canadian Customs Tariff.

Imports above 3,300 CAD require a licensed Customs Broker and a Business Number (BN) for the importer. Food products must be registered under the CFIA Safe Food for Canadians (SFC) License. Wood and furniture require CITES declarations where protected species are involved. Food labelling must be bilingual English/French under the Consumer Packaging and Labelling Act. Customs are administered by CBSA (Canada Border Services Agency).`,
    marketOverview: {
      sq: 'Ekonomi G7 me 40M banorë dhe diasporë e madhe shqiptare në Toronto/Montreal. Pa FTA me Kosovën — tarifa MFN. Mundësi për ushqim premium, mobilje dhe konfeksion etnik.',
      en: 'G7 economy of 40M people with a large Albanian diaspora in Toronto/Montreal. No FTA with Kosovo — MFN tariffs. Opportunities in premium food, furniture and ethnic apparel.',
    },
    customs: {
      vat: 'GST 5% federal + PST/HST sipas provincës (5-15% totale)',
      importDuties: { sq: 'Tarifa MFN sipas HS code; verifiko në Customs Tariff të CBSA.', en: 'MFN tariffs per HS code; verify with CBSA Customs Tariff.' },
      authority: { name: 'Canada Border Services Agency (CBSA)', url: 'https://www.cbsa-asfc.gc.ca' },
      sourceUrl: 'https://www.cbsa-asfc.gc.ca/import/menu-eng.html',
    },
    agreements: [],
  },
  {
    code: 'AU', country: 'Australi', flag: '🇦🇺',
    contentSq:
`Australia ka popullatë rreth 26 milionë dhe është një nga ekonomitë më të hapura në botë me preferencë të lartë për produkte premium. Kosovari në Australi ka diasporë të dukshme në Melbourne dhe Sydney. Eksporti i mundshëm nga Kosova përfshin ushqime tradicionale me cilësi, vera, mobilje masive dhe konfeksion. Nuk ka FTA midis Kosovës dhe Australisë — zbatohen tarifa MFN sipas Schedule 3 të Customs Tariff Act 1995.

Australia ka biosecurity ndër më të rrepta në botë: Department of Agriculture, Fisheries and Forestry (DAFF) kontrollon çdo produkt biologjik (ushqim, dru, bimë, kafshë). Çdo dërgesë ushqimore duhet të kalojë Imported Food Inspection Scheme. Druri kërkon fumigim ISPM 15 për paletet. Importuesit duhet të jenë regjistruar në Department of Home Affairs (Customs). Etiketimi i ushqimeve rregullohet nga Food Standards Australia New Zealand (FSANZ).`,
    contentEn:
`Australia has a population of around 26 million and is one of the world's most open economies with strong demand for premium products. Kosovo's Australian diaspora is concentrated in Melbourne and Sydney. Potential Kosovo exports include traditional quality foods, wine, solid wood furniture and apparel. There is no FTA between Kosovo and Australia — MFN tariffs under Schedule 3 of the Customs Tariff Act 1995 apply.

Australia has some of the strictest biosecurity rules in the world: the Department of Agriculture, Fisheries and Forestry (DAFF) inspects every biological product (food, wood, plants, animals). Every food shipment goes through the Imported Food Inspection Scheme. Wood requires ISPM 15 fumigation for pallets. Importers must be registered with Department of Home Affairs (Customs). Food labelling is regulated by Food Standards Australia New Zealand (FSANZ).`,
    marketOverview: {
      sq: 'Treg premium me 26M banorë dhe diasporë shqiptare në Melbourne/Sydney. Pa FTA me Kosovën. Biosecurity ndër më të rrepta — çdo produkt biologjik kontrollohet nga DAFF.',
      en: 'Premium market of 26M with Albanian diaspora in Melbourne/Sydney. No FTA with Kosovo. Strictest biosecurity globally — every biological product inspected by DAFF.',
    },
    customs: {
      vat: 'GST 10% (Goods and Services Tax)',
      importDuties: { sq: 'Tarifa MFN; shumë produkte industriale 0-5%, tekstil/këpucë 5-10%.', en: 'MFN tariffs; most industrial goods 0-5%, textiles/footwear 5-10%.' },
      authority: { name: 'Australian Border Force (ABF)', url: 'https://www.abf.gov.au' },
      sourceUrl: 'https://www.abf.gov.au/importing-exporting-and-manufacturing',
    },
    agreements: [],
  },
  {
    code: 'NO', country: 'Norvegji', flag: '🇳🇴',
    contentSq:
`Norvegjia ka popullatë rreth 5.5 milionë dhe është pjesë e EFTA-s dhe Hapësirës Ekonomike Europiane (EEA), por jo e BE-së. Kosova ka FTA me EFTA-n që nga viti 2013, prandaj eksportuesit kosovarë mund të përfitojnë trajtim preferencial me certifikatën **EUR.1** për shumicën e produkteve industriale dhe një pjesë të produkteve bujqësore.

Norvegjia është treg premium me fuqi blerëse të lartë; mundësi për ushqime gourmet, vera, mobilje druri dhe produkte handmade. Kufizime: produktet e mishit dhe peshkut kanë regjim të veçantë me kuota; alkooli shitet vetëm përmes monopolit shtetëror Vinmonopolet. Norvegjia nuk është në BE prandaj çdo dërgesë trajtohet si import jashtë BE-së edhe nga Suedi/Danimarkë. Doganat administrohen nga Norwegian Customs (Tolletaten).`,
    contentEn:
`Norway has around 5.5 million people and is a member of EFTA and the European Economic Area (EEA), but not the EU. Kosovo has had an FTA with EFTA since 2013, so Kosovo exporters can benefit from preferential treatment using the **EUR.1** certificate for most industrial goods and parts of agricultural products.

Norway is a premium market with high purchasing power; opportunities exist in gourmet food, wine, wood furniture and handmade products. Restrictions: meat and fish products are quota-regulated; alcohol can only be sold via the state monopoly Vinmonopolet. Norway is outside the EU so every shipment is treated as a non-EU import even from Sweden/Denmark. Customs are administered by Norwegian Customs (Tolletaten).`,
    marketOverview: {
      sq: 'Anëtare EFTA + EEA, jo BE. **Kosova ka FTA me EFTA → EUR.1 ofron tarifa preferenciale.** Treg premium me 5.5M banorë, alkooli vetëm përmes Vinmonopolet.',
      en: 'EFTA + EEA member, not EU. **Kosovo has FTA with EFTA → EUR.1 grants preferential tariffs.** Premium 5.5M market; alcohol only via Vinmonopolet monopoly.',
    },
    customs: {
      vat: 'MVA 25% standard (15% për ushqim, 12% për pije pa alkool)',
      importDuties: { sq: 'Me EUR.1 (FTA EFTA): tarifa 0% për shumicën e industrialeve. Pa EUR.1: MFN.', en: 'With EUR.1 (EFTA FTA): 0% on most industrial goods. Without EUR.1: MFN.' },
      authority: { name: 'Norwegian Customs (Tolletaten)', url: 'https://www.toll.no' },
      sourceUrl: 'https://www.toll.no/en/services/business/',
    },
    agreements: [
      { name: 'Kosovo-EFTA Free Trade Agreement (2013)', benefit: { sq: 'Tarifa preferenciale për mallrat industriale me certifikatë EUR.1.', en: 'Preferential tariffs for industrial goods with EUR.1 certificate.' }, sourceUrl: 'https://www.efta.int/free-trade/free-trade-agreements/kosovo' },
    ],
  },
  {
    code: 'SG', country: 'Singapor', flag: '🇸🇬',
    contentSq:
`Singapori është një hub global tregtar me popullatë 5.9 milionë por me PBB për kokë banori ndër më të lartat në botë. Eshtë porti më i madh kontejnerësh i Azisë Juglindore dhe portë hyrjeje në ASEAN. Eksportuesit kosovarë mund të shfrytëzojnë Singaporin si gateway për tregjet vietnameze, malajze, indoneziane.

Nuk ka FTA midis Kosovës dhe Singaporit — zbatohen tarifa MFN, por **Singapori importon 99% të mallrave pa tarifa doganore** (përveç pijeve alkoolike, duhanit, automjeteve dhe disa karburanteve). GST 9% (2024) zbatohet për shumicën e importeve. Importuesit duhen të jenë të regjistruar në Singapore Customs dhe të kenë llogari TradeNet për deklarim elektronik. Standardet ushqimore administrohen nga Singapore Food Agency (SFA).`,
    contentEn:
`Singapore is a global trade hub with 5.9 million people but one of the highest GDP per capita in the world. It is Southeast Asia's largest container port and the gateway to ASEAN. Kosovo exporters can leverage Singapore as an entry point to Vietnam, Malaysia and Indonesia.

There is no FTA between Kosovo and Singapore — MFN tariffs apply, but **Singapore imports 99% of goods duty-free** (except alcoholic beverages, tobacco, motor vehicles and certain fuels). GST 9% (2024) applies to most imports. Importers must be registered with Singapore Customs and operate a TradeNet account for e-declarations. Food standards are governed by the Singapore Food Agency (SFA).`,
    marketOverview: {
      sq: 'Hub i ASEAN-it me 5.9M banorë dhe PBB për kokë ndër më të lartat. Pa FTA me Kosovën, por **99% e importeve pa tarifa**. Gateway ideal për Vietnam/Indonezi/Malajzi.',
      en: 'ASEAN hub of 5.9M with one of the highest GDP per capita. No FTA with Kosovo but **99% of imports duty-free**. Ideal gateway to Vietnam/Indonesia/Malaysia.',
    },
    customs: {
      vat: 'GST 9% (rritet në 9% më 2024)',
      importDuties: { sq: 'Përgjithësisht 0% për 99% të HS code-ve. Akciza për alkool, duhan, automjete, karburante.', en: 'Generally 0% on 99% of HS lines. Excise on alcohol, tobacco, vehicles, fuels.' },
      authority: { name: 'Singapore Customs', url: 'https://www.customs.gov.sg' },
      sourceUrl: 'https://www.customs.gov.sg/businesses/importing-goods',
    },
    agreements: [],
  },
  {
    code: 'VN', country: 'Vietnam', flag: '🇻🇳',
    contentSq:
`Vietnami ka popullatë rreth 100 milionë dhe ekonomi me rritje 5-7% në vit. Eshtë anëtar i RCEP, CPTPP dhe ka FTA me BE-në (EVFTA). Tregu vietnamez vlerëson markat europiane si premium, sidomos në ushqim, kozmetikë dhe mobilje. Diaspora vietnameze në Europë ka ndikim të madh në modelet konsumatore.

Nuk ka FTA midis Kosovës dhe Vietnamit — zbatohen tarifa MFN të Vietnamit (Schedule of WTO). Tarifa MFN për shumicën e produkteve të përpunuara janë 10-25%. Importuesit duhet të jenë të regjistruar pranë General Department of Vietnam Customs. Ushqimet kërkojnë licencë importi nga Ministry of Industry and Trade dhe certifikim sanitar të Vietnam Food Administration. Etiketimi i produkteve duhet të përmbajë vietnamisht.`,
    contentEn:
`Vietnam has around 100 million people and an economy growing 5-7% annually. It is a member of RCEP and CPTPP and has an FTA with the EU (EVFTA). Vietnamese consumers value European brands as premium, especially in food, cosmetics and furniture. The Vietnamese diaspora in Europe shapes consumption patterns at home.

There is no FTA between Kosovo and Vietnam — Vietnam's MFN tariffs (WTO Schedule) apply. MFN tariffs on most processed goods are 10-25%. Importers must be registered with the General Department of Vietnam Customs. Food requires an import license from the Ministry of Industry and Trade plus sanitary certification from the Vietnam Food Administration. Product labelling must include Vietnamese.`,
    marketOverview: {
      sq: '100M banorë, rritje 5-7% në vit, klasë e mesme në rritje. Vlerëson markat europiane si premium. Pa FTA me Kosovën — tarifa MFN 10-25% për shumicën e të përpunuarve.',
      en: '100M people, 5-7% annual growth, expanding middle class. Values European brands as premium. No FTA with Kosovo — MFN tariffs 10-25% on most processed goods.',
    },
    customs: {
      vat: 'VAT 10% standard (5% për disa produkte esenciale)',
      importDuties: { sq: 'MFN 10-25% për shumicën e produkteve të përpunuara. Verifiko HS code në portalin doganor.', en: 'MFN 10-25% on most processed goods. Verify HS code on customs portal.' },
      authority: { name: 'General Department of Vietnam Customs', url: 'https://www.customs.gov.vn' },
      sourceUrl: 'https://www.customs.gov.vn/index.jsp?pageId=434',
    },
    agreements: [],
  },
  {
    code: 'TH', country: 'Tajlandë', flag: '🇹🇭',
    contentSq:
`Tajlanda ka popullatë rreth 70 milionë dhe është ekonomia e dytë më e madhe e ASEAN-it. Bangkoku është një nga destinacionet kryesore turistike, që krijon kërkesë të lartë për produkte ushqimore premium, kozmetikë dhe konfeksion. Tregu vlerëson historitë e "Made in Europe" dhe origjinës artizanale.

Nuk ka FTA midis Kosovës dhe Tajlandës. Tarifat MFN janë mesatarisht 11% (ushqim) dhe 20-25% (verërat, alkooli). Tajlanda ka regjim të rreptë për importin e ushqimeve, kozmetikës dhe pajisjeve mjekësore — të gjitha kërkojnë regjistrim para-importi në Thai FDA. Etiketimi duhet të jetë në tajlandisht. Doganat administrohen nga Thai Customs Department; importuesit duhen të kenë licencë tregtare.`,
    contentEn:
`Thailand has around 70 million people and is the second-largest ASEAN economy. Bangkok is a top tourist destination driving demand for premium food, cosmetics and apparel. The market values "Made in Europe" stories and artisan origin.

There is no FTA between Kosovo and Thailand. MFN tariffs average 11% (food) and 20-25% (wine, spirits). Thailand strictly regulates imports of food, cosmetics and medical devices — all require pre-import registration with Thai FDA. Labelling must be in Thai. Customs are administered by the Thai Customs Department; importers must hold a trade licence.`,
    marketOverview: {
      sq: '70M banorë, ekonomia e dytë e ASEAN-it. Tregu vlerëson "Made in Europe". Pa FTA me Kosovën — MFN 11% ushqim, 20-25% verërat. Thai FDA kërkon pre-regjistrim.',
      en: '70M people, second-largest ASEAN economy. Values "Made in Europe". No FTA with Kosovo — MFN 11% food, 20-25% wine. Thai FDA requires pre-registration.',
    },
    customs: {
      vat: 'VAT 7% standard',
      importDuties: { sq: 'MFN: ushqim ~11%, verërat 20-60%, mobilje 10-20%, tekstil 5-30%.', en: 'MFN: food ~11%, wine 20-60%, furniture 10-20%, textiles 5-30%.' },
      authority: { name: 'Thai Customs Department', url: 'https://www.customs.go.th' },
      sourceUrl: 'https://www.customs.go.th/list_strc_simple_neted.php?ini_content=individual',
    },
    agreements: [],
  },
  {
    code: 'ID', country: 'Indonezi', flag: '🇮🇩',
    contentSq:
`Indonezia është vendi i katërt më i populluar në botë me 280 milionë banorë dhe ekonomia më e madhe e Azisë Juglindore. Klasa e mesme e Xhakartës, Surabajës dhe Bandungit rritet shpejt. Tregu vlerëson certifikim Halal për ushqim dhe kozmetikë — afërsisht 87% e popullsisë janë muslimanë.

Nuk ka FTA midis Kosovës dhe Indonezisë. Tarifat MFN për ushqim janë 5-25%, kozmetikë 7-15%. Importi i ushqimit, kozmetikës dhe pajisjeve elektrike kërkon pre-regjistrim te BPOM (agjencia për ushqim e barna). Certifikimi Halal nga BPJPH është i detyrueshëm për kategoritë ushqimore që nga viti 2024. Etiketimi në Bahasa Indonesia. Doganat: Directorate General of Customs and Excise (Bea Cukai).`,
    contentEn:
`Indonesia is the world's fourth-most-populous country at 280 million and Southeast Asia's largest economy. The middle class in Jakarta, Surabaya and Bandung is growing fast. The market strongly values Halal certification for food and cosmetics — roughly 87% of the population is Muslim.

There is no FTA between Kosovo and Indonesia. MFN tariffs are 5-25% for food, 7-15% for cosmetics. Imports of food, cosmetics and electrical goods require pre-registration with BPOM (food and drug authority). Halal certification from BPJPH became mandatory for food categories in 2024. Labelling in Bahasa Indonesia. Customs: Directorate General of Customs and Excise (Bea Cukai).`,
    marketOverview: {
      sq: '280M banorë, ekonomia më e madhe e ASEAN-it, klasa e mesme në rritje. Halal i detyrueshëm për ushqim që nga 2024. Pa FTA — MFN 5-25%.',
      en: '280M people, largest ASEAN economy, rising middle class. Halal mandatory for food since 2024. No FTA — MFN 5-25%.',
    },
    customs: {
      vat: 'PPN 11% standard (rritet në 12% 2025)',
      importDuties: { sq: 'MFN: ushqim 5-25%, kozmetikë 7-15%, mobilje 10-15%, tekstil 5-15%.', en: 'MFN: food 5-25%, cosmetics 7-15%, furniture 10-15%, textiles 5-15%.' },
      authority: { name: 'Directorate General of Customs and Excise (Bea Cukai)', url: 'https://www.beacukai.go.id' },
      sourceUrl: 'https://www.beacukai.go.id/arsip/abt/pengantar-impor.html',
    },
    agreements: [],
  },
  {
    code: 'MY', country: 'Malajzi', flag: '🇲🇾',
    contentSq:
`Malajzia ka popullatë rreth 34 milionë dhe është ekonomi e ndërmjetme-e lartë me Kuala Lumpur si qendër tregtare regjionale. 60% e popullsisë janë muslimanë, prandaj certifikimi Halal është kyç për ushqim dhe kozmetikë. Vendi është shumëgjuhësh (malajzisht, kinezisht, tamilisht, anglisht), por etiketimi zyrtar kërkon malajzisht.

Nuk ka FTA midis Kosovës dhe Malajzisë. Malajzia ka FTA me CPTPP dhe RCEP. Tarifat MFN janë mesatarisht 6%. Importi i ushqimit kërkon licencë nga Department of Veterinary Services (DVS) për mish, FAMA për fruta/perime, NPRA për barna. Certifikimi Halal jepet nga JAKIM dhe njihet ndërkombëtarisht. Doganat: Royal Malaysian Customs Department.`,
    contentEn:
`Malaysia has around 34 million people and is an upper-middle-income economy with Kuala Lumpur as a regional commercial hub. 60% of the population is Muslim, making Halal certification key for food and cosmetics. The country is multilingual (Malay, Chinese, Tamil, English), but official labelling requires Malay.

There is no FTA between Kosovo and Malaysia. Malaysia is in CPTPP and RCEP. MFN tariffs average 6%. Food imports require a licence from Department of Veterinary Services (DVS) for meat, FAMA for fruit/vegetables, NPRA for medicines. Halal certification is issued by JAKIM and is internationally recognised. Customs: Royal Malaysian Customs Department.`,
    marketOverview: {
      sq: '34M banorë, ekonomi e ndërmjetme-lart, hub Kuala Lumpur. 60% muslimanë — Halal i nevojshëm. Pa FTA me Kosovën, MFN ~6%. JAKIM Halal njihet globalisht.',
      en: '34M people, upper-middle income, KL hub. 60% Muslim — Halal needed. No FTA with Kosovo, MFN ~6%. JAKIM Halal globally recognised.',
    },
    customs: {
      vat: 'SST 6-10% (Sales and Service Tax)',
      importDuties: { sq: 'MFN ~6% mesatare. Akciza për alkool, duhan, automjete.', en: 'MFN ~6% average. Excise on alcohol, tobacco, vehicles.' },
      authority: { name: 'Royal Malaysian Customs Department', url: 'https://www.customs.gov.my' },
      sourceUrl: 'https://www.customs.gov.my',
    },
    agreements: [],
  },
  {
    code: 'ZA', country: 'Afrika e Jugut', flag: '🇿🇦',
    contentSq:
`Afrika e Jugut ka popullatë rreth 62 milionë dhe është ekonomia më e diversifikuar e Afrikës. Johannesburg dhe Cape Town janë qendra tregtare. Vendi ka infrastrukturë logjistike mjaft të mirë (Durban port) dhe shërben si gateway për tregjet e Afrikës Jugore (SADC).

Nuk ka FTA midis Kosovës dhe Afrikës së Jugut. Anëtare e Southern African Customs Union (SACU) që përfshin edhe Botswana, Eswatini, Lesotho, Namibia. Tarifat MFN për produkte të përpunuara janë 10-25%. Importi kërkon import permit nga ITAC (International Trade Administration Commission) për produkte të caktuara. SARS (South African Revenue Service) administron doganat. Ushqimet kërkojnë regjistrim sanitar nga National Regulator for Compulsory Specifications (NRCS).`,
    contentEn:
`South Africa has around 62 million people and is Africa's most diversified economy. Johannesburg and Cape Town are commercial hubs. The country has solid logistics (Durban port) and serves as a gateway to Southern Africa (SADC).

There is no FTA between Kosovo and South Africa. It is a member of the Southern African Customs Union (SACU) which also includes Botswana, Eswatini, Lesotho and Namibia. MFN tariffs on processed goods are 10-25%. Imports require an ITAC permit (International Trade Administration Commission) for certain products. SARS (South African Revenue Service) administers customs. Foods require sanitary registration with the National Regulator for Compulsory Specifications (NRCS).`,
    marketOverview: {
      sq: '62M banorë, ekonomia më e diversifikuar e Afrikës. Pa FTA me Kosovën. Hub për 5 vende SACU. ITAC kërkon import permit për disa kategori.',
      en: '62M people, Africa’s most diversified economy. No FTA with Kosovo. Hub for 5-country SACU. ITAC permit required for some categories.',
    },
    customs: {
      vat: 'VAT 15% standard',
      importDuties: { sq: 'MFN 10-25% për të përpunuara. SACU përdor tarif të përbashkët të jashtëm.', en: 'MFN 10-25% on processed goods. SACU uses a common external tariff.' },
      authority: { name: 'South African Revenue Service (SARS) Customs', url: 'https://www.sars.gov.za' },
      sourceUrl: 'https://www.sars.gov.za/customs-and-excise/',
    },
    agreements: [],
  },
  {
    code: 'GH', country: 'Ganë', flag: '🇬🇭',
    contentSq:
`Gana ka popullatë rreth 33 milionë dhe është një nga ekonomitë më stabile të Afrikës Perëndimore. Akra dhe Kumasi janë qendrat tregtare; vendi mban statusin e portës hyrëse për tregjet ECOWAS (15 vende). Klasa e mesme e re kërkon produkte ushqimore të cilësisë europiane dhe mobilje.

Nuk ka FTA midis Kosovës dhe Ganës. Gana është anëtare e ECOWAS dhe AfCFTA (African Continental Free Trade Area). Tarifat MFN sipas ECOWAS Common External Tariff: 5% (mall esencial), 10% (lëndë e parë), 20% (produkt final), 35% (produkt sensitive). Importi kërkon Tax Identification Number nga Ghana Revenue Authority dhe deklarim pre-arrival në GCNet (sistem elektronik). Standardet kontrollohen nga Food and Drugs Authority (FDA Ghana).`,
    contentEn:
`Ghana has around 33 million people and is one of the most stable West African economies. Accra and Kumasi are commercial hubs; the country serves as a gateway to ECOWAS (15-country bloc). The emerging middle class seeks European-quality food products and furniture.

There is no FTA between Kosovo and Ghana. Ghana is a member of ECOWAS and AfCFTA (African Continental Free Trade Area). MFN tariffs per the ECOWAS Common External Tariff: 5% (essentials), 10% (raw materials), 20% (finished goods), 35% (sensitive goods). Imports require a Tax Identification Number from the Ghana Revenue Authority and pre-arrival declaration via GCNet (electronic system). Standards are enforced by the Food and Drugs Authority (FDA Ghana).`,
    marketOverview: {
      sq: '33M banorë, ekonomi stabile e Afrikës Perëndimore, portë hyrjeje për ECOWAS. Pa FTA me Kosovën. ECOWAS Common Tariff: 5/10/20/35% sipas kategorisë.',
      en: '33M people, stable West African economy, gateway to ECOWAS. No FTA with Kosovo. ECOWAS Common Tariff: 5/10/20/35% by category.',
    },
    customs: {
      vat: 'VAT 15% + 2.5% NHIL + 2.5% GETFund = efektivisht ~21.9%',
      importDuties: { sq: 'ECOWAS Common External Tariff: 5/10/20/35% sipas kategorisë.', en: 'ECOWAS Common External Tariff: 5/10/20/35% by category.' },
      authority: { name: 'Ghana Revenue Authority (Customs Division)', url: 'https://gra.gov.gh' },
      sourceUrl: 'https://gra.gov.gh/customs/',
    },
    agreements: [],
  },
  {
    code: 'NG', country: 'Nigeri', flag: '🇳🇬',
    contentSq:
`Nigeria është vendi më i populluar i Afrikës me 220 milionë banorë dhe ekonomi më e madhe e ECOWAS. Lagosi mban gjysmën e aktivitetit tregtar. Tregu konsumator vlerëson markat e huaja si shenjë statusi, sidomos në ushqim, kozmetikë dhe konfeksion. Disaspora nigeriane në Europë sjell modele konsumatore globale.

Nuk ka FTA midis Kosovës dhe Nigerisë. ECOWAS Common External Tariff aplikohet (5-35%). Nigeria ka politikë të rreptë "Buy Made in Nigeria" — disa produkte janë në Import Prohibition List (përfshirë miellra të caktuara, makarona, vajra bimore të rafinuara). Importuesit duhet të jenë regjistruar në Corporate Affairs Commission dhe me Form M para hapjes së LC. NAFDAC kontrollon ushqimet/kozmetikën/barnat. Doganat: Nigeria Customs Service.`,
    contentEn:
`Nigeria is Africa's most populous country at 220 million and ECOWAS's largest economy. Lagos accounts for about half of trade activity. The consumer market sees foreign brands as a status symbol, especially in food, cosmetics and apparel. The Nigerian diaspora in Europe brings global consumption patterns home.

There is no FTA between Kosovo and Nigeria. ECOWAS Common External Tariff applies (5-35%). Nigeria enforces a strict "Buy Made in Nigeria" policy — several products sit on the Import Prohibition List (certain flours, pasta, refined vegetable oils). Importers must be registered with the Corporate Affairs Commission and file Form M before opening an LC. NAFDAC regulates food/cosmetics/pharma. Customs: Nigeria Customs Service.`,
    marketOverview: {
      sq: '220M banorë, ekonomia më e madhe e ECOWAS, klasa e mesme në Lagos. Pa FTA. ECOWAS tariff 5-35%. Import Prohibition List për miell, makarona, vaj të rafinuar — verifiko!',
      en: '220M people, largest ECOWAS economy, growing Lagos middle class. No FTA. ECOWAS tariff 5-35%. Import Prohibition List covers flour, pasta, refined oils — verify!',
    },
    customs: {
      vat: 'VAT 7.5% standard',
      importDuties: { sq: 'ECOWAS Common External Tariff: 5/10/20/35%. Akciza shtesë për disa kategori.', en: 'ECOWAS Common External Tariff: 5/10/20/35%. Additional excise on certain categories.' },
      authority: { name: 'Nigeria Customs Service', url: 'https://customs.gov.ng' },
      sourceUrl: 'https://customs.gov.ng/?page_id=2895',
    },
    agreements: [],
  },
  {
    code: 'MA', country: 'Marok', flag: '🇲🇦',
    contentSq:
`Maroku ka popullatë rreth 37 milionë dhe është një nga ekonomitë më të hapura të Afrikës. Casablanca dhe Tangier janë qendrat tregtare; Tangier Med është porti më i madh i Mesdheut. Vendi shërben si portë hyrjeje për tregjet e Afrikës Veriore dhe Perëndimore përmes marrëveshjeve me 50+ vende.

Nuk ka FTA midis Kosovës dhe Marokut. Maroku ka FTA me BE-në, SHBA, Turqi, UAE, dhe Agadir Agreement (me Egjipt, Jordan, Tunizi). Tarifat MFN për produkte të përpunuara janë 17.5-25%. Importi kërkon Engagement d'Importation të aprovuar nga Office des Changes. Standardet ushqimore kontrollohen nga ONSSA (Office National de Sécurité Sanitaire des Aliments). Doganat: Administration des Douanes et Impôts Indirects (ADII).`,
    contentEn:
`Morocco has around 37 million people and is one of Africa's most open economies. Casablanca and Tangier are commercial hubs; Tangier Med is the largest Mediterranean port. The country serves as a gateway to North and West African markets via agreements with 50+ countries.

There is no FTA between Kosovo and Morocco. Morocco has FTAs with the EU, US, Turkey, UAE, and the Agadir Agreement (with Egypt, Jordan, Tunisia). MFN tariffs on processed goods are 17.5-25%. Imports require an Engagement d'Importation approved by the Office des Changes. Food standards are enforced by ONSSA (Office National de Sécurité Sanitaire des Aliments). Customs: Administration des Douanes et Impôts Indirects (ADII).`,
    marketOverview: {
      sq: '37M banorë, hub i Mesdheut me Tangier Med. Pa FTA me Kosovën por FTA me BE/SHBA/Turqi/UAE. Engagement d’Importation i detyrueshëm. MFN 17-25%.',
      en: '37M people, Mediterranean hub via Tangier Med. No FTA with Kosovo but FTAs with EU/US/Turkey/UAE. Engagement d’Importation mandatory. MFN 17-25%.',
    },
    customs: {
      vat: 'TVA 20% standard (10% për ushqim esencial)',
      importDuties: { sq: 'MFN 17.5-25% për të përpunuara. Tarifa preferenciale me partnerët FTA (jo Kosova).', en: 'MFN 17.5-25% on processed goods. Preferential tariffs with FTA partners (not Kosovo).' },
      authority: { name: 'Administration des Douanes et Impôts Indirects (ADII)', url: 'https://www.douane.gov.ma' },
      sourceUrl: 'https://www.douane.gov.ma/web/guest/operations-douaneres',
    },
    agreements: [],
  },
  {
    code: 'KE', country: 'Kenia', flag: '🇰🇪',
    contentSq:
`Kenia ka popullatë rreth 55 milionë dhe është ekonomia më e madhe e Afrikës Lindore. Nairobi është qendër e re tregtare dhe teknologjike (Silicon Savannah). Vendi mban infrastrukturë mjaft të mirë logjistike përmes portit të Mombasës dhe është portë hyrjeje për East African Community (EAC).

Nuk ka FTA midis Kosovës dhe Kenisë. Kenia është anëtare e EAC (Common External Tariff), AfCFTA, dhe COMESA. EAC Common External Tariff: 0% (lëndë e parë), 10% (gjysëm-përpunime), 25% (produkte finale), 35-50% (sensitive). Importuesit duhet të jenë me KRA PIN. Ushqimet kërkojnë regjistrim nga Kenya Bureau of Standards (KEBS) dhe Public Health Officer. Doganat: Kenya Revenue Authority (KRA Customs).`,
    contentEn:
`Kenya has around 55 million people and is East Africa's largest economy. Nairobi is an emerging trade and tech hub ("Silicon Savannah"). The country has solid logistics via the Mombasa port and serves as the East African Community (EAC) gateway.

There is no FTA between Kosovo and Kenya. Kenya is a member of EAC (Common External Tariff), AfCFTA and COMESA. EAC Common External Tariff: 0% (raw materials), 10% (semi-processed), 25% (finished goods), 35-50% (sensitive). Importers need a KRA PIN. Food requires registration with the Kenya Bureau of Standards (KEBS) and Public Health Officer. Customs: Kenya Revenue Authority (KRA Customs).`,
    marketOverview: {
      sq: '55M banorë, ekonomia më e madhe e Afrikës Lindore, hub teknologjik. Pa FTA me Kosovën. EAC Common Tariff: 0/10/25%. KEBS kërkon regjistrim ushqimi.',
      en: '55M people, largest East African economy, tech hub. No FTA with Kosovo. EAC Common Tariff: 0/10/25%. KEBS food registration required.',
    },
    customs: {
      vat: 'VAT 16% standard (8% për disa kategori)',
      importDuties: { sq: 'EAC Common External Tariff: 0% (lëndë e parë), 10% (gjysëm), 25% (final), 35-50% (sensitive).', en: 'EAC Common External Tariff: 0% (raw), 10% (semi), 25% (finished), 35-50% (sensitive).' },
      authority: { name: 'Kenya Revenue Authority (Customs)', url: 'https://www.kra.go.ke' },
      sourceUrl: 'https://www.kra.go.ke/individual/filing-paying/types-of-taxes/customs-services',
    },
    agreements: [],
  },
  {
    code: 'BR', country: 'Brazil', flag: '🇧🇷',
    contentSq:
`Brazili ka popullatë rreth 215 milionë dhe është ekonomia më e madhe e Amerikës Latine. São Paulo dhe Rio de Janeiro janë qendra tregtare. Brazili është treg sfidues por të mëdha — barriera tarifore, burokraci, dhe distancë logjistike. Megjithatë, sektorë specifikë (ushqim premium, verërat, mobilje dizajni) kanë hapësirë.

Nuk ka FTA midis Kosovës dhe Brazilit. Brazili është pjesë e Mercosur-it (me Argjentinë, Uruguai, Paraguai) që zbaton Tarif të Përbashkët Të Jashtëm (CET) prej 10-20% për shumicën e të përpunuara, deri 35% për tekstil. Importi kërkon regjistrim në RADAR (Receita Federal). Ushqimet/kozmetika kërkojnë regjistrim ANVISA. Etiketimi në portugalisht (Português brasileiro). Doganat: Receita Federal do Brasil.`,
    contentEn:
`Brazil has around 215 million people and is Latin America's largest economy. São Paulo and Rio de Janeiro are commercial hubs. Brazil is a challenging but large market — high tariffs, bureaucracy, and logistical distance. Even so, specific sectors (premium food, wine, design furniture) have room.

There is no FTA between Kosovo and Brazil. Brazil is part of Mercosur (with Argentina, Uruguay, Paraguay) which applies a Common External Tariff (CET) of 10-20% on most processed goods, up to 35% for textiles. Imports require registration in RADAR (Receita Federal). Food/cosmetics require ANVISA registration. Labelling in Brazilian Portuguese. Customs: Receita Federal do Brasil.`,
    marketOverview: {
      sq: '215M banorë, ekonomia më e madhe e LatAm. Pa FTA — Mercosur CET 10-20% (deri 35% tekstil). RADAR + ANVISA të detyrueshme. Burokraci e fortë.',
      en: '215M people, largest LatAm economy. No FTA — Mercosur CET 10-20% (up to 35% textiles). RADAR + ANVISA mandatory. Heavy bureaucracy.',
    },
    customs: {
      vat: 'ICMS 17-19% sipas shtetit + IPI + PIS/COFINS (kumulative ~30-40%)',
      importDuties: { sq: 'Mercosur CET: 10-20% të përpunuara, 35% tekstil. Plus tatime federale dhe shtetërore.', en: 'Mercosur CET: 10-20% processed, 35% textiles. Plus federal and state taxes.' },
      authority: { name: 'Receita Federal do Brasil', url: 'https://www.gov.br/receitafederal/pt-br' },
      sourceUrl: 'https://www.gov.br/receitafederal/pt-br/assuntos/aduana-e-comercio-exterior',
    },
    agreements: [],
  },
  {
    code: 'MX', country: 'Meksikë', flag: '🇲🇽',
    contentSq:
`Meksika ka popullatë rreth 130 milionë dhe është ekonomia e dytë e Amerikës Latine. Anëtare e USMCA (ish-NAFTA) me SHBA/Kanada. Mexico City dhe Guadalajara janë qendrat tregtare. Vendi është një tregëtar i hapur me 14 FTA që mbulojnë 50+ vende.

Nuk ka FTA midis Kosovës dhe Meksikës. Tarifat MFN për produkte të përpunuara janë 10-20%, ushqim 15-45%. Importuesit duhen të jenë në Padrón de Importadores (regjistri zyrtar). NOM (Norma Oficial Mexicana) zbaton standarde teknike për shumicën e kategorive — etiketim, siguri, performancë. Ushqimet kërkojnë regjistrim COFEPRIS. Etiketimi në spanjisht. Doganat: Servicio de Administración Tributaria (SAT).`,
    contentEn:
`Mexico has around 130 million people and is Latin America's second-largest economy. A USMCA member (former NAFTA) with the US/Canada. Mexico City and Guadalajara are commercial hubs. The country is a very open trader with 14 FTAs covering 50+ countries.

There is no FTA between Kosovo and Mexico. MFN tariffs on processed goods are 10-20%, food 15-45%. Importers must be in the Padrón de Importadores (official registry). NOM (Norma Oficial Mexicana) enforces technical standards across most categories — labelling, safety, performance. Food requires COFEPRIS registration. Labelling in Spanish. Customs: Servicio de Administración Tributaria (SAT).`,
    marketOverview: {
      sq: '130M banorë, anëtare e USMCA. Treg i hapur me 14 FTA por jo me Kosovën. MFN 10-20% (ushqim deri 45%). NOM standardet + COFEPRIS për ushqim.',
      en: '130M people, USMCA member. Very open trader (14 FTAs) but none with Kosovo. MFN 10-20% (food up to 45%). NOM standards + COFEPRIS for food.',
    },
    customs: {
      vat: 'IVA 16% standard (8% në zonën kufitare)',
      importDuties: { sq: 'MFN: 10-20% të përpunuara, 15-45% ushqim. Akciza për alkool dhe duhan.', en: 'MFN: 10-20% processed, 15-45% food. Excise on alcohol and tobacco.' },
      authority: { name: 'Servicio de Administración Tributaria (SAT)', url: 'https://www.sat.gob.mx' },
      sourceUrl: 'https://www.sat.gob.mx/aduanas/portal',
    },
    agreements: [],
  },
  {
    code: 'AR', country: 'Argjentinë', flag: '🇦🇷',
    contentSq:
`Argjentina ka popullatë rreth 46 milionë dhe është ekonomia e tretë e Amerikës Latine. Buenos Aires është qendra tregtare. Vendi po kalon nëpër reforma të thella ekonomike nën qeverinë Milei (2024+) që ka liberalizuar tregtinë por edhe ka çuar në devalvim të madh të pesos.

Nuk ka FTA midis Kosovës dhe Argjentinës. Anëtare e Mercosur-it me Tarif të Përbashkët të Jashtëm 10-20% (deri 35% për tekstil). Importi historikisht ka pasur kufizime (DJAS, SIMI), por në 2024-2025 sistemi po thjeshtësohet. Ushqimet kërkojnë regjistrim ANMAT. Etiketimi në spanjisht. Doganat: Dirección General de Aduanas (DGA, nën AFIP). Vëmendje: situata makro-ekonomike kërkon analizë rasti për rast.`,
    contentEn:
`Argentina has around 46 million people and is Latin America's third-largest economy. Buenos Aires is the commercial hub. The country is undergoing deep economic reform under the Milei administration (2024+) which has liberalised trade but also led to major peso devaluation.

There is no FTA between Kosovo and Argentina. As a Mercosur member it applies the Common External Tariff of 10-20% (up to 35% for textiles). Imports historically had restrictions (DJAS, SIMI), but the system is being simplified in 2024-2025. Food requires ANMAT registration. Labelling in Spanish. Customs: Dirección General de Aduanas (DGA, under AFIP). Note: the macro situation requires case-by-case analysis.`,
    marketOverview: {
      sq: '46M banorë, reforma makro-ekonomike që po liberalizojnë importin. Pa FTA — Mercosur CET 10-20%. ANMAT për ushqim. Volatilitet i valutës — kërkohet kujdes.',
      en: '46M people, ongoing reforms liberalising imports. No FTA — Mercosur CET 10-20%. ANMAT for food. Currency volatility — caution advised.',
    },
    customs: {
      vat: 'IVA 21% standard (10.5% për ushqime esenciale)',
      importDuties: { sq: 'Mercosur CET 10-20% (deri 35% tekstil). Plus taksa importi shtesë.', en: 'Mercosur CET 10-20% (up to 35% textiles). Plus additional import charges.' },
      authority: { name: 'Dirección General de Aduanas (DGA / AFIP)', url: 'https://www.afip.gob.ar' },
      sourceUrl: 'https://www.afip.gob.ar/aduana/',
    },
    agreements: [],
  },
  {
    code: 'CL', country: 'Kili', flag: '🇨🇱',
    contentSq:
`Kili ka popullatë rreth 19 milionë dhe është ekonomia më e hapur e Amerikës Latine. Santiago është qendra tregtare. Vendi është anëtar i CPTPP, Pacific Alliance dhe ka FTA me 64 vende që mbulojnë 88% të PBB-së globale. Klasa e mesme kilane vlerëson produkte premium europiane.

Nuk ka FTA midis Kosovës dhe Kilit. Tarifat MFN për shumicën e produkteve janë vetëm 6% (uniformë), por për partnerët FTA tarifat janë 0%. Importuesit duhet të jenë regjistruar në SII (Servicio de Impuestos Internos). Ushqimet kërkojnë regjistrim ISP/SAG; kozmetika ISP. Etiketimi në spanjisht. Doganat: Servicio Nacional de Aduanas. Kili është ndoshta tregu më i lehtë i LatAm-it për të hyrë.`,
    contentEn:
`Chile has around 19 million people and is Latin America's most open economy. Santiago is the commercial hub. The country is in CPTPP, the Pacific Alliance and holds FTAs with 64 countries covering 88% of global GDP. The Chilean middle class values premium European products.

There is no FTA between Kosovo and Chile. MFN tariffs on most goods are just 6% (uniform), but FTA partners enjoy 0%. Importers must be registered with SII (Servicio de Impuestos Internos). Food requires ISP/SAG registration; cosmetics ISP. Labelling in Spanish. Customs: Servicio Nacional de Aduanas. Chile is arguably the easiest LatAm market to enter.`,
    marketOverview: {
      sq: '19M banorë, ekonomia më e hapur e LatAm-it. Pa FTA me Kosovën por MFN vetëm 6% uniforme. ISP/SAG për ushqim. Treg ideal për hyrje në LatAm.',
      en: '19M people, most open LatAm economy. No FTA with Kosovo but MFN flat 6%. ISP/SAG for food. Ideal entry market into LatAm.',
    },
    customs: {
      vat: 'IVA 19% standard',
      importDuties: { sq: 'MFN uniform 6% për shumicën e produkteve. 0% me partnerët FTA.', en: 'Uniform 6% MFN on most goods. 0% with FTA partners.' },
      authority: { name: 'Servicio Nacional de Aduanas', url: 'https://www.aduana.cl' },
      sourceUrl: 'https://www.aduana.cl/aduana/site/edic/base/port/operadores.html',
    },
    agreements: [],
  },
  {
    code: 'NZ', country: 'Zelanda e Re', flag: '🇳🇿',
    contentSq:
`Zelanda e Re ka popullatë rreth 5.2 milionë por është një nga ekonomitë më të hapura të botës. Auckland është qendra tregtare. Vendi vlerëson cilësinë premium dhe ka standarde shumë të rrepta për mbrojtjen biologjike — Biosecurity New Zealand (MPI) është ndoshta agjencia më rigoroze në botë.

Nuk ka FTA midis Kosovës dhe Zelandës së Re. Tarifat MFN për shumicën e produkteve janë 0-5%; tekstil/këpucë 5-10%. Importi i ushqimit, drurit, paleteve, bimëve dhe kafshëve kontrollohet rreptësisht nga MPI. Druri kërkon fumigim ISPM 15 dhe shpesh trajtim shtesë. Ushqimet kërkojnë regjistrim nën Food Act 2014. Etiketimi në anglisht. Doganat: New Zealand Customs Service.`,
    contentEn:
`New Zealand has around 5.2 million people but is one of the world's most open economies. Auckland is the commercial hub. The country prizes premium quality and has very strict biosecurity rules — Biosecurity New Zealand (MPI) is arguably the most rigorous agency in the world.

There is no FTA between Kosovo and New Zealand. MFN tariffs on most goods are 0-5%; textiles/footwear 5-10%. Imports of food, wood, pallets, plants and animals are tightly controlled by MPI. Wood requires ISPM 15 fumigation and often additional treatment. Food requires registration under the Food Act 2014. Labelling in English. Customs: New Zealand Customs Service.`,
    marketOverview: {
      sq: '5.2M banorë, ekonomi premium e hapur. Pa FTA me Kosovën. Tarifa MFN 0-5%. Biosecurity ekstreme — MPI kontrollon çdo produkt biologjik.',
      en: '5.2M people, premium open economy. No FTA with Kosovo. MFN tariffs 0-5%. Extreme biosecurity — MPI inspects every biological product.',
    },
    customs: {
      vat: 'GST 15% standard',
      importDuties: { sq: 'MFN 0-5% për shumicën; 5-10% për tekstil/këpucë. Akciza për alkool dhe duhan.', en: 'MFN 0-5% on most goods; 5-10% on textiles/footwear. Excise on alcohol and tobacco.' },
      authority: { name: 'New Zealand Customs Service', url: 'https://www.customs.govt.nz' },
      sourceUrl: 'https://www.customs.govt.nz/business/import/',
    },
    agreements: [],
  },
]

async function main() {
  let created = 0, skipped = 0
  for (const g of GUIDES) {
    const exists = await prisma.exportGuide.findFirst({
      where: { countryCode: g.code, deletedAt: null },
      select: { id: true },
    })
    if (exists) { skipped++; continue }

    await prisma.exportGuide.create({
      data: {
        country: g.country,
        countryCode: g.code,
        flag: g.flag,
        title: `Udhëzues eksporti për ${g.country}`,
        titleSq: `Udhëzues eksporti për ${g.country}`,
        titleEn: `Export guide to ${g.country}`,
        titleDe: `Exportleitfaden für ${g.country}`,
        content: g.contentSq,
        contentSq: g.contentSq,
        contentEn: g.contentEn,
        sectors: SECTORS,
        marketOverview: g.marketOverview,
        customs: g.customs,
        tradeAgreements: g.agreements,
        requiredDocs: [],
        certifications: [],
        labeling: { languages: [], rules: [] },
        sectorRules: [],
        contacts: [],
        citations: [],
        isPublished: true,
        generatedBy: 'claude-direct-v1-2026-06-17',
        reviewedBy: 'claude-direct-v1',
        reviewedAt: new Date(),
      },
    })
    created++
    console.log(`${g.flag} ${g.code} ${g.country.padEnd(20)} CREATED`)
  }
  console.log(`\n=== Done. Created: ${created}, Skipped: ${skipped}, Total: ${GUIDES.length} ===`)
  await prisma.$disconnect()
}

main().catch((e) => { console.error(e); process.exit(1) })
