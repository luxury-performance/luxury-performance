/* eslint-disable @next/next/no-img-element */
import Image, { getImageProps } from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { contact } from '@/lib/content';
import { brandHeroImages } from '@/lib/brand-hero-images';
import { HomeProducts } from './home-products';
import styles from './homepage.module.css';
import { BrandHero } from './brand-hero';
import heroStyles from './brand-hero.module.css';
import { ValvetronicSoundHeadline } from './valvetronic-sound-headline';
import { TechartPersonalHeadline } from './techart-personal-headline';

const heroSlides = [
  {
    slug: 'novitec', name: 'NOVITEC', logo: '/brand/novitec.svg', logoWidth: 228, logoHeight: 45,
    ...brandHeroImages.novitec!,
    title: <>Performance<br /><span className={heroStyles.glitchPhrase}>
      <span className="sr-only">en vogue</span>
      <span className={`${heroStyles.glitchWord} ${heroStyles.glitchBase}`} data-text="en vogue" aria-hidden="true">en vogue</span>
      <span className={`${heroStyles.glitchWord} ${heroStyles.glitchAlternate}`} data-text="in style" aria-hidden="true">in style</span>
    </span></>,
    description: 'NOVITEC carbon aerodynamics, forged wheels and performance exhausts for Ferrari, Lamborghini, McLaren and Rolls-Royce.',
    href: '/shop?brand=novitec', cta: 'Shop NOVITEC',
  },
  {
    slug: 'valvetronic', name: 'Valvetronic Designs', logo: '/brand/valvetronic.png', logoWidth: 1200, logoHeight: 304,
    ...brandHeroImages.valvetronic!,
    title: <ValvetronicSoundHeadline />,
    description: 'Explore Valvetronic Designs valved exhaust systems, downpipes and components, with vehicle fitment advice from Dubai.',
    href: '/shop?brand=valvetronic', cta: 'Shop Valvetronic',
  },
  {
    slug: 'techart', name: 'TECHART', logo: '/brand/techart.svg', logoWidth: 487, logoHeight: 35,
    ...brandHeroImages.techart!,
    title: <TechartPersonalHeadline />,
    description: 'TECHART aerodynamics, wheels, interior and performance upgrades. Start with your Porsche to find the parts that fit.',
    href: '/partners/techart#vehicles', cta: 'Choose your Porsche',
  },
];

export function HomeHero() {
  return <BrandHero brands={heroSlides.map(({ slug, name }) => ({ slug, name }))}>
    {heroSlides.map((slide, index) => {
      const mobile = slide.mobile ? getImageProps({ ...slide.mobile, alt: '', sizes: '100vw', quality: 95 }).props : null;
      return <article key={slide.slug} className={heroStyles.slide} data-brand={slide.slug}>
        <picture className={heroStyles.picture}>
          {mobile && <source media="(max-width: 700px)" srcSet={mobile.srcSet} sizes="100vw" />}
          <Image src={slide.image} alt={slide.alt} fill quality={95} sizes="100vw" loading={index === 0 ? 'eager' : 'lazy'} fetchPriority={index === 0 ? 'high' : 'auto'} />
        </picture>
        <div className={heroStyles.shade} />
        <div className={heroStyles.copy}>
          <img className={heroStyles.logo} src={slide.logo} alt={slide.name} width={slide.logoWidth} height={slide.logoHeight} />
          <h2>{slide.title}</h2>
          <p>{slide.description}</p>
          <Link className={heroStyles.cta} href={slide.href}>{slide.cta}<ArrowUpRight size={18} strokeWidth={1.4} aria-hidden="true" /></Link>
        </div>
      </article>;
    })}
  </BrandHero>;
}

const brands = [
  { name: 'NOVITEC', logo: 'novitec.png', slug: 'novitec', line: 'Exhausts, carbon, wheels and suspension for supercars.' },
  { name: 'TECHART', logo: 'techart.webp', slug: 'techart', line: 'Porsche personalisation, from one detail to a complete programme.' },
  { name: 'Valvetronic Designs', logo: 'valvetronic-logo.png', slug: 'valvetronic', line: 'Vehicle-specific valved exhaust systems and components.' },
  { name: 'FI Exhaust', logo: 'fi-exhaust.jpg', slug: 'fi-exhaust', line: 'Valved exhaust options, specified around your car.' },
];
const vehicles = [
  ['Ferrari', 'ferrari'], ['Lamborghini', 'lamborghini'], ['Porsche', 'porsche'], ['McLaren', 'mclaren'],
  ['Rolls-Royce', 'rolls_royce'], ['Mercedes-Benz', 'mercedes'], ['BMW', 'bmw'], ['Audi', 'audi'],
];
const novitecModels = [
  ['Purosangue', 'ferrari', 'purosangue'], ['Revuelto', 'lamborghini', 'revuelto'], ['F8', 'ferrari', 'f8'], ['SF90', 'ferrari', 'sf90'],
];

export function Homepage() {
  return <div className={styles.home}>
    <HomeHero />
    <section id="brands" className={`${styles.container} ${styles.section}`} aria-labelledby="brands-title">
      <div className={styles.sectionHead}>
        <h2 id="brands-title">The names behind<br />the performance.</h2>
        <Link href="/partners" className={styles.textLink}>Explore our partners</Link>
      </div>
      <div className={styles.brandGrid}>
        {brands.map(brand => <Link key={brand.slug} href={`/partners/${brand.slug}`} className={styles.brandItem} data-brand={brand.slug}>
          <div className={styles.brandLogo}><img src={`/brand/navigation/${brand.logo}`} alt="" width="180" height="48" loading="lazy" /></div>
          <div><h3>{brand.name}</h3><p>{brand.line}</p></div>
        </Link>)}
      </div>
    </section>
    <section className={styles.vehicles} aria-labelledby="vehicles-title">
      <div className={styles.container}>
        <div className={styles.sectionHead}><h2 id="vehicles-title">Start with your car.</h2><p>Find the parts and programmes available for your marque.</p></div>
        <div className={styles.vehicleGrid}>
          {vehicles.map(([name, slug]) => <Link key={slug} href={`/shop?make=${slug}`}>{name}<ArrowUpRight aria-hidden="true" strokeWidth={1.3} /></Link>)}
        </div>
      </div>
    </section>
    <section className={`${styles.container} ${styles.section}`} aria-labelledby="techart-title">
      <div className={styles.feature}>
        <div className={styles.featureImage}><Image src="/images/porsche.webp" alt="White TECHART Porsche photographed in the manufacturer's bright studio" fill sizes="(max-width: 700px) 100vw, 55vw" /></div>
        <div className={styles.featureCopy}>
          <h2 id="techart-title">TECHART.<br />For your Porsche.</h2>
          <p>Choose your model, generation and body style. Then explore the exterior, wheel, interior and performance options that fit.</p>
          <Link className={styles.button} href="/partners/techart#vehicles">Choose your Porsche</Link>
          <Link className={styles.textLink} href="/partners/techart">Explore TECHART</Link>
        </div>
      </div>
    </section>
    <section className={`${styles.container} ${styles.section} ${styles.products}`} aria-labelledby="products-title">
      <div className={styles.sectionHead}><h2 id="products-title">For the Purosangue.</h2><Link className={styles.textLink} href="/shop?brand=novitec&make=ferrari&model=purosangue">Shop the range</Link></div>
      <Suspense fallback={<div className={styles.productGrid} aria-label="Loading products">{[0,1,2,3].map(index => <div key={index} className={styles.productImage} aria-hidden="true" />)}</div>}>
        <HomeProducts />
      </Suspense>
      <div className={styles.modelLinks} aria-label="More NOVITEC parts"><span>More from NOVITEC</span>{novitecModels.slice(1).map(([name,make,model]) => <Link key={model} href={`/shop?brand=novitec&make=${make}&model=${model}`}>{name}</Link>)}<Link href="/shop?brand=novitec&make=ferrari">NOVITEC for Ferrari</Link><Link href="/partners/novitec">Explore NOVITEC</Link></div>
    </section>
    <section className={styles.dark} aria-labelledby="valvetronic-title">
      <div className={`${styles.container} ${styles.feature}`}>
        <div className={styles.featureImage}><Image src="/images/home/valvetronic-porsche.webp" alt="Porsche GT3 RS with a Valvetronic Designs exhaust in a working installation bay" fill sizes="(max-width: 700px) 100vw, 55vw" /></div>
        <div className={styles.featureCopy}>
          <h2 id="valvetronic-title">Valvetronic Designs.</h2>
          <p>Explore valved sport exhaust systems, downpipes and supporting components. Watch sound videos on selected product pages.</p>
          <Link className={styles.button} href="/partners/valvetronic">Shop Valvetronic</Link>
          <div className={styles.featureLinks}><Link href="/shop?brand=valvetronic&make=porsche">Porsche</Link><Link href="/shop?brand=valvetronic&make=bmw">BMW</Link><Link href="/shop?brand=valvetronic&make=mercedes">Mercedes-Benz</Link></div>
        </div>
      </div>
    </section>
    <section id="expertise" className={`${styles.container} ${styles.section}`} aria-labelledby="support-title">
      <div className={styles.service}>
        <div>
          <h2 id="support-title">Good parts.<br />The right advice.</h2>
          <p className={styles.serviceIntro}>Luxury Performance is based in Al Quoz, Dubai, and part of The Luxury Group. We bring genuine partner-brand components, fitment advice and installation support together.</p>
          <div className={styles.serviceLinks}><a className={styles.button} href={contact.whatsapp} target="_blank" rel="noopener noreferrer">Ask us about your car</a><Link className={styles.textLink} href="/about">Our story</Link></div>
        </div>
        <ul className={styles.serviceList}>
          <li><h3>Carbon, wheels and performance</h3><p>One component or a complete specification, selected around your car.</p></li>
          <li><h3>Genuine OEM parts</h3><p>Original components with condition and fitment details on each listing. <Link href="/shop?brand=oem">Browse OEM parts</Link></p></li>
          <li><h3>Collectibles</h3><p>Scale cars and automotive pieces for your collection. <Link href="/shop?brand=collectibles">Explore collectibles</Link></p></li>
          <li><h3>Fitment and installation support</h3><p>Share your model and year. We will help confirm the right options. <Link href="/contact">Speak to our team</Link></p></li>
        </ul>
      </div>
    </section>
    <div className={`${styles.container} ${styles.location}`}>
      <p>4th Street, Al Quoz Industrial 3, Dubai<br />Monday to Saturday, 10am to 8pm</p>
      <Link href="/about#dubai">Visit Luxury Performance</Link>
    </div>
  </div>;
}
