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
  const targets = document.querySelectorAll('.thesis .big, .figures, .ch-head, .plate, .island-demo figure, .term, .spec table, .versions, .steps, .reqs, .qs, .ticket, .sky-small');
  const seen = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('in');
      if (e.target.classList.contains('term')) e.target.classList.add('play');
      seen.unobserve(e.target);
    }
  }, { threshold: 0.2 });
  targets.forEach((el) => { if (!quiet) el.classList.add('fade'); seen.observe(el); });

  // ---------- dark / light comparison
  document.querySelectorAll('.compare').forEach((c) => {
    const input = c.querySelector('input');
    input.addEventListener('input', () => c.style.setProperty('--cut', input.value + '%'));
  });
});
