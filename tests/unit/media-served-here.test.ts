import { describe, expect, it } from 'vitest';
import { mediaServedHere } from '@/server/storage/served-here';

describe('the site-served media route', () => {
  it('serves every public file in development, but never private JPEGs', () => {
    expect(mediaServedHere('images/a.webp', 'local')).toBe('image/webp');
    expect(mediaServedHere('music/a.mp3', 'local')).toBe('audio/mpeg');
    expect(mediaServedHere('videos/a.mp4', 'local')).toBe('video/mp4');
    expect(mediaServedHere('videos/a.jpg', 'local')).toBe('image/jpeg');
    expect(mediaServedHere('documents/a.jpg', 'local')).toBeNull();
    expect(mediaServedHere('documents/a.pdf', 'local')).toBeNull();
  });

  it('serves only customer photos and video stills from the site when files are on the CDN (for the 3D gallery)', () => {
    expect(mediaServedHere('photos/a.webp', 's3')).toBe('image/webp');
    expect(mediaServedHere('videos/a.jpg', 's3')).toBe('image/jpeg');
    expect(mediaServedHere('videos/a.mp4', 's3')).toBeNull();
    expect(mediaServedHere('images/a.webp', 's3')).toBeNull();
    expect(mediaServedHere('music/a.mp3', 's3')).toBeNull();
    expect(mediaServedHere('documents/a.jpg', 's3')).toBeNull();
    expect(mediaServedHere('photos/a.jpg', 's3')).toBeNull();
  });
});
