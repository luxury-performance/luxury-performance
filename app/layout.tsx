import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { BrandIntro } from '@/components/brand-intro';
import { introBootstrap } from '@/lib/intro-bootstrap';
import { SiteMotion } from '@/components/site-motion';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import './globals.css';
const montserrat = localFont({ src: './Montserrat-Variable.ttf', variable: '--font-montserrat', display: 'swap' });
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3002'),
  title: { default: 'Luxury Performance — Beyond Ordinary', template: '%s | Luxury Performance' },
  description: 'Performance, aerodynamics, forged wheels and genuine OEM components for extraordinary cars. Discover Luxury Performance, Dubai. A division of The Luxury Group.',
  openGraph: { title: 'Luxury Performance — Beyond Ordinary', description: 'Exceptional cars. Individual expression. Discover Luxury Performance, Dubai.', type: 'website', locale: 'en_AE', images: [{ url: '/images/hero-luxury-group.webp', width: 3200, height: 1800, alt: 'The Luxury Group headquarters and supercar lineup in Dubai' }] },
  twitter: { card: 'summary_large_image' },
};
export const viewport: Viewport = { themeColor: '#101010' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" suppressHydrationWarning className={montserrat.variable}><body id="top"><script dangerouslySetInnerHTML={{ __html: introBootstrap }} /><BrandIntro /><div id="site-shell"><Header /><SiteMotion /><main id="main">{children}</main><Footer /></div></body></html>;
}
