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

  'home.badge':         { sq: 'Me Inteligjencë Artificiale', en: 'Powered by Artificial Intelligence', de: 'Mit künstlicher Intelligenz' },
  'home.title.1':       { sq: 'Inteligjenca e Eksportit', en: 'Export Intelligence', de: 'Export-Intelligenz' },
  'home.title.2':       { sq: 'për Kosovën',        en: 'for Kosovo',         de: 'für den Kosovo' },
  'home.sub':           {
    sq: 'Platforma e vetme që përdor AI për të gjetur grante, panaire tregtare dhe mundësi eksporti për prodhuesit Kosovarë. Automatikisht, çdo ditë.',
    en: 'The only platform that uses AI to find grants, trade fairs and export opportunities for Kosovar manufacturers. Automatically, every day.',
    de: 'Die einzige Plattform, die KI nutzt, um Zuschüsse, Messen und Exportchancen für kosovarische Hersteller zu finden. Automatisch, jeden Tag.',
  },
  'home.cta.start':     { sq: 'Fillo Falas',        en: 'Start Free',         de: 'Kostenlos starten' },
  'home.cta.pricing':   { sq: 'Shiko Çmimet',       en: 'See Pricing',        de: 'Preise ansehen' },

  'stats.grants':       { sq: 'Grante të Monitoruara', en: 'Tracked Grants',   de: 'Überwachte Zuschüsse' },
  'stats.fairs':        { sq: 'Panaire Tregtare',   en: 'Trade Fairs',        de: 'Fachmessen' },
  'stats.countries':    { sq: 'Vende me Udhëzues',  en: 'Countries Covered',  de: 'Abgedeckte Länder' },
  'stats.ai':           { sq: 'Monitoring me AI',   en: 'AI Monitoring',      de: 'KI-Überwachung' },

  'features.title':     { sq: 'Çfarë Ofrojmë',      en: 'What We Offer',      de: 'Unser Angebot' },
  'features.sub':       {
    sq: 'Platforma jonë përdor inteligjencë artificiale për të monitoruar dhe gjetur mundësitë më të mira të eksportit për biznesin tuaj.',
    en: 'Our platform uses AI to monitor and surface the best export opportunities for your business.',
    de: 'Unsere Plattform nutzt KI, um die besten Exportchancen für Ihr Unternehmen zu finden und zu überwachen.',
  },

  'feat.grants.t':      { sq: 'Databaza e Granteve', en: 'Grants Database',   de: 'Zuschuss-Datenbank' },
  'feat.grants.d':      {
    sq: 'AI kërkon dhe gjen grante të përshtatshme për biznesin tuaj çdo ditë automatikisht.',
    en: 'AI searches daily for grants that match your business.',
    de: 'Die KI sucht täglich automatisch passende Zuschüsse für Ihr Unternehmen.',
  },
  'feat.fairs.t':       { sq: 'Kalendari i Panaireve', en: 'Trade Fair Calendar', de: 'Messekalender' },
  'feat.fairs.d':       {
    sq: 'Panairet tregtare ndërkombëtare të rëndësishme për eksportuesit e Kosovës.',
    en: 'International trade fairs relevant to Kosovar exporters.',
    de: 'Internationale Fachmessen, die für kosovarische Exporteure relevant sind.',
  },
  'feat.guides.t':      { sq: 'Udhëzues Eksporti',  en: 'Export Guides',      de: 'Export-Leitfäden' },
  'feat.guides.d':      {
    sq: 'Udhëzues të detajuar për eksport sipas vendit, duke përfshirë rregullat dhe dokumentet.',
    en: 'Detailed per-country export guides including rules and paperwork.',
    de: 'Ausführliche länderspezifische Export-Leitfäden inkl. Regeln und Dokumenten.',
  },
  'feat.notif.t':       { sq: 'Njoftime Inteligjente', en: 'Smart Notifications', de: 'Intelligente Benachrichtigungen' },
  'feat.notif.d':       {
    sq: 'Merrni njoftime kur gjenden grante ose panaire që përputhen me interesat tuaja.',
    en: 'Get alerts when grants or fairs matching your interests appear.',
    de: 'Erhalten Sie Benachrichtigungen zu passenden Zuschüssen und Messen.',
  },
  'feat.market.t':      { sq: 'Analiza Tregu',      en: 'Market Analysis',    de: 'Marktanalyse' },
  'feat.market.d':      {
    sq: 'Informacione mbi tregjet e eksportit dhe mundësitë e rritjes.',
    en: 'Insights on export markets and growth opportunities.',
    de: 'Einblicke in Exportmärkte und Wachstumschancen.',
  },
  'feat.consult.t':     { sq: 'Konsultime',         en: 'Consultations',      de: 'Beratungen' },
  'feat.consult.d':     {
    sq: 'Rezervoni konsultime me ekspertë të eksportit dhe tregtisë ndërkombëtare.',
    en: 'Book sessions with export and international trade experts.',
    de: 'Buchen Sie Termine mit Export- und Außenhandelsexperten.',
  },

  'cta.ready':          { sq: 'Gati për të Rritur Eksportin?', en: 'Ready to Grow Your Exports?', de: 'Bereit, Ihre Exporte zu steigern?' },
  'cta.ready.sub':      {
    sq: 'Bashkohuni me qindra biznese Kosovare që përdorin platformën tonë.',
    en: 'Join hundreds of Kosovar businesses using our platform.',
    de: 'Schließen Sie sich hunderten kosovarischen Unternehmen an.',
  },
  'cta.register.free':  { sq: 'Regjistrohu Tani - Falas', en: 'Sign Up Now — Free', de: 'Jetzt kostenlos registrieren' },
  'cta.noCard':         { sq: 'Pa kartë krediti',   en: 'No credit card',     de: 'Keine Kreditkarte nötig' },
  'cta.freeForever':    { sq: 'Plani falas përgjithmonë', en: 'Free plan forever', de: 'Für immer kostenloser Plan' },

  'footer.tagline':     {
    sq: 'Platforma e inteligjencës së eksportit për prodhuesit e Kosovës. Zbuloni grante, panaire tregtare dhe udhëzues eksporti me AI.',
    en: 'Export intelligence platform for Kosovar manufacturers. Discover grants, trade fairs and export guides with AI.',
    de: 'Export-Intelligenzplattform für kosovarische Hersteller. Entdecken Sie Zuschüsse, Messen und Leitfäden mit KI.',
  },
  'footer.links':       { sq: 'Linqe',              en: 'Links',              de: 'Links' },
  'footer.contact':     { sq: 'Kontakti',           en: 'Contact',            de: 'Kontakt' },
  'footer.rights':      { sq: 'Të gjitha të drejtat e rezervuara.', en: 'All rights reserved.', de: 'Alle Rechte vorbehalten.' },

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
    sq: 'Misioni ynë është të fuqizojmë prodhuesit Kosovarë në tregjet ndërkombëtare.',
    en: 'Our mission is to empower Kosovar manufacturers in international markets.',
    de: 'Unsere Mission: kosovarische Hersteller auf internationalen Märkten zu stärken.',
  },
  'about.body':         {
    sq: 'Business Hub Kosova është platforma e parë e inteligjencës së eksportit e ndërtuar posaçërisht për prodhuesit dhe eksportuesit e Kosovës. Duke përdorur inteligjencë artificiale, ne monitorojmë qindra burime çdo ditë për të gjetur grante, panaire tregtare dhe mundësi eksporti që përputhen me nevojat e biznesit tuaj.',
    en: 'Business Hub Kosova is the first export-intelligence platform built specifically for Kosovar manufacturers and exporters. Using AI, we monitor hundreds of sources daily to find grants, trade fairs and export opportunities aligned with your business.',
    de: 'Business Hub Kosova ist die erste Export-Intelligenzplattform, die speziell für kosovarische Hersteller und Exporteure entwickelt wurde. Mit KI überwachen wir täglich hunderte Quellen nach Zuschüssen, Messen und Exportchancen, die zu Ihrem Geschäft passen.',
  },
  'about.mission':      { sq: 'Misioni',            en: 'Mission',            de: 'Mission' },
  'about.mission.d':    {
    sq: 'Të bëjmë informacionin e eksportit të aksesueshëm për çdo biznes në Kosovë.',
    en: 'Make export information accessible to every business in Kosovo.',
    de: 'Exportinformationen für jedes Unternehmen im Kosovo zugänglich machen.',
  },
  'about.vision':       { sq: 'Vizioni',            en: 'Vision',             de: 'Vision' },
  'about.vision.d':     {
    sq: 'Kosova si lider rajonal në eksport, me biznese të informuara dhe konkurruese.',
    en: 'Kosovo as a regional export leader with informed, competitive businesses.',
    de: 'Kosovo als regionaler Exportführer mit informierten, wettbewerbsfähigen Unternehmen.',
  },
  'about.team':         { sq: 'Ekipi',              en: 'Team',               de: 'Team' },
  'about.team.d':       {
    sq: 'Ekspertë të teknologjisë dhe tregtisë ndërkombëtare nga Kosova.',
    en: 'Technology and international trade experts from Kosovo.',
    de: 'Technologie- und Außenhandelsexperten aus dem Kosovo.',
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
