/**
 * VERILANCE Minimal Dark-Aesthetic Eye Avatars
 * Handcrafted vector representations matching the dark/black aesthetic with white stylized eyes:
 * 1. Crescent Gaze (smiling/sleeping crescent arcs on black)
 * 2. Curious Dual (semicircle + solid circle on black)
 * 3. Wide Watcher (round white eyes with expressive offset pupils on black)
 */

export interface DefaultAvatarOption {
  id: string;
  name: string;
  subtitle: string;
  url: string;
  svgDataUri: string;
}

const SVG_CRESCENT = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%"><rect width="512" height="512" fill="#000000"/><path d="M 98 285 C 122 245 182 240 238 288 C 188 262 136 262 98 285 Z" fill="#ffffff" /><path d="M 274 288 C 330 240 390 245 414 285 C 376 262 324 262 274 288 Z" fill="#ffffff" /></svg>`;

const SVG_DUAL = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%"><rect width="512" height="512" fill="#000000"/><path d="M 88 240 L 224 240 A 68 68 0 0 1 88 240 Z" fill="#ffffff" /><circle cx="356" cy="236" r="68" fill="#ffffff" /></svg>`;

const SVG_WATCHER = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%"><rect width="512" height="512" fill="#000000"/><circle cx="172" cy="232" r="62" fill="#ffffff" /><circle cx="156" cy="242" r="16" fill="#000000" /><circle cx="340" cy="232" r="62" fill="#ffffff" /><circle cx="348" cy="220" r="16" fill="#000000" /></svg>`;

export const DEFAULT_AVATARS: DefaultAvatarOption[] = [
  {
    id: 'avatar-crescent',
    name: 'Crescent Gaze',
    subtitle: 'Minimal curved eye slits',
    url: '/avatars/avatar-crescent.svg',
    svgDataUri: `data:image/svg+xml;utf8,${encodeURIComponent(SVG_CRESCENT)}`,
  },
  {
    id: 'avatar-dual',
    name: 'Curious Dual',
    subtitle: 'Semicircle & full orb',
    url: '/avatars/avatar-dual.svg',
    svgDataUri: `data:image/svg+xml;utf8,${encodeURIComponent(SVG_DUAL)}`,
  },
  {
    id: 'avatar-watcher',
    name: 'Wide Watcher',
    subtitle: 'Expressive offset pupils',
    url: '/avatars/avatar-watcher.svg',
    svgDataUri: `data:image/svg+xml;utf8,${encodeURIComponent(SVG_WATCHER)}`,
  },
];

/**
 * Returns a random default dark-aesthetic avatar option
 */
export function getRandomDefaultAvatar(): DefaultAvatarOption {
  const randomIndex = Math.floor(Math.random() * DEFAULT_AVATARS.length);
  return DEFAULT_AVATARS[randomIndex];
}

/**
 * Resolves avatar URL or returns fallback data URI
 */
export function getAvatarUrl(selectedIdOrUrl?: string): string {
  if (!selectedIdOrUrl) {
    return DEFAULT_AVATARS[0].svgDataUri;
  }
  const match = DEFAULT_AVATARS.find(
    (a) => a.id === selectedIdOrUrl || a.url === selectedIdOrUrl || a.svgDataUri === selectedIdOrUrl
  );
  if (match) {
    return match.svgDataUri;
  }
  return selectedIdOrUrl;
}
