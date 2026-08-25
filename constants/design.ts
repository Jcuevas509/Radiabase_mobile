/** Shared design-system tokens and helpers. Screens import these instead
 * of redeclaring them, so the card recipe and brand gradients stay in one
 * place. */

/** The house card recipe: contact + ambient shadow with a top-edge
 * highlight, over a hairline border. */
export const CARD_SHADOW =
  '0 1px 2px rgba(24, 24, 27, 0.05), 0 10px 26px rgba(24, 24, 27, 0.07), inset 0 1px 0 rgba(255, 255, 255, 0.95)';

/** Brand teal, deep -> bright, as used by the Home header and hero cards. */
export const TEAL_GRADIENT = ['#067A90', '#0AA6BE', '#00CFE8'] as const;

/** Monochrome pill for animated selected states (period/metric selectors). */
export const PILL_GRADIENT = ['#09090B', '#26262B', '#4A4A52'] as const;

/** Sample portrait URL. Seam: replace with the real photo URL field. */
export function portraitUrl(portrait: string): string {
  return `https://randomuser.me/api/portraits/${portrait}.jpg`;
}

export function splitName(name: string): { first: string; last: string } {
  const [first, ...rest] = name.split(' ');
  return { first, last: rest.join(' ') };
}

/** Shift a hex color toward black (negative) or white (positive). */
export function shadeColor(hex: string, amount: number): string {
  const value = parseInt(hex.slice(1), 16);
  const mix = (channel: number) =>
    Math.round(amount < 0 ? channel * (1 + amount) : channel + (255 - channel) * amount);
  const r = mix((value >> 16) & 255);
  const g = mix((value >> 8) & 255);
  const b = mix(value & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

/** Accent-colored version of the hero gradient: deep -> base -> bright. */
export function accentGradient(accent: string): [string, string, string] {
  return [shadeColor(accent, -0.45), shadeColor(accent, -0.1), shadeColor(accent, 0.18)];
}
