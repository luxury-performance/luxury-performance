'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { ValvetronicSoundHeadline, type SoundEffectStyle } from './valvetronic-sound-headline';
import hero from './brand-hero.module.css';
import styles from './sound-effects-preview.module.css';

const effects: { value: SoundEffectStyle; label: string; description: string }[] = [
  { value: 'waveform', label: 'Waveform', description: 'A flowing signal that travels out of the tip.' },
  { value: 'pressure', label: 'Pressure rings', description: 'Expanding pulses with each rise and held rev.' },
  { value: 'streaks', label: 'Energy streaks', description: 'Short trails of energy, driven by the exhaust note.' },
];

export function SoundEffectsPreview() {
  const [effect, setEffect] = useState<SoundEffectStyle>('waveform');
  return <section className={`${hero.hero} ${styles.stage}`} data-home-hero aria-label="Valvetronic sound style preview">
    <span className={`${hero.context} ${styles.context}`}>Valvetronic Designs <span aria-hidden="true">/</span> Sound styles</span>
    <div className={hero.layer} data-active="true">
      <article className={hero.slide} data-brand="valvetronic">
        <picture className={hero.picture}>
          <source media="(max-width: 700px)" srcSet="/images/home/valvetronic-mobile.jpg" />
          <Image src="/images/home/valvetronic-porsche.webp" alt="Porsche GT3 RS with a Valvetronic Designs exhaust in the workshop" fill sizes="100vw" loading="eager" />
        </picture>
        <div className={hero.shade} />
        <div className={`${hero.copy} ${styles.copy}`}>
          <Image className={hero.logo} src="/brand/valvetronic.png" alt="Valvetronic Designs" width={1200} height={304} />
          <h1 className={styles.headline}><ValvetronicSoundHeadline effect={effect} /></h1>
          <p>Tap the speaker to hear the exhaust. You can switch styles while the sound plays.</p>
          <Link className={hero.cta} href="/">Back to the homepage <span aria-hidden="true">↗</span></Link>
        </div>
      </article>
    </div>
    <div className={styles.panel}>
      <div className={styles.options} role="group" aria-label="Sound effect style">
        {effects.map(item => <button key={item.value} type="button" aria-pressed={effect === item.value} onClick={() => setEffect(item.value)}>{item.label}</button>)}
      </div>
      <p className={styles.description} aria-live="polite">{effects.find(item => item.value === effect)?.description}</p>
    </div>
  </section>;
}
