# Qendra e Dispeçimit — riorganizim (dizajn)

Data: 2026-06-24
Projekt: business-hub-kosova (CT109), branch `reorg-hubs`
Status: APROVUAR në brainstorming (rruga A). Ky spec pret shqyrtimin e përdoruesit para planit.

## 1. Konteksti

`/admin/dispatch` (Qendra e Dispeçimit) është paneli ku admini cakton audiencën për çdo grant/panair/lajm dhe e dërgon te bizneset përkatëse (njoftim brenda platformës + opsionalisht email). Sot punon, por përdoruesi e ndien "të çorientuar":

- "Dërgo" e nis menjëherë, pa konfirmim. Një klikim dërgon te N biznese pa kthim.
- Pas nisjes, artikulli zhduket nga radha. S'ka histori: nuk shihet çka u dërgua, kujt, kur.
- Audienca duhet vendosur për çdo artikull pa udhëzim të qartë (pse ky sektor).

Kërkesa e përdoruesit, fjalë për fjalë: **vizuale, shumë user-friendly, pa asnjë hamendësim, pa lënë vend për gabim.**

### Çka ekziston tashmë (ripërdoret, nuk rindërtohet)
- Numri live i marrësve "Do t'u shkojë te N biznese" (`AudienceEditor` → `/api/admin/dispatch/count` → `countAudience`). Funksionon.
- `deriveAudienceValue(item)` mbush audiencën nga fushat `targetActivityTypes`/`targetSectors` të artikullit.
- Motori i targetimit `matchesAudience` (i pastër, i testuar) + `valueToCriteria`/`parseAudience`.
- Fushat në DB: `dispatchStatus` (PENDING/DISPATCHED), `dispatchedAt`, `dispatchedById`, `isGeneral`, `targetActivityTypes`, `targetSectors`, `forFemaleOwned` te Grant/TradeFair/NewsItem.

## 2. Vendimet e mbërthyera (nga brainstorming)

1. **"Check" = tri gjëra:** (a) konfirmim para nisjes, (b) histori pas nisjes, (c) ri-targetim i të dërguarve.
2. **Pa hamendësim:** ekrani gjithmonë shfaq një **audiencë të rekomanduar me arsye**, kurrë një fushë bosh. Rekomandimi është **deterministik dhe pa kosto API** (pa AI).
3. **Pa gabim:** asgjë nuk niset me një klikim. Hapi i konfirmimit tregon saktë audiencën përfundimtare + numrin e marrësve para nisjes.
4. **Jashtë fushës (për tani):** sugjerime me AI (kosto, bie ndesh me politikën e shpenzimit) dhe dërgim masiv me një klik (rrezik gabimi). Mund të shtohen vonë.
5. **Admin-in-the-loop mbetet:** asgjë s'shkon te bizneset pa admin që zgjedh audiencën dhe konfirmon (përputhet me dizajnin ekzistues të personalizimit).

## 3. Arkitektura

Dy njësi të reja të pastra (të testueshme, pa varësi UI), plus rindërtim i UI-së dhe një endpoint i vogël.

### 3.1 `src/lib/suggest-audience.ts` (i ri, i pastër, i testuar)
Motori i "pa hamendësim". Funksion i pastër:

```
suggestAudience(item: {
  type: 'grant' | 'fair' | 'news'
  sectors: string[]          // sektorët e zbuluar nga scraper-i te artikulli
  title: string
  titleSq?: string | null
}): { value: AudienceValue; reasons: string[] }
```

Logjika (deterministike, pa AI):
- Nëse `item.sectors` ka sektorë valid (përmes `sectorBySlug`/variant-matching te `sectors.ts`) → propozo **mode 'sector'** me ata sektorë. Arsye: "Sektorët e zbuluar te burimi: <lista>".
- Vetëm për **grante**, provo edhe llojin e aktivitetit nga fjalë-kyçe në titull (sq + en), hartë e vogël deterministike:
  - prodhim/përpunim/fabrikë/industri → `prodhues-perpunues`
  - bujqësi/agro/fermë/blegtori/prodhim primar → `bujqesi`
  - shërbim/konsulencë/turizëm/TIK → `sherbime`
  - (tregti nuk merr grante me sektor — mbetet te "të përgjithshme")
  Rregull i prerë i përparësisë (deterministik): nëse artikulli ka sektorë të vlefshëm → mode 'sector'; përndryshe, nëse zbulohet aktivitet nga fjalë-kyçe → mode 'activity'; përndryshe → mode 'all'. Admini gjithmonë mund ta ndryshojë në editor.
- Nëse s'zbulon as sektor as aktivitet → propozo **mode 'all'** (e përgjithshme). Arsye: "S'u zbulua sektor specifik — sugjerohet Të gjithë."
- Lajmet (`news`): default 'all' me arsye "Lajm i përgjithshëm", përveç kur kanë sektorë.

Kthimi përmban gjithmonë një `value` të plotë (`isValueComplete` = true) dhe të paktën një `reason`. **Kurrë bosh.**

### 3.2 `src/lib/audience-describe.ts` (i ri, i pastër, i testuar)
Përkthen kriterin në fjali shqip për panelin e konfirmimit dhe historinë:

```
describeAudience(criteria: AudienceCriteria): string
```
- `isGeneral` → "Të gjitha bizneset"
- mode activity → "Bizneset: Prodhues, Shërbime" (etiketat sq nga `activity.ts`)
- mode sector → "Sektorët: Ushqim e pije, Druri e mobilje" (etiketat sq nga `sectors.ts`)
- `forFemaleOwned` shtohet: "… (vetëm me grua në pronësi)" ose vetëm "Bizneset me grua në pronësi" kur është i vetëm.

### 3.3 UI: `DispatchCenter.tsx` (rindërtim)
Dy skeda lart: **Për dërgim** (radha) dhe **Të dërguara** (historia). Header me progres: "N për shqyrtim · M të dërguara sot".

**Skeda "Për dërgim" — radhë e udhëhequr:**
- Lista majtas mbetet (me filtra lloji), por kartela e fokusit djathtas riorganizohet vizualisht:
  1. **Çka është:** badge lloji, titulli, ofruesi, afati, link "Burimi".
  2. **Audienca e rekomanduar** — bllok i theksuar lart: fjalia e audiencës (`describeAudience`) + arsyet (`reasons`) + numri live "te N biznese". Buton "Përdor rekomandimin" (i parazgjedhur tashmë i aplikuar).
  3. **Rregullo (opsionale)** — `AudienceEditor` ekzistues poshtë, për ndryshim manual; numri live përditësohet.
  4. Checkbox "Njofto bizneset tani" (default ON), + (vetëm lajme) "Dërgo edhe newsletter me email" (default OFF).
  5. Butoni kryesor **"Shqyrto e dërgo"** → hap panelin e konfirmimit.

**Paneli i konfirmimit (check-i) — modal/panel:**
- Titulli i artikullit + lloji.
- Audienca përfundimtare në fjalë (`describeAudience`).
- "Do t'u shkojë te **N** biznese." (rillogaritet në çelje, jo vlerë e vjetëruar.)
- Opsionalisht ndarja sipas sektorit/aktivitetit (nice-to-have; numri është i detyrueshëm).
- Çka do ndodhë: "Do krijohen N njoftime" + (nëse email) "Do dërgohen N email".
- **Konfirmo** / **Anulo**. Vetëm Konfirmo e thërret `/api/admin/dispatch`.

**Skeda "Të dërguara" — histori + ri-targetim:**
- Listë e artikujve `dispatchStatus='DISPATCHED'` (rendit sipas `dispatchedAt` desc), me: titulli, lloji, audienca (`describeAudience`), "te N biznese" (nga snapshot, shih §3.4), data, admini (`dispatchedById` → emër/email).
- Veprime për rresht:
  - **"Rikthe në radhë"** → `dispatchStatus='PENDING'` (artikulli rikthehet te "Për dërgim" për ri-audiencim/ri-dërgim).
  - (Ri-dërgimi pastaj kalon nga e njëjta rrjedhë; checkbox "Njofto" default **OFF** te ri-dërgimi për të shmangur ri-spam-imin.)

### 3.4 Të dhënat
- **Shto `dispatchedCount Int?`** (nullable) te Grant, TradeFair, NewsItem — migrim aditiv. Ruhet në momentin e dispeçimit (numri i marrësve atëherë), që historia të jetë e saktë edhe kur përdoruesit ndryshojnë/rriten më vonë. E ushqen edhe tracking-un e mëvonshëm (volumi).
- **"Kush e mori"** nuk kërkon tabelë të re: rreshtat `Notification` (userId + createdAt + link) janë regjistri për-marrës. Nëse vonë duhet "kush saktë", rindërtohet nga Notification.
- Asgjë tjetër s'fshihet/ndryshohet. Migrimi aditiv, jo-shkatërrues; backup para aplikimit (si fazat e mëparshme).

### 3.5 API
- `/api/admin/dispatch` (POST, ekziston) — shtohet ruajtja e `dispatchedCount` (numri i `ids`). Pa ndryshim tjetër.
- `/api/admin/dispatch/requeue` (POST, i ri) — admin-only; `{type,id}` → `dispatchStatus='PENDING'`. Për "Rikthe në radhë".
- Historia ngarkohet në server component te `/admin/dispatch/page.tsx` (query DISPATCHED, take ~50), pa endpoint shtesë.
- `/api/admin/dispatch/count` (ekziston) — pa ndryshim; ripërdoret edhe te paneli i konfirmimit.

## 4. Trajtimi i gabimeve
- Konfirmimi rillogarit numrin në çelje; nëse `/count` dështon, tregon "s'u llogarit numri" dhe e ndalon Konfirmo derisa të rifreskohet (pa dërgime verbërisht).
- `parseAudience` mbetet roja server-anash: audiencë bosh → 400 me mesazh shqip.
- Re-dërgim: "Njofto" default OFF; nëse admin e ndez, krijohen njoftime për audiencën e re (mund të dyfishojë për ata që e morën më parë — pranohet, sepse është zgjedhje e vetëdijshme e adminit; dokumentohet në UI me një vërejtje të vogël).
- Requeue dhe dispatch janë idempotente në nivel statusi (vendosin status, nuk grumbullojnë).

## 5. Testimi (vitest, ekziston `pnpm test`)
- `suggest-audience.test.ts`: sektorë të zbuluar → mode sector; fjalë-kyçe aktiviteti → mode activity (grante); bosh → mode all; lajm → all; gjithmonë `isValueComplete`=true dhe ≥1 reason.
- `audience-describe.test.ts`: secili mode → fjalia e saktë sq; forFemaleOwned i kombinuar dhe i vetëm.
- Testet ekzistuese (audience/dispatch/tier) mbeten jeshile.
- Verifikim manual: build jeshil, `pm2 reload`, rrjedha dërgim→konfirmim→histori→requeue e provuar në staging-localhost.

## 6. Fazat (secila e verifikuar para tjetrës)
- **Faza 1 — funksionet e pastra:** `suggest-audience.ts` + `audience-describe.ts` + teste. Pa UI, pa rrezik për live.
- **Faza 2 — konfirmimi (fitorja kryesore e sigurisë):** paneli i konfirmimit + blloku i audiencës së rekomanduar te kartela e fokusit. Pa "Dërgo" me një klik.
- **Faza 3 — histori + ri-targetim:** migrim aditiv `dispatchedCount`, skeda "Të dërguara", endpoint `requeue`.
- **Faza 4 — polish vizual:** skedat, header-i i progresit, paraqitja e arsyeve, gjendjet bosh.

## 7. Jashtë fushës (qëllimisht)
- Sugjerime audience me AI/Haiku (kosto; politika e shpenzimit). Heuristika deterministike mjafton.
- Dërgim masiv me një klik (rrezik gabimi; bie ndesh me "pa gabim").
- "Kush saktë e mori" si tabelë e dedikuar (Notification mjafton tani).
- Metrikat e gjera të tracking-ut (rrjedhë e ndarë pune: Admin + Tracking).

## 8. Kosto
- $0 nga krediti Anthropic. Pa thirrje API; rekomandimi është kod deterministik. Puna bëhet brenda kësaj bisede.
