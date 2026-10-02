import 'server-only';
import { eq } from 'drizzle-orm';
import type { DbOrTx } from '@/server/db/client';
import { legalPolicyVersions, type LegalContent } from '@/server/db/schema';
import type { PolicyType } from './policies';

/**
 * Starting drafts written from how Bahja actually works. They are seeded as
 * DRAFTS only, for the owner (and ideally a lawyer) to review and publish in
 * Admin → Legal policies. Never overwrites owner text: a type that has any version
 * only gets the owner-approved Kurdish added to its untouched seeded draft.
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
    bdn: `ئەڤ مەرجە بکارئینانا مالپەرێ بەهجە و کڕینا داخوازنامێن دیجیتالی ژێ ڕێکدئێخن. ب تەمامکرنا داخوازیێ تو ل سەر وان ڕازی دبی.

## خزمەتگوزاری
- بەهجە داخوازنامێن دیجیتالی دیزاین دکەت کو ب لینکەکا تایبەت ڤەدبن، دگەل کارتەکێ بۆ چاپێ و تایبەتمەندیێن دی ل دویڤ وێ پاکێجا تو هەلدبژێری.
- ناڤەروکا داخوازنامێ (ناڤ، دیرۆک، جه، نڤیسین) تو ب خۆ دنڤیسی و بەری پشتڕاستکرنا داخوازیێ د پێشدیتنێ دا پێداچوونێ پێ دکەی.

## داخوازی و پارەدان
- بها ب دینارێ عیراقینە، و هەر بهایەکێ ب دۆلاری بتنێ بۆ نیشاندانێ یە.
- داخوازی دەمێ تو پشتڕاست دکەی چێدبیت، و ب وێ ڕێکێ پارە دهێتە دان یا ل لاپەرێ پسوولێ هاتی. داخوازنامە پشتی پشتڕاستکرنا پارەدانێ دهێتە بەلاڤکرن.

## دەمێ بەلاڤکرنێ
- داخوازنامە ٣٠ ڕۆژان ژ دیرۆکا بەلاڤکرنێ بەلاڤکری دمینیت، پاشان نامەیەک بۆ سەرەدانکەران دیار دبیت کو داخوازنامە ب دوماهی هاتیە. دبیت ب ڕێککەفتنێ دگەل مە بهێتە درێژکرن.

## ناڤەروکا داخوازنامێ
- تو بەرپرسیاری ژ دروستیا وان زانیاریێن تو دنڤیسی و ژ مافێ تە د بەلاڤکرنا وان دا.
- ناڤەروکا ڕێزشکێن یان نەیاسایی نە ڕێپێدایە، و مافێ مە هەیە هەر داخوازنامەکا ڤێ یەکێ بشکێنیت ڕاوەستینین.
- خەلەتیێن زانیاریێن داخوازنامێ دبیت ب پەیوەندیکرنێ ب مە ڤە د دەمێ بەلاڤکرنێ دا بهێنە ڕاستکرن.

## بەرسڤێن مێڤانان
- ئەگەر پاکێجا تە فۆرما ئامادەبوونێ یان نامێن پیرۆزباهیێ تێدا هەبن، بەرسڤێن مێڤانان دهێنە پاراستن و بۆ تە دیار دبن، و دبیت د فایلەکا بیرهاتنێ دا بهێنە کۆمکرن.
- مافێ مە هەیە هەر نامەکا ڕێزشکێن ڤەشێرین.

## خودانداری
- دیزاین و مۆزیک و نەرمەکاڵا یێن بەهجە نە یان مۆلەت بۆ هاتیە وەرگرتن. تو بتنێ مافێ بکارئینانا داخوازناما خۆ بۆ ئاهەنگا خۆ وەردگری.

## گوهۆڕین و پەیوەندی
- دبیت ئەم ڤان مەرجان نوو بکەین، و ل سەر هەر داخوازیەکێ ئەو وەشان دهێتە جێبەجێکرن یا تو دەمێ داخوازیێ ل سەر ڕازی بووی.
- بۆ پەیوەندیێ: ب ڕێکا واتسئاپێ یان ڕێکێن پەیوەندیێ ل لاپەرێ «پەیوەندیێ ب مە بکە».`,
    ckb: `ئەم مەرجانە ڕێکخەری بەکارهێنانی ماڵپەری بەهجە و کڕینی بانگهێشتنامە دیجیتاڵییەکانن. بە تەواوکردنی داواکاری، ڕازی دەبیت پێیان.

## خزمەتگوزاری
- بەهجە بانگهێشتنامەی دیجیتاڵی دیزاین دەکات کە بە بەستەرێکی تایبەت دەکرێنەوە، لەگەڵ کارتێک بۆ چاپ و تایبەتمەندی تر بەپێی ئەو پاکێجەی هەڵیدەبژێریت.
- ناوەڕۆکی بانگهێشتنامەکە (ناوەکان، بەروار، شوێن، دەق) خۆت دەینووسیت و پێش پشتڕاستکردنەوەی داواکاری لە پێشبینیندا پێیدا دەچیتەوە.

## داواکاری و پارەدان
- نرخەکان بە دیناری عێراقین، و هەر نرخێک بە دۆلار تەنها بۆ پیشاندانە.
- داواکاری کاتێک دروست دەبێت کە پشتڕاستی دەکەیتەوە، و بەو ڕێگایە پارەی دەدرێت کە لە پەرەی پسوولەکەدا هاتووە. بانگهێشتنامەکە دوای پشتڕاستکردنەوەی پارەدان بڵاو دەکرێتەوە.

## ماوەی بڵاوکردنەوە
- بانگهێشتنامەکە ٣٠ ڕۆژ لە بەرواری بڵاوکردنەوەوە بڵاو دەمێنێتەوە، پاشان پەیامێکی کۆتاییهاتنی بانگهێشتنامەکە بۆ سەردانکەران دەردەکەوێت. دەکرێت بە ڕێککەوتن لەگەڵمان درێژ بکرێتەوە.

## ناوەڕۆکی بانگهێشتنامە
- تۆ بەرپرسیاریت لە دروستی ئەو زانیارییانەی دەینووسیت و لە مافی بڵاوکردنەوەیان.
- ناوەڕۆکی سووکایەتیئامێز یان نایاسایی ڕێگەپێدراو نییە، و مافی ئەوەمان هەیە هەر بانگهێشتنامەیەک کە پێچەوانەی ئەمە بێت ڕابگرین.
- هەڵەکانی زانیاری بانگهێشتنامە دەکرێت بە پەیوەندیکردن پێمانەوە لە ماوەی بڵاوکردنەوەدا ڕاست بکرێنەوە.

## وەڵامی میوانەکان
- ئەگەر پاکێجەکەت فۆرمی ئامادەبوون یان نامەی پیرۆزبایی تێدابێت، وەڵامی میوانەکان پاشەکەوت دەکرێن و بۆت دەردەکەون، و لەوانەیە لە فایلێکی یادگاریدا کۆ بکرێنەوە.
- مافی ئەوەمان هەیە هەر نامەیەکی سووکایەتیئامێز بشارینەوە.

## خاوەندارێتی
- دیزاین و مۆسیقا و نەرمەکاڵاکان موڵکی بەهجەن یان مۆڵەتیان بۆ وەرگیراوە. تۆ تەنها مافی بەکارهێنانی بانگهێشتنامەکەت بۆ بۆنەکەت وەردەگریت.

## گۆڕانکاری و پەیوەندی
- لەوانەیە ئەم مەرجانە نوێ بکەینەوە، و لەسەر هەر داواکارییەک ئەو وەشانە جێبەجێ دەکرێت کە لە کاتی داواکاریدا ڕازی بوویت پێی.
- بۆ پەیوەندی: لە ڕێگەی واتسئاپ یان ڕێگاکانی پەیوەندی لە پەرەی «پەیوەندیمان پێوە بکە».`,
  },
  PRIVACY: {
    ar: `توضّح هذه السياسة ما نجمعه من معلومات وكيف نستخدمه.

## ما نجمعه
- عند الطلب: اسمك ورقم هاتفك وبريدك الإلكتروني، ومحتوى الدعوة الذي تكتبه.
- من الضيوف (إذا كانت الميزة مفعّلة): الاسم، والحضور أو الاعتذار، ورسالة التهنئة.
- معلومات تقنية: لا نخزّن عنوان IP بشكله الأصلي، بل نسخة مشفّرة غير قابلة للاسترجاع لحماية الموقع من الإساءة.

## الكوكيز
- نستخدم ملفات ضرورية فقط: لتذكّر لغة الموقع، ولربط رد الضيف بجهازه حتى يتمكن من تصحيحه، ولتسجيل دخول فريق العمل. لا نستخدم كوكيز إعلانية.
- نحسب الزيارات بشكل مجهول الهوية عبر رقم عشوائي يُحفظ في المتصفح طوال الجلسة فقط، دون أي معلومات شخصية.

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
- We count visits anonymously with a random number kept in the browser for the current visit only, without any personal information.

## Why we use it
- To fulfil your order, publish your invitation and deliver its files, to contact you about your order, and to protect the site.

## Who we share it with
- The hosting and storage providers that run the site, and the online payment provider when it is enabled. We never sell your information.

## How long we keep it
- Guest replies and the keepsake: up to 12 months after the invitation ends.
- Orders and invoices: as long as accounting law requires.

## Your rights
- You can ask to see, correct or delete your information by contacting us, unless we are legally required to keep it.`,
    bdn: `ئەڤ سیاسەتە ڕوون دکەت کا ئەم چ زانیاریان کۆم دکەین و چاوا بکار دئینین.

## ئەوا ئەم کۆم دکەین
- دەمێ داخوازیێ: ناڤ و ژمارا تەلەفۆنێ و ئیمەیلا تە، و ناڤەروکا وێ داخوازنامێ یا تو دنڤیسی.
- ژ مێڤانان (ئەگەر تایبەتمەندی چالاک بیت): ناڤ، ئامادەبوون یان نەهاتن، و نامەیا پیرۆزباهیێ.
- زانیاریێن تەکنیکی: ئەم ناڤ و نیشانێ IP ب شێوێ وی یێ ڕەسەن ناپارێزین، بتنێ وەشانەکا شفرەکری یا نەزڤڕۆک بۆ پاراستنا مالپەری ژ خراب بکارئینانێ.

## کووکیز
- ئەم بتنێ فایلێن پێدڤی بکار دئینین: بۆ ب بیرئینانا زمانێ مالپەری، بۆ گرێدانا بەرسڤا مێڤانی ب ئامیرێ وی ڤە دا بشێت ڕاست بکەت، و بۆ چوونا ژوور یا تیما مە. ئەم کووکیزێن ڕیکلامێ بکار نائینین.
- ئەم سەرەدانان ب شێوەیەکێ بێ ناڤ دهژمێرین ب ڕێکا ژمارەکا هەڕەمەکی یا بتنێ د دەمێ سەرەدانێ دا د وێبگەڕی دا دمینیت، بێ چ زانیاریێن کەسی.

## بۆچی بکار دئینین
- بۆ جێبەجێکرنا داخوازیا تە و بەلاڤکرنا داخوازناما تە و هنارتنا فایلێن وێ بۆ تە، بۆ پەیوەندیکرنێ ب تە ڤە دەربارەی داخوازیێ، و بۆ پاراستنا مالپەری.

## دگەل کێ پارڤە دکەین
- دابینکەرێن هۆستینگێ و پاراستنا فایلان یێن مالپەری کار پێ دکەن، و دابینکەرێ پارەدانا ئەلیکترۆنی دەمێ چالاک دبیت. ئەم قەت زانیاریێن تە نافرۆشین.

## دەمێ پاراستنێ
- بەرسڤێن مێڤانان و فایلا بیرهاتنێ: هەتا ١٢ هەیڤان پشتی ب دوماهی هاتنا داخوازنامێ.
- داخوازی و پسوولە: بۆ وی دەمێ یاسایێن ژمێریاریێ دخوازن.

## مافێن تە
- تو دشێی ب پەیوەندیکرنێ ب مە ڤە داخوازا دیتن یان ڕاستکرن یان ژێبرنا زانیاریێن خۆ بکەی، ئەگەر ئەم ب یاسایێ نە ناچار بین بپارێزین.`,
    ckb: `ئەم سیاسەتە ڕوون دەکاتەوە چ زانیارییەک کۆ دەکەینەوە و چۆن بەکاری دەهێنین.

## ئەوەی کۆی دەکەینەوە
- لە کاتی داواکاری: ناو و ژمارەی تەلەفۆن و ئیمەیڵەکەت، و ناوەڕۆکی ئەو بانگهێشتنامەیەی دەینووسیت.
- لە میوانەکان (ئەگەر تایبەتمەندییەکە چالاک بێت): ناو، ئامادەبوون یان نەهاتن، و نامەی پیرۆزبایی.
- زانیاری تەکنیکی: ناونیشانی IP بە شێوەی ڕەسەنی خۆی پاشەکەوت ناکەین، تەنها وەشانێکی شفرەکراوی نەگەڕاوە بۆ پاراستنی ماڵپەرەکە لە خراپ بەکارهێنان.

## کووکیز
- تەنها فایلی پێویست بەکاردەهێنین: بۆ لەبیرکردنی زمانی ماڵپەر، بۆ بەستنەوەی وەڵامی میوان بە ئامێرەکەیەوە تا بتوانێت ڕاستی بکاتەوە، و بۆ چوونەژوورەوەی تیمی کارەکەمان. کووکیزی ڕیکلام بەکارناهێنین.
- سەردانەکان بە شێوەیەکی بێناو دەژمێرین لە ڕێگەی ژمارەیەکی هەڕەمەکی کە تەنها بە درێژایی سەردانەکە لە وێبگەڕەکەدا دەمێنێتەوە، بەبێ هیچ زانیارییەکی کەسی.

## بۆچی بەکاری دەهێنین
- بۆ جێبەجێکردنی داواکارییەکەت و بڵاوکردنەوەی بانگهێشتنامەکەت و ناردنی فایلەکانی بۆت، بۆ پەیوەندیکردن پێتەوە دەربارەی داواکارییەکە، و بۆ پاراستنی ماڵپەرەکە.

## لەگەڵ کێ هاوبەشی دەکەین
- دابینکەرانی خانەخوێی و هەڵگرتن کە ماڵپەرەکە کار پێدەکەن، و دابینکەری پارەدانی ئەلیکترۆنی کاتێک چالاک دەبێت. هەرگیز زانیارییەکانت نافرۆشین.

## ماوەی هەڵگرتن
- وەڵامی میوانەکان و فایلی یادگاری: تا ١٢ مانگ دوای کۆتاییهاتنی بانگهێشتنامەکە.
- داواکاری و پسوولەکان: بۆ ئەو ماوەیەی یاساکانی ژمێریاری داوای دەکەن.

## مافەکانت
- دەتوانیت بە پەیوەندیکردن پێمانەوە داوای بینین یان ڕاستکردنەوە یان سڕینەوەی زانیارییەکانت بکەیت، مەگەر بە یاسا ناچار بین هەڵیانبگرین.`,
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
    bdn: `داخوازنامە بەرهەمێن دیجیتالی نە یێن تایبەت بۆ تە دهێنە چێکرن، لەوما ئەم ڤان خالێن ل خوارێ جێبەجێ دکەین:

## بەری بەلاڤکرنا داخوازنامێ
- ئەگەر تە بەری بەلاڤکرنا داخوازنامێ داخوازیا خۆ هەلوەشاند، ئەم هەمی پارێ تە بۆ تە دزڤڕینین.

## پشتی بەلاڤکرنا داخوازنامێ
- پشتی بەلاڤکرنێ پارە نازڤڕیت، چونکی داخوازنامە هاتیە دیزاینکرن و بۆ تە هاتیە هنارتن.
- ئەگەر خەلەتیەک ژ لایێ مە ڤە یان ئاریشەکا تەکنیکی هەبیت کو مە نەشیای چارەسەر بکەین، ئەم ب بێ بەرامبەر ڕاست دکەین یان پارێ تە بۆ تە دزڤڕینین.

## ڕاستکرن
- ڕاستکرنا خەلەتیێن زانیاریێن داخوازنامێ د دەمێ بەلاڤکرنێ دا ب بێ بەرامبەرە.

## چاوا داخوازا زڤڕاندنا پارەی بکەی
- ل واتسئاپێ دگەل ژمارا داخوازیا خۆ پەیوەندیێ ب مە بکە، و د ماوێ ٧ ڕۆژێن کاری دا ب هەمان ڕێکا پارەدانێ پارێ تە بۆ تە دزڤڕینین.`,
    ckb: `بانگهێشتنامەکان بەرهەمی دیجیتاڵین کە تایبەت بۆ تۆ دروست دەکرێن، بۆیە ئەمانەی خوارەوە جێبەجێ دەکەین:

## پێش بڵاوکردنەوەی بانگهێشتنامە
- ئەگەر پێش بڵاوکردنەوەی بانگهێشتنامەکە داواکارییەکەت هەڵوەشاندەوە، هەموو پارەکەت بۆ دەگەڕێنینەوە.

## دوای بڵاوکردنەوەی بانگهێشتنامە
- دوای بڵاوکردنەوە پارە ناگەڕێنرێتەوە، چونکە بانگهێشتنامەکە دیزاین کراوە و بۆت نێردراوە.
- ئەگەر هەڵەیەک لە لایەن ئێمەوە یان کێشەیەکی تەکنیکی هەبێت کە نەمانتوانی چارەسەری بکەین، بەخۆڕایی ڕاستی دەکەینەوە یان پارەکەت بۆ دەگەڕێنینەوە.

## ڕاستکردنەوەکان
- ڕاستکردنەوەی هەڵەکانی زانیاری بانگهێشتنامە لە ماوەی بڵاوکردنەوەدا بەخۆڕاییە.

## چۆن داوای گەڕاندنەوەی پارە بکەیت
- لە واتسئاپ لەگەڵ ژمارەی داواکارییەکەت پەیوەندیمان پێوە بکە، و لە ماوەی ٧ ڕۆژی کاردا بە هەمان ڕێگای پارەدان پارەکەت بۆ دەگەڕێنینەوە.`,
  },
};

export async function seedLegalDrafts(db: DbOrTx) {
  for (const [type, content] of Object.entries(DRAFTS) as [PolicyType, LegalContent][]) {
    const rows = await db.select().from(legalPolicyVersions).where(eq(legalPolicyVersions.type, type));
    if (rows.length === 0) {
      await db.insert(legalPolicyVersions).values({ type, version: 1, status: 'DRAFT', content }).onConflictDoNothing();
      continue;
    }
    // Adds the approved Kurdish to a draft that still has the untouched seeded Arabic and no Kurdish yet.
    for (const row of rows) {
      if (row.status !== 'DRAFT' || row.content.ar !== content.ar || (row.content.ckb && row.content.bdn)) continue;
      await db
        .update(legalPolicyVersions)
        .set({ content: { ...row.content, ckb: row.content.ckb || content.ckb, bdn: row.content.bdn || content.bdn } })
        .where(eq(legalPolicyVersions.id, row.id));
    }
  }
}
