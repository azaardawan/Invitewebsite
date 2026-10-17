import type React from 'react';
import type { ThemeProps, GuestResponseInput, GuestSubmitResult } from '@/theme-sdk/types';
import { ThemeHost } from '@/theme-registry/loaders.generated';
import { InvitationRuntime } from '@/theme-sdk/runtime';
import { ThemeErrorBoundary } from './ThemeErrorBoundary';
import { LiveThemeHost } from './LiveThemeHost';
import styles from './platform.module.css';
import { WatermarkLayer, type WatermarkText } from '@/components/print/watermark';

/**
 * Renders one theme with the platform around it: runtime (music, guest form),
 * error boundary and — outside `live` mode — a PREVIEW/SAMPLE ribbon the theme
 * cannot remove or restyle. `watermark`: the full preview watermark over the whole page (designs sold
 * only as files, whose preview is the product itself).
 */
export function InvitationView({
  codeRef,
  props,
  ribbon,
  errorText,
  submitGuestResponse,
  turnstileSiteKey,
  watermark,
}: {
  codeRef: string;
  props: ThemeProps;
  ribbon: string | null;
  errorText: { message: string; retry: string };
  submitGuestResponse?: (input: GuestResponseInput, captchaToken?: string) => Promise<GuestSubmitResult>;
  turnstileSiteKey?: string | null;
  watermark?: WatermarkText | null;
}) {
  const guest = {
    enabled: props.features.includes('rsvp'),
    withMessage: props.features.includes('congratulations'),
    submit: submitGuestResponse,
    turnstileSiteKey: turnstileSiteKey ?? null,
    attendance: props.attendance,
    locale: props.locale,
  };
  return (
    <InvitationRuntime mode={props.mode} labels={props.labels} musicSrc={props.music?.src ?? null} guest={guest}>
      <div
        data-bahja-theme={codeRef}
        lang={props.lang}
        dir={props.dir}
        // The theme's colour slots as CSS variables (customer's colour set, or the theme's defaults).
        style={Object.fromEntries(Object.entries(props.colors).map(([k, v]) => [`--bahja-color-${k}`, v])) as React.CSSProperties}
      >
        <ThemeErrorBoundary codeRef={codeRef} message={errorText.message} retry={errorText.retry}>
          {/* Designs with the customer's photos follow the photo editor live; others render as they are. */}
          {props.features.includes('photos') ? <LiveThemeHost codeRef={codeRef} props={props} /> : <ThemeHost codeRef={codeRef} {...props} />}
        </ThemeErrorBoundary>
      </div>
      {ribbon ? (
        <div className={styles.ribbon} role="note">
          {ribbon}
        </div>
      ) : null}
      {watermark ? <WatermarkLayer text={watermark} fixed /> : null}
    </InvitationRuntime>
  );
}
