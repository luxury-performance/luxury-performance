'use client';
import { useState, useRef } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { contact, expertise } from '@/lib/content';
import { ArrowLink } from './ui';
export function EnquiryForm({ initialInterest = '', initialVehicle = '', programme = '' }: { initialInterest?: string; initialVehicle?: string; programme?: string }) {
  const [message, setMessage] = useState('');
  const confirmation = useRef<HTMLDivElement>(null);
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get('name') ?? '').trim();
    const vehicle = String(data.get('vehicle') ?? '').trim();
    if (!name || !vehicle) return;
    const text = [`Hello Luxury Performance, my name is ${name}.`, `Vehicle: ${vehicle}${data.get('year') ? ` (${data.get('year')})` : ''}.`, programme ? `Programme: ${programme}.` : '', `Interested in: ${data.get('interest') || 'Advice on my vehicle'}.`, String(data.get('details') ?? '').trim()].filter(Boolean).join('\n\n');
    setMessage(text);
    requestAnimationFrame(() => { confirmation.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'center' }); confirmation.current?.focus({preventScroll:true}); });
  }
  return <form className="enquiry-form" onSubmit={handleSubmit} onChange={()=>{if(message)setMessage('');}}><h2 className="form-heading">Tell us what you have in mind.</h2><p className="form-subheading">A few details. Then a proper conversation.{programme && <><br />Enquiring about {programme}.</>}</p><div className="field-grid"><label className="field"><span>Your name *</span><input name="name" placeholder="Your name" required pattern=".*\S.*" autoComplete="name" maxLength={100} /></label><label className="field"><span>Model year</span><input name="year" placeholder="e.g. 2024" type="text" inputMode="numeric" pattern="[0-9]{4}" title="Enter a four-digit model year" maxLength={4} /></label><label className="field full"><span>Your vehicle *</span><input name="vehicle" placeholder="e.g. Porsche 911 GT3 (992)" required pattern=".*\S.*" defaultValue={initialVehicle} maxLength={150} /></label></div><fieldset className="interest-group"><legend className="form-label">What are you exploring?</legend><div className="interest-options">{[...expertise.map(item => item.title), 'A complete programme', 'Help me decide'].map(interest=><label key={interest}><input type="radio" name="interest" value={interest} defaultChecked={initialInterest === interest || (!initialInterest && interest === 'Help me decide')} /><span>{interest}</span></label>)}</div></fieldset><label className="field"><span>Anything else?</span><textarea name="details" rows={3} maxLength={1500} placeholder="A sound, a finish, a particular part. Tell us more." /></label><button className="form-submit" type="submit">Prepare my enquiry<ArrowUpRight size={19} /></button><p className="form-disclaimer">We’ll prepare a message for WhatsApp. You review and send it there. Your details are not submitted or stored by this website.</p>{message && <div className="enquiry-ready" ref={confirmation} tabIndex={-1} role="status"><h3>Your enquiry is ready.</h3><p>Open WhatsApp to send this message to the Luxury Performance team.</p><div className="message-preview">{message}</div><ArrowLink href={`${contact.whatsapp}?text=${encodeURIComponent(message)}`} external>Continue on WhatsApp</ArrowLink></div>}</form>;
}
