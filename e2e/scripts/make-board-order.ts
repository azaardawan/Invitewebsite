/**
 * E2E fixture: the signature board (owner, 2026-11-27). Puts demo-wedding on sale with a package that has guest
 * messages, uploads board artwork for it, offers the board in Settings (people per board from `PER_BOARD`, default 6),
 * and makes a paid order that bought it, with `MESSAGES` guest messages (default 9), most of them signed. Prints
 * { themeId, packagePriceIqd, receiptToken, path, invitationId, amountIqd, previewToken } (`previewToken`: an unpaid draft of the same design).
 */
import { eq } from 'drizzle-orm';
import sharp from 'sharp';
import { closeDb, db } from '../../src/server/db/client';
import { guestResponses, musicTracks, themes } from '../../src/server/db/schema';
import { createPackage } from '../../src/server/catalog/packages';
import { createMusicTrack } from '../../src/server/catalog/music';
import { packagesWithShape, transitionTheme, updateThemeSettings } from '../../src/server/catalog/themes';
import { updateThemeBoard } from '../../src/server/catalog/card-design';
import { storeAudio, storeImage } from '../../src/server/media/assets';
import { createDraft } from '../../src/server/orders/drafts';
import { createOrder } from '../../src/server/orders/checkout';
import { markOrderPaid } from '../../src/server/orders/payment';
import { getReceipt } from '../../src/server/orders/receipt';
import { updateSignatureBoardSettings } from '../../src/server/settings/service';
import { SAMPLE_MESSAGES, sampleSignature } from '../../src/components/board/samples';
import { randomToken } from '../../src/lib/crypto';

const FIELDS = ['person_1_name', 'person_2_name', 'event_date', 'event_time', 'venue_name'] as const;
const PER_BOARD = Number(process.env.PER_BOARD ?? 6);
const MESSAGES = Number(process.env.MESSAGES ?? 9);

function mp3(seconds: number) {
  const frame = Buffer.concat([Buffer.from([0xff, 0xfb, 0x90, 0x64]), Buffer.alloc(413)]);
  return Buffer.concat(Array.from({ length: Math.ceil((seconds * 44100) / 1152) }, () => frame));
}

/** A stand-in board: ivory paper with a gold frame (600 × 900 px). */
async function artwork() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900"><rect width="600" height="900" fill="#fbf6ef"/><rect x="18" y="18" width="564" height="864" fill="none" stroke="#b08a4f" stroke-width="6"/><rect x="30" y="30" width="540" height="840" fill="none" stroke="#b08a4f" stroke-width="1.5"/></svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

try {
  const actor = { adminId: null, ipHash: null };
  const [t] = await db().select().from(themes).where(eq(themes.key, 'demo-wedding'));
  if (!t) throw new Error('demo-wedding not registered (run db:seed)');
  const cover = await storeImage(db(), await sharp({ create: { width: 420, height: 600, channels: 3, background: '#e8d5c4' } }).png().toBuffer(), { uploadedBy: null });
  const audio = await storeAudio(db(), mp3(4.1), { uploadedBy: null });
  const song =
    (await createMusicTrack(db(), { title: `e2e-song-${randomToken(4)}`, assetId: audio.id }, actor).catch(() => null)) ??
    (await db().select().from(musicTracks).where(eq(musicTracks.assetId, audio.id)))[0]!;
  await updateThemeSettings(db(), t.id, { name: t.name, sectionId: t.sectionId, coverAssetId: t.coverAssetId ?? cover.id, musicTrackId: t.musicTrackId ?? song.id }, actor);
  // A design holds at most three packages on sale and other tests add theirs to demo-wedding: use one that already has
  // guest messages (filling whatever fields it asks for), else add our own.
  const packageId =
    (await packagesWithShape(db(), t.id)).find((p) => p.status === 'ACTIVE' && p.featureKeys.includes('congratulations'))?.id ??
    (await createPackage(db(), t.id, { name: { ar: 'باقة التهاني', en: 'Wishes' }, priceIqd: 40000, fieldKeys: [...FIELDS], featureKeys: ['music', 'rsvp', 'congratulations', 'keepsake_pdf'] }, actor)).id;
  const pkg = (await packagesWithShape(db(), t.id)).find((p) => p.id === packageId)!;
  if (t.status === 'DEVELOPMENT') await transitionTheme(db(), t.id, 'READY_FOR_REVIEW', actor);
  if (t.status !== 'ACTIVE') await transitionTheme(db(), t.id, 'ACTIVE', actor);

  const art = await storeImage(db(), await artwork(), { uploadedBy: null });
  await updateThemeBoard(
    db(),
    t.id,
    { assetId: art.id, widthMm: 600, heightMm: 900, area: { top: 15, right: 7, bottom: 5, left: 7 }, inks: 'dark', title: true, titleColor: '#7a5a2e', titleFont: 'ruqaa', font: 'vazir' },
    actor,
  );
  await updateSignatureBoardSettings(db(), { enabled: true, priceIqd: 25000, perBoard: PER_BOARD }, actor);

  const date = new Date(Date.now() + 40 * 86400_000).toISOString().slice(0, 10);
  const sample: Record<string, string> = {
    person_1_name: 'Dara',
    person_2_name: 'Ava',
    event_date: date,
    event_time: '19:30',
    venue_name: 'Grand Hall',
    venue_map_url: 'https://maps.google.com/?q=Erbil',
    invitation_message: 'Join us to celebrate our wedding.',
    family_names: 'The Karim and Aziz families',
    person_1_family: 'Karim',
    person_2_family: 'Aziz',
    seal_initials: 'DA',
  };
  const values = Object.fromEntries(Object.entries(sample).filter(([k]) => (pkg.fieldKeys as readonly string[]).includes(k) || (FIELDS as readonly string[]).includes(k)));
  const ctx = { ipHash: randomToken(8), userAgent: 'e2e' };
  const d = await createDraft(db(), { themeKey: 'demo-wedding', packageId, locale: 'en', values, extras: { signatureBoard: { on: true } } }, ctx);
  const o = await createOrder(db(), { previewToken: d.previewToken, customer: { name: 'Test', phone: '07701234567', email: 'e2e@bahja.test' }, acceptedTerms: true, idempotencyKey: randomToken(18) }, ctx);
  await markOrderPaid(db(), o.orderId, { kind: 'WAYL' });
  // Guests' messages (every third one unsigned), a second apart so their order is fixed.
  const start = Date.now() - MESSAGES * 1000;
  for (let i = 0; i < MESSAGES; i++) {
    const [name, message] = SAMPLE_MESSAGES[i % SAMPLE_MESSAGES.length]!;
    await db()
      .insert(guestResponses)
      .values({
        invitationId: d.invitationId,
        guestName: name,
        attendance: 'ATTENDING',
        message,
        signature: i % 3 === 2 ? null : sampleSignature(i + 1),
        clientTokenHash: randomToken(16),
        createdAt: new Date(start + i * 1000),
      });
  }
  const draft = await createDraft(db(), { themeKey: 'demo-wedding', packageId, locale: 'en', values }, ctx);
  const receipt = await getReceipt(db(), o.receiptToken);
  console.log(JSON.stringify({ themeId: t.id, packagePriceIqd: pkg.priceIqd, receiptToken: o.receiptToken, path: receipt?.invitation.path, invitationId: d.invitationId, amountIqd: o.amountIqd, previewToken: draft.previewToken }));
} finally {
  await closeDb();
}
