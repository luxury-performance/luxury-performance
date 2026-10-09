import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import type { ReactNode } from 'react';

export function ArrowLink({ href, children, light = false, external = false, className = '' }: { href: string; children: ReactNode; light?: boolean; external?: boolean; className?: string }) {
  return <Link href={href} className={`arrow-link ${light ? 'light' : ''} ${className}`} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}><span>{children}</span><span className="arrow-disc"><ArrowUpRight size={19} strokeWidth={1.5} /></span></Link>;
}
export function Eyebrow({ children, number, dark = false }: { children: ReactNode; number?: string; dark?: boolean }) {
  return <div className={`eyebrow ${dark ? 'on-dark' : ''}`}><span className="eyebrow-dot" />{children}{number && <span className="section-number">/{number}</span>}</div>;
}
