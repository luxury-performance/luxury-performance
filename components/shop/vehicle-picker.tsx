/* eslint-disable @next/next/no-img-element */
'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import type { VehicleBody, VehicleGeneration } from '@/lib/shop/techart-fitment';
import styles from './vehicle-selector.module.css';

function BodyCard({ body, generation, initialFit, shopPath }: { body: VehicleBody; generation: string; initialFit?: string; shopPath: string }) {
  const [fit, setFit] = useState(body.choices.some(choice => choice.fit === initialFit) ? initialFit! : body.choices[0].fit);
  const selected = body.choices.find(choice => choice.fit === fit)!;
  const trim = fit.slice(6);
  const family = /^turbo/.test(trim) ? 'turbo' : /^gt3/.test(trim) ? 'gt3' : /gts/.test(trim) ? 'gts' : 'carrera';
  const image = body.key === 'coupe' ? family : `${family === 'turbo' ? 'turbo' : family === 'gts' ? 'gts' : 'carrera'}-${body.key}`;
  const query = new URLSearchParams({ brand: 'techart', make: 'porsche', model: '911', fit, body: body.key });
  return <article className={styles.card}>
    <div className={styles.image}><img src={`/vehicle-selector/vehicle-selector-${image}.png`} alt="" width={500} height={180} loading="lazy" /></div>
    <div className={styles.cardBody}>
      <div className={styles.cardHeading}><h3>{body.name}</h3><p role="status" aria-live="polite">{selected.count} {selected.count === 1 ? 'part' : 'parts'}</p></div>
      <div className={styles.pills} role="group" aria-label={`${generation} ${body.name} trim`}>
        {body.choices.map(choice => <button key={choice.fit} type="button" aria-pressed={choice.fit === fit} onClick={() => setFit(choice.fit)}>{choice.name}</button>)}
      </div>
      <Link className={styles.shop} href={`${shopPath}?${query}`} aria-label={`Shop parts: 911 ${generation} ${selected.name} ${body.name}`}>Shop parts <ArrowUpRight size={17} aria-hidden="true" /></Link>
    </div>
  </article>;
}

export function VehiclePicker({ options, initialFit, shopPath }: { options: VehicleGeneration[]; initialFit?: string; shopPath: string }) {
  const initialGeneration = initialFit?.slice(0, 5).replace('_', '.') || '992.1';
  const [generationName, setGeneration] = useState(initialGeneration);
  const [familyKey, setFamily] = useState(() => options.find(item => item.name === initialGeneration)?.families.find(family => family.bodies.some(body => body.choices.some(choice => choice.fit === initialFit)))?.key || 'carrera');
  const generation = options.find(item => item.name === generationName) || options[0];
  const family = generation.families.find(item => item.key === familyKey) || generation.families[0];
  return <div className={styles.selector}>
    <div className={styles.control}><span className={styles.label}>Generation</span><div className={styles.pills} role="group" aria-label="Porsche 911 generation">
      {options.map(item => <button key={item.name} type="button" aria-pressed={generation.name === item.name} onClick={() => setGeneration(item.name)}>{item.name}</button>)}
    </div></div>
    {!!generation.families.length && <div className={styles.control}><span className={styles.label}>Model family</span><div className={styles.pills} role="group" aria-label="Porsche 911 model family">
      {generation.families.map(item => <button key={item.key} type="button" aria-pressed={family.key === item.key} onClick={() => setFamily(item.key)}>{item.name}</button>)}
    </div></div>}
    {family ? <>
      <div className={styles.familyHeading}><h3>911 {generation.name} {family.name}</h3><p>Choose your body style and trim.</p></div>
      <div className={styles.grid}>{family.bodies.map(body => <BodyCard key={`${generation.name}:${family.key}:${body.key}`} body={body} generation={generation.name} initialFit={initialFit} shopPath={shopPath} />)}</div>
      <p className={styles.note}>Model images are illustrative; 991 selections use 992 imagery. Counts reflect recorded body-style fitment. Parts needing confirmation are listed separately.</p>
    </> : <p className={styles.note}>No parts are currently listed for this generation. <Link href="/contact">Ask us about your Porsche.</Link></p>}
  </div>;
}
