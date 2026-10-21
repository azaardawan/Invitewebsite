import { db } from '@/server/db/client';
import { invitationRenderData } from '@/server/invitation/load';
import { invitationMessages } from '@/server/invitation/theme-props';
import { InvitationView } from '@/components/invitation/InvitationView';
import { previewInvitation } from './data';
import { manifestByCodeRef } from '@/theme-registry';

/**
 * The customer's personalized preview before payment (decision J): their real
 * content in the real theme, with a PREVIEW label the theme can't remove. The
 * link expires 24h after the last edit, guest responses are never stored, and
 * it stops working once the invitation is published. A design sold only as files
 * (no online invitation) is the product itself, so it is watermarked all over.
 */
export default async function PersonalPreviewPage({ params }: PageProps<'/p/[token]'>) {
  const { token } = await params;
  const inv = await previewInvitation(token);
  const msgs = invitationMessages(inv?.locale ?? 'ar');
  if (!inv) {
    return (
      <main style={{ minHeight: '100dvh', display: 'grid', placeContent: 'center', padding: 24, textAlign: 'center', fontFamily: 'system-ui, sans-serif' }}>
        <p>{msgs.previewExpired}</p>
      </main>
    );
  }
  const { codeRef, props } = await invitationRenderData(db(), inv, 'preview', { drawSignatures: true });
  const filesOnly = manifestByCodeRef(codeRef)?.onlineInvitation === false;
  const { print } = msgs as unknown as { print: { watermark: string; watermarkNote: string } };
  return (
    <InvitationView
      codeRef={codeRef}
      props={props}
      ribbon={msgs.previewRibbon}
      errorText={{ message: msgs.renderError, retry: msgs.retry }}
      watermark={filesOnly ? print : null}
    />
  );
}
