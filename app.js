const PROJECTS_KEY = 'projects-list';
const PAMINNELSER_KEY = 'paminnelser';

// De fem individuella kontona. Namnet visas automatiskt utifrån vem som loggat
// in (eget konto) - ingen fritextruta längre. id:na är kontonas riktiga
// Supabase Auth user-id, hämtade när kontona skapades - krävs för att kunna
// tilldela ett Liggaren-ärende till en specifik kollega (se schema-liggaren.sql).
const LIGGAREN_PEOPLE = [
  { name: 'Mikael',  email: 'mikael.issa@jwk.se',            id: '5e35722c-d763-4c54-ab20-ee68acf74bb5' },
  { name: 'Saman',   email: 'saman.haake@solvinkeln.se',      id: '2e4f60ed-f521-4171-9df5-70889790a20c' },
  { name: 'Ashur',   email: 'ashur.ibrahim@solvinkeln.se',    id: '21c682f4-e70d-499a-a8f2-703bdac23a02' },
  { name: 'Sargon',  email: 'sargon.akcan@jwk.se',            id: 'a08976c1-7006-43a2-9c99-83bd68a32d94' },
  { name: 'Rebecka', email: 'rebecka.bergvall@solvinkeln.se', id: '417f258d-8e43-4555-b7a4-289986b535f7' }
];
const PERSONAL_NAMES_BY_EMAIL = LIGGAREN_PEOPLE.reduce((acc, p) => { acc[p.email.toLowerCase()] = p.name; return acc; }, {});

// ---------- Ekonomi (företagsövergripande, bara synlig/nåbar för detta konto) ----------
// Datan lagras privat via DB.getPersonalData/setPersonalData (personal_data-
// tabellen, RLS: auth.uid() = user_id) - se schema-personal.sql. Ingen extra
// databasspärr behövs utöver den, eftersom ingen annan användares konto kan nå
// dessa rader ändå. E-postkollen nedan är bara en UI-spärr.
const EKONOMI_ADMIN_EMAIL = 'mikael.issa@jwk.se';
const EKONOMI_KEYS = {
  meta: 'ekonomi-projekt-meta',
  budgetDetalj: 'ekonomi-budget-detalj',
  reskontra: 'ekonomi-reskontra',
  likviditet: 'ekonomi-likviditet',
  lan: 'ekonomi-lan',
  brItems: 'ekonomi-br-items',
  mark: 'ekonomi-mark'
};
// Fast lista kostnadsposter i en projektbudget - Totalkostnad räknas alltid ut,
// tilldelas aldrig en reskontrarad.
const EKONOMI_COST_CATEGORIES = [
  'Markförvärv', 'Entreprenad', 'Markarbete', 'Sanering/rivning', 'Byggström', 'Kommun avgifter',
  'VA anslutningar', 'El anslutning', 'KA', 'Ekonomiskplan', 'Slutstädning', 'Finansiering', 'Kassa Brf',
  'Renderingar', 'Arkitekt', 'Försäljningsmaterial', 'Mäklararvode', 'Sociala medier', 'Brf Styrelsearvode',
  'Bopärm och system', 'Försäljningsdagar', 'Kamera', 'Garantiåtgärder', 'Två årsbesiktningspunkter',
  'Övriga projekteringskostnader/konsulter', 'Solvinkeln nedlagd tid', 'Buffert'
];
const EKONOMI_TAB_CONFIG = {
  likviditet: {
    key: 'likviditet',
    tbodyId: 'ekonomiLikviditetBody',
    fields: [ { key: 'belopp', label: 'Likviditet (kr)' } ]
  },
  lan: {
    key: 'lan',
    tbodyId: 'ekonomiLanBody',
    fields: [
      { key: 'fastighetsvarde', label: 'Fastighetsvärde (kr)' },
      { key: 'externtLan', label: 'Externt lån (kr)', dated: true },
      { key: 'lanSolvinkeln', label: 'Lån Solvinkeln (kr)', dated: true },
      { key: 'lanNBE', label: 'Lån NBE (kr)', dated: true },
      { key: 'lanDerome', label: 'Lån Derome (kr)', dated: true },
      { key: 'lanBORO', label: 'Lån BORO (kr)', dated: true }
    ]
  }
};

// ---------- Liggaren (ärenderegister, kan tilldelas en kollega) ----------
const LIGGAREN_STATUS = { OPPET: 'oppet', PAGAENDE: 'pagaende', KLART: 'klart' };
const LIGGAREN_STATUS_LABEL = { oppet: 'Att göra', pagaende: 'Pågående', klart: 'Klart' };
const LIGGAREN_STATUS_ORDER = [LIGGAREN_STATUS.OPPET, LIGGAREN_STATUS.PAGAENDE, LIGGAREN_STATUS.KLART];
const LIGGAREN_PRIORITIES = [1, 2, 3, 4, 5];
const LIGGAREN_PRIORITY_COLOR = p => (p <= 2 ? 'var(--danger)' : p === 3 ? 'var(--blue)' : 'var(--ink-soft)');
const LIGGAREN_DEFAULT_EMAILS = ['Mikael.issa@solvinkeln.se', 'Saman.haake@solvinkeln.se', 'Rebecka.bergvall@solvinkeln.se'];
const LIGGAREN_RECURRING_KEY = 'liggaren-recurring-templates';
const SWEDISH_MONTHS = ['januari', 'februari', 'mars', 'april', 'maj', 'juni', 'juli', 'augusti', 'september', 'oktober', 'november', 'december'];
const LIGGAREN_PROJECTS = [
  'Privat', 'Solvinkeln Fastigheter AB', 'Saman', 'Rebecka', 'Ashur', 'Aygun',
  'Brf Gladö Sjöutsikten', 'Brf Gladö Sjöglimten', 'Brf Gladö Höjden', 'Brf Gladö Utsikten', 'Brf Gladö Viken',
  'Brf Aktrisen', 'Brf Kulissen', 'Brf Regissören', 'Brf Vistabergshöjden', 'Brf Glömstahöjden',
  'Projekt Nacka Kummelnäs', 'Brf Enköping'
];
const CHECK_FIELDS = ['sald','slutbetald','grovstadat','finstadat','sopkarl','fiber','brevlada'];
const CHECK_LABELS = {
  sald: 'Såld', slutbetald: 'Slutbetald',
  grovstadat: 'Grovstäd', finstadat: 'Finstäd', sopkarl: 'Sopkärl',
  fiber: 'Fiber', brevlada: 'Brevlåda'
};

// Extraherat från kostnadskalkylen (avsnitt 6, sid 8-9): Lgh nr, Area m², Årsavgift kr/mån, Totalt kr
const SEED_APARTMENTS_BY_PROJECT_NAME = {
  'Brf Gladö Höjden': [
    [1,59,2989,2495000],[2,125,5383,4695000],[3,125,5383,4695000],[4,125,5383,4795000],
    [5,125,5383,4495000],[6,59,2989,2495000],[7,59,2989,2650000],[8,125,5383,4695000],
    [9,125,5383,4650000],[10,59,2989,2650000],[11,125,5383,4450000],[12,125,5383,4395000],
    [13,125,5383,4795000],[14,125,5383,4650000],[15,59,2989,2495000],[16,59,2989,2595000],
    [17,125,5383,4695000],[18,125,5383,4695000],[19,59,2989,2550000],[20,125,5383,4750000],
    [21,125,5383,4750000],[22,59,2989,2495000],[23,125,5383,4695000],[24,125,5383,4695000],
    [25,59,2989,2550000],[26,125,5383,4595000],[27,125,5383,4695000],[28,59,2989,2395000],
    [29,125,5383,4695000],[30,125,5383,4695000]
  ],
  // Extraherat från ekonomiska planen (avsnitt 6, sid 9): Lgh/adr nr, Area m², Årsavgift kr/mån, Totalt kr
  // Extraherat från ekonomiska planen (avsnitt 6, sid 9): Lgh nr, Area m², Årsavgift kr/mån, Totalt kr, Adress
  'Brf Glömstahöjden': [
    [1,39,2427,1795000,'Ryttarvägen 1 A'],[2,135,5444,6695000,'Ryttarvägen 1 B'],[3,135,5444,6795000,'Ryttarvägen 1 C'],
    [4,39,2427,1795000,'Ryttarvägen 1 D'],[5,135,5444,6650000,'Ryttarvägen 1 E'],[6,135,5444,6750000,'Ryttarvägen 1 F'],
    [7,135,5444,6595000,'Ryttarvägen 1 M'],[8,135,5444,6495000,'Ryttarvägen 1 L'],[9,39,2427,1850000,'Ryttarvägen 1 K'],
    [10,135,5444,6895000,'Ryttarvägen 1 G'],[11,135,5444,6795000,'Ryttarvägen 1 H'],[12,39,2427,1950000,'Ryttarvägen 1 J'],
    [13,138,5458,6095000,'Ryttarvägen 3 A'],[14,138,5458,5995000,'Ryttarvägen 3 B'],[15,49,2817,2795000,'Ryttarvägen 3 C'],
    [16,135,5444,6850000,'Ryttarvägen 3 D'],[17,135,5444,6695000,'Ryttarvägen 3 E'],[18,39,2427,1995000,'Ryttarvägen 3 F'],
    [19,135,5444,6595000,'Ryttarvägen 3 G'],[20,135,5444,6550000,'Ryttarvägen 3 H'],[21,39,2427,1895000,'Ryttarvägen 3 J']
  ],
  // Extraherat från kostnadskalkylen (avsnitt 6, sid 8): Lgh nr, Area m², Årsavgift kr/mån, Totalt kr
  'Brf Aktrisen': [
    [1,141,5697,4695000],[2,141,5697,4495000],[3,141,5697,4495000],[4,141,5697,4495000],
    [5,141,5697,4650000],[6,167,6747,4795000],[7,167,6747,4695000],[8,167,6747,4495000],
    [9,167,6747,4450000],[10,167,6747,4495000],[11,167,6747,4695000],[12,141,5697,4495000],
    [13,141,5697,4295000],[14,141,5697,4295000],[15,141,5697,4295000],[16,141,5697,4595000]
  ],
  // Extraherat från ekonomiska planen (avsnitt 6, sid 9): Lgh nr, Area m², Årsavgift kr/mån, Totalt kr
  'Brf Kulissen': [
    [1,136,4990,4195000],[2,136,4990,3895000],[3,136,4990,3895000],[4,136,4990,3795000],
    [5,136,4990,3695000],[6,136,4990,3795000],[7,136,4990,3895000],[8,136,4990,3895000],
    [9,136,4990,4095000],[10,179,5971,4650000],[11,179,5971,4495000],[12,179,5971,4295000],
    [13,179,5971,4295000],[14,179,5971,4450000],[15,179,5971,4595000],[16,136,4990,4295000],
    [17,136,4990,4095000],[18,136,4990,3995000],[19,136,4990,3995000],[20,136,4990,4095000],
    [21,136,4990,4350000]
  ]
};

// Föreningens beräknade fastighetslån, avsnitt 4.1 i respektive kostnadskalkyl/ekonomisk plan (kr)
const PROJECT_LOAN_BY_NAME = {
  'Brf Gladö Höjden': 36925500,
  'Brf Glömstahöjden': 23969000,
  'Brf Aktrisen': 28823400,
  'Brf Kulissen': 34254000
};

let projects = [];
let activeProjectId = null;
let screen = 'home'; // 'personal' | 'home' | 'project' | 'calendar'
let arenden = [];
let paminnelser = [];
let liggarenStatusFilter = 'alla';
let liggarenProjectFilterVal = 'alla';
let liggarenSortBy = 'priority';
let liggarenEditingMailId = null;
let liggarenConfirmClear = false;
let liggarenViewMode = 'expanded';
let liggarenExpandedCompactId = null;
let liggarenRecurringTemplates = [];
let myPersonId = null;
let myEmail = '';
let isEkonomiAdmin = false;
let companyEkonomiData = { meta: {}, budgetDetalj: {}, reskontra: {}, likviditet: {}, lan: {}, brItems: {}, mark: {} };
let currentEkonomiBudgetProjectId = null;
let currentEkonomiMarkProjectId = null;
let ekonomiBudgetAreaRevenue = { kvm: 0, intakter: 0 };
let currentEkonomiLanProjectId = null;
let currentEkonomiLikviditetProjectId = null;
let ekonomiSoldCounts = {};
let ekonomiSubView = 'oversikt';
let currentEkonomiProjektId = null;
let ekonomiNumberModalCtx = null;
let projectSubView = 'checklista'; // 'checklista' | 'ekonomi'
let entreprenadSubView = 'tidsplan'; // 'tidsplan' | 'byggmoten'
let apartments = [];
let myName = '';
let loaded = false;
let saving = false;
let calendarYear = new Date().getFullYear();
let calendarMonth = new Date().getMonth();
let allEvents = [];
const MONTH_NAMES = ['Januari','Februari','Mars','April','Maj','Juni','Juli','Augusti','September','Oktober','November','December'];

function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,7); }

function escapeHtml(str){
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function stripHtml(html){
  const d = document.createElement('div');
  d.innerHTML = html || '';
  return d.textContent || '';
}

function slugId(name){
  return name.toLowerCase().replace(/[^a-z0-9åäö]+/g,'-').replace(/(^-|-$)/g,'') + '-' + uid().slice(0,4);
}

function timeAgo(iso){
  if(!iso) return '';
  const diff = Math.floor((Date.now() - new Date(iso).getTime())/1000);
  if(diff < 30) return 'just nu';
  if(diff < 60) return diff + ' sek sedan';
  if(diff < 3600) return Math.floor(diff/60) + ' min sedan';
  if(diff < 86400) return Math.floor(diff/3600) + ' tim sedan';
  return Math.floor(diff/86400) + ' d sedan';
}

function showToast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'), 1800);
}

function showDebugError(context, err, retryFn){
  const box = document.getElementById('debugError');
  const text = '[' + new Date().toLocaleTimeString('sv-SE') + '] ' + context + ': ' +
    (err ? (err.message || (err.toString ? err.toString() : JSON.stringify(err))) : '');
  box.innerHTML = '';
  const msg = document.createElement('div');
  msg.textContent = text;
  box.appendChild(msg);
  if(retryFn){
    const btn = document.createElement('button');
    btn.textContent = '↻ Försök spara igen';
    btn.style.cssText = 'margin-top:8px;background:var(--danger);color:#fff;border:none;border-radius:6px;padding:6px 12px;font-size:12px;cursor:pointer;font-family:Inter,sans-serif;';
    btn.onclick = retryFn;
    box.appendChild(btn);
  }
  box.style.display = 'block';
  console.error(context, err);
}

function clearDebugError(){
  const box = document.getElementById('debugError');
  box.style.display = 'none';
  box.innerHTML = '';
}

async function withRetry(fn, attempts, delayMs){
  attempts = attempts || 5;
  delayMs = delayMs || 800;
  let lastErr;
  for(let i = 0; i < attempts; i++){
    try{
      return await fn();
    }catch(e){
      lastErr = e;
      if(i < attempts - 1) await new Promise(r => setTimeout(r, delayMs * (i + 1)));
    }
  }
  throw lastErr;
}

let hasUnsavedApartmentChanges = false;
let hasUnsavedProjectChanges = false;

function apartmentsKey(projectId){ return 'apartments:' + projectId; }

function emptyCheck(){ return { done:false, by:'', at:'' }; }
function emptyBuyer(){ return { name:'', phone:'', email:'' }; }
function emptySaleCheck(){ return { done:false, by:'', at:'', price:'', buyer1: emptyBuyer(), buyer2: emptyBuyer() }; }
function emptyPaymentCheck(){ return { done:false, by:'', at:'', amount:'', date:'' }; }
function emptyDate(){ return { date:'', by:'', at:'' }; }
function emptyNote(){ return { done:false, by:'', at:'', note:'', invoicedCustomer:false, invoicedLoan:false, amount:'' }; }

function newApartment(fields){
  return {
    id: uid(),
    lgh: fields.lgh || '',
    address: fields.address || '',
    anlaggningsid: fields.anlaggningsid || '',
    totalyta: fields.totalyta || '',
    avgift: fields.avgift || '',
    totalpris: fields.totalpris || '',
    sald: emptySaleCheck(),
    slutbetald: emptyPaymentCheck(),
    besiktning: emptyDate(),
    inflyttning: emptyDate(),
    grovstadat: emptyCheck(),
    finstadat: emptyCheck(),
    sopkarl: emptyCheck(),
    fiber: emptyCheck(),
    brevlada: emptyCheck(),
    tillval: emptyNote(),
    upplatenKoncern: emptyCheck(),
    kommentar: fields.kommentar || '',
    kommentarInflyttning: fields.kommentarInflyttning || '',
    projektnummer: fields.projektnummer || '',
    inflyttningPlan: { onskatDatumKund: '', byggdatum: '', bekraftatDatumKund: '' },
    upplatelse: { date: '', by: '', at: '', typ: '' }
  };
}

// Fyller i saknade fält på äldre sparad data så nya kolumner aldrig kraschar synken
function normalizeApartment(apt){
  apt.lgh = apt.lgh || '';
  apt.address = apt.address || '';
  apt.anlaggningsid = apt.anlaggningsid || '';
  apt.totalyta = apt.totalyta || '';
  apt.avgift = apt.avgift || '';
  apt.totalpris = apt.totalpris || '';

  // Migrering: äldre data kan ha sparat "lghnr/byggnad bokstav" (t.ex. "1/1 A") i lgh-fältet.
  // Bryt ut riktigt lägenhetsnummer och flytta byggnad+bokstav till adressen om adressen är tom.
  const legacyMatch = typeof apt.lgh === 'string' && apt.lgh.match(/^(\d+)\s*\/\s*(\d+)\s+([A-ZÅÄÖ])$/i);
  if(legacyMatch){
    const [, lghNum, building, letter] = legacyMatch;
    apt.lgh = lghNum;
    if(!apt.address){
      apt.address = 'Ryttarvägen ' + building + ' ' + letter.toUpperCase();
    }
  }

  CHECK_FIELDS.forEach(f => {
    if(!apt[f] || typeof apt[f] !== 'object'){
      apt[f] = (f === 'sald' ? emptySaleCheck() : f === 'slutbetald' ? emptyPaymentCheck() : emptyCheck());
    }
  });
  if(typeof apt.sald.price !== 'string') apt.sald.price = '';
  if(!apt.sald.buyer1 || typeof apt.sald.buyer1 !== 'object') apt.sald.buyer1 = emptyBuyer();
  if(!apt.sald.buyer2 || typeof apt.sald.buyer2 !== 'object') apt.sald.buyer2 = emptyBuyer();
  ['name','phone','email'].forEach(f => {
    if(typeof apt.sald.buyer1[f] !== 'string') apt.sald.buyer1[f] = '';
    if(typeof apt.sald.buyer2[f] !== 'string') apt.sald.buyer2[f] = '';
  });
  if(typeof apt.slutbetald.amount !== 'string') apt.slutbetald.amount = '';
  if(typeof apt.slutbetald.date !== 'string') apt.slutbetald.date = '';
  ['besiktning','inflyttning'].forEach(f => {
    if(!apt[f] || typeof apt[f] !== 'object') apt[f] = emptyDate();
  });
  if(typeof apt.besiktning.kontaktatKund !== 'boolean') apt.besiktning.kontaktatKund = false;
  if(typeof apt.besiktning.bokatBesiktningsman !== 'boolean') apt.besiktning.bokatBesiktningsman = false;
  if(typeof apt.besiktning.meddelatEntreprenor !== 'boolean') apt.besiktning.meddelatEntreprenor = false;
  if(typeof apt.besiktning.bokatStad !== 'boolean') apt.besiktning.bokatStad = false;
  if(typeof apt.kommentar !== 'string') apt.kommentar = '';
  if(typeof apt.kommentarInflyttning !== 'string') apt.kommentarInflyttning = '';
  if(typeof apt.projektnummer !== 'string') apt.projektnummer = '';
  if(!apt.inflyttningPlan || typeof apt.inflyttningPlan !== 'object'){
    apt.inflyttningPlan = { onskatDatumKund: '', byggdatum: '', bekraftatDatumKund: '' };
  }
  ['onskatDatumKund', 'byggdatum', 'bekraftatDatumKund'].forEach(f => {
    if(typeof apt.inflyttningPlan[f] !== 'string') apt.inflyttningPlan[f] = '';
  });
  if(!apt.upplatelse || typeof apt.upplatelse !== 'object') apt.upplatelse = { date: '', by: '', at: '', typ: '' };
  if(typeof apt.upplatelse.date !== 'string') apt.upplatelse.date = '';
  if(typeof apt.upplatelse.typ !== 'string') apt.upplatelse.typ = '';
  if(!apt.tillval || typeof apt.tillval !== 'object') apt.tillval = emptyNote();
  if(typeof apt.tillval.note !== 'string') apt.tillval.note = '';
  if(typeof apt.tillval.invoicedCustomer !== 'boolean') apt.tillval.invoicedCustomer = false;
  if(typeof apt.tillval.invoicedLoan !== 'boolean') apt.tillval.invoicedLoan = false;
  if(typeof apt.tillval.amount !== 'string') apt.tillval.amount = '';
  if(!apt.upplatenKoncern || typeof apt.upplatenKoncern !== 'object') apt.upplatenKoncern = emptyCheck();
  return apt;
}

// Vilket datum som ska gälla som "riktigt" inflyttningsdatum (apt.inflyttning.date,
// samma fält som Checklistan/Kalendern redan läser): en inläst upplåtelse/
// överlåtelse går alltid före allt annat, annars bekräftat datum till kund,
// annars byggdatum, annars önskat datum från kund.
function effectiveInflyttningDate(apt){
  if(apt.upplatelse && apt.upplatelse.date) return apt.upplatelse.date;
  const plan = apt.inflyttningPlan;
  if(plan){
    if(plan.bekraftatDatumKund) return plan.bekraftatDatumKund;
    if(plan.byggdatum) return plan.byggdatum;
    if(plan.onskatDatumKund) return plan.onskatDatumKund;
  }
  return (apt.inflyttning && apt.inflyttning.date) || '';
}

// ---------- Name ----------
// Namnet kommer numera alltid från vem som är inloggad (eget konto), inte en
// fritextruta - se PERSONAL_NAMES_BY_EMAIL och init().
function renderNameUI(){
  const current = document.getElementById('currentUser');
  current.style.display = myName ? 'flex' : 'none';
  document.getElementById('currentUserName').textContent = myName;
}

// ---------- Projects ----------
const DEFAULT_PROJECT_NAMES = ['Brf Glömstahöjden', 'Brf Gladö Höjden', 'Brf Aktrisen', 'Brf Kulissen'];

async function loadProjects(){
  if(hasUnsavedProjectChanges) return;
  try{
    let res;
    try{
      res = await window.storage.get(PROJECTS_KEY, true);
    }catch(getErr){
      // key not found yet is expected on first-ever run; anything else, surface it
      res = null;
    }
    if(res && res.value){
      projects = JSON.parse(res.value);
    }

    // Se till att alla standardprojekt finns med, även för de som redan har egna sparade projekt
    let addedAny = false;
    DEFAULT_PROJECT_NAMES.forEach(name => {
      if(!projects.some(p => p.name === name)){
        projects.push({ id: slugId(name), name });
        addedAny = true;
      }
    });
    if(addedAny) await persistProjects();

    if(screen === 'home') renderHomeGrid();
    if(screen === 'project'){
      const p = projects.find(pr => pr.id === activeProjectId);
      document.getElementById('projectHeaderName').textContent = p ? p.name : '';
    }
  }catch(e){
    showDebugError('Kunde inte läsa projektlistan (loadProjects)', e);
  }
}
async function persistProjects(){
  try{
    await withRetry(() => window.storage.set(PROJECTS_KEY, JSON.stringify(projects), true));
    hasUnsavedProjectChanges = false;
    clearDebugError();
  }catch(e){
    hasUnsavedProjectChanges = true;
    showDebugError('Kunde inte spara projektlistan (persistProjects)', e, () => persistProjects());
    showToast('Kunde inte spara projekt – klicka "Försök spara igen" nedan');
  }
}

async function addProject(name){
  if(!name){
    showToast('Skriv ett projektnamn först');
    return false;
  }
  if(projects.some(p => p.name.toLowerCase() === name.toLowerCase())){
    showToast('Det finns redan ett projekt med det namnet');
    return false;
  }
  projects.push({ id: slugId(name), name, status: 'Pågående' });
  await persistProjects();
  return true;
}

document.getElementById('addProjectBtn').onclick = async () => {
  const input = document.getElementById('newProjectInput');
  const name = input.value.trim();
  if(await addProject(name)){
    input.value = '';
    renderHomeGrid();
  }
};
document.getElementById('newProjectInput').addEventListener('keydown', e => {
  if(e.key === 'Enter') document.getElementById('addProjectBtn').click();
});

// ---------- Navigation: hem / projekt / kalender ----------
function formatMSEK(value){
  if(!value && value !== 0) return '—';
  return (value / 1000000).toLocaleString('sv-SE', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' MSEK';
}

// Fullt utskrivet belopp med mellanslag som tusentalsavgränsare, t.ex. 45000000 -> "45 000 000 kr".
function formatKrFull(value){
  if(!value && value !== 0) return '—';
  return Math.round(value).toLocaleString('sv-SE') + ' kr';
}

async function loadProjectSummary(p){
  const budgetForeningslan = companyEkonomiData.budgetDetalj[p.id] && companyEkonomiData.budgetDetalj[p.id].foreningslan;
  const summary = { lghText: 'Inga lägenheter ännu', omsattning: null, lan: budgetForeningslan || PROJECT_LOAN_BY_NAME[p.name] || null };
  try{
    const raw = await fetchApartmentsRaw(p.id);
    if(raw.apartments.length > 0){
      const apts = raw.apartments.map(normalizeApartment);
      const sold = apts.filter(a => a.sald && a.sald.done).length;
      summary.lghText = apts.length + ' lägenheter · ' + sold + ' sålda';
      summary.omsattning = apts.reduce((sum, a) => {
        const n = parseInt(String(a.totalpris || '').replace(/[^0-9]/g, ''), 10);
        return sum + (isNaN(n) ? 0 : n);
      }, 0);
    }
  }catch(e){ /* inga lägenheter ännu */ }
  return summary;
}

// Ordning och rubriker för statusgrupperna i den delade Projektöversikten.
const HOME_STATUS_GROUPS = [
  { status: 'Pågående', heading: 'Pågående projekt' },
  { status: 'Bygglov/projektering', heading: 'Bygg/projektering' },
  { status: 'Kommande', heading: 'Kommande' },
  { status: 'Avslutat', heading: 'Avslutat' }
];

async function renderHomeGrid(){
  const topGrid = document.getElementById('homeTopGrid');
  topGrid.innerHTML = '';

  const calCard = document.createElement('div');
  calCard.className = 'home-card calendar-card';
  calCard.innerHTML = '<div class="home-card-icon">📅</div><div class="home-card-title">Kalender</div><div class="home-card-sub">Besiktningar &amp; inflyttningar, alla projekt</div>';
  calCard.onclick = () => openCalendarScreen();
  topGrid.appendChild(calCard);

  const intrCard = document.createElement('div');
  intrCard.className = 'home-card calendar-card';
  intrCard.innerHTML = '<div class="home-card-icon">📋</div><div class="home-card-title">Intresseanmälningar</div><div class="home-card-sub" id="intrHomeCardSub">Laddar…</div>';
  intrCard.onclick = () => openIntressenScreen();
  topGrid.appendChild(intrCard);

  loadInterests().then(() => {
    const el = document.getElementById('intrHomeCardSub');
    if(el){
      const open = interests.filter(e => !e.hanterad).length;
      el.textContent = interests.length + ' totalt · ' + open + ' ej hanterade';
    }
  });

  const sectionsWrap = document.getElementById('homeStatusSections');
  sectionsWrap.innerHTML = '';
  const allVisibleProjects = [];

  HOME_STATUS_GROUPS.forEach(({ status, heading }) => {
    const group = projects.filter(p => (p.status || 'Pågående') === status);
    if(!group.length) return;

    const headingEl = document.createElement('h3');
    headingEl.className = 'home-section-title';
    headingEl.textContent = heading;
    sectionsWrap.appendChild(headingEl);

    const grid = document.createElement('div');
    grid.className = 'home-grid';
    group.forEach(p => {
      const card = document.createElement('div');
      card.className = 'home-card';
      card.innerHTML =
        '<div class="home-card-title">' + escapeHtml(p.name) + '</div>' +
        '<div class="home-card-sub" id="sub-' + p.id + '">Laddar…</div>' +
        '<div class="home-card-figures" id="fig-' + p.id + '"></div>';
      card.onclick = () => openProject(p);
      grid.appendChild(card);
      allVisibleProjects.push(p);
    });
    sectionsWrap.appendChild(grid);
  });

  // Fyll i sammanfattning per projekt asynkront utan att blockera renderingen
  allVisibleProjects.forEach(async p => {
    const summary = await loadProjectSummary(p);
    const subEl = document.getElementById('sub-' + p.id);
    if(subEl) subEl.textContent = summary.lghText;
    const figEl = document.getElementById('fig-' + p.id);
    if(figEl){
      figEl.innerHTML =
        '<div class="figure-row"><span>Totalpris</span><strong>' + formatMSEK(summary.omsattning) + '</strong></div>' +
        '<div class="figure-row"><span>Föreningslån</span><strong>' + formatMSEK(summary.lan) + '</strong></div>' +
        '<div class="figure-row figure-row-total"><span>Total omsättning</span><strong>' + formatMSEK((summary.omsattning || 0) + (summary.lan || 0)) + '</strong></div>';
    }
  });
}

function showScreen(next){
  screen = next;
  document.getElementById('personalScreen').style.display = screen === 'personal' ? 'block' : 'none';
  document.getElementById('homeScreen').style.display = screen === 'home' ? 'block' : 'none';
  document.getElementById('projectScreen').style.display = screen === 'project' ? 'block' : 'none';
  document.getElementById('calendarScreen').style.display = screen === 'calendar' ? 'block' : 'none';
  document.getElementById('intressenScreen').style.display = screen === 'intressen' ? 'block' : 'none';
  document.getElementById('companyEkonomiScreen').style.display = screen === 'companyEkonomi' ? 'block' : 'none';
  const deskBtn = document.getElementById('goToPersonalBtn');
  if(deskBtn) deskBtn.style.display = (screen !== 'personal') ? 'inline-block' : 'none';
  const ekoBtn = document.getElementById('goToEkonomiBtn');
  if(ekoBtn) ekoBtn.style.display = (isEkonomiAdmin && screen !== 'companyEkonomi') ? 'inline-block' : 'none';
}

function openHome(){
  showScreen('home');
  renderHomeGrid();
}

// ---------- Personlig startsida (del 1) ----------
async function openPersonal(){
  showScreen('personal');
  document.getElementById('personalGreeting').textContent = myName ? ('Hej, ' + myName + '!') : 'Hej!';
  liggarenStatusFilter = 'oppet';
  liggarenViewMode = 'compact';
  liggarenExpandedCompactId = null;
  await Promise.all([loadArenden(), loadPaminnelser(), loadLiggarenRecurring()]);
  await liggarenCheckRecurring();
  renderArenden();
  renderPaminnelser();
}

function mapLiggarenRow(row){
  return {
    id: row.id,
    caseNumber: row.case_number,
    title: row.title,
    description: row.description || '',
    comment: row.comment || '',
    project: row.project,
    deadline: row.deadline,
    priority: row.priority,
    ekonomi: row.ekonomi != null ? row.ekonomi : null,
    status: row.status,
    createdBy: row.created_by,
    createdByName: row.created_by_name,
    assignedTo: row.assigned_to,
    assignedToName: row.assigned_to_name,
    notifyEmail: row.notify_email,
    notifyAddress: row.notify_address || '',
    mailSent: row.mail_sent,
    createdAt: row.created_at
  };
}

async function loadArenden(){
  try{
    const rows = await DB.listLiggarenTasks();
    arenden = rows.map(mapLiggarenRow);
  }catch(e){
    arenden = [];
    showDebugError('Kunde inte läsa ärenden', e);
  }
}

function liggarenNextCaseNumbers(count){
  const year = new Date().getFullYear();
  const nums = arenden
    .map(t => t.caseNumber)
    .filter(cn => cn && cn.includes('-' + year + '-'))
    .map(cn => parseInt(cn.split('-')[2], 10))
    .filter(n => !isNaN(n));
  let next = (nums.length ? Math.max(...nums) : 0) + 1;
  const result = [];
  for(let i = 0; i < count; i++) result.push('SF-' + year + '-' + String(next + i).padStart(3, '0'));
  return result;
}

function liggarenBusinessDaysUntil(deadlineStr){
  const today = new Date();
  today.setHours(0,0,0,0);
  const deadline = new Date(deadlineStr + 'T00:00:00');
  if(deadline < today) return -1;
  let count = 0;
  const d = new Date(today);
  while(d < deadline){
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    if(day !== 0 && day !== 6) count++;
  }
  return count;
}
function liggarenIsPastDue(t){
  const todayStr = new Date().toISOString().slice(0,10);
  return t.deadline && t.status !== LIGGAREN_STATUS.KLART && t.deadline < todayStr;
}
function liggarenIsCritical(t){
  return t.deadline && t.status !== LIGGAREN_STATUS.KLART && liggarenBusinessDaysUntil(t.deadline) <= 3;
}

function liggarenPopulateSelects(){
  const projectInput = document.getElementById('liggarenProjectInput');
  projectInput.innerHTML = LIGGAREN_PROJECTS.map(p => '<option value="' + p + '">' + p + '</option>').join('');

  const projectFilter = document.getElementById('liggarenProjectFilter');
  projectFilter.innerHTML = '<option value="alla">Alla projekt</option>' +
    LIGGAREN_PROJECTS.map(p => '<option value="' + p + '">' + p + '</option>').join('');

  const notifySelect = document.getElementById('liggarenNotifyAddressSelect');
  notifySelect.innerHTML = '<option value="">Välj mottagare…</option>' +
    LIGGAREN_DEFAULT_EMAILS.map(a => '<option value="' + a + '">' + a + '</option>').join('') +
    '<option value="other">Annan e-postadress…</option>';
}

// Körs efter inloggning (myPersonId känt) - "Mig själv" alltid överst.
function liggarenPopulateAssigneeSelect(){
  const select = document.getElementById('liggarenAssigneeInput');
  if(!select || !myPersonId) return;
  const others = LIGGAREN_PEOPLE.filter(p => p.id !== myPersonId);
  select.innerHTML = '<option value="' + myPersonId + '">Mig själv</option>' +
    others.map(p => '<option value="' + p.id + '">' + p.name + '</option>').join('');
}

function liggarenResetForm(){
  document.getElementById('liggarenTitleInput').value = '';
  document.getElementById('liggarenDescriptionInput').value = '';
  [...document.getElementById('liggarenProjectInput').options].forEach(o => o.selected = false);
  document.getElementById('liggarenDeadlineInput').value = '';
  document.getElementById('liggarenDeadlineInput').disabled = false;
  document.getElementById('liggarenPriorityInput').value = '3';
  document.getElementById('liggarenEkonomiInput').value = '';
  document.getElementById('liggarenRecurringCheck').checked = false;
  document.getElementById('liggarenRecurringFields').style.display = 'none';
  document.getElementById('liggarenRecurringDayInput').value = '1';
  liggarenPopulateAssigneeSelect();
  document.getElementById('liggarenNotifyCheck').checked = false;
  document.getElementById('liggarenNotifyFields').style.display = 'none';
  document.getElementById('liggarenNotifyAddressSelect').value = '';
  document.getElementById('liggarenNotifyCustomInput').value = '';
  document.getElementById('liggarenNotifyCustomInput').style.display = 'none';
}

async function liggarenSaveTask(){
  const title = document.getElementById('liggarenTitleInput').value.trim();
  if(!title) return;
  const description = document.getElementById('liggarenDescriptionInput').value.trim();
  const selectedProjects = [...document.getElementById('liggarenProjectInput').selectedOptions].map(o => o.value);
  const projects = selectedProjects.length ? selectedProjects : [null];
  const deadline = document.getElementById('liggarenDeadlineInput').value || null;
  const priority = parseInt(document.getElementById('liggarenPriorityInput').value, 10) || 3;
  const ekonomiVal = document.getElementById('liggarenEkonomiInput').value;
  const ekonomi = ekonomiVal !== '' ? parseFloat(ekonomiVal) : null;
  const isRecurring = document.getElementById('liggarenRecurringCheck').checked;
  const recurringDay = parseInt(document.getElementById('liggarenRecurringDayInput').value, 10) || 1;
  const notifyEmail = document.getElementById('liggarenNotifyCheck').checked;
  const addrSelect = document.getElementById('liggarenNotifyAddressSelect').value;
  const notifyAddress = (addrSelect === 'other' ? document.getElementById('liggarenNotifyCustomInput').value.trim() : addrSelect);
  const assigneeId = document.getElementById('liggarenAssigneeInput').value || myPersonId;
  const assignee = LIGGAREN_PEOPLE.find(p => p.id === assigneeId) || { id: myPersonId, name: myName };

  try{
    const caseNumbers = liggarenNextCaseNumbers(projects.length);
    const now = new Date();
    const monthKey = liggarenMonthKey(now);
    for(let i = 0; i < projects.length; i++){
      const project = projects[i];
      const rowTitle = isRecurring ? liggarenRecurringTitle({ baseTitle: title }, now) : title;
      const row = {
        case_number: caseNumbers[i],
        title: rowTitle, description, project,
        deadline: isRecurring ? null : deadline,
        priority,
        ekonomi,
        status: LIGGAREN_STATUS.OPPET,
        created_by: myPersonId,
        created_by_name: myName,
        assigned_to: assignee.id,
        assigned_to_name: assignee.name,
        notify_email: notifyEmail && !!notifyAddress,
        notify_address: notifyAddress || '',
        mail_sent: false
      };
      await DB.insertLiggarenTask(row);
      if(isRecurring){
        liggarenRecurringTemplates.push({
          id: 'rt' + Date.now() + Math.random().toString(36).slice(2, 7) + i,
          baseTitle: title,
          project,
          priority,
          dayOfMonth: recurringDay,
          assignedTo: assignee.id,
          assignedToName: assignee.name,
          createdBy: myPersonId,
          createdByName: myName,
          lastGeneratedMonth: monthKey
        });
      }
    }
    if(isRecurring) await persistLiggarenRecurring();
    await loadArenden();
    renderArenden();
    liggarenResetForm();
    document.getElementById('liggarenForm').style.display = 'none';
  }catch(e){
    showDebugError('Kunde inte spara ärendet', e);
  }
}

async function liggarenSetStatus(id, status){
  const task = arenden.find(t => t.id === id);
  if(!task) return;
  const shouldNotify = task.notifyEmail && task.notifyAddress && status === LIGGAREN_STATUS.KLART &&
    task.status !== LIGGAREN_STATUS.KLART && !task.mailSent;
  try{
    await DB.updateLiggarenTask(id, { status, mail_sent: shouldNotify ? true : task.mailSent });
    await loadArenden();
    renderArenden();
    if(shouldNotify){
      const subject = encodeURIComponent('Ärende klart: ' + task.title);
      const body = encodeURIComponent(
        'Hej,\n\nÄrendet "' + task.title + '" (' + task.caseNumber + (task.project ? ', ' + task.project : '') + ') är nu slutfört.\n\nMvh'
      );
      window.open('mailto:' + task.notifyAddress + '?subject=' + subject + '&body=' + body, '_blank');
    }
  }catch(e){
    showDebugError('Kunde inte uppdatera status', e);
  }
}

async function liggarenSetPriority(id, p){
  try{
    await DB.updateLiggarenTask(id, { priority: p });
    await loadArenden();
    renderArenden();
  }catch(e){
    showDebugError('Kunde inte ändra prioritet', e);
  }
}

async function liggarenSetProject(id, project){
  try{
    await DB.updateLiggarenTask(id, { project });
    await loadArenden();
    renderArenden();
  }catch(e){
    showDebugError('Kunde inte ändra projekt', e);
  }
}

async function liggarenSetEkonomi(id, ekonomi){
  try{
    await DB.updateLiggarenTask(id, { ekonomi });
    await loadArenden();
    renderArenden();
  }catch(e){
    showDebugError('Kunde inte spara ekonomi', e);
  }
}

async function liggarenRemoveTask(id){
  try{
    await DB.deleteLiggarenTask(id);
    await loadArenden();
    renderArenden();
  }catch(e){
    showDebugError('Kunde inte ta bort ärendet', e);
  }
}

async function liggarenClearAll(){
  if(!liggarenConfirmClear){
    liggarenConfirmClear = true;
    renderArenden();
    setTimeout(() => { liggarenConfirmClear = false; renderArenden(); }, 3000);
    return;
  }
  liggarenConfirmClear = false;
  const mine = arenden.filter(t => t.createdBy === myPersonId);
  try{
    for(const t of mine) await DB.deleteLiggarenTask(t.id);
    await loadArenden();
    renderArenden();
  }catch(e){
    showDebugError('Kunde inte rensa ärenden', e);
  }
}

function renderArenden(){
  const counts = {
    alla: arenden.length,
    oppet: arenden.filter(t => t.status === LIGGAREN_STATUS.OPPET).length,
    pagaende: arenden.filter(t => t.status === LIGGAREN_STATUS.PAGAENDE).length,
    klart: arenden.filter(t => t.status === LIGGAREN_STATUS.KLART).length
  };
  const filterBar = document.getElementById('liggarenStatusFilters');
  const filterLabels = { alla: 'Alla', oppet: 'Att göra', pagaende: 'Pågående', klart: 'Klart' };
  filterBar.innerHTML = '';
  ['alla', 'oppet', 'pagaende', 'klart'].forEach(key => {
    const btn = document.createElement('button');
    btn.className = 'liggaren-status-btn' + (liggarenStatusFilter === key ? ' active' : '');
    btn.textContent = filterLabels[key] + ' (' + counts[key] + ')';
    btn.onclick = () => { liggarenStatusFilter = key; renderArenden(); };
    filterBar.appendChild(btn);
  });

  const projectFilter = document.getElementById('liggarenProjectFilter');
  if(projectFilter.value !== liggarenProjectFilterVal) projectFilter.value = liggarenProjectFilterVal;
  const sortSelect = document.getElementById('liggarenSortSelect');
  if(sortSelect.value !== liggarenSortBy) sortSelect.value = liggarenSortBy;
  const clearBtn = document.getElementById('liggarenClearAllBtn');
  clearBtn.textContent = liggarenConfirmClear ? 'Säker? Klicka igen' : 'Rensa alla';
  clearBtn.style.display = arenden.some(t => t.createdBy === myPersonId) ? 'inline-block' : 'none';

  const visible = arenden
    .filter(t => liggarenStatusFilter === 'alla' ? true : t.status === liggarenStatusFilter)
    .filter(t => liggarenProjectFilterVal === 'alla' ? true : t.project === liggarenProjectFilterVal)
    .slice()
    .sort((a, b) => {
      if((a.status === LIGGAREN_STATUS.KLART) !== (b.status === LIGGAREN_STATUS.KLART)){
        return a.status === LIGGAREN_STATUS.KLART ? 1 : -1;
      }
      const ap = a.priority || 3, bp = b.priority || 3;
      if(liggarenSortBy === 'priority'){
        if(ap !== bp) return ap - bp;
        if(a.deadline && b.deadline) return a.deadline.localeCompare(b.deadline);
        if(a.deadline) return -1;
        if(b.deadline) return 1;
        return b.createdAt.localeCompare(a.createdAt);
      }
      if(a.deadline && b.deadline){
        if(a.deadline !== b.deadline) return a.deadline.localeCompare(b.deadline);
        return ap - bp;
      }
      if(a.deadline) return -1;
      if(b.deadline) return 1;
      if(ap !== bp) return ap - bp;
      return b.createdAt.localeCompare(a.createdAt);
    });

  const viewModeBar = document.getElementById('liggarenViewModeToggle');
  viewModeBar.innerHTML = '';
  [['expanded', 'Utökad'], ['compact', 'Kompakt']].forEach(([key, label]) => {
    const btn = document.createElement('button');
    btn.className = 'liggaren-status-btn' + (liggarenViewMode === key ? ' active' : '');
    btn.textContent = label;
    btn.onclick = () => { liggarenViewMode = key; liggarenExpandedCompactId = null; renderArenden(); };
    viewModeBar.appendChild(btn);
  });

  const list = document.getElementById('liggarenList');
  const empty = document.getElementById('liggarenEmptyState');
  list.innerHTML = '';
  empty.style.display = visible.length ? 'none' : 'block';

  visible.forEach(t => {
    if(liggarenViewMode === 'compact' && liggarenExpandedCompactId !== t.id){
      list.appendChild(buildLiggarenCompactRow(t));
      return;
    }
    list.appendChild(buildLiggarenCard(t));
  });

  renderLiggarenRecurringList();
}

function buildLiggarenCompactRow(t){
  const overdue = liggarenIsPastDue(t);
  const critical = liggarenIsCritical(t);
  const delegatedOut = t.createdBy === myPersonId && t.assignedTo !== myPersonId;
  const delegatedIn = t.assignedTo === myPersonId && t.createdBy !== myPersonId;
  const row = document.createElement('div');
  row.className = 'liggaren-compact-row' + (t.status === LIGGAREN_STATUS.KLART ? ' done' : '') +
    (delegatedOut ? ' delegated-out' : '') + (delegatedIn ? ' delegated-in' : '');
  row.onclick = () => { liggarenExpandedCompactId = t.id; renderArenden(); };

  const titleEl = document.createElement('span');
  titleEl.className = 'liggaren-compact-title';
  titleEl.textContent = t.title;
  row.appendChild(titleEl);

  const projectEl = document.createElement('span');
  projectEl.className = 'liggaren-compact-project';
  projectEl.textContent = t.project || '—';
  row.appendChild(projectEl);

  const deadlineEl = document.createElement('span');
  deadlineEl.className = 'liggaren-compact-deadline' + (overdue ? ' overdue' : critical ? ' critical' : '');
  deadlineEl.textContent = t.deadline || '—';
  row.appendChild(deadlineEl);

  return row;
}

function buildLiggarenCard(t){
    const critical = liggarenIsCritical(t);
    const overdue = liggarenIsPastDue(t);
    const delegatedOut = t.createdBy === myPersonId && t.assignedTo !== myPersonId;
    const delegatedIn = t.assignedTo === myPersonId && t.createdBy !== myPersonId;
    const card = document.createElement('div');
    card.className = 'liggaren-card' + (critical ? ' critical' : '') + (t.status === LIGGAREN_STATUS.KLART ? ' done' : '') +
      (delegatedOut ? ' delegated-out' : '') + (delegatedIn ? ' delegated-in' : '');

    if(t.status === LIGGAREN_STATUS.KLART){
      const stamp = document.createElement('div');
      stamp.className = 'liggaren-stamp';
      stamp.textContent = 'Klart';
      card.appendChild(stamp);
    }

    const caseRow = document.createElement('div');
    caseRow.className = 'liggaren-case-no';
    const dots = document.createElement('span');
    dots.className = 'liggaren-prio-dots';
    dots.style.setProperty('--dot-color', LIGGAREN_PRIORITY_COLOR(t.priority || 3));
    LIGGAREN_PRIORITIES.forEach(p => {
      const dot = document.createElement('span');
      if(p <= 6 - (t.priority || 3)) dot.className = 'filled';
      dots.appendChild(dot);
    });
    caseRow.innerHTML = '<span>Nr ' + t.caseNumber + '</span>';
    caseRow.appendChild(dots);
    const prioSelect = document.createElement('select');
    prioSelect.style.cssText = 'border:1px solid var(--line-soft);border-radius:5px;font-size:11px;padding:1px 4px;';
    LIGGAREN_PRIORITIES.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p; opt.textContent = 'P' + p;
      if((t.priority || 3) === p) opt.selected = true;
      prioSelect.appendChild(opt);
    });
    prioSelect.onchange = () => liggarenSetPriority(t.id, parseInt(prioSelect.value, 10));
    caseRow.appendChild(prioSelect);
    card.appendChild(caseRow);

    const titleEl = document.createElement('div');
    titleEl.className = 'liggaren-title';
    titleEl.textContent = t.title;
    card.appendChild(titleEl);

    if(t.description){
      const descEl = document.createElement('div');
      descEl.className = 'liggaren-description';
      descEl.textContent = t.description;
      card.appendChild(descEl);
    }

    const meta = document.createElement('div');
    meta.className = 'liggaren-meta';
    if(delegatedIn){
      const origin = document.createElement('span');
      origin.className = 'liggaren-origin-pill from';
      origin.textContent = 'Från: ' + t.createdByName;
      meta.appendChild(origin);
    }
    if(delegatedOut){
      const origin = document.createElement('span');
      origin.className = 'liggaren-origin-pill to';
      origin.textContent = '→ Tilldelat: ' + t.assignedToName;
      meta.appendChild(origin);
    }
    const projectSelect = document.createElement('select');
    projectSelect.className = 'liggaren-pill-select';
    projectSelect.innerHTML = '<option value="">Inget projekt</option>' +
      LIGGAREN_PROJECTS.map(p => '<option value="' + escapeHtml(p) + '"' + (t.project === p ? ' selected' : '') + '>' + escapeHtml(p) + '</option>').join('');
    projectSelect.onchange = () => liggarenSetProject(t.id, projectSelect.value || null);
    meta.appendChild(projectSelect);

    const ekonomiInput = document.createElement('input');
    ekonomiInput.type = 'number';
    ekonomiInput.className = 'liggaren-ekonomi-input';
    ekonomiInput.placeholder = 'Ekonomi (kr)';
    ekonomiInput.value = t.ekonomi != null ? t.ekonomi : '';
    ekonomiInput.onchange = () => liggarenSetEkonomi(t.id, ekonomiInput.value === '' ? null : (parseFloat(ekonomiInput.value) || 0));
    meta.appendChild(ekonomiInput);

    if(t.deadline){
      const dl = document.createElement('span');
      dl.className = 'liggaren-deadline' + (overdue ? ' overdue' : critical ? ' critical' : '');
      dl.textContent = (overdue ? 'Försenat: ' : 'Deadline: ') + t.deadline;
      meta.appendChild(dl);
    }
    card.appendChild(meta);

    const actions = document.createElement('div');
    actions.className = 'liggaren-actions';
    LIGGAREN_STATUS_ORDER.forEach(s => {
      const btn = document.createElement('button');
      btn.textContent = LIGGAREN_STATUS_LABEL[s];
      if(t.status === s) btn.className = 'active';
      btn.onclick = () => liggarenSetStatus(t.id, s);
      actions.appendChild(btn);
    });

    if(liggarenEditingMailId === t.id){
      const select = document.createElement('select');
      select.style.cssText = 'border:1px solid var(--line-soft);border-radius:5px;font-size:11px;padding:3px 6px;';
      select.innerHTML = '<option value="">Välj mottagare…</option>' +
        LIGGAREN_DEFAULT_EMAILS.map(a => '<option value="' + a + '">' + a + '</option>').join('') +
        '<option value="other">Annan…</option>';
      const isDefault = LIGGAREN_DEFAULT_EMAILS.includes(t.notifyAddress);
      select.value = isDefault ? t.notifyAddress : (t.notifyAddress ? 'other' : '');
      const customInput = document.createElement('input');
      customInput.type = 'email';
      customInput.placeholder = 'E-postadress';
      customInput.style.cssText = 'border:1px solid var(--line-soft);border-radius:5px;font-size:11px;padding:3px 6px;';
      customInput.style.display = (!isDefault && t.notifyAddress) ? 'inline-block' : 'none';
      if(!isDefault) customInput.value = t.notifyAddress || '';
      select.onchange = () => { customInput.style.display = select.value === 'other' ? 'inline-block' : 'none'; };
      const saveBtn = document.createElement('button');
      saveBtn.textContent = 'Spara';
      saveBtn.onclick = async () => {
        const addr = select.value === 'other' ? customInput.value.trim() : select.value;
        liggarenEditingMailId = null;
        try{
          await DB.updateLiggarenTask(t.id, { notify_email: !!addr, notify_address: addr, mail_sent: false });
          await loadArenden();
          renderArenden();
        }catch(e){
          showDebugError('Kunde inte spara mottagare', e);
        }
      };
      const cancelBtn = document.createElement('button');
      cancelBtn.textContent = 'Avbryt';
      cancelBtn.onclick = () => { liggarenEditingMailId = null; renderArenden(); };
      actions.appendChild(select);
      actions.appendChild(customInput);
      actions.appendChild(saveBtn);
      actions.appendChild(cancelBtn);
    } else {
      const mailBtn = document.createElement('button');
      mailBtn.textContent = t.notifyAddress ? ('Mejl: ' + t.notifyAddress) : '+ Mejl vid klart';
      mailBtn.onclick = () => { liggarenEditingMailId = t.id; renderArenden(); };
      actions.appendChild(mailBtn);
    }

    if(t.createdBy === myPersonId){
      const delBtn = document.createElement('button');
      delBtn.className = 'danger';
      delBtn.textContent = 'Ta bort';
      delBtn.onclick = () => liggarenRemoveTask(t.id);
      actions.appendChild(delBtn);
    }

    card.appendChild(actions);

    const commentLabel = document.createElement('div');
    commentLabel.className = 'liggaren-comment-label';
    commentLabel.textContent = 'Kommentar';
    card.appendChild(commentLabel);

    const commentInput = document.createElement('textarea');
    commentInput.className = 'liggaren-comment-input';
    commentInput.rows = 2;
    commentInput.placeholder = 'Skriv en kommentar…';
    commentInput.value = t.comment || '';
    commentInput.onchange = async () => {
      try{
        await DB.updateLiggarenTask(t.id, { comment: commentInput.value });
        await loadArenden();
        renderArenden();
      }catch(e){
        showDebugError('Kunde inte spara kommentaren', e);
      }
    };
    card.appendChild(commentInput);
    return card;
}

// ---------- Liggaren: återkommande ärenden (skapas automatiskt varje månad) ----------
function liggarenMonthKey(date){
  return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
}

function liggarenRecurringTitle(tpl, date){
  return tpl.baseTitle + ' ' + SWEDISH_MONTHS[date.getMonth()];
}

async function loadLiggarenRecurring(){
  try{
    const res = await DB.getPersonalData(LIGGAREN_RECURRING_KEY);
    liggarenRecurringTemplates = (res && res.value) ? JSON.parse(res.value) : [];
  }catch(e){
    liggarenRecurringTemplates = [];
    showDebugError('Kunde inte läsa återkommande ärenden', e);
  }
}

async function persistLiggarenRecurring(){
  try{ await DB.setPersonalData(LIGGAREN_RECURRING_KEY, JSON.stringify(liggarenRecurringTemplates)); }
  catch(e){ showDebugError('Kunde inte spara återkommande ärenden', e); }
}

async function liggarenCheckRecurring(){
  const now = new Date();
  const monthKey = liggarenMonthKey(now);
  const due = liggarenRecurringTemplates.filter(tpl =>
    tpl.createdBy === myPersonId && tpl.lastGeneratedMonth !== monthKey && now.getDate() >= (tpl.dayOfMonth || 1)
  );
  if(!due.length) return;
  try{
    const caseNumbers = liggarenNextCaseNumbers(due.length);
    for(let i = 0; i < due.length; i++){
      const tpl = due[i];
      const row = {
        case_number: caseNumbers[i],
        title: liggarenRecurringTitle(tpl, now),
        description: '', project: tpl.project,
        deadline: null,
        priority: tpl.priority || 3,
        ekonomi: null,
        status: LIGGAREN_STATUS.OPPET,
        created_by: tpl.createdBy,
        created_by_name: tpl.createdByName,
        assigned_to: tpl.assignedTo,
        assigned_to_name: tpl.assignedToName,
        notify_email: false,
        notify_address: '',
        mail_sent: false
      };
      await DB.insertLiggarenTask(row);
      tpl.lastGeneratedMonth = monthKey;
    }
    await persistLiggarenRecurring();
    await loadArenden();
  }catch(e){
    showDebugError('Kunde inte skapa återkommande ärenden', e);
  }
}

function renderLiggarenRecurringList(){
  const section = document.getElementById('liggarenRecurringSection');
  const list = document.getElementById('liggarenRecurringList');
  const mine = liggarenRecurringTemplates.filter(t => t.createdBy === myPersonId);
  section.style.display = mine.length ? 'block' : 'none';
  list.innerHTML = '';
  mine.forEach(tpl => {
    const row = document.createElement('div');
    row.className = 'liggaren-recurring-row';
    const label = document.createElement('span');
    label.textContent = tpl.baseTitle + (tpl.project ? ' (' + tpl.project + ')' : '') + ' - skapas dag ' + (tpl.dayOfMonth || 1) + ' varje månad';
    row.appendChild(label);
    const stopBtn = document.createElement('button');
    stopBtn.className = 'remove-btn';
    stopBtn.title = 'Sluta upprepa';
    stopBtn.textContent = '✕';
    stopBtn.onclick = () => liggarenStopRecurring(tpl.id);
    row.appendChild(stopBtn);
    list.appendChild(row);
  });
}

async function liggarenStopRecurring(id){
  liggarenRecurringTemplates = liggarenRecurringTemplates.filter(t => t.id !== id);
  await persistLiggarenRecurring();
  renderLiggarenRecurringList();
}

async function loadPaminnelser(){
  try{
    const res = await DB.getPersonalData(PAMINNELSER_KEY);
    paminnelser = (res && res.value) ? JSON.parse(res.value) : [];
  }catch(e){
    paminnelser = [];
    showDebugError('Kunde inte läsa påminnelser', e);
  }
}
async function persistPaminnelser(){
  try{ await DB.setPersonalData(PAMINNELSER_KEY, JSON.stringify(paminnelser)); }
  catch(e){ showDebugError('Kunde inte spara påminnelser', e); }
}
function renderPaminnelser(){
  const list = document.getElementById('paminnelserList');
  const empty = document.getElementById('paminnelserEmptyState');
  list.innerHTML = '';
  empty.style.display = paminnelser.length ? 'none' : 'block';
  const today = new Date().toISOString().slice(0,10);
  const sorted = [...paminnelser].sort((a,b) => (a.date || '').localeCompare(b.date || ''));
  sorted.forEach(item => {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--line);';
    const overdue = item.date && item.date < today;

    const dateEl = document.createElement('span');
    dateEl.textContent = item.date || '';
    dateEl.style.cssText = 'min-width:100px;font-weight:600;' + (overdue ? 'color:var(--danger);' : '');

    const note = document.createElement('input');
    note.type = 'text';
    note.value = item.note;
    note.style.cssText = 'flex:1;border:none;background:transparent;font-size:14px;';
    note.onchange = () => { item.note = note.value; persistPaminnelser(); };

    const del = document.createElement('button');
    del.textContent = 'Ta bort';
    del.onclick = () => {
      paminnelser = paminnelser.filter(p => p.id !== item.id);
      persistPaminnelser();
      renderPaminnelser();
    };

    row.appendChild(dateEl);
    row.appendChild(note);
    row.appendChild(del);
    list.appendChild(row);
  });
}

// ---------- Ekonomi (företagsövergripande) ----------
async function loadEkonomiData(){
  try{
    const [meta, budgetDetalj, reskontra, likviditet, lan, brItems, mark] = await Promise.all([
      DB.getPersonalData(EKONOMI_KEYS.meta),
      DB.getPersonalData(EKONOMI_KEYS.budgetDetalj),
      DB.getPersonalData(EKONOMI_KEYS.reskontra),
      DB.getPersonalData(EKONOMI_KEYS.likviditet),
      DB.getPersonalData(EKONOMI_KEYS.lan),
      DB.getPersonalData(EKONOMI_KEYS.brItems),
      DB.getPersonalData(EKONOMI_KEYS.mark)
    ]);
    companyEkonomiData = {
      meta: (meta && JSON.parse(meta.value)) || {},
      budgetDetalj: (budgetDetalj && JSON.parse(budgetDetalj.value)) || {},
      reskontra: (reskontra && JSON.parse(reskontra.value)) || {},
      likviditet: (likviditet && JSON.parse(likviditet.value)) || {},
      lan: (lan && JSON.parse(lan.value)) || {},
      brItems: (brItems && JSON.parse(brItems.value)) || {},
      mark: (mark && JSON.parse(mark.value)) || {}
    };
  }catch(e){
    showDebugError('Kunde inte läsa ekonomidata', e);
  }
}

async function loadEkonomiSoldCounts(){
  const next = {};
  await Promise.all(projects.map(async p => {
    try{
      const raw = await fetchApartmentsRaw(p.id);
      const apts = raw.apartments.map(normalizeApartment);
      next[p.id] = { sold: apts.filter(a => a.sald && a.sald.done).length, total: apts.length };
    }catch(e){
      next[p.id] = { sold: 0, total: 0 };
    }
  }));
  ekonomiSoldCounts = next;
}

async function openCompanyEkonomi(){
  showScreen('companyEkonomi');
  await Promise.all([loadEkonomiData(), loadEkonomiSoldCounts()]);
  setEkonomiSubView(ekonomiSubView || 'oversikt');
}

function setEkonomiSubView(view){
  ekonomiSubView = view;
  document.querySelectorAll('.ekonomi-sub-tab').forEach(btn => btn.classList.toggle('active', btn.dataset.ekonomiView === view));
  document.getElementById('ekonomiOversiktView').style.display = view === 'oversikt' ? 'block' : 'none';
  document.getElementById('ekonomiProjektView').style.display = view === 'projekt' ? 'block' : 'none';
  document.getElementById('ekonomiBudgetView').style.display = view === 'budget' ? 'block' : 'none';
  document.getElementById('ekonomiMarkView').style.display = view === 'mark' ? 'block' : 'none';
  document.getElementById('ekonomiLikviditetView').style.display = view === 'likviditet' ? 'block' : 'none';
  document.getElementById('ekonomiLanView').style.display = view === 'lan' ? 'block' : 'none';
  document.getElementById('ekonomiVinstSolvinkelnView').style.display = view === 'vinstsolvinkeln' ? 'block' : 'none';
  if(view === 'oversikt') renderEkonomiOversikt();
  else if(view === 'projekt') renderEkonomiProjekt();
  else if(view === 'budget') renderEkonomiBudgetList();
  else if(view === 'mark') renderEkonomiMarkList();
  else if(view === 'vinstsolvinkeln') renderEkonomiVinstSolvinkeln();
  else renderEkonomiNumberTab(view);
}

function ekonomiLedgerAmount(line){
  return (line.justeratBelopp != null ? line.justeratBelopp : line.belopp) || 0;
}

function ekonomiProjectBudgetTotals(projectId){
  const detail = companyEkonomiData.budgetDetalj[projectId] || {};
  const kategorier = detail.kategorier || {};
  const budget = EKONOMI_COST_CATEGORIES.reduce((s, c) => s + (kategorier[c] || 0), 0);
  const ledger = companyEkonomiData.reskontra[projectId] || [];
  const utfall = ledger.reduce((s, l) => s + (l.kategori ? ekonomiLedgerAmount(l) : 0), 0);
  return { budget, utfall };
}

function renderEkonomiBudgetList(){
  const tbody = document.getElementById('ekonomiBudgetBody');
  tbody.innerHTML = '';
  let totalBudget = 0, totalUtfall = 0;
  projects.forEach(p => {
    const { budget, utfall } = ekonomiProjectBudgetTotals(p.id);
    totalBudget += budget;
    totalUtfall += utfall;
    const diff = budget - utfall;
    const row = document.createElement('tr');
    row.onclick = () => openEkonomiProjektBudget(p);
    row.innerHTML =
      '<td>' + escapeHtml(p.name) + '</td>' +
      '<td>' + formatMSEK(budget) + '</td>' +
      '<td>' + formatMSEK(utfall) + '</td>' +
      '<td class="' + (diff < 0 ? 'eko-diff-negative' : 'eko-diff-positive') + '">' + formatMSEK(diff) + '</td>';
    tbody.appendChild(row);
  });
  const totalDiff = totalBudget - totalUtfall;
  const totalRow = document.createElement('tr');
  totalRow.className = 'eko-row-resultat';
  totalRow.innerHTML =
    '<td>Totalt</td><td>' + formatMSEK(totalBudget) + '</td><td>' + formatMSEK(totalUtfall) + '</td>' +
    '<td class="' + (totalDiff < 0 ? 'eko-diff-negative' : 'eko-diff-positive') + '">' + formatMSEK(totalDiff) + '</td>';
  tbody.appendChild(totalRow);
}

async function computeProjectAreaRevenue(projectId){
  try{
    const raw = await fetchApartmentsRaw(projectId);
    const apts = raw.apartments.map(normalizeApartment);
    const kvm = apts.reduce((s, a) => {
      const n = parseFloat(String(a.totalyta || '').replace(',', '.').replace(/[^0-9.]/g, ''));
      return s + (isNaN(n) ? 0 : n);
    }, 0);
    const intakter = apts.reduce((s, a) => {
      const n = parseInt(String(a.totalpris || '').replace(/[^0-9]/g, ''), 10);
      return s + (isNaN(n) ? 0 : n);
    }, 0);
    return { kvm, intakter };
  }catch(e){
    return { kvm: 0, intakter: 0 };
  }
}

function formatKrPerKvm(total, kvm){
  if(!kvm) return '—';
  return Math.round(total / kvm).toLocaleString('sv-SE') + ' kr/kvm';
}

async function openEkonomiProjektBudget(project){
  currentEkonomiBudgetProjectId = project.id;
  document.getElementById('ekonomiProjektBudgetTitle').textContent = project.name;
  document.getElementById('ekonomiSubTabsBar').style.display = 'none';
  ['ekonomiOversiktView', 'ekonomiProjektView', 'ekonomiBudgetView', 'ekonomiMarkView', 'ekonomiLikviditetView',
    'ekonomiLanView', 'ekonomiVinstSolvinkelnView', 'ekonomiProjektMarkView', 'ekonomiProjektLanView', 'ekonomiProjektLikviditetView'].forEach(id => {
    document.getElementById(id).style.display = 'none';
  });
  document.getElementById('ekonomiProjektBudgetView').style.display = 'block';
  ekonomiBudgetAreaRevenue = await computeProjectAreaRevenue(project.id);
  renderEkonomiProjektBudget();
}

function closeEkonomiProjektBudget(){
  document.getElementById('ekonomiProjektBudgetView').style.display = 'none';
  document.getElementById('ekonomiSubTabsBar').style.display = 'flex';
  setEkonomiSubView('budget');
}

// ---------- Mark-detalj: köpebrevsuppgifter per projekt (en förening kan äga flera fastigheter) ----------
function renderEkonomiMarkList(){
  const tbody = document.getElementById('ekonomiMarkBody');
  tbody.innerHTML = '';
  let totalForvarvspris = 0, totalGatukostnad = 0, totalVattenanslutning = 0;
  projects.forEach(p => {
    const fastigheter = companyEkonomiData.mark[p.id] || [];
    const sum = fastigheter.reduce((acc, f) => {
      acc.forvarvspris += f.forvarvspris || 0;
      acc.vattenanslutning += f.vattenanslutning || 0;
      acc.gatukostnad += f.gatukostnad || 0;
      return acc;
    }, { forvarvspris: 0, vattenanslutning: 0, gatukostnad: 0 });
    totalForvarvspris += sum.forvarvspris;
    totalGatukostnad += sum.gatukostnad;
    totalVattenanslutning += sum.vattenanslutning;
    const row = document.createElement('tr');
    row.onclick = () => openEkonomiProjektMark(p);
    row.innerHTML =
      '<td>' + escapeHtml(p.name) + '</td>' +
      '<td>' + fastigheter.length + '</td>' +
      '<td>' + (sum.forvarvspris ? formatKrFull(sum.forvarvspris) : '—') + '</td>' +
      '<td>' + (sum.vattenanslutning ? formatKrFull(sum.vattenanslutning) : '—') + '</td>' +
      '<td>' + (sum.gatukostnad ? formatKrFull(sum.gatukostnad) : '—') + '</td>';
    tbody.appendChild(row);
  });
  document.getElementById('ekoMarkKpiForvarvspris').textContent = formatKrFull(totalForvarvspris);
  document.getElementById('ekoMarkKpiGatukostnad').textContent = formatKrFull(totalGatukostnad);
  document.getElementById('ekoMarkKpiVattenanslutning').textContent = formatKrFull(totalVattenanslutning);
}

function openEkonomiProjektMark(project){
  currentEkonomiMarkProjectId = project.id;
  document.getElementById('ekonomiProjektMarkTitle').textContent = project.name;
  document.getElementById('ekonomiSubTabsBar').style.display = 'none';
  ['ekonomiOversiktView', 'ekonomiProjektView', 'ekonomiBudgetView', 'ekonomiMarkView', 'ekonomiLikviditetView',
    'ekonomiLanView', 'ekonomiVinstSolvinkelnView', 'ekonomiProjektBudgetView', 'ekonomiProjektLanView',
    'ekonomiProjektLikviditetView'].forEach(id => {
    document.getElementById(id).style.display = 'none';
  });
  document.getElementById('ekonomiProjektMarkView').style.display = 'block';
  setKopebrevUploadStatus('', '');
  renderEkonomiProjektMark();
}

function closeEkonomiProjektMark(){
  document.getElementById('ekonomiProjektMarkView').style.display = 'none';
  document.getElementById('ekonomiSubTabsBar').style.display = 'flex';
  setEkonomiSubView('mark');
}

function renderEkonomiProjektMark(){
  const pid = currentEkonomiMarkProjectId;
  const fastigheter = companyEkonomiData.mark[pid] || [];
  const tbody = document.getElementById('ekonomiMarkFastigheterBody');
  const empty = document.getElementById('ekonomiMarkFastigheterEmptyState');
  tbody.innerHTML = '';
  empty.style.display = fastigheter.length ? 'none' : 'block';
  fastigheter.forEach(fast => {
    const row = document.createElement('tr');
    row.innerHTML = '<td></td><td></td><td></td><td></td><td></td><td></td>';

    const textFields = [
      { key: 'fastighetsbeteckning', cell: 0 },
      { key: 'ort', cell: 1 }
    ];
    textFields.forEach(tf => {
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'eko-inline-input';
      input.style.textAlign = 'left';
      input.value = fast[tf.key] || '';
      input.onchange = () => saveEkonomiMarkFastighet(fast.id, { [tf.key]: input.value.trim() });
      row.children[tf.cell].appendChild(input);
    });

    const numberFields = [
      { key: 'forvarvspris', cell: 2 },
      { key: 'vattenanslutning', cell: 3 },
      { key: 'gatukostnad', cell: 4 }
    ];
    numberFields.forEach(nf => {
      const input = document.createElement('input');
      input.type = 'number';
      input.className = 'eko-inline-input';
      input.value = fast[nf.key] || '';
      input.placeholder = '0';
      input.onchange = () => saveEkonomiMarkFastighet(fast.id, { [nf.key]: parseFloat(input.value) || 0 });
      row.children[nf.cell].appendChild(input);
    });

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'remove-btn';
    removeBtn.title = 'Ta bort fastighet';
    removeBtn.textContent = '✕';
    removeBtn.onclick = () => removeEkonomiMarkFastighet(fast.id);
    row.children[5].appendChild(removeBtn);
    row.children[5].className = 'row-actions';

    tbody.appendChild(row);
  });
}

async function persistEkonomiMark(){
  await DB.setPersonalData(EKONOMI_KEYS.mark, JSON.stringify(companyEkonomiData.mark));
}

async function addEkonomiMarkFastighet(){
  const pid = currentEkonomiMarkProjectId;
  if(!pid) return;
  if(!companyEkonomiData.mark[pid]) companyEkonomiData.mark[pid] = [];
  companyEkonomiData.mark[pid].push({
    id: 'f' + Date.now() + Math.random().toString(36).slice(2, 7),
    fastighetsbeteckning: '', ort: '', forvarvspris: 0, vattenanslutning: 0, gatukostnad: 0
  });
  try{
    await persistEkonomiMark();
    renderEkonomiProjektMark();
  }catch(err){
    showDebugError('Kunde inte lägga till fastighet', err);
  }
}

async function saveEkonomiMarkFastighet(fastId, patch){
  const pid = currentEkonomiMarkProjectId;
  const fastigheter = companyEkonomiData.mark[pid] || [];
  const idx = fastigheter.findIndex(f => f.id === fastId);
  if(idx === -1) return;
  fastigheter[idx] = { ...fastigheter[idx], ...patch };
  try{
    await persistEkonomiMark();
  }catch(err){
    showDebugError('Kunde inte spara fastighet', err);
  }
}

async function removeEkonomiMarkFastighet(fastId){
  const pid = currentEkonomiMarkProjectId;
  const fastigheter = companyEkonomiData.mark[pid] || [];
  companyEkonomiData.mark[pid] = fastigheter.filter(f => f.id !== fastId);
  try{
    await persistEkonomiMark();
    renderEkonomiProjektMark();
  }catch(err){
    showDebugError('Kunde inte ta bort fastighet', err);
  }
}

function setKopebrevUploadStatus(msg, kind){
  const el = document.getElementById('kopebrevUploadStatus');
  el.textContent = msg;
  el.className = 'contract-upload-status' + (kind ? ' ' + kind : '');
}

function renderEkonomiProjektBudget(){
  const pid = currentEkonomiBudgetProjectId;
  const detail = companyEkonomiData.budgetDetalj[pid] || {};
  const kategorier = detail.kategorier || {};
  const foreningslan = detail.foreningslan || 0;
  const kvm = ekonomiBudgetAreaRevenue.kvm;
  const intakter = ekonomiBudgetAreaRevenue.intakter;

  document.getElementById('ekoBudgetKvm').textContent = kvm ? kvm.toLocaleString('sv-SE', { maximumFractionDigits: 0 }) + ' kvm' : '—';
  document.getElementById('ekoBudgetIntakter').textContent = formatKrFull(intakter);
  document.getElementById('ekoBudgetIntakterPerKvm').textContent = formatKrPerKvm(intakter, kvm);
  document.getElementById('ekoBudgetForeningslan').textContent = formatKrFull(foreningslan);
  document.getElementById('ekoBudgetForeningslanPerKvm').textContent = formatKrPerKvm(foreningslan, kvm);

  const ledger = companyEkonomiData.reskontra[pid] || [];
  const utfallByCategory = {};
  EKONOMI_COST_CATEGORIES.forEach(c => { utfallByCategory[c] = 0; });
  ledger.forEach(line => {
    if(!line.kategori) return;
    utfallByCategory[line.kategori] = (utfallByCategory[line.kategori] || 0) + ekonomiLedgerAmount(line);
  });

  const tbody = document.getElementById('ekonomiBudgetKategoriBody');
  tbody.innerHTML = '';
  let totalBudget = 0, totalUtfall = 0;
  EKONOMI_COST_CATEGORIES.forEach(cat => {
    const budget = kategorier[cat] || 0;
    const utfall = utfallByCategory[cat] || 0;
    totalBudget += budget;
    totalUtfall += utfall;
    const diff = budget - utfall;
    const row = document.createElement('tr');
    row.innerHTML =
      '<td>' + escapeHtml(cat) + '</td>' +
      '<td></td>' +
      '<td>' + formatKrPerKvm(budget, kvm) + '</td>' +
      '<td>' + formatKrFull(utfall) + '</td>' +
      '<td>' + formatKrPerKvm(utfall, kvm) + '</td>' +
      '<td class="' + (diff < 0 ? 'eko-diff-negative' : 'eko-diff-positive') + '">' + formatKrFull(diff) + '</td>';
    const input = document.createElement('input');
    input.type = 'number';
    input.className = 'eko-inline-input';
    input.value = budget || '';
    input.placeholder = '0';
    input.onchange = () => saveEkonomiBudgetCategoryValue(cat, parseFloat(input.value) || 0);
    row.children[1].appendChild(input);
    tbody.appendChild(row);
  });
  const totalDiff = totalBudget - totalUtfall;
  const totalRow = document.createElement('tr');
  totalRow.className = 'eko-row-resultat';
  totalRow.innerHTML =
    '<td>Totalkostnad</td>' +
    '<td>' + formatKrFull(totalBudget) + '</td>' +
    '<td>' + formatKrPerKvm(totalBudget, kvm) + '</td>' +
    '<td>' + formatKrFull(totalUtfall) + '</td>' +
    '<td>' + formatKrPerKvm(totalUtfall, kvm) + '</td>' +
    '<td class="' + (totalDiff < 0 ? 'eko-diff-negative' : 'eko-diff-positive') + '">' + formatKrFull(totalDiff) + '</td>';
  tbody.appendChild(totalRow);

  // Totalkostnad- och Vinst-korten längst upp - Vinst = Intäkter + Föreningslån - Totalkostnad
  document.getElementById('ekoBudgetTotalkostnad').textContent = formatKrFull(totalBudget);
  document.getElementById('ekoBudgetTotalkostnadBudget').textContent = formatKrFull(totalBudget);
  document.getElementById('ekoBudgetTotalkostnadUtfall').textContent = formatKrFull(totalUtfall);
  const vinstBudget = intakter + foreningslan - totalBudget;
  const vinstUtfall = intakter + foreningslan - totalUtfall;
  document.getElementById('ekoBudgetVinst').textContent = formatKrFull(vinstBudget);
  document.getElementById('ekoBudgetVinstBudget').textContent = formatKrFull(vinstBudget);
  document.getElementById('ekoBudgetVinstUtfall').textContent = formatKrFull(vinstUtfall);

  renderEkonomiReskontraTable();
}

async function saveEkonomiBudgetCategoryValue(cat, value){
  const pid = currentEkonomiBudgetProjectId;
  if(!companyEkonomiData.budgetDetalj[pid]) companyEkonomiData.budgetDetalj[pid] = { foreningslan: 0, kategorier: {} };
  if(!companyEkonomiData.budgetDetalj[pid].kategorier) companyEkonomiData.budgetDetalj[pid].kategorier = {};
  companyEkonomiData.budgetDetalj[pid].kategorier[cat] = value;
  try{
    await DB.setPersonalData(EKONOMI_KEYS.budgetDetalj, JSON.stringify(companyEkonomiData.budgetDetalj));
    renderEkonomiProjektBudget();
  }catch(e){
    showDebugError('Kunde inte spara budget', e);
  }
}

function openEkonomiForeningslanModal(){
  const pid = currentEkonomiBudgetProjectId;
  const detail = companyEkonomiData.budgetDetalj[pid] || {};
  const kvm = ekonomiBudgetAreaRevenue.kvm;
  const total = detail.foreningslan || 0;
  document.getElementById('ekoForeningslanTotalInput').value = total || '';
  document.getElementById('ekoForeningslanPerKvmInput').value = (kvm && total) ? Math.round(total / kvm) : '';
  document.getElementById('ekonomiForeningslanModalOverlay').classList.add('open');
}

async function saveEkonomiForeningslanModal(){
  const pid = currentEkonomiBudgetProjectId;
  if(!pid) return;
  const total = parseFloat(document.getElementById('ekoForeningslanTotalInput').value) || 0;
  if(!companyEkonomiData.budgetDetalj[pid]) companyEkonomiData.budgetDetalj[pid] = { foreningslan: 0, kategorier: {} };
  companyEkonomiData.budgetDetalj[pid].foreningslan = total;
  document.getElementById('ekonomiForeningslanModalOverlay').classList.remove('open');
  try{
    await DB.setPersonalData(EKONOMI_KEYS.budgetDetalj, JSON.stringify(companyEkonomiData.budgetDetalj));
    renderEkonomiProjektBudget();
  }catch(err){
    showDebugError('Kunde inte spara föreningslån', err);
  }
}

function renderEkonomiReskontraTable(){
  const pid = currentEkonomiBudgetProjectId;
  const lines = companyEkonomiData.reskontra[pid] || [];
  const tbody = document.getElementById('ekonomiReskontraBody');
  const empty = document.getElementById('ekonomiReskontraEmptyState');
  tbody.innerHTML = '';
  empty.style.display = lines.length ? 'none' : 'block';
  const sorted = [...lines].sort((a, b) => {
    const aUn = !a.kategori, bUn = !b.kategori;
    if(aUn !== bUn) return aUn ? -1 : 1;
    return String(a.lopnr || '').localeCompare(String(b.lopnr || ''), undefined, { numeric: true });
  });
  sorted.forEach(line => {
    const row = document.createElement('tr');
    if(!line.kategori) row.className = 'eko-row-uncategorized';
    row.innerHTML =
      '<td>' + escapeHtml(line.lopnr || '') + '</td>' +
      '<td>' + escapeHtml(line.leverantor || '—') + '</td>' +
      '<td>' + escapeHtml(line.fakturadatum || '—') + '</td>' +
      '<td>' + formatMSEK(line.belopp || 0) + '</td>' +
      '<td></td>' +
      '<td></td>';

    const adjustInput = document.createElement('input');
    adjustInput.type = 'number';
    adjustInput.className = 'eko-inline-input';
    adjustInput.placeholder = String(line.belopp || 0);
    adjustInput.value = line.justeratBelopp != null ? line.justeratBelopp : '';
    adjustInput.onchange = () => saveEkonomiReskontraLine(line.lopnr, {
      justeratBelopp: adjustInput.value === '' ? null : (parseFloat(adjustInput.value) || 0)
    });
    row.children[4].appendChild(adjustInput);

    const select = document.createElement('select');
    select.className = 'eko-inline-select';
    select.innerHTML = '<option value="">Ej kategoriserad</option>' +
      EKONOMI_COST_CATEGORIES.map(c => '<option value="' + escapeHtml(c) + '"' + (line.kategori === c ? ' selected' : '') + '>' + escapeHtml(c) + '</option>').join('');
    select.onchange = () => saveEkonomiReskontraLine(line.lopnr, { kategori: select.value || null });
    row.children[5].appendChild(select);

    tbody.appendChild(row);
  });
}

async function saveEkonomiReskontraLine(lopnr, patch){
  const pid = currentEkonomiBudgetProjectId;
  const lines = companyEkonomiData.reskontra[pid] || [];
  const idx = lines.findIndex(l => l.lopnr === lopnr);
  if(idx === -1) return;
  lines[idx] = { ...lines[idx], ...patch };
  try{
    await DB.setPersonalData(EKONOMI_KEYS.reskontra, JSON.stringify(companyEkonomiData.reskontra));
    renderEkonomiProjektBudget();
  }catch(e){
    showDebugError('Kunde inte spara reskontrarad', e);
  }
}

function setReskontraStatus(msg, kind){
  const el = document.getElementById('reskontraUploadStatus');
  el.textContent = msg;
  el.className = 'contract-upload-status' + (kind ? ' ' + kind : '');
}

// ---------- Lån-detalj: fält + inläsning från balansräkning (BR) ----------
function openEkonomiProjektLan(project){
  currentEkonomiLanProjectId = project.id;
  document.getElementById('ekonomiProjektLanTitle').textContent = project.name;
  document.getElementById('ekonomiSubTabsBar').style.display = 'none';
  ['ekonomiOversiktView', 'ekonomiProjektView', 'ekonomiBudgetView', 'ekonomiMarkView', 'ekonomiLikviditetView',
    'ekonomiLanView', 'ekonomiVinstSolvinkelnView', 'ekonomiProjektMarkView', 'ekonomiProjektBudgetView', 'ekonomiProjektLikviditetView'].forEach(id => {
    document.getElementById(id).style.display = 'none';
  });
  document.getElementById('ekonomiProjektLanView').style.display = 'block';
  renderEkonomiProjektLan();
}

function closeEkonomiProjektLan(){
  document.getElementById('ekonomiProjektLanView').style.display = 'none';
  document.getElementById('ekonomiSubTabsBar').style.display = 'flex';
  setEkonomiSubView('lan');
}

function renderEkonomiProjektLan(){
  const pid = currentEkonomiLanProjectId;
  const rec = companyEkonomiData.lan[pid] || {};
  const fields = EKONOMI_TAB_CONFIG.lan.fields;

  const tbody = document.getElementById('ekonomiLanFieldsBody');
  tbody.innerHTML = '';
  fields.forEach(f => {
    const row = document.createElement('tr');
    row.innerHTML = '<td>' + escapeHtml(f.label) + '</td><td></td><td></td>';
    const input = document.createElement('input');
    input.type = 'number';
    input.className = 'eko-inline-input';
    input.value = rec[f.key] || '';
    input.placeholder = '0';
    input.onchange = () => saveEkonomiLanFieldValue(f.key, parseFloat(input.value) || 0);
    row.children[1].appendChild(input);

    if(f.dated){
      const dateInput = document.createElement('input');
      dateInput.type = 'date';
      dateInput.className = 'eko-inline-input';
      dateInput.style.textAlign = 'left';
      dateInput.value = rec[f.key + 'Datum'] || '';
      dateInput.onchange = () => saveEkonomiLanFieldDate(f.key, dateInput.value);
      row.children[2].appendChild(dateInput);
    } else {
      row.children[2].textContent = '—';
    }
    tbody.appendChild(row);
  });

  renderBrItemsTable();
}

async function saveEkonomiLanFieldValue(fieldKey, value){
  const pid = currentEkonomiLanProjectId;
  if(!companyEkonomiData.lan[pid]) companyEkonomiData.lan[pid] = {};
  companyEkonomiData.lan[pid][fieldKey] = value;
  try{
    await DB.setPersonalData(EKONOMI_KEYS.lan, JSON.stringify(companyEkonomiData.lan));
    renderEkonomiProjektLan();
  }catch(e){
    showDebugError('Kunde inte spara', e);
  }
}

async function saveEkonomiLanFieldDate(fieldKey, dateValue){
  const pid = currentEkonomiLanProjectId;
  if(!companyEkonomiData.lan[pid]) companyEkonomiData.lan[pid] = {};
  companyEkonomiData.lan[pid][fieldKey + 'Datum'] = dateValue;
  try{
    await DB.setPersonalData(EKONOMI_KEYS.lan, JSON.stringify(companyEkonomiData.lan));
  }catch(e){
    showDebugError('Kunde inte spara datum', e);
  }
}

function renderBrItemsTable(){
  const pid = currentEkonomiLanProjectId;
  const items = companyEkonomiData.brItems[pid] || [];
  const tbody = document.getElementById('ekonomiBrItemsBody');
  const empty = document.getElementById('ekonomiBrItemsEmptyState');
  tbody.innerHTML = '';
  empty.style.display = items.length ? 'none' : 'block';
  const fields = EKONOMI_TAB_CONFIG.lan.fields;

  items.forEach((item, idx) => {
    const row = document.createElement('tr');
    row.innerHTML =
      '<td>' + escapeHtml(item.konto || '') + '</td>' +
      '<td>' + formatMSEK(item.belopp || 0) + '</td>' +
      '<td></td>';
    const select = document.createElement('select');
    select.className = 'eko-inline-select';
    select.innerHTML = '<option value="">Ignorera</option>' +
      fields.map(f => '<option value="' + f.key + '"' + (item.kategori === f.key ? ' selected' : '') + '>' + escapeHtml(f.label) + '</option>').join('');
    select.onchange = () => saveBrItemCategory(idx, select.value || null);
    row.children[2].appendChild(select);
    tbody.appendChild(row);
  });
}

async function saveBrItemCategory(idx, kategori){
  const pid = currentEkonomiLanProjectId;
  const items = companyEkonomiData.brItems[pid] || [];
  if(!items[idx]) return;
  items[idx].kategori = kategori;
  try{
    await DB.setPersonalData(EKONOMI_KEYS.brItems, JSON.stringify(companyEkonomiData.brItems));
  }catch(e){
    showDebugError('Kunde inte spara', e);
  }
}

async function applyBrItemsToLan(){
  const pid = currentEkonomiLanProjectId;
  const items = companyEkonomiData.brItems[pid] || [];
  const fields = EKONOMI_TAB_CONFIG.lan.fields;
  const sums = {};
  fields.forEach(f => { sums[f.key] = 0; });
  items.forEach(item => {
    if(item.kategori && sums.hasOwnProperty(item.kategori)){
      sums[item.kategori] += (item.belopp || 0);
    }
  });
  // Behåll ev. redan satta inbetalningsdatum - BR:n ersätter bara beloppen.
  const existing = companyEkonomiData.lan[pid] || {};
  companyEkonomiData.lan[pid] = { ...existing, ...sums };
  try{
    await DB.setPersonalData(EKONOMI_KEYS.lan, JSON.stringify(companyEkonomiData.lan));
    renderEkonomiProjektLan();
    showToast('Fälten uppdaterade från BR.');
  }catch(e){
    showDebugError('Kunde inte tillämpa BR-värden', e);
  }
}

function setBrUploadStatus(msg, kind){
  const el = document.getElementById('brUploadStatus');
  el.textContent = msg;
  el.className = 'contract-upload-status' + (kind ? ' ' + kind : '');
}

// ---------- Likviditetsplan: 12 månader framåt per projekt ----------
function parseKr(str){
  const n = parseInt(String(str || '').replace(/[^0-9]/g, ''), 10);
  return isNaN(n) ? 0 : n;
}

async function computeLikviditetsplan(pid){
  const now = new Date();
  const months = [];
  for(let i = 0; i < 12; i++){
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    months.push({ year: d.getFullYear(), month: d.getMonth(), key: d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') });
  }
  const inflow = {}, outflow = {};
  months.forEach(m => { inflow[m.key] = 0; outflow[m.key] = 0; });

  // Slutbetalningar (tillträden) från lägenhetslistan
  try{
    const raw = await fetchApartmentsRaw(pid);
    const apts = raw.apartments.map(normalizeApartment);
    apts.forEach(a => {
      const dateStr = a.slutbetald && a.slutbetald.date;
      if(!dateStr) return;
      const key = dateStr.slice(0, 7);
      if(!(key in inflow)) return;
      const amount = parseKr(a.slutbetald.amount) || parseKr(a.totalpris);
      inflow[key] += amount;
    });
  }catch(e){ /* inga lägenheter ännu */ }

  // Lån bokade på sin valda inbetalningsmånad (Lån-fliken)
  const lanFields = EKONOMI_TAB_CONFIG.lan.fields.filter(f => f.dated);
  const lanRec = companyEkonomiData.lan[pid] || {};
  lanFields.forEach(f => {
    const dateStr = lanRec[f.key + 'Datum'];
    const amount = lanRec[f.key] || 0;
    if(!dateStr || !amount) return;
    const key = dateStr.slice(0, 7);
    if(key in inflow) inflow[key] += amount;
  });

  // Kategoriserade reskontraposter (Budget-fliken), räknade på förfallodatum
  const ledger = companyEkonomiData.reskontra[pid] || [];
  ledger.forEach(line => {
    if(!line.kategori) return;
    const dateStr = line.forfallodatum || line.fakturadatum;
    if(!dateStr) return;
    const key = dateStr.slice(0, 7);
    if(!(key in outflow)) return;
    outflow[key] += ekonomiLedgerAmount(line);
  });

  const ingaende = (companyEkonomiData.likviditet[pid] && companyEkonomiData.likviditet[pid].belopp) || 0;
  let running = ingaende;
  const rows = months.map(m => {
    const inn = inflow[m.key] || 0;
    const ut = outflow[m.key] || 0;
    const netto = inn - ut;
    running += netto;
    return { year: m.year, month: m.month, inn, ut, netto, saldo: running };
  });
  return { ingaende, rows };
}

async function openEkonomiProjektLikviditet(project){
  currentEkonomiLikviditetProjectId = project.id;
  document.getElementById('ekonomiProjektLikviditetTitle').textContent = project.name;
  document.getElementById('ekonomiSubTabsBar').style.display = 'none';
  ['ekonomiOversiktView', 'ekonomiProjektView', 'ekonomiBudgetView', 'ekonomiMarkView', 'ekonomiLikviditetView',
    'ekonomiLanView', 'ekonomiVinstSolvinkelnView', 'ekonomiProjektMarkView', 'ekonomiProjektBudgetView', 'ekonomiProjektLanView'].forEach(id => {
    document.getElementById(id).style.display = 'none';
  });
  document.getElementById('ekonomiProjektLikviditetView').style.display = 'block';
  await renderEkonomiProjektLikviditet();
}

function closeEkonomiProjektLikviditet(){
  document.getElementById('ekonomiProjektLikviditetView').style.display = 'none';
  document.getElementById('ekonomiSubTabsBar').style.display = 'flex';
  setEkonomiSubView('likviditet');
}

async function renderEkonomiProjektLikviditet(){
  const pid = currentEkonomiLikviditetProjectId;
  const rec = companyEkonomiData.likviditet[pid] || {};
  document.getElementById('ekoLikviditetIngaendeInput').value = rec.belopp || '';

  const plan = await computeLikviditetsplan(pid);
  const tbody = document.getElementById('ekonomiLikviditetPlanBody');
  tbody.innerHTML = '';
  plan.rows.forEach(r => {
    const row = document.createElement('tr');
    const nettoClass = r.netto < 0 ? 'eko-diff-negative' : 'eko-diff-positive';
    const saldoClass = r.saldo < 0 ? 'eko-diff-negative' : 'eko-diff-positive';
    row.innerHTML =
      '<td>' + MONTH_NAMES[r.month] + ' ' + r.year + '</td>' +
      '<td>' + formatMSEK(r.inn) + '</td>' +
      '<td>' + formatMSEK(r.ut) + '</td>' +
      '<td class="' + nettoClass + '">' + formatMSEK(r.netto) + '</td>' +
      '<td class="' + saldoClass + '">' + formatMSEK(r.saldo) + '</td>';
    tbody.appendChild(row);
  });
}

async function saveEkonomiLikviditetIngaende(value){
  const pid = currentEkonomiLikviditetProjectId;
  if(!companyEkonomiData.likviditet[pid]) companyEkonomiData.likviditet[pid] = {};
  companyEkonomiData.likviditet[pid].belopp = value;
  try{
    await DB.setPersonalData(EKONOMI_KEYS.likviditet, JSON.stringify(companyEkonomiData.likviditet));
    await renderEkonomiProjektLikviditet();
  }catch(e){
    showDebugError('Kunde inte spara', e);
  }
}

// Förväntad vinst Solvinkeln = förväntad entreprenadsvinst + ägarandel × förväntad vinst
function ekonomiVinstSolvinkeln(meta){
  const agarandel = (meta && meta.agarandel) || 0;
  const forvantadVinst = (meta && meta.forvantadVinst) || 0;
  const entreprenadsvinst = (meta && meta.forvantadEntreprenadsvinst) || 0;
  return entreprenadsvinst + (agarandel / 100) * forvantadVinst;
}

const EKO_PROJEKT_STATUS_LABELS = [
  { status: 'Pågående', label: 'aktiva' },
  { status: 'Bygglov/projektering', label: 'bygg/projektering' },
  { status: 'Kommande', label: 'kommande' },
  { status: 'Avslutat', label: 'avslutade' }
];

function renderEkonomiOversikt(){
  const sumField = (key, field) => projects.reduce((s, p) => {
    const rec = (companyEkonomiData[key] && companyEkonomiData[key][p.id]) || {};
    return s + (rec[field] || 0);
  }, 0);
  const vinstSolvinkelnTotal = projects.reduce((s, p) => s + ekonomiVinstSolvinkeln(companyEkonomiData.meta[p.id]), 0);

  const breakdown = EKO_PROJEKT_STATUS_LABELS.map(({ status, label }) => {
    const count = projects.filter(p => (p.status || 'Pågående') === status).length;
    return { label, count };
  });
  document.getElementById('ekoKpiAktivaProjekt').textContent = projects.length;
  document.getElementById('ekoKpiProjektBreakdown').textContent =
    breakdown.map(b => b.count + ' ' + b.label).join(' · ');
  document.getElementById('ekoKpiLikviditet').textContent = formatMSEK(sumField('likviditet', 'belopp'));
  document.getElementById('ekoKpiLanevolym').textContent = formatMSEK(sumField('lan', 'externtLan'));
  document.getElementById('ekoKpiLanSolvinkeln').textContent = formatMSEK(sumField('lan', 'lanSolvinkeln'));
  document.getElementById('ekoKpiLanNBE').textContent = formatMSEK(sumField('lan', 'lanNBE'));
  document.getElementById('ekoKpiLanDerome').textContent = formatMSEK(sumField('lan', 'lanDerome'));
  document.getElementById('ekoKpiLanBORO').textContent = formatMSEK(sumField('lan', 'lanBORO'));
  document.getElementById('ekoKpiFastighetsvarde').textContent = formatMSEK(sumField('lan', 'fastighetsvarde'));
  document.getElementById('ekoKpiVinstSolvinkeln').textContent = formatMSEK(vinstSolvinkelnTotal);
}

function renderEkonomiProjekt(){
  const tbody = document.getElementById('ekonomiProjektBody');
  tbody.innerHTML = '';
  projects.forEach(p => {
    const meta = companyEkonomiData.meta[p.id] || {};
    const status = p.status || 'Pågående';
    const sold = ekonomiSoldCounts[p.id] || { sold: 0, total: 0 };
    const row = document.createElement('tr');
    row.onclick = () => openEkonomiProjektModal(p);
    row.innerHTML =
      '<td>' + escapeHtml(p.name) + '</td>' +
      '<td>' + escapeHtml(p.ort || '—') + '</td>' +
      '<td>' + escapeHtml(meta.jvPartner || '—') + '</td>' +
      '<td>' + (meta.agarandel ? meta.agarandel + '%' : '—') + '</td>' +
      '<td style="text-align:left;">' + status + '</td>' +
      '<td>' + formatMSEK(meta.forvantadVinst || 0) + '</td>' +
      '<td>' + sold.sold + ' / ' + sold.total + '</td>';
    tbody.appendChild(row);
  });
}

function renderEkonomiVinstSolvinkeln(){
  const tbody = document.getElementById('ekonomiVinstSolvinkelnBody');
  tbody.innerHTML = '';
  let total = 0;
  projects.forEach(p => {
    const v = ekonomiVinstSolvinkeln(companyEkonomiData.meta[p.id]);
    total += v;
    const row = document.createElement('tr');
    row.innerHTML = '<td>' + escapeHtml(p.name) + '</td><td>' + formatMSEK(v) + '</td>';
    tbody.appendChild(row);
  });
  const totalRow = document.createElement('tr');
  totalRow.className = 'eko-row-resultat';
  totalRow.innerHTML = '<td>Totalt</td><td>' + formatMSEK(total) + '</td>';
  tbody.appendChild(totalRow);
}

function updateEkonomiProjektVinstPreview(){
  const meta = {
    agarandel: parseFloat(document.getElementById('ekonomiProjektAgarandelInput').value) || 0,
    forvantadVinst: parseFloat(document.getElementById('ekonomiProjektVinstInput').value) || 0,
    forvantadEntreprenadsvinst: parseFloat(document.getElementById('ekonomiProjektEntreprenadsvinstInput').value) || 0
  };
  document.getElementById('ekonomiProjektVinstSolvinkelnPreview').textContent = formatMSEK(ekonomiVinstSolvinkeln(meta));
}

function openEkonomiProjektModal(p){
  currentEkonomiProjektId = p.id;
  const meta = companyEkonomiData.meta[p.id] || {};
  document.getElementById('ekonomiProjektModalSub').textContent = p.name;
  document.getElementById('ekonomiProjektOrtInput').value = p.ort || '';
  document.getElementById('ekonomiProjektJvInput').value = meta.jvPartner || '';
  document.getElementById('ekonomiProjektAgarandelInput').value = meta.agarandel || '';
  document.getElementById('ekonomiProjektStatusInput').value = p.status || 'Pågående';
  document.getElementById('ekonomiProjektVinstInput').value = meta.forvantadVinst || '';
  document.getElementById('ekonomiProjektEntreprenadsvinstInput').value = meta.forvantadEntreprenadsvinst || '';
  updateEkonomiProjektVinstPreview();
  document.getElementById('ekonomiProjektModalOverlay').classList.add('open');
}

async function saveEkonomiProjektModal(){
  if(!currentEkonomiProjektId) return;
  const meta = {
    jvPartner: document.getElementById('ekonomiProjektJvInput').value,
    agarandel: parseFloat(document.getElementById('ekonomiProjektAgarandelInput').value) || 0,
    forvantadVinst: parseFloat(document.getElementById('ekonomiProjektVinstInput').value) || 0,
    forvantadEntreprenadsvinst: parseFloat(document.getElementById('ekonomiProjektEntreprenadsvinstInput').value) || 0
  };
  companyEkonomiData.meta[currentEkonomiProjektId] = meta;
  // Status och Ort styr vad som visas i den DELADE Projektöversikten/Byggmöten
  // (alla fem ser den) - sparas därför på det delade projektobjektet, inte i
  // Mikaels privata ekonomi-projekt-meta.
  const status = document.getElementById('ekonomiProjektStatusInput').value;
  const ort = document.getElementById('ekonomiProjektOrtInput').value.trim();
  const project = projects.find(p => p.id === currentEkonomiProjektId);
  if(project){ project.status = status; project.ort = ort; }
  document.getElementById('ekonomiProjektModalOverlay').classList.remove('open');
  try{
    await Promise.all([
      DB.setPersonalData(EKONOMI_KEYS.meta, JSON.stringify(companyEkonomiData.meta)),
      persistProjects()
    ]);
    renderEkonomiProjekt();
  }catch(e){
    showDebugError('Kunde inte spara projektinfo', e);
  }
}

function renderEkonomiNumberTab(tabKey){
  const cfg = EKONOMI_TAB_CONFIG[tabKey];
  const tbody = document.getElementById(cfg.tbodyId);
  tbody.innerHTML = '';
  const totals = {};
  cfg.fields.forEach(f => { totals[f.key] = 0; });
  let totalComputed = 0;

  projects.forEach(p => {
    const rec = (companyEkonomiData[cfg.key] && companyEkonomiData[cfg.key][p.id]) || {};
    const row = document.createElement('tr');
    row.onclick = () => {
      if(tabKey === 'lan') openEkonomiProjektLan(p);
      else if(tabKey === 'likviditet') openEkonomiProjektLikviditet(p);
      else openEkonomiNumberModal(tabKey, p);
    };
    let html = '<td>' + escapeHtml(p.name) + '</td>';
    cfg.fields.forEach(f => {
      const v = rec[f.key] || 0;
      totals[f.key] += v;
      html += '<td>' + formatMSEK(v) + '</td>';
    });
    if(cfg.computed){
      const c = cfg.computed.calc(rec);
      totalComputed += c;
      html += '<td class="' + (c < 0 ? 'eko-diff-negative' : 'eko-diff-positive') + '">' + formatMSEK(c) + '</td>';
    }
    row.innerHTML = html;
    tbody.appendChild(row);
  });

  const totalRow = document.createElement('tr');
  totalRow.className = 'eko-row-resultat';
  let totalHtml = '<td>Totalt</td>';
  cfg.fields.forEach(f => { totalHtml += '<td>' + formatMSEK(totals[f.key]) + '</td>'; });
  if(cfg.computed){
    totalHtml += '<td class="' + (totalComputed < 0 ? 'eko-diff-negative' : 'eko-diff-positive') + '">' + formatMSEK(totalComputed) + '</td>';
  }
  totalRow.innerHTML = totalHtml;
  tbody.appendChild(totalRow);
}

function openEkonomiNumberModal(tabKey, project){
  const cfg = EKONOMI_TAB_CONFIG[tabKey];
  ekonomiNumberModalCtx = { tabKey, projectId: project.id };
  document.getElementById('ekonomiNumberModalTitle').textContent = project.name;
  document.getElementById('ekonomiNumberModalSub').textContent = '';
  const rec = (companyEkonomiData[cfg.key] && companyEkonomiData[cfg.key][project.id]) || {};
  const container = document.getElementById('ekonomiNumberModalFields');
  container.innerHTML = '';
  cfg.fields.forEach(f => {
    const row = document.createElement('div');
    row.className = 'ekonomi-field-row';
    const label = document.createElement('label');
    label.textContent = f.label;
    const input = document.createElement('input');
    input.type = 'number';
    input.id = 'ekoNumField_' + f.key;
    input.value = rec[f.key] || '';
    row.appendChild(label);
    row.appendChild(input);
    container.appendChild(row);
  });
  document.getElementById('ekonomiNumberModalOverlay').classList.add('open');
}

async function saveEkonomiNumberModal(){
  if(!ekonomiNumberModalCtx) return;
  const { tabKey, projectId } = ekonomiNumberModalCtx;
  const cfg = EKONOMI_TAB_CONFIG[tabKey];
  const rec = {};
  cfg.fields.forEach(f => {
    const input = document.getElementById('ekoNumField_' + f.key);
    rec[f.key] = parseFloat(input.value) || 0;
  });
  if(!companyEkonomiData[cfg.key]) companyEkonomiData[cfg.key] = {};
  companyEkonomiData[cfg.key][projectId] = rec;
  document.getElementById('ekonomiNumberModalOverlay').classList.remove('open');
  try{
    await DB.setPersonalData(EKONOMI_KEYS[cfg.key], JSON.stringify(companyEkonomiData[cfg.key]));
    renderEkonomiNumberTab(tabKey);
  }catch(e){
    showDebugError('Kunde inte spara', e);
  }
}

liggarenPopulateSelects();

document.getElementById('liggarenNewBtn').onclick = () => {
  liggarenResetForm();
  document.getElementById('liggarenForm').style.display = 'block';
  document.getElementById('liggarenTitleInput').focus();
};
document.getElementById('liggarenCancelBtn').onclick = () => {
  document.getElementById('liggarenForm').style.display = 'none';
};
document.getElementById('liggarenSaveBtn').onclick = liggarenSaveTask;
document.getElementById('liggarenTitleInput').addEventListener('keydown', e => {
  if(e.key === 'Enter') liggarenSaveTask();
});
document.getElementById('liggarenNotifyCheck').addEventListener('change', e => {
  document.getElementById('liggarenNotifyFields').style.display = e.target.checked ? 'block' : 'none';
});
document.getElementById('liggarenRecurringCheck').addEventListener('change', e => {
  document.getElementById('liggarenRecurringFields').style.display = e.target.checked ? 'block' : 'none';
  document.getElementById('liggarenDeadlineInput').disabled = e.target.checked;
  if(e.target.checked) document.getElementById('liggarenDeadlineInput').value = '';
});
document.getElementById('liggarenNotifyAddressSelect').addEventListener('change', e => {
  document.getElementById('liggarenNotifyCustomInput').style.display = e.target.value === 'other' ? 'block' : 'none';
});
document.getElementById('liggarenProjectFilter').addEventListener('change', e => {
  liggarenProjectFilterVal = e.target.value;
  renderArenden();
});
document.getElementById('liggarenSortSelect').addEventListener('change', e => {
  liggarenSortBy = e.target.value;
  renderArenden();
});
document.getElementById('liggarenClearAllBtn').onclick = liggarenClearAll;

document.getElementById('addPaminnelseBtn').onclick = () => {
  const dateInput = document.getElementById('newPaminnelseDate');
  const noteInput = document.getElementById('newPaminnelseNote');
  const date = dateInput.value;
  const note = noteInput.value.trim();
  if(!date && !note) return;
  paminnelser.push({ id: 'p' + Date.now() + Math.random().toString(36).slice(2,7), date, note });
  dateInput.value = '';
  noteInput.value = '';
  persistPaminnelser();
  renderPaminnelser();
};

document.getElementById('goToProjektoversiktCard').onclick = openHome;
document.getElementById('goToPersonalBtn').onclick = openPersonal;
document.getElementById('goToEkonomiCard').onclick = openCompanyEkonomi;
document.getElementById('goToEkonomiBtn').onclick = openCompanyEkonomi;
document.getElementById('backToPersonalFromEkonomiBtn').onclick = openPersonal;
document.getElementById('ekoKpiAktivaProjektCard').onclick = openHome;
document.querySelectorAll('.ekonomi-sub-tab').forEach(btn => {
  btn.onclick = () => setEkonomiSubView(btn.dataset.ekonomiView);
});
document.getElementById('ekonomiProjektModalCancel').onclick = () => document.getElementById('ekonomiProjektModalOverlay').classList.remove('open');
document.getElementById('ekonomiProjektModalSave').onclick = saveEkonomiProjektModal;
document.getElementById('ekonomiNumberModalCancel').onclick = () => document.getElementById('ekonomiNumberModalOverlay').classList.remove('open');
document.getElementById('ekonomiNumberModalSave').onclick = saveEkonomiNumberModal;
['ekonomiProjektAgarandelInput', 'ekonomiProjektVinstInput', 'ekonomiProjektEntreprenadsvinstInput'].forEach(id => {
  document.getElementById(id).addEventListener('input', updateEkonomiProjektVinstPreview);
});
document.getElementById('ekonomiAddProjectBtn').onclick = async () => {
  const input = document.getElementById('ekonomiNewProjectInput');
  const name = input.value.trim();
  if(await addProject(name)){
    input.value = '';
    renderEkonomiProjekt();
  }
};
document.getElementById('ekonomiNewProjectInput').addEventListener('keydown', e => {
  if(e.key === 'Enter') document.getElementById('ekonomiAddProjectBtn').click();
});

document.getElementById('backToEkonomiBudgetListBtn').onclick = closeEkonomiProjektBudget;
document.getElementById('ekoBudgetForeningslanCard').onclick = openEkonomiForeningslanModal;
document.getElementById('ekoForeningslanModalCancel').onclick = () => {
  document.getElementById('ekonomiForeningslanModalOverlay').classList.remove('open');
};
document.getElementById('ekoForeningslanModalSave').onclick = saveEkonomiForeningslanModal;
document.getElementById('ekoForeningslanTotalInput').addEventListener('input', (e) => {
  const kvm = ekonomiBudgetAreaRevenue.kvm;
  if(!kvm) return;
  const total = parseFloat(e.target.value) || 0;
  document.getElementById('ekoForeningslanPerKvmInput').value = Math.round(total / kvm) || '';
});
document.getElementById('ekoForeningslanPerKvmInput').addEventListener('input', (e) => {
  const kvm = ekonomiBudgetAreaRevenue.kvm;
  if(!kvm) return;
  const perKvm = parseFloat(e.target.value) || 0;
  document.getElementById('ekoForeningslanTotalInput').value = Math.round(perKvm * kvm) || '';
});

document.getElementById('reskontraUploadBtn').onclick = () => {
  document.getElementById('reskontraFileInput').click();
};
document.getElementById('reskontraFileInput').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if(!file) return;
  const pid = currentEkonomiBudgetProjectId;
  if(!pid) return;
  if(file.size > CONTRACT_MAX_BYTES){
    setReskontraStatus('Filen är för stor (max 8 MB).', 'err');
    e.target.value = '';
    return;
  }
  const btn = document.getElementById('reskontraUploadBtn');
  btn.disabled = true;
  setReskontraStatus('Läser reskontran…');
  try{
    const pdfBase64 = await fileToBase64(file);
    const sb = window.DB && window.DB.hasSupabase ? window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY) : null;
    if(!sb) throw new Error('Kräver att Supabase är påkopplat (fungerar inte i lokalt testläge)');
    const { data, error } = await sb.functions.invoke('extract-reskontra', { body: { pdfBase64, filename: file.name } });
    if(error) throw error;
    const invoices = (data && data.invoices) || [];
    const existing = companyEkonomiData.reskontra[pid] || [];
    const existingLopnr = new Set(existing.map(l => l.lopnr));
    const fresh = invoices.filter(inv => inv.lopnr && !existingLopnr.has(inv.lopnr));
    const newLines = fresh.map(inv => ({
      lopnr: inv.lopnr,
      leverantor: inv.leverantor || '',
      fakturadatum: inv.fakturadatum || '',
      forfallodatum: inv.forfallodatum || '',
      belopp: inv.belopp || 0,
      kategori: null,
      justeratBelopp: null,
      uppladdadAv: myName,
      uppladdadAt: new Date().toISOString()
    }));
    companyEkonomiData.reskontra[pid] = existing.concat(newLines);
    await DB.setPersonalData(EKONOMI_KEYS.reskontra, JSON.stringify(companyEkonomiData.reskontra));
    setReskontraStatus(newLines.length + ' nya rader inlästa, ' + (invoices.length - newLines.length) + ' fanns redan.', 'ok');
    renderEkonomiProjektBudget();
  }catch(err){
    setReskontraStatus('Kunde inte läsa reskontran: ' + (err.message || err), 'err');
  }finally{
    btn.disabled = false;
    e.target.value = '';
  }
});

document.getElementById('backToEkonomiMarkListBtn').onclick = closeEkonomiProjektMark;
document.getElementById('ekonomiAddFastighetBtn').onclick = addEkonomiMarkFastighet;
document.getElementById('kopebrevUploadBtn').onclick = () => {
  document.getElementById('kopebrevFileInput').click();
};
document.getElementById('kopebrevFileInput').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if(!file) return;
  const pid = currentEkonomiMarkProjectId;
  if(!pid) return;
  if(file.size > CONTRACT_MAX_BYTES){
    setKopebrevUploadStatus('Filen är för stor (max 8 MB).', 'err');
    e.target.value = '';
    return;
  }
  const btn = document.getElementById('kopebrevUploadBtn');
  btn.disabled = true;
  setKopebrevUploadStatus('Läser köpebrevet…');
  try{
    const pdfBase64 = await fileToBase64(file);
    const sb = window.DB && window.DB.hasSupabase ? window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY) : null;
    if(!sb) throw new Error('Kräver att Supabase är påkopplat (fungerar inte i lokalt testläge)');
    const { data, error } = await sb.functions.invoke('extract-kopebrev', { body: { pdfBase64, filename: file.name } });
    if(error) throw error;
    if(!companyEkonomiData.mark[pid]) companyEkonomiData.mark[pid] = [];
    companyEkonomiData.mark[pid].push({
      id: 'f' + Date.now() + Math.random().toString(36).slice(2, 7),
      fastighetsbeteckning: data.fastighetsbeteckning || '',
      ort: data.ort || '',
      forvarvspris: data.forvarvspris || 0,
      vattenanslutning: data.vattenanslutning || 0,
      gatukostnad: data.gatukostnad || 0
    });
    await persistEkonomiMark();
    setKopebrevUploadStatus('Köpebrevet inläst - ny fastighet tillagd.', 'ok');
    renderEkonomiProjektMark();
  }catch(err){
    setKopebrevUploadStatus('Kunde inte läsa köpebrevet: ' + (err.message || err), 'err');
  }finally{
    btn.disabled = false;
    e.target.value = '';
  }
});

document.getElementById('backToEkonomiLanListBtn').onclick = closeEkonomiProjektLan;
document.getElementById('applyBrItemsBtn').onclick = applyBrItemsToLan;
document.getElementById('brUploadBtn').onclick = () => {
  document.getElementById('brFileInput').click();
};
document.getElementById('brFileInput').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if(!file) return;
  const pid = currentEkonomiLanProjectId;
  if(!pid) return;
  if(file.size > CONTRACT_MAX_BYTES){
    setBrUploadStatus('Filen är för stor (max 8 MB).', 'err');
    e.target.value = '';
    return;
  }
  const btn = document.getElementById('brUploadBtn');
  btn.disabled = true;
  setBrUploadStatus('Läser balansräkningen…');
  try{
    const pdfBase64 = await fileToBase64(file);
    const sb = window.DB && window.DB.hasSupabase ? window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY) : null;
    if(!sb) throw new Error('Kräver att Supabase är påkopplat (fungerar inte i lokalt testläge)');
    const { data, error } = await sb.functions.invoke('extract-br', { body: { pdfBase64, filename: file.name } });
    if(error) throw error;
    const rows = (data && data.rows) || [];
    companyEkonomiData.brItems[pid] = rows.map(r => ({ konto: r.konto || '', belopp: r.belopp || 0, kategori: null }));
    await DB.setPersonalData(EKONOMI_KEYS.brItems, JSON.stringify(companyEkonomiData.brItems));
    setBrUploadStatus(rows.length + ' rader inlästa. Rikta varje post mot rätt fält nedan.', 'ok');
    renderBrItemsTable();
  }catch(err){
    setBrUploadStatus('Kunde inte läsa balansräkningen: ' + (err.message || err), 'err');
  }finally{
    btn.disabled = false;
    e.target.value = '';
  }
});

document.getElementById('backToEkonomiLikviditetListBtn').onclick = closeEkonomiProjektLikviditet;
document.getElementById('ekoLikviditetIngaendeInput').addEventListener('change', (e) => {
  saveEkonomiLikviditetIngaende(parseFloat(e.target.value) || 0);
});

function openProject(p){
  activeProjectId = p.id;
  projectSubView = 'checklista';
  entreprenadSubView = 'tidsplan';
  loaded = false;
  showScreen('project');
  document.getElementById('projectHeaderName').textContent = p.name;
  setProjectSubView('checklista');
  loadApartments(false);
}

function setProjectSubView(view){
  projectSubView = view;
  document.querySelectorAll('.sub-tab').forEach(btn => btn.classList.toggle('active', btn.dataset.view === view));
  document.getElementById('checklistaSubview').style.display = view === 'checklista' ? 'block' : 'none';
  document.getElementById('medlemsinfoSubview').style.display = view === 'medlemsinfo' ? 'block' : 'none';
  document.getElementById('inflyttningsinfoSubview').style.display = view === 'inflyttningsinfo' ? 'block' : 'none';
  document.getElementById('intressenterSubview').style.display = view === 'intressenter' ? 'block' : 'none';
  document.getElementById('entreprenadSubview').style.display = view === 'entreprenad' ? 'block' : 'none';
  if(view === 'medlemsinfo') renderMedlemsinfo();
  if(view === 'inflyttningsinfo') renderInflyttningsinfo();
  if(view === 'intressenter') loadInterests().then(renderIntressenterTab);
  if(view === 'entreprenad') setEntreprenadSubView(entreprenadSubView || 'tidsplan');
}

function setEntreprenadSubView(view){
  entreprenadSubView = view;
  document.querySelectorAll('.entreprenad-sub-tab').forEach(btn => btn.classList.toggle('active', btn.dataset.entreprenadView === view));
  document.getElementById('tidsplanSubview').style.display = view === 'tidsplan' ? 'block' : 'none';
  document.getElementById('byggmoteListSubview').style.display = view === 'byggmoten' ? 'block' : 'none';
  document.getElementById('byggmoteFormSubview').style.display = 'none';
  document.getElementById('materialSubview').style.display = view === 'material' ? 'block' : 'none';
  if(view === 'tidsplan') loadTidsplan(activeProjectId);
  if(view === 'byggmoten') loadByggmoten(activeProjectId);
  if(view === 'material') loadMaterial(activeProjectId);
}

function openCalendarScreen(){
  showScreen('calendar');
  loadAllEvents().then(renderCalendar);
}

document.querySelectorAll('.sub-tab').forEach(btn => {
  btn.onclick = () => setProjectSubView(btn.dataset.view);
});
document.querySelectorAll('.entreprenad-sub-tab').forEach(btn => {
  btn.onclick = () => setEntreprenadSubView(btn.dataset.entreprenadView);
});
document.getElementById('backToHomeBtn').onclick = openHome;
document.getElementById('backToHomeFromCalendarBtn').onclick = openHome;

// ---------- Calendar ----------
async function loadAllEvents(){
  const events = [];
  for(const p of projects){
    try{
      const raw = await fetchApartmentsRaw(p.id);
      if(raw.apartments.length > 0){
        const apts = raw.apartments.map(normalizeApartment);
        apts.forEach(a => {
          if(a.besiktning && a.besiktning.date){
            events.push({ date: a.besiktning.date, type: 'besiktning', project: p.name, lgh: a.lgh });
          }
          if(a.inflyttning && a.inflyttning.date){
            events.push({ date: a.inflyttning.date, type: 'inflyttning', project: p.name, lgh: a.lgh });
          }
        });
      }
    }catch(e){ /* projektet har inga lägenheter ännu - inget fel */ }
  }
  allEvents = events;
}

function renderCalendar(){
  const grid = document.getElementById('calGrid');
  grid.innerHTML = '';
  ['Mån','Tis','Ons','Tors','Fre','Lör','Sön'].forEach(d=>{
    const el = document.createElement('div');
    el.className = 'cal-weekday';
    el.textContent = d;
    grid.appendChild(el);
  });

  const first = new Date(calendarYear, calendarMonth, 1);
  let startDay = first.getDay();
  startDay = (startDay === 0) ? 6 : startDay - 1;
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();

  for(let i = 0; i < startDay; i++){
    const el = document.createElement('div');
    el.className = 'cal-day empty';
    grid.appendChild(el);
  }

  for(let day = 1; day <= daysInMonth; day++){
    const dateStr = calendarYear + '-' + String(calendarMonth + 1).padStart(2,'0') + '-' + String(day).padStart(2,'0');
    const cell = document.createElement('div');
    cell.className = 'cal-day';
    const num = document.createElement('div');
    num.className = 'cal-day-num';
    num.textContent = day;
    cell.appendChild(num);
    allEvents.filter(e => e.date === dateStr).forEach(e => {
      const chip = document.createElement('div');
      chip.className = 'cal-chip ' + (e.type === 'besiktning' ? 'chip-blue' : 'chip-green');
      chip.textContent = 'LGH ' + e.lgh + ' · ' + e.project;
      chip.title = (e.type === 'besiktning' ? 'Besiktning' : 'Inflyttning') + ' — ' + e.project + ', LGH ' + e.lgh;
      cell.appendChild(chip);
    });
    grid.appendChild(cell);
  }

  document.getElementById('calTitle').textContent = MONTH_NAMES[calendarMonth] + ' ' + calendarYear;
}

document.getElementById('calPrev').onclick = () => {
  calendarMonth--; if(calendarMonth < 0){ calendarMonth = 11; calendarYear--; }
  renderCalendar();
};
document.getElementById('calNext').onclick = () => {
  calendarMonth++; if(calendarMonth > 11){ calendarMonth = 0; calendarYear++; }
  renderCalendar();
};

// ---------- Apartments ----------
// Läser lägenheter för ett projekt: den vanliga klump-nyckeln i första hand. Om projektet av
// misstag hann migreras till det tidigare (nu övergivna) per-lägenhet-formatet under en kort
// period, läses det formatet också som fallback så ingen data tappas.
async function fetchApartmentsRaw(projectId){
  try{
    const res = await window.storage.get(apartmentsKey(projectId), true);
    if(res && res.value){
      const apts = JSON.parse(res.value);
      return { apartments: apts, fromPerItem: false };
    }
  }catch(e){ /* ingen data ännu */ }

  return { apartments: [], fromPerItem: false };
}

async function loadApartments(showSyncState){
  if(!activeProjectId) return;
  if(hasUnsavedApartmentChanges) return; // don't let a poll clobber a change that failed to save
  try{
    if(showSyncState) document.getElementById('syncText').textContent = 'synkar…';
    const raw = await fetchApartmentsRaw(activeProjectId);

    if(raw.apartments.length > 0){
      apartments = raw.apartments.map(normalizeApartment);
      if(raw.fromPerItem){
        // Konsolidera tillbaka till en enda klumpnyckel (en sparning istället för många).
        await persistApartmentsNow();
      }
    } else {
      // Listan är tom i lagringen (nytt projekt, eller en lista som av misstag blivit tom).
      // Om projektet har en känd startlista, återskapa den istället för att fastna tomt.
      const proj = projects.find(p => p.id === activeProjectId);
      const seed = proj ? SEED_APARTMENTS_BY_PROJECT_NAME[proj.name] : null;
      if(seed && apartments.length === 0){
        apartments = seed.map(row => newApartment({
          lgh: String(row[0]), totalyta: String(row[1]), avgift: String(row[2]), totalpris: String(row[3]), address: row[4] ? String(row[4]) : ''
        }));
        await persistApartmentsNow();
      } else if(!loaded){
        apartments = [];
      } else {
        apartments = apartments.map(normalizeApartment);
      }
    }
    loaded = true;
    document.getElementById('syncText').textContent = 'uppdaterad ' + new Date().toLocaleTimeString('sv-SE');
    renderTable();
  }catch(e){
    showDebugError('Kunde inte synka lägenheter (loadApartments)', e);
    document.getElementById('syncText').textContent = 'synk misslyckades';
  }
}

// Debounce: om flera ändringar görs snabbt efter varandra (t.ex. flera kryssrutor i rad)
// slås de ihop till EN sparning istället för en per klick. Det är det som håller nere
// antalet anrop mot lagringstjänsten och undviker "rate limit"-fel.
let persistApartmentsTimer = null;
function persistApartments(){
  return new Promise(resolve => {
    if(persistApartmentsTimer) clearTimeout(persistApartmentsTimer);
    persistApartmentsTimer = setTimeout(async () => {
      persistApartmentsTimer = null;
      await persistApartmentsNow();
      resolve();
    }, 900);
  });
}

async function persistApartmentsNow(){
  saving = true;
  const projectIdAtSaveTime = activeProjectId;
  const json = JSON.stringify(apartments);
  try{
    await withRetry(() => window.storage.set(apartmentsKey(projectIdAtSaveTime), json, true));
    hasUnsavedApartmentChanges = false;
    clearDebugError();
  }catch(e){
    hasUnsavedApartmentChanges = true;
    showDebugError('Kunde inte spara lägenheter (persistApartments)', e, () => persistApartmentsNow());
    showToast('Kunde inte spara – klicka "Försök spara igen" nedan');
  }
  saving = false;
}

function fieldStamp(obj){
  if(!obj || !obj.by) return '';
  return obj.by + ' · ' + timeAgo(obj.at);
}

function buyerSummaryHtml(buyer){
  if(!buyer || !(buyer.name || buyer.phone || buyer.email)) return '<span style="color:var(--ink-soft);">—</span>';
  const parts = [];
  if(buyer.name) parts.push('<div style="font-weight:600;">' + escapeHtml(buyer.name) + '</div>');
  if(buyer.phone) parts.push('<div>' + escapeHtml(buyer.phone) + '</div>');
  if(buyer.email) parts.push('<div>' + escapeHtml(buyer.email) + '</div>');
  return '<div style="font-family:\'JetBrains Mono\',monospace; font-size:12px; line-height:1.5; text-align:left;">' + parts.join('') + '</div>';
}

// Samma visuella mönster som makeCheckCell, men för Medlemsinformation-tabellen
// (renderar om medlemsvyn istället för checklistan efteråt).
function makeMedlemsCheckCell(apt, field, label){
  const td = document.createElement('td');
  td.className = 'center';
  const box = document.createElement('div');
  box.className = 'check' + (apt[field].done ? ' checked' : '');
  box.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
  box.title = apt[field].done ? fieldStamp(apt[field]) : label;
  box.onclick = async () => {
    if(!myName){ showToast('Ange ditt namn först'); return; }
    apt[field].done = !apt[field].done;
    apt[field].by = apt[field].done ? myName : '';
    apt[field].at = apt[field].done ? new Date().toISOString() : '';
    renderMedlemsinfo();
    await persistApartments();
  };
  td.appendChild(box);
  if(apt[field].done && apt[field].by){
    const stamp = document.createElement('span');
    stamp.className = 'stamp-mark';
    stamp.textContent = apt[field].by;
    td.appendChild(stamp);
  }
  return td;
}

function renderMedlemsinfo(){
  const body = document.getElementById('medlemsBody');
  const table = document.getElementById('medlemsTable');
  const empty = document.getElementById('medlemsEmptyState');
  body.innerHTML = '';

  if(apartments.length === 0){
    table.style.display = 'none';
    empty.style.display = 'block';
    return;
  }
  table.style.display = 'table';
  empty.style.display = 'none';

  apartments.forEach(apt => {
    const tr = document.createElement('tr');

    const lghTd = document.createElement('td');
    lghTd.style.textAlign = 'left';
    lghTd.style.fontFamily = "'JetBrains Mono', monospace";
    lghTd.style.fontWeight = '700';
    lghTd.style.color = 'var(--blue)';
    lghTd.textContent = apt.lgh || '—';
    tr.appendChild(lghTd);

    const addressTd = document.createElement('td');
    addressTd.style.textAlign = 'left';
    addressTd.textContent = apt.address || '—';
    tr.appendChild(addressTd);

    if(apt.sald.done){
      const buyer1Td = document.createElement('td');
      buyer1Td.innerHTML = buyerSummaryHtml(apt.sald.buyer1);
      tr.appendChild(buyer1Td);

      const buyer2Td = document.createElement('td');
      buyer2Td.innerHTML = buyerSummaryHtml(apt.sald.buyer2);
      tr.appendChild(buyer2Td);
    } else {
      const notSoldTd1 = document.createElement('td');
      notSoldTd1.innerHTML = '<span style="color:var(--ink-soft); font-size:12.5px;">Ej sålt</span>';
      tr.appendChild(notSoldTd1);
      const notSoldTd2 = document.createElement('td');
      notSoldTd2.innerHTML = '<span style="color:var(--ink-soft); font-size:12.5px;">—</span>';
      tr.appendChild(notSoldTd2);
    }

    tr.appendChild(makeMedlemsCheckCell(apt, 'upplatenKoncern', 'Upplåten inom koncernen'));
    tr.appendChild(makeEditableTextCell(apt, 'anlaggningsid', 'Anläggnings-ID…'));

    body.appendChild(tr);
  });
}

// Gul = datum ifyllt men inte klart, grön = klart/bekräftat. Ingen färg = inget ifyllt än.
function besiktningStatusColor(apt){
  const b = apt.besiktning;
  if(!b || !b.date) return '';
  const allBooked = b.kontaktatKund && b.bokatBesiktningsman && b.meddelatEntreprenor && b.bokatStad;
  return allBooked ? '#EEF6F0' : 'var(--amber-soft)';
}

function inflyttningsplanStatusColor(apt){
  if(apt.upplatelse && apt.upplatelse.date) return '#EEF6F0';
  const plan = apt.inflyttningPlan;
  if(!plan) return '';
  if(plan.bekraftatDatumKund) return '#EEF6F0';
  if(plan.byggdatum || plan.onskatDatumKund) return 'var(--amber-soft)';
  return '';
}

function renderInflyttningsinfo(){
  const body = document.getElementById('inflyttningsinfoBody');
  const table = document.getElementById('inflyttningsinfoTable');
  const empty = document.getElementById('inflyttningsinfoEmptyState');
  body.innerHTML = '';

  if(apartments.length === 0){
    table.style.display = 'none';
    empty.style.display = 'block';
    return;
  }
  table.style.display = 'table';
  empty.style.display = 'none';

  apartments.forEach(apt => {
    const tr = document.createElement('tr');

    const lghTd = document.createElement('td');
    lghTd.style.cssText = "text-align:left; font-family:'JetBrains Mono', monospace; font-weight:700; color:var(--blue);";
    lghTd.textContent = apt.lgh || '—';
    tr.appendChild(lghTd);

    const addressTd = document.createElement('td');
    addressTd.style.textAlign = 'left';
    addressTd.textContent = apt.address || '—';
    tr.appendChild(addressTd);

    tr.appendChild(makeEditableTextCell(apt, 'projektnummer', 'Projektnummer…'));

    const besiktningTd = document.createElement('td');
    besiktningTd.style.textAlign = 'left';
    besiktningTd.style.backgroundColor = besiktningStatusColor(apt);
    const besiktningSpan = document.createElement('span');
    besiktningSpan.className = 'editable';
    besiktningSpan.style.cursor = 'pointer';
    besiktningSpan.textContent = apt.besiktning.date || '—';
    besiktningSpan.onclick = () => openBesiktningModal(apt);
    besiktningTd.appendChild(besiktningSpan);
    tr.appendChild(besiktningTd);

    const inflyttningTd = document.createElement('td');
    inflyttningTd.style.textAlign = 'left';
    inflyttningTd.style.backgroundColor = inflyttningsplanStatusColor(apt);
    const inflyttningSpan = document.createElement('span');
    inflyttningSpan.className = 'editable';
    inflyttningSpan.style.cursor = 'pointer';
    const effDate = effectiveInflyttningDate(apt);
    inflyttningSpan.textContent = effDate ? (effDate + (apt.upplatelse.date ? ' (upplåtelse/överlåtelse)' : '')) : '—';
    inflyttningSpan.onclick = () => openInflyttningPlanModal(apt);
    inflyttningTd.appendChild(inflyttningSpan);
    tr.appendChild(inflyttningTd);

    tr.appendChild(makeKommentarCell(apt, 'kommentarInflyttning'));

    body.appendChild(tr);
  });
}

function renderTable(){
  const table = document.getElementById('aptTable');
  const body = document.getElementById('aptBody');
  const empty = document.getElementById('emptyState');
  body.innerHTML = '';

  if(apartments.length === 0){
    table.style.display = 'none';
    empty.style.display = 'block';
    document.getElementById('emptyStateText').textContent = 'Inga lägenheter tillagda i det här projektet än.';
  } else {
    table.style.display = 'table';
    empty.style.display = 'none';
  }

  apartments.forEach(apt => {
    const tr = document.createElement('tr');
    if(isMovedIn(apt)) tr.className = 'moved-in';

    tr.appendChild(makeLghCell(apt));
    tr.appendChild(makeEditableTextCell(apt, 'address', 'Adress…'));
    tr.appendChild(makeEditableCell(apt, 'totalyta', 'm²'));
    tr.appendChild(makeEditableCell(apt, 'totalpris', ''));
    tr.appendChild(makeSaldCell(apt));
    tr.appendChild(makeSlutbetaldCell(apt));
    tr.appendChild(makeDateCell(apt, 'besiktning'));
    tr.appendChild(makeDateCell(apt, 'inflyttning'));
    tr.appendChild(makeCheckCell(apt, 'grovstadat'));
    tr.appendChild(makeCheckCell(apt, 'finstadat'));
    tr.appendChild(makeCheckCell(apt, 'sopkarl'));
    tr.appendChild(makeCheckCell(apt, 'fiber'));
    tr.appendChild(makeCheckCell(apt, 'brevlada'));
    tr.appendChild(makeTillvalCell(apt));
    tr.appendChild(makeKommentarCell(apt, 'kommentar'));

    const actionsTd = document.createElement('td');
    actionsTd.className = 'row-actions';
    const rm = document.createElement('button');
    rm.className = 'remove-btn';
    rm.textContent = '✕';
    rm.title = 'Ta bort lägenhet';
    rm.onclick = () => removeApartment(apt.id);
    actionsTd.appendChild(rm);
    tr.appendChild(actionsTd);

    body.appendChild(tr);
  });

  // progress
  let totalChecks = 0, doneChecks = 0;
  apartments.forEach(a=>{
    CHECK_FIELDS.forEach(f=>{ totalChecks++; if(a[f].done) doneChecks++; });
    totalChecks += 3;
    if(a.besiktning.date) doneChecks++;
    if(a.inflyttning.date) doneChecks++;
    if(a.tillval.done) doneChecks++;
  });
  document.getElementById('progressText').textContent = apartments.length
    ? apartments.length + ' lägenheter · ' + doneChecks + '/' + totalChecks + ' punkter klara'
    : '';
}

// ---------- Läs in lägenhetsförteckning från ekonomisk plan/kostnadskalkyl (PDF) ----------
// Visas bara i tomläget (inga lägenheter tillagda än) - skriver aldrig över en
// redan ifylld lista. Föreningslånet skrivs bara ut som info, sparas inte
// automatiskt (det hör hemma i Ekonomi → Budget, som bara Mikael har tillgång till).
function setKostnadskalkylStatus(msg, kind){
  const el = document.getElementById('kostnadskalkylUploadStatus');
  el.textContent = msg;
  el.className = 'contract-upload-status' + (kind ? ' ' + kind : '');
}
document.getElementById('kostnadskalkylUploadBtn').onclick = () => {
  document.getElementById('kostnadskalkylFileInput').click();
};
document.getElementById('kostnadskalkylFileInput').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if(!file) return;
  if(!activeProjectId){ e.target.value = ''; return; }
  if(file.size > CONTRACT_MAX_BYTES){
    setKostnadskalkylStatus('Filen är för stor (max 8 MB).', 'err');
    e.target.value = '';
    return;
  }
  const btn = document.getElementById('kostnadskalkylUploadBtn');
  btn.disabled = true;
  setKostnadskalkylStatus('Läser dokumentet…');
  try{
    const pdfBase64 = await fileToBase64(file);
    const sb = window.DB && window.DB.hasSupabase ? window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY) : null;
    if(!sb) throw new Error('Kräver att Supabase är påkopplat (fungerar inte i lokalt testläge)');
    const { data, error } = await sb.functions.invoke('extract-kostnadskalkyl', { body: { pdfBase64, filename: file.name } });
    if(error) throw error;
    const rows = (data && data.apartments) || [];
    if(!rows.length) throw new Error('Kunde inte hitta någon lägenhetsförteckning i dokumentet.');
    apartments = rows.map(r => newApartment({
      lgh: r.lgh != null ? String(r.lgh) : '',
      address: r.address || '',
      totalyta: r.area != null ? String(r.area) : '',
      avgift: r.avgift != null ? String(r.avgift) : '',
      totalpris: r.totalpris != null ? String(r.totalpris) : ''
    }));
    await persistApartmentsNow();
    renderTable();
    let msg = rows.length + ' lägenheter inlästa.';
    if(data && data.foreningslan){
      msg += ' Beräknat föreningslån enligt dokumentet: ' + Math.round(data.foreningslan).toLocaleString('sv-SE') + ' kr (fyll i manuellt under Ekonomi → Budget).';
    }
    setKostnadskalkylStatus(msg, 'ok');
  }catch(err){
    setKostnadskalkylStatus(err.message || 'Något gick fel.', 'err');
  } finally {
    btn.disabled = false;
    e.target.value = '';
  }
});

function makeCell(text, cls){
  const td = document.createElement('td');
  if(cls) td.className = cls;
  td.textContent = text;
  return td;
}

let currentKundinfoAptId = null;

function makeLghCell(apt){
  const td = document.createElement('td');
  td.className = 'lgh-cell';
  const span = document.createElement('span');
  span.textContent = apt.lgh || '—';
  span.style.cursor = 'pointer';
  span.title = 'Klicka för kundinformation';
  span.onclick = () => openKundinfoModal(apt);
  td.appendChild(span);
  return td;
}

function buyerHtml(buyer, label){
  const hasInfo = buyer && (buyer.name || buyer.phone || buyer.email);
  if(!hasInfo) return '';
  return '<div class="kundinfo-buyer"><h4>' + label + '</h4>' +
    (buyer.name ? '<div class="kundinfo-row"><span>Namn</span><span>' + escapeHtml(buyer.name) + '</span></div>' : '') +
    (buyer.phone ? '<div class="kundinfo-row"><span>Telefon</span><span>' + escapeHtml(buyer.phone) + '</span></div>' : '') +
    (buyer.email ? '<div class="kundinfo-row"><span>Mejl</span><span>' + escapeHtml(buyer.email) + '</span></div>' : '') +
    '</div>';
}

function openKundinfoModal(apt){
  currentKundinfoAptId = apt.id;
  document.getElementById('kundinfoModalSub').textContent = 'LGH ' + (apt.lgh || '—') + (apt.address ? ' · ' + apt.address : '');
  const content = document.getElementById('kundinfoContent');

  if(!apt.sald.done){
    content.innerHTML = '<div class="kundinfo-empty">Lägenheten är inte markerad som såld ännu.</div>';
  } else {
    const buyer1Html = buyerHtml(apt.sald.buyer1, 'Köpare 1');
    const buyer2Html = buyerHtml(apt.sald.buyer2, 'Köpare 2');
    if(!buyer1Html && !buyer2Html){
      content.innerHTML = '<div class="kundinfo-empty">Ingen köparinformation registrerad ännu.</div>';
    } else {
      content.innerHTML = buyer1Html + buyer2Html;
    }
    if(apt.sald.price){
      content.innerHTML += '<div class="kundinfo-row" style="margin-top:8px;"><span>Sålt för</span><span>' + formatNumberSv(apt.sald.price) + ' kr</span></div>';
    }
  }

  document.getElementById('kundinfoModalOverlay').classList.add('open');
}

function closeKundinfoModal(){
  document.getElementById('kundinfoModalOverlay').classList.remove('open');
  currentKundinfoAptId = null;
}

document.getElementById('kundinfoCloseBtn').onclick = closeKundinfoModal;
document.getElementById('kundinfoModalOverlay').addEventListener('click', e => {
  if(e.target.id === 'kundinfoModalOverlay') closeKundinfoModal();
});
document.getElementById('kundinfoEditBtn').onclick = () => {
  const apt = apartments.find(a => a.id === currentKundinfoAptId);
  closeKundinfoModal();
  if(apt) openSaldModal(apt);
};

function formatNumberSv(value){
  const digits = String(value).replace(/[^0-9]/g, '');
  if(!digits) return '';
  return parseInt(digits, 10).toLocaleString('sv-SE');
}

function makeEditableTextCell(apt, field, placeholder){
  const td = document.createElement('td');
  const span = document.createElement('span');
  span.className = 'editable';
  span.style.color = apt[field] ? 'inherit' : 'var(--ink-soft)';
  span.textContent = apt[field] ? apt[field] : (placeholder || '—');
  span.onclick = () => {
    const input = document.createElement('input');
    input.value = apt[field] || '';
    input.type = 'text';
    input.style.width = '100%';
    input.style.boxSizing = 'border-box';
    td.innerHTML = '';
    td.appendChild(input);
    input.focus();
    input.select();
    const save = async () => {
      apt[field] = input.value.trim();
      renderTable();
      if(document.getElementById('medlemsinfoSubview').style.display !== 'none') renderMedlemsinfo();
      await persistApartments();
    };
    input.addEventListener('blur', save);
    input.addEventListener('keydown', e => { if(e.key === 'Enter') input.blur(); });
  };
  td.appendChild(span);
  return td;
}

// Kommentar visas alltid förkortad (ellipsis) i tabellen - klick öppnar en
// popup för att läsa hela texten eller ändra den, istället för att redigeras
// inline som övriga fält. Fältnamnet skickas in så samma cell/popup kan
// användas för olika kommentarfält (Checklistan resp. Inflyttningsinformation).
function makeKommentarCell(apt, field){
  const td = document.createElement('td');
  const span = document.createElement('span');
  span.className = 'editable';
  span.style.cursor = 'pointer';
  span.style.color = apt[field] ? 'inherit' : 'var(--ink-soft)';
  span.textContent = apt[field] ? apt[field] : 'Anteckning…';
  span.onclick = () => openKommentarModal(apt, field);
  td.appendChild(span);
  return td;
}

let currentKommentarAptId = null;
let currentKommentarField = 'kommentar';
function openKommentarModal(apt, field){
  currentKommentarAptId = apt.id;
  currentKommentarField = field;
  document.getElementById('kommentarModalSub').textContent = 'LGH ' + (apt.lgh || '—') + (apt.address ? ' · ' + apt.address : '');
  document.getElementById('kommentarInput').value = apt[field] || '';
  document.getElementById('kommentarModalOverlay').classList.add('open');
  setTimeout(() => document.getElementById('kommentarInput').focus(), 0);
}
function closeKommentarModal(){
  document.getElementById('kommentarModalOverlay').classList.remove('open');
  currentKommentarAptId = null;
}
document.getElementById('kommentarCancelBtn').onclick = closeKommentarModal;
document.getElementById('kommentarModalOverlay').addEventListener('click', e => {
  if(e.target.id === 'kommentarModalOverlay') closeKommentarModal();
});
document.getElementById('kommentarSaveBtn').onclick = async () => {
  const apt = apartments.find(a => a.id === currentKommentarAptId);
  if(!apt){ closeKommentarModal(); return; }
  apt[currentKommentarField] = document.getElementById('kommentarInput').value.trim();
  closeKommentarModal();
  renderTable();
  renderInflyttningsinfo();
  await persistApartments();
};

function makeEditableCell(apt, field, unit){
  const td = document.createElement('td');
  const span = document.createElement('span');
  span.className = 'editable';
  span.textContent = apt[field] ? (formatNumberSv(apt[field]) + (unit ? ' ' + unit : '')) : '—';
  span.onclick = () => {
    const input = document.createElement('input');
    input.value = apt[field] || '';
    input.type = 'text';
    td.innerHTML = '';
    td.appendChild(input);
    input.focus();
    input.select();
    const save = async () => {
      apt[field] = input.value.replace(/[^0-9]/g, '').trim();
      renderTable();
      await persistApartments();
    };
    input.addEventListener('blur', save);
    input.addEventListener('keydown', e => { if(e.key === 'Enter') input.blur(); });
  };
  td.appendChild(span);
  return td;
}

let currentSaldAptId = null;

function makeSaldCell(apt){
  const td = document.createElement('td');
  td.className = 'center';

  const box = document.createElement('div');
  box.className = 'check' + (apt.sald.done ? ' checked' : '');
  box.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
  box.title = apt.sald.done ? fieldStamp(apt.sald) : 'Såld';
  box.onclick = () => openSaldModal(apt);
  td.appendChild(box);

  if(apt.sald.done){
    const noteWrap = document.createElement('div');
    noteWrap.style.marginTop = '5px';
    const priceDiffers = apt.sald.price && formatNumberSv(apt.sald.price) !== formatNumberSv(apt.totalpris);
    const noteSpan = document.createElement('span');
    noteSpan.className = 'editable';
    noteSpan.style.cssText = 'font-size:10.5px; display:block; color:' + (apt.sald.price ? 'var(--ink-soft)' : 'var(--blue)');
    if(apt.sald.price && priceDiffers){
      noteSpan.textContent = 'Sålt för ' + formatNumberSv(apt.sald.price) + ' kr';
    } else if(apt.sald.price){
      noteSpan.textContent = formatNumberSv(apt.sald.price) + ' kr';
    } else {
      noteSpan.textContent = '+ pris';
    }
    noteSpan.onclick = () => openSaldModal(apt);
    noteWrap.appendChild(noteSpan);
    td.appendChild(noteWrap);
  }

  if(apt.sald.done && apt.sald.by){
    const stamp = document.createElement('span');
    stamp.className = 'stamp-mark';
    stamp.textContent = apt.sald.by;
    td.appendChild(stamp);
  }
  return td;
}

function openSaldModal(apt){
  currentSaldAptId = apt.id;
  document.getElementById('saldModalSub').textContent = 'LGH ' + (apt.lgh || '—') + (apt.address ? ' · ' + apt.address : '');
  document.getElementById('saldDoneCheckbox').checked = !!apt.sald.done;
  document.getElementById('saldAmountInput').value = apt.sald.price || '';
  document.getElementById('saldBuyer1Name').value = apt.sald.buyer1.name || '';
  document.getElementById('saldBuyer1Phone').value = apt.sald.buyer1.phone || '';
  document.getElementById('saldBuyer1Email').value = apt.sald.buyer1.email || '';
  document.getElementById('saldBuyer2Name').value = apt.sald.buyer2.name || '';
  document.getElementById('saldBuyer2Phone').value = apt.sald.buyer2.phone || '';
  document.getElementById('saldBuyer2Email').value = apt.sald.buyer2.email || '';
  document.getElementById('saldInflyttningInput').value = (apt.inflyttning && apt.inflyttning.date) || '';
  document.getElementById('contractFileInput').value = '';
  const statusEl = document.getElementById('contractUploadStatus');
  statusEl.textContent = '';
  statusEl.className = 'contract-upload-status';
  document.getElementById('saldModalOverlay').classList.add('open');
  setTimeout(() => document.getElementById('saldAmountInput').focus(), 0);
}

function closeSaldModal(){
  document.getElementById('saldModalOverlay').classList.remove('open');
  currentSaldAptId = null;
}

document.getElementById('saldCancelBtn').onclick = closeSaldModal;
document.getElementById('saldModalOverlay').addEventListener('click', e => {
  if(e.target.id === 'saldModalOverlay') closeSaldModal();
});
document.getElementById('saldSaveBtn').onclick = async () => {
  if(!myName){ showToast('Ange ditt namn först'); closeSaldModal(); return; }
  const apt = apartments.find(a => a.id === currentSaldAptId);
  if(!apt){ closeSaldModal(); return; }
  const done = document.getElementById('saldDoneCheckbox').checked;
  const price = document.getElementById('saldAmountInput').value.replace(/[^0-9]/g, '').trim();

  apt.sald.done = done;
  apt.sald.price = price;
  apt.sald.by = done ? myName : '';
  apt.sald.at = done ? new Date().toISOString() : '';
  apt.sald.buyer1 = {
    name: document.getElementById('saldBuyer1Name').value.trim(),
    phone: document.getElementById('saldBuyer1Phone').value.trim(),
    email: document.getElementById('saldBuyer1Email').value.trim()
  };
  apt.sald.buyer2 = {
    name: document.getElementById('saldBuyer2Name').value.trim(),
    phone: document.getElementById('saldBuyer2Phone').value.trim(),
    email: document.getElementById('saldBuyer2Email').value.trim()
  };

  const inflyttningDate = document.getElementById('saldInflyttningInput').value;
  if(inflyttningDate && inflyttningDate !== apt.inflyttning.date){
    apt.inflyttning.date = inflyttningDate;
    apt.inflyttning.by = myName;
    apt.inflyttning.at = new Date().toISOString();
  }

  closeSaldModal();
  renderTable();
  if(document.getElementById('medlemsinfoSubview').style.display !== 'none') renderMedlemsinfo();
  await persistApartments();
};

// ---------- Läs in köpare/pris/inflyttning från uppladdat avtal (PDF) ----------
// Filen sparas inte - används bara transient för att extrahera fälten, som sedan
// granskas av användaren innan Spara klickas (aldrig auto-sparat).
const CONTRACT_MAX_BYTES = 8 * 1024 * 1024;

function fileToBase64(file){
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function setContractStatus(msg, kind){
  const el = document.getElementById('contractUploadStatus');
  el.textContent = msg;
  el.className = 'contract-upload-status' + (kind ? ' ' + kind : '');
}

document.getElementById('contractUploadBtn').onclick = () => {
  document.getElementById('contractFileInput').click();
};

document.getElementById('contractFileInput').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if(!file) return;
  if(file.size > CONTRACT_MAX_BYTES){
    setContractStatus('Filen är för stor (max 8 MB).', 'err');
    return;
  }
  const btn = document.getElementById('contractUploadBtn');
  btn.disabled = true;
  setContractStatus('Läser avtalet…');
  try{
    const pdfBase64 = await fileToBase64(file);
    const sb = window.DB && window.DB.hasSupabase ? window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY) : null;
    if(!sb) throw new Error('Kräver att Supabase är påkopplat (fungerar inte i lokalt testläge)');
    const { data, error } = await sb.functions.invoke('hyper-responder', {
      body: { pdfBase64, filename: file.name }
    });
    if(error) throw error;

    if(data.price) document.getElementById('saldAmountInput').value = data.price;
    if(data.buyer1){
      if(data.buyer1.name) document.getElementById('saldBuyer1Name').value = data.buyer1.name;
      if(data.buyer1.phone) document.getElementById('saldBuyer1Phone').value = data.buyer1.phone;
      if(data.buyer1.email) document.getElementById('saldBuyer1Email').value = data.buyer1.email;
    }
    if(data.buyer2){
      if(data.buyer2.name) document.getElementById('saldBuyer2Name').value = data.buyer2.name;
      if(data.buyer2.phone) document.getElementById('saldBuyer2Phone').value = data.buyer2.phone;
      if(data.buyer2.email) document.getElementById('saldBuyer2Email').value = data.buyer2.email;
    }
    if(data.moveInDate) document.getElementById('saldInflyttningInput').value = data.moveInDate;
    document.getElementById('saldDoneCheckbox').checked = true;

    let note = 'Klart - granska fälten innan du sparar.';
    if(data.apartmentNumber) note += ' (Avtalet nämner lgh ' + data.apartmentNumber + ' - kolla att det stämmer med raden du redigerar.)';
    setContractStatus(note, 'ok');
  }catch(err){
    setContractStatus('Kunde inte läsa avtalet: ' + err.message, 'err');
  }finally{
    btn.disabled = false;
  }
});

let currentSlutbetaldAptId = null;

function makeSlutbetaldCell(apt){
  const td = document.createElement('td');
  td.className = 'center';

  const box = document.createElement('div');
  box.className = 'check' + (apt.slutbetald.done ? ' checked' : '');
  box.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
  box.title = apt.slutbetald.done ? fieldStamp(apt.slutbetald) : 'Slutbetald';
  box.onclick = () => openSlutbetaldModal(apt);
  td.appendChild(box);

  if(apt.slutbetald.done){
    const noteWrap = document.createElement('div');
    noteWrap.style.marginTop = '5px';
    const noteSpan = document.createElement('span');
    noteSpan.className = 'editable';
    noteSpan.style.cssText = 'font-size:10.5px; display:block; color:var(--ink-soft);';
    const parts = [];
    if(apt.slutbetald.amount) parts.push(formatNumberSv(apt.slutbetald.amount) + ' kr');
    if(apt.slutbetald.date) parts.push(apt.slutbetald.date);
    noteSpan.textContent = parts.length ? parts.join(' · ') : '+ detaljer';
    noteSpan.onclick = () => openSlutbetaldModal(apt);
    noteWrap.appendChild(noteSpan);
    td.appendChild(noteWrap);
  }

  if(apt.slutbetald.done && apt.slutbetald.by){
    const stamp = document.createElement('span');
    stamp.className = 'stamp-mark';
    stamp.textContent = apt.slutbetald.by;
    td.appendChild(stamp);
  }
  return td;
}

function openSlutbetaldModal(apt){
  currentSlutbetaldAptId = apt.id;
  document.getElementById('slutbetaldModalSub').textContent = 'LGH ' + (apt.lgh || '—') + (apt.address ? ' · ' + apt.address : '');
  document.getElementById('slutbetaldDoneCheckbox').checked = !!apt.slutbetald.done;
  document.getElementById('slutbetaldAmountInput').value = apt.slutbetald.amount || '';
  document.getElementById('slutbetaldDateInput').value = apt.slutbetald.date || '';
  document.getElementById('slutbetaldModalOverlay').classList.add('open');
  setTimeout(() => document.getElementById('slutbetaldAmountInput').focus(), 0);
}

function closeSlutbetaldModal(){
  document.getElementById('slutbetaldModalOverlay').classList.remove('open');
  currentSlutbetaldAptId = null;
}

document.getElementById('slutbetaldCancelBtn').onclick = closeSlutbetaldModal;
document.getElementById('slutbetaldModalOverlay').addEventListener('click', e => {
  if(e.target.id === 'slutbetaldModalOverlay') closeSlutbetaldModal();
});
document.getElementById('slutbetaldSaveBtn').onclick = async () => {
  if(!myName){ showToast('Ange ditt namn först'); closeSlutbetaldModal(); return; }
  const apt = apartments.find(a => a.id === currentSlutbetaldAptId);
  if(!apt){ closeSlutbetaldModal(); return; }
  const done = document.getElementById('slutbetaldDoneCheckbox').checked;
  const amount = document.getElementById('slutbetaldAmountInput').value.replace(/[^0-9]/g, '').trim();
  const date = document.getElementById('slutbetaldDateInput').value;

  apt.slutbetald.done = done;
  apt.slutbetald.amount = amount;
  apt.slutbetald.date = date;
  apt.slutbetald.by = done ? myName : '';
  apt.slutbetald.at = done ? new Date().toISOString() : '';

  closeSlutbetaldModal();
  renderTable();
  await persistApartments();
};

function makeCheckCell(apt, field){
  const td = document.createElement('td');
  td.className = 'center';
  const box = document.createElement('div');
  box.className = 'check' + (apt[field].done ? ' checked' : '');
  box.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
  box.title = apt[field].done ? fieldStamp(apt[field]) : CHECK_LABELS[field];
  box.onclick = async () => {
    if(!myName){ showToast('Ange ditt namn först'); return; }
    apt[field].done = !apt[field].done;
    apt[field].by = apt[field].done ? myName : '';
    apt[field].at = apt[field].done ? new Date().toISOString() : '';
    renderTable();
    await persistApartments();
  };
  td.appendChild(box);
  if(apt[field].done && apt[field].by){
    const stamp = document.createElement('span');
    stamp.className = 'stamp-mark';
    stamp.textContent = apt[field].by;
    td.appendChild(stamp);
  }
  return td;
}

let currentTillvalAptId = null;

function makeTillvalCell(apt){
  const td = document.createElement('td');
  td.className = 'center';

  const box = document.createElement('div');
  box.className = 'check' + (apt.tillval.done ? ' checked' : '');
  box.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
  box.style.margin = '0 auto';
  box.title = apt.tillval.done ? fieldStamp(apt.tillval) : 'Tillval';
  box.onclick = () => openTillvalModal(apt);
  td.appendChild(box);

  if(apt.tillval.done){
    const summary = document.createElement('div');
    summary.className = 'tillval-summary';
    summary.style.cursor = 'pointer';
    summary.style.marginTop = '5px';
    const parts = [];
    if(apt.tillval.note) parts.push(apt.tillval.note);
    const invoiceParts = [];
    if(apt.tillval.invoicedCustomer) invoiceParts.push('Kund');
    if(apt.tillval.invoicedLoan) invoiceParts.push('Bolån');
    if(invoiceParts.length) parts.push('Fakt: ' + invoiceParts.join(' + '));
    if(apt.tillval.amount) parts.push(formatNumberSv(apt.tillval.amount) + ' kr');
    summary.textContent = parts.length ? parts.join(' · ') : 'Klicka för detaljer';
    summary.onclick = () => openTillvalModal(apt);
    td.appendChild(summary);
  }

  if(apt.tillval.done && apt.tillval.by){
    const stamp = document.createElement('span');
    stamp.className = 'stamp-mark';
    stamp.textContent = apt.tillval.by;
    td.appendChild(stamp);
  }
  return td;
}

function openTillvalModal(apt){
  currentTillvalAptId = apt.id;
  document.getElementById('tillvalModalSub').textContent = 'LGH ' + (apt.lgh || '—') + (apt.address ? ' · ' + apt.address : '');
  document.getElementById('tillvalNoteInput').value = apt.tillval.note || '';
  document.getElementById('tillvalInvoicedCustomer').checked = !!apt.tillval.invoicedCustomer;
  document.getElementById('tillvalInvoicedLoan').checked = !!apt.tillval.invoicedLoan;
  document.getElementById('tillvalAmountInput').value = apt.tillval.amount || '';
  document.getElementById('tillvalModalOverlay').classList.add('open');
  setTimeout(() => document.getElementById('tillvalNoteInput').focus(), 0);
}

function closeTillvalModal(){
  document.getElementById('tillvalModalOverlay').classList.remove('open');
  currentTillvalAptId = null;
}

document.getElementById('tillvalCancelBtn').onclick = closeTillvalModal;
document.getElementById('tillvalModalOverlay').addEventListener('click', e => {
  if(e.target.id === 'tillvalModalOverlay') closeTillvalModal();
});
document.getElementById('tillvalSaveBtn').onclick = async () => {
  if(!myName){ showToast('Ange ditt namn först'); closeTillvalModal(); return; }
  const apt = apartments.find(a => a.id === currentTillvalAptId);
  if(!apt){ closeTillvalModal(); return; }
  const note = document.getElementById('tillvalNoteInput').value.trim();
  const invoicedCustomer = document.getElementById('tillvalInvoicedCustomer').checked;
  const invoicedLoan = document.getElementById('tillvalInvoicedLoan').checked;
  const amount = document.getElementById('tillvalAmountInput').value.replace(/[^0-9]/g, '').trim();

  apt.tillval.note = note;
  apt.tillval.invoicedCustomer = invoicedCustomer;
  apt.tillval.invoicedLoan = invoicedLoan;
  apt.tillval.amount = amount;
  const hasContent = !!(note || amount || invoicedCustomer || invoicedLoan);
  apt.tillval.done = hasContent;
  apt.tillval.by = hasContent ? myName : '';
  apt.tillval.at = hasContent ? new Date().toISOString() : '';

  closeTillvalModal();
  renderTable();
  await persistApartments();
};

// ---------- Besiktning (modal med checklista, öppnas från Inflyttningsinformation) ----------
let currentBesiktningAptId = null;

function openBesiktningModal(apt){
  currentBesiktningAptId = apt.id;
  document.getElementById('besiktningModalSub').textContent = 'LGH ' + (apt.lgh || '—') + (apt.address ? ' · ' + apt.address : '');
  document.getElementById('besiktningDatumInput').value = apt.besiktning.date || '';
  document.getElementById('besiktningKontaktatKund').checked = !!apt.besiktning.kontaktatKund;
  document.getElementById('besiktningBokatBesiktningsman').checked = !!apt.besiktning.bokatBesiktningsman;
  document.getElementById('besiktningMeddelatEntreprenor').checked = !!apt.besiktning.meddelatEntreprenor;
  document.getElementById('besiktningBokatStad').checked = !!apt.besiktning.bokatStad;
  document.getElementById('besiktningModalOverlay').classList.add('open');
}
function closeBesiktningModal(){
  document.getElementById('besiktningModalOverlay').classList.remove('open');
  currentBesiktningAptId = null;
}
document.getElementById('besiktningCancelBtn').onclick = closeBesiktningModal;
document.getElementById('besiktningModalOverlay').addEventListener('click', e => {
  if(e.target.id === 'besiktningModalOverlay') closeBesiktningModal();
});
document.getElementById('besiktningSaveBtn').onclick = async () => {
  const apt = apartments.find(a => a.id === currentBesiktningAptId);
  if(!apt){ closeBesiktningModal(); return; }
  const date = document.getElementById('besiktningDatumInput').value;
  if(date && date !== apt.besiktning.date){
    apt.besiktning.by = myName || '';
    apt.besiktning.at = new Date().toISOString();
  }
  apt.besiktning.date = date;
  apt.besiktning.kontaktatKund = document.getElementById('besiktningKontaktatKund').checked;
  apt.besiktning.bokatBesiktningsman = document.getElementById('besiktningBokatBesiktningsman').checked;
  apt.besiktning.meddelatEntreprenor = document.getElementById('besiktningMeddelatEntreprenor').checked;
  apt.besiktning.bokatStad = document.getElementById('besiktningBokatStad').checked;
  closeBesiktningModal();
  renderTable();
  if(document.getElementById('inflyttningsinfoSubview').style.display !== 'none') renderInflyttningsinfo();
  await persistApartments();
};

// ---------- Inflyttningsdatum (modal med önskat/bygg/bekräftat datum + upplåtelse/överlåtelse) ----------
let currentInflyttningAptId = null;

function updateUpplatelseInfoDisplay(apt){
  const infoEl = document.getElementById('upplatelseInfoText');
  const clearBtn = document.getElementById('upplatelseClearBtn');
  if(apt.upplatelse && apt.upplatelse.date){
    infoEl.textContent = 'Datum enligt ' + (apt.upplatelse.typ || 'upplåtelse/överlåtelse') + ': ' + apt.upplatelse.date + ' - detta går före allt annat i checklistan.';
    infoEl.style.display = 'block';
    clearBtn.style.display = 'inline-block';
  } else {
    infoEl.style.display = 'none';
    clearBtn.style.display = 'none';
  }
}

function openInflyttningPlanModal(apt){
  currentInflyttningAptId = apt.id;
  document.getElementById('inflyttningPlanModalSub').textContent = 'LGH ' + (apt.lgh || '—') + (apt.address ? ' · ' + apt.address : '');
  document.getElementById('inflyttningOnskatInput').value = apt.inflyttningPlan.onskatDatumKund || '';
  document.getElementById('inflyttningByggdatumInput').value = apt.inflyttningPlan.byggdatum || '';
  document.getElementById('inflyttningBekraftatInput').value = apt.inflyttningPlan.bekraftatDatumKund || '';
  setUpplatelseStatus('', '');
  updateUpplatelseInfoDisplay(apt);
  document.getElementById('inflyttningPlanModalOverlay').classList.add('open');
}
function closeInflyttningPlanModal(){
  document.getElementById('inflyttningPlanModalOverlay').classList.remove('open');
  currentInflyttningAptId = null;
}
document.getElementById('inflyttningPlanCancelBtn').onclick = closeInflyttningPlanModal;
document.getElementById('inflyttningPlanModalOverlay').addEventListener('click', e => {
  if(e.target.id === 'inflyttningPlanModalOverlay') closeInflyttningPlanModal();
});
document.getElementById('upplatelseClearBtn').onclick = async () => {
  const apt = apartments.find(a => a.id === currentInflyttningAptId);
  if(!apt) return;
  apt.upplatelse = { date: '', by: '', at: '', typ: '' };
  const newDate = effectiveInflyttningDate(apt);
  if(newDate !== apt.inflyttning.date){
    apt.inflyttning.date = newDate;
    apt.inflyttning.by = myName || '';
    apt.inflyttning.at = new Date().toISOString();
  }
  updateUpplatelseInfoDisplay(apt);
  renderTable();
  renderInflyttningsinfo();
  await persistApartments();
};
document.getElementById('inflyttningPlanSaveBtn').onclick = async () => {
  const apt = apartments.find(a => a.id === currentInflyttningAptId);
  if(!apt){ closeInflyttningPlanModal(); return; }
  apt.inflyttningPlan.onskatDatumKund = document.getElementById('inflyttningOnskatInput').value;
  apt.inflyttningPlan.byggdatum = document.getElementById('inflyttningByggdatumInput').value;
  apt.inflyttningPlan.bekraftatDatumKund = document.getElementById('inflyttningBekraftatInput').value;
  const newDate = effectiveInflyttningDate(apt);
  if(newDate && newDate !== apt.inflyttning.date){
    apt.inflyttning.by = myName || '';
    apt.inflyttning.at = new Date().toISOString();
  }
  apt.inflyttning.date = newDate;
  closeInflyttningPlanModal();
  renderTable();
  renderInflyttningsinfo();
  await persistApartments();
};

function setUpplatelseStatus(msg, kind){
  const el = document.getElementById('upplatelseUploadStatus');
  el.textContent = msg;
  el.className = 'contract-upload-status' + (kind ? ' ' + kind : '');
}
document.getElementById('upplatelseUploadBtn').onclick = () => {
  document.getElementById('upplatelseFileInput').click();
};
document.getElementById('upplatelseFileInput').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if(!file) return;
  const apt = apartments.find(a => a.id === currentInflyttningAptId);
  if(!apt) return;
  if(file.size > CONTRACT_MAX_BYTES){
    setUpplatelseStatus('Filen är för stor (max 8 MB).', 'err');
    e.target.value = '';
    return;
  }
  const btn = document.getElementById('upplatelseUploadBtn');
  btn.disabled = true;
  setUpplatelseStatus('Läser dokumentet…');
  try{
    const pdfBase64 = await fileToBase64(file);
    const sb = window.DB && window.DB.hasSupabase ? window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY) : null;
    if(!sb) throw new Error('Kräver att Supabase är påkopplat (fungerar inte i lokalt testläge)');
    const { data, error } = await sb.functions.invoke('extract-upplatelse', { body: { pdfBase64, filename: file.name } });
    if(error) throw error;
    if(!data || !data.datum) throw new Error('Kunde inte hitta ett datum i dokumentet.');
    apt.upplatelse = { date: data.datum, by: myName || '', at: new Date().toISOString(), typ: data.dokumenttyp || '' };
    const newDate = effectiveInflyttningDate(apt);
    apt.inflyttning.date = newDate;
    apt.inflyttning.by = myName || '';
    apt.inflyttning.at = new Date().toISOString();
    setUpplatelseStatus('Datum inläst: ' + data.datum, 'ok');
    updateUpplatelseInfoDisplay(apt);
    renderTable();
    renderInflyttningsinfo();
    await persistApartments();
  }catch(err){
    setUpplatelseStatus('Kunde inte läsa dokumentet: ' + (err.message || err), 'err');
  }finally{
    btn.disabled = false;
    e.target.value = '';
  }
});

function todayStr(){ return new Date().toISOString().slice(0,10); }
function isMovedIn(apt){ return !!(apt.inflyttning && apt.inflyttning.date && apt.inflyttning.date <= todayStr()); }

function makeDateCell(apt, field){
  const td = document.createElement('td');
  td.className = 'center';
  const input = document.createElement('input');
  input.type = 'date';
  input.className = 'date-input' + (apt[field].date ? ' filled' : '');
  input.value = apt[field].date || '';
  input.onchange = async () => {
    if(!myName){ showToast('Ange ditt namn först'); input.value = apt[field].date || ''; return; }
    apt[field].date = input.value;
    apt[field].by = input.value ? myName : '';
    apt[field].at = input.value ? new Date().toISOString() : '';
    renderTable();
    await persistApartments();
  };
  td.appendChild(input);
  if(apt[field].date && apt[field].by){
    const stamp = document.createElement('span');
    stamp.className = 'stamp-mark';
    stamp.textContent = apt[field].by;
    td.appendChild(stamp);
  }
  return td;
}

async function removeApartment(id){
  apartments = apartments.filter(a => a.id !== id);
  renderTable();
  await persistApartments();
}

// ---------- Add apartment row (form appended below table via prompt-free inline row) ----------
function ensureAddRow(){
  // Adds a persistent input row at bottom of table body for quick entry
}


// (Projekt-nivans Ekonomi-flik, SIE-import/budgetjamforelse mot budget, borttagen.)
// ---------- Intresseanmälningar ----------
const INTR_STORAGE_KEY = 'intresseanmalningar-v1';
const STATUS_KEYS = ['Ny','Kontaktad','Ingen kontakt','Visning bokad','Visning genomförd','Tackat ja','Tackat nej'];
const STATUS_CLASS = {
  'Ny': 'st-ny', 'Kontaktad': 'st-kontaktad', 'Ingen kontakt': 'st-ingenkontakt',
  'Visning bokad': 'st-visningbokad', 'Visning genomförd': 'st-visninggenomford',
  'Tackat ja': 'st-tackatja', 'Tackat nej': 'st-tackatnej'
};
const VISNINGSANSVARIGA = ['Mikael','Rebecka','Saman','David'];
const KONTAKTMETODER = ['E-post','SMS','Samtal'];

let interests = [];
let intrPersistTimer = null;
let intrEditingId = null;
let intrNewFormLockedProject = null;
let intrReasonEntryId = null;
let intrViewingEntryId = null;
let intrContactEntryId = null;
let intrDeleteTargetId = null;

function emptyIntrForm(){
  return {
    namn:'', epost:'', telefon:'', projekt:'', objekt:'',
    datum: new Date().toISOString().slice(0,10), status:'Ny', anteckningar:'',
    avslagsanledning:'', visningsdatum:'', visningstid:'', visningsansvarig:'',
    kontakthistorik:[], hanterad:false
  };
}

function daysSince(dateStr){
  if(!dateStr) return null;
  const then = new Date(dateStr + 'T00:00:00');
  const now = new Date();
  now.setHours(0,0,0,0);
  return Math.floor((now - then) / (1000*60*60*24));
}
function latestKontaktDatum(entry){
  const hist = entry.kontakthistorik || [];
  if(hist.length === 0) return null;
  return hist.map(h => h.datum).sort().slice(-1)[0];
}
function normPhone(v){ return (v||'').replace(/[^\d]/g,''); }
function normEmail(v){ return (v||'').trim().toLowerCase(); }

function findIntrDuplicate(form, editingId){
  const email = normEmail(form.epost);
  const phone = normPhone(form.telefon);
  const name = (form.namn||'').trim().toLowerCase();
  return interests.find(en => {
    if(en.id === editingId) return false;
    if(en.projekt !== form.projekt) return false;
    if(!name || (en.namn||'').trim().toLowerCase() !== name) return false;
    const enEmail = normEmail(en.epost);
    const enPhone = normPhone(en.telefon);
    const emailMatches = email && enEmail && email === enEmail;
    const phoneMatches = phone && enPhone && phone === enPhone;
    return emailMatches || phoneMatches;
  });
}

function parseIntrEmailText(text){
  const result = {};
  const lines = text.split(/\r?\n/);
  for(const line of lines){
    const m = line.match(/^\s*([^:]+):\s*(.+)$/);
    if(!m) continue;
    const key = m[1].trim().toLowerCase();
    let val = m[2].trim();
    const mailto = val.match(/\[([^\]]+)\]\(mailto:[^)]+\)/);
    if(mailto) val = mailto[1];
    val = val.replace(/[<>]/g,'').trim();
    if(/^namn$/.test(key)) result.namn = val;
    else if(/^(e-?post|mejl|email)$/.test(key)) result.epost = val;
    else if(/^(telefon|mobil|tel)$/.test(key)) result.telefon = val;
    else if(/^projekt$/.test(key)) result.projekt = val;
    else if(/^(objekt|lägenhet|lgh|bostad)$/.test(key)) result.objekt = val;
    else if(/^(meddelande|kommentar|anteckning(ar)?)$/.test(key)) result.anteckningar = val;
  }
  return result;
}

async function loadInterests(){
  try{
    const res = await window.storage.get(INTR_STORAGE_KEY, true);
    interests = (res && res.value) ? JSON.parse(res.value) : [];
  }catch(e){
    interests = [];
  }
}

function persistInterests(){
  return new Promise(resolve => {
    if(intrPersistTimer) clearTimeout(intrPersistTimer);
    intrPersistTimer = setTimeout(async () => {
      intrPersistTimer = null;
      await persistInterestsNow();
      resolve();
    }, 900);
  });
}

async function persistInterestsNow(){
  try{
    await withRetry(() => window.storage.set(INTR_STORAGE_KEY, JSON.stringify(interests), true));
    clearDebugError();
  }catch(e){
    showDebugError('Kunde inte spara intresseanmälningar', e, () => persistInterestsNow());
    showToast('Kunde inte spara – klicka "Försök spara igen" nedan');
  }
}

function renderAllIntrViews(){
  if(screen === 'intressen') renderIntressenScreen();
  if(screen === 'project' && projectSubView === 'intressenter') renderIntressenterTab();
}

const STRUKEN_STATUSES = ['Tackat ja', 'Tackat nej', 'Ingen kontakt'];
function isStruken(entry){ return STRUKEN_STATUSES.includes(entry.status); }

function computeIntrFiltered(lockedProject, search, projektFilter, statusFilter, showHandled, showStruken){
  return interests
    .filter(e => lockedProject ? e.projekt === lockedProject : (projektFilter ? e.projekt === projektFilter : true))
    .filter(e => statusFilter ? e.status === statusFilter : true)
    .filter(e => showHandled ? true : !e.hanterad)
    .filter(e => showStruken ? true : !isStruken(e))
    .filter(e => {
      if(!search.trim()) return true;
      const q = search.toLowerCase();
      return (e.namn||'').toLowerCase().includes(q) || (e.epost||'').toLowerCase().includes(q) ||
        (e.telefon||'').toLowerCase().includes(q) || (e.objekt||'').toLowerCase().includes(q);
    })
    .sort((a,b) => (a.datum < b.datum ? 1 : -1));
}

function renderIntrRow(entry){
  const stClass = STATUS_CLASS[entry.status] || STATUS_CLASS['Ny'];
  const lastKontakt = latestKontaktDatum(entry);
  const overdue = entry.status === 'Kontaktad' && lastKontakt && daysSince(lastKontakt) >= 3;

  const row = document.createElement('div');
  row.className = 'intr-row' + (isStruken(entry) ? ' handled' : '') + (overdue ? ' overdue' : '');

  const cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.checked = !!entry.hanterad;
  cb.title = 'Markera som hanterad';
  cb.onclick = async () => {
    entry.hanterad = !entry.hanterad;
    renderAllIntrViews();
    await persistInterests();
  };
  row.appendChild(cb);

  const main = document.createElement('div');
  main.className = 'intr-row-main';

  const top = document.createElement('div');
  top.className = 'intr-row-top';
  const nameSpan = document.createElement('span');
  nameSpan.className = 'intr-name' + (isStruken(entry) ? ' handled' : '');
  nameSpan.textContent = entry.namn;
  top.appendChild(nameSpan);

  const badge = document.createElement('span');
  badge.className = 'intr-badge ' + stClass;
  badge.textContent = entry.status;
  top.appendChild(badge);

  if(overdue){
    const ov = document.createElement('button');
    ov.className = 'intr-overdue-badge';
    ov.textContent = 'Dags att kontakta igen →';
    ov.onclick = () => openIntrContactModal(entry);
    top.appendChild(ov);
  }

  const dateSpan = document.createElement('span');
  dateSpan.className = 'intr-date';
  dateSpan.textContent = (entry.projekt ? entry.projekt + ' · ' : '') + (entry.datum || '');
  top.appendChild(dateSpan);
  main.appendChild(top);

  const metaParts = [entry.epost, entry.telefon, entry.objekt].filter(Boolean);
  if(metaParts.length){
    const meta = document.createElement('div');
    meta.className = 'intr-meta';
    meta.textContent = metaParts.join(' · ');
    main.appendChild(meta);
  }

  if(entry.anteckningar){
    const note = document.createElement('div');
    note.className = 'intr-note';
    note.textContent = entry.anteckningar;
    main.appendChild(note);
  }
  if(entry.status === 'Tackat nej' && entry.avslagsanledning){
    const note = document.createElement('div');
    note.className = 'intr-note';
    note.textContent = 'Anledning: ' + entry.avslagsanledning;
    main.appendChild(note);
  }
  if(entry.status === 'Visning bokad' && entry.visningsdatum){
    const note = document.createElement('div');
    note.className = 'intr-note';
    note.textContent = 'Visning: ' + entry.visningsdatum + ' ' + (entry.visningstid||'') + ' · ' + (entry.visningsansvarig||'');
    main.appendChild(note);
  }
  if(entry.kontakthistorik && entry.kontakthistorik.length){
    const hist = document.createElement('div');
    hist.className = 'intr-kontakthistorik';
    entry.kontakthistorik.slice(-2).reverse().forEach(h => {
      const d = document.createElement('div');
      d.textContent = h.datum + ' · ' + (h.metoder||[]).join('/') + (h.kommentar ? ' – ' + h.kommentar : '');
      hist.appendChild(d);
    });
    main.appendChild(hist);
  }

  const actions = document.createElement('div');
  actions.className = 'intr-row-actions';
  const statusLabel = document.createElement('span');
  statusLabel.style.cssText = 'font-size:11px; color:var(--ink-soft); align-self:center;';
  statusLabel.textContent = 'Status:';
  actions.appendChild(statusLabel);

  const statusSelect = document.createElement('select');
  statusSelect.className = 'intr-status-select';
  STATUS_KEYS.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s; opt.textContent = s;
    if(s === entry.status) opt.selected = true;
    statusSelect.appendChild(opt);
  });
  statusSelect.onchange = () => setIntrStatus(entry, statusSelect.value);
  actions.appendChild(statusSelect);

  const editBtn = document.createElement('button');
  editBtn.className = 'intr-icon-btn';
  editBtn.textContent = '✎ Redigera';
  editBtn.onclick = () => openIntrForm(entry);
  actions.appendChild(editBtn);

  const delBtn = document.createElement('button');
  delBtn.className = 'intr-icon-btn';
  delBtn.textContent = '✕ Ta bort';
  delBtn.onclick = () => openIntrDeleteModal(entry.id);
  actions.appendChild(delBtn);

  main.appendChild(actions);
  row.appendChild(main);
  return row;
}

function renderIntrListInto(containerId, lockedProject, search, statusFilter, showHandled, showStruken){
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  const filtered = computeIntrFiltered(lockedProject, search, '', statusFilter, showHandled, showStruken);
  if(filtered.length === 0){
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.style.display = 'block';
    empty.textContent = interests.length === 0
      ? 'Inga anmälningar ännu. Lägg till den första när du får ett mejl.'
      : 'Inga anmälningar matchar filtren.';
    container.appendChild(empty);
    return;
  }
  filtered.forEach(entry => container.appendChild(renderIntrRow(entry)));
}

function refreshIntrProjectFilterOptions(){
  const sel = document.getElementById('intrProjektFilter');
  const current = sel.value;
  sel.innerHTML = '<option value="">Alla projekt</option>' +
    projects.map(p => '<option value="' + escapeHtml(p.name) + '">' + escapeHtml(p.name) + '</option>').join('');
  sel.value = current;
}

function refreshIntrFormProjectOptions(preset){
  const sel = document.getElementById('intrFormProjekt');
  sel.innerHTML = '<option value="">Välj projekt…</option>' +
    projects.map(p => '<option value="' + escapeHtml(p.name) + '">' + escapeHtml(p.name) + '</option>').join('') +
    '<option value="Övrigt">Övrigt</option>';
  if(preset) sel.value = preset;
}

function renderIntressenScreen(){
  refreshIntrProjectFilterOptions();
  const search = document.getElementById('intrSearch').value;
  const projektFilter = document.getElementById('intrProjektFilter').value;
  const statusFilter = document.getElementById('intrStatusFilter').value;
  const showHandled = document.getElementById('intrShowHandled').checked;
  const showStruken = document.getElementById('intrShowStruken').checked;
  document.getElementById('intrList').innerHTML = '';
  const container = document.getElementById('intrList');
  const filtered = computeIntrFiltered(null, search, projektFilter, statusFilter, showHandled, showStruken);
  if(filtered.length === 0){
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.style.display = 'block';
    empty.textContent = interests.length === 0
      ? 'Inga anmälningar ännu. Lägg till den första när du får ett mejl.'
      : 'Inga anmälningar matchar filtren.';
    container.appendChild(empty);
    return;
  }
  filtered.forEach(entry => container.appendChild(renderIntrRow(entry)));
}

function renderIntressenterTab(){
  const proj = projects.find(p => p.id === activeProjectId);
  const lockedProject = proj ? proj.name : null;
  const search = document.getElementById('intrSearchP').value;
  const statusFilter = document.getElementById('intrStatusFilterP').value;
  const showHandled = document.getElementById('intrShowHandledP').checked;
  const showStruken = document.getElementById('intrShowStrukenP').checked;
  renderIntrListInto('intrListP', lockedProject, search, statusFilter, showHandled, showStruken);
}

function openIntressenScreen(){
  showScreen('intressen');
  loadInterests().then(renderIntressenScreen);
}

// ---------- Status-ändringar ----------
function setIntrStatus(entry, status){
  if(status === 'Tackat nej'){ openIntrReasonModal(entry); return; }
  if(status === 'Kontaktad'){ openIntrContactModal(entry); return; }
  if(status === 'Visning bokad'){ openIntrViewingModal(entry); return; }
  applyIntrStatus(entry, status, {});
}
async function applyIntrStatus(entry, status, extra){
  Object.assign(entry, extra);
  entry.status = status;
  entry.hanterad = status !== 'Ny';
  renderAllIntrViews();
  await persistInterests();
}

function openIntrReasonModal(entry){
  intrReasonEntryId = entry.id;
  document.getElementById('intrReasonInput').value = entry.avslagsanledning || '';
  document.getElementById('intrReasonError').style.display = 'none';
  document.getElementById('intrReasonModalOverlay').classList.add('open');
}
function closeIntrReasonModal(){
  document.getElementById('intrReasonModalOverlay').classList.remove('open');
  intrReasonEntryId = null;
  renderAllIntrViews();
}
document.getElementById('intrReasonCancelBtn').onclick = closeIntrReasonModal;
document.getElementById('intrReasonModalOverlay').addEventListener('click', e => { if(e.target.id === 'intrReasonModalOverlay') closeIntrReasonModal(); });
document.getElementById('intrReasonSaveBtn').onclick = async () => {
  const val = document.getElementById('intrReasonInput').value.trim();
  if(!val){ document.getElementById('intrReasonError').textContent = 'En anledning måste anges.'; document.getElementById('intrReasonError').style.display = 'block'; return; }
  const entry = interests.find(e => e.id === intrReasonEntryId);
  if(entry) await applyIntrStatus(entry, 'Tackat nej', { avslagsanledning: val });
  document.getElementById('intrReasonModalOverlay').classList.remove('open');
  intrReasonEntryId = null;
};

function openIntrViewingModal(entry){
  intrViewingEntryId = entry.id;
  document.getElementById('intrViewingDatum').value = entry.visningsdatum || '';
  document.getElementById('intrViewingTid').value = entry.visningstid || '';
  const sel = document.getElementById('intrViewingAnsvarig');
  sel.innerHTML = '<option value="">Välj…</option>' + VISNINGSANSVARIGA.map(v => '<option value="' + v + '">' + v + '</option>').join('');
  sel.value = entry.visningsansvarig || '';
  document.getElementById('intrViewingError').style.display = 'none';
  document.getElementById('intrViewingModalOverlay').classList.add('open');
}
function closeIntrViewingModal(){
  document.getElementById('intrViewingModalOverlay').classList.remove('open');
  intrViewingEntryId = null;
  renderAllIntrViews();
}
document.getElementById('intrViewingCancelBtn').onclick = closeIntrViewingModal;
document.getElementById('intrViewingModalOverlay').addEventListener('click', e => { if(e.target.id === 'intrViewingModalOverlay') closeIntrViewingModal(); });
document.getElementById('intrViewingSaveBtn').onclick = async () => {
  const datum = document.getElementById('intrViewingDatum').value;
  const tid = document.getElementById('intrViewingTid').value.trim();
  const ansvarig = document.getElementById('intrViewingAnsvarig').value;
  if(!datum || !tid || !ansvarig){
    document.getElementById('intrViewingError').textContent = 'Ange datum, tid och vem som möter upp kunden.';
    document.getElementById('intrViewingError').style.display = 'block';
    return;
  }
  const entry = interests.find(e => e.id === intrViewingEntryId);
  if(entry) await applyIntrStatus(entry, 'Visning bokad', { visningsdatum: datum, visningstid: tid, visningsansvarig: ansvarig });
  document.getElementById('intrViewingModalOverlay').classList.remove('open');
  intrViewingEntryId = null;
};

function openIntrContactModal(entry){
  intrContactEntryId = entry.id;
  const wrap = document.getElementById('intrContactMetoder');
  wrap.innerHTML = KONTAKTMETODER.map(m => '<label><input type="checkbox" value="' + m + '"> ' + m + '</label>').join('');
  document.getElementById('intrContactDatum').value = new Date().toISOString().slice(0,10);
  document.getElementById('intrContactKommentar').value = '';
  document.getElementById('intrContactError').style.display = 'none';
  document.getElementById('intrContactModalOverlay').classList.add('open');
}
function closeIntrContactModal(){
  document.getElementById('intrContactModalOverlay').classList.remove('open');
  intrContactEntryId = null;
  renderAllIntrViews();
}
document.getElementById('intrContactCancelBtn').onclick = closeIntrContactModal;
document.getElementById('intrContactModalOverlay').addEventListener('click', e => { if(e.target.id === 'intrContactModalOverlay') closeIntrContactModal(); });
document.getElementById('intrContactSaveBtn').onclick = async () => {
  const metoder = Array.from(document.querySelectorAll('#intrContactMetoder input:checked')).map(cb => cb.value);
  const datum = document.getElementById('intrContactDatum').value;
  const kommentar = document.getElementById('intrContactKommentar').value.trim();
  if(!metoder.length || !datum){
    document.getElementById('intrContactError').textContent = 'Välj minst en kontaktmetod och ange datum.';
    document.getElementById('intrContactError').style.display = 'block';
    return;
  }
  const entry = interests.find(e => e.id === intrContactEntryId);
  if(entry){
    const historik = [...(entry.kontakthistorik || []), { datum, metoder, kommentar }];
    await applyIntrStatus(entry, 'Kontaktad', { kontakthistorik: historik });
  }
  document.getElementById('intrContactModalOverlay').classList.remove('open');
  intrContactEntryId = null;
};

// ---------- Nytt/redigera formulär ----------
function openIntrForm(entry, presetProjekt){
  intrEditingId = entry ? entry.id : null;
  const form = entry ? entry : emptyIntrForm();
  document.getElementById('intrFormTitle').textContent = entry ? 'Redigera anmälan' : 'Ny anmälan';
  document.getElementById('intrFormError').style.display = 'none';
  document.getElementById('intrPasteText').value = '';
  document.getElementById('intrFormNamn').value = form.namn || '';
  refreshIntrFormProjectOptions(entry ? form.projekt : (presetProjekt || ''));
  document.getElementById('intrFormEpost').value = form.epost || '';
  document.getElementById('intrFormTelefon').value = form.telefon || '';
  document.getElementById('intrFormObjekt').value = form.objekt || '';
  document.getElementById('intrFormDatum').value = form.datum || new Date().toISOString().slice(0,10);
  document.getElementById('intrFormAnteckningar').value = form.anteckningar || '';
  document.getElementById('intrFormModalOverlay').classList.add('open');
  setTimeout(() => document.getElementById('intrFormNamn').focus(), 0);
}
function closeIntrForm(){
  document.getElementById('intrFormModalOverlay').classList.remove('open');
  intrEditingId = null;
}
document.getElementById('intrFormCancelBtn').onclick = closeIntrForm;
document.getElementById('intrFormModalOverlay').addEventListener('click', e => { if(e.target.id === 'intrFormModalOverlay') closeIntrForm(); });
document.getElementById('intrParseBtn').onclick = () => {
  const parsed = parseIntrEmailText(document.getElementById('intrPasteText').value);
  if(parsed.namn) document.getElementById('intrFormNamn').value = parsed.namn;
  if(parsed.epost) document.getElementById('intrFormEpost').value = parsed.epost;
  if(parsed.telefon) document.getElementById('intrFormTelefon').value = parsed.telefon;
  if(parsed.projekt) document.getElementById('intrFormProjekt').value = parsed.projekt;
  if(parsed.objekt) document.getElementById('intrFormObjekt').value = parsed.objekt;
  if(parsed.anteckningar) document.getElementById('intrFormAnteckningar').value = parsed.anteckningar;
};
document.getElementById('intrFormSaveBtn').onclick = async () => {
  const namn = document.getElementById('intrFormNamn').value.trim();
  const projekt = document.getElementById('intrFormProjekt').value;
  const errEl = document.getElementById('intrFormError');
  if(!namn || !projekt){
    errEl.textContent = 'Namn och projekt måste fyllas i.';
    errEl.style.display = 'block';
    return;
  }
  const formData = {
    namn, projekt,
    epost: document.getElementById('intrFormEpost').value.trim(),
    telefon: document.getElementById('intrFormTelefon').value.trim(),
    objekt: document.getElementById('intrFormObjekt').value.trim(),
    datum: document.getElementById('intrFormDatum').value || new Date().toISOString().slice(0,10),
    anteckningar: document.getElementById('intrFormAnteckningar').value.trim()
  };
  const dup = findIntrDuplicate(formData, intrEditingId);
  if(dup){
    errEl.textContent = dup.namn + ' är redan registrerad för ' + dup.projekt + (dup.objekt ? ' (' + dup.objekt + ')' : '') + ' — status: ' + dup.status + '. Redigera den befintliga posten istället.';
    errEl.style.display = 'block';
    return;
  }
  errEl.style.display = 'none';
  if(intrEditingId){
    const entry = interests.find(e => e.id === intrEditingId);
    Object.assign(entry, formData);
  } else {
    interests = [{ ...emptyIntrForm(), ...formData, id: uid() }, ...interests];
  }
  closeIntrForm();
  renderAllIntrViews();
  await persistInterests();
};

// ---------- Ta bort ----------
function openIntrDeleteModal(id){
  intrDeleteTargetId = id;
  document.getElementById('intrDeleteModalOverlay').classList.add('open');
}
document.getElementById('intrDeleteCancelBtn').onclick = () => {
  document.getElementById('intrDeleteModalOverlay').classList.remove('open');
  intrDeleteTargetId = null;
};
document.getElementById('intrDeleteModalOverlay').addEventListener('click', e => {
  if(e.target.id === 'intrDeleteModalOverlay'){ document.getElementById('intrDeleteModalOverlay').classList.remove('open'); intrDeleteTargetId = null; }
});
document.getElementById('intrDeleteConfirmBtn').onclick = async () => {
  interests = interests.filter(e => e.id !== intrDeleteTargetId);
  document.getElementById('intrDeleteModalOverlay').classList.remove('open');
  intrDeleteTargetId = null;
  renderAllIntrViews();
  await persistInterests();
};

// ---------- Backup / Återställ ----------
document.getElementById('intrBackupBtn').onclick = () => {
  document.getElementById('intrBackupText').value = JSON.stringify(interests, null, 2);
  document.getElementById('intrBackupModalOverlay').classList.add('open');
};
document.getElementById('intrBackupCloseBtn').onclick = () => {
  document.getElementById('intrBackupModalOverlay').classList.remove('open');
};
document.getElementById('intrRestoreBtn').onclick = () => {
  document.getElementById('intrRestoreText').value = '';
  document.getElementById('intrRestoreError').style.display = 'none';
  document.getElementById('intrRestoreModalOverlay').classList.add('open');
};
document.getElementById('intrRestoreCancelBtn').onclick = () => {
  document.getElementById('intrRestoreModalOverlay').classList.remove('open');
};
document.getElementById('intrRestoreConfirmBtn').onclick = async () => {
  const errEl = document.getElementById('intrRestoreError');
  let parsed;
  try{
    parsed = JSON.parse(document.getElementById('intrRestoreText').value);
  }catch(e){
    errEl.textContent = 'Kunde inte tolka texten som giltig backup-data (ogiltig JSON).';
    errEl.style.display = 'block';
    return;
  }
  if(!Array.isArray(parsed)){
    errEl.textContent = 'Texten innehåller inte en lista med anmälningar.';
    errEl.style.display = 'block';
    return;
  }
  interests = parsed;
  document.getElementById('intrRestoreModalOverlay').classList.remove('open');
  renderAllIntrViews();
  await persistInterestsNow();
};

// ---------- Kopplingar: navigering, verktygsfält ----------
document.getElementById('backToHomeFromIntressenBtn').onclick = openHome;
document.getElementById('intrNewBtn').onclick = () => openIntrForm(null, '');
document.getElementById('intrManualSyncBtn').onclick = () => loadInterests().then(renderIntressenScreen);
document.getElementById('intrManualSyncBtnP').onclick = () => loadInterests().then(renderIntressenterTab);
document.getElementById('intrNewBtnP').onclick = () => {
  const proj = projects.find(p => p.id === activeProjectId);
  openIntrForm(null, proj ? proj.name : '');
};

['intrSearch','intrProjektFilter','intrStatusFilter','intrShowHandled','intrShowStruken'].forEach(id => {
  document.getElementById(id).addEventListener('input', renderIntressenScreen);
  document.getElementById(id).addEventListener('change', renderIntressenScreen);
});
['intrSearchP','intrStatusFilterP','intrShowHandledP','intrShowStrukenP'].forEach(id => {
  document.getElementById(id).addEventListener('input', renderIntressenterTab);
  document.getElementById(id).addEventListener('change', renderIntressenterTab);
});

(function initIntrStatusFilters(){
  const optsHtml = '<option value="">Alla statusar</option>' + STATUS_KEYS.map(s => '<option value="' + s + '">' + s + '</option>').join('');
  document.getElementById('intrStatusFilter').innerHTML = optsHtml;
  document.getElementById('intrStatusFilterP').innerHTML = optsHtml;
})();

// ---------- Material (rumsbeskrivning) ----------
function materialKey(projectId){ return 'material:' + projectId; }
function emptyMaterial(){ return { rooms: [] }; }
function emptyMaterialProduct(){
  return { id: uid(), name:'', supplier:'', priceExVat:'', priceIncVat:'', warranty:'', appliesTo: [], unitAmount:'', unitKind:'st', ordered:false, deliveries:{} };
}

// Räknar fram totalmängden att beställa: mängd per lägenhet x antal lägenheter av
// rummets lägenhetstyp (varje rum hör till EN lägenhetstyp, satt via bofaktablad-
// uppladdningen eller vald i rullistan när rummet skapades).
function materialOrderQuantity(room, product){
  const count = materialMatchingApartments(room).length;
  const raw = parseFloat((product.unitAmount || '').toString().replace(',', '.'));
  const perUnit = isNaN(raw) || raw <= 0 ? 1 : raw;
  const total = perUnit * count;
  const totalStr = Number.isInteger(total) ? String(total) : total.toFixed(2).replace(/0+$/,'').replace(/\.$/,'').replace('.', ',');
  return { count, perUnit, total, totalStr, unit: product.unitKind || 'st' };
}

let materialData = emptyMaterial();

async function loadMaterial(projectId){
  if(!projectId) return;
  try{
    const res = await window.storage.get(materialKey(projectId), true);
    materialData = (res && res.value) ? JSON.parse(res.value) : emptyMaterial();
  }catch(e){
    materialData = emptyMaterial();
  }
  if(!Array.isArray(materialData.rooms)) materialData.rooms = [];
  materialData.rooms.forEach(room => {
    if(!Array.isArray(room.products)) room.products = [];
    if(typeof room.floor !== 'string') room.floor = '';
    if(typeof room.areaSqm !== 'string') room.areaSqm = '';
    if(typeof room.unitType !== 'string') room.unitType = '';
    room.products.forEach(p => {
      if(!Array.isArray(p.appliesTo)) p.appliesTo = [];
      if(!p.deliveries || typeof p.deliveries !== 'object') p.deliveries = {};
      if(typeof p.unitAmount !== 'string') p.unitAmount = '';
      if(p.unitKind !== 'kvm' && p.unitKind !== 'st') p.unitKind = 'st';
    });
  });
  renderMaterial();
}

async function persistMaterial(){
  try{
    await withRetry(() => window.storage.set(materialKey(activeProjectId), JSON.stringify(materialData), true));
    clearDebugError();
  }catch(e){
    showDebugError('Kunde inte spara material', e, () => persistMaterial());
    showToast('Kunde inte spara – klicka "Försök spara igen" nedan');
  }
}

function materialSqmTypes(){
  const set = new Set(apartments.map(a => (a.totalyta||'').toString().trim()).filter(Boolean));
  return Array.from(set).sort((a,b) => parseFloat(a) - parseFloat(b));
}

function materialMatchingApartments(room){
  if(!room.unitType) return [];
  return apartments.filter(a => (a.totalyta||'').toString().trim() === room.unitType);
}

function formatWarranty(v){
  const digits = (v || '').toString().replace(/[^0-9]/g, '');
  return digits ? digits + ' år' : '—';
}

function formatMaterialPrice(v){
  const n = parseFloat(v);
  return isNaN(n) ? (v || '—') : formatNumberSv(String(Math.round(n)));
}

function refreshMaterialUnitTypeOptions(){
  const sel = document.getElementById('materialUnitTypeFilter');
  const current = sel.value;
  const sqmTypes = materialSqmTypes();
  sel.innerHTML = '<option value="">Välj lägenhetstyp (kvm)…</option>' +
    sqmTypes.map(sqm => '<option value="' + escapeHtml(sqm) + '">' + escapeHtml(sqm) + ' kvm</option>').join('');
  if(sqmTypes.includes(current)) sel.value = current;
}

function currentMaterialUnitType(){
  return document.getElementById('materialUnitTypeFilter').value;
}

function renderMaterial(){
  refreshMaterialUnitTypeOptions();
  const unitType = currentMaterialUnitType();
  const container = document.getElementById('materialRooms');
  const empty = document.getElementById('materialEmptyState');
  const noType = document.getElementById('materialNoTypeState');
  container.innerHTML = '';

  if(!unitType){
    noType.style.display = 'block';
    empty.style.display = 'none';
    return;
  }
  noType.style.display = 'none';

  const roomsForType = materialData.rooms.filter(r => r.unitType === unitType);
  if(roomsForType.length === 0){
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';
  roomsForType.forEach(room => container.appendChild(renderMaterialRoom(room)));
}

document.getElementById('materialUnitTypeFilter').addEventListener('change', renderMaterial);

function renderMaterialRoom(room){
  const wrap = document.createElement('div');
  wrap.className = 'material-room';

  const sameTypeRooms = materialData.rooms.filter(r => r.unitType === room.unitType);
  const idx = sameTypeRooms.findIndex(r => r.id === room.id);

  const header = document.createElement('div');
  header.className = 'material-room-header';
  const h3 = document.createElement('h3');
  h3.textContent = room.name;
  header.appendChild(h3);

  const upBtn = document.createElement('button');
  upBtn.className = 'material-move-btn';
  upBtn.textContent = '▲';
  upBtn.title = 'Flytta upp';
  upBtn.disabled = idx === 0;
  upBtn.onclick = () => moveMaterialRoom(room, -1);
  header.appendChild(upBtn);

  const downBtn = document.createElement('button');
  downBtn.className = 'material-move-btn';
  downBtn.textContent = '▼';
  downBtn.title = 'Flytta ner';
  downBtn.disabled = idx === sameTypeRooms.length - 1;
  downBtn.onclick = () => moveMaterialRoom(room, 1);
  header.appendChild(downBtn);

  const rmBtn = document.createElement('button');
  rmBtn.textContent = '✕';
  rmBtn.title = 'Ta bort rum';
  rmBtn.onclick = async () => {
    materialData.rooms = materialData.rooms.filter(r => r.id !== room.id);
    renderMaterial();
    await persistMaterial();
  };
  header.appendChild(rmBtn);
  wrap.appendChild(header);

  if(room.floor || room.areaSqm || room.unitType){
    const sub = document.createElement('div');
    sub.className = 'material-room-sub';
    sub.textContent = [
      room.unitType ? room.unitType + ' kvm' : '',
      room.floor,
      room.areaSqm ? room.areaSqm + ' m²' : ''
    ].filter(Boolean).join(' · ');
    wrap.appendChild(sub);
  }

  if(room.products.length > 0){
    const scroll = document.createElement('div');
    scroll.className = 'table-scroll';
    const table = document.createElement('table');
    const thead = document.createElement('thead');
    thead.innerHTML =
      '<tr>' +
        '<th>Produkt</th><th>Leverantör</th><th class="center">Pris exkl</th><th class="center">Pris inkl</th>' +
        '<th>Garanti</th><th class="center">Antal</th><th class="center">Beställd</th><th></th><th></th>' +
      '</tr>';
    table.appendChild(thead);
    const tbody = document.createElement('tbody');
    room.products.forEach(product => tbody.appendChild(renderMaterialProductRow(room, product)));
    table.appendChild(tbody);
    scroll.appendChild(table);
    wrap.appendChild(scroll);
  }

  const addBtn = document.createElement('button');
  addBtn.className = 'material-add-product-btn';
  addBtn.textContent = '+ Lägg till produkt';
  addBtn.onclick = () => openMaterialProductModal(room, null);
  wrap.appendChild(addBtn);

  return wrap;
}

function makeMaterialOrderedCell(product){
  const td = document.createElement('td');
  td.className = 'center';
  const box = document.createElement('div');
  box.className = 'check' + (product.ordered ? ' checked' : '');
  box.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
  box.title = product.ordered ? 'Beställd' : 'Ej beställd';
  box.onclick = async () => {
    product.ordered = !product.ordered;
    renderMaterial();
    await persistMaterial();
  };
  td.appendChild(box);
  return td;
}

function renderMaterialProductRow(room, product){
  const tr = document.createElement('tr');

  const nameTd = makeCell(product.name, '');
  nameTd.style.cursor = 'pointer';
  nameTd.className = 'material-editable-cell';
  nameTd.title = 'Klicka för att redigera';
  nameTd.onclick = () => openMaterialProductModal(room, product);
  tr.appendChild(nameTd);

  tr.appendChild(makeCell(product.supplier, ''));
  tr.appendChild(makeCell(formatMaterialPrice(product.priceExVat), 'center'));
  tr.appendChild(makeCell(formatMaterialPrice(product.priceIncVat), 'center'));
  tr.appendChild(makeCell(formatWarranty(product.warranty), ''));

  const qty = materialOrderQuantity(room, product);
  const countTd = document.createElement('td');
  countTd.className = 'center';
  countTd.textContent = qty.totalStr + ' ' + qty.unit;
  countTd.title = qty.perUnit + ' ' + qty.unit + ' × ' + qty.count + ' lägenheter';
  tr.appendChild(countTd);

  tr.appendChild(makeMaterialOrderedCell(product));

  const deliveryTd = document.createElement('td');
  const deliveryBtn = document.createElement('button');
  deliveryBtn.className = 'material-delivery-btn';
  deliveryBtn.textContent = 'Leveranser';
  deliveryBtn.onclick = () => openMaterialDeliveryModal(room, product);
  deliveryTd.appendChild(deliveryBtn);
  tr.appendChild(deliveryTd);

  const actionsTd = document.createElement('td');
  actionsTd.className = 'row-actions';
  const rmBtn = document.createElement('button');
  rmBtn.className = 'remove-btn';
  rmBtn.textContent = '✕';
  rmBtn.title = 'Ta bort produkt';
  rmBtn.onclick = async () => {
    room.products = room.products.filter(p => p.id !== product.id);
    renderMaterial();
    await persistMaterial();
  };
  actionsTd.appendChild(rmBtn);
  tr.appendChild(actionsTd);

  return tr;
}

// ---------- Rum / Beställningslista ----------
let materialView = 'rum';

document.querySelectorAll('.material-view-tab').forEach(btn => {
  btn.onclick = () => {
    materialView = btn.dataset.materialView;
    document.querySelectorAll('.material-view-tab').forEach(b => b.classList.toggle('active', b === btn));
    document.getElementById('materialRoomsView').style.display = materialView === 'rum' ? 'block' : 'none';
    document.getElementById('materialOrderView').style.display = materialView === 'bestallningslista' ? 'block' : 'none';
    document.getElementById('materialDeliveryScheduleView').style.display = materialView === 'leveransschema' ? 'block' : 'none';
    if(materialView === 'bestallningslista') renderMaterialOrderList();
    if(materialView === 'leveransschema') renderMaterialDeliverySchedule();
  };
});

// ---------- Leveransschema (kalenderliknande vy, samma grid-stil som Tidsplan) ----------
function isoWeekInfo(dateStr){
  const d = new Date(dateStr + 'T00:00:00');
  const target = new Date(d.valueOf());
  const dayNr = (d.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if(target.getDay() !== 4){
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }
  const week = 1 + Math.round((firstThursday - target.valueOf()) / (7 * 24 * 3600 * 1000));
  return { year: new Date(firstThursday).getFullYear(), week };
}
function isoWeekKey(dateStr){ const i = isoWeekInfo(dateStr); return i.year + '-' + String(i.week).padStart(2,'0'); }
function dateToLocalIso(d){
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}
function addIsoWeeks(year, week, delta){
  // Räkna om till en riktig kalenderdag (torsdagen i veckan) och stega därifrån - undviker manuellt årsskifte-krångel.
  // OBS: bygg datumsträngen från lokala år/månad/dag (INTE toISOString, som konverterar till UTC
  // och kan tappa en dag bakåt beroende på tidszon, vilket ger fel veckonummer nära veckoskiften).
  const jan4 = new Date(year, 0, 4);
  const dayNr = (jan4.getDay() + 6) % 7;
  const week1Monday = new Date(jan4);
  week1Monday.setDate(jan4.getDate() - dayNr);
  const target = new Date(week1Monday);
  target.setDate(week1Monday.getDate() + (week - 1 + delta) * 7);
  return isoWeekInfo(dateToLocalIso(target));
}

function renderMaterialDeliverySchedule(){
  const grid = document.getElementById('materialDeliveryScheduleGrid');
  const wrap = grid.parentElement;
  const empty = document.getElementById('materialDeliveryScheduleEmptyState');
  grid.innerHTML = '';

  // Samla alla (rum, produkt, lägenhet, datum) som har ett leveransdatum satt.
  const entries = [];
  materialData.rooms.forEach(room => {
    room.products.forEach(product => {
      Object.keys(product.deliveries || {}).forEach(aptId => {
        const d = product.deliveries[aptId];
        if(d && d.date) entries.push({ room, product, aptId, date: d.date });
      });
    });
  });

  if(entries.length === 0){
    wrap.style.display = 'none';
    empty.style.display = 'block';
    return;
  }
  wrap.style.display = 'block';
  empty.style.display = 'none';

  // Bygg en sammanhängande veckoskala från första till sista leveransveckan.
  let minInfo = isoWeekInfo(entries[0].date), maxInfo = minInfo;
  entries.forEach(e => {
    const info = isoWeekInfo(e.date);
    if(info.year < minInfo.year || (info.year === minInfo.year && info.week < minInfo.week)) minInfo = info;
    if(info.year > maxInfo.year || (info.year === maxInfo.year && info.week > maxInfo.week)) maxInfo = info;
  });
  const weekKeys = [];
  const weekLabels = [];
  let cursor = minInfo;
  let guard = 0;
  while(guard++ < 500){
    weekKeys.push(cursor.year + '-' + String(cursor.week).padStart(2,'0'));
    weekLabels.push('v.' + cursor.week + (cursor.year !== minInfo.year ? " '" + String(cursor.year).slice(2) : ''));
    if(cursor.year === maxInfo.year && cursor.week === maxInfo.week) break;
    cursor = addIsoWeeks(cursor.year, cursor.week, 1);
  }
  const weekIndexByKey = {};
  weekKeys.forEach((k, i) => { weekIndexByKey[k] = i; });
  const N = weekKeys.length;

  // Gruppera per produkt (rad) - en produkt kan ha leveranser till flera lägenheter/veckor.
  const rowsMap = new Map();
  entries.forEach(e => {
    const key = e.room.id + ':' + e.product.id;
    if(!rowsMap.has(key)) rowsMap.set(key, { room: e.room, product: e.product, byWeek: {} });
    const rowData = rowsMap.get(key);
    const wIdx = weekIndexByKey[isoWeekKey(e.date)];
    rowData.byWeek[wIdx] = (rowData.byWeek[wIdx] || 0) + 1;
  });
  const rows = Array.from(rowsMap.values());

  grid.style.gridTemplateColumns = '210px repeat(' + Math.max(N, 1) + ', minmax(34px, 1fr))';
  let rowCounter = 1;
  function place(el, col, rowNum, colSpan){
    el.style.gridColumn = colSpan ? (col + ' / span ' + colSpan) : String(col);
    el.style.gridRow = String(rowNum);
    grid.appendChild(el);
  }

  const corner = document.createElement('div');
  corner.className = 'tidsplan-corner';
  place(corner, 1, rowCounter);
  weekLabels.forEach((label, i) => {
    const wh = document.createElement('div');
    wh.className = 'tidsplan-week-header';
    wh.textContent = label;
    place(wh, i + 2, rowCounter);
  });
  rowCounter++;

  rows.forEach(rowData => {
    const label = document.createElement('div');
    label.className = 'tidsplan-row-label';
    label.innerHTML =
      '<span class="task-name">' + escapeHtml(rowData.product.name) + '</span>' +
      '<span class="task-ansvarig">' + escapeHtml(rowData.room.name) + '</span>';
    label.onclick = () => openMaterialDeliveryModal(rowData.room, rowData.product);
    place(label, 1, rowCounter);

    Object.keys(rowData.byWeek).forEach(wIdxStr => {
      const wIdx = parseInt(wIdxStr, 10);
      const marker = document.createElement('div');
      marker.className = 'delivery-marker';
      const count = rowData.byWeek[wIdx];
      marker.textContent = count + ' st';
      marker.title = 'Klicka för att se/redigera leveranser';
      marker.onclick = () => openMaterialDeliveryModal(rowData.room, rowData.product);
      place(marker, wIdx + 2, rowCounter);
    });
    rowCounter++;
  });
}

function renderMaterialOrderList(){
  const body = document.getElementById('materialOrderBody');
  const empty = document.getElementById('materialOrderEmptyState');
  body.innerHTML = '';

  const allRows = [];
  materialData.rooms.forEach(room => {
    room.products.forEach(product => allRows.push({ room, product }));
  });
  // Specas separat per lägenhetstyp (varje rum hör till en typ), och inom varje typ
  // grupperas hela beställningen per leverantör så alla rader för t.ex. Smeg hamnar i följd.
  allRows.sort((a, b) =>
    (a.room.unitType || '').localeCompare(b.room.unitType || '', 'sv', {numeric:true}) ||
    (a.product.supplier || '').localeCompare(b.product.supplier || '', 'sv') ||
    a.product.name.localeCompare(b.product.name, 'sv')
  );

  document.querySelector('#materialOrderView .table-scroll').style.display = allRows.length ? 'block' : 'none';
  empty.style.display = allRows.length ? 'none' : 'block';
  document.getElementById('materialOrderTotals').style.display = allRows.length ? 'flex' : 'none';
  if(allRows.length === 0) return;

  let sumEx = 0, sumInc = 0;
  let lastUnitType = null;
  allRows.forEach(({ room, product }) => {
    if(room.unitType !== lastUnitType){
      lastUnitType = room.unitType;
      const headerTr = document.createElement('tr');
      const headerTd = document.createElement('td');
      headerTd.colSpan = 12;
      headerTd.className = 'material-order-section';
      headerTd.textContent = 'Lägenhetstyp: ' + (lastUnitType || '—') + ' kvm';
      headerTr.appendChild(headerTd);
      body.appendChild(headerTr);
    }

    const qty = materialOrderQuantity(room, product);
    const priceEx = parseFloat(product.priceExVat) || 0;
    const priceInc = parseFloat(product.priceIncVat) || 0;
    const totalEx = priceEx * qty.total;
    const totalInc = priceInc * qty.total;
    sumEx += totalEx;
    sumInc += totalInc;

    const tr = document.createElement('tr');
    const nameTd = makeCell(product.name, '');
    nameTd.style.cursor = 'pointer';
    nameTd.className = 'material-editable-cell';
    nameTd.title = 'Klicka för att redigera';
    nameTd.onclick = () => openMaterialProductModal(room, product);
    tr.appendChild(nameTd);
    tr.appendChild(makeCell(room.name, ''));
    tr.appendChild(makeCell(product.supplier, ''));
    tr.appendChild(makeCell(room.unitType ? room.unitType + ' kvm' : '—', 'center'));
    tr.appendChild(makeCell(qty.perUnit + ' ' + qty.unit, 'center'));
    tr.appendChild(makeCell(String(qty.count), 'center'));
    tr.appendChild(makeCell(qty.totalStr + ' ' + qty.unit, 'center'));
    tr.appendChild(makeCell(formatMaterialPrice(product.priceExVat), 'center'));
    tr.appendChild(makeCell(formatMaterialPrice(product.priceIncVat), 'center'));
    tr.appendChild(makeCell(formatMaterialPrice(String(Math.round(totalEx))), 'center'));
    tr.appendChild(makeCell(formatMaterialPrice(String(Math.round(totalInc))), 'center'));
    tr.appendChild(makeMaterialOrderedCell(product));
    body.appendChild(tr);
  });

  document.getElementById('materialOrderTotals').innerHTML =
    '<span>Summa exkl moms: <strong>' + formatMaterialPrice(String(Math.round(sumEx))) + ' kr</strong></span>' +
    '<span>Summa inkl moms: <strong>' + formatMaterialPrice(String(Math.round(sumInc))) + ' kr</strong></span>';
}

document.getElementById('addRoomBtn').onclick = async () => {
  const unitType = currentMaterialUnitType();
  if(!unitType){
    showToast('Välj vilken lägenhetstyp (kvm) rummet gäller för först');
    return;
  }
  const input = document.getElementById('newRoomInput');
  const name = input.value.trim();
  if(!name) return;
  materialData.rooms.push({ id: uid(), name, floor: '', areaSqm: '', unitType, products: [] });
  input.value = '';
  renderMaterial();
  await persistMaterial();
};
document.getElementById('newRoomInput').addEventListener('keydown', e => {
  if(e.key === 'Enter') document.getElementById('addRoomBtn').click();
});

async function moveMaterialRoom(room, direction){
  // Byt plats med grannen inom SAMMA lägenhetstyp (var de än ligger i den underliggande listan) -
  // rum av andra typer visas aldrig tillsammans, så deras inbördes ordning spelar ingen roll.
  const sameTypeRooms = materialData.rooms.filter(r => r.unitType === room.unitType);
  const idx = sameTypeRooms.findIndex(r => r.id === room.id);
  const swapIdx = idx + direction;
  if(idx === -1 || swapIdx < 0 || swapIdx >= sameTypeRooms.length) return;
  const other = sameTypeRooms[swapIdx];
  const realIdxA = materialData.rooms.findIndex(r => r.id === room.id);
  const realIdxB = materialData.rooms.findIndex(r => r.id === other.id);
  const tmp = materialData.rooms[realIdxA];
  materialData.rooms[realIdxA] = materialData.rooms[realIdxB];
  materialData.rooms[realIdxB] = tmp;
  renderMaterial();
  await persistMaterial();
}

function setBofaktabladStatus(msg, kind){
  const el = document.getElementById('bofaktabladUploadStatus');
  el.textContent = msg;
  el.className = 'contract-upload-status' + (kind ? ' ' + kind : '');
}

document.getElementById('bofaktabladUploadBtn').onclick = () => {
  if(!document.getElementById('materialUnitTypeFilter').value){
    setBofaktabladStatus('Välj vilken lägenhetstyp (kvm) bofaktabladet gäller för först.', 'err');
    return;
  }
  document.getElementById('bofaktabladFileInput').click();
};

document.getElementById('bofaktabladFileInput').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if(!file) return;
  if(!document.getElementById('materialUnitTypeFilter').value){
    setBofaktabladStatus('Välj vilken lägenhetstyp (kvm) bofaktabladet gäller för först.', 'err');
    e.target.value = '';
    return;
  }
  if(file.size > CONTRACT_MAX_BYTES){
    setBofaktabladStatus('Filen är för stor (max 8 MB).', 'err');
    return;
  }
  const btn = document.getElementById('bofaktabladUploadBtn');
  btn.disabled = true;
  setBofaktabladStatus('Läser bofaktabladet…');
  try{
    const pdfBase64 = await fileToBase64(file);
    if(!window.DB || !window.DB.hasSupabase) throw new Error('Kräver att Supabase är påkopplat (fungerar inte i lokalt testläge)');
    const sb = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
    const { data, error } = await sb.functions.invoke('bright-processor', {
      body: { pdfBase64, filename: file.name }
    });
    if(error) throw error;

    const rooms = (data && Array.isArray(data.rooms)) ? data.rooms : [];
    if(rooms.length === 0){
      setBofaktabladStatus('Hittade inga rum i dokumentet.', 'err');
      return;
    }
    const unitType = document.getElementById('materialUnitTypeFilter').value;
    rooms.forEach(r => {
      materialData.rooms.push({
        id: uid(),
        name: r.name || 'Okänt rum',
        floor: r.floor || '',
        areaSqm: r.areaSqm || '',
        unitType: unitType,
        products: []
      });
    });
    renderMaterial();
    await persistMaterial();
    setBofaktabladStatus('Klart - la till ' + rooms.length + ' rum. Granska ordningen nedan.', 'ok');
  }catch(err){
    setBofaktabladStatus('Kunde inte läsa bofaktabladet: ' + err.message, 'err');
  }finally{
    btn.disabled = false;
    document.getElementById('bofaktabladFileInput').value = '';
  }
});

// ---------- Lägg till/redigera produkt ----------
let currentMaterialRoomId = null;
let currentMaterialProductId = null;

function openMaterialProductModal(room, product){
  currentMaterialRoomId = room.id;
  currentMaterialProductId = product ? product.id : null;
  document.getElementById('materialProductModalTitle').textContent = product ? 'Redigera produkt' : 'Lägg till produkt';
  document.getElementById('materialProductModalSub').textContent = 'Rum: ' + room.name;
  document.getElementById('materialProductName').value = product ? product.name : '';
  const supplierSelect = document.getElementById('materialProductSupplierSelect');
  const supplierCustom = document.getElementById('materialProductSupplierCustom');
  const knownSuppliers = Array.from(supplierSelect.options).map(o => o.value).filter(v => v !== '__other__');
  const currentSupplier = product ? (product.supplier || '') : '';
  if(currentSupplier && !knownSuppliers.includes(currentSupplier)){
    supplierSelect.value = '__other__';
    supplierCustom.value = currentSupplier;
    supplierCustom.style.display = 'block';
  } else {
    supplierSelect.value = currentSupplier || 'Smeg';
    supplierCustom.value = '';
    supplierCustom.style.display = 'none';
  }
  document.getElementById('materialProductPriceEx').value = product ? product.priceExVat : '';
  document.getElementById('materialProductPriceInc').value = product ? product.priceIncVat : '';
  document.getElementById('materialProductWarranty').value = product ? product.warranty : '';
  document.getElementById('materialProductUnitAmount').value = product ? product.unitAmount : '';
  document.getElementById('materialProductUnitKind').value = product ? product.unitKind : 'st';

  document.getElementById('materialProductModalOverlay').classList.add('open');
  setTimeout(() => document.getElementById('materialProductName').focus(), 0);
}
function closeMaterialProductModal(){
  document.getElementById('materialProductModalOverlay').classList.remove('open');
  currentMaterialRoomId = null;
  currentMaterialProductId = null;
}
document.getElementById('materialProductSupplierSelect').addEventListener('change', (e) => {
  document.getElementById('materialProductSupplierCustom').style.display = e.target.value === '__other__' ? 'block' : 'none';
});
document.getElementById('materialProductCancelBtn').onclick = closeMaterialProductModal;
document.getElementById('materialProductModalOverlay').addEventListener('click', e => {
  if(e.target.id === 'materialProductModalOverlay') closeMaterialProductModal();
});
document.getElementById('materialProductSaveBtn').onclick = async () => {
  const room = materialData.rooms.find(r => r.id === currentMaterialRoomId);
  if(!room){ closeMaterialProductModal(); return; }
  const name = document.getElementById('materialProductName').value.trim();
  if(!name){ showToast('Ange ett produktnamn'); return; }

  let product = room.products.find(p => p.id === currentMaterialProductId);
  if(!product){
    product = emptyMaterialProduct();
    room.products.push(product);
  }
  product.name = name;
  const supplierSelected = document.getElementById('materialProductSupplierSelect').value;
  product.supplier = supplierSelected === '__other__'
    ? document.getElementById('materialProductSupplierCustom').value.trim()
    : supplierSelected;
  product.priceExVat = document.getElementById('materialProductPriceEx').value.replace(/[^0-9]/g, '').trim();
  product.priceIncVat = document.getElementById('materialProductPriceInc').value.replace(/[^0-9]/g, '').trim();
  product.warranty = document.getElementById('materialProductWarranty').value.replace(/[^0-9]/g, '').trim();
  product.unitAmount = document.getElementById('materialProductUnitAmount').value.replace(/[^0-9,\.]/g, '').trim();
  product.unitKind = document.getElementById('materialProductUnitKind').value === 'kvm' ? 'kvm' : 'st';

  closeMaterialProductModal();
  renderMaterial();
  await persistMaterial();
};

// ---------- Leveranstider per lägenhet ----------
function openMaterialDeliveryModal(room, product){
  document.getElementById('materialDeliveryModalSub').textContent = 'Produkt: ' + product.name + ' (' + room.name + ')';
  const list = document.getElementById('materialDeliveryList');
  const matching = materialMatchingApartments(room);
  list.innerHTML = '';
  if(matching.length === 0){
    list.innerHTML = '<div style="color:var(--ink-soft); font-size:12.5px;">Inga lägenheter av den här lägenhetstypen (' + escapeHtml(room.unitType || '—') + ' kvm) hittades i projektet.</div>';
  } else {
    matching.forEach(apt => {
      const row = document.createElement('div');
      row.className = 'material-delivery-row';
      const label = document.createElement('span');
      label.textContent = 'LGH ' + (apt.lgh || '—') + (apt.address ? ' · ' + apt.address : '');
      row.appendChild(label);
      const existing = product.deliveries[apt.id];
      const input = document.createElement('input');
      input.type = 'date';
      input.className = 'date-input' + (existing && existing.date ? ' filled' : '');
      input.value = (existing && existing.date) || '';
      input.onchange = async () => {
        if(!myName){ showToast('Ange ditt namn först'); input.value = (existing && existing.date) || ''; return; }
        product.deliveries[apt.id] = { date: input.value, by: input.value ? myName : '', at: input.value ? new Date().toISOString() : '' };
        input.className = 'date-input' + (input.value ? ' filled' : '');
        await persistMaterial();
      };
      row.appendChild(input);
      list.appendChild(row);
    });
  }
  document.getElementById('materialDeliveryModalOverlay').classList.add('open');
}
function closeMaterialDeliveryModal(){
  document.getElementById('materialDeliveryModalOverlay').classList.remove('open');
  renderMaterial();
}
document.getElementById('materialDeliveryCloseBtn').onclick = closeMaterialDeliveryModal;
document.getElementById('materialDeliveryModalOverlay').addEventListener('click', e => {
  if(e.target.id === 'materialDeliveryModalOverlay') closeMaterialDeliveryModal();
});

// ---------- Skapa rumsbeskrivning (PDF) ----------
document.getElementById('createRumsbeskrivningBtn').onclick = () => {
  const proj = projects.find(p => p.id === activeProjectId);
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text('Rumsbeskrivning' + (proj ? ' – ' + proj.name : ''), 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text('Skapad ' + new Date().toLocaleDateString('sv-SE'), 14, 24);

  let y = 32;
  const roomsWithProducts = materialData.rooms.filter(r => r.products.length > 0);
  roomsWithProducts.forEach(room => {
    doc.setFontSize(13);
    doc.setTextColor(20);
    doc.text(room.name + (room.unitType ? ' (' + room.unitType + ' kvm)' : ''), 14, y);
    const rows = room.products.map(p => [
      p.name, p.supplier || '—',
      p.priceExVat ? formatMaterialPrice(p.priceExVat) + ' kr' : '—',
      p.priceIncVat ? formatMaterialPrice(p.priceIncVat) + ' kr' : '—',
      formatWarranty(p.warranty),
      (() => { const q = materialOrderQuantity(room, p); return q.totalStr + ' ' + q.unit; })()
    ]);
    doc.autoTable({
      startY: y + 4,
      head: [['Produkt', 'Leverantör', 'Pris exkl moms', 'Pris inkl moms', 'Garanti', 'Antal']],
      body: rows,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [58, 44, 32] },
      margin: { left: 14, right: 14 }
    });
    y = doc.lastAutoTable.finalY + 12;
  });

  if(roomsWithProducts.length === 0){
    doc.setFontSize(11);
    doc.setTextColor(120);
    doc.text('Inga produkter tillagda än.', 14, y);
  }

  const fileNamePart = proj ? '-' + proj.name.replace(/[^a-zA-Z0-9åäöÅÄÖ]+/g, '-') : '';
  doc.save('Rumsbeskrivning' + fileNamePart + '.pdf');
};

// ---------- Tidsplan (Gantt-schema, dagnivå) ----------
function tidsplanKey(projectId){ return 'tidsplan:' + projectId; }
const TIDSPLAN_WEEKDAY_LABELS = ['Mån', 'Tis', 'Ons', 'Tors', 'Fre', 'Lör', 'Sön'];
function mondayOfDate(dateStr){
  const d = new Date(dateStr + 'T00:00:00');
  const dayNr = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - dayNr);
  return dateToLocalIso(d);
}
function addDaysIso(dateStr, days){
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return dateToLocalIso(d);
}
function isoWeekMonday(year, week){
  const jan4 = new Date(year, 0, 4);
  const dayNr = (jan4.getDay() + 6) % 7;
  const week1Monday = new Date(jan4);
  week1Monday.setDate(jan4.getDate() - dayNr);
  const target = new Date(week1Monday);
  target.setDate(week1Monday.getDate() + (week - 1) * 7);
  return dateToLocalIso(target);
}
function emptyTidsplan(){
  return {
    weeks: [], // ISO-datum (måndagen) för varje vecka som visas
    houses: [],
    legend: [
      { task: 'VVS – grovinstallation', ansvarig: 'VVS', color: '#5B9BD5' },
      { task: 'Ventilation – kanal/installation', ansvarig: 'Vent', color: '#70AD47' },
      { task: 'El – rör, dosor & kablage', ansvarig: 'El', color: '#FFC000' },
      { task: 'Installationskontroll / komplettering', ansvarig: 'Samordning', color: '#A5A5A5' },
      { task: 'Snickare – komplettering/regling', ansvarig: 'Snickare', color: '#C55A11' },
      { task: 'Gipsning väggar', ansvarig: 'Snickare', color: '#ED7D31' },
      { task: 'Gipsning tak / inklädnader', ansvarig: 'Snickare', color: '#F4B183' },
      { task: 'Kontroll före nästa skede', ansvarig: 'PL', color: '#8064A2' }
    ],
    avstamningar: [] // { id, baseDayIndex, approved, rowOverrides: { [rowId]: dayIndex } }
  };
}
function emptyTidsplanRow(){
  return { id: uid(), task: '', ansvarig: '', color: '#5B9BD5', startIndex: null, endIndex: null, comment: '' };
}

let tidsplanData = emptyTidsplan();
let tidsplanTaskRowRefs = [];

async function loadTidsplan(projectId){
  if(!projectId) return;
  try{
    const res = await window.storage.get(tidsplanKey(projectId), true);
    tidsplanData = (res && res.value) ? JSON.parse(res.value) : emptyTidsplan();
  }catch(e){
    tidsplanData = emptyTidsplan();
  }
  if(!Array.isArray(tidsplanData.weeks)) tidsplanData.weeks = [];
  if(!Array.isArray(tidsplanData.houses)) tidsplanData.houses = [];
  if(!Array.isArray(tidsplanData.legend)) tidsplanData.legend = emptyTidsplan().legend;

  // Migrering: äldre data hade veckor som fri text ("v.3") och stapelindex på
  // veckonivå. Nu är varje vecka ett riktigt datum (måndagen) och index räknas
  // per dag, så gamla veckor/staplar "expanderas" till att fylla hela veckan -
  // användaren kan sedan själv justera datumen till vad de faktiskt var.
  const looksLikeDate = s => /^\d{4}-\d{2}-\d{2}$/.test(s);
  let weeksMigrated = false;
  if(tidsplanData.weeks.length && !tidsplanData.weeks.every(looksLikeDate)){
    const startMonday = mondayOfDate(dateToLocalIso(new Date()));
    tidsplanData.weeks = tidsplanData.weeks.map((_, i) => addDaysIso(startMonday, i * 7));
    weeksMigrated = true;
  }

  if(!Array.isArray(tidsplanData.avstamningar)) tidsplanData.avstamningar = [];
  // Migrering: äldre data hade en enda global avstämningslinje (vecko- eller
  // dagbaserad), inte flera avstämningar med egna radavvikelser.
  if(tidsplanData.avstamningslinje){
    const oldDayIndex = tidsplanData.avstamningslinje.dayIndex;
    const oldWeekIndex = tidsplanData.avstamningslinje.weekIndex;
    const migratedDayIndex = (typeof oldDayIndex === 'number') ? oldDayIndex : (typeof oldWeekIndex === 'number' ? oldWeekIndex * 7 : null);
    if(migratedDayIndex !== null){
      tidsplanData.avstamningar.push({ id: uid(), baseDayIndex: migratedDayIndex, approved: false, rowOverrides: {} });
    }
    delete tidsplanData.avstamningslinje;
  }
  tidsplanData.avstamningar.forEach(cp => {
    if(typeof cp.baseDayIndex !== 'number') cp.baseDayIndex = 0;
    if(typeof cp.approved !== 'boolean') cp.approved = false;
    if(!cp.rowOverrides || typeof cp.rowOverrides !== 'object') cp.rowOverrides = {};
  });

  tidsplanData.houses.forEach(h => {
    if(!Array.isArray(h.rows)) h.rows = [];
    h.rows.forEach(r => {
      if(typeof r.task !== 'string') r.task = '';
      if(typeof r.ansvarig !== 'string') r.ansvarig = '';
      if(typeof r.color !== 'string') r.color = '#5B9BD5';
      if(typeof r.comment !== 'string') r.comment = '';
      if(typeof r.startIndex !== 'number') r.startIndex = null;
      if(typeof r.endIndex !== 'number') r.endIndex = null;
      if(weeksMigrated && r.startIndex !== null && r.endIndex !== null){
        r.startIndex = r.startIndex * 7;
        r.endIndex = r.endIndex * 7 + 6;
      }
    });
  });
  renderTidsplan();
}

async function persistTidsplan(){
  try{
    await withRetry(() => window.storage.set(tidsplanKey(activeProjectId), JSON.stringify(tidsplanData), true));
    clearDebugError();
  }catch(e){
    showDebugError('Kunde inte spara tidsplan', e, () => persistTidsplan());
    showToast('Kunde inte spara – klicka "Försök spara igen" nedan');
  }
}

// ---------- Legend ----------
function renderTidsplanLegend(){
  const list = document.getElementById('tidsplanLegendList');
  list.innerHTML = '';
  tidsplanData.legend.forEach((entry, idx) => {
    const row = document.createElement('div');
    row.className = 'tidsplan-legend-row';
    const swatch = document.createElement('div');
    swatch.className = 'tidsplan-legend-swatch';
    swatch.style.background = entry.color;
    row.appendChild(swatch);
    const task = document.createElement('span');
    task.className = 'legend-task';
    task.textContent = entry.task;
    row.appendChild(task);
    const ansvarig = document.createElement('span');
    ansvarig.className = 'legend-ansvarig';
    ansvarig.textContent = entry.ansvarig;
    row.appendChild(ansvarig);
    const rmBtn = document.createElement('button');
    rmBtn.textContent = '✕';
    rmBtn.title = 'Ta bort från legend';
    rmBtn.onclick = async () => {
      tidsplanData.legend.splice(idx, 1);
      renderTidsplanLegend();
      await persistTidsplan();
    };
    row.appendChild(rmBtn);
    list.appendChild(row);
  });
}

document.getElementById('addLegendBtn').onclick = async () => {
  const task = document.getElementById('legendTaskInput').value.trim();
  if(!task) return;
  const ansvarig = document.getElementById('legendAnsvarigInput').value.trim();
  const color = document.getElementById('legendColorInput').value;
  tidsplanData.legend.push({ task, ansvarig, color });
  document.getElementById('legendTaskInput').value = '';
  document.getElementById('legendAnsvarigInput').value = '';
  renderTidsplanLegend();
  await persistTidsplan();
};

// ---------- Hus / veckor ----------
document.getElementById('addHouseBtn').onclick = async () => {
  const input = document.getElementById('newHouseInput');
  const name = input.value.trim();
  if(!name) return;
  tidsplanData.houses.push({ id: uid(), name, rows: [] });
  input.value = '';
  renderTidsplan();
  await persistTidsplan();
};
document.getElementById('newHouseInput').addEventListener('keydown', e => {
  if(e.key === 'Enter') document.getElementById('addHouseBtn').click();
});

document.getElementById('addWeekBtn').onclick = async () => {
  const last = tidsplanData.weeks[tidsplanData.weeks.length - 1];
  const nextMonday = last ? addDaysIso(last, 7) : mondayOfDate(dateToLocalIso(new Date()));
  tidsplanData.weeks.push(nextMonday);
  renderTidsplan();
  await persistTidsplan();
};

async function removeTidsplanHouse(house){
  tidsplanData.houses = tidsplanData.houses.filter(h => h.id !== house.id);
  renderTidsplan();
  await persistTidsplan();
}

async function moveTidsplanHouse(house, direction){
  const idx = tidsplanData.houses.findIndex(h => h.id === house.id);
  const swapIdx = idx + direction;
  if(idx === -1 || swapIdx < 0 || swapIdx >= tidsplanData.houses.length) return;
  const tmp = tidsplanData.houses[idx];
  tidsplanData.houses[idx] = tidsplanData.houses[swapIdx];
  tidsplanData.houses[swapIdx] = tmp;
  renderTidsplan();
  await persistTidsplan();
}

async function addTidsplanRow(house){
  house.rows.push(emptyTidsplanRow());
  renderTidsplan();
  await persistTidsplan();
}

// ---------- Avstämningslinje (dras fritt bland raderna, precis som staplarna) ----------
document.getElementById('tidsplanStamBtn').onclick = async () => {
  if(!tidsplanData.weeks.length){ showToast('Lägg till minst en vecka först'); return; }
  const activeStam = tidsplanData.avstamningar[tidsplanData.avstamningar.length - 1];
  if(activeStam && !activeStam.approved){
    showToast('Godkänn eller ta bort den aktiva avstämningen innan du lägger en ny.');
    return;
  }
  const firstMonday = tidsplanData.weeks[0];
  const todayIso = dateToLocalIso(new Date());
  const diffDays = Math.round((new Date(todayIso + 'T00:00:00') - new Date(firstMonday + 'T00:00:00')) / 86400000);
  const N = tidsplanData.weeks.length * 7;
  const baseDayIndex = Math.max(0, Math.min(N - 1, diffDays));
  tidsplanData.avstamningar.push({ id: uid(), baseDayIndex, approved: false, rowOverrides: {} });
  renderTidsplan();
  await persistTidsplan();
};
document.getElementById('tidsplanApproveStamBtn').onclick = async () => {
  const activeStam = tidsplanData.avstamningar[tidsplanData.avstamningar.length - 1];
  if(!activeStam || activeStam.approved) return;
  activeStam.approved = true;
  renderTidsplan();
  await persistTidsplan();
};
document.getElementById('tidsplanRemoveStamBtn').onclick = async () => {
  const activeStam = tidsplanData.avstamningar[tidsplanData.avstamningar.length - 1];
  if(!activeStam || activeStam.approved) return;
  tidsplanData.avstamningar.pop();
  renderTidsplan();
  await persistTidsplan();
};

// ---------- Rad-redigering (modal) ----------
let tidsplanEditingHouseId = null;
let tidsplanEditingRowId = null;

function openTidsplanRowModal(house, row){
  tidsplanEditingHouseId = house.id;
  tidsplanEditingRowId = row.id;
  document.getElementById('tidsplanRowModalTitle').textContent = row.task ? 'Redigera uppgift' : 'Ny uppgift';
  document.getElementById('tidsplanRowTask').value = row.task || '';
  document.getElementById('tidsplanRowAnsvarig').value = row.ansvarig || '';
  document.getElementById('tidsplanRowColor').value = row.color || '#5B9BD5';
  document.getElementById('tidsplanRowComment').value = row.comment || '';
  document.getElementById('tidsplanRowModalOverlay').classList.add('open');
  setTimeout(() => document.getElementById('tidsplanRowTask').focus(), 0);
}
function closeTidsplanRowModal(){
  document.getElementById('tidsplanRowModalOverlay').classList.remove('open');
  tidsplanEditingHouseId = null;
  tidsplanEditingRowId = null;
}
document.getElementById('tidsplanRowCancelBtn').onclick = closeTidsplanRowModal;
document.getElementById('tidsplanRowModalOverlay').addEventListener('click', e => {
  if(e.target.id === 'tidsplanRowModalOverlay') closeTidsplanRowModal();
});
document.getElementById('tidsplanRowTask').addEventListener('input', (e) => {
  const match = tidsplanData.legend.find(l => l.task.toLowerCase() === e.target.value.trim().toLowerCase());
  if(match){
    document.getElementById('tidsplanRowAnsvarig').value = match.ansvarig;
    document.getElementById('tidsplanRowColor').value = match.color;
  }
});
document.getElementById('tidsplanRowSaveBtn').onclick = async () => {
  const house = tidsplanData.houses.find(h => h.id === tidsplanEditingHouseId);
  const row = house && house.rows.find(r => r.id === tidsplanEditingRowId);
  if(!row){ closeTidsplanRowModal(); return; }
  row.task = document.getElementById('tidsplanRowTask').value.trim();
  row.ansvarig = document.getElementById('tidsplanRowAnsvarig').value.trim();
  row.color = document.getElementById('tidsplanRowColor').value;
  row.comment = document.getElementById('tidsplanRowComment').value.trim();
  closeTidsplanRowModal();
  renderTidsplan();
  await persistTidsplan();
};
document.getElementById('tidsplanRowDeleteBtn').onclick = async () => {
  const house = tidsplanData.houses.find(h => h.id === tidsplanEditingHouseId);
  if(house) house.rows = house.rows.filter(r => r.id !== tidsplanEditingRowId);
  closeTidsplanRowModal();
  renderTidsplan();
  await persistTidsplan();
};

// ---------- Rendering ----------
function renderTidsplan(){
  renderTidsplanLegend();
  const grid = document.getElementById('tidsplanGrid');
  const empty = document.getElementById('tidsplanEmptyState');
  const wrap = document.getElementById('tidsplanGridWrap');
  grid.innerHTML = '';

  if(tidsplanData.houses.length === 0){
    wrap.style.display = 'none';
    empty.style.display = 'block';
    document.getElementById('tidsplanApproveStamBtn').style.display = 'none';
    document.getElementById('tidsplanRemoveStamBtn').style.display = 'none';
    return;
  }
  wrap.style.display = 'block';
  empty.style.display = 'none';
  tidsplanTaskRowRefs = [];

  const N = tidsplanData.weeks.length * 7;
  grid.style.gridTemplateColumns = '210px repeat(' + Math.max(N, 1) + ', minmax(28px, 1fr))';

  let rowCounter = 1;

  function place(el, col, rowNum, colSpan){
    el.style.gridColumn = colSpan ? (col + ' / span ' + colSpan) : String(col);
    el.style.gridRow = String(rowNum);
    grid.appendChild(el);
  }

  // Header-rad 1+2: hörncell (spänner båda) + vecka (v.NN + datum) + veckodag/datum per dag
  const corner = document.createElement('div');
  corner.className = 'tidsplan-corner';
  place(corner, 1, rowCounter);
  corner.style.gridRow = '1 / 3';

  tidsplanData.weeks.forEach((monday, wi) => {
    const info = isoWeekInfo(monday);
    const wh = document.createElement('div');
    wh.className = 'tidsplan-week-header';
    const label = document.createElement('span');
    label.textContent = 'v.' + info.week;
    wh.appendChild(label);
    const dateInput = document.createElement('input');
    dateInput.type = 'date';
    dateInput.className = 'tidsplan-week-date-input';
    dateInput.value = monday;
    dateInput.title = 'Måndagen den här veckan börjar på';
    dateInput.onchange = async () => {
      tidsplanData.weeks[wi] = mondayOfDate(dateInput.value || monday);
      renderTidsplan();
      await persistTidsplan();
    };
    wh.appendChild(dateInput);
    place(wh, wi * 7 + 2, 1, 7);

    for(let d = 0; d < 7; d++){
      const dateStr = addDaysIso(monday, d);
      const dh = document.createElement('div');
      dh.className = 'tidsplan-day-header';
      dh.innerHTML =
        '<span class="tidsplan-day-name">' + TIDSPLAN_WEEKDAY_LABELS[d] + '</span>' +
        '<span class="tidsplan-day-num">' + parseInt(dateStr.slice(8, 10), 10) + '</span>';
      place(dh, wi * 7 + d + 2, 2);
    }
  });
  rowCounter = 3;

  tidsplanData.houses.forEach((house, houseIdx) => {
    const houseRow = document.createElement('div');
    houseRow.className = 'tidsplan-house-row';
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.className = 'tidsplan-house-name-input';
    nameInput.value = house.name;
    nameInput.onchange = async () => {
      house.name = nameInput.value.trim() || house.name;
      renderTidsplan();
      await persistTidsplan();
    };
    houseRow.appendChild(nameInput);
    const upBtn = document.createElement('button');
    upBtn.textContent = '▲';
    upBtn.title = 'Flytta upp';
    upBtn.disabled = houseIdx === 0;
    upBtn.onclick = () => moveTidsplanHouse(house, -1);
    houseRow.appendChild(upBtn);
    const downBtn = document.createElement('button');
    downBtn.textContent = '▼';
    downBtn.title = 'Flytta ner';
    downBtn.disabled = houseIdx === tidsplanData.houses.length - 1;
    downBtn.onclick = () => moveTidsplanHouse(house, 1);
    houseRow.appendChild(downBtn);
    const addRowBtn = document.createElement('button');
    addRowBtn.textContent = '+ Lägg till rad';
    addRowBtn.onclick = () => addTidsplanRow(house);
    houseRow.appendChild(addRowBtn);
    const rmHouseBtn = document.createElement('button');
    rmHouseBtn.className = 'tidsplan-house-remove';
    rmHouseBtn.textContent = '✕ Ta bort hus';
    rmHouseBtn.onclick = () => removeTidsplanHouse(house);
    houseRow.appendChild(rmHouseBtn);
    place(houseRow, 1, rowCounter, N + 1);
    rowCounter++;

    house.rows.forEach(row => {
      const thisRowNum = rowCounter;
      const label = document.createElement('div');
      label.className = 'tidsplan-row-label';
      label.innerHTML =
        '<span class="task-name">' + escapeHtml(row.task || 'Namnlös uppgift') + '</span>' +
        (row.ansvarig ? '<span class="task-ansvarig">' + escapeHtml(row.ansvarig) + '</span>' : '');
      label.onclick = () => openTidsplanRowModal(house, row);
      place(label, 1, thisRowNum);
      tidsplanTaskRowRefs.push({ rowId: row.id, gridRow: thisRowNum, labelEl: label, hasBar: row.startIndex !== null && row.endIndex !== null });

      if(row.startIndex === null || row.endIndex === null){
        for(let i = 0; i < N; i++){
          const cell = document.createElement('div');
          cell.className = 'tidsplan-week-cell';
          cell.title = 'Klicka för att lägga uppgiften här';
          cell.onclick = async () => {
            row.startIndex = i;
            row.endIndex = i;
            renderTidsplan();
            await persistTidsplan();
          };
          place(cell, i + 2, thisRowNum);
        }
      } else {
        const bar = document.createElement('div');
        bar.className = 'tidsplan-bar';
        bar.style.background = row.color;
        bar.textContent = row.task || 'Namnlös uppgift';
        bar.title = row.comment || row.task;
        place(bar, row.startIndex + 2, thisRowNum, row.endIndex - row.startIndex + 1);

        const handle = document.createElement('div');
        handle.className = 'tidsplan-bar-handle';
        bar.appendChild(handle);

        wireTidsplanBarDrag(bar, handle, house, row);
      }
      rowCounter++;
    });
  });

  // Avstämningar - varje aktiv (ej godkänd) avstämning kan dras per rad för att
  // visa var arbetet faktiskt låg vid avstämningstillfället. Godkända
  // avstämningar fryses och ritas kvar som historik (streckad).
  const activeStam = tidsplanData.avstamningar[tidsplanData.avstamningar.length - 1];
  const hasActiveStam = !!(activeStam && !activeStam.approved);
  document.getElementById('tidsplanApproveStamBtn').style.display = hasActiveStam ? 'inline-block' : 'none';
  document.getElementById('tidsplanRemoveStamBtn').style.display = hasActiveStam ? 'inline-block' : 'none';

  if(hasActiveStam){
    tidsplanTaskRowRefs.filter(r => r.hasBar).forEach(ref => {
      const dayIdx = activeStam.rowOverrides[ref.rowId] != null ? activeStam.rowOverrides[ref.rowId] : activeStam.baseDayIndex;
      const handle = document.createElement('div');
      handle.className = 'tidsplan-stamline-handle';
      handle.title = 'Dra för att visa var det här arbetet faktiskt låg vid avstämningen';
      place(handle, dayIdx + 2, ref.gridRow, 1);
      wireTidsplanStamHandleDrag(handle, activeStam, ref.rowId);
    });
  }

  drawTidsplanStamSvg();
}

function drawTidsplanStamSvg(){
  const grid = document.getElementById('tidsplanGrid');
  const old = document.getElementById('tidsplanStamSvg');
  if(old) old.remove();
  if(!tidsplanData.avstamningar.length) return;
  const barRows = tidsplanTaskRowRefs.filter(r => r.hasBar);
  if(!barRows.length) return;

  const gridRect = grid.getBoundingClientRect();
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.id = 'tidsplanStamSvg';
  svg.setAttribute('class', 'tidsplan-stam-svg');
  svg.setAttribute('viewBox', '0 0 ' + gridRect.width + ' ' + gridRect.height);

  const colWidth = getTidsplanColWidth();
  const xFor = (dayIndex) => 210 + dayIndex * colWidth;

  tidsplanData.avstamningar.forEach(cp => {
    const rowPoints = barRows.map(ref => {
      const r = ref.labelEl.getBoundingClientRect();
      const midY = (r.top - gridRect.top) + r.height / 2;
      const dayIdx = cp.rowOverrides[ref.rowId] != null ? cp.rowOverrides[ref.rowId] : cp.baseDayIndex;
      return [xFor(dayIdx), midY];
    });
    const topPoint = [xFor(cp.baseDayIndex), 0];
    const bottomPoint = [rowPoints[rowPoints.length - 1][0], gridRect.height];
    const allPoints = [topPoint, ...rowPoints, bottomPoint];
    const d = allPoints.map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d);
    path.setAttribute('class', 'tidsplan-stam-path' + (cp.approved ? ' approved' : ' active'));
    svg.appendChild(path);
  });

  grid.appendChild(svg);
}

function wireTidsplanStamHandleDrag(handle, checkpoint, rowId){
  let dragState = null;

  handle.addEventListener('mousedown', (e) => {
    e.preventDefault();
    const current = checkpoint.rowOverrides[rowId] != null ? checkpoint.rowOverrides[rowId] : checkpoint.baseDayIndex;
    dragState = { startX: e.clientX, orig: current };
  });

  function onMove(e){
    if(!dragState) return;
    const colWidth = getTidsplanColWidth();
    const deltaPx = e.clientX - dragState.startX;
    const deltaDays = Math.round(deltaPx / colWidth);
    const N = tidsplanData.weeks.length * 7;
    const newIndex = Math.max(0, Math.min(N - 1, dragState.orig + deltaDays));
    handle.style.gridColumn = String(newIndex + 2);
    handle._pendingIndex = newIndex;
    checkpoint.rowOverrides[rowId] = newIndex;
    drawTidsplanStamSvg();
  }

  async function onUp(){
    if(!dragState) return;
    dragState = null;
    if(typeof handle._pendingIndex === 'number'){
      checkpoint.rowOverrides[rowId] = handle._pendingIndex;
    }
    renderTidsplan();
    await persistTidsplan();
  }

  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
}

// ---------- Dra i stapel: flytta / förläng ----------
function getTidsplanColWidth(){
  const grid = document.getElementById('tidsplanGrid');
  const totalWidth = grid.getBoundingClientRect().width;
  const N = Math.max(tidsplanData.weeks.length * 7, 1);
  return (totalWidth - 210) / N;
}

function wireTidsplanBarDrag(bar, handle, house, row){
  let dragState = null;

  bar.addEventListener('mousedown', (e) => {
    if(e.target === handle) return;
    e.preventDefault();
    dragState = { mode: 'move', startX: e.clientX, moved: 0, origStart: row.startIndex, origEnd: row.endIndex };
  });
  handle.addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragState = { mode: 'resize', startX: e.clientX, moved: 0, origStart: row.startIndex, origEnd: row.endIndex };
  });

  function onMove(e){
    if(!dragState) return;
    const colWidth = getTidsplanColWidth();
    const deltaPx = e.clientX - dragState.startX;
    dragState.moved = Math.abs(deltaPx);
    const deltaDays = Math.round(deltaPx / colWidth);
    const N = tidsplanData.weeks.length * 7;

    if(dragState.mode === 'move'){
      const length = dragState.origEnd - dragState.origStart;
      let newStart = dragState.origStart + deltaDays;
      newStart = Math.max(0, Math.min(newStart, N - 1 - length));
      const newEnd = newStart + length;
      bar.style.gridColumn = (newStart + 2) + ' / span ' + (newEnd - newStart + 1);
      bar._pendingStart = newStart;
      bar._pendingEnd = newEnd;
    } else {
      let newEnd = dragState.origEnd + deltaDays;
      newEnd = Math.max(dragState.origStart, Math.min(newEnd, N - 1));
      bar.style.gridColumn = (dragState.origStart + 2) + ' / span ' + (newEnd - dragState.origStart + 1);
      bar._pendingStart = dragState.origStart;
      bar._pendingEnd = newEnd;
    }
  }

  async function onUp(){
    if(!dragState) return;
    const wasClick = dragState.moved < 4;
    const ds = dragState;
    dragState = null;
    if(wasClick){
      renderTidsplan();
      openTidsplanRowModal(house, row);
      return;
    }
    if(typeof bar._pendingStart === 'number'){
      row.startIndex = bar._pendingStart;
      row.endIndex = bar._pendingEnd;
    }
    renderTidsplan();
    await persistTidsplan();
  }

  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
}

// ---------- Importera från Excel ----------
function tidsplanFindLegendMatch(text){
  const t = (text || '').trim().toLowerCase();
  if(!t) return null;
  return tidsplanData.legend.find(l => l.task.toLowerCase() === t) ||
    tidsplanData.legend.find(l => t.includes(l.task.toLowerCase()) || l.task.toLowerCase().includes(t));
}

function setTidsplanImportStatus(msg, kind){
  const el = document.getElementById('tidsplanImportStatus');
  el.textContent = msg;
  el.className = 'contract-upload-status' + (kind ? ' ' + kind : '');
}

document.getElementById('tidsplanImportBtn').onclick = () => {
  document.getElementById('tidsplanImportInput').click();
};

document.getElementById('tidsplanImportInput').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if(!file) return;
  setTidsplanImportStatus('Läser Excel-filen…');
  try{
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array', cellStyles: true });

    // Läs ev. Inställningar-flik som legend (arbetsmoment/ansvarig/färgkod-kolumner)
    const settingsSheetName = wb.SheetNames.find(n => /inställning/i.test(n));
    if(settingsSheetName){
      const s = wb.Sheets[settingsSheetName];
      const rows = XLSX.utils.sheet_to_json(s, { header: 1 });
      for(let i = 1; i < rows.length; i++){
        const [task, ansvarig, color] = rows[i];
        if(task && color && /^#/.test(color) && !tidsplanData.legend.some(l => l.task === task)){
          tidsplanData.legend.push({ task: String(task), ansvarig: ansvarig ? String(ansvarig) : '', color: String(color) });
        }
      }
    }

    const sheetName = wb.SheetNames.find(n => /tidsplan/i.test(n)) || wb.SheetNames[0];
    const sheet = wb.Sheets[sheetName];
    const range = XLSX.utils.decode_range(sheet['!ref']);
    const merges = sheet['!merges'] || [];

    function cellText(r, c){
      const ref = XLSX.utils.encode_cell({ r, c });
      const cell = sheet[ref];
      return cell && cell.v !== undefined ? String(cell.v).trim() : '';
    }
    function mergeFor(r, c){
      return merges.find(m => m.s.r === r && m.s.c === c);
    }

    // Hitta header-rader (celler som matchar v.NN i följd)
    const headerRows = [];
    for(let r = range.s.r; r <= range.e.r; r++){
      let weekCols = [];
      for(let c = range.s.c; c <= range.e.c; c++){
        if(/^v\.\d+$/i.test(cellText(r, c))) weekCols.push(c);
      }
      if(weekCols.length >= 3) headerRows.push({ r, cols: weekCols });
    }

    if(headerRows.length === 0){
      setTidsplanImportStatus('Hittade inga veckorubriker (t.ex. "v.35") i filen.', 'err');
      return;
    }

    const firstHeader = headerRows[0];
    // Excel har bara veckonummer ("v.35"), inte år - antar innevarande år.
    // Användaren kan sedan justera varje veckas datum för hand om det behövs.
    const importYear = new Date().getFullYear();
    const weeks = firstHeader.cols.map(c => {
      const m = cellText(firstHeader.r, c).match(/\d+/);
      return isoWeekMonday(importYear, m ? parseInt(m[0], 10) : 1);
    });
    if(tidsplanData.weeks.length === 0) tidsplanData.weeks = weeks;
    const colToWeekIndex = {};
    firstHeader.cols.forEach((c, i) => { colToWeekIndex[c] = i; });
    const firstWeekCol = firstHeader.cols[0];
    const lastWeekCol = firstHeader.cols[firstHeader.cols.length - 1];

    let housesAdded = 0, rowsAdded = 0;
    for(let hIdx = 0; hIdx < headerRows.length; hIdx++){
      const startR = headerRows[hIdx].r;
      const endR = (hIdx + 1 < headerRows.length) ? headerRows[hIdx + 1].r - 1 : range.e.r;

      // Hitta husnamn: leta "HUS n" i blockets första rader
      let houseName = 'Hus ' + (hIdx + 1);
      for(let r = startR; r <= Math.min(startR + 3, endR); r++){
        for(let c = range.s.c; c <= range.e.c; c++){
          const t = cellText(r, c);
          if(/^hus\s*\d+/i.test(t)){ houseName = t; break; }
        }
      }

      const house = { id: uid(), name: houseName, rows: [] };

      // Gå igenom raderna i blocket, leta efter text-celler inom veckokolumnerna
      const seenLabelCells = new Set();
      for(let r = startR + 1; r <= endR; r++){
        for(let c = firstWeekCol; c <= lastWeekCol; c++){
          const key = r + ':' + c;
          if(seenLabelCells.has(key)) continue;
          const text = cellText(r, c);
          if(!text || /^v\.\d+$/i.test(text) || /^hus\s*\d+/i.test(text)) continue;

          const merge = mergeFor(r, c);
          let sCol = c, eCol = c;
          if(merge){
            sCol = merge.s.c; eCol = merge.e.c;
            for(let mc = sCol; mc <= eCol; mc++) seenLabelCells.add(r + ':' + mc);
          }
          if(sCol < firstWeekCol || eCol > lastWeekCol) continue;

          const legendMatch = tidsplanFindLegendMatch(text);
          house.rows.push({
            id: uid(),
            task: text,
            ansvarig: legendMatch ? legendMatch.ansvarig : '',
            color: legendMatch ? legendMatch.color : '#5B9BD5',
            startIndex: (colToWeekIndex[sCol] !== undefined ? colToWeekIndex[sCol] : 0) * 7,
            endIndex: (colToWeekIndex[eCol] !== undefined ? colToWeekIndex[eCol] : 0) * 7 + 6,
            comment: ''
          });
          rowsAdded++;
        }
      }

      tidsplanData.houses.push(house);
      housesAdded++;
    }

    renderTidsplan();
    await persistTidsplan();
    setTidsplanImportStatus('Klart - la till ' + housesAdded + ' hus och ' + rowsAdded + ' uppgifter. Granska och justera nedan.', 'ok');
  }catch(err){
    setTidsplanImportStatus('Kunde inte läsa filen: ' + err.message, 'err');
  }finally{
    document.getElementById('tidsplanImportInput').value = '';
  }
});

document.getElementById('tidsplanPdfBtn').onclick = () => {
  const proj = projects.find(p => p.id === activeProjectId);
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'landscape' });

  doc.setFontSize(16);
  doc.text('Tidsplan' + (proj ? ' – ' + proj.name : ''), 14, 16);
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text('Skapad ' + new Date().toLocaleDateString('sv-SE'), 14, 22);

  const dayIndexToDate = (idx) => {
    const weekIdx = Math.floor(idx / 7);
    const dayOffset = idx % 7;
    return tidsplanData.weeks[weekIdx] ? addDaysIso(tidsplanData.weeks[weekIdx], dayOffset) : '—';
  };

  let y = 30;
  const housesWithRows = tidsplanData.houses.filter(h => h.rows.length);
  housesWithRows.forEach(house => {
    doc.setFontSize(12);
    doc.setTextColor(20);
    doc.text(house.name, 14, y);
    const rows = house.rows.map(r => [
      r.task || 'Namnlös uppgift',
      r.ansvarig || '—',
      r.startIndex !== null ? dayIndexToDate(r.startIndex) : '—',
      r.endIndex !== null ? dayIndexToDate(r.endIndex) : '—',
      r.comment || ''
    ]);
    doc.autoTable({
      startY: y + 4,
      head: [['Arbetsmoment', 'Ansvarig', 'Start', 'Slut', 'Kommentar']],
      body: rows,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [58, 44, 32] },
      margin: { left: 14, right: 14 }
    });
    y = doc.lastAutoTable.finalY + 10;
  });

  if(housesWithRows.length === 0){
    doc.setFontSize(11);
    doc.setTextColor(120);
    doc.text('Inga uppgifter tillagda än.', 14, y);
  }

  const fileNamePart = proj ? '-' + proj.name.replace(/[^a-zA-Z0-9åäöÅÄÖ]+/g, '-') : '';
  doc.save('Tidsplan' + fileNamePart + '.pdf');
};

// ---------- Byggmöten (protokoll, en flik under Entreprenad) ----------
function byggmoteKey(projectId){ return 'byggmoten:' + projectId; }
const BYGGMOTE_STANDARDPUNKTER = [
  'Nästa möte', 'Föregående protokoll', 'Tidsplan', 'Bygg', 'VVS', 'El',
  'Målare', 'Mark', 'Arbetsmiljö', 'Personalliggare'
];
function nextByggmoteNr(){
  const nums = byggmoteList.map(m => parseInt(m.moteNr, 10)).filter(n => !isNaN(n));
  return String((nums.length ? Math.max(...nums) : 0) + 1);
}
function emptyByggmote(){
  return {
    id: uid(),
    moteNr: nextByggmoteNr(),
    datum: todayStr(),
    narvarande: [{ namn: '', foretag: '' }],
    punkter: BYGGMOTE_STANDARDPUNKTER.map(rubrik => ({ rubrik, anteckningar: '', ansvarig: '' }))
  };
}
function currentProjectOrt(){
  const p = projects.find(pr => pr.id === activeProjectId);
  return (p && p.ort) || '';
}

let byggmoteList = [];
let currentByggmoteId = null;

async function loadByggmoten(projectId){
  if(!projectId) return;
  try{
    const res = await window.storage.get(byggmoteKey(projectId), true);
    byggmoteList = (res && res.value) ? JSON.parse(res.value) : [];
  }catch(e){
    byggmoteList = [];
  }
  if(!Array.isArray(byggmoteList)) byggmoteList = [];
  renderByggmoteList();
}

async function persistByggmoten(){
  try{
    await withRetry(() => window.storage.set(byggmoteKey(activeProjectId), JSON.stringify(byggmoteList), true));
    clearDebugError();
  }catch(e){
    showDebugError('Kunde inte spara byggmötet', e, () => persistByggmoten());
    showToast('Kunde inte spara – klicka "Försök spara igen" nedan');
  }
}

function renderByggmoteList(){
  const tbody = document.getElementById('byggmoteListBody');
  const empty = document.getElementById('byggmoteListEmptyState');
  tbody.innerHTML = '';
  empty.style.display = byggmoteList.length ? 'none' : 'block';
  const sorted = [...byggmoteList].sort((a, b) => (parseInt(b.moteNr, 10) || 0) - (parseInt(a.moteNr, 10) || 0));
  const ort = currentProjectOrt();
  sorted.forEach(m => {
    const row = document.createElement('tr');
    row.onclick = () => openByggmoteForm(m.id);
    row.innerHTML =
      '<td>' + escapeHtml(m.moteNr || '—') + '</td>' +
      '<td>' + escapeHtml(m.datum || '—') + '</td>' +
      '<td>' + escapeHtml(ort || '—') + '</td>';
    tbody.appendChild(row);
  });
}

function openByggmoteForm(id){
  currentByggmoteId = id;
  document.getElementById('byggmoteListSubview').style.display = 'none';
  document.getElementById('byggmoteFormSubview').style.display = 'block';
  renderByggmoteForm();
}

function closeByggmoteForm(){
  currentByggmoteId = null;
  document.getElementById('byggmoteFormSubview').style.display = 'none';
  document.getElementById('byggmoteListSubview').style.display = 'block';
  renderByggmoteList();
}

function currentByggmote(){
  return byggmoteList.find(m => m.id === currentByggmoteId);
}

function renderByggmoteForm(){
  const m = currentByggmote();
  if(!m) return;
  document.getElementById('byggmoteNrDisplay').textContent = m.moteNr || '—';
  document.getElementById('byggmoteDatumInput').value = m.datum || '';
  document.getElementById('byggmoteOrtDisplay').textContent = currentProjectOrt() || '—';

  const narvBody = document.getElementById('byggmoteNarvarandeBody');
  narvBody.innerHTML = '';
  m.narvarande.forEach((p, idx) => {
    const row = document.createElement('tr');
    row.innerHTML = '<td></td><td></td><td></td>';
    const namnInput = document.createElement('input');
    namnInput.type = 'text';
    namnInput.value = p.namn || '';
    namnInput.style.cssText = 'width:100%;box-sizing:border-box;border:1px solid var(--line-soft);border-radius:5px;padding:5px 7px;font-size:13px;';
    namnInput.onchange = () => { p.namn = namnInput.value; persistByggmoten(); };
    row.children[0].appendChild(namnInput);
    const foretagInput = document.createElement('input');
    foretagInput.type = 'text';
    foretagInput.value = p.foretag || '';
    foretagInput.style.cssText = namnInput.style.cssText;
    foretagInput.onchange = () => { p.foretag = foretagInput.value; persistByggmoten(); };
    row.children[1].appendChild(foretagInput);
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'remove-btn';
    removeBtn.title = 'Ta bort';
    removeBtn.textContent = '✕';
    removeBtn.onclick = () => { m.narvarande.splice(idx, 1); persistByggmoten(); renderByggmoteForm(); };
    row.children[2].appendChild(removeBtn);
    row.children[2].className = 'row-actions';
    narvBody.appendChild(row);
  });

  const punkterList = document.getElementById('byggmotePunkterList');
  punkterList.innerHTML = '';
  m.punkter.forEach((p, idx) => {
    const row = document.createElement('div');
    row.className = 'byggmote-punkt-row';
    const top = document.createElement('div');
    top.className = 'byggmote-punkt-row-top';
    const nrSpan = document.createElement('span');
    nrSpan.style.cssText = 'font-family:\'JetBrains Mono\',monospace;font-size:12px;color:var(--ink-soft);';
    nrSpan.textContent = (idx + 1) + '.';
    top.appendChild(nrSpan);
    const rubrikInput = document.createElement('input');
    rubrikInput.type = 'text';
    rubrikInput.placeholder = 'Rubrik';
    rubrikInput.value = p.rubrik || '';
    rubrikInput.onchange = () => { p.rubrik = rubrikInput.value; persistByggmoten(); };
    top.appendChild(rubrikInput);
    const ansvarigInput = document.createElement('input');
    ansvarigInput.type = 'text';
    ansvarigInput.className = 'byggmote-punkt-ansvarig';
    ansvarigInput.placeholder = 'Ansvarig';
    ansvarigInput.value = p.ansvarig || '';
    ansvarigInput.onchange = () => { p.ansvarig = ansvarigInput.value; persistByggmoten(); };
    top.appendChild(ansvarigInput);
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'remove-btn';
    removeBtn.title = 'Ta bort punkt';
    removeBtn.textContent = '✕';
    removeBtn.onclick = () => { m.punkter.splice(idx, 1); persistByggmoten(); renderByggmoteForm(); };
    top.appendChild(removeBtn);
    row.appendChild(top);

    const anteckningar = document.createElement('div');
    anteckningar.className = 'byggmote-punkt-anteckningar';
    anteckningar.contentEditable = 'true';
    anteckningar.setAttribute('data-placeholder', 'Anteckningar');
    anteckningar.innerHTML = p.anteckningar || '';
    anteckningar.oninput = () => { p.anteckningar = anteckningar.innerHTML; };
    anteckningar.onblur = () => { p.anteckningar = anteckningar.innerHTML; persistByggmoten(); };

    const toolbar = document.createElement('div');
    toolbar.className = 'byggmote-anteckningar-toolbar';
    const toolbarLabel = document.createElement('span');
    toolbarLabel.className = 'byggmote-anteckningar-toolbar-label';
    toolbarLabel.textContent = 'Färg på markerad text:';
    toolbar.appendChild(toolbarLabel);
    const swatches = document.createElement('div');
    swatches.className = 'byggmote-color-swatches';
    ['red', 'yellow', 'green'].forEach(c => {
      const swatchBtn = document.createElement('button');
      swatchBtn.type = 'button';
      swatchBtn.className = 'byggmote-color-swatch ' + c;
      swatchBtn.title = c === 'red' ? 'Rött' : c === 'yellow' ? 'Gult' : 'Grönt';
      swatchBtn.onmousedown = e => e.preventDefault();
      swatchBtn.onclick = () => applyByggmoteTextColor(anteckningar, p, BYGGMOTE_COLOR_HEX[c]);
      swatches.appendChild(swatchBtn);
    });
    toolbar.appendChild(swatches);
    const clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'byggmote-color-clear-btn';
    clearBtn.textContent = 'Rensa färg';
    clearBtn.onmousedown = e => e.preventDefault();
    clearBtn.onclick = () => applyByggmoteTextColor(anteckningar, p, null);
    toolbar.appendChild(clearBtn);
    row.appendChild(toolbar);
    row.appendChild(anteckningar);
    punkterList.appendChild(row);
  });
}

const BYGGMOTE_COLOR_HEX = { red: '#B23B3B', yellow: '#B5762C', green: '#4C7A5E' };
function applyByggmoteTextColor(el, p, colorHex){
  el.focus();
  document.execCommand('styleWithCSS', false, true);
  document.execCommand('foreColor', false, colorHex || '#22190F');
  p.anteckningar = el.innerHTML;
  persistByggmoten();
}

document.getElementById('byggmoteNewBtn').onclick = () => {
  const m = emptyByggmote();
  byggmoteList.push(m);
  persistByggmoten();
  openByggmoteForm(m.id);
};
document.getElementById('byggmoteBackBtn').onclick = closeByggmoteForm;
document.getElementById('byggmoteDatumInput').onchange = e => {
  const m = currentByggmote(); if(!m) return;
  m.datum = e.target.value; persistByggmoten();
};
document.getElementById('byggmoteAddNarvarandeBtn').onclick = () => {
  const m = currentByggmote(); if(!m) return;
  m.narvarande.push({ namn: '', foretag: '' });
  persistByggmoten();
  renderByggmoteForm();
};
document.getElementById('byggmoteAddPunktBtn').onclick = () => {
  const m = currentByggmote(); if(!m) return;
  m.punkter.push({ rubrik: '', anteckningar: '', ansvarig: '' });
  persistByggmoten();
  renderByggmoteForm();
};
document.getElementById('byggmoteSaveBtn').onclick = async () => {
  await persistByggmoten();
  showToast('Byggmötet sparat');
  closeByggmoteForm();
};
document.getElementById('byggmotePdfBtn').onclick = () => {
  const m = currentByggmote();
  if(!m) return;
  const proj = projects.find(p => p.id === activeProjectId);
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text('Byggmötesprotokoll' + (proj ? ' – ' + proj.name : ''), 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text('Möte nr: ' + (m.moteNr || '—') + '    Datum: ' + (m.datum || '—') + '    Ort: ' + (currentProjectOrt() || '—'), 14, 24);

  let y = 32;
  const attendees = m.narvarande.filter(p => p.namn || p.foretag);
  if(attendees.length){
    doc.setFontSize(12);
    doc.setTextColor(20);
    doc.text('Närvarande', 14, y);
    doc.autoTable({
      startY: y + 4,
      head: [['Namn', 'Företag']],
      body: attendees.map(p => [p.namn || '', p.foretag || '']),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [58, 44, 32] },
      margin: { left: 14, right: 14 }
    });
    y = doc.lastAutoTable.finalY + 10;
  }

  doc.setFontSize(12);
  doc.setTextColor(20);
  doc.text('Punkter', 14, y);
  doc.autoTable({
    startY: y + 4,
    head: [['#', 'Punkt', 'Anteckningar', 'Ansvarig']],
    body: m.punkter.map((p, i) => [String(i + 1), p.rubrik || '', stripHtml(p.anteckningar), p.ansvarig || '']),
    styles: { fontSize: 9, valign: 'top' },
    headStyles: { fillColor: [58, 44, 32] },
    columnStyles: { 0: { cellWidth: 8 }, 1: { cellWidth: 32 }, 3: { cellWidth: 26 } },
    margin: { left: 14, right: 14 }
  });

  const fileNamePart = proj ? '-' + proj.name.replace(/[^a-zA-Z0-9åäöÅÄÖ]+/g, '-') : '';
  doc.save('Byggmotesprotokoll-' + (m.moteNr || 'utan-nr') + fileNamePart + '.pdf');
};
document.getElementById('byggmoteDeleteBtn').onclick = async () => {
  const m = currentByggmote(); if(!m) return;
  byggmoteList = byggmoteList.filter(x => x.id !== m.id);
  await persistByggmoten();
  closeByggmoteForm();
};

const SYNC_INTERVAL_MS = 30 * 60 * 1000; // 30 minuter - bara ett fåtal personer använder verktyget

document.getElementById('manualSyncBtn').onclick = () => {
  if(!saving && activeProjectId) loadApartments(true);
};

setInterval(() => {
  if(!saving && activeProjectId && screen === 'project' && projectSubView === 'checklista') loadApartments(true);
}, SYNC_INTERVAL_MS);
setInterval(() => { loadProjects(); }, SYNC_INTERVAL_MS);
setInterval(() => {
  if(screen === 'calendar') loadAllEvents().then(renderCalendar);
}, SYNC_INTERVAL_MS);
setInterval(() => {
  if(screen === 'intressen') loadInterests().then(renderIntressenScreen);
  if(screen === 'project' && projectSubView === 'intressenter') loadInterests().then(renderIntressenterTab);
}, SYNC_INTERVAL_MS);

async function init(){
  await loadProjects();
  const info = await DB.getCurrentUserInfo();
  myEmail = (info.email || '').toLowerCase();
  isEkonomiAdmin = myEmail === EKONOMI_ADMIN_EMAIL;
  document.getElementById('goToEkonomiCard').style.display = isEkonomiAdmin ? 'block' : 'none';
  if(isEkonomiAdmin) await loadEkonomiData();
  myName = PERSONAL_NAMES_BY_EMAIL[myEmail] || info.name || '';
  myPersonId = info.id;
  renderNameUI();
  openPersonal();
}

// ---------- Personlig inloggning (eget konto per medarbetare) ----------
function showPersonalLoginError(msg){
  const el = document.getElementById('personalLoginError');
  el.textContent = msg;
  el.style.display = 'block';
}

async function attemptPersonalLogin(){
  const email = document.getElementById('personalLoginEmail').value.trim();
  const password = document.getElementById('personalLoginPassword').value;
  if(!email || !password) return;
  const btn = document.getElementById('personalLoginSubmit');
  btn.disabled = true;
  try{
    const res = await DB.signIn(email, password);
    if(res.ok){
      document.getElementById('codeGateOverlay').classList.remove('open');
      await startApp();
    } else {
      showPersonalLoginError('Fel e-post eller lösenord, försök igen.');
    }
  }catch(e){
    showPersonalLoginError('Kunde inte logga in just nu. Försök igen om en stund.');
  }finally{
    btn.disabled = false;
  }
}
document.getElementById('personalLoginSubmit').onclick = attemptPersonalLogin;
document.getElementById('personalLoginPassword').addEventListener('keydown', e => {
  if(e.key === 'Enter') attemptPersonalLogin();
});

// ---------- Realtidssynk: ersätter/kompletterar 30-minuterspollningen ovan ----------
// När någon annan sparar en ändring (i Supabase, eller i en annan flik lokalt i mock-läge)
// triggas detta direkt istället för att vänta på nästa polling-intervall.
function wireRemoteSync(){
  DB.onRemoteChange(function(key){
    if(key === PROJECTS_KEY){
      loadProjects();
    } else if(key.indexOf('apartments:') === 0){
      const pid = key.slice('apartments:'.length);
      if(pid === activeProjectId && screen === 'project' && projectSubView === 'checklista') loadApartments(false);
      if(screen === 'calendar') loadAllEvents().then(renderCalendar);
      if(screen === 'home') loadProjects();
    } else if(key === INTR_STORAGE_KEY){
      loadInterests().then(() => {
        if(screen === 'intressen') renderIntressenScreen();
        if(screen === 'project' && projectSubView === 'intressenter') renderIntressenterTab();
      });
    }
  });
}

async function startApp(){
  await init();
  wireRemoteSync();
}

(async function boot(){
  if(await DB.isAuthenticated()){
    document.getElementById('codeGateOverlay').classList.remove('open');
    await startApp();
  }
})();
