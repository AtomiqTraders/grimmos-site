// Grimm OS website: the eclipse opening, reveal on scroll, the theme comparison and the Rune demo.
// No libraries; scroll work happens once per frame and only while the eclipse is on screen.
document.documentElement.classList.add('js');

document.addEventListener('DOMContentLoaded', () => {
  const quiet = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- the eclipse: the moon's dark disc opens onto the desktop as you scroll
  const section = document.querySelector('.eclipse');
  const stage = section.querySelector('.stage');
  const MOON = 0.1383; // the disc's radius as a share of the photo's width (measured), centred at 50.1% / 51.3%
  let ticking = false;
  const frame = () => {
    ticking = false;
    const W = innerWidth, H = innerHeight;
    const run = section.offsetHeight - H;
    const p = Math.min(1, Math.max(0, -section.getBoundingClientRect().top / run));
    const shown = Math.max(W, H * 1.5); // the photo is 3:2 and covers the screen
    const disc = MOON * shown * (1 + p * 2.4); // the photo zooms by the same factor
    const r = disc * Math.min(1, p * 5) + Math.max(0, p - 0.45) / 0.55 * Math.hypot(W, H);
    stage.style.setProperty('--p', p.toFixed(4));
    stage.style.setProperty('--r', r.toFixed(1) + 'px');
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
  if (!quiet) {
    const near = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { addEventListener('scroll', onScroll, { passive: true }); frame(); }
      else removeEventListener('scroll', onScroll);
    });
    near.observe(section);
    addEventListener('resize', onScroll, { passive: true });
  }

  // ---------- reveal things as they arrive (each once)
  const targets = document.querySelectorAll('.thesis .big, .figures, .ch-head, .plate, .cmdbar, .live, .term, .spec table, .versions, .steps, .reqs, .qs, .ticket, .sky-small');
  const seen = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('in');
      if (e.target.classList.contains('term')) e.target.classList.add('play');
      seen.unobserve(e.target);
    }
  }, { threshold: 0.2 });
  targets.forEach((el) => { if (!quiet) el.classList.add('fade'); seen.observe(el); });

  // ---------- the idea lights up word by word, and the version line fills, as you scroll
  const big = document.querySelector('.thesis .big');
  const words = [];
  if (!quiet) {
    const wrap = (node) => {
      for (const n of [...node.childNodes]) {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          for (const part of n.textContent.split(/(\s+)/)) {
            if (!part) continue;
            if (/^\s+$/.test(part)) { frag.append(part); continue; }
            const w = document.createElement('span'); w.className = 'w'; w.textContent = part; words.push(w); frag.append(w);
          }
          n.replaceWith(frag);
        } else wrap(n);
      }
    };
    wrap(big);
  }
  const versions = document.querySelector('.versions');
  const vItems = [...versions.querySelectorAll('li')];
  let reading = false;
  const read = () => {
    reading = false;
    const H = innerHeight;
    const b = big.getBoundingClientRect();
    if (words.length && b.top < H && b.bottom > 0) {
      const p = Math.min(1, Math.max(0, (H * 0.82 - b.top) / (b.height + H * 0.3)));
      const n = Math.round(p * words.length);
      words.forEach((w, i) => w.classList.toggle('lit', i < n));
    }
    const v = versions.getBoundingClientRect();
    if (v.top < H && v.bottom > 0) {
      const line = Math.min(v.height, Math.max(0, H * 0.62 - v.top));
      versions.style.setProperty('--fill', (line / v.height * 100).toFixed(1) + '%');
      vItems.forEach((li) => li.classList.toggle('lit', li.offsetTop + 32 <= line));
    }
  };
  if (!quiet) { addEventListener('scroll', () => { if (!reading) { reading = true; requestAnimationFrame(read); } }, { passive: true }); read(); }
  else vItems.forEach((li) => li.classList.add('lit'));

  // ---------- numbers count up when they arrive
  const countUp = (dt) => {
    const to = +dt.dataset.count, from = +(dt.dataset.from || 0), pre = dt.dataset.pre || '', post = dt.dataset.post || '';
    const t0 = performance.now(), dur = 1300;
    const step = (t) => {
      const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 4);
      dt.textContent = pre + Math.round(from + (to - from) * e) + post;
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  // ---------- spec values decode like a terminal readout
  const GLYPHS = '▚▞▙▟░▒#$%&*+=<>/\\0123456789abcdef';
  const decode = (td) => {
    const final = td.textContent, t0 = performance.now(), dur = 700 + final.length * 18;
    const step = (t) => {
      const k = Math.min(1, (t - t0) / dur), done = Math.floor(k * final.length);
      td.textContent = final.slice(0, done) + [...final.slice(done)].map((ch) => (ch === ' ' ? ' ' : GLYPHS[(Math.random() * GLYPHS.length) | 0])).join('');
      if (k < 1) requestAnimationFrame(step); else td.textContent = final;
    };
    requestAnimationFrame(step);
  };

  // things that start when they come into view
  const once = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const el = e.target;
      if (el.classList.contains('figures')) el.querySelectorAll('dt[data-count]').forEach((dt, i) => setTimeout(() => countUp(dt), i * 120));
      if (el.tagName === 'TABLE') el.querySelectorAll('tr').forEach((tr, i) => { tr.style.transitionDelay = i * 60 + 'ms'; setTimeout(() => decode(tr.cells[1]), 150 + i * 60); });
      once.unobserve(el);
    }
  }, { threshold: 0.3 });
  if (!quiet) { once.observe(document.querySelector('.figures')); once.observe(document.querySelector('.spec table')); }

  // ---------- the desktop's legend picks out its pin
  const ann = document.querySelector('.annotated');
  const pins = [...ann.querySelectorAll('.pin')];
  document.querySelectorAll('.legend li').forEach((li, i) => {
    li.addEventListener('mouseenter', () => { ann.classList.add('focus'); pins.forEach((p, j) => p.classList.toggle('hl', i === j)); });
    li.addEventListener('mouseleave', () => { ann.classList.remove('focus'); pins.forEach((p) => p.classList.remove('hl')); });
  });

  // ---------- while on screen: run something (start/stop with visibility)
  const whileSeen = (el, start, stop) => new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()), { threshold: 0.25 }).observe(el);

  // the launcher's command bar types real queries
  const QUERIES = [['firefox', 'App', 'Open Firefox ESR'], ['2400*1.5%', 'Sum', '= 36, Enter copies it'], ['> sudo apt update', 'Run', 'Runs it in a terminal'],
    ['night', 'Setting', 'Night light, in Display'], ['? how do eclipses work', 'Web', 'Searches the web']];
  const cbText = document.getElementById('cbText'), cbOut = document.getElementById('cbOut'), cbKind = document.getElementById('cbKind'), cbBox = cbOut.parentElement;
  let cbTimer = 0, qi = 0;
  const cbStop = () => { clearTimeout(cbTimer); cbTimer = 0; };
  const cbStart = () => {
    if (cbTimer) return;
    const [q, kind, out] = QUERIES[qi++ % QUERIES.length];
    let i = 0;
    cbBox.classList.add('empty'); cbText.textContent = '';
    const type = () => {
      cbText.textContent = q.slice(0, ++i);
      if (i < q.length) { cbTimer = setTimeout(type, 55 + Math.random() * 60); return; }
      cbKind.textContent = kind; cbOut.textContent = out; cbBox.classList.remove('empty');
      cbTimer = setTimeout(() => { cbTimer = 0; cbStart(); }, 2300);
    };
    cbTimer = setTimeout(type, 400);
  };
  if (quiet) { cbText.textContent = QUERIES[1][0]; cbKind.textContent = QUERIES[1][1]; cbOut.textContent = QUERIES[1][2]; }
  else whileSeen(document.querySelector('.cmdbar'), cbStart, cbStop);

  // the living island: a working copy that moves through what it shows, with the real island's spring
  const li = document.getElementById('li'), steps = [...document.querySelectorAll('.li-steps li')];
  const bar = document.getElementById('liBar'), pct = document.getElementById('liPct');
  const now = new Date();
  document.getElementById('liTime').textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  document.getElementById('liDate').textContent = now.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });
  const SPRING = 'linear(0, 0.16 6%, 0.53 16%, 0.86 27%, 1.03 38%, 1.07 46%, 1.05 56%, 1.01 70%, 1)';
  const show = (state) => {
    const before = li.getBoundingClientRect().width;
    li.className = 'li s-' + state;
    steps.forEach((s) => s.classList.toggle('on', s.dataset.s === state));
    if (state === 'vol') { pct.textContent = '40%'; bar.style.width = '40%'; setTimeout(() => { bar.style.width = '64%'; pct.textContent = '64%'; }, 450); }
    if (state === 'charge') { bar.style.width = '84%'; pct.textContent = '84% · Charging'; }
    const after = li.getBoundingClientRect().width;
    if (!quiet && Math.abs(after - before) > 1) li.animate([{ width: before + 'px' }, { width: after + 'px' }], { duration: 560, easing: SPRING });
  };
  const PLAN = [['clock', 1600], ['media', 2400], ['hover', 2200], ['media', 900], ['vol', 1900], ['media', 1300], ['charge', 2200], ['clock', 600]];
  let liTimer = 0, li_i = 0;
  const liNext = () => { const [st, ms] = PLAN[li_i++ % PLAN.length]; show(st); liTimer = setTimeout(liNext, ms); };
  steps.forEach((s) => s.addEventListener('click', () => { clearTimeout(liTimer); show(s.dataset.s); liTimer = setTimeout(liNext, 3000); }));
  if (quiet) show('hover');
  else whileSeen(document.querySelector('.live'), () => { if (!liTimer) liNext(); }, () => { clearTimeout(liTimer); liTimer = 0; });

  // ---------- dark / light comparison
  document.querySelectorAll('.compare').forEach((c) => {
    const input = c.querySelector('input');
    input.addEventListener('input', () => c.style.setProperty('--cut', input.value + '%'));
  });
});
