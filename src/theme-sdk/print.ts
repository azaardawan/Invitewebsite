/**
 * Print companion contract (docs/ARCHITECTURE_PROPOSAL.md §2 Decision M, §6).
 *
 * A theme's print designs are separate static React components rendered to
 * PDF by Chromium: `print/Card.tsx` (the printable invitation) and
 * `print/Keepsake.tsx` (the guest-message keepsake). They receive plain data
 * and must not animate or fetch anything.
 */
import type { FieldKey } from '@/catalog/fields';
import type { ThemeLocale } from './format';

export type PrintCardProps = {
  locale: ThemeLocale;
  dir: 'rtl' | 'ltr';
  fields: Readonly<Partial<Record<FieldKey, string>>>;
  /** QR code image (data URL) linking to the online invitation; null when disabled. */
  qrDataUrl: string | null;
};

export type KeepsakeMessage = { guestName: string; message: string };

export type KeepsakeProps = {
  locale: ThemeLocale;
  dir: 'rtl' | 'ltr';
  fields: Readonly<Partial<Record<FieldKey, string>>>;
  /** In the order received. Can be empty or run to several hundred. */
  messages: readonly KeepsakeMessage[];
};
