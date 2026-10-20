'use client';

import { type CSSProperties, useEffect, useId, useRef, useState } from 'react';
import styles from './valvetronic-sound-headline.module.css';

// Matching cubic segments let the speaker itself bend into the exhaust tip.
const iconPaths = [
  {
    speaker: 'M8 24 C8 24 13 24 13 24 C13 24 18 24 18 24 C18 24 32 12 32 12 C32 12 32 52 32 52 C32 52 18 40 18 40 C18 40 13 40 13 40 C13 40 8 40 8 40 C8 40 8 24 8 24 Z',
    exhaust: 'M3 26 C3 26 12 26 12 26 C18 26 17 14 25 14 C25 14 54 14 54 14 C41.5 14 41.5 50 54 50 C54 50 25 50 25 50 C17 50 18 38 12 38 C12 38 3 38 3 38 C3 38 3 26 3 26 Z',
  },
  { speaker: 'M40 22 C46 27 46 37 40 42', exhaust: 'M54 14 C66.5 14 66.5 50 54 50' },
  { speaker: 'M48 14 C59 24 59 40 48 50', exhaust: 'M54 50 C41.5 50 41.5 14 54 14' },
];
const pathNumbers = /-?\d*\.?\d+/g;
const exhaustPoints = iconPaths.map(path => path.exhaust.match(pathNumbers)!.map(Number));
export type SoundEffectStyle = 'waveform' | 'pressure' | 'streaks';
const waveSlots = Array.from({ length: 12 }, (_, index) => index);
const restingEffects: Record<SoundEffectStyle, string[]> = {
  waveform: ['M71 32 C75 32 76 24 80 24 S86 40 90 40 S96 27 100 27 S106 32 111 32'],
  pressure: ['M72 25 A3 7 0 1 0 72 39 A3 7 0 1 0 72 25', 'M84 21 A4 11 0 1 0 84 43 A4 11 0 1 0 84 21', 'M96 17 A5 15 0 1 0 96 47 A5 15 0 1 0 96 17'],
  streaks: ['M72 27 Q86 24 103 27', 'M75 32 L111 32', 'M72 37 Q86 40 103 37'],
};

function morphPath(index: number, amount: number) {
  let point = 0;
  return iconPaths[index].speaker.replace(pathNumbers, value => {
    const start = Number(value);
    return (start + (exhaustPoints[index][point++] - start) * amount).toFixed(3);
  });
}

export function ValvetronicSoundHeadline({ effect = 'waveform' }: { effect?: SoundEffectStyle }) {
  const root = useRef<HTMLSpanElement>(null);
  const audio = useRef<HTMLAudioElement>(null);
  const request = useRef(0);
  const paths = useRef<(SVGPathElement | null)[]>([]);
  const waves = useRef<(SVGPathElement | null)[]>([]);
  const analysis = useRef<{ context: AudioContext; source: MediaElementAudioSourceNode; analyser: AnalyserNode } | null>(null);
  const morph = useRef(0);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const id = useId();

  useEffect(() => {
    const from = morph.current;
    const to = playing ? 1 : 0;
    if (from === to) return;

    const draw = (amount: number) => {
      morph.current = amount;
      paths.current.forEach((path, index) => path?.setAttribute('d', morphPath(index, amount)));
    };
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      draw(to);
      return;
    }

    const start = performance.now();
    const duration = 680 * Math.abs(to - from);
    let frame: number;
    const animate = (now: number) => {
      const time = Math.min((now - start) / duration, 1);
      const eased = time < .5 ? 4 * time ** 3 : 1 - (-2 * time + 2) ** 3 / 2;
      draw(from + (to - from) * eased);
      if (time < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [playing]);

  useEffect(() => {
    const graph = analysis.current;
    if (!playing || !graph || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const samples = new Float32Array(graph.analyser.fftSize);
    const frequencies = new Float32Array(graph.analyser.frequencyBinCount);
    const hzPerBin = graph.context.sampleRate / graph.analyser.fftSize;
    const fronts: ({ born: number; strength: number; duration: number; reach: number } | null)[] = Array(waveSlots.length).fill(null);
    const waveNodes = waves.current;
    let envelope = 0;
    let sustained = 0;
    let nextEmission = 0;
    let previousClock = 0;
    let previousAttack = 0;
    let phase = 0;
    const history: { time: number; strength: number; phase: number }[] = [];
    let frame: number;
    waveNodes.forEach(wave => { if (wave) wave.style.opacity = '0'; });
    const draw = () => {
      graph.analyser.getFloatTimeDomainData(samples);
      graph.analyser.getFloatFrequencyData(frequencies);
      let energy = 0;
      for (const sample of samples) energy += sample ** 2;
      const rms = Math.sqrt(energy / samples.length);
      let weight = 0;
      let centroid = 0;
      for (let index = Math.ceil(100 / hzPerBin); index < Math.min(frequencies.length, 4000 / hzPerBin); index++) {
        // FFT values are decibels. Linear power keeps the exhaust harmonics
        // distinct instead of treating quiet and loud bins nearly alike.
        const power = 10 ** (frequencies[index] / 10);
        weight += power;
        centroid += power * index * hzPerBin;
      }
      const clock = audio.current?.currentTime ?? 0;
      const elapsed = Math.max(0, Math.min(.05, clock - previousClock));
      previousClock = clock;
      // Preserve the clip's quiet gaps; the previous mapping compressed most
      // revs into the same upper range. Timings stay independent of frame rate.
      const target = Math.min(1, Math.max(0, (rms - .028) / .165)) ** 1.35;
      envelope += (target - envelope) * (1 - Math.exp(-elapsed / (target > envelope ? .025 : .065)));
      sustained += (envelope - sustained) * (1 - Math.exp(-elapsed / .24));
      const attack = Math.min(1, Math.max(0, envelope - sustained) * 2.8);
      const strength = Math.min(1, envelope + attack * .35);
      const pitch = weight ? Math.min(1, Math.max(0, (centroid / weight - 180) / 400)) : 0;
      const formed = Math.max(0, Math.min(1, (morph.current - .7) / .3));
      // A fresh throttle hit launches a front immediately. Held revs keep
      // emitting; quieter gaps let the existing fronts travel away and clear.
      if (attack > .24 && previousAttack <= .24) nextEmission = clock;
      previousAttack = attack;
      if (formed > .5 && strength > .055 && clock >= nextEmission) {
        let slot = fronts.findIndex(front => !front || clock - front.born >= front.duration);
        if (slot < 0) slot = fronts.reduce((oldest, front, index) => front!.born < fronts[oldest]!.born ? index : oldest, 0);
        fronts[slot] = { born: clock, strength, duration: .8 - strength * .27, reach: 12 + strength * 27 };
        nextEmission = clock + Math.max(.065, .40 - strength * .31 - pitch * .035);
      }
      // A short history lets the signal travel out of the tip. Its height,
      // frequency and bursts follow the analysed rev, including held notes.
      phase += elapsed * (4 + pitch * 6) * Math.PI * 2;
      if (!history.length || clock > history[history.length - 1].time) history.push({ time: clock, strength, phase });
      while (history.length > 1 && history[0].time < clock - .7) history.shift();
      const trailPeak = history.reduce((peak, point) => Math.max(peak, point.strength), 0);
      waveNodes.forEach((wave, index) => {
        if (!wave) return;
        if (effect === 'waveform') {
          if (index > 2 || trailPeak < .04) { wave.style.opacity = '0'; return; }
          let cursor = history.length - 1;
          let path = '';
          for (let point = 0; point <= 40; point++) {
            const progress = point / 40;
            const at = clock - progress * .65;
            while (cursor > 0 && history[cursor].time > at) cursor--;
            const before = history[cursor];
            const after = history[Math.min(cursor + 1, history.length - 1)];
            const mix = Math.max(0, Math.min(1, (at - before.time) / Math.max(.001, after.time - before.time)));
            const amplitude = before.strength + (after.strength - before.strength) * mix;
            const angle = before.phase + (after.phase - before.phase) * mix + index * .23;
            const signal = Math.sin(angle) * .78 + Math.sin(angle * 2 + .4) * .22;
            const taper = Math.sin(Math.PI * progress) ** .55 * (1 - progress * .45);
            const x = 71 + progress * (20 + trailPeak * 20);
            const y = 32 + signal * amplitude * 15 * taper * (1 - index * .14);
            path += `${point ? ' L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`;
          }
          wave.setAttribute('d', path);
          wave.style.opacity = (formed * (.12 + trailPeak * .88) * [1, .28, .15][index]).toFixed(3);
          wave.style.strokeWidth = (index ? .9 : 1.2 + trailPeak * .9).toFixed(2);
          return;
        }
        const front = fronts[index];
        const progress = front ? (clock - front.born) / front.duration : 1;
        if (!front || progress >= 1) {
          wave.style.opacity = '0';
          fronts[index] = null;
          return;
        }
        const x = 71 + progress * Math.min(34, front.reach);
        const radius = 3 + front.strength * 15 + progress * 6;
        if (effect === 'pressure') {
          const rx = 2 + progress * 3.5;
          wave.setAttribute('d', `M${x.toFixed(2)} ${(32 - radius).toFixed(2)} a${rx.toFixed(2)} ${radius.toFixed(2)} 0 1 0 0 ${(radius * 2).toFixed(2)} a${rx.toFixed(2)} ${radius.toFixed(2)} 0 1 0 0 ${(-radius * 2).toFixed(2)}`);
        } else {
          const start = 71 + progress * (front.reach - 8);
          const end = Math.min(111, start + 4 + front.strength * 11);
          const offset = Math.sin(front.born * 17 + index * .9) * (2 + front.strength * 5);
          const y = 32 + offset * (.6 + progress * .7);
          wave.setAttribute('d', `M${start.toFixed(2)} ${y.toFixed(2)} Q${((start + end) / 2).toFixed(2)} ${(y + offset * .22).toFixed(2)} ${end.toFixed(2)} ${(y + offset * .4).toFixed(2)}`);
        }
        const release = Math.min(1, .25 + envelope / Math.max(.06, front.strength));
        wave.style.opacity = ((.06 + front.strength * .94) * release * Math.min(1, progress / .08) * (1 - progress) ** .85).toFixed(3);
        wave.style.strokeWidth = (.9 + front.strength * (effect === 'streaks' ? 1.6 : 2.1)).toFixed(2);
      });
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame);
      waveNodes.forEach((wave, index) => {
        wave?.style.removeProperty('opacity');
        wave?.style.removeProperty('stroke-width');
        wave?.setAttribute('d', restingEffects[effect][index] ?? '');
      });
    };
  }, [playing, effect]);

  useEffect(() => {
    const player = audio.current;
    const layer = root.current?.closest('[data-active]');
    const hero = root.current?.closest('[data-home-hero]');
    if (!player) return;

    const stop = () => {
      request.current += 1;
      player.pause();
      player.currentTime = 0;
      setPlaying(false);
    };
    const visibility = () => { if (document.hidden) stop(); };
    const slide = new MutationObserver(() => { if (layer?.getAttribute('data-active') !== 'true') stop(); });
    if (layer) slide.observe(layer, { attributes: true, attributeFilter: ['data-active'] });
    const viewport = new IntersectionObserver(([entry]) => { if (!entry.isIntersecting) stop(); }, { threshold: .2 });
    if (hero) viewport.observe(hero);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      request.current += 1;
      player.pause();
      slide.disconnect();
      viewport.disconnect();
      document.removeEventListener('visibilitychange', visibility);
      queueMicrotask(() => {
        if (!player.isConnected && analysis.current) {
          analysis.current.source.disconnect();
          analysis.current.analyser.disconnect();
          void analysis.current.context.close();
          analysis.current = null;
        }
      });
    };
  }, []);

  async function toggle() {
    const player = audio.current;
    if (!player) return;
    const attempt = ++request.current;
    if (playing) {
      player.pause();
      player.currentTime = 0;
      setPlaying(false);
      return;
    }
    setFailed(false);
    setPlaying(true);
    player.volume = .72;
    try {
      if (!analysis.current) {
        const Context = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (Context) {
          const context = new Context();
          const source = context.createMediaElementSource(player);
          const analyser = context.createAnalyser();
          analyser.fftSize = 2048;
          analyser.smoothingTimeConstant = .08;
          source.connect(analyser);
          analyser.connect(context.destination);
          analysis.current = { context, source, analyser };
        }
      }
      // Start both within the click gesture, including on iPhone Safari.
      await Promise.all([analysis.current?.context.resume(), player.play()]);
    } catch {
      if (attempt === request.current) {
        setPlaying(false);
        setFailed(true);
      }
    }
  }

  return <>Your car.<br /><span ref={root} className={styles.row} data-playing={playing} data-effect={effect} style={{ '--metal-filter': `url(#${id}-metal)` } as CSSProperties}>
    <span className={styles.label}>
      <span className={styles.measure} aria-hidden="true">Your sound.</span>
      <span className={styles.text}>Your sound.</span>
    </span>
    <button type="button" className={styles.button} onClick={toggle} aria-pressed={playing}
      aria-label={playing ? 'Stop Valvetronic exhaust sound' : 'Play Valvetronic exhaust sound'}
      title={playing ? 'Stop sound' : 'Hear the Valvetronic exhaust'}>
      <svg className={styles.glyph} viewBox="0 0 64 64" fill="none" stroke={playing ? `url(#${id}-heat)` : 'currentColor'} strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <defs>
          {/* One elliptical heat field continues across the barrel and both
              halves of the lip, so the blue cannot form a separate ring. */}
          <radialGradient id={`${id}-heat`} cx="54" cy="32" r="100" gradientUnits="userSpaceOnUse" gradientTransform="translate(54 32) scale(.52 1) translate(-54 -32)">
            <stop stopColor="#2b4d89" /><stop offset=".13" stopColor="#3776b8" /><stop offset=".22" stopColor="#4661ab" /><stop offset=".30" stopColor="#5a4ba4" /><stop offset=".42" stopColor="#85428f" /><stop offset=".53" stopColor="#9c5f64" /><stop offset=".63" stopColor="#b48c52" /><stop offset=".73" stopColor="#8b9ba6" /><stop offset=".83" stopColor="#d4dce2" /><stop offset="1" stopColor="#abbcc8" />
          </radialGradient>
          <linearGradient id={`${id}-surface`} x1="0" y1="14" x2="0" y2="50" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fff8dd" stopOpacity=".7" /><stop offset=".08" stopColor="#f2f5ff" stopOpacity=".4" /><stop offset=".26" stopColor="#fff" stopOpacity="0" /><stop offset=".52" stopColor="#081126" stopOpacity=".6" /><stop offset=".77" stopColor="#030710" stopOpacity=".7" /><stop offset=".94" stopColor="#d5e2f4" stopOpacity=".2" /><stop offset="1" stopColor="#f1f5ff" stopOpacity=".7" />
          </linearGradient>
          <clipPath id={`${id}-body-clip`}><use href={`#${id}-body`} /></clipPath>
          <filter id={`${id}-metal`} x="-20%" y="-25%" width="140%" height="160%" colorInterpolationFilters="sRGB">
            <feGaussianBlur in="SourceAlpha" stdDeviation=".45" result="height" />
            <feSpecularLighting in="height" surfaceScale="2.8" specularConstant=".85" specularExponent="28" lightingColor="#fff3dc" result="shine">
              <feDistantLight azimuth="225" elevation="45" />
            </feSpecularLighting>
            <feComposite in="shine" in2="SourceAlpha" operator="in" result="bevel" />
            <feComposite in="SourceGraphic" in2="bevel" operator="arithmetic" k1="0" k2="1" k3=".7" k4="0" result="lit" />
            <feOffset in="SourceAlpha" dx=".4" dy="1.35" result="depth" />
            <feFlood floodColor="#090b13" floodOpacity=".9" result="shadow" />
            <feComposite in="shadow" in2="depth" operator="in" result="edge" />
            <feMerge><feMergeNode in="edge" /><feMergeNode in="lit" /></feMerge>
          </filter>
        </defs>
        <g filter={playing ? `url(#${id}-metal)` : undefined}>
        {iconPaths.map((path, index) => <path key={index} ref={node => { paths.current[index] = node; }} d={path.speaker}
          id={index === 0 ? `${id}-body` : undefined}
          className={`${styles.shape} ${index === 0 ? styles.body : ''}`}
          fill={index === 0 ? `url(#${id}-heat)` : 'none'} />)}
          <g className={styles.surface} clipPath={`url(#${id}-body-clip)`}><rect x="-1" y="10" width="70" height="44" fill={`url(#${id}-surface)`} stroke="none" /></g>
        </g>
        <g fill="none" stroke="#b6cce0" strokeWidth="2.5" aria-hidden="true">
          {waveSlots.map(index =>
            <path key={index} ref={node => { waves.current[index] = node; }} className={styles.pulse} d={restingEffects[effect][index] ?? ''} />)}
        </g>
      </svg>
    </button>
    <audio ref={audio} src="/audio/valvetronic-porsche-gt3rs.m4a" preload="none" hidden
      onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)}
      onError={() => { setPlaying(false); setFailed(true); }} />
    <span role="status" className="sr-only">{failed ? 'The sound could not play. Please try again.' : ''}</span>
  </span></>;
}
