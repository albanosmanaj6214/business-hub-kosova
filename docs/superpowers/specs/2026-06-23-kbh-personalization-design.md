# KBH — Personalizimi dhe Targetimi i Përmbajtjes sipas Biznesit

- **Data:** 2026-06-23
- **Projekti:** Kosova Business Hub (CT109, `/var/www/businesshub`)
- **Statusi:** Dizajn i APROVUAR plotësisht (përfshirë paketat). Gati për plan implementimi.

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
4. **Nuk ka kontroll admini mbi qasjen e sektorëve dhe faturimin.**
5. **Nuk ka modul Lajme/Informata.**
6. **Nuk ka Qendër Dispeçimi të unifikuar** me parapamje live "sa biznese do ta marrin".
7. **Nuk ka shtresë të drejtash sipas tarifës** (entitlements) përtej numrit të sektorëve.

## 3. Modeli i targetimit (i aprovuar)

### 3.1 Boshtet
- **Lloji i aktivitetit** (4 vlera): `prodhues-perpunues`, `sherbime`, `bujqesi`, `tregti`.
  - **Një biznes ka vetëm NJË lloj aktiviteti.** (Vendim i pronarit.)
  - Tregtia nuk merr grante sektoriale; merr vetëm përmbajtje "të përgjithshme" (pa sektor).
- **Sektori/industria** (18 sektorë, lista zyrtare më poshtë).
- **Atributi "Gra në pronësi"** (po/jo/i padeklaruar).
- Hapësirë për atribute të mëvonshme (i ri/startup, eksportues, komuna) pa i ndërtuar tani.

### 3.2 Lista zyrtare e sektorëve (18)
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
18. Konstruksion dhe Inxhinieri *(mbahet si sektor i veçantë, vendim i pronarit)*

### 3.3 Audienca e çdo artikulli (e cakton admini)
Çdo Grant / Panair / Lajm / Informatë merr një audiencë në një nga këto forma:
- **E përgjithshme** (`isGeneral = true`): shkon te të gjithë, përfshirë tregtinë (p.sh. paga minimale, SuperPuna, lajme të përgjithshme).
- **Sipas llojit të aktivitetit**: p.sh. të gjithë Prodhuesit/Përpunuesit pavarësisht sektorit.
- **Sipas sektorëve**: një ose disa nga 18.
- **+ "Vetëm gra në pronësi"**: e ngushton brenda audiencës së zgjedhur.

Kufizim: nëse `isGeneral = false`, admini duhet të zgjedhë të paktën një aktivitet ose një sektor (UI e detyron).

### 3.4 Rregulli i përputhjes (kush e sheh çfarë)
Biznesi `B` (me një `activityType` të vetëm) e merr artikullin `I` nëse:

```
isGeneral(I) == true
  OSE (
    ( I.targetActivityTypes është bosh  OSE  B.activityType ∈ I.targetActivityTypes )
    DHE ( I.targetSectors është bosh     OSE  B.entitledSectors ∩ I.targetSectors ≠ ∅ )
    DHE ( I.forFemaleOwned == false      OSE  B.femaleOwnership == true )
  )
```

Shembuj:
- **Grant për prodhues** (`targetActivityTypes=[prodhues-perpunues]`, `targetSectors=[]`): te të gjithë prodhuesit, çdo sektor. Tregtia/shërbimet: jo.
- **Panair ushqimi** (`targetSectors=[ushqim-dhe-pije]`): vetëm te bizneset me ushqim në `entitledSectors`. Prodhuesi i drurit: jo.
- **Grant për gra** (`forFemaleOwned=true`): vetëm te bizneset me grua në pronësi brenda audiencës.
- **Paga minimale** (`isGeneral=true`): te të gjithë, përfshirë tregtinë.

## 4. Ndryshimet në modelin e të dhënave (Prisma)

### 4.1 `User` (profili i biznesit)
- Shto `activityType ActivityType?` — enum i ri `ActivityType { PRODHUES_PERPUNUES, SHERBIME, BUJQESI, TREGTI }`. **Një vlerë e vetme** për biznes.
- `sectors String[]` mbahet si **sektorët e vetëdeklaruar**.
- Shto `entitledSectors String[] @default([])` — **sektorët që admini ka aktivizuar/faturuar**; këta e përcaktojnë dukshmërinë. Në regjistrim mbushen sipas pakos (Starter = 1 sektor).
- `femaleOwnership Boolean?` mbahet.
- `onlyMySector` shënohet i vjetëruar dhe hiqet pas migrimit.

### 4.2 `Grant`, `TradeFair`, `NewsItem` (audienca)
- `isGeneral Boolean @default(false)`
- `targetActivityTypes ActivityType[] @default([])` (anë e përmbajtjes mban listë)
- `targetSectors String[] @default([])` (kuptimi i vjetër "bosh = universal" zëvendësohet nga `isGeneral`)
- `forFemaleOwned Boolean @default(false)`
- Auditim: `dispatchStatus` (`PENDING`/`DISPATCHED`/`REJECTED`), `dispatchedAt`, `dispatchedById`.

### 4.3 `NewsItem` (model i ri) + moduli Lajme/Informata
```
model NewsItem {
  id, title, titleSq, summary, body (Text),
  sourceName, sourceUrl, publishedAt, scrapedAt,
  isGeneral Boolean @default(true),
  targetActivityTypes ActivityType[] @default([]),
  targetSectors String[] @default([]),
  forFemaleOwned Boolean @default(false),
  dispatchStatus, dispatchedAt, dispatchedById,
  isActive Boolean @default(true)
}
```
- Menu e re publike "Lajme dhe Informata"; lexohen brenda platformës dhe dërgohen me email (newsletter).
- Default = i përgjithshëm; admini mund ta dërgojë një lajm vetëm te një aktivitet/sektor nga Qendra e Dispeçimit.
- Burimet riperdorin regjistrin ekzistues `Source` (kind=rss/html).

## 5. Shtresa e dukshmërisë (kod)
- Modul i ri `src/lib/audience.ts`: `matchesAudience(user, item)`, `countAudience(item)`, `feedFor(user, type)`.
- `src/lib/sector-filter.ts` dhe logjika `onlyMySector` hiqen / zëvendësohen.

## 6. Qendra e Dispeçimit (paneli i adminit)
Një vend i vetëm; e njëjta rrjedhë për çdo lloj. Thjeshtësia është kërkesë eksplicite.
- **Radha lart** me filtra chip: `Grante (N) · Panaire (N) · Lajme (N)`.
- **Karta e dispeçimit:** përmbledhja (titull, burim me link, afat, shumë, tekst); ☑ Burimi i verifikuar; **Audienca** (◯ Të gjithë · ◯ Sipas aktivitetit · ◯ Sipas sektorëve + chip-at e 18 sektorëve + ☑ Vetëm gra në pronësi); **Parapamje live: "do t'u shkojë te N biznese"**; butonat Dërgo · Ruaj draft · Refuzo.
- **Tab i dytë — Pasqyra e bizneseve:** tabelë Biznes × `entitledSectors` me checkbox për sektor shtesë + shënim faturimi.
- Auditim: çdo dispeçim ruan kush/kur/çfarë audience.

## 7. Migrimi (pa humbje të dhënash)
1. Sektorët mbeten 18; ri-mapim i sllagëve ekzistues; asnjë rresht s'fshihet.
2. `entitledSectors` mbushet nga `sectors` e deklaruar (e kufizuar në numrin e pakos). Profilet pa aktivitet/sektor marrin kërkesë plotësimi; deri atëherë shohin vetëm "të përgjithshme".
3. Përmbajtja me `targetSectors` bosh → `isGeneral=true` për të ruajtur dukshmërinë, pastaj admini i ri-targeton. Grantet "për prodhues" ri-tagohen me aktivitetin.
4. `onlyMySector` hiqet pas migrimit.

## 8. Implementimi me faza (inkremente të vogla, të verifikuara)
- **Faza A — Bazat:** enum `ActivityType`, fushat e reja, `audience.ts` + teste. Pa ndryshim UI.
- **Faza B — Regjistrimi:** kapja e aktivitetit + sektorëve + gra në pronësi; plotësimi i profilit.
- **Faza C — Qendra e Dispeçimit** (grante + panaire) me parapamje live + auditim; zëvendëson `/admin/review`.
- **Faza D — Moduli Lajme/Informata:** model + scraping + menu + dispeçim.
- **Faza E — Pasqyra e qasjes + të drejtat sipas tarifës (entitlements)** + heqja e `onlyMySector` dhe e "shiko të gjitha".

Çdo fazë dërgohet dhe verifikohet para fazës tjetër.

## 9. Verifikimi (mbrojtja nga gabimet)
Teste njësi për `matchesAudience`: e përgjithshme→tregtia e merr; grant për prodhues→prodhuesi po/shërbimi jo/tregtia jo; panair ushqimi→ushqimi po/druri jo; grant për gra→vetëm gra në pronësi; biznes multi-sektor→i sheh të dy; `countAudience` = marrësit realë. Seed me biznese + artikuj përfaqësues për skenarët end-to-end.

## 10. Jashtë fushës / e parkuar
- **Materialet e "Pakos"** (template/checklista për pako) — mekanizëm i veçantë, dizajnohet më vonë.
- Faturimi automatik me Stripe i sektorëve/të drejtave shtesë — tani vetëm shënim manual + konfigurim.
- Auto-tagim me AI i audiencës — admini manualisht; AI propozon më vonë.

## 11. Vendimet (të zgjidhura)
1. Sektori i 18-të `Konstruksion dhe Inxhinieri` **mbahet**.
2. Një biznes ka **një lloj aktiviteti** të vetëm.
3. Paketat definohen sipas matricës në seksionin 12 (pikënisje, e ndryshueshme më vonë).

## 12. Paketat dhe të drejtat (entitlements) — pikënisje, e ndryshueshme
Dy dimensione të pavarura për çdo biznes: (A) shtrirja e sektorit; (B) niveli i tarifës që cakton të drejtat.

| E drejta | Starter €39 | Professional €99 | Enterprise €249 |
| --- | --- | --- | --- |
| Sektorë | 1 | deri 3 | deri 6 (admin) |
| Njoftime grante/panaire (brenda platformës) | Po | Po | Po |
| Alerte me email | Jo | Po | Po, prioritare |
| Newsletter periodik | Po | Po | Po |
| Udhëzues eksporti | Të kufizuar (sektori + vendet kryesore) | Të gjithë | Të gjithë + përditësime |
| Checklista | Jo | Po | Po |
| Template për panaire | Jo | Po | Po |
| Konsulencë / takim | Jo | 1 në muaj | E pakufizuar |

Implementim: të drejtat ruhen si konfigurim `TIER_ENTITLEMENTS` (i ndryshueshëm nga admini pa prekur kod). Gating-u bëhet në shtresën e dukshmërisë bashkë me targetimin. Të drejtat janë ortogonale me sektorin: biznesi sheh vetëm sektorin/sektorët e vet (Dimensioni A), dhe brenda tyre, vetëm llojet e përmbajtjes që ia hap tarifa (Dimensioni B).
