import 'server-only';
import { eq } from 'drizzle-orm';
import type { DbOrTx } from '@/server/db/client';
import { legalPolicyVersions, type LegalContent } from '@/server/db/schema';
import type { PolicyType } from './policies';

/**
 * Starting drafts written from how Bahja actually works. They are seeded as
 * DRAFTS only, for the owner (and ideally a lawyer) to review and publish in
 * Admin → Legal policies. Never overwrites: a type that has any version is skipped.
 */
const DRAFTS: Record<PolicyType, LegalContent> = {
  TERMS: {
    ar: `هذه الشروط تنظّم استخدامك لموقع بهجه وشراء الدعوات الرقمية منه. بإتمام الطلب فإنك توافق عليها.

## الخدمة
- بهجه تصمّم دعوات رقمية تُفتح برابط خاص، مع بطاقة للطباعة وميزات أخرى بحسب الباقة التي تختارها.
- تكتب أنت محتوى الدعوة (الأسماء، التاريخ، المكان، النص) وتراجعه في المعاينة قبل تأكيد الطلب.

## الطلب والدفع
- الأسعار بالدينار العراقي، وأي سعر بالدولار للعرض فقط.
- يُنشأ الطلب عند تأكيدك له، ويُدفع بالطريقة المذكورة في صفحة الإيصال. تُنشر الدعوة بعد تأكيد الدفع.

## مدة النشر
- تبقى الدعوة منشورة ٣٠ يوماً من تاريخ النشر، ثم تظهر للزوار رسالة بانتهاء الدعوة. يمكن تمديدها بالاتفاق معنا.

## محتوى الدعوة
- أنت مسؤول عن صحة المعلومات التي تكتبها وعن حقك في نشرها.
- لا يُسمح بمحتوى مسيء أو مخالف للقانون، ويحق لنا إيقاف أي دعوة تخالف ذلك.
- يمكن تصحيح الأخطاء في معلومات الدعوة بالتواصل معنا خلال مدة النشر.

## ردود الضيوف
- إذا تضمنت باقتك نموذج الحضور أو رسائل التهنئة، تُحفظ ردود الضيوف وتظهر لك، وقد تُجمع في ملف ذكرى.
- يحق لنا إخفاء أي رسالة مسيئة.

## الملكية
- التصاميم والموسيقى والبرمجيات ملك لبهجه أو مرخّصة لها. تحصل على حق استخدام دعوتك لمناسبتك فقط.

## التعديلات والتواصل
- قد نحدّث هذه الشروط، ويُطبّق على كل طلب الإصدار الذي وافقت عليه عند الطلب.
- للتواصل: عبر واتساب أو وسائل التواصل في صفحة «تواصل معنا».`,
    en: `These terms govern your use of the Bahja website and your purchase of digital invitations. By placing an order you accept them.

## The service
- Bahja designs digital invitations opened through a private link, with a printable card and other features depending on the package you choose.
- You write the invitation content (names, date, venue, message) and review it in the preview before confirming your order.

## Ordering and payment
- Prices are in Iraqi dinars; any US dollar price is shown for reference only.
- Your order is created when you confirm it and is paid as described on your receipt page. The invitation is published once payment is confirmed.

## Publication period
- The invitation stays online for 30 days from publication; after that, visitors see a message that it has ended. It can be extended by arrangement with us.

## Invitation content
- You are responsible for the accuracy of the information you enter and for your right to publish it.
- Offensive or unlawful content is not allowed, and we may take down any invitation that breaks this rule.
- Mistakes in the invitation details can be corrected by contacting us during the publication period.

## Guest replies
- If your package includes the guest form or congratulation messages, guests' replies are stored and shown to you, and may be gathered into a keepsake PDF.
- We may hide any offensive message.

## Ownership
- Designs, music and software belong to Bahja or are licensed to it. You receive the right to use your invitation for your occasion only.

## Changes and contact
- We may update these terms; each order is governed by the version accepted when it was placed.
- Contact us on WhatsApp or through the details on the Contact page.`,
  },
  PRIVACY: {
    ar: `توضّح هذه السياسة ما نجمعه من معلومات وكيف نستخدمه.

## ما نجمعه
- عند الطلب: اسمك ورقم هاتفك وبريدك الإلكتروني، ومحتوى الدعوة الذي تكتبه.
- من الضيوف (إذا كانت الميزة مفعّلة): الاسم، والحضور أو الاعتذار، ورسالة التهنئة.
- معلومات تقنية: لا نخزّن عنوان IP بشكله الأصلي، بل نسخة مشفّرة غير قابلة للاسترجاع لحماية الموقع من الإساءة.

## الكوكيز
- نستخدم ملفات ضرورية فقط: لتذكّر لغة الموقع، ولربط رد الضيف بجهازه حتى يتمكن من تصحيحه، ولتسجيل دخول فريق العمل. لا نستخدم كوكيز إعلانية.

## لماذا نستخدمها
- لتنفيذ طلبك ونشر دعوتك وإرسال ملفاتها إليك، وللتواصل معك بخصوص الطلب، ولحماية الموقع.

## مع من نشاركها
- مزودو الاستضافة والتخزين الذين يشغّلون الموقع، ومزود الدفع الإلكتروني عند تفعيله. لا نبيع معلوماتك.

## مدة الاحتفاظ
- ردود الضيوف وملف الذكرى: حتى ١٢ شهراً بعد انتهاء الدعوة.
- الطلبات والفواتير: للمدة التي تتطلبها القوانين المحاسبية.

## حقوقك
- يمكنك طلب الاطلاع على معلوماتك أو تصحيحها أو حذفها بالتواصل معنا، ما لم نكن ملزمين قانونياً بالاحتفاظ بها.`,
    en: `This policy explains what information we collect and how we use it.

## What we collect
- When you order: your name, phone number and email, and the invitation content you write.
- From guests (when the feature is included): their name, whether they will attend, and their congratulation message.
- Technical data: we never store IP addresses as such, only a one-way hashed version used to protect the site from abuse.

## Cookies
- We use only essential cookies: to remember the site language, to link a guest's reply to their device so they can correct it, and to keep our team signed in. We use no advertising cookies.

## Why we use it
- To fulfil your order, publish your invitation and deliver its files, to contact you about your order, and to protect the site.

## Who we share it with
- The hosting and storage providers that run the site, and the online payment provider when it is enabled. We never sell your information.

## How long we keep it
- Guest replies and the keepsake: up to 12 months after the invitation ends.
- Orders and invoices: as long as accounting law requires.

## Your rights
- You can ask to see, correct or delete your information by contacting us, unless we are legally required to keep it.`,
  },
  REFUND: {
    ar: `الدعوات منتجات رقمية مخصّصة لك، لذلك نطبّق ما يلي:

## قبل نشر الدعوة
- إذا ألغيت الطلب قبل نشر الدعوة، نعيد لك المبلغ كاملاً.

## بعد نشر الدعوة
- لا يُسترد المبلغ بعد النشر، لأن الدعوة تكون قد صُمّمت وأُرسلت لك.
- إذا كان هناك خطأ من جهتنا أو مشكلة تقنية لم نتمكن من حلّها، نصحّحها مجاناً أو نعيد لك المبلغ.

## التصحيحات
- تصحيح أخطاء معلومات الدعوة خلال مدة النشر مجاني.

## كيف تطلب الاسترجاع
- تواصل معنا على واتساب مع رقم طلبك، ونعيد المبلغ بنفس طريقة الدفع خلال ٧ أيام عمل.`,
    en: `Invitations are digital products made for you, so the following applies:

## Before the invitation is published
- If you cancel before your invitation is published, we refund the full amount.

## After publication
- Payments are not refundable after publication, because the invitation has been prepared and delivered.
- If there is a mistake on our side or a technical problem we cannot fix, we correct it free of charge or refund you.

## Corrections
- Correcting mistakes in the invitation details during the publication period is free.

## How to request a refund
- Contact us on WhatsApp with your order number; refunds are made by the same payment method within 7 working days.`,
  },
};

export async function seedLegalDrafts(db: DbOrTx) {
  for (const [type, content] of Object.entries(DRAFTS) as [PolicyType, LegalContent][]) {
    const [existing] = await db.select({ id: legalPolicyVersions.id }).from(legalPolicyVersions).where(eq(legalPolicyVersions.type, type)).limit(1);
    if (existing) continue;
    await db.insert(legalPolicyVersions).values({ type, version: 1, status: 'DRAFT', content }).onConflictDoNothing();
  }
}
