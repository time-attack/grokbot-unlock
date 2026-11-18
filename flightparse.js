// Turns a Grok Bot text reply that lists flights into a native `flights` card.
// Runs inside the Grok Bot renderer (injected as a string), and in node for tests.
function __gbFlightParserFactory() {
  const AP = {
    JFK: ['John F. Kennedy International', 'New York', 'America/New_York'], LGA: ['LaGuardia', 'New York', 'America/New_York'],
    EWR: ['Newark Liberty International', 'Newark', 'America/New_York'], BOS: ['Boston Logan International', 'Boston', 'America/New_York'],
    PHL: ['Philadelphia International', 'Philadelphia', 'America/New_York'], DCA: ['Reagan Washington National', 'Washington', 'America/New_York'],
    IAD: ['Washington Dulles International', 'Washington', 'America/New_York'], BWI: ['Baltimore/Washington International', 'Baltimore', 'America/New_York'],
    ATL: ['Hartsfield-Jackson Atlanta International', 'Atlanta', 'America/New_York'], MIA: ['Miami International', 'Miami', 'America/New_York'],
    FLL: ['Fort Lauderdale-Hollywood International', 'Fort Lauderdale', 'America/New_York'], MCO: ['Orlando International', 'Orlando', 'America/New_York'],
    TPA: ['Tampa International', 'Tampa', 'America/New_York'], CLT: ['Charlotte Douglas International', 'Charlotte', 'America/New_York'],
    DTW: ['Detroit Metropolitan', 'Detroit', 'America/Detroit'], ORD: ["O'Hare International", 'Chicago', 'America/Chicago'],
    MDW: ['Chicago Midway International', 'Chicago', 'America/Chicago'], DFW: ['Dallas/Fort Worth International', 'Dallas', 'America/Chicago'],
    DAL: ['Dallas Love Field', 'Dallas', 'America/Chicago'], IAH: ['George Bush Intercontinental', 'Houston', 'America/Chicago'],
    HOU: ['William P. Hobby', 'Houston', 'America/Chicago'], AUS: ['Austin-Bergstrom International', 'Austin', 'America/Chicago'],
    MSP: ['Minneapolis-Saint Paul International', 'Minneapolis', 'America/Chicago'], MSY: ['Louis Armstrong New Orleans International', 'New Orleans', 'America/Chicago'],
    DEN: ['Denver International', 'Denver', 'America/Denver'], SLC: ['Salt Lake City International', 'Salt Lake City', 'America/Denver'],
    PHX: ['Phoenix Sky Harbor International', 'Phoenix', 'America/Phoenix'], LAS: ['Harry Reid International', 'Las Vegas', 'America/Los_Angeles'],
    LAX: ['Los Angeles International', 'Los Angeles', 'America/Los_Angeles'], BUR: ['Hollywood Burbank', 'Burbank', 'America/Los_Angeles'],
    LGB: ['Long Beach', 'Long Beach', 'America/Los_Angeles'], SNA: ['John Wayne', 'Santa Ana', 'America/Los_Angeles'],
    ONT: ['Ontario International', 'Ontario', 'America/Los_Angeles'], SAN: ['San Diego International', 'San Diego', 'America/Los_Angeles'],
    SFO: ['San Francisco International', 'San Francisco', 'America/Los_Angeles'], OAK: ['Oakland International', 'Oakland', 'America/Los_Angeles'],
    SJC: ['San Jose International', 'San Jose', 'America/Los_Angeles'], SEA: ['Seattle-Tacoma International', 'Seattle', 'America/Los_Angeles'],
    PDX: ['Portland International', 'Portland', 'America/Los_Angeles'], HNL: ['Daniel K. Inouye International', 'Honolulu', 'Pacific/Honolulu'],
    OGG: ['Kahului', 'Maui', 'Pacific/Honolulu'], ANC: ['Ted Stevens Anchorage International', 'Anchorage', 'America/Anchorage'],
    YYZ: ['Toronto Pearson International', 'Toronto', 'America/Toronto'], YVR: ['Vancouver International', 'Vancouver', 'America/Vancouver'],
    YUL: ['Montréal-Trudeau International', 'Montreal', 'America/Toronto'], MEX: ['Mexico City International', 'Mexico City', 'America/Mexico_City'],
    CUN: ['Cancún International', 'Cancún', 'America/Cancun'], LHR: ['Heathrow', 'London', 'Europe/London'], LGW: ['Gatwick', 'London', 'Europe/London'],
    CDG: ['Charles de Gaulle', 'Paris', 'Europe/Paris'], ORY: ['Orly', 'Paris', 'Europe/Paris'], AMS: ['Schiphol', 'Amsterdam', 'Europe/Amsterdam'],
    FRA: ['Frankfurt', 'Frankfurt', 'Europe/Berlin'], MUC: ['Munich', 'Munich', 'Europe/Berlin'], ZRH: ['Zurich', 'Zurich', 'Europe/Zurich'],
    MAD: ['Madrid-Barajas', 'Madrid', 'Europe/Madrid'], BCN: ['Barcelona-El Prat', 'Barcelona', 'Europe/Madrid'], FCO: ['Rome Fiumicino', 'Rome', 'Europe/Rome'],
    MXP: ['Milan Malpensa', 'Milan', 'Europe/Rome'], LIS: ['Lisbon', 'Lisbon', 'Europe/Lisbon'], DUB: ['Dublin', 'Dublin', 'Europe/Dublin'],
    IST: ['Istanbul', 'Istanbul', 'Europe/Istanbul'], ATH: ['Athens International', 'Athens', 'Europe/Athens'], VIE: ['Vienna International', 'Vienna', 'Europe/Vienna'],
    CPH: ['Copenhagen', 'Copenhagen', 'Europe/Copenhagen'], DXB: ['Dubai International', 'Dubai', 'Asia/Dubai'], DOH: ['Hamad International', 'Doha', 'Asia/Qatar'],
    TLV: ['Ben Gurion', 'Tel Aviv', 'Asia/Jerusalem'], DEL: ['Indira Gandhi International', 'Delhi', 'Asia/Kolkata'], BOM: ['Chhatrapati Shivaji Maharaj International', 'Mumbai', 'Asia/Kolkata'],
    SIN: ['Changi', 'Singapore', 'Asia/Singapore'], BKK: ['Suvarnabhumi', 'Bangkok', 'Asia/Bangkok'], HKG: ['Hong Kong International', 'Hong Kong', 'Asia/Hong_Kong'],
    TPE: ['Taoyuan International', 'Taipei', 'Asia/Taipei'], NRT: ['Narita International', 'Tokyo', 'Asia/Tokyo'], HND: ['Haneda', 'Tokyo', 'Asia/Tokyo'],
    KIX: ['Kansai International', 'Osaka', 'Asia/Tokyo'], ICN: ['Incheon International', 'Seoul', 'Asia/Seoul'], PEK: ['Beijing Capital International', 'Beijing', 'Asia/Shanghai'],
    PVG: ['Shanghai Pudong International', 'Shanghai', 'Asia/Shanghai'], MNL: ['Ninoy Aquino International', 'Manila', 'Asia/Manila'],
    SYD: ['Sydney Kingsford Smith', 'Sydney', 'Australia/Sydney'], MEL: ['Melbourne', 'Melbourne', 'Australia/Melbourne'], AKL: ['Auckland', 'Auckland', 'Pacific/Auckland'],
    GRU: ['São Paulo/Guarulhos', 'São Paulo', 'America/Sao_Paulo'], EZE: ['Ministro Pistarini', 'Buenos Aires', 'America/Argentina/Buenos_Aires'],
    BOG: ['El Dorado International', 'Bogotá', 'America/Bogota'], LIM: ['Jorge Chávez International', 'Lima', 'America/Lima'], SJU: ['Luis Muñoz Marín International', 'San Juan', 'America/Puerto_Rico'],
  };
  const AIRLINES = {
    AA: 'American Airlines', DL: 'Delta Air Lines', UA: 'United Airlines', WN: 'Southwest Airlines', B6: 'JetBlue', AS: 'Alaska Airlines',
    NK: 'Spirit Airlines', F9: 'Frontier Airlines', HA: 'Hawaiian Airlines', SY: 'Sun Country', G4: 'Allegiant Air', MX: 'Breeze Airways',
    AC: 'Air Canada', WS: 'WestJet', AM: 'Aeroméxico', BA: 'British Airways', VS: 'Virgin Atlantic', AF: 'Air France', KL: 'KLM',
    LH: 'Lufthansa', LX: 'SWISS', OS: 'Austrian', IB: 'Iberia', AY: 'Finnair', SK: 'SAS', TP: 'TAP Air Portugal', EI: 'Aer Lingus',
    TK: 'Turkish Airlines', EK: 'Emirates', QR: 'Qatar Airways', EY: 'Etihad', LY: 'El Al', SQ: 'Singapore Airlines', CX: 'Cathay Pacific',
    BR: 'EVA Air', CI: 'China Airlines', JX: 'STARLUX', NH: 'ANA', JL: 'Japan Airlines', KE: 'Korean Air', OZ: 'Asiana', ZG: 'ZIPAIR',
    QF: 'Qantas', NZ: 'Air New Zealand', LA: 'LATAM', AV: 'Avianca', CM: 'Copa Airlines', AI: 'Air India', TG: 'Thai Airways', VN: 'Vietnam Airlines',
    MU: 'China Eastern', CA: 'Air China', CZ: 'China Southern', PR: 'Philippine Airlines', FI: 'Icelandair', W6: 'Wizz Air', FR: 'Ryanair', U2: 'easyJet',
  };
  const NAME_TO_CODE = {};
  for (const [c, n] of Object.entries(AIRLINES)) NAME_TO_CODE[n.toLowerCase()] = c;
  Object.assign(NAME_TO_CODE, { american: 'AA', delta: 'DL', united: 'UA', southwest: 'WN', jetblue: 'B6', alaska: 'AS', spirit: 'NK', frontier: 'F9', hawaiian: 'HA' });
  const MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12 };

  const pad = (n) => String(n).padStart(2, '0');
  const isoDate = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;

  function findDate(text, nowMs) {
    let m = /\b(20\d\d)-(\d\d)-(\d\d)\b/.exec(text);
    if (m) return isoDate(+m[1], +m[2], +m[3]);
    const re = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s+(20\d\d))?\b/i;
    m = re.exec(text);
    if (!m) { const m2 = /\b(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?(?:\s+(20\d\d))?\b/i.exec(text); if (m2) m = [m2[0], m2[2], m2[1], m2[3]]; }
    if (!m) return null;
    const mon = MONTHS[m[1].toLowerCase().slice(0, m[1].toLowerCase() === 'sept' ? 4 : 3)] || MONTHS[m[1].toLowerCase().slice(0, 3)];
    const day = +m[2];
    const now = new Date(nowMs);
    let y = m[3] ? +m[3] : now.getFullYear();
    if (!m[3]) { const cand = new Date(y, mon - 1, day); if (cand.getTime() < nowMs - 2 * 86400000) y += 1; }
    return isoDate(y, mon, day);
  }

  function to24(h, mi, ap) {
    h = +h; mi = +(mi || 0);
    if (ap) { ap = ap.toLowerCase(); if (ap.startsWith('p') && h < 12) h += 12; if (ap.startsWith('a') && h === 12) h = 0; }
    return [h, mi];
  }

  function tzOffsetMin(tz, iso) {
    try {
      const d = new Date(iso + 'T12:00:00Z');
      const f = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'longOffset' }).formatToParts(d);
      const s = f.find((p) => p.type === 'timeZoneName').value; const m = /GMT([+-])(\d\d):?(\d\d)?/.exec(s);
      return m ? (m[1] === '-' ? -1 : 1) * (+m[2] * 60 + +(m[3] || 0)) : 0;
    } catch { return 0; }
  }

  function airport(code) {
    const a = AP[code];
    const o = { iata: code, kind: 'airport', name: a ? a[0] : code };
    if (a) { o.cityName = a[1]; o.timeZone = a[2]; }
    return o;
  }

  const TIME = String.raw`(\d{1,2})(?::(\d\d))?\s*([ap]\.?m\.?)?`;
  // A line describes a flight if it has a flight number and a price.
  function parseLine(line, ctx) {
    const plain = line.replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '$1').replace(/[*_`]/g, '');
    const url = (/\((https:\/\/[^)\s]+)\)/.exec(line) || [])[1];
    const fn = /\b([A-Z][A-Z0-9]|[A-Z0-9][A-Z])\s?(\d{1,4})\b/.exec(plain.replace(/\b(JFK|LAX|[A-Z]{3})\b/g, (s) => s.toLowerCase()));
    if (!fn || /^\d\d$/.test(fn[1])) return null;
    const pr = /(?:US)?\$\s?([\d,]+(?:\.\d\d)?)|([\d,]+(?:\.\d\d)?)\s?USD/.exec(plain);
    if (!pr) return null;
    const price = Math.round(parseFloat((pr[1] || pr[2]).replace(/,/g, '')) * 100);
    const codes = [...plain.matchAll(/\b([A-Z]{3})\b/g)].map((m) => m[1]).filter((c) => c !== 'USD' && c !== fn[1] + fn[2]);
    const times = [...plain.matchAll(new RegExp(TIME, 'gi'))].filter((m) => m[2] !== undefined || m[3]);
    if (times.length < 2) return null;
    const origin = codes[0] || ctx.origin, destination = codes.find((c) => c !== origin) || ctx.destination;
    if (!origin || !destination) return null;
    let airlineName = null;
    for (const [n, c] of Object.entries(NAME_TO_CODE)) if (c === fn[1] && new RegExp('\\b' + n + '\\b', 'i').test(plain)) { airlineName = AIRLINES[c] || n; break; }
    if (!airlineName) {
      const mm = /^[-*\s\d.)]*([A-Za-z][A-Za-z .'&-]+?)\s+[A-Z0-9]{2}\s?\d/.exec(plain);
      const guess = mm && mm[1].trim();
      airlineName = AIRLINES[fn[1]] || (guess && NAME_TO_CODE[guess.toLowerCase()] ? AIRLINES[NAME_TO_CODE[guess.toLowerCase()]] : guess) || fn[1];
    }
    const dur = /(\d{1,2})\s*h(?:r|rs|ours?)?\s*(\d{1,2})?\s*m?/i.exec(plain.replace(new RegExp(TIME, 'gi'), (s) => (/[ap]\.?m/i.test(s) || /:/.test(s) ? '@' : s)));
    let stops = 0;
    if (/non-?stop|direct/i.test(plain)) stops = 0; else { const sm = /(\d)\s*stops?/i.exec(plain); if (sm) stops = +sm[1]; else if (/one stop|1-stop/i.test(plain)) stops = 1; }
    const cabin = /business/i.test(plain) ? 'business' : /first class|\bfirst\b/i.test(plain) ? 'first' : /premium economy/i.test(plain) ? 'premium_economy' : ctx.cabin;
    const nextDay = /\+1|next day|overnight/i.test(plain);
    return { code: fn[1], num: fn[2], airlineName, price, currency: 'USD', origin, destination, t1: to24(times[0][1], times[0][2], times[0][3]), t2: to24(times[1][1], times[1][2], times[1][3]), durMin: dur ? +dur[1] * 60 + +(dur[2] || 0) : null, stops, cabin, url, nextDay };
  }

  function buildCard(content, opts) {
    const nowMs = opts.nowMs || Date.now();
    const lines = content.split('\n');
    const ctxText = content + '\n' + (opts.contextText || '');
    const routeM = /\b([A-Z]{3})\s*(?:to|→|->|-|–)\s*([A-Z]{3})\b/.exec(ctxText);
    const ctx = { origin: routeM && routeM[1], destination: routeM && routeM[2], cabin: /business/i.test(ctxText) ? 'business' : /first class/i.test(ctxText) ? 'first' : /premium economy/i.test(ctxText) ? 'premium_economy' : 'economy' };
    const date = findDate(content, nowMs) || findDate(opts.contextText || '', nowMs);
    if (!date) return null;
    const adults = (() => { const m = /\b(\d)\s+adults?\b/i.exec(ctxText); return m ? Math.max(1, Math.min(9, +m[1])) : 1; })();
    const parsed = []; let first = -1, last = -1;
    lines.forEach((ln, i) => { const f = parseLine(ln, ctx); if (f) { parsed.push(f); if (first < 0) first = i; last = i; } });
    if (parsed.length < 1) return null;
    const legOrigin = parsed[0].origin, legDest = parsed[0].destination;
    const flights = parsed.filter((f) => f.origin === legOrigin && f.destination === legDest).slice(0, 48);
    const seen = new Set(); const offers = [];
    for (const f of flights) {
      const id = ('fo_' + f.code + f.num + '_' + f.price).replace(/[^A-Za-z0-9_-]/g, '').slice(0, 67);
      if (seen.has(id)) continue; seen.add(id);
      const o = airport(f.origin), d = airport(f.destination);
      const dep = `${date}T${pad(f.t1[0])}:${pad(f.t1[1])}`;
      let arrDay = date; let arrMin = f.t2[0] * 60 + f.t2[1], depMin = f.t1[0] * 60 + f.t1[1];
      let dur = f.durMin;
      if (dur == null) {
        const off = o.timeZone && d.timeZone ? tzOffsetMin(o.timeZone, date) - tzOffsetMin(d.timeZone, date) : 0;
        dur = arrMin - depMin + off; if (dur <= 0 || f.nextDay) dur += 1440;
      }
      if (f.nextDay || arrMin < depMin) { const x = new Date(date + 'T00:00:00Z'); x.setUTCDate(x.getUTCDate() + 1); arrDay = x.toISOString().slice(0, 10); }
      const arr = `${arrDay}T${pad(f.t2[0])}:${pad(f.t2[1])}`;
      dur = Math.max(1, Math.min(10080, dur));
      const seg = { marketing: { iata: f.code, name: f.airlineName }, flightNumber: f.num, origin: o, destination: d, departLocal: dep, arriveLocal: arr, durationMin: dur, cabin: f.cabin };
      offers.push({
        id, journeys: [{ origin: o, destination: d, departLocal: dep, arriveLocal: arr, durationMin: dur, layovers: [], stops: f.stops, segments: [seg] }],
        fare: { cabin: f.cabin, bags: [], flexibility: { change: 'unknown', refund: 'unknown' } },
        price: { total: { minor: f.price, currency: f.currency }, perPassenger: [] },
        provenance: { source: 'bookable', observedAtMs: opts.observedAtMs || nowMs, ...(f.url ? { sourceUrl: f.url, site: new URL(f.url).hostname.replace(/^www\./, '') } : {}) },
        priceCheck: { verdict: 'not_checked', otherSource: 'google_flights', checkedAtMs: opts.observedAtMs || nowMs },
        bookability: f.url ? 'handoff' : 'info_only', labels: [],
      });
    }
    if (!offers.length) return null;
    const cheapest = offers.reduce((a, b) => (b.price.total.minor < a.price.total.minor ? b : a));
    const fastest = offers.reduce((a, b) => (b.journeys[0].durationMin < a.journeys[0].durationMin ? b : a));
    cheapest.labels.push('cheapest'); if (fastest !== cheapest) fastest.labels.push('fastest');
    const cabin = offers[0].fare.cabin;
    const search = { journeys: [{ origin: legOrigin, destination: legDest, date }], searchedAirports: [{ origin: [legOrigin], destination: [legDest] }],
      passengers: { adults, children: 0, infantsOnLap: 0 }, cabin, searchedAtMs: opts.observedAtMs || nowMs, sources: { bookable: 'ok', googleFlights: 'skipped', browser: 'skipped' } };
    const card = { kind: 'flights', v: 1, search, offers, groups: [{ ref: 'a', kind: 'exact', search, changes: {}, offerIds: offers.map((o) => o.id) }], recommended: [cheapest.id] };
    // The card replaces everything from `start` on, so keep the non-flight text above it.
    const before = lines.slice(0, first).join('\n').replace(/\s+$/, '');
    const after = lines.slice(last + 1).join('\n').trim();
    const head = [before, after].filter(Boolean).join('\n\n');
    const listText = lines.slice(first, last + 1).map((l) => (l.trimStart().startsWith('- ') ? l.trimStart() : '- ' + l.trim())).join('\n');
    const newContent = (head ? head + '\n\n' : '') + listText;
    return { card, content: newContent, start: head ? head.length + 2 : 0 };
  }
  return { buildCard, parseLine, findDate };
}
if (typeof module !== 'undefined') module.exports = __gbFlightParserFactory;
