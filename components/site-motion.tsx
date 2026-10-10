'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/** Small, event-driven enhancements. The document remains readable without JS. */
export function SiteMotion() {
  const pathname = usePathname();
  useEffect(() => {
    const root = document.documentElement;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
    const hero = document.querySelector<HTMLElement>('.hero');
    const images = Array.from(document.querySelectorAll<HTMLElement>('.programme-image, .hero-visual'));
    let frame = 0;
    const update = () => {
      frame = 0;
      const height = document.documentElement.scrollHeight - innerHeight;
      root.style.setProperty('--reading-progress', `${height > 0 ? scrollY / height : 0}`);
      if (hero && !motion.matches) {
        const rect = hero.getBoundingClientRect();
        hero.style.setProperty('--hero-drift', `${Math.min(28, Math.max(0, -rect.top * .05))}px`);
      }
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    const pointers = images.map(el => {
      const move = (event: PointerEvent) => {
        if (motion.matches || !finePointer.matches) return;
        const rect = el.getBoundingClientRect();
        el.style.setProperty('--pointer-x', `${((event.clientX - rect.left) / rect.width - .5) * 10}px`);
        el.style.setProperty('--pointer-y', `${((event.clientY - rect.top) / rect.height - .5) * 8}px`);
      };
      const reset = () => { el.style.setProperty('--pointer-x', '0px'); el.style.setProperty('--pointer-y', '0px'); };
      el.addEventListener('pointermove', move);
      el.addEventListener('pointerleave', reset);
      return () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', reset); reset(); };
    });
    const entrance = () => {
      if (!root.dataset.lxpIntro || root.dataset.lxpIntro === 'wings') hero?.classList.add('hero-arrived');
    };
    const introObserver = new MutationObserver(entrance);
    introObserver.observe(root, { attributes: true, attributeFilter: ['data-lxp-intro'] });
    entrance(); update();
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll);
    const resetMotion = () => { if (motion.matches) hero?.style.setProperty('--hero-drift', '0px'); };
    motion.addEventListener('change', resetMotion);
    return () => {
      cancelAnimationFrame(frame); introObserver.disconnect(); pointers.forEach(clean => clean());
      removeEventListener('scroll', onScroll); removeEventListener('resize', onScroll);
      motion.removeEventListener('change', resetMotion);
    };
  }, [pathname]);
  return <div className="reading-progress" aria-hidden="true" />;
}
