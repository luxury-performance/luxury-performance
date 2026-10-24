import { socialLinks } from '@/lib/content';
import styles from './social-links.module.css';

type SocialIcon = typeof socialLinks[number]['icon'];
function SocialIcon({ type }: { type: SocialIcon }) {
  return <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    {type === 'instagram' ? <><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.4" cy="6.6" r=".9" fill="currentColor" stroke="none"/></> : type === 'youtube' ? <><path d="M21.3 7.1a2.6 2.6 0 0 0-1.8-1.8C17.9 4.8 12 4.8 12 4.8s-5.9 0-7.5.5a2.6 2.6 0 0 0-1.8 1.8A27 27 0 0 0 2.3 12a27 27 0 0 0 .4 4.9 2.6 2.6 0 0 0 1.8 1.8c1.6.5 7.5.5 7.5.5s5.9 0 7.5-.5a2.6 2.6 0 0 0 1.8-1.8 27 27 0 0 0 .4-4.9 27 27 0 0 0-.4-4.9Z"/><path d="m10 8.8 5.4 3.2-5.4 3.2Z" fill="currentColor" stroke="none"/></> : <><path d="M20.8 11.6a8.9 8.9 0 0 1-13.2 8L3 21l1.3-4.5a8.9 8.9 0 1 1 16.5-4.9Z"/><path d="M8.1 7.5c-.5 0-1.2.8-1.2 1.8 0 2.6 4.6 7.1 7.5 7.1 1 0 2-.7 2-1.4v-.5l-2.3-1.2-1.1 1.1c-1.5-.6-3.1-2.1-3.7-3.6l1-1.1-1.2-2.2Z"/></>}
  </svg>;
}

export function SocialLinks() {
  return <div className={styles.links} role="group" aria-label="Social media">
    {socialLinks.map(social => <a key={social.icon} className={styles.link} href={social.href} target="_blank" rel="noopener noreferrer" aria-label={`${social.name} (opens in a new tab)`}>
      <SocialIcon type={social.icon}/><span className={styles.name}>{social.name}</span>
    </a>)}
  </div>;
}
