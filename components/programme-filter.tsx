'use client';
import { useState } from 'react';
import { programmes } from '@/lib/content';
import { ProgrammeCard } from './programme-card';
export function ProgrammeFilter() {
  const [filter, setFilter] = useState('All programmes');
  const filtered = filter === 'All programmes' ? programmes : programmes.filter(p => p.marque === filter);
  return <><div className="filter-bar" aria-label="Filter programmes by marque">{['All programmes', ...programmes.map(p => p.marque)].map(name => <button key={name} onClick={() => setFilter(name)} aria-pressed={filter === name}>{name}{name === 'All programmes' && <small>04</small>}</button>)}</div><div className="programme-results" aria-live="polite"><span className="sr-only">{filtered.length} programmes</span><div className="programme-grid">{filtered.map(p => <ProgrammeCard key={p.slug} programme={p} index={programmes.indexOf(p)} />)}</div></div></>;
}
