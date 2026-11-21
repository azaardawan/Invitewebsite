/**
 * Which stored files the site's own `/media/` route serves.
 *
 * - Local storage (development): every public file (images, songs, videos), except private JPEGs (`documents/`);
 *   a video's still (`videos/*.jpg`) is public.
 * - The CDN (staging/production): files normally come from the CDN, but the customers' photos (`photos/*.webp`) and
 *   video stills (`videos/*.jpg`) are also served here, from the site itself. The 3D gallery draws them in WebGL, which
 *   needs pictures from the page's own site (the CDN sends no CORS headers). They are public on the CDN anyway.
 * - Virtual tours' models (`tours/*.glb`), read in WebGL too, always come from here.
 */
const TYPES: Record<string, string> = { webp: 'image/webp', mp3: 'audio/mpeg', mp4: 'video/mp4', jpg: 'image/jpeg', glb: 'model/gltf-binary' };

export function mediaServedHere(key: string, driver: 'local' | 's3'): string | null {
  // Guests' photos are private: only the couple's receipt serves them.
  if (key.startsWith('guest-photos/')) return null;
  const ext = key.split('.').pop() ?? '';
  const type = TYPES[ext];
  if (!type) return null;
  // A virtual tour's model (`tours/*.glb`) is read in WebGL: always from the site itself.
  if (ext === 'glb') return key.startsWith('tours/') ? type : null;
  const videoStill = ext === 'jpg' && key.startsWith('videos/');
  if (driver === 'local') return ext === 'jpg' && !videoStill ? null : type;
  return (ext === 'webp' && key.startsWith('photos/')) || videoStill ? type : null;
}

