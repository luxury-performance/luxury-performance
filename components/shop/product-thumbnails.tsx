"use client";
/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Photo } from '@/lib/shop/types';

export function ProductThumbnails({ images, selected, onSelect }: { images: Photo[]; selected?: string; onSelect: (url: string) => void }) {
  const strip = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: number; x: number; scroll: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  const [edges, setEdges] = useState({ start: true, end: false });
  const measure = useCallback(() => {
    const el = strip.current;
    if (el) setEdges({ start: el.scrollLeft <= 2, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 2 });
  }, []);
  useEffect(() => {
    const el = strip.current;
    if (!el) return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    for (const child of el.children) observer.observe(child);
    return () => observer.disconnect();
  }, [measure, images.length]);
  useEffect(() => {
    const el = strip.current, button = el?.querySelector<HTMLButtonElement>('[aria-pressed="true"]');
    if (!el || !button) return;
    const bounds = el.getBoundingClientRect(), item = button.getBoundingClientRect();
    if (item.left < bounds.left + 5) el.scrollLeft -= bounds.left + 5 - item.left;
    else if (item.right > bounds.right - 5) el.scrollLeft += item.right - bounds.right + 5;
  }, [selected]);
  function move(direction: number) {
    const el = strip.current;
    if (!el) return;
    const itemWidth = el.firstElementChild?.getBoundingClientRect().width || 180;
    const stride = itemWidth + parseFloat(getComputedStyle(el).columnGap || "0");
    const step = Math.max(1, Math.floor(el.clientWidth / stride)) * stride;
    el.scrollBy({ left: direction * step, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }
  function endDrag() {
    const el = strip.current, state = drag.current;
    if (!el || !state) return;
    suppressClick.current = state.moved;
    if (el.hasPointerCapture(state.id)) el.releasePointerCapture(state.id);
    delete el.dataset.dragging;
    drag.current = null;
  }
  return <div className="shop-thumbnail-carousel">
    <div className="shop-thumbnail-controls"><button type="button" aria-label="Previous product thumbnails" disabled={edges.start} onClick={() => move(-1)}><ChevronLeft size={19}/></button><button type="button" aria-label="Next product thumbnails" disabled={edges.end} onClick={() => move(1)}><ChevronRight size={19}/></button></div>
    <div ref={strip} className="shop-thumbnails" role="group" aria-label="Product thumbnails" onScroll={measure}
      onPointerDown={event => { if (event.pointerType !== 'mouse' || event.button !== 0) return; suppressClick.current = false; drag.current = { id: event.pointerId, x: event.clientX, scroll: event.currentTarget.scrollLeft, moved: false }; }}
      onPointerMove={event => { const state = drag.current; if (!state) return; const delta = event.clientX - state.x; if (!state.moved && Math.abs(delta) < 6) return; state.moved = true; event.currentTarget.dataset.dragging = 'true'; event.currentTarget.setPointerCapture(event.pointerId); event.preventDefault(); event.currentTarget.scrollLeft = state.scroll - delta; }}
      onPointerUp={endDrag} onPointerCancel={endDrag} onLostPointerCapture={endDrag}
      onPointerLeave={() => { if (drag.current && !drag.current.moved) drag.current = null; }}
      onClickCapture={event => { if (suppressClick.current) { event.preventDefault(); event.stopPropagation(); suppressClick.current = false; } }}
      onDragStart={event => event.preventDefault()}>
      {images.map((image, i) => <button type="button" key={image.url} aria-label={`View product image ${i + 1}`} aria-pressed={selected === image.url} onClick={() => onSelect(image.url)}><img src={`${image.url}${image.url.includes('?') ? '&' : '?'}width=360`} alt="" draggable={false}/></button>)}
    </div>
  </div>;
}
