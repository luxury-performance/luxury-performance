import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { programmes } from '@/lib/content';
import { Eyebrow, ArrowLink } from '@/components/ui';
import { ProgrammeCard } from '@/components/programme-card';
export function generateStaticParams() { return programmes.map(p => ({ slug: p.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = programmes.find(item => item.slug === slug);
  return { title: p ? `${p.brand} ${p.marque}` : 'Programme not found', description: p?.intro };
}
export default async function Programme({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = programmes.find(item => item.slug === slug);
  if (!p) notFound();
  const related = programmes.filter(item => item.slug !== slug).slice(0, 2);
  return <><section className="detail-intro"><Link href="/programmes" className="back-link"><ArrowLeft size={14} />All programmes</Link><div className="detail-title-row"><div><span className="detail-brand">{p.brand} / {p.marque.toUpperCase()}</span><h1>{p.title}</h1></div><span className="tiny-label">{p.category}</span></div></section><div className="detail-hero"><Image src={`/images/${p.hero}.webp`} alt={`${p.brand} ${p.marque} — ${p.model}`} fill priority sizes="100vw" quality={90} /></div><section className="detail-copy section-pad"><Eyebrow number="01">The {p.marque} programme</Eyebrow><div><h2>{p.intro}</h2><p>{p.description}</p><div className="detail-focuses">{p.focuses.map((focus,index)=><span key={focus}>0{index+1} / {focus}</span>)}</div><p className="detail-note">{p.note}</p><ArrowLink href={`/contact?vehicle=${encodeURIComponent(p.marque)}&programme=${encodeURIComponent(p.brand+' '+p.marque)}`}>Discuss your {p.marque}</ArrowLink></div></section><section className="detail-related section-pad"><div className="detail-related-head"><h2>Another perspective.</h2><ArrowLink href="/programmes">All programmes</ArrowLink></div><div className="programme-grid">{related.map(item=><ProgrammeCard key={item.slug} programme={item} index={programmes.indexOf(item)} />)}</div></section></>;
}
