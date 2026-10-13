"use client";
/* eslint-disable @next/next/no-img-element */
import { useState } from 'react';
import { ArrowUpRight, Play, Plus, Minus } from 'lucide-react';

export function ProductVideos({ ids, title }: { ids: string[]; title: string }) {
  const [expanded, setExpanded] = useState(false);
  const [playing, setPlaying] = useState<string | null>(null);
  if (!ids.length) return null;
  const visible = expanded ? ids : ids.slice(0, 2);
  function toggle() {
    if (expanded && playing && !ids.slice(0, 2).includes(playing)) setPlaying(null);
    setExpanded(!expanded);
  }
  return <section className="shop-product-videos" id="product-videos" aria-labelledby="product-videos-title">
    <header><div><span className="tiny-label">Valvetronic Designs</span><h2 id="product-videos-title">Hear it in action.</h2></div><p>Explore the sound and character of this exhaust. Select a video to play.</p></header>
    <div className={`shop-video-grid ${ids.length === 1 ? 'shop-video-grid-single' : ''}`} id="product-video-list">
      {visible.map((id, index) => <article className="shop-video-card" key={id}>
        <div className="shop-video-player">{playing === id ? <iframe src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&playsinline=1&rel=0`} title={`${title} — video ${index + 1}`} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin"/> : <button type="button" className="shop-video-poster" aria-label={`Play Valvetronic video ${index + 1}`} onClick={() => setPlaying(id)}><img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" width={480} height={360} loading="lazy"/><span className="shop-video-play"><Play size={22} fill="currentColor"/></span><span className="shop-video-caption">Play video {String(index + 1).padStart(2, '0')}</span></button>}</div>
        <a href={`https://www.youtube.com/watch?v=${id}`} target="_blank" rel="noopener noreferrer">Watch on YouTube <ArrowUpRight size={14}/><span className="sr-only"> (opens a new tab)</span></a>
      </article>)}
    </div>
    {ids.length > 2 && <button type="button" className="shop-video-toggle" aria-expanded={expanded} aria-controls="product-video-list" onClick={toggle}>{expanded ? 'Show fewer videos' : `View all ${ids.length} videos`}{expanded ? <Minus size={16}/> : <Plus size={16}/>}</button>}
  </section>;
}
