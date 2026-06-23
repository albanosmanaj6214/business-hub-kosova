# KBH — Personalizimi dhe Targetimi i Përmbajtjes sipas Biznesit

- **Data:** 2026-06-23
- **Projekti:** Kosova Business Hub (CT109, `/var/www/businesshub`)
- **Statusi:** Dizajn i aprovuar pikë-për-pikë nga pronari, gati për shqyrtim përfundimtar para planit të implementimit.

## 1. Qëllimi

KBH është ONE STOP SHOP për bizneset e Kosovës: grante, panaire, lajme, informata, udhëzues, template dhe checklista. Vlera kryesore është **relevanca**: çdo biznes merr vetëm atë që i takon profilit të tij (industria, lloji i aktivitetit, atributet si gra në pronësi). Keqinformimi te biznese që paguajnë është i papranueshëm, prandaj targetimi duhet të jetë i saktë dhe i kontrolluar nga njeriu para se diçka të shkojë te bizneset.

Dy parime mbrojtëse:
1. **Asnjë biznes nuk sheh asgjë jashtë profilit të vet.** Qasja "shiko të gjitha industritë" hiqet, sepse mundëson ndarjen e një abonimi me biznese të kategorive të tjera dhe e vret modelin SaaS.
2. **Asgjë nuk u shkon bizneseve pa e zgjedhur admini audiencën.** Çdo artikull kalon nëpër një hap dispeçimi ku admini cakton dhe verifikon audiencën.

## 2. Gjendja aktuale (çfarë ekziston në kod sot)

| Element | Gjendja |
| --- | --- |
| Sektorët | `src/lib/sectors.ts` ka **18 sektorë** (production/services), jo 7. |
| Profili i përdoruesit | `User.sectors String[]`, `User.sector` (legacy), `User.femaleOwnership Boolean?`, `User.interests String[]`, `User.onlyMySector Boolean @default(false)`. |
| Targetimi i përmbajtjes | `Grant/TradeFair/ExportGuide.targetSectors String[]` (bosh = universal), `forFemaleOwned Boolean`. |
| Radha e adminit | `Opportunity` me `verificationStatus` (auto_publish / needs_review / published / rejected); faqet `/admin/sources`, `/admin/review`. |

### Çfarë mungon ose bie ndesh me modelin e ri
1. **Boshti i llojit të aktivitetit nuk ekziston.** Sot targetimi është vetëm sipas sektorit. "Grant për prodhues" (që prek shumë sektorë por jo shërbimet/tregtinë) nuk mund të shprehet.
2. **Modeli është opt-in, jo i detyrueshëm.** `onlyMySector` është OFF si default, pra bizneset shohin gjithçka. Modeli i ri kërkon scoping të detyrueshëm sipas profilit, pa "shiko të gjitha".
3. **`targetSectors` bosh = universal** përzihet me kuptimin e ri. Te modeli i ri "e përgjithshme" është zgjedhje eksplicite e adminit, jo thjesht fushë e zbrazët.
4. **Nuk ka kontroll admini mbi qasjen e sektorëve dhe faturimin.** `User.sectors` është vetëdeklarim, pa miratim/faturim nga admini.
5. **Nuk ka modul Lajme/Informata.**
6. **Nuk ka Qendër Dispeçimi të unifikuar** me parapamje live "sa biznese do ta marrin".

## 3. Modeli i targetimit (i aprovuar)

### 3.1 Boshtet
- **Lloji i aktivitetit** (4 vlera): `prodhues-perpunues`, `sherbime`, `bujqesi`, `tregti`.
  - Tregtia nuk merr grante sektoriale; merr vetëm përmbajtje "të përgjithshme" (pa sektor).
- **Sektori/industria** (17 sektorë, lista zyrtare më poshtë).
- **Atributi "Gra në pronësi"** (po/jo/i padeklaruar).
- Hapësirë për atribute të mëvonshme (i ri/startup, eksportues, komuna) pa i ndërtuar tani.

### 3.2 Lista zyrtare e sektorëve (17)
1. Ushqim dhe Pije
2. Bujqësi, Blegtori dhe Pemtari
3. Tekstil dhe Konfeksion
4. Lëkurë dhe Këpucë
5. Druri dhe Mobilje
6. Metale dhe Makineri
7. Materiale Ndërtimi
8. Plastika dhe Goma
9. Kimi dhe Kozmetikë
10. Letër, Paketim dhe Printim
11. Pajisje Elektrike dhe Elektronike
12. Farmaceutikë dhe Pajisje Mjekësore
13. TIK, Software dhe BPO
14. Energji e Rinovueshme
15. Logjistikë dhe Transport
16. Turizëm dhe Mikpritje
17. Artizanat dhe Industri Kreative

> **Vendim i hapur:** Kodi aktual ka një sektor të 18-të, `konstruksion-inxhinieri`, që nuk është në listën e pronarit. Duhet konfirmuar nëse mbahet (rekomandim: mbahet si sektor i veçantë "Shërbime", sepse ndërtimi/inxhinieria ndryshon nga prodhimi i materialeve të ndërtimit) ose hiqet/bashkohet. Pa konfirmim, mbetet aktiv por shënohet për rishikim.

### 3.3 Audienca e çdo artikulli (e cakton admini)
Çdo Grant / Panair / Lajm / Informatë merr një audiencë në një nga këto forma:
- **E përgjithshme** (`isGeneral = true`): shkon te të gjithë, përfshirë tregtinë (p.sh. paga minimale, SuperPuna, lajme të përgjithshme).
- **Sipas llojit të aktivitetit**: p.sh. të gjithë Prodhuesit/Përpunuesit pavarësisht sektorit.
- **Sipas sektorëve**: një ose disa nga 17.
- **+ "Vetëm gra në pronësi"**: e ngushton brenda audiencës së zgjedhur.

Kufizim: nëse `isGeneral = false`, admini duhet të zgjedhë të paktën një aktivitet ose një sektor (UI e detyron, që të mos krijohet audiencë e zbrazët e dykuptimtë).

### 3.4 Rregulli i përputhjes (kush e sheh çfarë)
Biznesi `B` e merr artikullin `I` nëse:

```
isGeneral(I) == true
  OSE (
    ( I.targetActivityTypes është bosh  OSE  B.activityTypes ∩ I.targetActivityTypes ≠ ∅ )
    DHE ( I.targetSectors është bosh     OSE  B.entitledSectors ∩ I.targetSectors ≠ ∅ )
    DHE ( I.forFemaleOwned == false      OSE  B.femaleOwnership == true )
  )
```

Shembuj:
- **Grant për prodhues** (`targetActivityTypes=[prodhues-perpunues]`, `targetSectors=[]`): te të gjithë prodhuesit, çdo sektor. Tregtia dhe shërbimet: jo.
- **Panair ushqimi** (`targetSectors=[ushqim-dhe-pije]`): vetëm te bizneset me ushqim në `entitledSectors`. Prodhuesi i drurit: jo.
- **Grant për gra** (`forFemaleOwned=true`): vetëm te bizneset me grua në pronësi brenda audiencës.
- **Paga minimale** (`isGeneral=true`): te të gjithë, përfshirë tregtinë.

## 4. Ndryshimet në modelin e të dhënave (Prisma)

### 4.1 `User` (profili i biznesit)
- Shto `activityTypes ActivityType[] @default([])` — enum i ri `ActivityType { PRODHUES_PERPUNUES, SHERBIME, BUJQESI, TREGTI }`. Zakonisht një vlerë, lejohen disa.
- `sectors String[]` mbahet si **sektorët e vetëdeklaruar** (footprint-i që biznesi thotë se mbulon).
- Shto `entitledSectors String[] @default([])` — **sektorët që admini ka aktivizuar/faturuar**; këta e përcaktojnë dukshmërinë. Në regjistrim mbushen me sektorin e parë të deklaruar (Starter = 1 sektor); admini shton të tjerë me faturë.
- `femaleOwnership Boolean?` mbahet.
- `onlyMySector` shënohet i vjetëruar dhe hiqet pas migrimit (scoping bëhet i detyrueshëm; opt-in nuk ka më kuptim).

### 4.2 `Grant`, `TradeFair`, `NewsItem` (audienca)
Standardizo audiencën në të tria:
- `isGeneral Boolean @default(false)`
- `targetActivityTypes ActivityType[] @default([])`
- `targetSectors String[] @default([])` (kuptimi i vjetër "bosh = universal" zëvendësohet nga `isGeneral`)
- `forFemaleOwned Boolean @default(false)` (ekziston te Grant/TradeFair)
- Fusha auditimi: `dispatchedAt DateTime?`, `dispatchedById String?`, `dispatchStatus` (`PENDING` / `DISPATCHED` / `REJECTED`).

### 4.3 `NewsItem` (model i ri) + moduli Lajme/Informata
```
model NewsItem {
  id, title, titleSq, summary, body (Text),
  sourceName, sourceUrl, publishedAt, scrapedAt,
  isGeneral Boolean @default(true),   // lajmet default = të gjithë
  targetActivityTypes ActivityType[] @default([]),
  targetSectors String[] @default([]),
  forFemaleOwned Boolean @default(false),
  dispatchStatus, dispatchedAt, dispatchedById,
  isActive Boolean @default(true)
}
```
- Menu e re publike "Lajme dhe Informata"; lajmet lexohen brenda platformës dhe dërgohen me email (newsletter).
- Default = i përgjithshëm; por admini mund ta dërgojë një lajm vetëm te një aktivitet/sektor nga Qendra e Dispeçimit.
- Burimet e lajmeve riperdorin regjistrin ekzistues `Source` (kind=rss/html), me radhë në `Opportunity`/`NewsItem` para dispeçimit.

## 5. Shtresa e dukshmërisë (kod)
- Modul i ri `src/lib/audience.ts`:
  - `matchesAudience(user, item): boolean` — rregulli i 3.4.
  - `countAudience(item): Promise<number>` — sa biznese përputhen (për parapamjen live).
  - `feedFor(user, type): Promise<Item[]>` — feed-i i personalizuar.
- `src/lib/sector-filter.ts` dhe logjika `onlyMySector` hiqen / zëvendësohen nga `audience.ts`.

## 6. Qendra e Dispeçimit (paneli i adminit)
Një vend i vetëm; e njëjta rrjedhë për çdo lloj (grant, panair, lajm). Thjeshtësia është kërkesë eksplicite.

- **Radha lart** me filtra chip: `Grante (N) · Panaire (N) · Lajme (N)`.
- **Karta e dispeçimit** për një artikull:
  - Përmbledhja: titulli, burimi me link, afati, shuma (grante), teksti.
  - ☑ Burimi i verifikuar (+ fusha e burimit).
  - **Audienca:** ◯ Të gjithë · ◯ Sipas aktivitetit · ◯ Sipas sektorëve; nën-zgjedhje për aktivitete dhe chip-at e 17 sektorëve; ☑ Vetëm gra në pronësi.
  - **Parapamje live:** "Ky artikull do t'u shkojë te N biznese." (përdor `countAudience`).
  - Butonat: **Dërgo** · Ruaj draft · Refuzo.
- **Tab i dytë — Pasqyra e bizneseve:** tabelë Biznes × sektorë të aktivizuar (`entitledSectors`) me checkbox për të hapur sektor shtesë + shënim faturimi (kush/kur/sa). Faturimi real me Stripe është jashtë fushës tani; ruhet vetëm shënimi.

Auditimi: çdo dispeçim ruan kush e dërgoi, kur, dhe audiencën e zgjedhur, që përgjegjësia për informimin të jetë e gjurmueshme.

## 7. Migrimi (pa humbje të dhënash)
1. **Sektorët:** 18 → 17 sipas listës; `konstruksion-inxhinieri` mbetet derisa pronari të vendosë. Ri-mapim i sllagëve ekzistues; asnjë rresht nuk fshihet.
2. **Përdoruesit:** `entitledSectors` mbushet nga `sectors` e deklaruar (e kufizuar në numrin e lejuar nga pakoja). Profilet pa aktivitet/sektor marrin kërkesë për t'i plotësuar; deri atëherë shohin vetëm përmbajtje "të përgjithshme" (default i sigurt).
3. **Përmbajtja ekzistuese:** grantet/panairet me `targetSectors` bosh shënohen `isGeneral=true` për të ruajtur dukshmërinë aktuale, pastaj admini i ri-targeton nga Qendra e Dispeçimit. Grantet "për prodhues" ri-tagohen me aktivitetin.
4. `onlyMySector` hiqet pas migrimit.

## 8. Implementimi me faza (inkremente të vogla, të verifikuara)
- **Faza A — Bazat:** enum `ActivityType`, fushat e reja në schema, `audience.ts` + teste. Pa ndryshim UI.
- **Faza B — Regjistrimi:** kapja e aktivitetit + sektorëve + gra në pronësi; plotësimi i profilit.
- **Faza C — Qendra e Dispeçimit** (grante + panaire) me parapamje live + auditim; zëvendëson `/admin/review`.
- **Faza D — Moduli Lajme/Informata:** model + scraping + menu + dispeçim.
- **Faza E — Pasqyra e qasjes së sektorëve** + shënime faturimi; heqja e `onlyMySector` dhe e çdo pamjeje "shiko të gjitha".

Çdo fazë dërgohet dhe verifikohet para fazës tjetër.

## 9. Verifikimi (mbrojtja nga gabimet)
Teste njësi për `matchesAudience` që mbulojnë:
- E përgjithshme → tregtia e merr.
- Grant për prodhues → prodhuesi po, shërbimi jo, tregtia jo.
- Panair ushqimi → ushqimi po, druri jo.
- Grant për gra → vetëm bizneset me grua në pronësi.
- Biznes multi-sektor → i sheh të dy sektorët.
- Numri i parapamjes `countAudience` = marrësit realë (test barazie).

Seed me biznese dhe artikuj përfaqësues për t'i provuar skenarët end-to-end.

## 10. Jashtë fushës / e parkuar
- **Materialet e "Pakos"** (template/checklista për pako) — mekanizëm i veçantë, dizajnohet më vonë.
- Matja/faturimi automatik me Stripe i sektorëve shtesë — tani vetëm shënim manual.
- Auto-tagim me AI i audiencës — admini e bën manualisht; AI mund të propozojë më vonë.

## 11. Vendime të hapura për pronarin
1. A mbahet sektori i 18-të `konstruksion-inxhinieri` apo hiqet/bashkohet me "Materiale Ndërtimi"?
2. A mund një biznes të ketë më shumë se një lloj aktiviteti (p.sh. prodhues edhe shërbime), apo gjithmonë vetëm një?
3. A duhet pakoja bazë (Starter) të përfshijë saktësisht 1 sektor, me çdo sektor shtesë të hapur vetëm nga admini me faturë?
