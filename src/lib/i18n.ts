export type Locale = 'sq' | 'en' | 'de'

export const LOCALES: Locale[] = ['sq', 'en', 'de']
export const DEFAULT_LOCALE: Locale = 'sq'
export const LOCALE_COOKIE = 'NEXT_LOCALE'

export const LOCALE_LABELS: Record<Locale, string> = {
  sq: 'Shqip',
  en: 'English',
  de: 'Deutsch',
}

export const LOCALE_FLAGS: Record<Locale, string> = {
  sq: 'AL',
  en: 'EN',
  de: 'DE',
}

export function isLocale(v: unknown): v is Locale {
  return typeof v === 'string' && (LOCALES as string[]).includes(v)
}

type Dict = Record<Locale, string>

const M: Record<string, Dict> = {
  'nav.services':       { sq: 'Shërbimet',          en: 'Services',           de: 'Leistungen' },
  'nav.pricing':        { sq: 'Çmimet',             en: 'Pricing',            de: 'Preise' },
  'nav.about':          { sq: 'Rreth Nesh',         en: 'About',              de: 'Über uns' },
  'nav.login':          { sq: 'Hyr',                en: 'Sign in',            de: 'Anmelden' },
  'nav.register':       { sq: 'Regjistrohu',        en: 'Sign up',            de: 'Registrieren' },
  'nav.dashboard':      { sq: 'Dashboard',          en: 'Dashboard',          de: 'Dashboard' },
  'nav.logout':         { sq: 'Dil',                en: 'Log out',            de: 'Abmelden' },
  'lang.label':         { sq: 'Gjuha',              en: 'Language',           de: 'Sprache' },

  'home.badge':         { sq: 'Përditësohet në vazhdimësi', en: 'Continuously updated', de: 'Laufend aktualisiert' },
  'home.title.1':       { sq: 'Mundësitë e zhvillimit,', en: 'Development opportunities,', de: 'Entwicklungschancen,' },
  'home.title.2':       { sq: 'të mbledhura në një vend.', en: 'gathered in one place.', de: 'gebündelt an einem Ort.' },
  'home.sub':           {
    sq: 'Publikim i thirrjeve publike për financim dhe prezantim, përditësim i kalendarit të panaireve ndërkombëtare dhe i rregullave të eksportit.',
    en: 'Public calls for financing and presentation, an updated international fair calendar, and current export rules.',
    de: 'Öffentliche Aufrufe zu Finanzierung und Präsentation, ein aktualisierter Messekalender und aktuelle Exportvorschriften.',
  },
  'home.cta.start':     { sq: 'Krijo llogarinë falas', en: 'Create free account', de: 'Kostenloses Konto erstellen' },
  'home.cta.pricing':   { sq: 'Shiko çmimet',       en: 'See pricing',        de: 'Preise ansehen' },

  'stats.grants':       { sq: 'Grante aktive',      en: 'Active grants',      de: 'Aktive Förderaufrufe' },
  'stats.fairs':        { sq: 'Panaire ndërkombëtare', en: 'International fairs', de: 'Internationale Messen' },
  'stats.countries':    { sq: 'Vende me udhëzues',  en: 'Countries covered',  de: 'Abgedeckte Länder' },
  'stats.ai':           { sq: 'Përditësim në vazhdimësi', en: 'Continuously updated', de: 'Laufend aktualisiert' },

  'features.title':     { sq: 'Çfarë ke në një llogari', en: "What's in your account", de: 'Was in Ihrem Konto enthalten ist' },
  'features.sub':       {
    sq: 'Gjithçka që të duhet për të ndjekur grantet, panairet dhe rregullat e eksportit, pa hapur 20 faqe institucionesh çdo ditë.',
    en: 'Everything you need to track grants, fairs, and export rules without opening twenty institution websites a day.',
    de: 'Alles, was Sie brauchen, um Förderaufrufe, Messen und Exportregeln zu verfolgen, ohne täglich zwanzig Behördenseiten zu öffnen.',
  },

  'feat.grants.t':      { sq: 'Grantet aktive të Kosovës', en: 'Active Kosovo grants', de: 'Aktive Förderaufrufe in Kosovo' },
  'feat.grants.d':      {
    sq: 'Çdo thirrje publike nga KIESA, MZHR dhe MINT, me afatin e fundit, vlerën e financimit dhe link direkt për aplikim.',
    en: 'Every public funding call from KIESA, MZHR, and MINT, with deadline, funding amount, and a direct application link.',
    de: 'Jeder öffentliche Förderaufruf von KIESA, MZHR und MINT, mit Frist, Fördersumme und direktem Antrags-Link.',
  },
  'feat.fairs.t':       { sq: 'Panairet ndërkombëtare', en: 'International trade fairs', de: 'Internationale Messen' },
  'feat.fairs.d':       {
    sq: 'Panaire të verifikuara në Evropë dhe Lindjen e Mesme: TUTTOFOOD, IFA, Gulfood, BAU. Me datën, qytetin, organizatorin dhe afatin e regjistrimit.',
    en: 'Verified fairs across Europe and the Middle East: TUTTOFOOD, IFA, Gulfood, BAU. With date, city, organizer, and registration deadline.',
    de: 'Verifizierte Messen in Europa und im Nahen Osten: TUTTOFOOD, IFA, Gulfood, BAU. Mit Datum, Stadt, Veranstalter und Anmeldefrist.',
  },
  'feat.guides.t':      { sq: 'Udhëzues eksporti sipas tregut', en: 'Market-specific export guides', de: 'Marktspezifische Export-Leitfäden' },
  'feat.guides.d':      {
    sq: 'Dokumentet, taksat doganore dhe rregullat e importit për secilin treg ku synon të hysh. Të shkruara nga ekspertë, jo të kopjuara nga interneti.',
    en: 'Documents, customs duties, and import rules for each market you target. Written by experts, not copied off the internet.',
    de: 'Dokumente, Zollabgaben und Einfuhrvorschriften für jeden Zielmarkt. Von Fachleuten verfasst, nicht aus dem Netz kopiert.',
  },
  'feat.notif.t':       { sq: 'Njoftime të personalizuara', en: 'Tailored notifications', de: 'Personalisierte Benachrichtigungen' },
  'feat.notif.d':       {
    sq: 'Vendos sektorin dhe tregjet që të interesojnë. Në email të mbërrijnë vetëm thirrjet dhe panairet që të takojnë.',
    en: 'Pick your sector and target markets. Only the calls and fairs that fit you land in your inbox.',
    de: 'Wählen Sie Ihre Branche und Zielmärkte. Nur die Aufrufe und Messen, die zu Ihnen passen, landen in Ihrem Postfach.',
  },
  'feat.consult.t':     { sq: 'Konsultohu me ekspert', en: 'Talk to an expert', de: 'Beratung mit Experten' },
  'feat.consult.d':     {
    sq: 'Lër një takim me ekspertin tonë për një grant, panair apo çështje eksporti që po e mendon.',
    en: 'Book a session with our experts about a grant, a fair, or an export question on your mind.',
    de: 'Vereinbaren Sie einen Termin mit unseren Fachleuten zu einem Förderaufruf, einer Messe oder einer Exportfrage.',
  },

  'cta.ready':          { sq: 'Hape llogarinë sot. Shiko çfarë afatesh janë aktive.', en: 'Open an account today. See what is active.', de: 'Eröffnen Sie heute ein Konto. Sehen Sie, was aktiv ist.' },
  'cta.ready.sub':      {
    sq: 'Llogaria bazë të jep qasje në grantet aktive dhe kalendarin e panaireve. Pa pagesë, pa kohëzgjatje. Mund të kalosh në plan me pagesë vetëm nëse ke nevojë për njoftime të personalizuara, udhëzues të plotë ose konsultime.',
    en: 'The free account gives you access to active grants and the fair calendar. No charge, no time limit. Move to a paid plan only if you need personalized notifications, full guides, or consultations.',
    de: 'Das kostenlose Konto gibt Ihnen Zugang zu aktiven Förderaufrufen und zum Messekalender. Keine Gebühr, keine Laufzeit. Wechseln Sie nur dann zu einem kostenpflichtigen Plan, wenn Sie personalisierte Benachrichtigungen, vollständige Leitfäden oder Beratung benötigen.',
  },
  'cta.register.free':  { sq: 'Krijo llogarinë falas', en: 'Create free account', de: 'Kostenloses Konto erstellen' },
  'cta.noCard':         { sq: 'Pa kartë krediti',   en: 'No credit card',     de: 'Keine Kreditkarte' },
  'cta.cancel':         { sq: 'Anulim me një klikim', en: 'Cancel in one click', de: 'Mit einem Klick kündbar' },
  'cta.support':        { sq: 'Mbështetje në shqip', en: 'Albanian-speaking support', de: 'Albanischsprachiger Support' },

  'footer.tagline':     {
    sq: 'Mbledhim grantet, panairet dhe rregullat e eksportit në një vend, që biznesi yt të fokusohet në prodhim, jo në kërkim.',
    en: 'We gather grants, fairs, and export rules in one place, so your business can focus on production, not searching.',
    de: 'Wir bündeln Förderaufrufe, Messen und Exportvorschriften an einem Ort, damit sich Ihr Unternehmen auf die Produktion konzentrieren kann, nicht auf die Suche.',
  },
  'footer.links':       { sq: 'Linqe',              en: 'Links',              de: 'Links' },
  'footer.contact':     { sq: 'Kontakti',           en: 'Contact',            de: 'Kontakt' },
  'footer.rights':      { sq: 'Të gjitha të drejtat e rezervuara.', en: 'All rights reserved.', de: 'Alle Rechte vorbehalten.' },
  'footer.phone':       { sq: '+383 49 814 069',    en: '+383 49 814 069',    de: '+383 49 814 069' },
  'footer.city':        { sq: 'Prishtinë, Kosovë',  en: 'Prishtina, Kosovo',  de: 'Prishtina, Kosovo' },
  'footer.email':       { sq: 'info@kosovabusinesses.aiaohub.com', en: 'info@kosovabusinesses.aiaohub.com', de: 'info@kosovabusinesses.aiaohub.com' },

  'pricing.title':      { sq: 'Çmimet',             en: 'Pricing',            de: 'Preise' },
  'pricing.sub':        {
    sq: 'Zgjidhni planin që i përshtatet nevojave të biznesit tuaj.',
    en: 'Pick the plan that fits your business needs.',
    de: 'Wählen Sie den passenden Plan für Ihr Unternehmen.',
  },
  'pricing.popular':    { sq: 'Më Popullorja',      en: 'Most Popular',       de: 'Am beliebtesten' },
  'pricing.perMonth':   { sq: '/muaj',              en: '/month',             de: '/Monat' },
  'pricing.starter.d':  { sq: 'Për biznese të vogla që duan të eksplorojnë mundësitë e eksportit.', en: 'For small businesses exploring export opportunities.', de: 'Für kleine Unternehmen, die Exportchancen prüfen.' },
  'pricing.pro.d':      { sq: 'Për biznese aktive që eksportojnë rregullisht.', en: 'For active businesses exporting regularly.', de: 'Für aktive Unternehmen, die regelmäßig exportieren.' },
  'pricing.ent.d':      { sq: 'Për kompani të mëdha me nevoja të avancuara.', en: 'For large companies with advanced needs.', de: 'Für große Unternehmen mit anspruchsvollen Anforderungen.' },
  'pricing.cta.starter':{ sq: 'Fillo me Starter',   en: 'Start with Starter', de: 'Mit Starter beginnen' },
  'pricing.cta.pro':    { sq: 'Fillo me Professional', en: 'Start with Professional', de: 'Mit Professional beginnen' },
  'pricing.cta.ent':    { sq: 'Fillo me Enterprise', en: 'Start with Enterprise', de: 'Mit Enterprise beginnen' },
  'pricing.f.grants':   { sq: 'Databaza e granteve', en: 'Grants database',    de: 'Zuschuss-Datenbank' },
  'pricing.f.fairs':    { sq: 'Kalendari i panaireve', en: 'Trade fair calendar', de: 'Messekalender' },
  'pricing.f.guides5':  { sq: '5 udhëzues eksporti/muaj', en: '5 export guides / month', de: '5 Export-Leitfäden / Monat' },
  'pricing.f.email':    { sq: 'Njoftime me email',  en: 'Email notifications', de: 'E-Mail-Benachrichtigungen' },
  'pricing.f.smart':    { sq: 'Njoftime inteligjente AI', en: 'AI smart notifications', de: 'KI-Smart-Benachrichtigungen' },
  'pricing.f.consult':  { sq: 'Konsultime eksperti', en: 'Expert consultations', de: 'Expertenberatungen' },
  'pricing.f.api':      { sq: 'API akses',          en: 'API access',         de: 'API-Zugang' },
  'pricing.f.guidesUnlim': { sq: 'Udhëzues eksporti pa limit', en: 'Unlimited export guides', de: 'Unbegrenzte Export-Leitfäden' },
  'pricing.f.consult2m':{ sq: '2 konsultime/muaj',  en: '2 consultations / month', de: '2 Beratungen / Monat' },
  'pricing.f.consultUnlim': { sq: 'Konsultime pa limit', en: 'Unlimited consultations', de: 'Unbegrenzte Beratungen' },
  'pricing.f.apiFull':  { sq: 'API akses i plotë',  en: 'Full API access',    de: 'Voller API-Zugang' },

  'about.title':        { sq: 'Rreth Nesh',         en: 'About Us',           de: 'Über uns' },
  'about.sub':          {
    sq: 'Misioni ynë është të fuqizojmë prodhuesit kosovarë në tregjet ndërkombëtare.',
    en: 'Our mission is to empower Kosovo manufacturers in international markets.',
    de: 'Unsere Mission: kosovarische Hersteller auf internationalen Märkten zu stärken.',
  },
  'about.body.1':       {
    sq: 'Kosova Business Hub është krijuar nga njerëz që e njohin tregun kosovar, që kanë eksperiencë të gjatë në panaire dhe eksport, si dhe në gjetjen dhe përgatitjen e projekteve për grante në ministri, institucione dhe organizata të ndryshme.',
    en: 'Kosova Business Hub was built by people who know the Kosovo market and have years of experience in trade fairs, exporting, and preparing grant applications for ministries, institutions, and various organizations.',
    de: 'Kosova Business Hub wurde von Menschen aufgebaut, die den kosovarischen Markt kennen und über jahrelange Erfahrung in Messen, Export sowie in der Erstellung von Förderanträgen für Ministerien, Institutionen und verschiedene Organisationen verfügen.',
  },
  'about.body.2':       {
    sq: 'Ne monitorojmë automatikisht agjenci, ministri dhe organizata të huaja e vendore, i kombinojmë me kalendarin e panaireve ndërkombëtare, dhe ruajmë një bazë të rregullave doganore për tregjet kryesore evropiane.',
    en: 'We automatically monitor agencies, ministries, and foreign and domestic organizations, combine these with the international trade fair calendar, and maintain a database of customs rules for major European markets.',
    de: 'Wir überwachen automatisch Agenturen, Ministerien und ausländische sowie inländische Organisationen, kombinieren diese mit dem internationalen Messekalender und pflegen eine Datenbank mit Zollvorschriften für die wichtigsten europäischen Märkte.',
  },
  'about.body.3':       {
    sq: 'Çfarë merr ti është një faqe e vetme që të tregon çfarë afatesh janë aktive, çfarë panairesh kanë regjistrim të hapur, dhe çfarë dokumentesh të duhen për një treg të ri apo një thirrje për grant.',
    en: 'What you get is a single page that shows you which deadlines are active, which fairs have open registration, and which documents you need for a new market or a grant call.',
    de: 'Sie erhalten eine einzige Seite, die Ihnen zeigt, welche Fristen aktiv sind, welche Messen Anmeldungen entgegennehmen und welche Dokumente Sie für einen neuen Markt oder einen Förderaufruf benötigen.',
  },
  'about.mission':      { sq: 'Misioni',            en: 'Mission',            de: 'Mission' },
  'about.mission.d':    {
    sq: 'Të bëjmë informacionin e eksportit të kapshëm për çdo biznes në Kosovë.',
    en: 'Make export information within reach for every business in Kosovo.',
    de: 'Exportinformationen für jedes Unternehmen im Kosovo greifbar machen.',
  },
  'about.vision':       { sq: 'Vizioni',            en: 'Vision',             de: 'Vision' },
  'about.vision.d':     {
    sq: 'Kosova si lider rajonal në eksport, me biznese të informuara dhe konkurruese.',
    en: 'Kosovo as a regional export leader, with informed and competitive businesses.',
    de: 'Kosovo als regionaler Exportführer, mit informierten und wettbewerbsfähigen Unternehmen.',
  },
  'about.team':         { sq: 'Ekipi',              en: 'Team',               de: 'Team' },
  'about.team.d':       {
    sq: 'Ekspertë të tregtisë ndërkombëtare dhe teknologjisë, me bazë në Prishtinë.',
    en: 'International trade and technology experts, based in Prishtina.',
    de: 'Außenhandels- und Technologieexperten mit Sitz in Prishtina.',
  },

  'auth.login.title':   { sq: 'Hyr në llogarinë',   en: 'Sign in to your account', de: 'In Ihr Konto anmelden' },
  'auth.email':         { sq: 'Email',              en: 'Email',              de: 'E-Mail' },
  'auth.password':      { sq: 'Fjalëkalimi',        en: 'Password',           de: 'Passwort' },
  'auth.login.submit':  { sq: 'Hyr',                en: 'Sign in',            de: 'Anmelden' },
  'auth.login.noAcc':   { sq: 'Nuk keni llogari?',  en: "Don't have an account?", de: 'Noch kein Konto?' },
  'auth.login.error':   { sq: 'Email ose fjalëkalim i gabuar', en: 'Invalid email or password', de: 'Ungültige E-Mail oder Passwort' },

  'auth.reg.title':     { sq: 'Krijo Llogari',      en: 'Create Account',     de: 'Konto erstellen' },
  'auth.reg.name':      { sq: 'Emri i plotë',       en: 'Full name',          de: 'Vollständiger Name' },
  'auth.reg.company':   { sq: 'Emri i Kompanisë',   en: 'Company name',       de: 'Firmenname' },
  'auth.reg.confirm':   { sq: 'Konfirmo Fjalëkalimin', en: 'Confirm password', de: 'Passwort bestätigen' },
  'auth.reg.sector':    { sq: 'Sektori',            en: 'Sector',             de: 'Branche' },
  'auth.reg.sector.ph': { sq: 'Zgjidhni sektorin',  en: 'Select a sector',    de: 'Branche wählen' },
  'auth.reg.interests': { sq: 'Interesat',          en: 'Interests',          de: 'Interessen' },
  'auth.reg.submit':    { sq: 'Regjistrohu',        en: 'Create account',     de: 'Konto erstellen' },
  'auth.reg.hasAcc':    { sq: 'Keni llogari?',      en: 'Already have an account?', de: 'Schon ein Konto?' },
  'auth.reg.mismatch':  { sq: 'Fjalëkalimi nuk përputhet', en: 'Passwords do not match', de: 'Passwörter stimmen nicht überein' },
  'auth.reg.tooShort':  { sq: 'Fjalëkalimi duhet të ketë së paku 8 karaktere', en: 'Password must be at least 8 characters', de: 'Das Passwort muss mindestens 8 Zeichen lang sein' },
  'auth.reg.generic':   { sq: 'Gabim gjatë regjistrimit', en: 'Registration failed', de: 'Registrierung fehlgeschlagen' },

  'int.grants':         { sq: 'Grante & Fonde',     en: 'Grants & Funding',   de: 'Zuschüsse & Förderung' },
  'int.fairs':          { sq: 'Panaire Tregtare',   en: 'Trade Fairs',        de: 'Messen' },
  'int.guides':         { sq: 'Udhëzues Eksporti',  en: 'Export Guides',      de: 'Export-Leitfäden' },
  'int.consultations':  { sq: 'Konsultime',         en: 'Consultations',      de: 'Beratungen' },

  'dash.sidebar.dashboard':    { sq: 'Dashboard',         en: 'Dashboard',          de: 'Dashboard' },
  'dash.sidebar.grants':       { sq: 'Grante',            en: 'Grants',             de: 'Zuschüsse' },
  'dash.sidebar.fairs':        { sq: 'Panaire',           en: 'Trade Fairs',        de: 'Messen' },
  'dash.sidebar.guides':       { sq: 'Udhëzues',          en: 'Guides',             de: 'Leitfäden' },
  'dash.sidebar.notifications':{ sq: 'Njoftime',          en: 'Notifications',      de: 'Benachrichtigungen' },
  'dash.sidebar.bookings':     { sq: 'Konsultime',        en: 'Consultations',      de: 'Beratungen' },
  'dash.sidebar.subscription': { sq: 'Abonimi',           en: 'Subscription',       de: 'Abonnement' },
  'dash.sidebar.settings':     { sq: 'Cilësimet',         en: 'Settings',           de: 'Einstellungen' },
  'dash.sidebar.admin':        { sq: 'Admin Panel',       en: 'Admin Panel',        de: 'Admin-Panel' },

  'dash.welcome':       { sq: 'Mirë se erdhët',     en: 'Welcome',            de: 'Willkommen' },
  'dash.welcome.sub':   { sq: 'Ja një përmbledhje e platformës tuaj.', en: "Here's an overview of your platform.", de: 'Hier ist eine Übersicht über Ihre Plattform.' },
  'dash.fallback.user': { sq: 'Përdorues',          en: 'User',               de: 'Nutzer' },
  'dash.stat.grants':   { sq: 'Grante Aktive',      en: 'Active Grants',      de: 'Aktive Zuschüsse' },
  'dash.stat.fairs':    { sq: 'Panaire të Ardhshme', en: 'Upcoming Fairs',    de: 'Kommende Messen' },
  'dash.stat.guides':   { sq: 'Udhëzues',           en: 'Guides',             de: 'Leitfäden' },
  'dash.stat.notif':    { sq: 'Njoftime të Palexuara', en: 'Unread Notifications', de: 'Ungelesene Benachrichtigungen' },
  'dash.recent.grants': { sq: 'Grantet e Fundit',   en: 'Latest Grants',      de: 'Neueste Zuschüsse' },
  'dash.upcoming.fairs':{ sq: 'Panairet e Ardhshme',en: 'Upcoming Fairs',     de: 'Kommende Messen' },
  'dash.seeAll':        { sq: 'Shiko të gjitha',    en: 'See all',            de: 'Alle ansehen' },
  'dash.empty.grants':  { sq: 'Nuk ka grante akoma. AI scraper do ti gjejë së shpejti!', en: 'No grants yet. The AI scraper will fetch them soon.', de: 'Noch keine Zuschüsse. Der KI-Scraper wird sie bald abrufen.' },
  'dash.empty.fairs':   { sq: 'Nuk ka panaire të planifikuara akoma.', en: 'No fairs scheduled yet.', de: 'Noch keine geplanten Messen.' },

  'guides.title':       { sq: 'Udhëzues Eksporti',  en: 'Export Guides',      de: 'Export-Leitfäden' },
  'guides.sub':         { sq: 'Udhëzues të detajuar për eksport sipas vendit dhe sektorit.', en: 'Detailed export guides by country and sector.', de: 'Ausführliche Export-Leitfäden nach Land und Branche.' },
  'guides.empty.t':     { sq: 'Nuk ka udhëzues akoma', en: 'No guides yet',    de: 'Noch keine Leitfäden' },
  'guides.empty.d':     { sq: 'Udhëzuesit e eksportit do të shtohen së shpejti.', en: 'Export guides will be added soon.', de: 'Export-Leitfäden werden bald hinzugefügt.' },
  'guides.read':        { sq: 'Lexo udhëzuesin',    en: 'Read guide',         de: 'Leitfaden lesen' },
}

export function t(locale: Locale, key: string, vars?: Record<string, string | number>): string {
  const entry = M[key]
  let out = entry ? entry[locale] || entry[DEFAULT_LOCALE] || key : key
  if (vars) {
    for (const [k, v] of Object.entries(vars)) out = out.replaceAll(`{${k}}`, String(v))
  }
  return out
}

export function makeT(locale: Locale) {
  return (key: string, vars?: Record<string, string | number>) => t(locale, key, vars)
}
