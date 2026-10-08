# Kurdish translation review

> **2026-10-02: the owner approved every remaining row** in [`KURDISH_FULL_LIST.md`](./KURDISH_FULL_LIST.md) and the
> policy texts in [`KURDISH_POLICIES.md`](./KURDISH_POLICIES.md). Rows below still marked PENDING/AWAITING are
> history; they are all approved and live. New texts go through the same review before shipping.

**How to reply:** for each row, say **"approve"** or give your corrected wording (for Sorani, Badini,
or both). Nothing in the "Suggested" columns is live until you approve it; until then the Kurdish
pages show the Arabic text.

My confidence in each suggestion is marked: **●** fairly confident · **◐** please check carefully ·
**○** unsure (likely needs your wording).

## Batch 1 — ✅ APPROVED (2026-09-30)

Final wording as shipped. Rows the owner didn't correct were accepted as suggested. The brand is
written **بەهجە** in both Kurdish dialects (owner decision), so it was also applied to the footer line.

| # | Key | English | Sorani (ckb) | Badini (bdn) | Status |
|---|---|---|---|---|---|
| 1 | *(language switcher)* | Kurdish – Sorani / Badini | کوردی - سۆرانی | کوردی - بادینی | APPROVED |
| 2 | `common.brand` | Bahja | بەهجە | بەهجە | APPROVED (owner) |
| 3 | `common.language` | Language | زمان | زمان | APPROVED |
| 4 | `common.skipToContent` | Skip to content | پەرینەوە بۆ ناوەروک | چوون بو ناڤەروکێ | APPROVED (owner) |
| 5 | `home.preparingTitle` | The website is being prepared | ماڵپەرەکە ئامادە دەکرێت | مالپەر یێ دهێتە ئامادەکرن | APPROVED (owner) |
| 6 | `home.preparingBody` | Soon: carefully designed digital invitations for your occasions. | بەم زووانە: بانگهێشتنامەی دیجیتاڵی بە وردی دیزاینکراو بۆ بۆنەکانتان. | ب زیترین دەم: داخوازنامێن دیجیتالی یێن ب هووری هاتینە دیزاینکرن بۆ ئاهەنگێن هەوە. | APPROVED (Badini by owner) |
| 7 | `footer.rights` | © {year} Bahja. All rights reserved. | © {year} بەهجە. هەموو مافەکان پارێزراون. | © {year} بەهجە. هەمی ماف د پاراستینە. | APPROVED |
| 8 | `errors.notFoundTitle` | Page not found | پەرەکە نەدۆزرایەوە | لاپەر نەهاتە دیتن | APPROVED (owner) |
| 9 | `errors.notFoundBody` | The link may have changed or is no longer available. | لەوانەیە بەستەرەکە گۆڕابێت یان چیتر بەردەست نەبێت. | بەلکی لینک هاتبیتە گوهۆڕین یان ئێدی بەردەست نەبیت. | APPROVED |
| 10 | `errors.backHome` | Back to home | گەڕانەوە بۆ سەرەکی | زڤڕین بۆ لاپەرێ سەرەکی | APPROVED (Badini by owner) |
| 11 | `errors.genericTitle` | Something went wrong | هەڵەیەکی چاوەڕواننەکراو ڕوویدا | خەلەتیەکا نەچاڤەڕێکری چێبوو | APPROVED |
| 12 | `errors.tryAgain` | Try again | دووبارە هەوڵ بدەوە | دووبارە هەول بدە | APPROVED |

Glossary established by the owner (reuse in later batches):
- Brand: **بەهجە** (both dialects); Arabic **بهجه**.
- Badini "page": **لاپەر**; "occasions/celebrations": **ئاهەنگ**; "soon": **ب زیترین دەم**.
- Sorani "website": **ماڵپەر**; "page": **پەرە**.

## Batch 2 — currency switcher — ✅ APPROVED (2026-09-30)

Shown next to the language choice once you set an exchange rate in Admin → Website settings.

| # | Key | Arabic | English | Suggested Sorani (ckb) | Suggested Badini (bdn) | Conf. | Status |
|---|---|---|---|---|---|---|---|
| 13 | `common.currency` | العملة | Currency | دراو | دراڤ | ◐ | APPROVED (owner, 2026-09-30) |
| 14 | `common.currencyIqd` | دينار | IQD | دینار | دینار | ● | APPROVED (owner, 2026-09-30) |
| 15 | `common.currencyUsd` | دولار | USD | دۆلار | دۆلار | ● | APPROVED (owner, 2026-09-30) |
| 16 | `common.usdApproxNote` | الأسعار بالدولار تقريبية حسب سعر الصرف؛ يتم الدفع بالدينار العراقي. | USD prices are approximate at our exchange rate; payment is made in Iraqi dinars. | نرخەکان بە دۆلار نزیکەیین بەپێی نرخی ئاڵوگۆڕ؛ پارەدان بە دیناری عێراقی دەکرێت. | بهایێن ب دۆلاری نێزیکن ل دویڤ بهایێ گوهۆڕینێ؛ پارەدان ب دینارێ عیراقی دهێتە کرن. | ○ | APPROVED (owner, 2026-09-30) |

## Batch 3 — text inside invitations — ✅ APPROVED (2026-09-30)

Guests see these inside every theme when the invitation is in Kurdish. Until approved, Kurdish
invitations show the Arabic text.

| # | Key | Arabic | English | Suggested Sorani (ckb) | Suggested Badini (bdn) | Conf. | Status |
|---|---|---|---|---|---|---|---|
| 17 | `invitation.openInvitation` | افتح الدعوة | Open invitation | کردنەوەی بانگهێشتنامە | ڤەکرنا داخوازنامێ | ◐ | APPROVED (owner, 2026-09-30) |
| 18 | `invitation.musicPlay` | تشغيل الموسيقى | Play music | لێدانی مۆسیقا | لێدانا مۆزیکێ | ○ | APPROVED (owner, 2026-09-30) |
| 19 | `invitation.musicPause` | إيقاف الموسيقى | Pause music | وەستاندنی مۆسیقا | راوەستاندنا مۆزیکێ | ○ | APPROVED (owner, 2026-09-30) |
| 20 | `invitation.countdownDays` | يوم | days | ڕۆژ | ڕۆژ | ● | APPROVED (owner, 2026-09-30) |
| 21 | `invitation.countdownHours` | ساعة | hours | کاتژمێر | دەمژمێر | ◐ | APPROVED (owner, 2026-09-30) |
| 22 | `invitation.countdownMinutes` | دقيقة | minutes | خولەک | خولەک | ● | APPROVED (owner, 2026-09-30) |
| 23 | `invitation.countdownSeconds` | ثانية | seconds | چرکە | چرکە | ● | APPROVED (owner, 2026-09-30) |
| 24 | `invitation.eventStarted` | بدأت المناسبة | The celebration has begun | بۆنەکە دەستی پێکرد | ئاهەنگ دەست پێکر | ◐ | APPROVED (owner, 2026-09-30) |
| 25 | `invitation.openMap` | الموقع على الخريطة | Open in maps | شوێن لەسەر نەخشە | جهـ ل سەر نەخشەی | ◐ | APPROVED (owner, 2026-09-30) |
| 26 | `invitation.date` | التاريخ | Date | ڕێکەوت | دیرۆک | ◐ | APPROVED (owner, 2026-09-30) |
| 27 | `invitation.time` | الوقت | Time | کات | دەم | ◐ | APPROVED (owner, 2026-09-30) |
| 28 | `invitation.venue` | المكان | Venue | شوێن | جهـ | ◐ | APPROVED (owner, 2026-09-30) |
| 29 | `invitation.guestFormTitle` | تأكيد الحضور | Will you attend? | دڵنیاکردنەوەی ئامادەبوون | پشتڕاستکرنا ئامادەبوونێ | ◐ | APPROVED (owner, 2026-09-30) |
| 30 | `invitation.guestName` | الاسم | Your name | ناو | ناڤ | ● | APPROVED (owner, 2026-09-30) |
| 31 | `invitation.attendanceQuestion` | هل ستحضر؟ | Will you attend? | ئامادە دەبیت؟ | دێ ئامادە بی؟ | ◐ | APPROVED (owner, 2026-09-30) |
| 32 | `invitation.attending` | سأحضر | I'll attend | ئامادە دەبم | دێ ئامادە بم | ◐ | APPROVED (owner, 2026-09-30) |
| 33 | `invitation.notAttending` | لن أتمكن من الحضور | I can't attend | ناتوانم ئامادە بم | نەشێم ئامادە بم | ◐ | APPROVED (owner, 2026-09-30) |
| 34 | `invitation.message` | رسالة تهنئة | Congratulation message | نامەی پیرۆزبایی | نامەیا پیرۆزباهیێ | ◐ | APPROVED (owner, 2026-09-30) |
| 35 | `invitation.submit` | إرسال | Send | ناردن | هنارتن | ◐ | APPROVED (owner, 2026-09-30) |
| 36 | `invitation.sending` | جارٍ الإرسال… | Sending… | دەنێردرێت… | دهێتە هنارتن… | ◐ | APPROVED (owner, 2026-09-30) |
| 37 | `invitation.sent` | شكراً، تم إرسال ردّك. | Thank you, your response was sent. | سوپاس، وەڵامەکەت نێردرا. | سوپاس، بەرسڤا تە هاتە هنارتن. | ◐ | APPROVED (owner, 2026-09-30) |
| 38 | `invitation.sentPreview` | هذه معاينة، لذلك لم يُحفظ الرد. | This is a preview, so the response was not saved. | ئەمە پێشبینینە، بۆیە وەڵامەکە پاشەکەوت نەکرا. | ئەڤە پێشدیتنە، لەوما بەرسڤ نەهاتە پاراستن. | ○ | APPROVED (owner, 2026-09-30) |
| 39 | `invitation.errorRequired` | هذا الحقل مطلوب. | This field is required. | ئەم خانەیە پێویستە. | ئەڤ خانە پێدڤییە. | ◐ | APPROVED (owner, 2026-09-30) |
| 40 | `invitation.errorTooLong` | النص أطول من المسموح. | This text is too long. | دەقەکە لە ڕادەبەدەر درێژە. | نڤیسین ژ پێدڤی درێژترە. | ○ | APPROVED (owner, 2026-09-30) |
| 41 | `invitation.errorGeneric` | تعذّر الإرسال. حاول مرة أخرى. | Couldn't send. Please try again. | ناردن سەرکەوتوو نەبوو. دووبارە هەوڵ بدەوە. | هنارتن سەرنەکەفت. دووبارە هەول بدە. | ◐ | APPROVED (owner, 2026-09-30) |
| 42 | `invitation.previewRibbon` | معاينة | Preview | پێشبینین | پێشدیتن | ◐ | APPROVED (owner, 2026-09-30) |
| 43 | `invitation.sampleRibbon` | نموذج للعرض | Sample | نموونە | نموونە | ◐ | APPROVED (owner, 2026-09-30) |
| 44 | `invitation.renderError` | تعذّر عرض الدعوة حالياً. | The invitation can't be shown right now. | ئێستا ناتوانرێت بانگهێشتنامەکە پیشان بدرێت. | نوکە نەشێین داخوازنامێ نیشان بدەین. | ○ | APPROVED (owner, 2026-09-30) |
| 45 | `invitation.retry` | إعادة المحاولة | Try again | دووبارە هەوڵدانەوە | دووبارە هەول بدە | ◐ | APPROVED (owner, 2026-09-30) |

### Batch 3b — Badini calendar names (Badini only)

Sorani dates use the phone's built-in calendar data (for example "پێنجشەممە، ١٢ تشرینی دووەم ٢٠٢٦"),
so they need no translation. Badini has no built-in calendar data, so its month and weekday names come
from here. Please tell me which month names people in Duhok use on invitations: these Kurdish names,
or the Arabic-style ones.

| Key | Arabic | Suggested Badini | Conf. | Status |
|---|---|---|---|---|
| `invitation.months.m1` | كانون الثاني | کانوونا دووێ | ● | APPROVED (owner, 2026-09-30) |
| `invitation.months.m2` | شباط | شوبات | ● | APPROVED (owner, 2026-09-30) |
| `invitation.months.m3` | آذار | ئادار | ● | APPROVED (owner, 2026-09-30) |
| `invitation.months.m4` | نيسان | نیسان | ● | APPROVED (owner, 2026-09-30) |
| `invitation.months.m5` | أيار | گولان | ● | APPROVED (owner, 2026-09-30) |
| `invitation.months.m6` | حزيران | حزیران | ● | APPROVED (owner, 2026-09-30) |
| `invitation.months.m7` | تموز | تیرمەه | ● | APPROVED (owner, 2026-09-30) |
| `invitation.months.m8` | آب | تەباخ | ● | APPROVED (owner, 2026-09-30) |
| `invitation.months.m9` | أيلول | ئیلون | ● | APPROVED (owner, 2026-09-30) |
| `invitation.months.m10` | تشرين الأول | چریا ئێکێ | ● | APPROVED (owner, 2026-09-30) |
| `invitation.months.m11` | تشرين الثاني | چریا دووێ | ● | APPROVED (owner, 2026-09-30) |
| `invitation.months.m12` | كانون الأول | کانوونا ئێکێ | ● | APPROVED (owner, 2026-09-30) |
| `invitation.weekdays.d0` | الأحد | ئێک شەمب | ● | APPROVED (owner, 2026-09-30) |
| `invitation.weekdays.d1` | الاثنين | دوو شەمب | ● | APPROVED (owner, 2026-09-30) |
| `invitation.weekdays.d2` | الثلاثاء | سێ شەمب | ● | APPROVED (owner, 2026-09-30) |
| `invitation.weekdays.d3` | الأربعاء | چوار شەمب | ● | APPROVED (owner, 2026-09-30) |
| `invitation.weekdays.d4` | الخميس | پێنج شەمب | ● | APPROVED (owner, 2026-09-30) |
| `invitation.weekdays.d5` | الجمعة | خودبە | ● | APPROVED (owner, 2026-09-30) |
| `invitation.weekdays.d6` | السبت | شەمبی | ● | APPROVED (owner, 2026-09-30) |
| `invitation.am` | ص | ب.ن | ○ | APPROVED (owner, 2026-09-30) |
| `invitation.pm` | م | پ.ن | ○ | APPROVED (owner, 2026-09-30) |

### Batch 3c — sample names/text for theme previews

The storefront shows each theme filled with sample content in the visitor's language. For Kurdish, please
send sample names you like, for example a short pair (like ئازاد & ژیان) and a long pair, plus a family line,
a hall name and a short and a long invitation sentence. Until then the Arabic samples are shown.

## Batch 4 — preview expiry and the customer's receipt page — ✅ APPROVED (2026-09-30)

`{url}`, `{invoice}`, `{expires}` are filled in automatically; `\n` is a line break.

| Key | Arabic | English | Suggested Sorani (ckb) | Suggested Badini (bdn) | Conf. | Status |
|---|---|---|---|---|---|---|
| `invitation.previewExpired` | انتهت صلاحية رابط المعاينة. ارجعوا إلى صفحة الطلب لإنشاء معاينة جديدة. | This preview link has expired. Go back to your order to create a new preview. | بەستەری پێشبینین بەسەرچووە. بگەڕێنەوە بۆ داواکارییەکەتان بۆ دروستکردنی پێشبینینێکی نوێ. | لینکا پێشدیتنێ ب دوماهی هات. بزڤڕن بۆ داخوازیا خۆ بۆ چێکرنا پێشدیتنەکا نوو. | ○ | APPROVED (owner, 2026-09-30) |
| `receipt.title` | إيصال الطلب | Order receipt | پسوولەی داواکاری | پسوولا داخوازیێ | ◐ | APPROVED (owner, 2026-09-30) |
| `receipt.paidTitle` | تم الدفع بنجاح | Payment received | پارەدان بە سەرکەوتوویی ئەنجامدرا | پارەدان ب سەرکەفتیانە هاتە کرن | ◐ | APPROVED (owner, 2026-09-30) |
| `receipt.pendingTitle` | بانتظار الدفع | Awaiting payment | چاوەڕوانی پارەدان | ل هیڤیا پارەدانێ | ◐ | APPROVED (owner, 2026-09-30) |
| `receipt.orderNumber` | رقم الطلب | Order number | ژمارەی داواکاری | ژمارا داخوازیێ | ◐ | APPROVED (owner, 2026-09-30) |
| `receipt.invoiceNumber` | رقم الفاتورة | Invoice number | ژمارەی پسوولە | ژمارا پسوولێ | ◐ | APPROVED (owner, 2026-09-30) |
| `receipt.status` | الحالة | Status | دۆخ | رەوش | ◐ | APPROVED (owner, 2026-09-30) |
| `receipt.customer` | العميل | Customer | کڕیار | کڕیار | ◐ | APPROVED (owner, 2026-09-30) |
| `receipt.phone` | الهاتف | Phone | تەلەفۆن | تەلەفۆن | ● | APPROVED (owner, 2026-09-30) |
| `receipt.email` | البريد الإلكتروني | Email | ئیمەیڵ | ئیمەیل | ● | APPROVED (owner, 2026-09-30) |
| `receipt.theme` | التصميم | Theme | دیزاین | دیزاین | ◐ | APPROVED (owner, 2026-09-30) |
| `receipt.package` | الباقة | Package | پاکێج | پاکێج | ◐ | APPROVED (owner, 2026-09-30) |
| `receipt.amount` | المبلغ | Amount | بڕی پارە | بڕێ پارەی | ◐ | APPROVED (owner, 2026-09-30) |
| `receipt.amountNote` | جميع المدفوعات بالدينار العراقي. | All payments are in Iraqi dinars. | هەموو پارەدانەکان بە دیناری عێراقین. | هەمی پارەدان ب دینارێ عیراقینە. | ◐ | APPROVED (owner, 2026-09-30) |
| `receipt.purchaseDate` | تاريخ الطلب | Order date | بەرواری داواکاری | دیرۆکا داخوازیێ | ◐ | APPROVED (owner, 2026-09-30) |
| `receipt.paidDate` | تاريخ الدفع | Payment date | بەرواری پارەدان | دیرۆکا پارەدانێ | ◐ | APPROVED (owner, 2026-09-30) |
| `receipt.publishedAt` | تاريخ النشر | Published on | بەرواری بڵاوکردنەوە | دیرۆکا بەلاڤکرنێ | ◐ | APPROVED (owner, 2026-09-30) |
| `receipt.expiresAt` | متاحة حتى | Available until | بەردەستە تا | بەردەستە هەتا | ◐ | APPROVED (owner, 2026-09-30) |
| `receipt.invitationLink` | رابط دعوتكم | Your invitation link | بەستەری بانگهێشتنامەکەتان | لینکا داخوازناما هەوە | ◐ | APPROVED (owner, 2026-09-30) |
| `receipt.copyLink` | نسخ الرابط | Copy link | کۆپیکردنی بەستەر | کۆپیکرنا لینکێ | ◐ | APPROVED (owner, 2026-09-30) |
| `receipt.copied` | تم النسخ | Copied | کۆپی کرا | هاتە کۆپیکرن | ◐ | APPROVED (owner, 2026-09-30) |
| `receipt.shareWhatsApp` | مشاركة الدعوة على واتساب | Share the invitation on WhatsApp | هاوبەشکردنی بانگهێشتنامە لە واتسئاپ | پارڤەکرنا داخوازنامێ ل واتسئاپێ | ◐ | APPROVED (owner, 2026-09-30) |
| `receipt.saveWhatsApp` | حفظ التأكيد على واتساب | Save the confirmation on WhatsApp | پاشەکەوتکردنی پشتڕاستکردنەوە لە واتسئاپ | پاراستنا پشتڕاستکرنێ ل واتسئاپێ | ○ | APPROVED (owner, 2026-09-30) |
| `receipt.openInvitation` | فتح الدعوة | Open invitation | کردنەوەی بانگهێشتنامە | ڤەکرنا داخوازنامێ | ◐ | APPROVED (owner, 2026-09-30) |
| `receipt.print` | طباعة الإيصال | Print receipt | چاپکردنی پسوولە | چاپکرنا پسوولێ | ◐ | APPROVED (owner, 2026-09-30) |
| `receipt.corrections` | تحتاجون تصحيحاً في الدعوة؟ تواصلوا معنا وسنعدّلها لكم. | Need a correction in your invitation? Contact us and we'll fix it for you. | پێویستتان بە ڕاستکردنەوە هەیە لە بانگهێشتنامەکەدا؟ پەیوەندیمان پێوە بکەن و بۆتان ڕاستی دەکەینەوە. | پێدڤی ب راستکرنێ د داخوازنامێ دا هەیە؟ پەیوەندیێ ب مە بکەن و دێ بۆ هەوە راست کەین. | ○ | APPROVED (owner, 2026-09-30) |
| `receipt.keepLink` | احتفظوا برابط هذه الصفحة؛ فهو خاص بكم ويعرض إيصالكم في أي وقت. | Keep this page's link; it is private to you and shows your receipt any time. | بەستەری ئەم پەڕەیە پاشەکەوت بکەن؛ تایبەتە بە ئێوە و هەر کاتێک پسوولەکەتان پیشان دەدات. | لینکا ڤێ لاپەرێ بپارێزن؛ تایبەتە ب هەوە و هەر دەمەکێ پسوولا هەوە نیشان ددەت. | ○ | APPROVED (owner, 2026-09-30) |
| `receipt.shareText` | يسعدنا دعوتكم: {url} | You're invited: {url} | بانگهێشتن کراون: {url} | هوین داخوازکرینە: {url} | ○ | APPROVED (owner, 2026-09-30) |
| `receipt.confirmText` | تأكيد طلب بهجه\nرقم الفاتورة: {invoice}\nرابط الدعوة: {url}\nمتاحة حتى: {expires} | Bahja order confirmation\nInvoice: {invoice}\nInvitation link: {url}\nAvailable until: {expires} | پشتڕاستکردنەوەی داواکاری بەهجە\nژمارەی پسوولە: {invoice}\nبەستەری بانگهێشتنامە: {url}\nبەردەستە تا: {expires} | پشتڕاستکرنا داخوازیا بەهجە\nژمارا پسوولێ: {invoice}\nلینکا داخوازنامێ: {url}\nبەردەستە هەتا: {expires} | ○ | APPROVED (owner, 2026-09-30) |
| `receipt.notFound` | هذا الرابط غير صالح. | This link is not valid. | ئەم بەستەرە دروست نییە. | ئەڤ لینکە نە دروستە. | ◐ | APPROVED (owner, 2026-09-30) |
| `receipt.notPublishedYet` | ستظهر دعوتكم هنا فور تأكيد الدفع. | Your invitation will appear here as soon as payment is confirmed. | بانگهێشتنامەکەتان لێرە دەردەکەوێت هەر کە پارەدان پشتڕاست کرایەوە. | داخوازناما هەوە دێ ل ڤێرە دیار بیت هەر کو پارەدان هاتە پشتڕاستکرن. | ○ | APPROVED (owner, 2026-09-30) |
| `receipt.statuses.*` | بانتظار الدفع · مدفوع · ملغى · انتهت مهلة الدفع · مسترد | Awaiting payment · Paid · Cancelled · Payment window expired · Refunded | چاوەڕوانی پارەدان · پارەدراو · هەڵوەشێنراوە · کاتی پارەدان بەسەرچوو · گەڕێنراوەتەوە | ل هیڤیا پارەدانێ · پارە هاتیە دان · هاتیە هەلوەشاندن · دەمێ پارەدانێ ب دوماهی هات · هاتیە زڤڕاندن | ○ | APPROVED (owner, 2026-09-30) |

## Batch 5 — storefront navigation and homepage — ✅ APPROVED (2026-09-30, rows marked PENDING still need wording)

The homepage replaces the old "website is being prepared" page, so the approved `home.preparing*`
wording (batch 1, rows 5–6) is no longer shown.

| Key | Arabic | English | Suggested Sorani (ckb) | Suggested Badini (bdn) | Conf. | Status |
|---|---|---|---|---|---|---|
| `nav.home` | الرئيسية | Home | سەرەکی | سەرەکی | ● | APPROVED (owner, 2026-09-30) |
| `nav.themes` | التصاميم | Themes | دیزاینەکان | دیزاین | ◐ | APPROVED (owner, 2026-09-30) |
| `nav.occasions` | المناسبات | Occasions | بۆنەکان | بۆنە | ◐ | APPROVED (owner, 2026-09-30) |
| `nav.how` | كيف تعمل | How it works | چۆن کار دەکات | چاوا کار دکەت | ◐ | APPROVED (owner, 2026-09-30) |
| `nav.contact` | تواصل معنا | Contact us | پەیوەندیمان پێوە بکە | پەیوەندیێ ب مە بکە | ◐ | APPROVED (owner, 2026-09-30) |
| `nav.menu` | القائمة | Menu | لیست | لیست | ◐ | APPROVED (owner, 2026-09-30) |
| `nav.close` | إغلاق | Close | داخستن | گرتن | ◐ | APPROVED (owner, 2026-09-30) |
| `footer.tagline` | دعوات رقمية مختارة بعناية. | Carefully curated digital invitations. | بانگهێشتنامەی دیجیتاڵی بە وردی هەڵبژێردراو. | داخوازنامێن دیجیتالی یێن ب هووری هاتینە هەلبژارتن. | ◐ | APPROVED (owner, 2026-09-30) |
| `home.heroLine1` | دعوات صُممت | Invitations designed | بانگهێشتنامە دیزاینکراون | داخوازنامە هاتینە دیزاینکرن | ○ | APPROVED (owner, 2026-09-30) |
| `home.heroLine2` | للحظات لا تُنسى. | for unforgettable moments. | بۆ ساتە لەبیرنەکراوەکان. | بۆ دەمێن ژبیرنەبوونی. | ○ | APPROVED (owner, 2026-09-30) |
| `home.heroSubtitle` | تصاميم استثنائية لكل مناسبة. | Exceptional designs for every occasion. | دیزاینی نایاب بۆ هەموو بۆنەیەک. | دیزاینێن ناوازە بۆ هەمی بۆنان. | ◐ | APPROVED (owner, 2026-09-30) |
| `home.browse` | تصفّح التصاميم | Browse designs | سەیرکردنی دیزاینەکان | دیتنا دیزاینان | ◐ | APPROVED (owner, 2026-09-30) |
| `home.occasionsTitle` | اختر مناسبتك | Choose your occasion | بۆنەکەت هەڵبژێرە | بۆنا خۆ هەلبژێرە | ◐ | APPROVED (owner, 2026-09-30) |
| `home.themesTitle` | تصاميم مختارة | Featured designs | دیزاینە هەڵبژێردراوەکان | دیزاینێن هەلبژارتی | ◐ | APPROVED (owner, 2026-09-30) |
| `home.themesSubtitle` | كل تصميم مرسوم ومتحرك بعناية. اسحبوا لتتصفحوا المزيد. | Every design is drawn and animated with care. Swipe to see more. | هەر دیزاینێک بە وردی کێشراوە و جووڵەی پێدراوە. ڕایبکێشن بۆ بینینی زیاتر. | هەر دیزاینەک ب هووری هاتیە کێشان و لڤاندن. بکێشن بۆ دیتنا پتر. | ○ | APPROVED (owner, 2026-09-30) |
| `home.allThemes` | كل التصاميم | All designs | هەموو دیزاینەکان | هەمی دیزاین | ● | APPROVED (owner, 2026-09-30) |
| `home.prev` / `home.next` | السابق / التالي | Previous / Next | پێشوو / دواتر | بەری / پاشی | ◐ | APPROVED (owner, 2026-09-30) |
| `home.preview` | معاينة | Preview | پێشبینین | پێشدیتن | ◐ | APPROVED (owner, 2026-09-30) |
| `home.choose` | اختيار | Choose | هەڵبژاردن | هەلبژارتن | ● | APPROVED (owner, 2026-09-30) |
| `home.from` | يبدأ من | From | لە | ژ | ◐ | APPROVED (owner, 2026-09-30) |
| `home.noThemes` | التصاميم الأولى في الطريق، تابعونا قريباً. | Our first designs are on their way. See you soon. | یەکەم دیزاینەکانمان لە ڕێگان، بەم زووانە. | دیزاینێن مە یێن ئێکێ ل ڕێکێنە، ب زیترین دەم. | ○ | APPROVED (owner, 2026-09-30) |
| `home.howTitle` | كيف تعمل؟ | How it works | چۆن کار دەکات؟ | چاوا کار دکەت؟ | ◐ | APPROVED (owner, 2026-09-30) |
| `home.step1Title` | اختاروا تصميمكم | Choose your design | دیزاینەکەتان هەڵبژێرن | دیزاینێ خۆ هەلبژێرن | ◐ | APPROVED (owner, 2026-09-30) |
| `home.step1Body` | تصميم يشبهكم، وباقة تناسب مناسبتكم. | A design that feels like you, and a package that fits your occasion. | دیزاینێک لە ئێوە بچێت، و پاکێجێک گونجاو بۆ بۆنەکەتان. | دیزاینەک وەکی هەوە، و پاکێجەک گونجای بۆ بۆنا هەوە. | ○ | APPROVED (owner, 2026-09-30) |
| `home.step2Title` | اكتبوا تفاصيلكم | Add your details | وردەکارییەکانتان بنووسن | هوورگیێن خۆ بنڤیسن | ◐ | APPROVED (owner, 2026-09-30) |
| `home.step2Body` | الأسماء والتاريخ والمكان، وشاهدوا دعوتكم كاملة قبل الدفع. | Names, date and venue, and see your complete invitation before paying. | ناو و بەروار و شوێن، و بانگهێشتنامەکەتان بە تەواوی ببینن پێش پارەدان. | ناڤ و دیرۆک و جه، و داخوازناما خۆ ب تەمامی ببینن بەری پارەدانێ. | ○ | APPROVED (owner, 2026-09-30) |
| `home.step3Title` | شاركوا الرابط | Share the link | بەستەرەکە هاوبەش بکەن | لینکێ پارڤە بکەن | ◐ | APPROVED (owner, 2026-09-30) |
| `home.step3Body` | بعد الدفع تُنشر الدعوة فوراً، وترسلونها على واتساب. | After payment your invitation goes live instantly; send it on WhatsApp. | دوای پارەدان بانگهێشتنامەکە یەکسەر بڵاو دەکرێتەوە، و لە واتسئاپ بینێرن. | پشتی پارەدانێ داخوازنامە دەستبەجێ دێ هێتە بەلاڤکرن، و ل واتسئاپێ بفرێکەن. | ○ | APPROVED (owner, 2026-09-30) |
| `home.featuresTitle` | دعوة واحدة فيها كل شيء | One invitation, everything in it | یەک بانگهێشتنامە، هەموو شتێکی تێدایە | ئێک داخوازنامە، هەمی تشت تێدا | ○ | APPROVED (owner, 2026-09-30) |
| `home.sampleMessage` | يسعدنا حضوركم فرحتنا | We'd love you to celebrate with us | خۆشحاڵ دەبین بە ئامادەبوونتان لە خۆشیمان | دێ دلخۆش بین ب ئامادەبوونا هەوە د شاهیا مە دا | ○ | APPROVED (owner, 2026-09-30) |
| `home.featureMusic` | موسيقى تبدأ مع فتح الدعوة | Music that starts when it opens | مۆسیقا لەگەڵ کردنەوەی بانگهێشتنامە دەست پێدەکات | مۆسیقا دگەل ڤەکرنا داخوازنامێ دەست پێدکەت | ◐ | APPROVED (owner, 2026-09-30) |
| `home.featureRsvp` | تأكيد حضور ورسائل تهنئة | RSVPs and congratulation messages | پشتڕاستکردنەوەی ئامادەبوون و نامەی پیرۆزبایی | پشتڕاستکرنا ئامادەبوونێ و نامێن پیرۆزباهیێ | ◐ | APPROVED (owner, 2026-09-30) |
| `home.featurePrint` | بطاقة دعوة جاهزة للطباعة | A print-ready invitation card | کارتی بانگهێشتی ئامادە بۆ چاپ | کارتا داخوازیێ ئامادە بۆ چاپێ | ◐ | APPROVED (owner, 2026-09-30) |
| `home.featureDays` | متاحة ٣٠ يوماً من النشر | Live for 30 days after publishing | ٣٠ ڕۆژ دوای بڵاوکردنەوە بەردەستە | ٣٠ ڕۆژان پشتی بەلاڤکرنێ بەردەستە | ◐ | APPROVED (owner, 2026-09-30) |
| `home.faqTitle` | أسئلة شائعة | Frequently asked questions | پرسیارە باوەکان | پسیارێن بەربەلاڤ | ◐ | APPROVED (owner, 2026-09-30) |
| `home.faq1q`–`faq4a` | (see `ar.json`) | (see `en.json`) | I'll suggest these once the wording above is settled. | | | PENDING |
| `home.ctaTitle` | جاهزون لدعوتكم؟ | Ready for your invitation? | ئامادەن بۆ بانگهێشتنامەکەتان؟ | ئامادەنە بۆ داخوازناما خۆ؟ | ○ | APPROVED (owner, 2026-09-30) |
| `home.ctaButton` | ابدأوا الآن | Get started | ئێستا دەست پێبکەن | نوکە دەست پێبکەن | ◐ | APPROVED (owner, 2026-09-30) |
| `home.and` | و | & | و | و | ● | APPROVED (owner, 2026-09-30) |
| `home.cards.*` | Sample names on the hero cards | | Please give Kurdish sample names (see batch 3c). | | | PENDING |

## Batch 6 — catalog, theme page and ordering — ✅ APPROVED (2026-09-30, rows marked PENDING still need wording)

All keys are under `store.*` in `src/i18n/messages/ar.json` / `en.json`. The main labels are below.
Once you have settled the wording in batch 5, I'll suggest the longer sentences (hints, errors, notes).

| Key | Arabic | English | Suggested Sorani (ckb) | Suggested Badini (bdn) | Conf. | Status |
|---|---|---|---|---|---|---|
| `store.catalogTitle` | كل التصاميم | All designs | هەموو دیزاینەکان | هەمی دیزاین | ● | APPROVED (owner, 2026-09-30) |
| `store.all` | الكل | All | هەموو | هەمی | ● | APPROVED (owner, 2026-09-30) |
| `store.livePreview` | معاينة حيّة | Live preview | پێشبینینی ڕاستەوخۆ | پێشدیتنا ڕاستەوخۆ | ◐ | APPROVED (owner, 2026-09-30) |
| `store.shortNames` / `longNames` | أسماء قصيرة / طويلة | Short / Long names | ناوی کورت / درێژ | ناڤێن کورت / درێژ | ◐ | APPROVED (owner, 2026-09-30) |
| `store.openFull` | فتح بملء الشاشة | Open full screen | کردنەوە بە پڕی شاشە | ڤەکرن ب تژیا شاشێ | ○ | APPROVED (owner, 2026-09-30) |
| `store.packagesTitle` | اختر باقتك | Choose your package | پاکێجەکەت هەڵبژێرە | پاکێجا خۆ هەلبژێرە | ◐ | APPROVED (owner, 2026-09-30) |
| `store.includes` | تشمل | Includes | لەخۆدەگرێت | تێدایە | ◐ | APPROVED (owner, 2026-09-30) |
| `store.choose` | اختر هذه الباقة | Choose this package | ئەم پاکێجە هەڵبژێرە | ڤێ پاکێجێ هەلبژێرە | ◐ | APPROVED (owner, 2026-09-30) |
| `store.orderTitle` | تفاصيل دعوتك | Your invitation details | وردەکارییەکانی بانگهێشتنامەکەت | هوورگیێن داخوازناما تە | ○ | APPROVED (owner, 2026-09-30) |
| `store.stepDetails` / `stepReview` / `stepPay` | التفاصيل / المراجعة / الدفع | Details / Review / Payment | وردەکاری / پێداچوونەوە / پارەدان | هوورگی / پێداچوون / پارەدان | ◐ | APPROVED (owner, 2026-09-30) |
| `store.packageLabel` | الباقة | Package | پاکێج | پاکێج | ◐ | APPROVED (owner, 2026-09-30) |
| `store.languageLabel` | لغة الدعوة | Invitation language | زمانی بانگهێشتنامە | زمانێ داخوازنامێ | ◐ | APPROVED (owner, 2026-09-30) |
| `store.continue` | اعرض المعاينة | See my preview | پێشبینینەکەم پیشان بدە | پێشدیتنا من نیشان بدە | ○ | APPROVED (owner, 2026-09-30) |
| `store.reviewTitle` | راجع دعوتك | Review your invitation | پێداچوونەوە بە بانگهێشتنامەکەتدا بکە | پێداچوونێ ب داخوازناما خۆ دا بکە | ○ | APPROVED (owner, 2026-09-30) |
| `store.edit` | تعديل التفاصيل | Edit details | دەستکاریکردنی وردەکارییەکان | گوهۆڕینا هوورگیان | ○ | APPROVED (owner, 2026-09-30) |
| `store.contactTitle` | بيانات التواصل | Your contact details | زانیاری پەیوەندی | زانیاریێن پەیوەندیێ | ◐ | APPROVED (owner, 2026-09-30) |
| `store.name` / `phone` / `email` | الاسم الكامل / رقم الهاتف / البريد الإلكتروني | Full name / Phone number / Email | ناوی تەواو / ژمارەی تەلەفۆن / ئیمەیڵ | ناڤێ تەمام / ژمارا تەلەفۆنێ / ئیمەیل | ◐ | APPROVED (owner, 2026-09-30) |
| `store.total` | المجموع | Total | کۆی گشتی | کۆم | ◐ | APPROVED (owner, 2026-09-30) |
| `store.placeOrder` | تأكيد الطلب | Confirm order | پشتڕاستکردنەوەی داواکاری | پشتڕاستکرنا داخوازیێ | ◐ | APPROVED (owner, 2026-09-30) |
| `store.features.*` | (feature names shown on packages) | | I'll suggest these with the batch 6 sentences. | | | PENDING |

## Batch 7 — online payment — ✅ APPROVED (applied with the full list, see `KURDISH_FULL_LIST.md`)

| Key | Arabic | English | Suggested Sorani (ckb) | Suggested Badini (bdn) | Conf. | Status |
|---|---|---|---|---|---|---|
| `receipt.payNow` | ادفع {amount} | Pay {amount} | پارە بدە {amount} | پارەی بدە {amount} | ◐ | PENDING |
| `receipt.payOpening` | جارٍ فتح صفحة الدفع الآمنة… | Opening the secure payment page… | پەڕەی پارەدانی پارێزراو دەکرێتەوە… | لاپەرێ پارەدانا پاراستی دهێتە ڤەکرن… | ○ | PENDING |
| `receipt.payNote` | ستنتقل إلى صفحة الدفع الآمنة لدى WAYL، ثم تعود إلى هنا. | You'll be taken to WAYL's secure payment page, then back here. | دەچیتە سەر پەڕەی پارەدانی پارێزراوی WAYL، پاشان دەگەڕێیتەوە ئێرە. | دێ چیە سەر لاپەرێ پارەدانا پاراستی یێ WAYL، پاشان دێ زڤڕییە ڤێرە. | ○ | PENDING |
| `receipt.payError` | تعذّر فتح صفحة الدفع الآن. يرجى المحاولة بعد قليل. | We couldn't open the payment page right now. Please try again in a moment. | ئێستا نەتوانرا پەڕەی پارەدان بکرێتەوە. تکایە کەمێکی تر هەوڵ بدەوە. | نوکە نەشیاین لاپەرێ پارەدانێ ڤەکەین. هیڤییە پشتی کێمەکێ دووبارە هەول بدە. | ○ | PENDING |
| `receipt.payManual` | سيتواصل معكم فريقنا لإتمام الدفع. | Our team will contact you to complete payment. | تیمەکەمان پەیوەندیتان پێوە دەکات بۆ تەواوکردنی پارەدان. | تیما مە دێ پەیوەندیێ ب هەوە کەت بۆ تەمامکرنا پارەدانێ. | ◐ | PENDING |
| `receipt.confirming` | جارٍ تأكيد دفعتكم مع WAYL… | Confirming your payment with WAYL… | پارەدانەکەتان لەگەڵ WAYL پشتڕاست دەکرێتەوە… | پارەدانا هەوە دگەل WAYL دهێتە پشتڕاستکرن… | ○ | PENDING |
| `receipt.confirmingSlow` | ما زال تأكيد الدفع جارياً… | Your payment is still being confirmed… (see `en.json`) | پشتڕاستکردنەوەی پارەدان هێشتا بەردەوامە و لەوانەیە چەند خولەکێک بخایەنێت. بەستەری ئەم پەڕەیە بپارێزن؛ دوای پشتڕاستکردنەوە خۆی نوێ دەبێتەوە. | پشتڕاستکرنا پارەدانێ هێشتا بەردەوامە و دبیت چەند خولەکان بکێشیت. لینکا ڤێ لاپەرێ بپارێزن؛ پشتی پشتڕاستکرنێ دێ ب خۆ نوو بیت. | ○ | PENDING |
| `store.paymentNext` | بعد التأكيد تدفعون بأمان عبر صفحة الدفع لدى WAYL… | After confirming, you'll pay securely on WAYL's payment page… | دوای پشتڕاستکردنەوە، بە پارێزراوی لە پەڕەی پارەدانی WAYL پارە دەدەن. بانگهێشتنامەکەتان هەر کە پارەدان پشتڕاست کرایەوە بڵاو دەکرێتەوە. | پشتی پشتڕاستکرنێ، ب پاراستی ل لاپەرێ پارەدانا WAYL پارەی ددەن. داخوازناما هەوە هەر کو پارەدان هاتە پشتڕاستکرن دێ هێتە بەلاڤکرن. | ○ | PENDING |

Still to suggest (after you've settled the wording above): FAQ answers (`home.faq*`), package feature names (`store.features.*`), the remaining `store.*` sentences (hints and errors), and Kurdish sample names (3c).

## Batch 8 — public invitation page — ✅ APPROVED (2026-10-01)

| Key | Arabic | English | Suggested Sorani (ckb) | Suggested Badini (bdn) | Conf. | Status |
|---|---|---|---|---|---|---|
| `invitation.and` | و | & | و | و | ● | APPROVED (owner, 2026-10-01) |
| `invitation.youreInvited` | يسعدنا دعوتكم | You're invited | بە خۆشحاڵییەوە بانگهێشتتان دەکەین | ب دلخۆشی داخوازا هەوە دکەین | ○ | APPROVED (owner, 2026-10-01) |
| `invitation.endedTitle` | انتهت هذه الدعوة | This invitation has ended | ئەم بانگهێشتنامەیە کۆتایی هات | ئەڤ داخوازنامە ب دوماهی هات | ◐ | APPROVED (owner, 2026-10-01) |
| `invitation.endedBody` | شكراً لمشاركتكم فرحتنا. هذه الدعوة لم تعد متاحة. | Thank you for celebrating with us. This invitation is no longer available. | سوپاس بۆ بەشداریکردنتان لە خۆشیمان. ئەم بانگهێشتنامەیە چیتر بەردەست نییە. | سوپاس بۆ پشکداریا هەوە د شاهیا مە دا. ئەڤ داخوازنامە ئێدی بەردەست نینە. | ○ | APPROVED (owner, 2026-10-01) |
| `invitation.brand` | بهجه | Bahja | بەهجە | بەهجە | ● | APPROVED (owner, 2026-10-01) |

## Batch 9 — paying while online payment is off — ✅ APPROVED (applied with the full list)

| Key | Arabic | English | Suggested Sorani (ckb) | Suggested Badini (bdn) | Conf. | Status |
|---|---|---|---|---|---|---|
| `receipt.payWhatsApp` | إرسال طلبي على واتساب | Send my order on WhatsApp | ناردنی داواکارییەکەم لە واتسئاپ | هنارتنا داخوازیا من ل واتسئاپێ | ◐ | PENDING |
| `receipt.waMessage` | مرحباً بهجه، قمت بالطلب {order} بمبلغ {amount}. كيف أُكمل الدفع؟ | Hello Bahja, I placed order {order} for {amount}. How do I complete payment? | سڵاو بەهجە، داواکاری {order} م کرد بە بڕی {amount}. چۆن پارەدان تەواو بکەم؟ | سلاڤ بەهجە، من داخوازیا {order} کر ب بڕێ {amount}. چاوا پارەدانێ تەمام بکەم؟ | ○ | PENDING |
| `store.paymentSoon` | بعد التأكيد ستحصلون على إيصال خاص فيه طريقة الدفع… | After confirming, you'll get a private receipt with how to pay… | دوای پشتڕاستکردنەوە پسوولەیەکی تایبەتتان پێدەگات کە ڕێگای پارەدانی تێدایە. بانگهێشتنامەکەتان هەر کە پارەدانمان پشتڕاست کردەوە بڵاو دەکرێتەوە. | پشتی پشتڕاستکرنێ دێ پسوولەکا تایبەت گەهیتە هەوە کو ڕێکا پارەدانێ تێدایە. داخوازناما هەوە هەر کو مە پارەدان پشتڕاست کر دێ هێتە بەلاڤکرن. | ○ | PENDING |

## Batch 10 — Olive Ring Box theme wording — ✅ APPROVED (applied with the full list, see `KURDISH_FULL_LIST.md`)

These fixed lines live in `themes/olive-ring-box/v1/copy.ts`, not in the site message files. Every
other text in the theme (buttons, guest form, countdown units, errors) uses the already-translated
site labels. Until Kurdish wording is approved, Sorani and Badini invitations show these lines in
Arabic. The basmala always stays in Arabic.

| Key (`copy.ts`) | Arabic | English | Sorani (ckb) | Badini (bdn) | Status |
|---|---|---|---|---|---|
| `openHint` | اضغط لفتح علبة الدعوة | Tap to open the invitation box | | | AWAITING |
| `and` | و | & | | | AWAITING |
| `countdownTitle` | يبدأ الحفل بعد | The celebration begins in | | | AWAITING |
| `formIntro` | يسعدنا أن نعرف إن كنت ستشاركنا فرحتنا. | We would love to know if you can join us. | | | AWAITING |
| `closing` | شكرًا لمشاركتكم فرحتنا | Thank you for sharing our joy | | | AWAITING |
| `closingSub` | حضوركم يتمّ سعادتنا | Your presence completes our happiness | | | AWAITING |
| `keepsakeSubtitle` | تهاني الأهل والأحبة | Wishes from family and friends | | | AWAITING |
| `keepsakeClosing` | مع خالص الشكر لكل من شاركنا الفرح | With heartfelt thanks to everyone who shared our joy | | | AWAITING |

## Batch 11 — printable card and keepsake — ✅ APPROVED (applied with the full list, see `KURDISH_FULL_LIST.md`)

Shown on the customer's receipt page and printed on the card / keepsake PDF. Until approved, Kurdish
invitations show the Arabic.

| Key | Arabic | English | Sorani (ckb) | Badini (bdn) | Status |
|---|---|---|---|---|---|
| `receipt.printCardTitle` | بطاقة الدعوة للطباعة | Printable invitation card | | | AWAITING |
| `receipt.printCardHelp` | ملف PDF جاهز للطباعة بحجم A5 (148 × 210 مم) بنفس الأسماء والتاريخ والمكان، مع رمز QR يفتح الدعوة الإلكترونية. قد يستغرق تجهيزه بضع ثوانٍ. | A print-ready A5 PDF (148 × 210 mm) with the same names, date and venue, and a QR code to the online invitation. It may take a few seconds to prepare. | | | AWAITING |
| `receipt.printCardDownload` | تحميل بطاقة الطباعة (PDF) | Download printable card (PDF) | | | AWAITING |
| `invitation.print.scanToOpen` | امسح الرمز لفتح الدعوة | Scan to open the invitation | | | AWAITING |
| `invitation.print.keepsakeTitle` | رسائل المحبة | Messages of love | | | AWAITING |
| `invitation.print.keepsakeEmpty` | لم تصل رسائل بعد. | No messages yet. | | | AWAITING |
| `receipt.keepsakeTitle` | ذكرى التهاني | Your keepsake of wishes | | | AWAITING |
| `receipt.keepsakeHelp` | كل الرسائل التي كتبها ضيوفكم، مجموعة في ملف PDF بتصميم دعوتكم. | Every message your guests wrote, gathered in a PDF in the design of your invitation. | | | AWAITING |
| `receipt.keepsakeDownload` | تحميل ملف الذكرى (PDF) | Download keepsake (PDF) | | | AWAITING |
| `receipt.waCardMessage` | مرحباً {name}، هذه بطاقة دعوتكم للطباعة من بهجه (PDF): {url} | Hello {name}, here is your printable invitation card from Bahja (PDF): {url} | | | AWAITING |
| `receipt.waKeepsakeMessage` | مرحباً {name}، ألف مبروك! هذا ملف الذكرى بكل تهاني ضيوفكم من بهجه (PDF): {url} | Hello {name}, congratulations! Here is your keepsake with all your guests' wishes from Bahja (PDF): {url} | | | AWAITING |

## Batch 12 — footer, contact page, legal pages, checkout terms — ✅ APPROVED (applied with the full list, see `KURDISH_FULL_LIST.md`)

Customer-facing labels added in M10. Policy texts themselves are written per language in
Admin → Legal policies (Kurdish fields are optional there and fall back to Arabic). `<terms>` and
`<refund>` mark the linked words in `store.acceptTerms` — keep them around the translated words.

| Key | Arabic | English | Sorani (ckb) | Badini (bdn) | Status |
|---|---|---|---|---|---|
| `footer.whatsapp` | واتساب | WhatsApp | | | AWAITING |
| `footer.phone` | الهاتف | Phone | | | AWAITING |
| `footer.instagram` | إنستغرام | Instagram | | | AWAITING |
| `footer.facebook` | فيسبوك | Facebook | | | AWAITING |
| `footer.tiktok` | تيك توك | TikTok | | | AWAITING |
| `footer.legal` | السياسات | Policies | | | AWAITING |
| `footer.terms` | شروط الخدمة | Terms of service | | | AWAITING |
| `footer.privacy` | سياسة الخصوصية | Privacy policy | | | AWAITING |
| `footer.refund` | سياسة الاسترجاع | Refund policy | | | AWAITING |
| `contact.title` | تواصل معنا | Contact us | | | AWAITING |
| `contact.subtitle` | يسعدنا مساعدتك في اختيار دعوتك وتخصيصها. | We're happy to help you choose and personalise your invitation. | | | AWAITING |
| `contact.whatsappButton` | راسلنا على واتساب | Message us on WhatsApp | | | AWAITING |
| `contact.waText` | مرحباً بهجه، لدي سؤال عن دعوة. | Hello Bahja, I have a question about an invitation. | | | AWAITING |
| `contact.email` | البريد الإلكتروني | Email | | | AWAITING |
| `contact.address` | العنوان | Address | | | AWAITING |
| `contact.hours` | أوقات العمل | Working hours | | | AWAITING |
| `contact.soon` | ستُضاف معلومات التواصل قريباً. | Contact details will be added soon. | | | AWAITING |
| `legal.updated` | الإصدار {version} · آخر تحديث {date} | Version {version} · last updated {date} | | | AWAITING |
| `legal.preparing` | هذه السياسة قيد الإعداد وستُنشر هنا قريباً. | This policy is being prepared and will be published here soon. | | | AWAITING |
| `store.acceptTerms` | راجعتُ تفاصيل دعوتي وأوافق على <terms>الشروط</terms> و<refund>سياسة الاسترداد</refund>. | I've checked my invitation details and I accept the <terms>terms</terms> and <refund>refund policy</refund>. | | | AWAITING |
| `store.askTheme` | لديك سؤال عن هذا التصميم؟ | Have a question about this design? | | | AWAITING |
| `store.askThemeLink` | اسألنا على واتساب | Ask us on WhatsApp | | | AWAITING |
| `store.askThemeText` | مرحباً بهجه، لدي سؤال عن دعوة «{theme}»: {url} | Hello Bahja, I have a question about the “{theme}” invitation: {url} | | | AWAITING |

## Batch 13 — public guest messages — ✅ APPROVED (applied with the full list, see `KURDISH_FULL_LIST.md`)

Shown under the invitation when the customer makes messages public, the sample messages in theme
previews, and the choice on the customer's receipt.

| Key | Arabic | English | Sorani (ckb) | Badini (bdn) | Status |
|---|---|---|---|---|---|
| `invitation.guestbookTitle` | رسائل الضيوف | Messages from our guests | | | AWAITING |
| `invitation.guestbookEmpty` | كن أول من يكتب تهنئة. | Be the first to write a congratulation. | | | AWAITING |
| `invitationSamples.m1Name` | سارة | Sara | | | AWAITING |
| `invitationSamples.m1Text` | ألف مبروك! نتمنى لكما حياة مليئة بالحب والسعادة. | Congratulations! Wishing you a lifetime of love and happiness. | | | AWAITING |
| `invitationSamples.m2Name` | أحمد | Ahmed | | | AWAITING |
| `invitationSamples.m2Text` | مبارك لكما، الله يتمم عليكما بخير ويجعل بيتكما عامراً بالفرح. | Mabrook to you both, may your home be full of joy. | | | AWAITING |
| `invitationSamples.m3Name` | ليلى | Laila | | | AWAITING |
| `invitationSamples.m3Text` | فرحانة جداً لكم، نشوفكم بالحفلة! | So happy for you. See you at the celebration! | | | AWAITING |
| `receipt.guestbookTitle` | رسائل الضيوف | Guest messages | | | AWAITING |
| `receipt.guestbookHelp` | اختر من يرى رسائل التهنئة التي يكتبها ضيوفكم. في الحالتين تُجمع كلها في ملف الذكرى. | Choose who sees the congratulation messages your guests write. Either way, they are all collected in your keepsake PDF. | | | AWAITING |
| `receipt.guestbookPrivate` | أنا فقط (في ملف الذكرى) | Only me (in the keepsake PDF) | | | AWAITING |
| `receipt.guestbookPublic` | كل من لديه رابط الدعوة (تظهر تحت الدعوة) | Everyone with the invitation link (shown under the invitation) | | | AWAITING |
| `receipt.guestbookSave` | حفظ الاختيار | Save choice | | | AWAITING |
| `receipt.guestbookSaved` | تم الحفظ. | Saved. | | | AWAITING |

## Batch 14 — "My invitation" number and editing after publishing — ✅ APPROVED (owner, 2026-10-07)

New customer texts. Reply "approve" (all, or by number) or give your wording. Until approved they show in Arabic.
Same glossary as before (بانگهێشتنامە / داخوازنامە, پسوولە, بەستەر / لینک, تکایە / هیڤییە).

| # | Key | Arabic | English | Sorani (ckb) | Badini (bdn) | Conf. |
|---|---|---|---|---|---|---|
| 1 | `footer.access`, `access.title` | دعوتي | My invitation | بانگهێشتنامەکەم | داخوازناما من | ◐ |
| 2 | `access.subtitle` | اكتب رقم دعوتك لتصل إلى دعوتك وإيصالك وبطاقة الطباعة وملف الذكرى. | Type your invitation number to see your invitation, receipt, printable card and keepsake. | ژمارەی بانگهێشتنامەکەت بنووسە بۆ گەیشتن بە بانگهێشتنامە و پسوولە و کارتی چاپ و فایلی یادگارییەکەت. | ژمارا داخوازناما خۆ بنڤیسە دا بگەهیە داخوازنامە و پسوولە و کارتا چاپێ و فایلا بیرهاتنێ یا خۆ. | ◐ |
| 3 | `access.label`, `receipt.accessCodeLine` (label part) | رقم الدعوة | Invitation number | ژمارەی بانگهێشتنامە | ژمارا داخوازنامێ | ● |
| 4 | `access.help` | تجده في إيصالك وفي رسالة واتساب الخاصة بطلبك (١٠ أرقام). | You find it on your receipt and in the WhatsApp message with your order (10 digits). | لە پسوولەکەت و لە نامەی واتسئاپی داواکارییەکەتدا دەیدۆزیتەوە (١٠ ژمارە). | دێ وێ د پسوولا خۆ و د نامەیا واتسئاپێ یا داخوازیا خۆ دا بینی (١٠ ژمارە). | ◐ |
| 5 | `access.submit` | فتح | Open | کردنەوە | ڤەکرن | ● |
| 6 | `access.errors.invalid` | يرجى كتابة أرقام رقم دعوتك العشرة. | Please type the 10 digits of your invitation number. | تکایە ١٠ ژمارەکەی ژمارەی بانگهێشتنامەکەت بنووسە. | هیڤییە ١٠ ژمارێن ژمارا داخوازناما خۆ بنڤیسە. | ◐ |
| 7 | `access.errors.notFound` | لم نجد هذا الرقم. يرجى التأكد منه أو التواصل معنا على واتساب. | We couldn't find this number… | ئەم ژمارەیەمان نەدۆزییەوە. تکایە دڵنیا بەرەوە یان لە واتسئاپ پەیوەندیمان پێوە بکە. | مە ئەڤ ژمارە نەدیت. هیڤییە پشتڕاست بکە یان ل واتسئاپێ پەیوەندیێ ب مە بکە. | ◐ |
| 8 | `access.errors.rateLimited` | محاولات كثيرة. يرجى الانتظار ساعة ثم المحاولة مجدداً. | Too many attempts. Please wait an hour and try again. | هەوڵدانەکان زۆرن. تکایە کاتژمێرێک چاوەڕێ بکە و دووبارە هەوڵ بدەوە. | هەولدان گەلەک بوون. هیڤییە دەمژمێرەکێ ل هیڤیێ بە و دووبارە هەول بدە. | ◐ |
| 9 | `receipt.accessCodeTitle` | رقم دعوتك | Your invitation number | ژمارەی بانگهێشتنامەکەت | ژمارا داخوازناما تە | ● |
| 10 | `receipt.accessCodeHelp` | احتفظ به. اكتبه في {site}/access (دعوتي) في أي وقت لتعود إلى هنا… | Keep it. Type it on {site}/access (My invitation) any time to come back here… | بیپارێزە. هەر کاتێک لە {site}/access (بانگهێشتنامەکەم) بینووسە بۆ گەڕانەوە بۆ ئێرە: بانگهێشتنامە و کارت و فایلی یادگاری و دەستکارییەکانت. | بپارێزە. هەر دەمەکێ ل {site}/access (داخوازناما من) بنڤیسە دا بزڤڕیە ڤێرە: داخوازنامە و کارت و فایلا بیرهاتنێ و گوهۆڕینێن تە. | ◐ |
| 11 | `receipt.accessCodeLine` | رقم الدعوة: {code} | Invitation number: {code} | ژمارەی بانگهێشتنامە: {code} | ژمارا داخوازنامێ: {code} | ● |
| 12 | `receipt.editTitle` | تعديل دعوتك | Edit your invitation | دەستکاریکردنی بانگهێشتنامەکەت | گوهۆڕینا داخوازناما تە | ◐ |
| 13 | `receipt.editHelp` | صحّح أو غيّر الأسماء أو التاريخ أو الوقت أو المكان أو النص بنفسك. متبقٍ لك {left} من {total} تعديلات. | …You have {left} of {total} edits left. | خۆت ناو و بەروار و کات و شوێن و دەق ڕاست بکەرەوە یان بیگۆڕە. {left} لە {total} دەستکاریت ماوە. | ب خۆ ناڤ و دیرۆک و دەم و جه و نڤیسینێ ڕاست بکە یان بگوهۆڕە. {left} ژ {total} گوهۆڕینان بۆ تە مایە. | ◐ |
| 14 | `receipt.editButton` | تعديل دعوتي | Edit my invitation | دەستکاریکردنی بانگهێشتنامەکەم | گوهۆڕینا داخوازناما من | ◐ |
| 15 | `receipt.editSave` | حفظ التعديلات | Save changes | پاشەکەوتکردنی گۆڕانکارییەکان | پاراستنا گوهۆڕینان | ● |
| 16 | `receipt.editSaved` | تم تحديث دعوتك. يرى الضيوف التفاصيل الجديدة الآن. | Your invitation is updated… | بانگهێشتنامەکەت نوێ کرایەوە. میوانەکان ئێستا وردەکارییە نوێیەکان دەبینن. | داخوازناما تە هاتە نووکرن. مێڤان نوکە هوورگیێن نوو دبینن. | ◐ |
| 17 | `receipt.editLimitReached` | استخدمت كل التعديلات المتاحة. تواصل معنا على واتساب لأي تغيير آخر. | You have used all your edits… | هەموو دەستکارییەکانت بەکارهێناوە. بۆ هەر گۆڕانکارییەکی تر لە واتسئاپ پەیوەندیمان پێوە بکە. | تە هەمی گوهۆڕین بکار ئینان. بۆ هەر گوهۆڕینەکا دی ل واتسئاپێ پەیوەندیێ ب مە بکە. | ◐ |
| 18 | `receipt.editClosed` | التعديل مغلق لأن الدعوة لم تعد منشورة. | Editing is closed… | دەستکاری داخراوە چونکە بانگهێشتنامەکە چیتر بڵاو نەکراوەتەوە. | گوهۆڕین هاتیە گرتن چونکی داخوازنامە ئێدی نە بەلاڤکریە. | ○ |
| 19 | `receipt.editBack` | العودة إلى إيصالي | Back to my receipt | گەڕانەوە بۆ پسوولەکەم | زڤڕین بۆ پسوولا من | ● |
| 20 | `store.features.self_edit` | تعديل دعوتك بنفسك بعد النشر | Edit your invitation yourself after publishing | دەستکاریکردنی بانگهێشتنامە بە خۆت دوای بڵاوکردنەوە | گوهۆڕینا داخوازنامێ ب خۆ پشتی بەلاڤکرنێ | ◐ |
| 21 | `store.errors.editNotAllowed` | لم يعد بالإمكان تعديل هذه الدعوة من هنا. | This invitation can no longer be edited here. | ئیتر ناتوانرێت ئەم بانگهێشتنامەیە لێرە دەستکاری بکرێت. | ئێدی نابیت ئەڤ داخوازنامە ل ڤێرە بهێتە گوهۆڕین. | ◐ |
| 22 | `store.errors.editLimitReached` | استخدمت كل التعديلات المتاحة. تواصل معنا لأي تغيير آخر. | You have used all your edits… | هەموو دەستکارییەکانت بەکارهێناوە. بۆ هەر گۆڕانکارییەکی تر پەیوەندیمان پێوە بکە. | تە هەمی گوهۆڕین بکار ئینان. بۆ هەر گوهۆڕینەکا دی پەیوەندیێ ب مە بکە. | ◐ |

## Batch 15 — coupons at checkout — ✅ APPROVED (owner, 2026-10-07)

| # | Key | Arabic | English | Sorani (ckb) | Badini (bdn) | Conf. |
|---|---|---|---|---|---|---|
| 1 | `store.couponLabel` | رمز الخصم (اختياري) | Coupon code (optional) | کۆدی داشکاندن (ئارەزوومەندانە) | کۆدێ داشکاندنێ (ب دلێ خۆ) | ◐ |
| 2 | `store.couponHint` | إذا كان لديك رمز خصم فاكتبه هنا. يُطبَّق الخصم عند تأكيد الطلب. | If you have a discount code, type it here… | ئەگەر کۆدی داشکاندنت هەیە لێرە بینووسە. داشکاندنەکە کاتی پشتڕاستکردنەوەی داواکاری جێبەجێ دەکرێت. | ئەگەر کۆدێ داشکاندنێ تە هەبیت ل ڤێرە بنڤیسە. داشکاندن دەمێ پشتڕاستکرنا داخوازیێ دهێتە جێبەجێکرن. | ◐ |
| 3 | `store.errors.invalidCoupon` | رمز الخصم هذا غير صالح أو انتهت صلاحيته أو استُخدم بالكامل. | This coupon code isn't valid, has expired or has been used up. | ئەم کۆدی داشکاندنە دروست نییە، یان ماوەی بەسەرچووە، یان بە تەواوی بەکارهاتووە. | ئەڤ کۆدێ داشکاندنێ نە دروستە، یان دەمێ وی ب دوماهی هاتیە، یان هەمی هاتیە بکارئینان. | ◐ |
| 4 | `receipt.listPrice` | سعر الباقة | Package price | نرخی پاکێج | بهایێ پاکێجێ | ● |
| 5 | `receipt.discount` | الخصم ({code}) | Discount ({code}) | داشکاندن ({code}) | داشکاندن ({code}) | ● |

## Batch 16 — receipt previews, saving the guest-message choice, receipt link on WhatsApp — ✅ APPROVED (owner, 2026-10-08)

| # | Key | Arabic | English | Sorani (ckb) | Badini (bdn) | Conf. |
|---|---|---|---|---|---|---|
| 1 | `receipt.filesTitle` | بطاقتكم وذكرى التهاني | Your card and keepsake | کارتەکەتان و یادگاری پیرۆزباییەکان | کارتا هەوە و بیرهاتنا پیرۆزباهیان | ◐ |
| 2 | `receipt.filesHelp` | اضغطوا على الصورة لفتح ملف PDF، أو حمّلوه للاحتفاظ به. | Tap a picture to open the PDF, or download it to keep. | کرتە لە وێنەکە بکەن بۆ کردنەوەی فایلی PDF، یان دایبگرن بۆ پاراستنی. | کلیک ل سەر وێنەی بکەن دا فایلا PDF ڤەبیت، یان داگرن دا بپارێزن. | ◐ |
| 3 | `receipt.pdfFile` | ملف PDF | PDF file | فایلی PDF | فایلا PDF | ● |
| 4 | `receipt.keepsakeGrowing` | يتحدّث الملف كلما كتب ضيوفكم، فحمّلوه مرة أخرى بعد المناسبة ليضمّ كل الرسائل. | It updates as your guests write, so download it again after the celebration to have every message. | فایلەکە هەر کاتێک میوانەکانتان بنووسن نوێ دەبێتەوە، بۆیە دوای بۆنەکە دووبارە دایبگرن بۆ ئەوەی هەموو نامەکانی تێدا بێت. | فایل هەر دەمێ مێڤانێن هەوە بنڤیسن نوو دبیت، لەوما پشتی بۆنێ دووبارە داگرن دا هەمی نامە تێدا بن. | ◐ |
| 5 | `receipt.guestbookSaving` | جارٍ الحفظ… | Saving… | پاشەکەوت دەکرێت… | دهێتە پاراستن… | ● |
| 6 | `receipt.guestbookError` | تعذّر حفظ اختياركم. حاولوا مرة أخرى. | Couldn't save your choice. Please try again. | هەڵبژاردنەکەتان پاشەکەوت نەکرا. تکایە دووبارە هەوڵ بدەنەوە. | هەلبژارتنا هەوە نەهاتە پاراستن. هیڤییە دووبارە هەول بدەن. | ◐ |
| 7 | `receipt.receiptLinkLine` | الإيصال والبطاقة وملف الذكرى (في أي وقت): {url} | Your receipt, card and keepsake (any time): {url} | پسوولە و کارت و فایلی یادگاری (هەر کاتێک): {url} | پسوولە و کارت و فایلا بیرهاتنێ (هەر دەمەکێ): {url} | ◐ |

`receipt.guestbookSave` ("Save choice") was removed: the choice now saves the moment it is tapped.

## Batch 17 — design and package names typed in Admin — ✅ APPROVED (owner, 2026-10-08)

These names live in the database, not in the message files. Once approved, `pnpm db:seed` (every deploy)
adds them wherever the name's Sorani or Badini is still empty; Kurdish typed in Admin is never replaced.
Source: `src/server/catalog/kurdish-names.ts` (`approved: true` per line after approval). Anything else still
missing is listed on the Admin home page under "Missing Kurdish".

| # | Name (Arabic / English) | Sorani (ckb) | Badini (bdn) | Conf. |
|---|---|---|---|---|
| 1 | علبة الخاتم الزيتونية / Olive Ring Box | سندوقی ئەڵقەی زەیتوونی | سندوقا ئەنگوستیلا زەیتوونی | ◐ |
| 2 | زاخو بالألوان المائية / Zaxo Watercolor | زاخۆ بە ڕەنگی ئاوی | زاخۆ ب ڕەنگێن ئاڤی | ◐ |
| 3 | عادي / Normal | ئاسایی | ئاسایی | ● |
| 4 | مميز / VIP | تایبەت | تایبەت | ◐ |
| 5 | مميز جداً / VVIP | زۆر تایبەت | گەلەک تایبەت | ◐ |
| 6 | VIP, VVIP (when the Arabic name is the Latin letters) | VIP | VIP / VVIP | ● |

Kept in Arabic on purpose (not a translation gap): «بسم الله الرحمن الرحيم» at the top of invitations and cards,
the language names «العربية» and «English» in language pickers, and whatever the customer types (names, venue, message).

## Editing in Admin → Translations

Since 2026-10-08 the owner can change any customer text in Admin → Translations, in all four languages.
Those edits are saved in the database (`ui_translations`) on top of the files in `src/i18n/messages`, show on the
website within a minute, and are recorded in the audit log. Sorani and Badini can only be changed there by
the owner, so a Kurdish edit made in Admin is already owner-approved. Suggestions made by Claude still go
through this file first.

## Batch 18 — showing how many guests are coming — ✅ APPROVED (owner, 2026-10-08)

| # | Key | Arabic | English | Sorani (ckb) | Badini (bdn) | Conf. |
|---|---|---|---|---|---|---|
| 1 | `invitation.attendanceTitle` | ردود الضيوف | Guest replies | وەڵامی میوانەکان | بەرسڤێن مێڤانان | ● |
| 2 | `invitation.attendingCount` | سيحضرون | Coming | ئامادە دەبن | دێ ئامادە بن | ◐ |
| 3 | `invitation.notAttendingCount` | لن يحضروا | Not coming | ئامادە نابن | ئامادە نابن | ◐ |
| 4 | `receipt.attendanceTitle` | من سيحضر | Who is coming | کێ ئامادە دەبێت | کی دێ ئامادە بیت | ◐ |
| 5 | `receipt.attendanceComing` | سيحضر: {count} | Coming: {count} | ئامادە دەبن: {count} | دێ ئامادە بن: {count} | ◐ |
| 5b | `receipt.attendanceNotComing` | لن يحضر: {count} | Not coming: {count} | ئامادە نابن: {count} | ئامادە نابن: {count} | ◐ |
| 6 | `receipt.attendanceHelp` | اختر من يرى عدد الضيوف الذين سيحضرون والذين لن يحضروا. | Choose who sees how many guests are coming and how many are not. | هەڵبژێرە کێ ژمارەی ئەو میوانانە دەبینێت کە ئامادە دەبن و ئەوانەی ئامادە نابن. | هەلبژێرە کی ژمارا وان مێڤانان دبینیت یێن دێ ئامادە بن و یێن ئامادە نابن. | ◐ |
| 7 | `receipt.attendancePrivate` | أنا فقط (هنا في إيصالي) | Only me (here on my receipt) | تەنها من (لێرە لە پسوولەکەم) | بتنێ ئەز (ل ڤێرە د پسوولا من دا) | ◐ |
| 8 | `receipt.attendancePublic` | كل من لديه رابط الدعوة (يظهر فوق نموذج الرد) | Everyone with the invitation link (shown above the reply form) | هەرکەسێک بەستەری بانگهێشتنامەکەی هەبێت (لە سەرووی فۆرمی وەڵامدانەوە دەردەکەوێت) | هەر کەسێ لینکا داخوازنامێ هەبیت (ل سەر فۆرما بەرسڤێ دیار دبیت) | ◐ |

## Batch 19 — card back, signature, colour choice and subsections — ✅ APPROVED (owner, 2026-10-08)

Applied to `ckb.json` and `bdn.json`.

| # | Key | Arabic | English | Sorani (ckb) | Badini (bdn) | Conf. |
|---|---|---|---|---|---|---|
| 1 | `invitation.print.cardBackTitle` | بكل الحب | With love | بە هەموو خۆشەویستییەوە | ب هەمی ڤیانێ | ◐ |
| 2 | `store.cardBack.titlePlaceholder` | بكل الحب | With love | بە هەموو خۆشەویستییەوە | ب هەمی ڤیانێ | ◐ |
| 3 | `receipt.cardBackSave` | حفظ ظهر البطاقة | Save the back of the card | پاشەکەوتکردنی پشتی کارتەکە | پاراستنا پشتا کارتێ | ◐ |
| 4 | `store.features.signature` | توقيعكم الخاص على الدعوة | Your own signature on the invitation | واژووی خۆتان لەسەر بانگهێشتنامەکە | ئیمزایا هەوە ب خۆ ل سەر داخوازنامێ | ◐ |
| 5 | `store.features.color_choice` | اختيار ألوان الدعوة | Choose the invitation colours | هەڵبژاردنی ڕەنگەکانی بانگهێشتنامە | هەلبژارتنا ڕەنگێن داخوازنامێ | ◐ |
| 6 | `store.cardBack.heading` | ظهر بطاقتكم المطبوعة | Back of your printed card | پشتی کارتە چاپکراوەکەتان | پشتا کارتا هەوە یا چاپکری | ◐ |
| 7 | `store.cardBack.help` | بطاقتكم المطبوعة لها وجهان. اكتبوا ما يظهر على ظهرها: عنواناً كبيراً ورسالة أصغر. | Your printed card has two sides… | کارتە چاپکراوەکەتان دوو ڕووی هەیە. ئەوەی لە پشتەوەی دەردەکەوێت بنووسن: ناونیشانێکی گەورە و نامەیەکی بچووکتر. | کارتا هەوە یا چاپکری دوو ڕوو هەنە. ئەوا ل پشتێ دیار دبیت بنڤیسن: ناڤونیشانەکێ مەزن و نامەیەکا بچووکتر. | ◐ |
| 8 | `store.cardBack.title` | العنوان الكبير | Big title | ناونیشانی گەورە | ناڤونیشانێ مەزن | ◐ |
| 9 | `store.cardBack.message` | رسالتكم | Your message | نامەکەتان | نامەیا هەوە | ● |
| 10 | `store.cardBack.messagePlaceholder` | شكراً لأنكم معنا في أجمل أيامنا… | Thank you for being part of our happiest day… | سوپاس کە لە خۆشترین ڕۆژمان لەگەڵمان بوون… | سوپاس کو د خۆشترین ڕۆژا مە دا دگەل مە بوون… | ◐ |
| 11 | `store.signature.heading` | توقيعكم | Your signature | واژووەکەتان | ئیمزایا هەوە | ◐ |
| 12 | `store.signature.help` | اختاروا توقيعاً واحداً أو توقيعين (مثلاً لكليكما). وقّعوا بإصبعكم أو بالفأرة، ويمكنكم المسح والمحاولة من جديد كما تشاؤون. | Choose one signature or two (for example both of you)… | یەک واژوو یان دوو واژوو هەڵبژێرن (بۆ نموونە بۆ هەردووکتان). بە پەنجە یان ماوس واژوو بکەن؛ دەتوانن بیسڕنەوە و چەند جار بتانەوێت دووبارە هەوڵ بدەنەوە. | ئیمزایەکێ یان دوو ئیمزایان هەلبژێرن (بۆ نموونە بۆ هەردووکان). ب تبلا خۆ یان ماوسێ ئیمزا بکەن؛ دشێن ژێببەن و هەر چەند جاران هوین بڤێن دووبارە هەول بدەن. | ◐ |
| 13 | `store.signature.pad` | مكان التوقيع | Signature area | شوێنی واژوو | جهێ ئیمزایێ | ◐ |
| 14 | `store.signature.clear` | مسح والمحاولة من جديد | Clear and try again | سڕینەوە و دووبارە هەوڵدانەوە | ژێبرن و دووبارە هەولدان | ◐ |
| 15 | `store.signature.include` | أضف توقيعي (أو توقيعينا) إلى الدعوة | Add my signature(s) to the invitation | واژووەکەم (یان واژووەکانمان) بخەرە سەر بانگهێشتنامەکە | ئیمزایا من (یان ئیمزایێن مە) بێخە سەر داخوازنامێ | ◐ |
| 16 | `store.signature.current` | توقيعكم | Your signature | واژووەکەتان | ئیمزایا هەوە | ◐ |
| 17 | `store.signature.redraw` | ارسموا توقيعاً جديداً | Draw a new signature | واژوویەکی نوێ بکێشن | ئیمزایەکا نوو بکێشن | ◐ |
| 18 | `store.signature.invalid` | لم نتمكن من قراءة التوقيع. امسحوه وحاولوا من جديد. | We couldn't read the signature… | نەمانتوانی واژووەکە بخوێنینەوە. بیسڕنەوە و دووبارە هەوڵ بدەنەوە. | مە نەشیا ئیمزایێ بخوینین. ژێببەن و دووبارە هەول بدەن. | ◐ |
| 19 | `store.colors.heading` | ألوان الدعوة | Invitation colours | ڕەنگەکانی بانگهێشتنامە | ڕەنگێن داخوازنامێ | ● |
| 20 | `store.colors.help` | اختاروا مجموعة ألوان لتصميمكم. | Choose a colour set for your design. | کۆمەڵە ڕەنگێک بۆ دیزاینەکەتان هەڵبژێرن. | کۆمەکا ڕەنگان بۆ دیزاینێ خۆ هەلبژێرن. | ◐ |
| 21 | `store.colors.original` | الألوان الأصلية | Original colours | ڕەنگە ڕەسەنەکان | ڕەنگێن ڕەسەن | ◐ |
| 22 | `store.moreDesigns` | تصاميم أخرى | More designs | دیزاینی تر | دیزاینێن دی | ● |
| 23 | `store.seeAll` | عرض الكل | See all | هەمووی ببینە | هەمیان ببینە | ◐ |
| 24 | `store.signature.count` | كم توقيعاً؟ | How many signatures? | چەند واژوو؟ | چەند ئیمزا؟ | ● |
| 25 | `store.signature.one` | توقيع واحد | One signature | یەک واژوو | ئیمزایەک | ● |
| 26 | `store.signature.two` | توقيعان | Two signatures | دوو واژوو | دوو ئیمزا | ● |
| 27 | `store.signature.first` | التوقيع الأول | First signature | واژووی یەکەم | ئیمزایا ئێکێ | ● |
| 28 | `store.signature.second` | التوقيع الثاني | Second signature | واژووی دووەم | ئیمزایا دووێ | ● |
| 29 | `receipt.flipCard` | اقلب البطاقة | Turn the card over | کارتەکە وەربگێڕە | کارتێ وەرگێڕە | ◐ |

## Batch 20 — top 3 designs on the homepage (PENDING)

Until approved, these show in Arabic to Kurdish visitors.

| # | Key | Arabic | English | Sorani (ckb) | Badini (bdn) | Conf. |
|---|---|---|---|---|---|---|
| 1 | `home.topTitle` | الأكثر تميزاً | Our top picks | باشترین هەڵبژاردەکانمان | باشترین هەلبژارتنێن مە | ◐ |
| 2 | `home.topSubtitle` | التصاميم التي يحبها زبائننا أكثر. | The designs our customers love most. | ئەو دیزاینانەی کڕیارەکانمان زیاتر حەزیان لێیە. | ئەو دیزاینێن کڕیارێن مە پتر حەز ژێ دکەن. | ◐ |
| 3 | `home.bestSeller` | الأكثر مبيعاً | Best seller | پڕفرۆشترین | پڕفرۆشترین | ◐ |
| 4 | `home.topPick` | اختيار مميز | Top pick | هەڵبژاردەی تایبەت | هەلبژارتنا تایبەت | ◐ |
