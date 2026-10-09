import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { programmes } from '@/lib/content';
export function ProgrammeCard({ programme, index = 0 }: { programme: typeof programmes[number]; index?: number }) {
  return <Link className="programme-card" href={`/programmes/${programme.slug}`}><div className="programme-image"><Image src={`/images/${programme.image}.webp`} alt={`${programme.brand} ${programme.marque} programme`} fill sizes="(max-width: 650px) 90vw, 45vw" /><span className="programme-badge">{programme.brand}</span><span className="programme-open"><ArrowUpRight size={23} strokeWidth={1.3} /></span></div><div className="programme-caption"><span className="programme-index">0{index + 1}</span><div><h3>{programme.marque}</h3><p>{programme.category}</p></div><span className="programme-view">Explore <ArrowUpRight size={14} /></span></div></Link>;
}
