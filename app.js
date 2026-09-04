const PROJECTS_KEY = 'projects-list';
const NAME_KEY = 'my-name';
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
let screen = 'home'; // 'home' | 'project' | 'calendar'
let projectSubView = 'checklista'; // 'checklista' | 'ekonomi'
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
    (err && (err.message || err.toString ? err.toString() : JSON.stringify(err)));
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
    tillval: emptyNote()
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
  if(!apt.tillval || typeof apt.tillval !== 'object') apt.tillval = emptyNote();
  if(typeof apt.tillval.note !== 'string') apt.tillval.note = '';
  if(typeof apt.tillval.invoicedCustomer !== 'boolean') apt.tillval.invoicedCustomer = false;
  if(typeof apt.tillval.invoicedLoan !== 'boolean') apt.tillval.invoicedLoan = false;
  if(typeof apt.tillval.amount !== 'string') apt.tillval.amount = '';
  return apt;
}

// ---------- Name ----------
async function loadName(){
  try{
    const res = await window.storage.get(NAME_KEY, false);
    if(res && res.value) myName = res.value;
  }catch(e){
    // no name saved yet is expected on first visit — not shown as an error
  }
  renderNameUI();
}
async function saveName(name){
  myName = name;
  try{ await window.storage.set(NAME_KEY, name, false); }
  catch(e){ showDebugError('Kunde inte spara namn (saveName)', e); }
  renderNameUI();
}
function renderNameUI(){
  const gate = document.getElementById('nameGate');
  const current = document.getElementById('currentUser');
  if(myName){
    gate.style.display = 'none';
    current.style.display = 'flex';
    document.getElementById('currentUserName').textContent = myName;
  } else {
    gate.style.display = 'flex';
    current.style.display = 'none';
  }
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

document.getElementById('addProjectBtn').onclick = async () => {
  const input = document.getElementById('newProjectInput');
  const name = input.value.trim();
  if(!name) return;
  if(projects.some(p => p.name.toLowerCase() === name.toLowerCase())){
    showToast('Det finns redan ett projekt med det namnet');
    return;
  }
  projects.push({ id: slugId(name), name });
  input.value = '';
  renderHomeGrid();
  await persistProjects();
};
document.getElementById('newProjectInput').addEventListener('keydown', e => {
  if(e.key === 'Enter') document.getElementById('addProjectBtn').click();
});

// ---------- Navigation: hem / projekt / kalender ----------
function formatMSEK(value){
  if(!value && value !== 0) return '—';
  return (value / 1000000).toLocaleString('sv-SE', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' MSEK';
}

async function loadProjectSummary(p){
  const summary = { lghText: 'Inga lägenheter ännu', omsattning: null, lan: PROJECT_LOAN_BY_NAME[p.name] || null };
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

async function renderHomeGrid(){
  const grid = document.getElementById('homeGrid');
  grid.innerHTML = '';

  projects.forEach(p => {
    const card = document.createElement('div');
    card.className = 'home-card';
    card.innerHTML =
      '<div class="home-card-title">' + escapeHtml(p.name) + '</div>' +
      '<div class="home-card-sub" id="sub-' + p.id + '">Laddar…</div>' +
      '<div class="home-card-figures" id="fig-' + p.id + '"></div>';
    card.onclick = () => openProject(p);
    grid.appendChild(card);
  });

  const calCard = document.createElement('div');
  calCard.className = 'home-card calendar-card';
  calCard.innerHTML = '<div class="home-card-icon">📅</div><div class="home-card-title">Kalender</div><div class="home-card-sub">Besiktningar &amp; inflyttningar, alla projekt</div>';
  calCard.onclick = () => openCalendarScreen();
  grid.appendChild(calCard);

  const intrCard = document.createElement('div');
  intrCard.className = 'home-card calendar-card';
  intrCard.innerHTML = '<div class="home-card-icon">📋</div><div class="home-card-title">Intresseanmälningar</div><div class="home-card-sub" id="intrHomeCardSub">Laddar…</div>';
  intrCard.onclick = () => openIntressenScreen();
  grid.appendChild(intrCard);

  loadInterests().then(() => {
    const el = document.getElementById('intrHomeCardSub');
    if(el){
      const open = interests.filter(e => !e.hanterad).length;
      el.textContent = interests.length + ' totalt · ' + open + ' ej hanterade';
    }
  });

  // Fyll i sammanfattning per projekt asynkront utan att blockera renderingen
  projects.forEach(async p => {
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
  document.getElementById('homeScreen').style.display = screen === 'home' ? 'block' : 'none';
  document.getElementById('projectScreen').style.display = screen === 'project' ? 'block' : 'none';
  document.getElementById('calendarScreen').style.display = screen === 'calendar' ? 'block' : 'none';
  document.getElementById('intressenScreen').style.display = screen === 'intressen' ? 'block' : 'none';
}

function openHome(){
  showScreen('home');
  renderHomeGrid();
}

function openProject(p){
  activeProjectId = p.id;
  projectSubView = 'checklista';
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
  document.getElementById('ekonomiSubview').style.display = view === 'ekonomi' ? 'block' : 'none';
  document.getElementById('medlemsinfoSubview').style.display = view === 'medlemsinfo' ? 'block' : 'none';
  document.getElementById('intressenterSubview').style.display = view === 'intressenter' ? 'block' : 'none';
  if(view === 'ekonomi') loadEkonomi(activeProjectId);
  if(view === 'medlemsinfo') renderMedlemsinfo();
  if(view === 'intressenter') loadInterests().then(renderIntressenterTab);
}

function openCalendarScreen(){
  showScreen('calendar');
  loadAllEvents().then(renderCalendar);
}

document.querySelectorAll('.sub-tab').forEach(btn => {
  btn.onclick = () => setProjectSubView(btn.dataset.view);
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

    tr.appendChild(makeEditableTextCell(apt, 'anlaggningsid', 'Anläggnings-ID…'));

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
    empty.textContent = 'Inga lägenheter tillagda i det här projektet än.';
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
  if(!myName){ showToast('Ange ditt namn först'); closeSaldModal(); document.getElementById('nameInput').focus(); return; }
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
  if(!myName){ showToast('Ange ditt namn först'); closeSlutbetaldModal(); document.getElementById('nameInput').focus(); return; }
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
    if(!myName){ showToast('Ange ditt namn först'); document.getElementById('nameInput').focus(); return; }
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
  if(!myName){ showToast('Ange ditt namn först'); closeTillvalModal(); document.getElementById('nameInput').focus(); return; }
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
    if(!myName){ showToast('Ange ditt namn först'); document.getElementById('nameInput').focus(); input.value = apt[field].date || ''; return; }
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

document.getElementById('nameSave').onclick = () => {
  const val = document.getElementById('nameInput').value.trim();
  if(val) saveName(val);
};
document.getElementById('nameInput').addEventListener('keydown', e => {
  if(e.key === 'Enter'){ const v = e.target.value.trim(); if(v) saveName(v); }
});
document.getElementById('changeName').onclick = () => {
  myName = ''; renderNameUI(); document.getElementById('nameInput').focus();
};

// ---------- Ekonomi ----------
function ekonomiKey(projectId){ return 'ekonomi:' + projectId; }

function emptyEkonomi(){
  return { budget: { intakter: '', kostnader: '' }, sieFiles: [] };
}

let ekonomiData = emptyEkonomi();
let ekonomiSaving = false;

async function loadEkonomi(projectId){
  if(!projectId) return;
  try{
    const res = await window.storage.get(ekonomiKey(projectId), true);
    ekonomiData = (res && res.value) ? JSON.parse(res.value) : emptyEkonomi();
  }catch(e){
    ekonomiData = emptyEkonomi();
  }
  if(!ekonomiData.budget) ekonomiData.budget = { intakter: '', kostnader: '' };
  if(!Array.isArray(ekonomiData.sieFiles)) ekonomiData.sieFiles = [];
  renderEkonomi();
}

async function persistEkonomi(){
  ekonomiSaving = true;
  try{
    await withRetry(() => window.storage.set(ekonomiKey(activeProjectId), JSON.stringify(ekonomiData), true));
    clearDebugError();
  }catch(e){
    showDebugError('Kunde inte spara ekonomidata', e, () => persistEkonomi());
    showToast('Kunde inte spara – klicka "Försök spara igen" nedan');
  }
  ekonomiSaving = false;
}

// Enkel SIE4-tolkning: läser #RES-rader och summerar intäkter (konto 3xxx) och
// kostnader (konto 4xxx-8xxx) för innevarande räkenskapsår (årsnummer 0).
// Filen avkodas som PC8/CP437 enligt SIE-standarden (se decodeCp437 ovan).
function parseSieText(text){
  const lines = text.split(/\r\n|\r|\n/);
  let companyName = '';
  let periodLabel = '';
  let intakter = 0;
  let kostnader = 0;
  let foundViaRes = false;
  let ubIntakter = 0;
  let ubKostnader = 0;
  let foundViaUb = false;

  function tokenize(line){
    const tokens = [];
    const re = /"([^"]*)"|(\S+)/g;
    let m;
    while((m = re.exec(line)) !== null){
      tokens.push(m[1] !== undefined ? m[1] : m[2]);
    }
    return tokens;
  }

  lines.forEach(line => {
    const trimmed = line.trim();
    if(!trimmed) return;

    if(trimmed.startsWith('#FNAMN')){
      const tokens = tokenize(trimmed);
      companyName = tokens[1] || '';
    } else if(trimmed.startsWith('#RAR')){
      const tokens = tokenize(trimmed);
      if(tokens[1] === '0'){
        const start = tokens[2] || '';
        const end = tokens[3] || '';
        periodLabel = (start.slice(0,4)) + (end && end.slice(0,4) !== start.slice(0,4) ? '–' + end.slice(0,4) : '');
      }
    } else if(trimmed.startsWith('#RES')){
      const tokens = tokenize(trimmed);
      const yearNr = tokens[1];
      const konto = tokens[2];
      const belopp = parseFloat((tokens[3] || '0').replace(',', '.'));
      if(yearNr === '0' && konto && !isNaN(belopp)){
        const firstDigit = konto.charAt(0);
        if(firstDigit === '3'){
          intakter += -belopp; // intäktskonton är normalt kreditsaldo (negativt i SIE)
          foundViaRes = true;
        } else if(['4','5','6','7','8'].includes(firstDigit)){
          kostnader += belopp;
          foundViaRes = true;
        }
      }
    } else if(trimmed.startsWith('#UB')){
      // Reserv om filen saknar #RES: använd saldot på resultatkonton (3xxx-8xxx) istället.
      const tokens = tokenize(trimmed);
      const yearNr = tokens[1];
      const konto = tokens[2];
      const belopp = parseFloat((tokens[3] || '0').replace(',', '.'));
      if(yearNr === '0' && konto && !isNaN(belopp)){
        const firstDigit = konto.charAt(0);
        if(firstDigit === '3'){
          ubIntakter += -belopp;
          foundViaUb = true;
        } else if(['4','5','6','7','8'].includes(firstDigit)){
          ubKostnader += belopp;
          foundViaUb = true;
        }
      }
    }
  });

  if(!foundViaRes && foundViaUb){
    intakter = ubIntakter;
    kostnader = ubKostnader;
  }

  if(!foundViaRes && !foundViaUb){
    throw new Error(
      'Hittade inga resultatposter (varken #RES eller #UB på konto 3xxx–8xxx) för innevarande år i filen. ' +
      'Om projektet fortfarande är under uppförande kan det bero på att alla kostnader hittills ligger kapitaliserade ' +
      'på balanskonton (t.ex. "Pågående nyanläggningar") istället för bokförda som resultatposter — det är i så fall ' +
      'korrekt att inget utfall finns att visa ännu.'
    );
  }

  return { companyName, periodLabel, intakter, kostnader };
}

// SIE-standarden anger PC8 (CP437, den gamla DOS-kodningen) som teckenkodning.
// Webbläsare saknar inbyggt stöd för CP437 i TextDecoder, så vi avkodar själva.
// Tabellen nedan täcker byte 128–255 (0x80–0xFF) i CP437-ordning.
const CP437_HIGH = 'ÇüéâäàåçêëèïîìÄÅÉæÆôöòûùÿÖÜ¢£¥₧ƒáíóúñÑªº¿⌐¬½¼¡«»░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀αßΓπΣσµτΦΘΩδ∞φε∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²■\u00A0';

function decodeCp437(arrayBuffer){
  const bytes = new Uint8Array(arrayBuffer);
  let out = '';
  for(let i = 0; i < bytes.length; i++){
    const b = bytes[i];
    out += b < 128 ? String.fromCharCode(b) : CP437_HIGH[b - 128];
  }
  return out;
}

function readFileWithEncoding(file){
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try{
        resolve(decodeCp437(reader.result));
      }catch(e){ reject(e); }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

document.getElementById('sieUploadBtn').onclick = () => {
  document.getElementById('sieFileInput').click();
};

document.getElementById('sieFileInput').addEventListener('change', async (e) => {
  const files = Array.from(e.target.files || []);
  if(!files.length) return;
  if(!myName){ showToast('Ange ditt namn först'); document.getElementById('nameInput').focus(); e.target.value = ''; return; }

  const statusEl = document.getElementById('sieUploadStatus');
  let okCount = 0, failCount = 0;

  for(const file of files){
    statusEl.textContent = 'Läser ' + file.name + '…';
    try{
      const text = await readFileWithEncoding(file);
      const parsed = parseSieText(text);
      ekonomiData.sieFiles.push({
        id: uid(),
        filename: file.name,
        companyName: parsed.companyName,
        periodLabel: parsed.periodLabel,
        intakter: parsed.intakter,
        kostnader: parsed.kostnader,
        uploadedBy: myName,
        uploadedAt: new Date().toISOString()
      });
      okCount++;
    }catch(err){
      failCount++;
      showDebugError('Kunde inte läsa SIE-filen "' + file.name + '"', err);
    }
  }

  statusEl.textContent = okCount ? okCount + ' fil(er) inlästa' + (failCount ? ', ' + failCount + ' misslyckades' : '') : 'Inläsning misslyckades';
  e.target.value = '';
  renderEkonomi();
  await persistEkonomi();
});

async function removeSieFile(id){
  ekonomiData.sieFiles = ekonomiData.sieFiles.filter(f => f.id !== id);
  renderEkonomi();
  await persistEkonomi();
}

document.getElementById('budgetIntakterInput').addEventListener('blur', async (e) => {
  ekonomiData.budget.intakter = e.target.value.replace(/[^0-9]/g, '').trim();
  renderEkonomi();
  await persistEkonomi();
});
document.getElementById('budgetKostnaderInput').addEventListener('blur', async (e) => {
  ekonomiData.budget.kostnader = e.target.value.replace(/[^0-9]/g, '').trim();
  renderEkonomi();
  await persistEkonomi();
});

function renderEkonomi(){
  // Filist
  const listEl = document.getElementById('sieFileList');
  listEl.innerHTML = '';
  if(ekonomiData.sieFiles.length === 0){
    listEl.innerHTML = '<div class="eko-empty">Inga SIE-filer uppladdade ännu.</div>';
  } else {
    ekonomiData.sieFiles.forEach(f => {
      const row = document.createElement('div');
      row.className = 'eko-file-row';
      row.innerHTML =
        '<div class="eko-file-info">' +
          '<span class="eko-file-name">' + escapeHtml(f.filename) + (f.periodLabel ? ' · ' + escapeHtml(f.periodLabel) : '') + '</span>' +
          '<span class="eko-file-meta">Uppladdad av ' + escapeHtml(f.uploadedBy || '—') + ' · ' + timeAgo(f.uploadedAt) + '</span>' +
        '</div>' +
        '<div class="eko-file-figures">' +
          '<span>Int. <strong>' + formatNumberSv(Math.round(f.intakter)) + ' kr</strong></span>' +
          '<span>Kostn. <strong>' + formatNumberSv(Math.round(f.kostnader)) + ' kr</strong></span>' +
        '</div>';
      const rmBtn = document.createElement('button');
      rmBtn.className = 'eko-remove-file';
      rmBtn.textContent = '✕';
      rmBtn.title = 'Ta bort fil';
      rmBtn.onclick = () => removeSieFile(f.id);
      row.appendChild(rmBtn);
      listEl.appendChild(row);
    });
  }

  // Budgetfält (fyll bara i om användaren inte just nu skriver i dem)
  const intakterInput = document.getElementById('budgetIntakterInput');
  const kostnaderInput = document.getElementById('budgetKostnaderInput');
  if(document.activeElement !== intakterInput) intakterInput.value = ekonomiData.budget.intakter || '';
  if(document.activeElement !== kostnaderInput) kostnaderInput.value = ekonomiData.budget.kostnader || '';

  // Jämförelse
  const utfallIntakter = ekonomiData.sieFiles.reduce((s, f) => s + (f.intakter || 0), 0);
  const utfallKostnader = ekonomiData.sieFiles.reduce((s, f) => s + (f.kostnader || 0), 0);
  const utfallResultat = utfallIntakter - utfallKostnader;

  const budgetIntakter = parseInt(ekonomiData.budget.intakter || '0', 10) || 0;
  const budgetKostnader = parseInt(ekonomiData.budget.kostnader || '0', 10) || 0;
  const budgetResultat = budgetIntakter - budgetKostnader;

  function diffCell(utfall, budget, higherIsBetter){
    const diff = utfall - budget;
    const good = higherIsBetter ? diff >= 0 : diff <= 0;
    const sign = diff > 0 ? '+' : '';
    return '<span class="' + (diff === 0 ? '' : (good ? 'eko-diff-positive' : 'eko-diff-negative')) + '">' +
      sign + formatNumberSv(Math.round(diff)) + ' kr</span>';
  }

  function progressBar(utfall, budget){
    if(!budget) return '';
    const pct = Math.min(100, Math.max(0, Math.round((utfall / budget) * 100)));
    return '<div class="eko-progress-track"><div class="eko-progress-fill" style="width:' + pct + '%"></div></div>' +
      '<div style="font-size:10.5px; color:var(--ink-soft); font-family:\'JetBrains Mono\',monospace; margin-top:2px;">' + pct + '% av budget</div>';
  }

  const wrap = document.getElementById('ekoCompareWrap');
  if(ekonomiData.sieFiles.length === 0 && !budgetIntakter && !budgetKostnader){
    wrap.innerHTML = '<div class="eko-empty">Ladda upp minst en SIE-fil och/eller fyll i en budget för att se jämförelsen.</div>';
    return;
  }

  wrap.innerHTML =
    '<table class="eko-compare-table">' +
      '<thead><tr><th>Post</th><th>Utfall</th><th>Budget</th><th>Avvikelse</th></tr></thead>' +
      '<tbody>' +
        '<tr>' +
          '<td>Intäkter</td>' +
          '<td>' + formatNumberSv(Math.round(utfallIntakter)) + ' kr' + progressBar(utfallIntakter, budgetIntakter) + '</td>' +
          '<td>' + (budgetIntakter ? formatNumberSv(budgetIntakter) + ' kr' : '—') + '</td>' +
          '<td>' + (budgetIntakter ? diffCell(utfallIntakter, budgetIntakter, true) : '—') + '</td>' +
        '</tr>' +
        '<tr>' +
          '<td>Kostnader</td>' +
          '<td>' + formatNumberSv(Math.round(utfallKostnader)) + ' kr' + progressBar(utfallKostnader, budgetKostnader) + '</td>' +
          '<td>' + (budgetKostnader ? formatNumberSv(budgetKostnader) + ' kr' : '—') + '</td>' +
          '<td>' + (budgetKostnader ? diffCell(utfallKostnader, budgetKostnader, false) : '—') + '</td>' +
        '</tr>' +
        '<tr class="eko-row-resultat">' +
          '<td>Resultat</td>' +
          '<td>' + formatNumberSv(Math.round(utfallResultat)) + ' kr</td>' +
          '<td>' + ((budgetIntakter || budgetKostnader) ? formatNumberSv(budgetResultat) + ' kr' : '—') + '</td>' +
          '<td>' + ((budgetIntakter || budgetKostnader) ? diffCell(utfallResultat, budgetResultat, true) : '—') + '</td>' +
        '</tr>' +
      '</tbody>' +
    '</table>';
}

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
  row.className = 'intr-row' + (entry.hanterad ? ' handled' : '') + (overdue ? ' overdue' : '');

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
  nameSpan.className = 'intr-name' + (entry.hanterad ? ' handled' : '');
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
  await loadName();
  await loadProjects();
  openHome();
}

// ---------- Delad åtkomstkod ----------
// Gatern i sig avgör bara OM appen visas. Vem-är-du (myName) hanteras som förut av name-gaten.
function showCodeGateError(msg){
  const el = document.getElementById('codeGateError');
  el.textContent = msg;
  el.style.display = 'block';
}

async function attemptCodeGate(code){
  if(!code) return;
  const btn = document.getElementById('codeGateSubmit');
  btn.disabled = true;
  try{
    const ok = await DB.checkAccessCode(code);
    if(ok){
      document.getElementById('codeGateOverlay').classList.remove('open');
      await startApp();
    } else {
      showCodeGateError('Fel kod, försök igen.');
    }
  }catch(e){
    showCodeGateError('Kunde inte verifiera koden just nu. Försök igen om en stund.');
  }finally{
    btn.disabled = false;
  }
}

document.getElementById('codeGateSubmit').onclick = () => {
  attemptCodeGate(document.getElementById('codeGateInput').value.trim());
};
document.getElementById('codeGateInput').addEventListener('keydown', e => {
  if(e.key === 'Enter') attemptCodeGate(e.target.value.trim());
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
    } else if(key.indexOf('ekonomi:') === 0){
      const pid = key.slice('ekonomi:'.length);
      if(pid === activeProjectId && screen === 'project' && projectSubView === 'ekonomi'){
        loadEkonomi(activeProjectId).then(renderEkonomi);
      }
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
