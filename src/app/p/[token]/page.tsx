import { db } from '@/server/db/client';
import { invitationRenderData } from '@/server/invitation/load';
import { invitationMessages } from '@/server/invitation/theme-props';
import { InvitationView } from '@/components/invitation/InvitationView';
import { KitGallery } from '@/components/kit/KitGallery';
import { kitGalleryData } from '@/server/kit/preview';
import { isDesignKit } from '@/theme-registry';
import { previewInvitation } from './data';

/**
 * The customer's personalized preview before payment (decision J): their real
 * content in the real theme, with a PREVIEW label the theme can't remove. The
 * link expires 24h after the last edit, guest responses are never stored, and
 * it stops working once the invitation is published.
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
  const { codeRef, props } = await invitationRenderData(db(), inv, 'preview');
  if (isDesignKit(codeRef)) {
    const kit = kitGalleryData({ mode: 'preview', locale: inv.locale, codeRef, features: inv.featureKeys, fieldKeys: inv.fieldKeys, values: inv.fieldValues });
    return <KitGallery codeRef={codeRef} {...kit} ribbon={msgs.previewRibbon} errorText={{ message: msgs.renderError, retry: msgs.retry }} />;
  }
  return <InvitationView codeRef={codeRef} props={props} ribbon={msgs.previewRibbon} errorText={{ message: msgs.renderError, retry: msgs.retry }} />;
}
