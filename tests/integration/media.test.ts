import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { db } from '@/server/db/client';
import { storeAudio, storeImage } from '@/server/media/assets';
import { processAudio, processImage } from '@/server/media/process';
import { isValidStorageKey, storage } from '@/server/storage';
import { makeMp3 } from '../helpers';

async function jpegWithGps(width = 800, height = 600) {
  return sharp({ create: { width, height, channels: 3, background: { r: 200, g: 150, b: 90 } } })
    .jpeg()
    .withExif({ IFD0: { Copyright: 'secret-owner' }, IFD3: { GPSLatitudeRef: 'N', GPSLatitude: '36/1 11/1 0/1' } })
    .toBuffer();
}

describe('image processing', () => {
  it('re-encodes to WebP and strips metadata such as GPS', async () => {
    const input = await jpegWithGps();
    expect((await sharp(input).metadata()).exif).toBeDefined();
    const out = await processImage(input);
    const meta = await sharp(out.data).metadata();
    expect(meta.format).toBe('webp');
    expect(meta.exif).toBeUndefined();
    expect(out.width).toBe(800);
  });

  it('downsizes very large images', async () => {
    const big = await sharp({ create: { width: 4000, height: 1000, channels: 3, background: '#fff' } }).png().toBuffer();
    expect((await processImage(big)).width).toBe(2400);
  });

  it('rejects SVG, non-images, and tiny images', async () => {
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500"><script>alert(1)</script></svg>');
    await expect(processImage(svg)).rejects.toMatchObject({ code: 'unsupportedImage' });
    await expect(processImage(Buffer.from('hello'))).rejects.toMatchObject({ code: 'unsupportedImage' });
    const tiny = await sharp({ create: { width: 50, height: 50, channels: 3, background: '#000' } }).png().toBuffer();
    await expect(processImage(tiny)).rejects.toMatchObject({ code: 'imageTooSmall' });
  });
});

describe('audio processing', () => {
  it('accepts a real MP3 and reads its duration', async () => {
    const out = await processAudio(makeMp3(3));
    expect(out.mime).toBe('audio/mpeg');
    expect(out.durationSeconds).toBeGreaterThanOrEqual(2);
    expect(out.durationSeconds).toBeLessThanOrEqual(4);
  });

  it('rejects files that only pretend to be MP3', async () => {
    await expect(processAudio(Buffer.concat([Buffer.from('ID3'), Buffer.alloc(2000)]))).rejects.toMatchObject({ code: 'unsupportedAudio' });
    await expect(processAudio(Buffer.from('RIFF....WAVEfmt '))).rejects.toMatchObject({ code: 'unsupportedAudio' });
  });
});

describe('asset storage', () => {
  it('stores files under generated keys and never duplicates identical audio', async () => {
    const mp3 = makeMp3(7.3); // unique length so no other test stored the same bytes
    const a = await storeAudio(db(), mp3, { filename: '../../etc/passwd.mp3', uploadedBy: null });
    const b = await storeAudio(db(), mp3, { filename: 'again.mp3', uploadedBy: null });
    expect(b.id).toBe(a.id);
    expect(isValidStorageKey(a.storageKey)).toBe(true);
    expect(a.originalFilename).not.toContain('/');
    expect((await storage().get(a.storageKey))?.byteLength).toBe(mp3.byteLength);

    const img = await storeImage(db(), await jpegWithGps(640, 480), { uploadedBy: null });
    expect(img.storageKey).toMatch(/^images\/.+\.webp$/);
  });

  it('refuses keys that could escape the storage folder', async () => {
    expect(isValidStorageKey('../secret.webp')).toBe(false);
    expect(isValidStorageKey('images/../../x.webp')).toBe(false);
    await expect(storage().get('../../.env')).rejects.toThrow(/Invalid storage key/);
  });
});
