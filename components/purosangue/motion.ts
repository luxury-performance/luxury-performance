export const filmChapters = [
  { name: 'Original', at: 0.04, kicker: 'Ferrari Purosangue', title: 'Exceptional.\nFrom the start.', description: 'An extraordinary foundation. A new expression waiting to take shape.', detail: 'The original silhouette' },
  { name: 'Widebody', at: 0.27, kicker: '01 / ESTESO', title: 'A presence\nall its own.', description: 'Painted arch extensions and a more assertive silhouette. Every line considered.', detail: 'ESTESO widebody programme' },
  { name: 'Wheels', at: 0.48, kicker: '02 / NF10', title: 'The detail\nthat defines it.', description: 'A fine-spoke forged wheel design. The finishing touch to a different stance.', detail: 'NOVITEC NF10 forged wheels' },
  { name: 'Carbon', at: 0.69, kicker: '03 / The finishing details', title: 'Character.\nEvery contour.', description: 'Carbon accents, roof and rear spoilers, and black tailpipes bring the composition together.', detail: 'Carbon detailing / black tailpipes' },
  { name: 'Complete', at: 0.94, kicker: 'Purosangue by NOVITEC', title: 'Entirely\nyour expression.', description: 'A complete vision, specified around you. Explore the difference, then make it yours.', detail: 'The complete expression' },
] as const;

export const clamp = (v: number, low = 0, high = 1) => Math.max(low, Math.min(high, v));
export function ease(from: number, to: number, p: number) {
  const t = clamp((p - from) / (to - from));
  return t * t * (3 - 2 * t);
}

/** Camera keyframes keep both photographic layers registered throughout the reveal. */
export function filmFrame(p: number, small: boolean) {
  const wheelIn = ease(.34, .43, p);
  const carbonIn = ease(.57, .65, p);
  const pullBack = ease(.77, .89, p);
  const wheel = wheelIn * (1 - carbonIn);
  const carbon = carbonIn * (1 - pullBack);
  const detail = wheel * (1 - pullBack);
  return {
    chapter: p < .18 ? 0 : p < .4 ? 1 : p < .61 ? 2 : p < .83 ? 3 : 4,
    scale: 1 + detail * (small ? 1.35 : .92) + carbon * (small ? 1.1 : .85),
    x: detail * (small ? -15 : 0) + carbon * (small ? -51 : -27),
    y: detail * (small ? -25 : -35) + carbon * (small ? -20 : -25),
    reveal: ease(.17, .35, p),
    light: ease(0, .16, p),
    brightness: .65 + .35 * ease(0, .12, p),
    word: 1 - Math.max(detail, carbon) * .8,
  };
}
