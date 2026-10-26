'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';
import styles from './novitec-models.module.css';

const models = [
  { name: 'Purosangue', make: 'Ferrari', image: 'purosangue.jpg', collection: 'ferrari-purosangue' },
  { name: 'Revuelto', make: 'Lamborghini', image: 'revuelto.jpg', collection: 'lamborghini-revuelto' },
  { name: 'F8', make: 'Ferrari', image: 'f8.jpg', collection: 'ferrari-f8' },
  { name: '812', make: 'Ferrari', image: '812.jpg', href: '/shop?brand=novitec&make=ferrari&q=Ferrari+812' },
  { name: 'Urus', make: 'Lamborghini', image: 'urus.jpg', collection: 'lamborghini-urus' },
  { name: 'SF90', make: 'Ferrari', image: 'sf90.jpg', collection: 'ferrari-sf90' },
  { name: '12Cilindri', make: 'Ferrari', image: '12cilindri.jpg', collection: 'ferrari-12cilindri' },
  { name: 'Cullinan', make: 'Rolls-Royce', image: 'cullinan.jpg', collection: 'rolls-royce-cullinan' },
  { name: '750S', make: 'McLaren', image: '750s.jpg', collection: 'mclaren-750s' },
  { name: 'Spectre', make: 'Rolls-Royce', image: 'spectre.jpg', collection: 'rolls-royce-spectre' },
];

export function NovitecModels() {
  const rail = useRef<HTMLUListElement>(null);
  const [ends, setEnds] = useState({ start: true, end: false });

  useEffect(() => {
    const track = rail.current;
    if (!track) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const start = track.scrollLeft < 2;
      const end = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
      setEnds(previous => previous.start === start && previous.end === end ? previous : { start, end });
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    track.addEventListener('scroll', schedule, { passive: true });
    const observer = new ResizeObserver(schedule);
    observer.observe(track);
    return () => { cancelAnimationFrame(frame); track.removeEventListener('scroll', schedule); observer.disconnect(); };
  }, []);

  function move(direction: number) {
    const track = rail.current;
    const card = track?.firstElementChild;
    if (!track || !card) return;
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    track.scrollBy({ left: direction * (card.getBoundingClientRect().width + gap), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }

  return <section id="novitec" className={styles.section} aria-labelledby="novitec-models-title">
    <div className={styles.heading}>
      <div><h2 id="novitec-models-title"><Image src="/brand/novitec.svg" alt="NOVITEC" width={228} height={45}/></h2><p>Choose your model. Make it your own.</p></div>
      <div className={styles.controls}>
        <button type="button" aria-label="Previous NOVITEC models" aria-controls="novitec-model-cards" disabled={ends.start} onClick={() => move(-1)}><ArrowLeft size={20} strokeWidth={1.5} aria-hidden="true"/></button>
        <button type="button" aria-label="Next NOVITEC models" aria-controls="novitec-model-cards" disabled={ends.end} onClick={() => move(1)}><ArrowRight size={20} strokeWidth={1.5} aria-hidden="true"/></button>
      </div>
    </div>
    <ul ref={rail} id="novitec-model-cards" className={styles.rail} aria-label="NOVITEC vehicle programmes">
      <li className={styles.item}><Link href="/shop?brand=novitec" className={styles.card} aria-label="Shop all NOVITEC parts">
        <div className={styles.image}><Image src="/images/novitec-models/all-novitec.png" alt="Yellow Ferrari outside the NOVITEC headquarters" fill quality={90} sizes="(max-width:700px) 76vw, (max-width:1100px) 42vw, 25vw"/></div>
        <div className={styles.caption}><div><h3>All NOVITEC</h3><p>Explore all parts</p></div><ArrowUpRight size={20} strokeWidth={1.5} aria-hidden="true"/></div>
      </Link></li>
      {models.map(model => <li key={model.name} className={styles.item}><Link href={model.href || `/collections/${model.collection}?brand=novitec`} className={styles.card} aria-label={`Shop NOVITEC for ${model.make} ${model.name}`}>
        <div className={styles.image}><Image src={`/images/novitec-models/${model.image}`} alt={`NOVITEC ${model.make} ${model.name}`} fill quality={90} sizes="(max-width:700px) 76vw, (max-width:1100px) 42vw, 25vw"/></div>
        <div className={styles.caption}><div><h3>{model.name}</h3><p>{model.make}</p></div><ArrowUpRight size={20} strokeWidth={1.5} aria-hidden="true"/></div>
      </Link></li>)}
    </ul>
  </section>;
}
