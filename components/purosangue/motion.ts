export type Detail = {
  /** Points are measured on the 1672 × 941 NOVITEC master, not the viewport. */
  pin: readonly [number, number];
  centre: readonly [number, number];
  bounds: readonly [number, number];
};
type Chapter = { name: string; at: number; kicker: string; title: string; description: string; detail: string; focus?: Detail };

export const filmChapters: readonly Chapter[] = [
  { name: 'Original', at: .04, kicker: 'Ferrari Purosangue', title: 'Exceptional.\nFrom the start.', description: 'An extraordinary foundation. A new expression waiting to take shape.', detail: 'The original silhouette' },
  { name: 'Widebody', at: .29, kicker: '01 / ESTESO', title: 'A presence\nall its own.', description: 'Follow the painted rear arch extension: a wider shoulder, shaped around the original body.', detail: 'ESTESO rear arch extension', focus: { pin: [963, 446], centre: [991, 490], bounds: [620, 490] } },
  { name: 'Wheels', at: .40, kicker: '02 / NF10', title: 'The detail\nthat defines it.', description: 'The forged wheel takes centre stage. Fine spokes, a deep profile and a distinct stance.', detail: 'NOVITEC NF10 forged wheel', focus: { pin: [1085, 710], centre: [988, 635], bounds: [510, 430] } },
  { name: 'Tailpipes', at: .54, kicker: '03 / Exhaust finish', title: 'A sharper\nfinal note.', description: 'Black tailpipe finishers sit within the carbon rear surround. Look closely at the outlet detail.', detail: 'Black tailpipe finishers', focus: { pin: [1354, 642], centre: [1334, 625], bounds: [450, 330] } },
  { name: 'Roof spoiler', at: .68, kicker: '04 / Upper carbon', title: 'Above\nexpectation.', description: 'The carbon roof spoiler extends the roofline above the rear glass.', detail: 'Carbon roof spoiler', focus: { pin: [1260, 226], centre: [1260, 263], bounds: [500, 310] } },
  { name: 'Rear spoiler', at: .82, kicker: '05 / Rear carbon', title: 'Every line.\nConsidered.', description: 'A separate carbon lip follows the tailgate edge, directly above the rear lights.', detail: 'Carbon rear lip spoiler', focus: { pin: [1425, 348], centre: [1398, 384], bounds: [500, 320] } },
  { name: 'Complete', at: .97, kicker: 'Purosangue by NOVITEC', title: 'Entirely\nyour expression.', description: 'The complete transformation. Compare the original car with the NOVITEC build, then make it yours.', detail: 'The complete expression' },
];
// Finish the full-car reveal, hold it, then move into the first detail.
export const filmTiming = { reveal: [.105, .18], widebodyZoom: [.22, .29] } as const;
export const completeAt = filmChapters[filmChapters.length - 1].at;
export const clamp = (v: number, low = 0, high = 1) => Math.max(low, Math.min(high, v));
export function ease(from: number, to: number, p: number) {
  const t = clamp((p - from) / (to - from));
  return t * t * (3 - 2 * t);
}
export type FilmGeometry = { width: number; height: number; rigWidth: number; rigHeight: number; rigX: number; rigY: number; small: boolean };

function cameraFor(index: number, g: FilmGeometry) {
  const focus = filmChapters[index].focus;
  if (!focus) return { scale: 1, x: 0, y: 0 };
  // Fit the actual part into the clear area beside (or below) the copy.
  const availableWidth = g.width * (g.small ? .94 : .55);
  const availableHeight = g.height * (g.small ? .46 : .79);
  const scale = Math.min(availableWidth / (g.rigWidth * focus.bounds[0] / 1672), availableHeight / (g.rigHeight * focus.bounds[1] / 941));
  const targetX = g.width * (g.small ? .52 : .69);
  const targetY = g.height * (g.small ? .68 : .54);
  return { scale, x: targetX - g.rigX - (focus.centre[0] / 1672 - .5) * g.rigWidth * scale, y: targetY - g.rigY - (focus.centre[1] / 941 - .5) * g.rigHeight * scale };
}

/** Both image layers and the part's annotation share exactly the same camera transform. */
export function filmFrame(p: number, g: FilmGeometry, overview = false) {
  let chapter = 0;
  for (let i = 1; i < filmChapters.length; i++) {
    const begins = i === 1 ? filmTiming.widebodyZoom[0] : (filmChapters[i - 1].at + filmChapters[i].at) / 2;
    if (p >= begins) chapter = i;
  }
  let camera = cameraFor(0, g);
  for (let i = 1; i < filmChapters.length; i++) {
    const to = cameraFor(i, g);
    const midpoint = (filmChapters[i - 1].at + filmChapters[i].at) / 2;
    const t = i === 1 ? ease(...filmTiming.widebodyZoom, p) : ease(midpoint - .035, midpoint + .035, p);
    camera = { scale: camera.scale + (to.scale - camera.scale) * t, x: camera.x + (to.x - camera.x) * t, y: camera.y + (to.y - camera.y) * t };
  }
  if (overview) camera = { scale: 1, x: 0, y: 0 };
  const focus = filmChapters[chapter].focus;
  const pin = focus ? {
    x: g.rigX + camera.x + (focus.pin[0] / 1672 - .5) * g.rigWidth * camera.scale,
    y: g.rigY + camera.y + (focus.pin[1] / 941 - .5) * g.rigHeight * camera.scale,
  } : null;
  return { ...camera, chapter, pin, reveal: ease(...filmTiming.reveal, p), light: ease(0, .10, p), brightness: .65 + .35 * ease(0, .10, p), word: focus ? .2 : 1 };
}
