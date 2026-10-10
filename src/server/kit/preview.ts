import 'server-only';
import { DEFAULT_KIT_OPTIONS, kitUnits, type KitOptions, type KitUnitKey } from '@/catalog/kit';
import type { Locale } from '@/i18n/config';
import { messagesFor } from '@/i18n/messages';
import type { InvitationMode } from '@/theme-sdk/types';
import { buildKitProps } from './props';

type KitPreviewMessages = { units: Record<KitUnitKey, string>; notes: Partial<Record<KitUnitKey, string>> };

/** Gallery data for a kit preview: every unit the package includes, with titles in the kit language. */
export function kitGalleryData(input: {
  mode: InvitationMode;
  locale: Locale;
  codeRef: string;
  features: readonly string[];
  fieldKeys: readonly string[];
  values: Partial<Record<string, string>>;
  options?: KitOptions;
}) {
  const themeKey = input.codeRef.split('@')[0]!;
  const msgs = (messagesFor(input.locale) as unknown as { kit: KitPreviewMessages }).kit;
  const units = kitUnits(input.features).map((unit) => ({
    unit,
    props: buildKitProps({
      mode: input.mode,
      locale: input.locale,
      themeKey,
      unit,
      fieldKeys: input.fieldKeys,
      values: input.values,
      options: input.options ?? DEFAULT_KIT_OPTIONS,
    }),
  }));
  return { units, titles: msgs.units, notes: msgs.notes };
}
