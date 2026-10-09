'use client';
import { useState } from 'react';
import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { expertise } from '@/lib/content';
export function Expertise() {
  const [active, setActive] = useState(0);
  const selected = expertise[active];
  return <div className="expertise-grid"><div className="expertise-list" role="tablist" aria-label="Our expertise" aria-orientation="vertical">{expertise.map((item, index) => <button key={item.title} role="tab" id={`expertise-tab-${index}`} aria-selected={active === index} aria-controls={`expertise-panel-${index}`} tabIndex={active === index ? 0 : -1} onClick={() => setActive(index)} onKeyDown={event => {
    let next = index;
    if (event.key === 'ArrowDown') next = (index + 1) % expertise.length;
    else if (event.key === 'ArrowUp') next = (index + expertise.length - 1) % expertise.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = expertise.length - 1;
    else return;
    event.preventDefault(); setActive(next); document.getElementById(`expertise-tab-${next}`)?.focus();
  }} className={`expertise-tab ${active === index ? 'selected' : ''}`}><span className="tab-number">0{index + 1}</span><span>{item.title}</span><ArrowUpRight size={22} strokeWidth={1.2} /></button>)}<p className="expertise-aside">One point of contact.<br />Every detail considered.</p></div><div className="expertise-panel" id={`expertise-panel-${active}`} role="tabpanel" tabIndex={0} aria-labelledby={`expertise-tab-${active}`}><div className="expertise-image"><Image key={selected.image} src={`/images/${selected.image}.webp`} alt={selected.title === 'Genuine OEM parts' ? 'Ferrari SF90 in the workshop' : selected.title === 'Wheels & suspension' ? 'Forged wheel on a Lamborghini' : selected.title === 'Carbon & aerodynamics' ? 'Carbon aerodynamic detailing on a supercar' : 'Porsche exhaust installation in a workshop'} fill sizes="(max-width: 700px) 90vw, 52vw" /><span className="image-caption">{selected.short}</span></div><div className="expertise-detail"><div><p>{selected.text}</p><span className="expertise-items">{selected.items}</span></div><Link href={`/contact?interest=${encodeURIComponent(selected.title)}`} aria-label={`Enquire about ${selected.title}`} className="arrow-disc"><ArrowUpRight size={21} /></Link></div></div></div>;
}
