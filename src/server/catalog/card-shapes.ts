import 'server-only';
import { isCardShape, type CardShape } from '@/catalog/card-shapes';
import { designCardShapes, type ThemeManifest } from '@/theme-sdk/manifest';

type Manifest = Pick<ThemeManifest, 'print'> | null | undefined;

/** The shapes chosen from those the design offers; the design's main shape when none (or none valid) are. */
function pick(chosen: readonly string[] | null | undefined, manifest: Manifest): CardShape[] {
  const offered = designCardShapes(manifest);
  const valid = offered.filter((s) => (chosen ?? []).includes(s));
  return valid.length ? valid : [offered[0]!];
}

/** Card shapes a package includes (in the design's order). */
export const packageCardShapes = (pkg: { cardShapes: string[] | null }, manifest: Manifest) => pick(pkg.cardShapes, manifest);

/** Card shapes an invitation gets (copied from its package when it was made; older ones: the main shape). */
export const invitationCardShapes = (inv: { cardShapes: string[] | null }, manifest: Manifest) => pick(inv.cardShapes, manifest);

/** The requested shape when the invitation has it, otherwise its first one. */
export function resolveCardShape(requested: unknown, shapes: readonly CardShape[]): CardShape {
  return isCardShape(requested) && shapes.includes(requested) ? requested : shapes[0]!;
}

/** Stored-document variant for a shape: '' for the invitation's first shape (as before shapes existed). */
export const shapeVariant = (shape: CardShape, shapes: readonly CardShape[]) => (shape === shapes[0] ? '' : shape);

/** What a package stores: null when it is just the design's main shape (so older data stays as it was). */
export function storedCardShapes(input: readonly string[] | null | undefined, manifest: Manifest): string[] | null {
  const shapes = pick(input, manifest);
  return shapes.length === 1 && shapes[0] === designCardShapes(manifest)[0] ? null : shapes;
}
