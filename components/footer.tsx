import { BrandLogo } from './brand-logo';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { contact } from '@/lib/content';
export function Footer() {
  return <footer className="site-footer">
    <div className="footer-top"><Link href="/" className="footer-brand" aria-label="Luxury Performance home"><BrandLogo /></Link><p>Exceptional cars.<br />Individual expression.</p><Link href="https://lxpforged.com" target="_blank" rel="noopener noreferrer" className="store-link">Explore our online store <ArrowUpRight size={18} /></Link></div>
    <div className="footer-grid"><div><span className="tiny-label">Find us</span><a href={contact.maps} target="_blank" rel="noopener noreferrer">4th Street, Al Quoz Industrial 3<br />Dubai, United Arab Emirates <ArrowUpRight size={13} /></a><p className="footer-hours">Monday–Saturday · 10am–8pm</p></div><div><span className="tiny-label">Start a conversation</span><a href={`tel:${contact.telephone}`}>{contact.phone}</a><a href={`mailto:${contact.email}`}>{contact.email}</a></div><div className="footer-navigation"><span className="tiny-label">Discover</span><Link href="/programmes">Brand programmes</Link><Link href="/about">Our world</Link><Link href="/contact">Contact</Link></div></div>
    <div className="footer-bottom"><span>© {new Date().getFullYear()} Luxury Performance</span><span>A division of The Luxury Group</span><a href="#top">Back to top ↑</a></div>
  </footer>;
}
