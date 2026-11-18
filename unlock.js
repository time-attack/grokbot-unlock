#!/usr/bin/env node
// grokbot-unlock: force Grok Bot desktop feature gates ON (client side only).
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.GB_PORT || 9339);
const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const val = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));

async function connect() {
  let list;
  try { list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); }
  catch { throw new Error(`Grok Bot is not running with --remote-debugging-port=${PORT}. Run ./grokbot-unlock.sh`); }
  const pages = list.filter((x) => x.type === 'page' && x.url.includes('renderer/index.html'));
  const t = pages.find((x) => x.title === 'Grok Bot') || pages.find((x) => !x.title.includes('·')) || pages[0];
  if (!t) throw new Error('Grok Bot main window not found');
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.on('open', r); ws.on('error', j); });
  let id = 0; const pend = new Map(); const listeners = [];
  ws.on('message', (raw) => {
    const o = JSON.parse(raw);
    if (o.id && pend.has(o.id)) { pend.get(o.id)(o); pend.delete(o.id); return; }
    for (const l of listeners) l(o);
  });
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const evaluate = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description || 'eval failed');
    return r.result?.result?.value;
  };
  return { ws, send, evaluate, on: (f) => listeners.push(f) };
}

// Installed inside the app. Wraps the gate store's set() so every snapshot written gets the overrides.
const INSTALL = (plan) => `(() => {
  const s = window.__gbSnap; if (!s) return { ok: false, why: 'no store handle' };
  const plan = ${JSON.stringify(plan)};
  const st = window.__gbUnlock || (window.__gbUnlock = { origSet: s.set, origUpdate: s.update });
  st.plan = plan;
  const patch = (snap) => {
    if (!snap || typeof snap !== 'object' || !window.__gbUnlock || !window.__gbUnlock.plan) return snap;
    const p = window.__gbUnlock.plan;
    const fg = { ...(snap.featureGates || {}) };
    for (const g of p.on) fg[g] = true;
    for (const g of p.off) fg[g] = false;
    const dc = { ...(snap.dynamicConfigs || {}) };
    for (const [k, v] of Object.entries(p.dynamicConfigs || {})) dc[k] = { ...(dc[k] || {}), ...v };
    return { ...snap, ...(p.snapshotFlags || {}), featureGates: fg, dynamicConfigs: dc, __gbPatched: true };
  };
  st.patch = patch;
  s.set = (v, n) => st.origSet(patch(v), n);
  if (typeof st.origUpdate === 'function') s.update = (fn, n) => st.origUpdate((prev) => patch(fn(prev)), n);
  const cur = s.get();
  st.origSet(patch(cur), undefined);
  const after = s.get()?.featureGates || {};
  return { ok: true, forcedOn: plan.on.filter((g) => after[g] === true).length, total: plan.on.length };
})()`;

const RESET = `(async () => {
  const s = window.__gbSnap, st = window.__gbUnlock; if (!s || !st) return { ok: false, why: 'nothing installed' };
  s.set = st.origSet; if (st.origUpdate) s.update = st.origUpdate; st.plan = null;
  const raw = await window.desktop.main.getExperimentsSnapshot();
  st.origSet({ ...raw }, undefined); delete window.__gbUnlock; return { ok: true };
})()`;

// The store lives in a module closure, so we pause inside the app's gate reader once to grab it.
async function grabStore(c) {
  if (await c.evaluate('!!(window.__gbSnap && window.__gbApp)')) return true;
  const scripts = [];
  c.on((o) => { if (o.method === 'Debugger.scriptParsed' && /index\.eager-app-[^/]+\.js$/.test(o.params.url)) scripts.push(o.params); });
  await c.send('Debugger.enable');
  await new Promise((r) => setTimeout(r, 1200));
  const sc = scripts[0]; if (!sc) throw new Error('renderer bundle not found');
  const src = (await c.send('Debugger.getScriptSource', { scriptId: sc.scriptId })).result.scriptSource;
  const m = /function (\w+)\(e\)\{return iu\(\$\(\)\.experiments\.snapshots\)\?\.featureGates\?\.\[e\]\?\?!1\}/.exec(src)
         || /function (\w+)\(e\)\{return \w+\(\$\(\)\.experiments\.snapshots\)/.exec(src);
  if (!m) throw new Error('gate reader not found (app version changed?)');
  const pos = m.index + m[0].indexOf('{') + 1; const pre = src.slice(0, pos);
  const line = (pre.match(/\n/g) || []).length; const col = pos - (pre.lastIndexOf('\n') + 1);
  let done; const got = new Promise((r) => (done = r));
  c.on(async (o) => {
    if (o.method !== 'Debugger.paused') return;
    const fr = o.params.callFrames[0];
    await c.send('Debugger.evaluateOnCallFrame', { callFrameId: fr.callFrameId, expression: 'window.__gbApp = $(), window.__gbSnap = $().experiments.snapshots, 1' });
    await c.send('Debugger.resume'); done(true);
  });
  const bp = await c.send('Debugger.setBreakpoint', { location: { scriptId: sc.scriptId, lineNumber: line, columnNumber: col } });
  // Trigger a render that reads a gate: hop to another bot row and back.
  await c.evaluate(`(async () => {
    const rows = [...document.querySelectorAll('[role=button],button,a,[role=link],[role=treeitem],[role=option]')];
    const label = (b) => (b.getAttribute('aria-label') || b.innerText || '').trim();
    const cur = rows.find((b) => b.getAttribute('aria-current') === 'page' || b.getAttribute('aria-selected') === 'true');
    const curLabel = cur ? label(cur) : null;
    const isBotRow = (b) => !!b.closest('aside, nav, [role=navigation]') && label(b).length > 0 && label(b).length < 60 && !/^(Search|New Bot|Connect apps|Open account menu|Tasks)$/.test(label(b));
    const other = rows.find((b) => isBotRow(b) && label(b) !== curLabel);
    other && other.click(); await new Promise((r) => setTimeout(r, 1500));
    const back = curLabel && [...document.querySelectorAll('[role=button],button,a,[role=link],[role=treeitem],[role=option]')].find((b) => label(b) === curLabel);
    back ? back.click() : other && other.click(); return true;
  })()`);
  const ok = await Promise.race([got, new Promise((r) => setTimeout(() => r(false), 15000))]);
  if (bp.result) await c.send('Debugger.removeBreakpoint', { breakpointId: bp.result.breakpointId });
  await c.send('Debugger.disable');
  return ok;
}

function computePlan(gates, opts = {}) {
  const { only, all } = opts;
  let on = only || [...Object.keys(gates).filter((g) => !gates[g]), ...cfg.extraOn];
  if (!all && !only) on = on.filter((g) => !cfg.never.includes(g));
  on = [...new Set(on)];
  return { on, off: cfg.forceOff || [], dynamicConfigs: only ? {} : cfg.dynamicConfigs, snapshotFlags: only ? {} : cfg.snapshotFlags };
}
module.exports = { connect, INSTALL, RESET, computePlan, cfg };

if (require.main === module) (async () => {
  const c = await connect();
  const raw = await c.evaluate('window.desktop.main.getExperimentsSnapshot()');
  const gates = raw.featureGates || {};

  if (has('--list')) {
    const rows = Object.keys(gates).sort().map((g) => `${gates[g] ? 'ON ' : 'off'}  ${g}${cfg.never.includes(g) ? '   (never-list)' : ''}`);
    console.log(rows.join('\n'));
    console.log(`\n${Object.values(gates).filter((v) => !v).length} of ${rows.length} client gates are off for this account.`);
    c.ws.close(); return;
  }

  if (has('--reset')) { console.log(await c.evaluate(RESET)); const fc = require('./flightcards.js'); console.log('flight cards off', await c.evaluate(fc.UNINSTALL)); await c.evaluate(fc.REMOUNT); c.ws.close(); return; }

  const only = val('--only')?.split(',').map((s) => s.trim()).filter(Boolean);
  const plan = computePlan(gates, { only, all: has('--all') });
  const on = plan.on;

  if (!(await grabStore(c))) throw new Error('could not reach the gate store (try clicking around in the app and rerun)');
  const res = await c.evaluate(INSTALL(plan));
  console.log(res.ok ? `Forced ON ${res.forcedOn}/${res.total} gates. Skipped ${cfg.never.length} on the never-list.` : res);
  if (has('--verbose')) console.log('Turned on:\n  ' + on.join('\n  '));
  if (!has('--no-flights')) {
    const fc = require('./flightcards.js');
    const r = await c.evaluate(fc.installSource());
    if (r.ok) { await c.evaluate(fc.REMOUNT); const s = await c.evaluate('(() => { const st = window.__gbFlights; return st ? { made: st.made, err: st.lastErr || null } : null })()'); console.log(`Flight cards: ON (${s.made} flight lists turned into cards so far)`); }
    else console.log('Flight cards: failed', r);
  }
  c.ws.close();
})().catch((e) => { console.error('Error:', e.message); process.exit(1); });
