'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Pause, Play, RotateCcw, Volume2, VolumeX, X } from 'lucide-react';
import styles from './valvetronic-feature-film.module.css';

const videoId = 'CL2ofk5wqMc';
type VideoPlayer = { playVideo(): void; pauseVideo(): void; mute(): void; unMute(): void; isMuted(): boolean; seekTo(seconds: number, allowSeekAhead: boolean): void; destroy(): void };
type YouTubeApi = { Player: new (frame: HTMLIFrameElement, options: { events: { onReady(event: { target: VideoPlayer }): void; onStateChange(event: { data: number }): void; onError(): void } }) => VideoPlayer };
type YouTubeWindow = Window & { YT?: YouTubeApi; onYouTubeIframeAPIReady?: () => void };
let apiPromise: Promise<YouTubeApi> | undefined;

function loadVideoApi(): Promise<YouTubeApi> {
  const scope = window as YouTubeWindow;
  if (scope.YT?.Player) return Promise.resolve(scope.YT);
  if (!apiPromise) apiPromise = new Promise<YouTubeApi>((resolve, reject) => {
    const previous = scope.onYouTubeIframeAPIReady;
    scope.onYouTubeIframeAPIReady = () => {
      previous?.();
      if (scope.YT?.Player) resolve(scope.YT);
    };
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      script.onerror = () => { apiPromise = undefined; script.remove(); reject(new Error('Video player unavailable')); };
      document.head.append(script);
    }
  });
  return apiPromise;
}

export function ValvetronicFeatureFilm() {
  const [active, setActive] = useState(false);
  const [ready, setReady] = useState(false);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState('');
  const mount = useRef<HTMLDivElement>(null);
  const poster = useRef<HTMLButtonElement>(null);
  const player = useRef<VideoPlayer | null>(null);

  useEffect(() => {
    if (!active) return;
    let disposed = false;
    const fail = () => {
      if (disposed) return;
      setError('This clip could not be played here. You can watch it on YouTube below.');
      setActive(false);
    };
    loadVideoApi().then(api => {
      if (disposed || !mount.current) return;
      // The player lives inside an unmanaged child, so SDK cleanup cannot remove React's mount.
      const frame = document.createElement('iframe');
      const params = new URLSearchParams({ enablejsapi: '1', autoplay: '1', playsinline: '1', controls: '0', fs: '0', rel: '0', origin: window.location.origin });
      frame.src = `https://www.youtube-nocookie.com/embed/${videoId}?${params}`;
      frame.title = 'Ahmed Amwell on Valvetronic exhausts';
      frame.allow = 'autoplay; encrypted-media; picture-in-picture';
      frame.referrerPolicy = 'strict-origin-when-cross-origin';
      mount.current.append(frame);
      player.current = new api.Player(frame, { events: {
        onReady: event => { if (!disposed) { setReady(true); event.target.playVideo(); } },
        onStateChange: event => { if (!disposed && [0, 1, 2].includes(event.data)) setPaused(event.data !== 1); },
        onError: fail,
      } });
    }).catch(fail);
    return () => { disposed = true; player.current?.destroy(); player.current = null; };
  }, [active]);

  function start() { setError(''); setReady(false); setPaused(false); setMuted(false); setActive(true); }
  function close() { setActive(false); requestAnimationFrame(() => poster.current?.focus()); }
  function toggleSound() {
    const next = !player.current?.isMuted();
    if (next) player.current?.mute(); else player.current?.unMute();
    setMuted(next);
  }

  return <section id="valvetronic-film" className={styles.feature} aria-labelledby="valvetronic-film-title">
    <div className={styles.copy}>
      <p className={styles.eyebrow}>In the workshop</p>
      <h3 id="valvetronic-film-title">Behind<br />the sound.</h3>
      <p className={styles.description}>A quick look at Valvetronic exhausts with Ahmed Amwell.</p>
      <p className={styles.credit}>With Ahmed Amwell</p>
      <Link href="/shop?brand=valvetronic" className={styles.cta}>Explore Valvetronic exhausts <ArrowUpRight size={17} strokeWidth={1.5} aria-hidden="true" /></Link>
    </div>
    <div className={styles.media}>
      <div className={styles.player}>
        {active ? <div ref={mount} className={styles.embed} /> : <button ref={poster} type="button" className={styles.poster} aria-label="Play Valvetronic film with Ahmed Amwell" onClick={start}>
          <Image src="/images/home/valvetronic-ahmed-short-thumbnail.webp" alt="" fill sizes="(max-width: 700px) 100vw, 50vw" className={styles.posterImage} />
          <span className={styles.thumbnailCopy} aria-hidden="true"><Image src="/brand/valvetronic.png" alt="" width={1200} height={304} unoptimized /><span className={styles.thumbnailTitle}>Behind the sound.</span><span className={styles.thumbnailCredit}>With Ahmed Amwell</span></span>
          <span className={styles.play}><Play size={26} fill="currentColor" strokeWidth={1.5} aria-hidden="true" /></span>
        </button>}
      </div>
      <div className={styles.footer}>
        {active ? <div className={styles.controls}>
          <button type="button" disabled={!ready} aria-label={paused ? 'Resume Valvetronic film' : 'Pause Valvetronic film'} onClick={() => paused ? player.current?.playVideo() : player.current?.pauseVideo()}>{paused ? <Play size={18} aria-hidden="true" /> : <Pause size={18} aria-hidden="true" />}</button>
          <button type="button" disabled={!ready} aria-label={muted ? 'Unmute Valvetronic film' : 'Mute Valvetronic film'} aria-pressed={muted} onClick={toggleSound}>{muted ? <VolumeX size={18} aria-hidden="true" /> : <Volume2 size={18} aria-hidden="true" />}</button>
          <button type="button" disabled={!ready} aria-label="Replay Valvetronic film" onClick={() => { player.current?.seekTo(0, true); player.current?.playVideo(); }}><RotateCcw size={17} aria-hidden="true" /></button>
          <button type="button" aria-label="Close Valvetronic film" onClick={close}><X size={18} aria-hidden="true" /></button>
        </div> : <span className={styles.duration}>32-second film</span>}
        <a href={`https://www.youtube.com/shorts/${videoId}`} target="_blank" rel="noopener noreferrer">Watch on YouTube <ArrowUpRight size={14} aria-hidden="true" /><span className="sr-only"> (opens in a new tab)</span></a>
      </div>
      {error && <p className={styles.error} role="status">{error}</p>}
    </div>
  </section>;
}
