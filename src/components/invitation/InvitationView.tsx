import type { ThemeProps, GuestResponseInput, GuestSubmitResult } from '@/theme-sdk/types';
import { ThemeHost } from '@/theme-registry/loaders.generated';
import { InvitationRuntime } from '@/theme-sdk/runtime';
import { ThemeErrorBoundary } from './ThemeErrorBoundary';
import styles from './platform.module.css';

/**
 * Renders one theme with the platform around it: runtime (music, guest form),
 * error boundary and — outside `live` mode — a PREVIEW/SAMPLE ribbon the theme
 * cannot remove or restyle.
 */
export function InvitationView({
  codeRef,
  props,
  ribbon,
  errorText,
  submitGuestResponse,
}: {
  codeRef: string;
  props: ThemeProps;
  ribbon: string | null;
  errorText: { message: string; retry: string };
  submitGuestResponse?: (input: GuestResponseInput) => Promise<GuestSubmitResult>;
}) {
  const guest = {
    enabled: props.features.includes('rsvp'),
    withMessage: props.features.includes('congratulations'),
    submit: submitGuestResponse,
  };
  return (
    <InvitationRuntime mode={props.mode} labels={props.labels} musicSrc={props.music?.src ?? null} guest={guest}>
      <div data-bahja-theme={codeRef} lang={props.lang} dir={props.dir}>
        <ThemeErrorBoundary codeRef={codeRef} message={errorText.message} retry={errorText.retry}>
          <ThemeHost codeRef={codeRef} {...props} />
        </ThemeErrorBoundary>
      </div>
      {ribbon ? (
        <div className={styles.ribbon} role="note">
          {ribbon}
        </div>
      ) : null}
    </InvitationRuntime>
  );
}
