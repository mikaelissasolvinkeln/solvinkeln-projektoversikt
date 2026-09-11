// ---------------------------------------------------------------------------
// db.js - datalager för Projektöversikt.
//
// Ersätter den gamla artefakt-lagringen (window.storage, scopad till en enskild
// Claude-artefakt) med en riktig delad databas (Supabase/Postgres), samtidigt
// som exakt samma anropskontrakt behålls:
//
//   window.storage.get(key, isProject) -> { value: string } | null
//   window.storage.set(key, value, isProject)
//
// isProject === false  -> personligt/per-webbläsare (t.ex. eget visningsnamn),
//                         sparas alltid lokalt, oavsett Supabase eller ej.
// isProject === true   -> delad data. Sparas i Supabase när config.js har
//                         riktiga uppgifter, annars i localStorage som ett
//                         lokalt testläge (samma kod, ingen omskrivning behövs
//                         den dagen ni kopplar på ett riktigt projekt).
//
// All delad data lagras som rader i en enda tabell, kv_store(key, value),
// eftersom appen redan internt behandlar varje datamängd (projektlistan,
// lägenheterna per projekt, ekonomin per projekt, intresseanmälningarna) som
// EN sammanhållen JSON-klump per nyckel - se schema.sql.
// ---------------------------------------------------------------------------

(function(){
  'use strict';

  const hasSupabase = !!(
    window.SUPABASE_URL && window.SUPABASE_ANON_KEY &&
    window.SUPABASE_URL.indexOf('YOUR_') !== 0 &&
    window.SUPABASE_ANON_KEY.indexOf('YOUR_') !== 0
  );

  const SESSION_FLAG = 'sf-access-granted';
  const LOCAL_PREFIX = 'sf-local:';

  let sb = null;
  if(hasSupabase){
    sb = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
  }

  // ---------- Inloggning (eget konto per medarbetare) ----------
  async function isAuthenticated(){
    if(!hasSupabase) return sessionStorage.getItem(SESSION_FLAG) === '1';
    const { data } = await sb.auth.getSession();
    return !!(data && data.session);
  }

  async function signIn(email, password){
    if(!hasSupabase) return { ok: false, error: 'Kräver att Supabase är påkopplat' };
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if(!error) sessionStorage.setItem(SESSION_FLAG, '1');
    return { ok: !error, error: error ? error.message : null };
  }

  async function getCurrentUserInfo(){
    if(!hasSupabase) return { id: null, email: null, name: '' };
    const { data } = await sb.auth.getUser();
    const user = data && data.user;
    if(!user) return { id: null, email: null, name: '' };
    const name = (user.user_metadata && user.user_metadata.name) || '';
    return { id: user.id, email: user.email, name };
  }

  // ---------- Hjälp för nyskapade tabeller: PostgREST's schema-cache kan vara
  // efter direkt efter att en tabell skapats (kortvarigt PGRST205-fel på just
  // det första anropet efter en sidladdning) - ett enda återförsök efter en
  // kort paus räcker för att undvika att det syns för användaren. ----------
  function isSchemaCacheMiss(error){
    return error && error.code === 'PGRST205';
  }
  function wait(ms){ return new Promise(res => setTimeout(res, ms)); }
  async function withCacheRetry(op){
    let result = await op();
    if(isSchemaCacheMiss(result.error)){
      await wait(1500);
      result = await op();
    }
    return result;
  }

  // ---------- Privat, personlig data (egen tabell, egen RLS - se schema-personal.sql) ----------
  async function getPersonalData(key){
    if(!hasSupabase) return localGet('personal:' + key);
    const { data: userData } = await sb.auth.getUser();
    if(!userData || !userData.user) return null;
    const { data, error } = await withCacheRetry(() => sb.from('personal_data')
      .select('value').eq('user_id', userData.user.id).eq('key', key).maybeSingle());
    if(error) throw error;
    return data ? { value: data.value } : null;
  }
  async function setPersonalData(key, value){
    if(!hasSupabase){ localSet('personal:' + key, value); return; }
    const { data: userData } = await sb.auth.getUser();
    if(!userData || !userData.user) throw new Error('Inte inloggad');
    const row = { user_id: userData.user.id, key, value, updated_at: new Date().toISOString() };
    const { error } = await withCacheRetry(() => sb.from('personal_data').upsert(row));
    if(error) throw error;
  }

  // ---------- Liggaren: ärenden som kan tilldelas en kollega (egen tabell,
  // egen RLS - se schema-liggaren.sql). En rad syns bara för den som skapade
  // den och den den är tilldelad till. ----------
  async function listLiggarenTasks(){
    if(!hasSupabase) return JSON.parse(localGet('liggaren-tasks')?.value || '[]');
    const { data, error } = await withCacheRetry(() => sb.from('liggaren_tasks')
      .select('*').order('created_at', { ascending: false }));
    if(error) throw error;
    return data || [];
  }
  async function insertLiggarenTask(row){
    if(!hasSupabase){
      const tasks = JSON.parse(localGet('liggaren-tasks')?.value || '[]');
      const withId = { ...row, id: 'local-' + Date.now(), created_at: new Date().toISOString() };
      tasks.unshift(withId);
      localSet('liggaren-tasks', JSON.stringify(tasks));
      return withId;
    }
    const { data, error } = await withCacheRetry(() => sb.from('liggaren_tasks').insert(row).select().single());
    if(error) throw error;
    return data;
  }
  async function updateLiggarenTask(id, patch){
    if(!hasSupabase){
      const tasks = JSON.parse(localGet('liggaren-tasks')?.value || '[]');
      const next = tasks.map(t => t.id === id ? { ...t, ...patch } : t);
      localSet('liggaren-tasks', JSON.stringify(next));
      return;
    }
    const row = { ...patch, updated_at: new Date().toISOString() };
    const { error } = await withCacheRetry(() => sb.from('liggaren_tasks').update(row).eq('id', id));
    if(error) throw error;
  }
  async function deleteLiggarenTask(id){
    if(!hasSupabase){
      const tasks = JSON.parse(localGet('liggaren-tasks')?.value || '[]');
      localSet('liggaren-tasks', JSON.stringify(tasks.filter(t => t.id !== id)));
      return;
    }
    const { error } = await withCacheRetry(() => sb.from('liggaren_tasks').delete().eq('id', id));
    if(error) throw error;
  }

  // ---------- Lokalt lager (personlig data + testläge utan Supabase) ----------
  function localGet(key){
    const raw = localStorage.getItem(LOCAL_PREFIX + key);
    return raw === null ? null : { value: raw };
  }
  function localSet(key, value){
    localStorage.setItem(LOCAL_PREFIX + key, value);
  }

  // ---------- Supabase-lager (delad data) ----------
  async function remoteGet(key){
    const { data, error } = await sb.from('kv_store').select('value').eq('key', key).maybeSingle();
    if(error) throw error;
    return data ? { value: data.value } : null;
  }
  async function remoteSet(key, value){
    const { error } = await sb.from('kv_store').upsert({
      key, value,
      updated_by: window.myName || null,
      updated_at: new Date().toISOString()
    });
    if(error) throw error;
  }

  window.storage = {
    async get(key, isProject){
      if(!isProject || !hasSupabase) return localGet(key);
      return remoteGet(key);
    },
    async set(key, value, isProject){
      if(!isProject || !hasSupabase){ localSet(key, value); return; }
      return remoteSet(key, value);
    }
  };

  // ---------- Live-uppdateringar från andra användare ----------
  // App.js registrerar en lyssnare (en enda) som får reda på VILKEN nyckel som
  // ändrats, och avgör själv om den aktuella vyn behöver laddas om.
  const listeners = [];
  function notify(key){
    listeners.forEach(cb => { try{ cb(key); }catch(e){ /* en trasig lyssnare ska inte stoppa de andra */ } });
  }

  // Lokalt testläge: localStorage skickar ett 'storage'-event till ANDRA flikar
  // (inte den flik som själv skrev), vilket gör att man kan testa delning genom
  // att öppna appen i två flikar redan innan Supabase är påkopplat.
  window.addEventListener('storage', (e) => {
    if(e.key && e.key.indexOf(LOCAL_PREFIX) === 0){
      notify(e.key.slice(LOCAL_PREFIX.length));
    }
  });

  if(hasSupabase){
    sb.channel('kv_store-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'kv_store' }, (payload) => {
        const row = payload.new || payload.old;
        if(row && row.key) notify(row.key);
      })
      .subscribe();
  }

  window.DB = {
    isAuthenticated,
    signIn,
    getCurrentUserInfo,
    getPersonalData,
    setPersonalData,
    listLiggarenTasks,
    insertLiggarenTask,
    updateLiggarenTask,
    deleteLiggarenTask,
    onRemoteChange(cb){ listeners.push(cb); },
    hasSupabase
  };
})();
