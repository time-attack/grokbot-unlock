// In-app installer: makes bot replies that list flights render as native flight cards.
// Wraps app.transcript.snapshotsFor() so every transcript view gets cards added to matching text entries.
const fs = require('fs');
const path = require('path');

function installSource() {
  const parser = fs.readFileSync(path.join(__dirname, 'flightparse.js'), 'utf8').replace(/if \(typeof module[^\n]*\n?/, '');
  return `(() => {
  ${parser}
  const app = window.__gbApp; if (!app || !app.transcript) return { ok: false, why: 'no app handle' };
  const T = app.transcript;
  const st = window.__gbFlights || (window.__gbFlights = { origSnapshotsFor: T.snapshotsFor, wrapped: new WeakMap(), cache: new Map(), made: 0, hits: 0 });
  st.fp = __gbFlightParserFactory();
  st.enabled = true;
  const looksLikeFlights = (t) => typeof t === 'string' && /\\$\\s?\\d/.test(t) && /\\b[A-Z0-9]{2}\\s?\\d{1,4}\\b/.test(t) && /\\d\\s*[ap]\\.?m|\\b\\d{1,2}:\\d\\d\\b/i.test(t);
  const contextFor = (entries, i) => {
    for (let j = i - 1; j >= 0 && j >= i - 12; j--) { const e = entries[j]; if (e && e.kind === 'message' && e.role === 'user' && typeof e.content === 'string') return e.content; }
    return '';
  };
  const patchEntry = (e, entries, i) => {
    if (!st.enabled || !e || e.kind !== 'send-message' || !e.message || e.message.type !== 'text' || e.message.cards != null || e.streaming === true) return e;
    const content = e.message.content; if (!looksLikeFlights(content)) return e;
    const key = e.id + '|' + content.length + '|' + (e.seq ?? e.entryVersion ?? '');
    let out = st.cache.get(key);
    if (out === undefined) {
      let built = null; try { built = st.fp.buildCard(content, { contextText: contextFor(entries, i), observedAtMs: e.timestampMs || Date.now() }); } catch (err) { st.lastErr = String(err); }
      out = built ? { ...e, message: { ...e.message, content: built.content, cards: { items: [{ card: built.card }], start: built.start } } } : null;
      st.cache.set(key, out); if (out) st.made++;
    }
    if (out) st.hits++;
    return out || e;
  };
  const wrapSnap = (snap) => {
    if (!snap || !Array.isArray(snap.entries) || !st.enabled) return snap;
    let changed = false; const entries = snap.entries.map((e, i, arr) => { const n = patchEntry(e, arr, i); if (n !== e) changed = true; return n; });
    return changed ? { ...snap, entries } : snap;
  };
  const wrapStore = (store) => {
    if (!store || typeof store.get !== 'function') return store;
    let w = st.wrapped.get(store); if (w) return w;
    let lastIn, lastOut;
    w = { ...store, get: () => { const v = store.get(); if (v !== lastIn) { lastIn = v; lastOut = wrapSnap(v); } return lastOut; }, subscribe: (fn) => store.subscribe(fn) };
    st.wrapped.set(store, w); return w;
  };
  T.snapshotsFor = (agentId, opts) => wrapStore(st.origSnapshotsFor(agentId, opts));
  return { ok: true };
})()`;
}

const UNINSTALL = `(() => { const st = window.__gbFlights; if (!st) return { ok: false }; window.__gbApp.transcript.snapshotsFor = st.origSnapshotsFor; st.enabled = false; delete window.__gbFlights; return { ok: true }; })()`;

// Make open chats pick up the wrapped store: hop to another bot and back.
const REMOUNT = `(async () => {
  const rows = [...document.querySelectorAll('[role=button],button,a,[role=link],[role=treeitem],[role=option]')];
    const label = (b) => (b.getAttribute('aria-label') || b.innerText || '').trim();
    const cur = rows.find((b) => b.getAttribute('aria-current') === 'page' || b.getAttribute('aria-selected') === 'true');
    const curLabel = cur ? label(cur) : null;
    const isBotRow = (b) => !!b.closest('aside, nav, [role=navigation]') && label(b).length > 0 && label(b).length < 60 && !/^(Search|New Bot|Connect apps|Open account menu|Tasks)$/.test(label(b));
    const other = rows.find((b) => isBotRow(b) && label(b) !== curLabel);
  if (other) other.click(); await new Promise((r) => setTimeout(r, 1200));
  const back = curLabel && [...document.querySelectorAll('[role=button],button,a,[role=link],[role=treeitem],[role=option]')].find((b) => label(b) === curLabel);
  if (back) back.click(); await new Promise((r) => setTimeout(r, 2500));
  return { from: curLabel };
})()`;

module.exports = { installSource, UNINSTALL, REMOUNT };
