'use client';
import { useEffect, useRef } from 'react';

const letters = {
  l: 'M8 10 H66 V182 A50 50 0 0 0 116 232 H312 V290 H116 A108 108 0 0 1 8 182 Z',
  x: 'M331.0000 10.0000 L413.0244 10.0000 L515.5147 112.4903 A12 12 0 0 0 532.4853 112.4903 L634.9756 10.0000 L717.0000 10.0000 L585.4853 141.5147 A12 12 0 0 0 585.4853 158.4853 L717.0000 290.0000 L634.9756 290.0000 L532.4853 187.5097 A12 12 0 0 0 515.5147 187.5097 L413.0244 290.0000 L331.0000 290.0000 L462.5147 158.4853 A12 12 0 0 0 462.5147 141.5147 Z',
  p: 'M740 10 H1000 A96 96 0 0 1 1000 202 H798 V290 H740 V144 H1000 A38 38 0 0 0 1000 68 H740 Z',
};

export function BrandIntro() {
  const overlay = useRef<HTMLDivElement>(null);
  const mark = useRef<HTMLDivElement>(null);
  const pending = useRef(false);

  useEffect(() => {
    const root = document.documentElement;
    if (!root.dataset.lxpIntro && !pending.current) return;
    pending.current = true;
    root.dataset.lxpIntro = 'tracing';
    const shell = document.getElementById('site-shell');
    const resetReload = root.dataset.lxpReload === 'true';
    const keepReloadAtTop = () => {
      if (resetReload && window.scrollY !== 0) window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    };
    keepReloadAtTop();
    if (resetReload) window.addEventListener('scroll', keepReloadAtTop, { passive: true });
    const previousFocus = document.activeElement as HTMLElement | null;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const timers: ReturnType<typeof setTimeout>[] = [];
    const animations: Animation[] = [];
    let finished = false;
    let cancelled = false;

    shell?.setAttribute('inert', '');
    overlay.current?.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true });

    function finish(completed = true) {
      if (finished) return;
      finished = true;
      timers.forEach(clearTimeout);
      animations.forEach(animation => animation.cancel());
      delete root.dataset.lxpIntro;
      shell?.removeAttribute('inert');
      if (completed) {
        pending.current = false;
        keepReloadAtTop();
        delete root.dataset.lxpReload;
      }
      window.removeEventListener('scroll', keepReloadAtTop);
      if (overlay.current?.contains(document.activeElement)) {
        const target = previousFocus && previousFocus !== document.body ? previousFocus : document.querySelector<HTMLElement>('.site-header .brand');
        target?.focus({ preventScroll: true });
      }
    }
    const delay = (ms: number) => new Promise<void>(resolve => timers.push(setTimeout(resolve, ms)));
    function escape(event: KeyboardEvent) { if (event.key === 'Escape') finish(); }
    function reduceMotion() { if (motion.matches) finish(); }
    const screen = overlay.current;
    const preventScroll = (event: WheelEvent) => event.preventDefault();
    screen?.addEventListener('wheel', preventScroll, { passive: false });
    const skip = screen?.querySelector('button');
    const skipIntro = () => finish();
    skip?.addEventListener('click', skipIntro);
    document.addEventListener('keydown', escape);
    motion.addEventListener('change', reduceMotion);
    // Always release the interface if an image or animation fails.
    timers.push(setTimeout(() => finish(), 4200));

    async function play() {
      const strokes = overlay.current?.querySelectorAll<SVGPathElement>('[data-trace]');
      if (!strokes || !mark.current) { finish(); return; }
      // L, descending X arm, ascending X arm, then P. The masks reveal exact silhouettes.
      for (const [index, stroke] of Array.from(strokes).entries()) {
        if (finished || cancelled) return;
        const duration = [400, 220, 220, 430][index];
        const animation = stroke.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], {
          duration, easing: 'cubic-bezier(.45,0,.2,1)', fill: 'forwards',
        });
        animations.push(animation);
        await animation.finished.catch(() => {});
      }
      if (finished || cancelled) return;
      root.dataset.lxpIntro = 'formed';
      await delay(130);
      if (finished || cancelled) return;
      const emblem = document.querySelector<HTMLImageElement>('.site-header .company-emblem');
      if (!emblem || !mark.current) { finish(); return; }
      const destination = emblem.getBoundingClientRect();
      const source = mark.current.getBoundingClientRect();
      // Position of the original LXP lettering within the unmodified wing emblem.
      const dx = destination.left + destination.width * .5 - (source.left + source.width / 2);
      const dy = destination.top + destination.height * .65 - (source.top + source.height / 2);
      const scale = destination.width * .14 / source.width;
      root.dataset.lxpIntro = 'travelling';
      const flight = mark.current.animate([
        { transform: 'translate3d(0,0,0) scale(1)', opacity: 1 },
        { transform: `translate3d(${dx}px,${dy}px,0) scale(${scale})`, opacity: 1 },
      ], { duration: 650, easing: 'cubic-bezier(.76,0,.2,1)', fill: 'forwards' });
      animations.push(flight);
      await flight.finished.catch(() => {});
      if (finished || cancelled) return;
      root.dataset.lxpIntro = 'wings';
      const fade = mark.current.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: 'forwards' });
      animations.push(fade);
      await delay(450);
      if (!cancelled) finish();
    }
    void play().catch(() => finish());
    return () => {
      cancelled = true;
      finish(false);
      skip?.removeEventListener('click', skipIntro);
      screen?.removeEventListener('wheel', preventScroll);
      document.removeEventListener('keydown', escape);
      motion.removeEventListener('change', reduceMotion);
    };
  }, []);

  return <div ref={overlay} className="brand-intro" role="dialog" aria-modal="true" aria-label="Welcome to Luxury Performance">
    <div className="intro-backdrop" />
    <div className="intro-topline" aria-hidden="true"><span>DUBAI BORN.</span><span>PERFORMANCE DRIVEN.</span></div>
    <div className="intro-mark-position"><div ref={mark} className="intro-mark">
      <svg viewBox="8 10 1088 280" fill="none" aria-hidden="true">
        <defs>
          <mask id="intro-l" maskUnits="userSpaceOnUse" x="0" y="0" width="1100" height="310"><path data-trace="l" className="intro-trace" d="M37 10 V182 A79 79 0 0 0 116 261 H312" pathLength="1" strokeWidth="60" /></mask>
          <mask id="intro-x" maskUnits="userSpaceOnUse" x="0" y="0" width="1100" height="310">
            <path data-trace="x-down" className="intro-trace" d="M330 -30 L718 330" pathLength="1" strokeWidth="102" />
            <path data-trace="x-up" className="intro-trace" d="M330 330 L718 -30" pathLength="1" strokeWidth="102" />
          </mask>
          <mask id="intro-p" maskUnits="userSpaceOnUse" x="0" y="0" width="1100" height="310"><path data-trace="p" className="intro-trace" d="M740 39 H1000 A67 67 0 0 1 1000 173 H769 V290" pathLength="1" strokeWidth="60" /></mask>
        </defs>
        <g className="intro-letter-guides">{Object.entries(letters).map(([key, d]) => <path key={key} d={d} />)}</g>
        {Object.entries(letters).map(([key, d]) => <path key={key} d={d} fill="#fff" mask={`url(#intro-${key})`} />)}
      </svg>
    </div></div>
    <div className="intro-caption" aria-hidden="true"><span>LUXURY PERFORMANCE</span><span className="intro-caption-rule" /><span>BEYOND ORDINARY.</span></div>
    <div className="intro-bottomline"><span aria-hidden="true">PRECISION IN EVERY DETAIL.</span><button type="button">Skip intro <span aria-hidden="true">↗</span></button></div>
  </div>;
}
