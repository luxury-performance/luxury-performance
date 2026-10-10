'use client';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { expertise } from '@/lib/content';
import { Eyebrow } from './ui';

const imageDescriptions = ['Porsche exhaust installation in a workshop', 'Carbon aerodynamic detailing on a supercar', 'Forged wheel on a Lamborghini', 'Ferrari SF90 in the workshop'];
export function Expertise() {
  const [active, setActive] = useState(0);
  const section = useRef<HTMLElement>(null);
  const sticky = useRef<HTMLDivElement>(null);
  const selected = expertise[active];
  useEffect(() => {
    const root = section.current;
    if (!root) return;
    const media = matchMedia('(min-width: 1000px) and (min-height: 680px) and (prefers-reduced-motion: no-preference)');
    let frame = 0;
    const update = () => {
      frame = 0;
      if (!media.matches || !sticky.current) return;
      const rect = root.getBoundingClientRect();
      const distance = root.offsetHeight - sticky.current.offsetHeight;
      const progress = Math.min(1, Math.max(0, (112 - rect.top) / Math.max(distance, 1)));
      root.style.setProperty('--chapter-progress', String(progress));
      setActive(Math.min(3, Math.round(progress * 3)));
    };
    const scroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    const configure = () => { root.classList.toggle('scroll-chapters', media.matches); update(); };
    configure(); media.addEventListener('change', configure);
    addEventListener('scroll', scroll, { passive: true }); addEventListener('resize', scroll);
    return () => { cancelAnimationFrame(frame); media.removeEventListener('change', configure); removeEventListener('scroll', scroll); removeEventListener('resize', scroll); root.classList.remove('scroll-chapters'); };
  }, []);
  function select(index: number) {
    setActive(index);
    if (section.current?.classList.contains('scroll-chapters') && sticky.current) {
      const start = scrollY + section.current.getBoundingClientRect().top - 112;
      const distance = section.current.offsetHeight - sticky.current.offsetHeight;
      window.scrollTo({ top: start + (index / 3) * distance, behavior: 'smooth' });
    }
  }
  return <section ref={section} className="expertise-section immersive-expertise" id="expertise">
    <div ref={sticky} className="expertise-sticky">
      <div className="expertise-heading"><div><Eyebrow number="02">Our expertise</Eyebrow><h2>Every detail.<br /><span className="text-muted">A difference.</span></h2></div><span className="chapter-counter" aria-hidden="true">0{active + 1}<span> / 04</span></span></div>
      <div className="expertise-grid"><div className="expertise-list" role="tablist" aria-label="Our expertise" aria-orientation="vertical">{expertise.map((item, index) => <button key={item.title} role="tab" id={`expertise-tab-${index}`} aria-selected={active === index} aria-controls={`expertise-panel-${index}`} tabIndex={active === index ? 0 : -1} onClick={() => select(index)} onKeyDown={event => {
        let next = index;
        if (event.key === 'ArrowDown') next = (index + 1) % expertise.length;
        else if (event.key === 'ArrowUp') next = (index + expertise.length - 1) % expertise.length;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = expertise.length - 1;
        else return;
        event.preventDefault(); select(next); document.getElementById(`expertise-tab-${next}`)?.focus({ preventScroll: true });
      }} className={`expertise-tab ${active === index ? 'selected' : ''}`}><span className="tab-number">0{index + 1}</span><span>{item.title}</span><ArrowUpRight size={22} strokeWidth={1.2} /></button>)}<p className="expertise-aside">One point of contact.<br />Every detail considered.</p><div className="chapter-track" aria-hidden="true"><span /></div><span className="chapter-scroll-note">Scroll to explore · or choose a chapter</span></div>
      <div className="expertise-panels">{expertise.map((item, index) => <div key={item.title} className="expertise-panel" id={`expertise-panel-${index}`} role="tabpanel" hidden={active !== index} tabIndex={0} aria-labelledby={`expertise-tab-${index}`}><div className="expertise-image"><Image src={`/images/${item.image}.webp`} alt={imageDescriptions[index]} fill sizes="(max-width: 700px) 90vw, 52vw" /><span className="image-caption">{item.short}</span></div><div className="expertise-detail"><div><p>{item.text}</p><span className="expertise-items">{item.items}</span></div><Link href={`/contact?interest=${encodeURIComponent(item.title)}`} aria-label={`Enquire about ${item.title}`} className="arrow-disc"><ArrowUpRight size={21} /></Link></div></div>)}</div></div>
      <span className="sr-only">Selected expertise: {selected.title}</span>
    </div>
  </section>;
}
