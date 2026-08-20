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

  const ACCESS_CODE = window.ACCESS_CODE || '';
  const SHARED_EMAIL = window.SHARED_AUTH_EMAIL || 'team@example.com';
  const SESSION_FLAG = 'sf-access-granted';
  const LOCAL_PREFIX = 'sf-local:';

  let sb = null;
  if(hasSupabase){
    sb = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
  }

  // ---------- Åtkomstkod / inloggning ----------
  async function checkAccessCode(code){
    if(!hasSupabase){
      const ok = code === ACCESS_CODE;
      if(ok) sessionStorage.setItem(SESSION_FLAG, '1');
      return ok;
    }
    const { error } = await sb.auth.signInWithPassword({ email: SHARED_EMAIL, password: code });
    return !error;
  }

  async function isAuthenticated(){
    if(!hasSupabase) return sessionStorage.getItem(SESSION_FLAG) === '1';
    const { data } = await sb.auth.getSession();
    return !!(data && data.session);
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
    checkAccessCode,
    isAuthenticated,
    onRemoteChange(cb){ listeners.push(cb); },
    hasSupabase
  };
})();
