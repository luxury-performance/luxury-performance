export const EXHAUST_REVEAL_DURATION = 2600;

const ease = (value: number) => 1-Math.pow(1-Math.max(0,Math.min(1,value)),4);

/** One entrance, then every part rests at its approved modelling coordinates. */
export function exhaustRevealProgress(elapsed: number) {
  return {
    banks: ease(elapsed/1450),
    clamps: ease((elapsed-420)/1250),
    plates: ease((elapsed-950)/1250),
    camera: ease(elapsed/EXHAUST_REVEAL_DURATION),
    complete: elapsed>=EXHAUST_REVEAL_DURATION,
  };
}
