import { z } from 'zod';

/**
 * Texts to try on an admin sample (the automatic text-length checks, scripts/text-limits): fields and wording lines by
 * key, and the printed card back's title and message. Admin only; anything malformed is ignored.
 */
const schema = z.object({
  values: z.record(z.string().max(40), z.string().max(1000)).optional(),
  wording: z.record(z.string().max(40), z.string().max(1000)).optional(),
  title: z.string().max(1000).optional(),
  message: z.string().max(1000).optional(),
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
