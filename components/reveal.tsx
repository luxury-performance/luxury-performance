'use client';
import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
export function Reveal({ children, className = '' }: { children: ReactNode; className?: string }) {
  const element = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = element.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // Only animate content below the viewport, so first paint remains visible.
    if (el.getBoundingClientRect().top < window.innerHeight) return;
    el.classList.add('reveal-pending');
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { el.classList.remove('reveal-pending'); observer.disconnect(); }
    }, { threshold: 0.08 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return <div ref={element} className={`reveal ${className}`}>{children}</div>;
}
