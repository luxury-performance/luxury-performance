'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { contact } from '@/lib/content';
import styles from './whatsapp-widget.module.css';

export function WhatsAppWidget() {
  const link = useRef<HTMLAnchorElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const widget = link.current;
    if (!widget) return;
    let frame = 0;
    widget.style.setProperty('--widget-lift', '0px');
    const update = () => {
      frame = 0;
      const style = getComputedStyle(widget);
      const base = parseFloat(style.getPropertyValue('--widget-bottom'));
      const currentLift = parseFloat(style.getPropertyValue('--widget-lift')) || 0;
      const safeBottom = Math.max(0, parseFloat(style.bottom) - base - currentLift);
      const bottom = innerHeight - base - safeBottom;
      const top = bottom - parseFloat(style.height);
      const right = document.documentElement.clientWidth - parseFloat(style.right);
      const left = right - parseFloat(style.width);
      let lift = 0;
      const obstacles = document.querySelectorAll<HTMLElement>('[data-home-hero] button[aria-label$="automatic slides"], [data-film-controls], .footer-bottom > a');
      for (const obstacle of obstacles) {
        const rect = obstacle.getBoundingClientRect();
        if (rect.width && rect.height && left < rect.right + 12 && right > rect.left - 12 && top < rect.bottom + 12 && bottom > rect.top - 12) {
          lift = Math.max(lift, bottom - rect.top + 12);
        }
      }
      widget.style.setProperty('--widget-lift', `${Math.ceil(lift)}px`);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', update);
    const observer = new ResizeObserver(schedule);
    observer.observe(document.documentElement);
    observer.observe(widget);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', update);
    };
  }, [pathname]);

  return <a ref={link} className={styles.widget} href={contact.whatsapp} target="_blank" rel="noopener noreferrer"
    aria-label="Chat with Luxury Performance on WhatsApp (opens in a new tab)">
    <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M0 24L1.69 17.84C0.65 16.03 0.1 13.99 0.1 11.89C0.1 5.33 5.44 0 12 0C15.18 0 18.17 1.24 20.42 3.49C22.67 5.74 23.9 8.73 23.9 11.9C23.9 18.46 18.56 23.79 12 23.79C10.01 23.79 8.05 23.29 6.32 22.34L0.01 23.99L0 24ZM6.6 20.19L6.96 20.4C8.48 21.3 10.22 21.78 11.99 21.78C17.44 21.78 21.88 17.35 21.88 11.9C21.88 9.26 20.85 6.78 18.99 4.91C17.13 3.04 14.64 2.01 12 2.01C6.55 2.01 2.11 6.44 2.11 11.89C2.11 13.76 2.63 15.58 3.62 17.15L3.86 17.52L2.86 21.17L6.6 20.19ZM9.02 6.92C8.78 6.34 8.53 6.42 8.35 6.41C8.18 6.41 7.98 6.4 7.78 6.4C7.58 6.4 7.26 6.47 6.99 6.77C6.72 7.07 5.95 7.79 5.95 9.25C5.95 10.71 7.02 12.13 7.16 12.32C7.31 12.52 9.26 15.52 12.24 16.81C12.95 17.12 13.5 17.3 13.93 17.44C14.64 17.67 15.29 17.63 15.8 17.56C16.37 17.47 17.56 16.84 17.81 16.15C18.06 15.46 18.06 14.86 17.98 14.74C17.91 14.62 17.71 14.54 17.41 14.39C17.11 14.24 15.65 13.52 15.38 13.42C15.11 13.32 14.91 13.27 14.71 13.57C14.51 13.87 13.94 14.54 13.77 14.74C13.6 14.94 13.42 14.96 13.13 14.81C12.83 14.66 11.87 14.35 10.74 13.34C9.86 12.55 9.26 11.58 9.09 11.28C8.92 10.98 9.07 10.82 9.22 10.67C9.35 10.54 9.52 10.32 9.67 10.15C9.82 9.98 9.87 9.85 9.97 9.65C10.07 9.45 10.02 9.28 9.95 9.13C9.88 8.98 9.28 7.52 9.03 6.92H9.02Z" />
    </svg>
    <span className={styles.label} aria-hidden="true">Chat on WhatsApp</span>
  </a>;
}
