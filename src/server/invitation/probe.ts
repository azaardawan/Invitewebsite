import { z } from 'zod';

/**
 * Texts to try on a sample: the automatic text-length checks on admin samples (scripts/text-limits), and the customer's
 * live preview while they type (`live=` on the public /t samples, LivePreview): fields and wording lines by key, the
 * printed card back's title and message, the event. Anything malformed is ignored.
 */
const schema = z.object({
  values: z.record(z.string().max(40), z.string().max(1000)).optional(),
  wording: z.record(z.string().max(40), z.string().max(1000)).optional(),
  title: z.string().max(1000).optional(),
  message: z.string().max(1000).optional(),
  /** The event a wedding or engagement is held as, and the customer's own words (occasion-wording.ts). */
  eventKind: z.string().max(20).optional(),
  eventName: z.string().max(200).optional(),
  /** The live preview: the colour set the customer picked (one of the design's). */
  palette: z.uuid().optional(),
});
export type TextProbe = z.infer<typeof schema>;

export function parseTextProbe(raw: string | undefined): TextProbe {
  if (!raw) return {};
  try {
    const r = schema.safeParse(JSON.parse(raw));
    return r.success ? r.data : {};
  } catch {
    return {};
  }
}
