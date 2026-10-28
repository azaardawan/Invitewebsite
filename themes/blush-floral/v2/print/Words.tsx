import { Signature, type PrintCardBackProps } from '@/theme-sdk';
import p from './print.module.css';

/**
 * The back's words, one centred column as on the other designs' backs: the customer's title in the design's script
 * (Aref Ruqaa in Arabic and Kurdish), their message, their signature (or their name), and the QR code under them.
 */
export function Words({
  fields,
  labels,
  title,
  message,
  signatures,
  qrDataUrl,
}: Pick<PrintCardBackProps, 'fields' | 'labels' | 'title' | 'message' | 'signatures' | 'qrDataUrl'>) {
  const name = fields.person_1_name?.trim();
  return (
    <>
      <h1 className={p.title} data-long={title.length > 22 ? '' : undefined}>
        {title}
      </h1>
      {message ? (
        <p className={p.message} data-long={message.length > 160 ? '' : undefined}>
          {message}
        </p>
      ) : null}
      {signatures.length ? <Signature signatures={signatures} className={p.signature} /> : name ? <p className={p.name}>{name}</p> : null}
      {qrDataUrl ? (
        <figure className={p.qr}>
          {/* eslint-disable-next-line @next/next/no-img-element -- print document, data URL */}
          <img src={qrDataUrl} alt="" />
          <figcaption>{labels.scanToOpen}</figcaption>
        </figure>
      ) : null}
    </>
  );
}
