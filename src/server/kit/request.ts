import 'server-only';
import { DEFAULT_KIT_OPTIONS, KIT_PRODUCTS, isBottleSize, isDateStyle, isDigitStyle, isKitUnit, kitFeatureForUnit, type KitFormat, type KitOptions, type KitUnitKey } from '@/catalog/kit';

/** A download request from the receipt page or Admin: `?unit=…&format=…&date=…&digits=…&bottle=…`. */
export function parseKitRequest(params: URLSearchParams): { unit: KitUnitKey; format: KitFormat; options: KitOptions } | null {
  const unit = params.get('unit');
  const format = params.get('format');
  if (!isKitUnit(unit) || (format !== 'png' && format !== 'pdf')) return null;
  if (!KIT_PRODUCTS[kitFeatureForUnit(unit)].formats.includes(format)) return null;
  const date = params.get('date');
  const digits = params.get('digits');
  const bottle = params.get('bottle');
  return {
    unit,
    format,
    options: {
      dateStyle: isDateStyle(date) ? date : DEFAULT_KIT_OPTIONS.dateStyle,
      digits: isDigitStyle(digits) ? digits : DEFAULT_KIT_OPTIONS.digits,
      bottle: isBottleSize(bottle) ? bottle : DEFAULT_KIT_OPTIONS.bottle,
    },
  };
}

/** The file as a download (private: never cached by shared caches). */
export function kitFileResponse(file: { body: Buffer; contentType: string; fileName: string }) {
  return new Response(new Uint8Array(file.body), {
    headers: {
      'Content-Type': file.contentType,
      'Content-Length': String(file.body.byteLength),
      'Content-Disposition': `attachment; filename="${file.fileName}"`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
      'X-Robots-Tag': 'noindex',
    },
  });
}
