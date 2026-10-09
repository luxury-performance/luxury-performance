import type { Metadata } from 'next';
import { Eyebrow, ArrowLink } from '@/components/ui';
import { EnquiryForm } from '@/components/enquiry-form';
import { contact, expertise } from '@/lib/content';
export const metadata: Metadata = { title: 'Let’s Talk', description: 'Discuss your next automotive upgrade with Luxury Performance Dubai. Call, email or start a vehicle enquiry on WhatsApp.' };
export default async function Contact({ searchParams }: { searchParams: Promise<{ interest?: string; vehicle?: string; programme?: string }> }) {
  const query = await searchParams;
  const interest = expertise.some(item=>item.title===query.interest) ? query.interest : '';
  return <><section className="page-intro"><Eyebrow>Let’s talk / Dubai & beyond</Eyebrow><h1>It starts with<br /><span>a conversation.</span></h1><div className="page-intro-bottom"><p>An idea. A specific part. A completely new direction.<br />Tell us where you want to take your car.</p></div></section><section className="contact-layout"><div className="contact-info"><p>Speak directly with our team for product guidance, fitment, availability and installation support.</p><a className="contact-method" href={`tel:${contact.telephone}`}>{contact.phone}</a><a className="contact-method" href={`mailto:${contact.email}`}>{contact.email}</a><ArrowLink href={contact.whatsapp} external>Message us on WhatsApp</ArrowLink><div className="contact-address"><span className="tiny-label">Find us in Dubai</span><a href={contact.maps} target="_blank" rel="noopener noreferrer">4th Street, Al Quoz Industrial 3<br />Dubai, United Arab Emirates ↗</a><p>Monday–Saturday · 10am–8pm</p></div></div><EnquiryForm initialInterest={interest} initialVehicle={typeof query.vehicle==='string'?query.vehicle.slice(0,150):''} programme={typeof query.programme==='string'?query.programme.slice(0,100):''} /></section></>;
}
