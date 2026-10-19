import 'server-only';
import { eq } from 'drizzle-orm';
import type { DbOrTx } from '@/server/db/client';
import { legalPolicyVersions, type LegalContent } from '@/server/db/schema';
import { currentPolicy, policyAdminView, publishDraft, saveDraft, type PolicyType } from './policies';

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
- تبقى الدعوة منشورة طوال مدة الباقة (٣٠ يوماً أو ٦٠ يوماً أو سنة أو للأبد) من تاريخ النشر، ثم تظهر للزوار رسالة بانتهاء الدعوة. يمكن تمديدها بالاتفاق معنا.

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
- The invitation stays online for its package's time from publication (30 days, 60 days, 1 year or forever); after that, visitors see a message that it has ended. It can be extended by arrangement with us.

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
- داخوازنامە ب درێژاهیا ماوێ پاکێجێ (٣٠ ڕۆژان، ٦٠ ڕۆژان، ساڵەکێ یان بۆ هەردەم) ژ دیرۆکا بەلاڤکرنێ بەلاڤکری دمینیت، پاشان نامەیەک بۆ سەرەدانکەران دیار دبیت کو داخوازنامە ب دوماهی هاتیە. دبیت ب ڕێککەفتنێ دگەل مە بهێتە درێژکرن.

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
- بانگهێشتنامەکە بە درێژایی ماوەی پاکێجەکە (٣٠ ڕۆژ، ٦٠ ڕۆژ، ساڵێک یان بۆ هەمیشە) لە بەرواری بڵاوکردنەوەوە بڵاو دەمێنێتەوە، پاشان پەیامێکی کۆتاییهاتنی بانگهێشتنامەکە بۆ سەردانکەران دەردەکەوێت. دەکرێت بە ڕێککەوتن لەگەڵمان درێژ بکرێتەوە.

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
  // Newborn invitations have their own terms. Kurdish approved by the owner (batch 24, 2026-10-17);
  // a policy can only be published with all four languages.
  TERMS_NEWBORN: {
    ar: `هذه الشروط تنظّم شراء دعوات المولود الجديد وإضافاتها من موقع بهجه. بإتمام الطلب فإنك توافق عليها.

## الخدمة
- بهجه تصمّم دعوة رقمية للإعلان عن مولودكم تُفتح برابط خاص، مع إضافات بحسب الباقة التي تختارها: صورة ستوري لإنستغرام، ملصقات للشوكولاتة، ملصق لقناني الماء، وبطاقة للطباعة.
- تكتب أنت بيانات المولود (الاسم، ولد أم بنت، اسم الأم والأب، تاريخ الولادة، العبارة) وتراجعها في المعاينة قبل تأكيد الطلب.

## الطلب والدفع
- الأسعار بالدينار العراقي، وأي سعر بالدولار للعرض فقط.
- يُنشأ الطلب عند تأكيدك له، ويُدفع بالطريقة المذكورة في صفحة الإيصال. تُنشر الدعوة بعد تأكيد الدفع.

## المعاينات والملفات
- تظهر المعاينات قبل الدفع بعلامة مائية لحماية التصميم.
- بعد تأكيد الدفع تُزال العلامة، وتحمّل الملفات (صور PNG وأوراق طباعة PDF) من صفحة الإيصال.

## الطباعة
- ملفات الطباعة جاهزة بالمقاسات المذكورة، والطباعة على مسؤوليتك أو مسؤولية المطبعة التي تختارها.
- قد تختلف الألوان قليلاً بين الشاشة والورق وبين مطبعة وأخرى، وهذا ليس عيباً في التصميم.
- الملصقات للتزيين، وتوضع على الغلاف لا على الطعام مباشرة.

## بيانات المولود والخصوصية
- رابط الدعوة خاص ولا يظهر في الموقع، لكن كل من يصله الرابط يستطيع فتحها، فشاركه مع من تثق بهم فقط.
- اكتب فقط ما ترغب في مشاركته من بيانات المولود. لا نستخدم هذه البيانات لأي غرض غير دعوتك.

## مدة النشر
- تبقى الدعوة منشورة طوال مدة الباقة (٣٠ يوماً أو ٦٠ يوماً أو سنة أو للأبد) من تاريخ النشر، ثم تظهر للزوار رسالة بانتهاء الدعوة. يمكن تمديدها بالاتفاق معنا.

## محتوى الدعوة
- أنت مسؤول عن صحة المعلومات التي تكتبها وعن حقك في نشرها.
- لا يُسمح بمحتوى مسيء أو مخالف للقانون، ويحق لنا إيقاف أي دعوة تخالف ذلك.
- يمكن تصحيح الأخطاء في بيانات الدعوة بالتواصل معنا خلال مدة النشر، وتُحدَّث الملفات بعد التصحيح.

## الملكية
- التصاميم والموسيقى والبرمجيات ملك لبهجه أو مرخّصة لها. يحق لك استخدام دعوتك وطباعة ملفاتها ومشاركتها لمناسبتك فقط، ولا يجوز بيعها أو استخدام التصميم لغيرك.

## التعديلات والتواصل
- قد نحدّث هذه الشروط، ويُطبّق على كل طلب الإصدار الذي وافقت عليه عند الطلب.
- للتواصل: عبر واتساب أو وسائل التواصل في صفحة «تواصل معنا».`,
    en: `These terms govern the purchase of newborn baby invitations and their extras from the Bahja website. By placing an order you accept them.

## The service
- Bahja designs a digital invitation announcing your baby, opened through a private link, with extras depending on the package you choose: an Instagram story picture, chocolate stickers, a water bottle label and a printable card.
- You write the baby's details (name, boy or girl, mother's and father's names, date of birth, a short quote) and review them in the preview before confirming your order.

## Ordering and payment
- Prices are in Iraqi dinars; any US dollar price is shown for reference only.
- Your order is created when you confirm it and is paid as described on your receipt page. The invitation is published once payment is confirmed.

## Previews and files
- Previews shown before payment carry a watermark to protect the design.
- Once payment is confirmed the watermark is removed and you download the files (PNG pictures and PDF print sheets) from your receipt page.

## Printing
- The print files are ready at the sizes stated; printing is your responsibility or that of the print shop you choose.
- Colours may differ slightly between screen and paper and from one printer to another; this is not a fault in the design.
- The stickers are decorative and go on the wrapping, not directly on food.

## Your baby's details and privacy
- The invitation link is private and not listed on the website, but anyone who has the link can open it, so share it only with people you trust.
- Only write the details about your baby that you are happy to share. We use them for your invitation only.

## Publication period
- The invitation stays online for its package's time from publication (30 days, 60 days, 1 year or forever); after that, visitors see a message that it has ended. It can be extended by arrangement with us.

## Invitation content
- You are responsible for the accuracy of the information you enter and for your right to publish it.
- Offensive or unlawful content is not allowed, and we may take down any invitation that breaks this rule.
- Mistakes in the invitation details can be corrected by contacting us during the publication period; the files are updated after the correction.

## Ownership
- Designs, music and software belong to Bahja or are licensed to it. You may use your invitation and print and share its files for your occasion only; you may not sell them or use the design for anyone else.

## Changes and contact
- We may update these terms; each order is governed by the version accepted when it was placed.
- Contact us on WhatsApp or through the details on the Contact page.`,
    ckb: `ئەم مەرجانە ڕێکخەری کڕینی بانگهێشتنامەی منداڵی تازە لەدایکبوو و زیادەکانین لە ماڵپەری بەهجە. بە تەواوکردنی داواکاری، ڕازی دەبیت پێیان.

## خزمەتگوزاری
- بەهجە بانگهێشتنامەیەکی دیجیتاڵی بۆ ڕاگەیاندنی لەدایکبوونی منداڵەکەتان دیزاین دەکات کە بە بەستەرێکی تایبەت دەکرێتەوە، لەگەڵ زیادەکان بەپێی ئەو پاکێجەی هەڵیدەبژێریت: وێنەی ستۆری ئینستاگرام، لکێنەری چوکلێت، لکێنەری بوتڵی ئاو و کارتێک بۆ چاپ.
- زانیاری منداڵەکە (ناو، کوڕ یان کچ، ناوی دایک و باوک، بەرواری لەدایکبوون، ڕستە) خۆت دەینووسیت و پێش پشتڕاستکردنەوەی داواکاری لە پێشبینیندا پێیدا دەچیتەوە.

## داواکاری و پارەدان
- نرخەکان بە دیناری عێراقین، و هەر نرخێک بە دۆلار تەنها بۆ پیشاندانە.
- داواکاری کاتێک دروست دەبێت کە پشتڕاستی دەکەیتەوە، و بەو ڕێگایە پارەی دەدرێت کە لە پەرەی پسوولەکەدا هاتووە. بانگهێشتنامەکە دوای پشتڕاستکردنەوەی پارەدان بڵاو دەکرێتەوە.

## پێشبینین و فایلەکان
- پێشبینینەکان پێش پارەدان نیشانەی ئاویان لەسەرە بۆ پاراستنی دیزاینەکە.
- دوای پشتڕاستکردنەوەی پارەدان نیشانەکە لادەبرێت و فایلەکان (وێنەی PNG و پەڕەی چاپی PDF) لە پەڕەی پسوولەکە دادەگریت.

## چاپ
- فایلەکانی چاپ بە قەبارە دیاریکراوەکان ئامادەن، و چاپکردن لە ئەستۆی خۆت یان ئەو چاپخانەیەیە کە هەڵیدەبژێریت.
- لەوانەیە ڕەنگەکان کەمێک لە نێوان شاشە و کاغەز و لە چاپخانەیەکەوە بۆ یەکێکی تر جیاواز بن، ئەمە کەموکوڕی دیزاین نییە.
- لکێنەرەکان بۆ ڕازاندنەوەن و لەسەر بەرگەکە دادەنرێن، نەک ڕاستەوخۆ لەسەر خواردن.

## زانیاری منداڵەکەت و تایبەتمەندی
- بەستەری بانگهێشتنامەکە تایبەتە و لە ماڵپەرەکەدا دەرناکەوێت، بەڵام هەر کەسێک بەستەرەکەی هەبێت دەتوانێت بیکاتەوە، بۆیە تەنها لەگەڵ ئەو کەسانە هاوبەشی بکە کە متمانەت پێیانە.
- تەنها ئەو زانیارییانەی منداڵەکەت بنووسە کە دەتەوێت هاوبەشیان بکەیت. ئێمە تەنها بۆ بانگهێشتنامەکەت بەکاریان دەهێنین.

## ماوەی بڵاوکردنەوە
- بانگهێشتنامەکە بە درێژایی ماوەی پاکێجەکە (٣٠ ڕۆژ، ٦٠ ڕۆژ، ساڵێک یان بۆ هەمیشە) لە بەرواری بڵاوکردنەوەوە بڵاو دەمێنێتەوە، پاشان پەیامێکی کۆتاییهاتنی بانگهێشتنامەکە بۆ سەردانکەران دەردەکەوێت. دەکرێت بە ڕێککەوتن لەگەڵمان درێژ بکرێتەوە.

## ناوەڕۆکی بانگهێشتنامە
- تۆ بەرپرسیاریت لە دروستی ئەو زانیارییانەی دەینووسیت و لە مافی بڵاوکردنەوەیان.
- ناوەڕۆکی سووکایەتیئامێز یان نایاسایی ڕێگەپێدراو نییە، و مافی ئەوەمان هەیە هەر بانگهێشتنامەیەک کە پێچەوانەی ئەمە بێت ڕابگرین.
- هەڵەکانی زانیاری بانگهێشتنامە دەکرێت بە پەیوەندیکردن پێمانەوە لە ماوەی بڵاوکردنەوەدا ڕاست بکرێنەوە، و دوای ڕاستکردنەوە فایلەکان نوێ دەکرێنەوە.

## خاوەندارێتی
- دیزاین و مۆسیقا و نەرمەکاڵاکان موڵکی بەهجەن یان مۆڵەتیان بۆ وەرگیراوە. دەتوانیت بانگهێشتنامەکەت بەکاربهێنیت و فایلەکانی چاپ و هاوبەش بکەیت تەنها بۆ بۆنەکەت؛ نابێت بیانفرۆشیت یان دیزاینەکە بۆ کەسێکی تر بەکاربهێنیت.

## گۆڕانکاری و پەیوەندی
- لەوانەیە ئەم مەرجانە نوێ بکەینەوە، و لەسەر هەر داواکارییەک ئەو وەشانە جێبەجێ دەکرێت کە لە کاتی داواکاریدا ڕازی بوویت پێی.
- بۆ پەیوەندی: لە ڕێگەی واتسئاپ یان ڕێگاکانی پەیوەندی لە پەرەی «پەیوەندیمان پێوە بکە».`,
    bdn: `ئەڤ مەرجە کڕینا داخوازنامێن زاروکێ نوو و زێدەکرنێن وان ژ مالپەرێ بەهجە ڕێکدئێخن. ب تەمامکرنا داخوازیێ تو ل سەر وان ڕازی دبی.

## خزمەتگوزاری
- بەهجە داخوازنامەکا دیجیتالی بۆ ڕاگەهاندنا ژدایکبوونا زاروکێ هەوە دیزاین دکەت کو ب لینکەکا تایبەت ڤەدبیت، دگەل زێدەکرنان ل دویڤ وێ پاکێجا تو هەلدبژێری: وێنەیێ ستۆریا ئینستاگرامێ، لکێنەرێن چوکلێتێ، لکێنەرێ بوتلێن ئاڤێ و کارتەکێ بۆ چاپێ.
- زانیاریێن زاروکی (ناڤ، کوڕ یان کچ، ناڤێ دەیکێ و بابی، دیرۆکا ژدایکبوونێ، ڕستە) تو ب خۆ دنڤیسی و بەری پشتڕاستکرنا داخوازیێ د پێشدیتنێ دا پێداچوونێ پێ دکەی.

## داخوازی و پارەدان
- بها ب دینارێ عیراقینە، و هەر بهایەکێ ب دۆلاری بتنێ بۆ نیشاندانێ یە.
- داخوازی دەمێ تو پشتڕاست دکەی چێدبیت، و ب وێ ڕێکێ پارە دهێتە دان یا ل لاپەرێ پسوولێ هاتی. داخوازنامە پشتی پشتڕاستکرنا پارەدانێ دهێتە بەلاڤکرن.

## پێشدیتن و فایل
- پێشدیتن بەری پارەدانێ نیشانا ئاڤێ ل سەرە بۆ پاراستنا دیزاینێ.
- پشتی پشتڕاستکرنا پارەدانێ نیشان دێ هێتە لابرن و تو فایلان (وێنێن PNG و لاپەرێن چاپێ یێن PDF) ژ لاپەرێ پسوولێ دادگری.

## چاپ
- فایلێن چاپێ ب قەبارێن دیارکری ئامادەنە، و چاپکرن ل سەر بەرپرسیاریا تە یان یا وێ چاپخانێ یە یا تو هەلدبژێری.
- دبیت ڕەنگ هندەک د ناڤبەرا شاشێ و کاغەزێ دا و ژ چاپخانەکێ بۆ یا دی جودا بن، و ئەڤە کێماسیەک د دیزاینێ دا نینە.
- لکێنەر بۆ ڕازاندنێ نە و ل سەر بەرگی دهێنە دانان، نە ڕاستەوخۆ ل سەر خوارنێ.

## زانیاریێن زاروکێ تە و تایبەتمەندی
- لینکا داخوازنامێ تایبەتە و ل مالپەرێ دیار نابیت، بەلێ هەر کەسێ لینک هەبیت دشێت ڤەکەت، لەوما بتنێ دگەل وان کەسێن تو باوەری پێ هەی پارڤە بکە.
- بتنێ وان زانیاریێن زاروکێ خۆ بنڤیسە یێن تو دڤێی پارڤە بکەی. ئەم بتنێ بۆ داخوازناما تە بکاردئینین.

## دەمێ بەلاڤکرنێ
- داخوازنامە ب درێژاهیا ماوێ پاکێجێ (٣٠ ڕۆژان، ٦٠ ڕۆژان، ساڵەکێ یان بۆ هەردەم) ژ دیرۆکا بەلاڤکرنێ بەلاڤکری دمینیت، پاشان نامەیەک بۆ سەرەدانکەران دیار دبیت کو داخوازنامە ب دوماهی هاتیە. دبیت ب ڕێککەفتنێ دگەل مە بهێتە درێژکرن.

## ناڤەروکا داخوازنامێ
- تو بەرپرسیاری ژ دروستیا وان زانیاریێن تو دنڤیسی و ژ مافێ تە د بەلاڤکرنا وان دا.
- ناڤەروکا ڕێزشکێن یان نەیاسایی نە ڕێپێدایە، و مافێ مە هەیە هەر داخوازنامەکا ڤێ یەکێ بشکێنیت ڕاوەستینین.
- خەلەتیێن زانیاریێن داخوازنامێ دبیت ب پەیوەندیکرنێ ب مە ڤە د دەمێ بەلاڤکرنێ دا بهێنە ڕاستکرن، و پشتی ڕاستکرنێ فایل دهێنە نووکرن.

## خودانداری
- دیزاین و مۆزیک و نەرمەکاڵا یێن بەهجە نە یان مۆلەت بۆ هاتیە وەرگرتن. تو دشێی داخوازناما خۆ بکاربینی و فایلێن وێ چاپ بکەی و پارڤە بکەی بتنێ بۆ ئاهەنگا خۆ؛ نابیت تو بفرۆشی یان دیزاینێ بۆ کەسەکێ دی بکاربینی.

## گوهۆڕین و پەیوەندی
- دبیت ئەم ڤان مەرجان نوو بکەین، و ل سەر هەر داخوازیەکێ ئەو وەشان دهێتە جێبەجێکرن یا تو دەمێ داخوازیێ ل سەر ڕازی بووی.
- بۆ پەیوەندیێ: ب ڕێکا واتسئاپێ یان ڕێکێن پەیوەندیێ ل لاپەرێ «پەیوەندیێ ب مە بکە».`,
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
      if (!content.ckb || row.status !== 'DRAFT' || row.content.ar !== content.ar || (row.content.ckb && row.content.bdn)) continue;
      await db
        .update(legalPolicyVersions)
        .set({ content: { ...row.content, ckb: row.content.ckb || content.ckb, bdn: row.content.bdn || content.bdn } })
        .where(eq(legalPolicyVersions.id, row.id));
    }
  }
}

/**
 * The online-time sentence of the terms, as first written (30 days for everyone) and as it reads now that each package
 * has its own time (owner request, 2026-10-16), per language.
 */
const LIFETIME_LINES: Record<keyof LegalContent, [string, string]> = {
  ar: [
    '- تبقى الدعوة منشورة ٣٠ يوماً من تاريخ النشر، ثم تظهر للزوار رسالة بانتهاء الدعوة. يمكن تمديدها بالاتفاق معنا.',
    '- تبقى الدعوة منشورة طوال مدة الباقة (٣٠ يوماً أو ٦٠ يوماً أو سنة أو للأبد) من تاريخ النشر، ثم تظهر للزوار رسالة بانتهاء الدعوة. يمكن تمديدها بالاتفاق معنا.',
  ],
  en: [
    '- The invitation stays online for 30 days from publication; after that, visitors see a message that it has ended. It can be extended by arrangement with us.',
    "- The invitation stays online for its package's time from publication (30 days, 60 days, 1 year or forever); after that, visitors see a message that it has ended. It can be extended by arrangement with us.",
  ],
  ckb: [
    '- بانگهێشتنامەکە ٣٠ ڕۆژ لە بەرواری بڵاوکردنەوەوە بڵاو دەمێنێتەوە، پاشان پەیامێکی کۆتاییهاتنی بانگهێشتنامەکە بۆ سەردانکەران دەردەکەوێت. دەکرێت بە ڕێککەوتن لەگەڵمان درێژ بکرێتەوە.',
    '- بانگهێشتنامەکە بە درێژایی ماوەی پاکێجەکە (٣٠ ڕۆژ، ٦٠ ڕۆژ، ساڵێک یان بۆ هەمیشە) لە بەرواری بڵاوکردنەوەوە بڵاو دەمێنێتەوە، پاشان پەیامێکی کۆتاییهاتنی بانگهێشتنامەکە بۆ سەردانکەران دەردەکەوێت. دەکرێت بە ڕێککەوتن لەگەڵمان درێژ بکرێتەوە.',
  ],
  bdn: [
    '- داخوازنامە ٣٠ ڕۆژان ژ دیرۆکا بەلاڤکرنێ بەلاڤکری دمینیت، پاشان نامەیەک بۆ سەرەدانکەران دیار دبیت کو داخوازنامە ب دوماهی هاتیە. دبیت ب ڕێککەفتنێ دگەل مە بهێتە درێژکرن.',
    '- داخوازنامە ب درێژاهیا ماوێ پاکێجێ (٣٠ ڕۆژان، ٦٠ ڕۆژان، ساڵەکێ یان بۆ هەردەم) ژ دیرۆکا بەلاڤکرنێ بەلاڤکری دمینیت، پاشان نامەیەک بۆ سەرەدانکەران دیار دبیت کو داخوازنامە ب دوماهی هاتیە. دبیت ب ڕێککەفتنێ دگەل مە بهێتە درێژکرن.',
  ],
};

/** The content with the old online-time sentence replaced in every language; null when there is nothing to change. */
export function withPackageLifetimeLine(content: LegalContent): LegalContent | null {
  let changed = false;
  const next = { ...content };
  for (const lang of ['ar', 'en', 'ckb', 'bdn'] as const) {
    const text = next[lang];
    const [before, after] = LIFETIME_LINES[lang];
    if (text && text.includes(before)) {
      next[lang] = text.split(before).join(after);
      changed = true;
    }
  }
  return changed ? next : null;
}

/**
 * The terms (wedding and newborn) say each package has its own online time instead of "30 days" (owner request,
 * 2026-10-16). Runs with every seed and does something only while the exact original sentence is still there, so an
 * owner's own wording is never touched. A draft in progress gets the new sentence (the owner publishes it); otherwise a
 * new version with only that sentence changed is published, through the usual service (audited, as the system).
 */
export async function updateTermsLifetimeLine(db: DbOrTx) {
  const actor = { adminId: null, ipHash: null };
  for (const type of ['TERMS', 'TERMS_NEWBORN'] as const) {
    const { draft } = await policyAdminView(db, type);
    if (draft) {
      const next = withPackageLifetimeLine(draft.content);
      if (next) await saveDraft(db, type, next, actor);
      continue;
    }
    const current = await currentPolicy(db, type);
    const next = current && withPackageLifetimeLine(current.content);
    if (!next) continue;
    await saveDraft(db, type, next, actor);
    await publishDraft(db, type, actor);
  }
}


/**
 * Lines added to the published policies when customers could add their own song (or a video's sound) and photos
 * (owner request, 2026-10-19): who is responsible for them, our permission to use them, that we may remove them, and
 * how long they are kept. Each goes after (or before) an exact sentence or heading of the starter text, or at the end
 * when the owner reworded it. Kurdish is added only once the owner approves it (KURDISH_REVIEW.md batch 37): until
 * then that language is left as it is.
 */
type PolicyAddition = { after?: string; before?: string; text: string };
const UPLOAD_ADDITIONS: { types: PolicyType[]; lines: Record<keyof LegalContent, PolicyAddition | null> }[] = [
  {
    types: ['TERMS', 'TERMS_NEWBORN'],
    lines: {
      ar: {
        before: '## الملكية',
        text: `## الأغاني والفيديوهات والصور التي تضيفها
- إذا كانت باقتك تتيح إضافة أغنيتك الخاصة (أو فيديو نستخدم صوته) أو صورك الخاصة، فإنك تؤكد أنك تملكها أو لديك إذن باستخدامها في دعوتك، وأنك المسؤول عنها.
- تبقى ملكاً لك، وتمنحنا الإذن بحفظها وتحويلها وعرضها في دعوتك وملفاتها فقط. نقصّ الأغنية إلى دقيقتين، ولا نبيع ما ترفعه ولا نعيد استخدامه.
- لا ترفع ما لا يحق لك مشاركته، ولا أي محتوى مسيء أو مخالف للقانون. يحق لنا حذف أي أغنية أو صورة في أي وقت إذا خالفت ذلك أو اعترض عليها صاحب حقوقها، وتعود عندها أغنية التصميم، ولا يترتب على ذلك حق في استرداد المبلغ.
- إذا طالب أحد بهجه بشيء بسبب ما رفعته، فأنت المسؤول عن ذلك.
- تُحذف مع بقية بيانات دعوتك الشخصية (راجع سياسة الخصوصية).`,
      },
      en: {
        before: '## Ownership',
        text: `## Songs, videos and photos you add
- If your package lets you add your own song (or a video whose sound we use) or your own photos, you confirm that you own them or have permission to use them in your invitation, and that you are responsible for them.
- They stay yours. You allow us to store, convert and show them in your invitation and its files only. We cut a song to 2 minutes, and we never sell or reuse what you upload.
- Do not upload anything you have no right to share, or anything offensive or unlawful. We may remove any song or photo at any time if it breaks this rule or if its rights holder objects; the design's song then plays again, and this gives no right to a refund.
- If anyone makes a claim against Bahja because of something you uploaded, you are responsible for it.
- They are deleted with your invitation's other personal data (see the Privacy policy).`,
      },
      ckb: null,
      bdn: null,
    },
  },
  {
    types: ['PRIVACY'],
    lines: {
      ar: {
        after: '- من الضيوف (إذا كانت الميزة مفعّلة): الاسم، والحضور أو الاعتذار، ورسالة التهنئة.',
        text: '- إذا تضمنتها باقتك: الصور والأغنية (أو الفيديو) التي تضيفها. نحتفظ فقط بما تحتاجه الدعوة (صور بحجم مناسب وأغنية مقصوصة إلى دقيقتين) ونحذف بياناتها المخفية مثل الموقع.',
      },
      en: {
        after: '- From guests (when the feature is included): their name, whether they will attend, and their congratulation message.',
        text: '- If your package includes them: the photos and the song (or video) you add. We keep only what the invitation needs (photos at a suitable size, a song cut to 2 minutes) and remove their hidden details such as location.',
      },
      ckb: null,
      bdn: null,
    },
  },
  {
    types: ['PRIVACY'],
    lines: {
      ar: {
        after: '- ردود الضيوف وملف الذكرى: حتى ١٢ شهراً بعد انتهاء الدعوة.',
        text: '- صورك وأغنيتك الخاصة: حتى ١٢ شهراً بعد انتهاء الدعوة، وللطلبات التي لم تُدفع: ٣٠ يوماً بعد انتهاء رابط المعاينة.',
      },
      en: {
        after: '- Guest replies and the keepsake: up to 12 months after the invitation ends.',
        text: '- Your photos and your own song: up to 12 months after the invitation ends; for orders never paid, 30 days after the preview link expires.',
      },
      ckb: null,
      bdn: null,
    },
  },
];

/** The content with the upload lines added in every language that has them and doesn't yet; null when nothing changes. */
export function withUploadLines(type: PolicyType, content: LegalContent): LegalContent | null {
  let changed = false;
  const next = { ...content };
  for (const { types, lines } of UPLOAD_ADDITIONS) {
    if (!types.includes(type)) continue;
    for (const lang of ['ar', 'en', 'ckb', 'bdn'] as const) {
      const add = lines[lang];
      const text = next[lang];
      if (!add || !text || text.includes(add.text)) continue;
      if (add.after && text.includes(add.after)) next[lang] = text.replace(add.after, `${add.after}\n${add.text}`);
      else if (add.before && text.includes(add.before)) next[lang] = text.replace(add.before, `${add.text}\n\n${add.before}`);
      else next[lang] = `${text.trimEnd()}\n\n${add.text}`;
      changed = true;
    }
  }
  return changed ? next : null;
}

/**
 * Adds the upload lines (above) to the terms and the privacy policy. Runs with every seed and changes nothing once a
 * line is there, so it never repeats or touches the owner's own wording. A draft in progress gets the lines (the owner
 * publishes it); otherwise a new version with only these lines added is published, as the system (audited).
 */
export async function updatePoliciesForUploads(db: DbOrTx) {
  const actor = { adminId: null, ipHash: null };
  for (const type of ['TERMS', 'TERMS_NEWBORN', 'PRIVACY'] as const) {
    const { draft } = await policyAdminView(db, type);
    if (draft) {
      const next = withUploadLines(type, draft.content);
      if (next) await saveDraft(db, type, next, actor);
      continue;
    }
    const current = await currentPolicy(db, type);
    const next = current && withUploadLines(type, current.content);
    if (!next) continue;
    await saveDraft(db, type, next, actor);
    await publishDraft(db, type, actor);
  }
}
