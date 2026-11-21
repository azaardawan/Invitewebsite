/**
 * Guest photo sharing (owner, 2026-11-21): an add-on bought at the end of the order form, never part of a package. Guests
 * scan a QR code, type their name and upload photos (original quality) straight to the couple, who download them all,
 * a ZIP per guest inside one ZIP, from their receipt page.
 *
 * Price: the owner's basic price covers `BASE_CAP` photos in total; every `STEP` photos more cost the owner's rate
 * (Admin → Settings). Photos per guest (`PER_GUEST_OPTIONS`) change nothing in the price.
 */
export const BASE_CAP = 750;
export const STEP = 50;
export const PER_GUEST_OPTIONS = [5, 10, 15] as const;
export const DEFAULT_PER_GUEST = 5;
/** The largest one photo may be (phones' originals are 3-8 MB). */
export const MAX_PHOTO_BYTES = 25 * 1024 * 1024;

export type GuestPhotoPricing = { enabled: boolean; basePriceIqd: number; stepPriceIqd: number; maxCap: number };
export type GuestPhotoChoice = { cap: number; perGuest: number };

/** Whether `cap` can be bought: at least the basic total, in steps of `STEP`, at most the owner's highest. */
export function validCap(cap: number, pricing: Pick<GuestPhotoPricing, 'maxCap'>): boolean {
  return Number.isInteger(cap) && cap >= BASE_CAP && cap <= Math.max(BASE_CAP, pricing.maxCap) && (cap - BASE_CAP) % STEP === 0;
}

export function validPerGuest(n: number): boolean {
  return (PER_GUEST_OPTIONS as readonly number[]).includes(n);
}

/** The add-on's price for a total of `cap` photos. */
export function guestPhotoPrice(cap: number, pricing: Pick<GuestPhotoPricing, 'basePriceIqd' | 'stepPriceIqd'>): number {
  return pricing.basePriceIqd + (Math.max(0, cap - BASE_CAP) / STEP) * pricing.stepPriceIqd;
}

/** Occasions without an event date (or a short one-day window): uploads stay open while the invitation is online. */
export const OPEN_WHILE_LIVE_SECTIONS = ['couples', 'friends', 'birthday'] as const;
/** Other occasions: from this many days before the event date to this many after. */
export const WINDOW_DAYS = 2;
