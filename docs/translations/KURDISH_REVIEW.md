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

## Batch 20 — top 3 designs on the homepage — ✅ APPROVED (owner, 2026-10-08)

Applied to `ckb.json` and `bdn.json`.

| # | Key | Arabic | English | Sorani (ckb) | Badini (bdn) | Conf. |
|---|---|---|---|---|---|---|
| 1 | `home.topTitle` | الأكثر تميزاً | Our top picks | باشترین هەڵبژاردەکانمان | باشترین هەلبژارتنێن مە | ◐ |
| 2 | `home.topSubtitle` | التصاميم التي يحبها زبائننا أكثر. | The designs our customers love most. | ئەو دیزاینانەی کڕیارەکانمان زیاتر حەزیان لێیە. | ئەو دیزاینێن کڕیارێن مە پتر حەز ژێ دکەن. | ◐ |
| 3 | `home.bestSeller` | الأكثر مبيعاً | Best seller | پڕفرۆشترین | پڕفرۆشترین | ◐ |
| 4 | `home.topPick` | اختيار مميز | Top pick | هەڵبژاردەی تایبەت | هەلبژارتنا تایبەت | ◐ |

## Batch 21 — choosing the occasion for a design sold in several — ✅ APPROVED (owner, 2026-10-10)

Shown on the order form only for a design that is in more than one occasion (e.g. wedding and engagement).
Applied to `ckb.json` and `bdn.json`.

| # | Key | Arabic | English | Sorani (ckb) | Badini (bdn) | Conf. |
|---|---|---|---|---|---|---|
| 1 | `store.occasionQuestion` | لأي مناسبة هذه الدعوة؟ | Which occasion is this invitation for? | ئەم بانگهێشتنامەیە بۆ چ بۆنەیەکە؟ | ئەڤ داخوازنامە بۆ چ بۆنەیێ یە؟ | ◐ |
| 2 | `store.occasionRequired` | يرجى اختيار المناسبة. | Please choose the occasion. | تکایە بۆنەکە هەڵبژێرە. | هیڤییە بۆنێ هەلبژێرە. | ◐ |

## Batch 22 — newborn baby occasion and its extras — ✅ APPROVED (owner, 2026-10-10)

Note (2026-10-11): Batches 21 and 22 were first imported one column off (Sorani got the Badini text,
Badini got the confidence marks). Both files were restored from the tables below.

The new "مولود جديد" occasion: its details, the extras (Instagram story, chocolate stickers, bottle label), the
watermarked previews and the sticker shape. Applied to `ckb.json` and `bdn.json`; the names below are added by the
seed wherever the Arabic is unchanged and the Kurdish is empty.

| # | Key | Arabic | English | Sorani (ckb) | Badini (bdn) | Conf. |
|---|---|---|---|---|---|---|
| 1 | `invitation.print.watermark` | بهجه · معاينة | Bahja · PREVIEW | بەهجە · پێشبینین | بەهجە · پێشدیتن | ◐ |
| 2 | `invitation.print.watermarkNote` | معاينة: تُزال هذه العلامة بعد الشراء | Preview: this watermark is removed after purchase | پێشبینین: ئەم نیشانەیە دوای کڕین لادەبرێت | پێشدیتن: ئەڤ نیشانە پشتی کڕینێ دێ هێتە لابرن | ◐ |
| 3 | `invitation.itsABoy` | إنه ولد | It's a boy | کوڕە | کوڕە | ◐ |
| 4 | `invitation.itsAGirl` | إنها بنت | It's a girl | کچە | کچە | ◐ |
| 5 | `invitation.bornOn` | تاريخ الولادة | Born on | بەرواری لەدایکبوون | دیرۆکا ژدایکبوونێ | ● |
| 6 | `invitationSamples.short.baby_name` | آدم | Adam | ئادەم | ئادەم | ● |
| 7 | `invitationSamples.short.mother_name` | نور | Noor | نوور | نوور | ● |
| 8 | `invitationSamples.short.father_name` | علي | Ali | عەلی | عەلی | ● |
| 9 | `invitationSamples.short.baby_quote` | وصلت نجمتنا الصغيرة | Our little star has arrived | ئەستێرە بچووکەکەمان گەیشت | ستێرکا مە یا بچووک گەهشت | ◐ |
| 10 | `invitationSamples.long.baby_name` | عبد الرحمن | Abdul Rahman | عەبدولڕەحمان | عەبدولڕەحمان | ● |
| 11 | `invitationSamples.long.mother_name` | فاطمة الزهراء | Fatima Al-Zahraa | فاتیمە زەهرا | فاتمە زەهرا | ◐ |
| 12 | `invitationSamples.long.father_name` | محمد الحسني | Mohammed Al-Hasani | محەمەد حەسەنی | محەمەد حەسەنی | ◐ |
| 13 | `invitationSamples.long.baby_quote` | انضم قلب جديد إلى عائلتنا، وامتلأ بيتنا فرحاً وسروراً | A new heart has joined our family… | دڵێکی نوێ هاتە ناو خێزانەکەمان و ماڵەکەمان پڕ بوو لە خۆشی | دلەکێ نوو هاتە د ناڤ مالباتا مە دا و مالا مە تژی شاهی بوو | ◐ |
| 14 | `store.features.story` | صورة ستوري لإنستغرام لمشاركتها | An Instagram story picture to share | وێنەی ستۆری ئینستاگرام بۆ هاوبەشکردن | وێنەیەکێ ستۆریا ئینستاگرامێ بۆ پارڤەکرنێ | ◐ |
| 15 | `store.features.sticker` | ملصقات للشوكولاتة، دائرية أو مربعة، جاهزة للطباعة | Chocolate stickers, round or square, ready to print | لکێنەری چوکلێت، بازنەیی یان چوارگۆشە، ئامادەی چاپ | لکێنەرێن چوکلێتێ، خڕ یان چارگوشە، ئامادەی چاپێ | ◐ |
| 16 | `store.features.bottle_label` | ملصق يلتف حول قناني الماء، جاهز للطباعة | A label that wraps around water bottles, ready to print | لکێنەرێک کە بە دەوری بوتڵی ئاودا دەپێچرێت، ئامادەی چاپ | لکێنەرەک کو ل دۆر بوتلێن ئاڤێ دهێتە پێچان، ئامادەی چاپێ | ◐ |
| 17 | `store.fieldErrors.invalidChoice` | يرجى الاختيار. | Please choose one. | تکایە یەکێک هەڵبژێرە. | هیڤییە ئێکێ هەلبژێرە. | ● |
| 18 | `store.fieldErrors.birthTooFar` | يرجى التأكد من تاريخ الولادة. | Please check the date of birth. | تکایە بەرواری لەدایکبوون بپشکنە. | هیڤییە دیرۆکا ژدایکبوونێ بپشکنە. | ◐ |
| 19 | `store.fieldOptions.baby_gender.boy` | ولد | Boy | کوڕ | کوڕ | ● |
| 20 | `store.fieldOptions.baby_gender.girl` | بنت | Girl | کچ | کچ | ● |
| 21 | `store.extras.title` | إضافاتكم | Your extras | زیادەکانتان | زێدەکرنێن هەوە | ◐ |
| 22 | `store.extras.watermarkNote` | هذه معاينات عليها علامة مائية لحماية التصميم… | These previews carry a watermark… | ئەمانە پێشبینینن کە نیشانەی ئاویان لەسەرە بۆ پاراستنی دیزاینەکە. نیشانەکە دوای کڕین لادەبرێت و فایلەکان بەبێ نیشانە لە پەڕەی پسوولەکە دادەگرن. | ئەڤە پێشدیتنن کو نیشانا ئاڤێ ل سەرە بۆ پاراستنا دیزاینێ. نیشان پشتی کڕینێ دێ هێتە لابرن و هوین فایلان بێ نیشان ژ لاپەرێ پسوولێ دادگرن. | ◐ |
| 23 | `store.extras.card` | بطاقة للطباعة | Printable card | کارتی چاپ | کارتا چاپێ | ◐ |
| 24 | `store.extras.story` | ستوري إنستغرام | Instagram story | ستۆری ئینستاگرام | ستۆریا ئینستاگرامێ | ● |
| 25 | `store.extras.sticker` | ملصق الشوكولاتة | Chocolate sticker | لکێنەری چوکلێت | لکێنەرێ چوکلێتێ | ◐ |
| 26 | `store.extras.bottle` | ملصق قناني الماء | Water bottle label | لکێنەری بوتڵی ئاو | لکێنەرێ بوتلێن ئاڤێ | ◐ |
| 27 | `store.extras.downloadPng` | صورة (PNG) | Picture (PNG) | وێنە (PNG) | وێنە (PNG) | ● |
| 28 | `store.extras.downloadSheet` | ورقة طباعة (PDF) | Print sheet (PDF) | پەڕەی چاپ (PDF) | لاپەرێ چاپێ (PDF) | ◐ |
| 29 | `store.stickerShape.heading` | شكل الملصق | Sticker shape | شێوەی لکێنەر | شێوێ لکێنەری | ◐ |
| 30 | `store.stickerShape.help` | الدائري يناسب أغلب قطع الشوكولاتة… | Round suits most chocolates… | بازنەیی بۆ زۆربەی چوکلێتەکان دەگونجێت و چوارگۆشە بۆ پارچە و قوتووە چوارگۆشەکان. پەڕەیەکی A4ی ئامادەی چاپ (PDF) و وێنەی یەک لکێنەر (PNG) وەردەگرن. | خڕ بۆ پترییا چوکلێتان دگونجیت و چارگوشە بۆ پارچە و قوتیێن چارگوشە. هوین لاپەرەکێ A4 یێ ئامادەی چاپێ (PDF) و وێنەیێ ئێک لکێنەری (PNG) وەردگرن. | ◐ |
| 31 | `store.stickerShape.round` | دائري | Round | بازنەیی | خڕ | ◐ |
| 32 | `store.stickerShape.square` | مربع | Square | چوارگۆشە | چارگوشە | ● |

Names typed in Admin (seeded, editable there): the occasion «مولود جديد» (Sorani: لەدایکبوونی منداڵ / Badini: زاروکێ نوو)
and the new details: «اسم المولود» (ناوی منداڵ / ناڤێ زاروکی), «ولد أم بنت» (کوڕ یان کچ / کوڕ یان کچ), «اسم الأم» (ناوی دایک / ناڤێ دەیکێ),
«اسم الأب» (ناوی باوک / ناڤێ بابی), «تاريخ الولادة» (بەرواری لەدایکبوون / دیرۆکا ژدایکبوونێ), «عبارة قصيرة» (ڕستەیەکی کورت / ڕستەیەکا کورت).
And its two groups (subsections): «ولد» (کوڕ / کوڕ) and «بنت» (کچ / کچ).

## Batch 23 — date-of-birth format, bottle size, files-only designs — ✅ APPROVED (2026-10-17)

Applied to `ckb.json` / `bdn.json`. The order-form labels of the newborn designs below come from
`src/server/catalog/kurdish-labels.ts` (their activated versions are frozen).

| # | Key | Arabic | English | Sorani (ckb) | Badini (bdn) | Conf. |
|---|---|---|---|---|---|---|
| 1 | `store.birthDateFormat.heading` | طريقة كتابة تاريخ الولادة | How the date of birth is written | شێوازی نووسینی بەرواری لەدایکبوون | شێوازێ نڤیسینا دیرۆکا ژدایکبوونێ | ◐ |
| 2 | `store.birthDateFormat.help` | هكذا سيظهر التاريخ على الستوري والبطاقة والملصقات. | This is how the date appears on the story, card and stickers. | بەروارەکە بەم شێوەیە لەسەر ستۆری و کارت و لکێنەرەکان دەردەکەوێت. | دیرۆک ب ڤی شێوەی ل سەر ستۆری و کارت و لکێنەران دێ دیار بیت. | ◐ |
| 3 | `store.birthDateFormat.digits` | الأرقام | Digits | ژمارەکان | ژمارە | ● |
| 4 | `store.birthDateFormat.arab` | ٠١٢٣ | ٠١٢٣ | ٠١٢٣ | ٠١٢٣ | ● |
| 5 | `store.birthDateFormat.latn` | 0123 | 0123 | 0123 | 0123 | ● |
| 6 | `store.bottleSize.heading` | حجم قنينة الماء | Water bottle size | قەبارەی بوتڵی ئاو | قەبارێ بوتلا ئاڤێ | ◐ |
| 7 | `store.bottleSize.help` | الملصق يلتف حول القنينة… | The label wraps around the bottle… | لکێنەرەکە بە دەوری بوتڵەکەدا دەپێچرێت. قەبارەکە بە پارچە کاغەزێک بپشکنن؛ وێنەی PNG دەتوانرێت بۆ هەر بوتڵێک گەورە یان بچووک بکرێت. | لکێنەر ل دۆر بوتلێ دهێتە پێچان. قەبارێ ب پارچەکا کاغەزێ بپشکنن؛ وێنەیێ PNG دشێت بۆ هەر بوتلەکێ بهێتە مەزنکرن یان بچووککرن. | ◐ |
| 8 | `store.bottleSize.option` | {ml} مل | {ml} ml | {ml} مل | {ml} مل | ● |
| 9 | `store.filesPreview` | عرض الملفات | Files preview | پیشاندانی فایلەکان | نیشاندانا فایلان | ◐ |
| 10 | `store.filesOnlyHint` | هذا تصميم ملفات فقط للتحميل والطباعة (ستوري، بطاقة، ملصقات)، وليس دعوة إلكترونية. | This design comes as files to download and print… | ئەم دیزاینە تەنها فایلە بۆ داگرتن و چاپکردن (ستۆری، کارت، لکێنەر)، بانگهێشتی ئۆنلاین نییە. | ئەڤ دیزاینە بتنێ فایلن بۆ داگرتن و چاپکرنێ (ستۆری، کارت، لکێنەر)، ڤەخواندنا ئۆنلاین نینە. | ◐ |
| 11 | `store.wording.heading` | نص التصميم | Wording on the design | دەقی دیزاین | نڤیسینا دیزاینێ | ◐ |
| 12 | `store.wording.help` | يمكنكم اختيار كلمة الربط بين الاسمين. الآيات والنص العربي في التصميم يبقيان كما هما. | You can choose the word that joins the two names… | دەتوانن ئەو وشەیە هەڵبژێرن کە دوو ناوەکە پێکەوە دەبەستێتەوە. ئایەتەکان و دەقی عەرەبی دیزاینەکە وەک خۆیان دەمێننەوە. | هوین دشێن وێ پەیڤێ هەلبژێرن یا هەردوو ناڤان پێکڤە گرێدەدەت. ئایەت و نڤیسینا عەرەبی یا دیزاینێ وەک خۆ دمینن. | ◐ |
| 13 | `store.wording.arabic` | العربية (كما في التصميم) | Arabic (as in the design) | عەرەبی (وەک لە دیزاینەکەدا) | عەرەبی (وەک د دیزاینێ دا) | ◐ |
| 14 | `store.wording.inLanguage` | بلغة الدعوة ({language}) | In the invitation's language ({language}) | بە زمانی بانگهێشتنامەکە ({language}) | ب زمانێ داخوازنامێ ({language}) | ◐ |
| 15 | `store.wording.custom` | اكتبوا نصكم | Write your own | دەقی خۆتان بنووسن | نڤیسینا خۆ بنڤیسن | ◐ |
| 16 | `store.stickerShape.both` | الاثنان | Both | هەردووکیان | هەردوو | ◐ |

Order-form labels in the Embroidered Garden manifest (Kurdish shows the Arabic until approved):
«كلمة «بن»» → Sorani: وشەی «کوڕی» / Badini: پەیڤا «کوڕێ» (◐).

Text inside the Embroidered Garden design (`themes/embroidered-garden/v1/copy.ts`; Kurdish uses the Arabic until approved;
the Quran verse and du'a always stay Arabic):
«رزقنا الله بأجمل العطايا» → stays Arabic in every language (owner, 2026-10-11): no Kurdish needed.
«بن» (son of) → ✅ owner (2026-10-11): Sorani «کوڕی», Badini «کوڕێ» (the default on Kurdish orders; «بن» stays a choice).

Order-form labels in the Bluebird Garden manifest (`themes/bluebird-garden/v1/manifest.ts`; Kurdish shows the Arabic until approved):
- «ترتيب المولود» / Birth order → Sorani: ڕیزبەندی منداڵ / Badini: ڕیزبەندیا زاروکی (◐).
- «كلمة «بن»» → Sorani: وشەی «کوڕی» / Badini: پەیڤا «کوڕێ» (◐).
- «إظهار اسم الأب على ملصقات الشوكولاتة وملصق القنينة» / Show the father's name on the chocolate stickers and bottle label →
  Sorani: ناوی باوک لەسەر لکێنەری چوکلێت و لکێنەری بوتڵ پیشان بدرێت / Badini: ناڤێ بابی ل سەر لکێنەرێن چوکلێتێ و لکێنەرا بوتلێ بهێتە نیشاندان (◐).

Text inside the Bluebird Garden design (praise lines, birth-order line, du'a) stays Arabic in every language (owner, 2026-10-11).

Order-form labels in the Rosebird Garden manifest (#8, `themes/rosebird-garden/v1/manifest.ts`; Kurdish shows the Arabic until approved):
- «ترتيب المولودة» / Birth order → Sorani: ڕیزبەندی کچۆڵە / Badini: ڕیزبەندیا کچکێ (◐).
- «كلمة «بنت»» → Sorani: وشەی «کچی» / Badini: پەیڤا «کچا» (◐).
- The father tick box: as for Bluebird Garden above.

Text inside the Rosebird Garden design: «بنت» (daughter of) → ✅ owner (2026-10-12): Sorani «کچی», Badini «کچا»
(the default on Kurdish orders; «بنت» stays a choice). The praise lines, birth-order line and du'a stay Arabic.

Example names for theme previews (`invitationSamples.names`: boys', girls', men's and women's names, short and long,
separated by `|`; each design takes its own by its number). Kurdish previews use the Arabic names until the owner
gives Kurdish lists (same order, same count) or approves them in Arabic script.


Order-form labels in the Swan Garden manifest (#9, `themes/swan-garden/v1/manifest.ts`): «كلمة «بنت»» and the father tick box,
as for Rosebird Garden and Bluebird Garden above. The design's text (praise, «أكرمنا الله بأجمل العطايا», du'a) stays Arabic.

## Batch 24 — separate terms for newborn invitations — ✅ APPROVED (2026-10-17)

Newborn orders accept their own terms («شروط دعوات المولود», `/legal/terms-newborn`); weddings and the other
occasions keep the main terms. The text is seeded as a draft in Admin → Legal policies (Arabic and English); it can
only be published once the Kurdish is in. The approved Kurdish below is now seeded into that draft (with the
package online-time sentence, like the Arabic); the owner publishes it in Admin. Sections shared with the main terms reuse their approved Kurdish word for word.

| # | Key | Arabic | English | Sorani (ckb) | Badini (bdn) | Conf. |
|---|---|---|---|---|---|---|
| 1 | `footer.termsNewborn` | شروط دعوات المولود | Newborn invitation terms | مەرجەکانی بانگهێشتنامەی منداڵ | مەرجێن داخوازنامێن زاروکی | ◐ |

### Policy text: newborn terms — Sorani (ckb)

```text
ئەم مەرجانە ڕێکخەری کڕینی بانگهێشتنامەی منداڵی تازە لەدایکبوو و زیادەکانین لە ماڵپەری بەهجە. بە تەواوکردنی داواکاری، ڕازی دەبیت پێیان.

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
- بانگهێشتنامەکە ٣٠ ڕۆژ لە بەرواری بڵاوکردنەوەوە بڵاو دەمێنێتەوە، پاشان پەیامێکی کۆتاییهاتنی بانگهێشتنامەکە بۆ سەردانکەران دەردەکەوێت. دەکرێت بە ڕێککەوتن لەگەڵمان درێژ بکرێتەوە.

## ناوەڕۆکی بانگهێشتنامە
- تۆ بەرپرسیاریت لە دروستی ئەو زانیارییانەی دەینووسیت و لە مافی بڵاوکردنەوەیان.
- ناوەڕۆکی سووکایەتیئامێز یان نایاسایی ڕێگەپێدراو نییە، و مافی ئەوەمان هەیە هەر بانگهێشتنامەیەک کە پێچەوانەی ئەمە بێت ڕابگرین.
- هەڵەکانی زانیاری بانگهێشتنامە دەکرێت بە پەیوەندیکردن پێمانەوە لە ماوەی بڵاوکردنەوەدا ڕاست بکرێنەوە، و دوای ڕاستکردنەوە فایلەکان نوێ دەکرێنەوە.

## خاوەندارێتی
- دیزاین و مۆسیقا و نەرمەکاڵاکان موڵکی بەهجەن یان مۆڵەتیان بۆ وەرگیراوە. دەتوانیت بانگهێشتنامەکەت بەکاربهێنیت و فایلەکانی چاپ و هاوبەش بکەیت تەنها بۆ بۆنەکەت؛ نابێت بیانفرۆشیت یان دیزاینەکە بۆ کەسێکی تر بەکاربهێنیت.

## گۆڕانکاری و پەیوەندی
- لەوانەیە ئەم مەرجانە نوێ بکەینەوە، و لەسەر هەر داواکارییەک ئەو وەشانە جێبەجێ دەکرێت کە لە کاتی داواکاریدا ڕازی بوویت پێی.
- بۆ پەیوەندی: لە ڕێگەی واتسئاپ یان ڕێگاکانی پەیوەندی لە پەرەی «پەیوەندیمان پێوە بکە».
```

### Policy text: newborn terms — Badini (bdn)

```text
ئەڤ مەرجە کڕینا داخوازنامێن زاروکێ نوو و زێدەکرنێن وان ژ مالپەرێ بەهجە ڕێکدئێخن. ب تەمامکرنا داخوازیێ تو ل سەر وان ڕازی دبی.

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
- داخوازنامە ٣٠ ڕۆژان ژ دیرۆکا بەلاڤکرنێ بەلاڤکری دمینیت، پاشان نامەیەک بۆ سەرەدانکەران دیار دبیت کو داخوازنامە ب دوماهی هاتیە. دبیت ب ڕێککەفتنێ دگەل مە بهێتە درێژکرن.

## ناڤەروکا داخوازنامێ
- تو بەرپرسیاری ژ دروستیا وان زانیاریێن تو دنڤیسی و ژ مافێ تە د بەلاڤکرنا وان دا.
- ناڤەروکا ڕێزشکێن یان نەیاسایی نە ڕێپێدایە، و مافێ مە هەیە هەر داخوازنامەکا ڤێ یەکێ بشکێنیت ڕاوەستینین.
- خەلەتیێن زانیاریێن داخوازنامێ دبیت ب پەیوەندیکرنێ ب مە ڤە د دەمێ بەلاڤکرنێ دا بهێنە ڕاستکرن، و پشتی ڕاستکرنێ فایل دهێنە نووکرن.

## خودانداری
- دیزاین و مۆزیک و نەرمەکاڵا یێن بەهجە نە یان مۆلەت بۆ هاتیە وەرگرتن. تو دشێی داخوازناما خۆ بکاربینی و فایلێن وێ چاپ بکەی و پارڤە بکەی بتنێ بۆ ئاهەنگا خۆ؛ نابیت تو بفرۆشی یان دیزاینێ بۆ کەسەکێ دی بکاربینی.

## گوهۆڕین و پەیوەندی
- دبیت ئەم ڤان مەرجان نوو بکەین، و ل سەر هەر داخوازیەکێ ئەو وەشان دهێتە جێبەجێکرن یا تو دەمێ داخوازیێ ل سەر ڕازی بووی.
- بۆ پەیوەندیێ: ب ڕێکا واتسئاپێ یان ڕێکێن پەیوەندیێ ل لاپەرێ «پەیوەندیێ ب مە بکە».
```

## Batch 25 — Royal Olive Crest: initials on the wax seal — ✅ APPROVED (2026-10-14)

The owner approved every row as suggested; all live (row 1 in the Field Library, rows 3–4 in the design's
manifest; the Kurdish name is the design's starting name in Admin → Themes). The design's own lines
reuse the owner-approved Olive Ring Box wording (same Arabic sentences), and the Quran verse stays in Arabic.

| # | Where | Arabic | English | Sorani (ckb) | Badini (bdn) | Conf. |
|---|---|---|---|---|---|---|
| 1 | Field Library label `seal_initials` (Admin) | الأحرف الأولى على الختم | Initials on the seal | پیتە سەرەتاییەکان لەسەر مۆر | تیپێن ئێکێ ل سەر مۆرێ | ○ |
| 2 | `store.sealInitialsHint` | اختياري: اتركه فارغًا ونكتب الحرف الأول من كل اسم (العريس أولًا)، أو اكتب الأحرف كما تريدها. | Optional: leave it empty and we write the first letter of each name (groom first), or type the initials as you want them. | ئارەزوومەندانە: بەتاڵی بهێڵە و پیتی یەکەمی هەر ناوێک دەنووسین (زاوا یەکەم)، یان پیتەکان وەک دەتەوێت بنووسە. | ب دلێ خۆ: ڤالا بهێلە و ئەم دێ تیپا ئێکێ یا هەر ناڤەکی نڤیسین (زاڤا ئێکەم)، یان تیپان وەکی تە دڤێت بنڤیسە. | ○ |
| 3 | Order-form label of the design's `sealJoin` choice (manifest, Arabic/English only today) | الرمز بين الحرفين على الختم | Symbol between the initials on the seal | هێمای نێوان دوو پیتەکە لەسەر مۆر | نیشانا د ناڤبەرا هەردوو تیپان دا ل سەر مۆرێ | ○ |
| 4 | Design name (Admin → Themes) | الشعار الملكي الزيتوني | Royal Olive Crest | دروشمی شاهانەی زەیتوونی | نیشانا شاهانە یا زەیتوونی | ○ |

## Batch 26 — Royal Olive Crest: leaf and heart cards (shaped printed cards) — ✅ APPROVED (2026-10-14)

The owner approved every row as suggested; all live (row 9 in the design's manifest). Admin texts are Arabic/English only.

| # | Key | Arabic | English | Sorani (ckb) | Badini (bdn) | Conf. |
|---|---|---|---|---|---|---|
| 1 | `store.features.card_shapes` | بطاقة مطبوعة بشكل مميّز، مثل ورقة شجر أو قلب، تختارها بدل البطاقة | A specially shaped printed card, such as a leaf or a heart, instead of the card | کارتێکی چاپکراوی شێوە تایبەت، وەک گەڵایەک یان دڵێک، لە جیاتی کارتەکە | کارتەکا چاپکری ب شێوەیەکێ تایبەت، وەکی بەلگەکێ یان دلەکی، ل شوینا کارتێ | ○ |
| 2 | `store.cardShape.heading` | شكل البطاقة المطبوعة | Printed card shape | شێوەی کارتی چاپکراو | شێوێ کارتا چاپکری | ◐ |
| 3 | `store.cardShape.help` | اختر البطاقة العادية أو أحد أشكال هذا التصميم… | Choose the regular card or one of this design's shapes… | کارتە ئاساییەکە یان یەکێک لە شێوەکانی ئەم دیزاینە هەڵبژێرە. فایلێکی PDF بۆ چاپ و وێنەیەکی PNG بە باکگراوندی ڕوون وەردەگریت، و هێڵی بڕینی دەوری شێوەکە بۆ چاپخانە ئامادە دەکەین. | کارتا ئاسایی یان ئێک ژ شێوەیێن ڤی دیزاینی هەلبژێرە. تو دێ فایلەکێ PDF بۆ چاپێ و وێنەیەکێ PNG ب پشتەکا ڕوهن وەرگری، و ئەم دێ هێلا بڕینێ ل دۆر شێوەی بۆ چاپخانێ ئامادە کەین. | ○ |
| 4 | `store.cardShape.card` | البطاقة | The card | کارتەکە | کارت | ● |
| 5 | `store.cardShape.size` | {w} × {h} سم | {w} × {h} cm | {w} × {h} سم | {w} × {h} سم | ● |
| 6 | `receipt.shapeCardHelp` | بطاقتك المطبوعة بالشكل الذي اخترته… | Your printed card in the shape you chose… | کارتی چاپکراوەکەت بەو شێوەیەی هەڵتبژارد: فایلێکی PDF ئامادەی چاپ (شێوەکە لەسەر پەڕەکەی). چاپخانە بە دەوری سنووری شێوەکەدا دەیبڕێت. ئەمەش هەردوو ڕووەکەیەتی وەک وێنەی PNG بە باکگراوندی ڕوون، ئەگەر چاپخانە ویستی قەبارەکەی بگۆڕێت: | کارتا تە یا چاپکری ب وی شێوەی یێ تە هەلبژارتی: فایلەکێ PDF یێ ئامادەی چاپێ (شێوە ل سەر لاپەرێ خۆ). چاپخانە ل دۆر سنوورێ شێوەی دبڕیت. ئەڤە هەردوو ڕوین وەک وێنێن PNG ب پشتەکا ڕوهن ژی، ئەگەر چاپخانێ ڤیا قەبارێ بگوهۆڕیت: | ○ |
| 7 | `receipt.shapePngFront` | صورة الوجه (PNG) | Front picture (PNG) | وێنەی ڕووی پێشەوە (PNG) | وێنێ ڕویێ پێشیێ (PNG) | ◐ |
| 8 | `receipt.shapePngBack` | صورة الظهر (PNG) | Back picture (PNG) | وێنەی ڕووی پشتەوە (PNG) | وێنێ ڕویێ پشتێ (PNG) | ◐ |
| 9 | Shape names (Royal Olive Crest manifest, Arabic/English only today) | ورقة شجر / قلب | Leaf / Heart | گەڵا / دڵ | بەلگ / دل | ◐ |

## Batch 27 — Royal Olive Crest: the leaf and the heart sold separately — ✅ APPROVED (2026-10-14)

The single feature "shaped printed card" (batch 26 row 1, `store.features.card_shapes`) became two, so a package can
offer the leaf, the heart or both. The owner approved both rows as suggested; live. Admin texts
are Arabic/English only.

| # | Key | Arabic | English | Sorani (ckb) | Badini (bdn) | Conf. |
|---|---|---|---|---|---|---|
| 1 | `store.features.card_leaf` | بطاقة مطبوعة على شكل ورقة شجر، تختارها بدل البطاقة | A leaf-shaped printed card, instead of the card | کارتێکی چاپکراو بە شێوەی گەڵا، لە جیاتی کارتەکە | کارتەکا چاپکری ب شێوێ بەلگی، ل شوینا کارتێ | ◐ |
| 2 | `store.features.card_heart` | بطاقة مطبوعة على شكل قلب، تختارها بدل البطاقة | A heart-shaped printed card, instead of the card | کارتێکی چاپکراو بە شێوەی دڵ، لە جیاتی کارتەکە | کارتەکا چاپکری ب شێوێ دلی، ل شوینا کارتێ | ◐ |

## Batch 28 — Royal Olive Crest: the seal's initials in two boxes — ✅ APPROVED (2026-10-15)

The initials on the wax seal are now typed in two small boxes, one per person; these are the captions under the
boxes (the same words as the approved name labels «ناوی زاوا / ناوی بووک»). The owner approved both rows as
suggested; live.

| # | Key | Arabic | English | Sorani (ckb) | Badini (bdn) | Conf. |
|---|---|---|---|---|---|---|
| 1 | `store.sealInitialsFirst` | العريس | Groom | زاوا | زاڤا | ● |
| 2 | `store.sealInitialsSecond` | العروس | Bride | بووک | بویک | ● |

## Batch 29 — Package checklist: what every package includes — ✅ APPROVED (2026-10-15)

The package checklist on a theme page now starts with the private invitation link and the details the customer
fills in (the field labels themselves are already approved), instead of "7 details to fill in". The two names are
joined into one line («ناوی زاوا و ناوی بووک») and the date and time are one line. The owner gives standing approval
for Kurdish in this work; live.

| # | Key | Arabic | English | Sorani (ckb) | Badini (bdn) | Conf. |
|---|---|---|---|---|---|---|
| 1 | `store.includesLink` | رابط خاص بدعوتكم ترسلونه على واتساب | A private link to your invitation to send on WhatsApp | بەستەرێکی تایبەت بە بانگهێشتنامەکەتان بۆ ناردن لە واتسئاپ | لینکەکا تایبەت ب داخوازناما هەوە بۆ فرێکرنێ ل واتسئاپێ | ● |
| 2 | `store.includesPair` | {a} و{b} | {a} and {b} | {a} و {b} | {a} و {b} | ● |
| 3 | `store.includesWhen` | التاريخ والوقت | Date and time | بەروار و کات | دیرۆک و دەم | ● |

`store.fieldsCount` («# زانیاری بۆ پڕکردنەوە») is no longer used and was removed.

## Batch 30 — Royal Olive Crest v2: thank-you line on the printed cards — ✅ APPROVED (2026-10-15)

A short title above the names on the front of every printed card (A5, leaf, heart); the customer can keep it or
write their own (manifest `wording.cardThanks`, defaults to the invitation's language). Standing approval; live
with v2.

| # | Key | Arabic | English | Sorani (ckb) | Badini (bdn) | Conf. |
|---|---|---|---|---|---|---|
| 1 | `cardThanks` (default line) | شكرًا لحضوركم حفل زفافنا | Thank you for coming to our wedding | سوپاس بۆ ئامادەبوونتان لە ئاهەنگی زەماوەندەکەمان | سوپاس بۆ ئامادەبوونا هەوە ل ئاهەنگا داوەتا مە | ● |
| 2 | `cardThanks` (order-form label) | سطر الشكر على واجهة البطاقة المطبوعة | Thank-you line on the front of the printed card | دێڕی سوپاس لەسەر ڕووی کارتی چاپکراو | دێڕا سوپاسێ ل سەر ڕوویێ کارتا چاپکری | ● |
## Batch 31 — four new wedding designs: their own lines — ✅ APPROVED (2026-10-15)

Burgundy & Lace (B, #12), Espresso & Ivory (E, #13), Winter Flower (W, #14) and Vintage Love Letters (V, #15).
These are the lines each design writes itself (in each theme's `copy.ts`). The owner approved every row as
suggested ("approve all"); live in the four themes, and the design names in their manifests. Glossary reused from approved rows: wedding هاوسەرگیری / داوەت, joy خۆشی / شاهی, presence ئامادەبوون,
celebration ئاهەنگ. A «/» marks a line break in the design. Lines shared by several designs are listed once.

| # | Arabic | English | Suggested Sorani (ckb) | Suggested Badini (bdn) | Conf. | Designs |
|---|---|---|---|---|---|---|
| 1 | بمناسبة زفافنا | The wedding of | بە بۆنەی هاوسەرگیریمان | ب بۆنا داوەتا مە | ● | B, E, W |
| 2 | ندعوكم لمشاركتنا / فرحة زفافنا | You are cordially invited to the wedding of | بانگهێشتتان دەکەین بۆ بەشداریکردن / لە خۆشیی هاوسەرگیریمان | مە هوین داخواز کرینە بۆ پشکداریێ / د شاهیا داوەتا مە دا | ◐ | B, E |
| 3 | ننتظر مشاركتكم / أجمل أيامنا | We can’t wait to celebrate with you! | چاوەڕێی بەشداریتانین / لە خۆشترین ڕۆژمان | ئەم چاڤەڕێی پشکداریا هەوەینە / د خۆشترین ڕۆژا مە دا | ◐ | B, E |
| 4 | دعوة زفاف | You are invited | بانگهێشتنامەی هاوسەرگیری | داخوازناما داوەتێ | ● | B, E |
| 5 | بكل الحب | All of our love / With love | بە هەموو خۆشەویستییەوە | ب هەمی ڤیانێ | ◐ | all |
| 6 | موعد فرحتنا يقترب | Countdown to | کاتی خۆشیمان نزیک دەبێتەوە | دەمێ شاهیا مە نێزیک دبیت | ◐ | B, E |
| 7 | نبدأ حكايتنا | “I Do” | چیرۆکەکەمان دەست پێدەکەین | ئەم دەست ب چیرۆکا خۆ دکەین | ◐ | B, E |
| 8 | الزمان والمكان | The date & place | کات و شوێن | دەم و جه | ● | B, E |
| 9 | تفاصيل الزفاف | Details | زانیارییەکانی هاوسەرگیری | زانیاریێن داوەتێ | ◐ | all |
| 10 | موعد الاحتفال | The celebration begins | کاتی ئاهەنگ | دەمێ ئاهەنگێ | ● | B, E |
| 11 | مكان اللقاء | Join us at | شوێنی دیدار | جهێ هەڤدیتنێ | ◐ | B, E |
| 12 | بانتظار ردكم / ننتظر ردكم | Kindly reply | چاوەڕێی وەڵامتانین | ئەم چاڤەڕێی بەرسڤا هەوەینە | ● | all |
| 13 | تأكيد الحضور | Rsvp | دڵنیاکردنەوەی ئامادەبوون | پشتڕاستکرنا ئامادەبوونێ | ◐ | B, E |
| 14 | يسعدنا أن تشاركونا فرحتنا | We would love to celebrate with you | خۆشحاڵ دەبین بەشداری خۆشیمان بکەن | دێ دلخۆش بین ئەگەر هوین پشکداریێ د شاهیا مە دا بکەن | ◐ | B, E |
| 15 | رسائل الأهل والأحبة في يوم زفافنا (keepsake) | Wishes from our family and friends | نامەی خێزان و خۆشەویستان لە ڕۆژی هاوسەرگیریماندا | نامێن مالباتێ و هەڤالان د ڕۆژا داوەتا مە دا | ◐ | B, E |
| 16 | شكرًا لكل من شاركنا فرحتنا (keepsake) | Thank you for sharing our joy | سوپاس بۆ هەموو ئەوانەی بەشداری خۆشیمان بوون | سوپاس بۆ هەمی ئەوێن پشکداری د شاهیا مە دا کری | ● | B, E |
| 17 | موعد فرحتنا | Save the date | کاتی خۆشیمان | دەمێ شاهیا مە | ◐ | W, V |
| 18 | نحتفل معكم يوم (before the date) | A celebration on | لەگەڵتان ئاهەنگ دەگێڕین لە ڕۆژی | ئەم دێ دگەل هەوە ئاهەنگێ گێڕین ل ڕۆژا | ○ | W |
| 19 | معاً دائماً | Together, always | هەمیشە پێکەوە | هەردەم پێکڤە | ● | W |
| 20 | بداية حكايتنا معاً | Our next chapter / A beautiful beginning | دەستپێکی چیرۆکی پێکەوەمان | دەستپێکا چیرۆکا مە یا پێکڤە | ◐ | W, V |
| 21 | تكتمل فرحتنا بحضوركم ومشاركتكم أجمل أيامنا. | Your presence will make our day complete. | خۆشیمان بە ئامادەبوون و بەشداریتان لە خۆشترین ڕۆژمان تەواو دەبێت. | شاهیا مە ب ئامادەبوون و پشکداریا هەوە د خۆشترین ڕۆژا مە دا تەمام دبیت. | ◐ | W, V |
| 22 | حتى نبدأ حكايتنا | Until our next chapter | تا چیرۆکەکەمان دەست پێدەکەین | هەتا ئەم دەست ب چیرۆکا خۆ دکەین | ◐ | W, V |
| 23 | ننتظر يوم فرحتنا | Counting the days | چاوەڕێی ڕۆژی خۆشیمانین | ئەم چاڤەڕێی ڕۆژا شاهیا خۆینە | ◐ | W, V |
| 24 | موعد ننتظره معكم | A note for your diary | کاتێک کە لەگەڵتان چاوەڕێی دەکەین | دەمەکێ ئەم دگەل هەوە چاڤەڕێ دکەین | ◐ | W, V |
| 25 | الساعة (before the time) | At | کاتژمێر | دەمژمێر | ◐ | W, V |
| 26 | بمشاركة أهلنا وأحبتنا | Together with our families | بە بەشداریی خێزان و خۆشەویستانمان | ب پشکداریا مالبات و هەڤالێن مە | ◐ | W, V |
| 27 | مكان الاحتفال | The celebration | شوێنی ئاهەنگ | جهێ ئاهەنگێ | ● | W, V |
| 28 | ننتظر رسالتكم | A letter back to us | چاوەڕێی نامەکەتانین | ئەم چاڤەڕێی نامەیا هەوەینە | ◐ | W, V |
| 29 | حجزنا لكم مكاناً في فرحتنا. | We have saved a place for you. | شوێنێکمان بۆ ئێوە لە خۆشیماندا گرتووە. | مە جهەک بۆ هەوە د شاهیا خۆ دا گرتییە. | ◐ | W, V |
| 30 | شكراً من القلب لكل من شاركنا فرحتنا (keepsake) | With heartfelt thanks to everyone who shared our joy | لە دڵەوە سوپاس بۆ هەموو ئەوانەی بەشداری خۆشیمان بوون | ژ دل سوپاس بۆ هەمی ئەوێن پشکداری د شاهیا مە دا کری | ◐ | W, V |
| 31 | رسالة صغيرة لبداية جميلة (under the Open button) | A little letter. A beautiful beginning. | نامەیەکی بچووک بۆ دەستپێکێکی جوان | نامەیەکا بچووک بۆ دەستپێکەکا جوان | ◐ | V |
| 32 | تبدأ حكايتنا بحضوركم. (on the letter) | Our next chapter begins with you. | چیرۆکەکەمان بە ئامادەبوونتان دەست پێدەکات. | چیرۆکا مە ب ئامادەبوونا هەوە دەست پێدکەت. | ◐ | V |
| 33 | دعوة / زفاف (the poster title, two boxes) | Wedding / Invitation | بانگهێشتنامە / هاوسەرگیری | داخوازنامە / داوەت | ◐ | V |
| 34 | إلى أهلنا وأحبتنا، | To our dearest family & friends, | بۆ خێزان و خۆشەویستانمان، | بۆ مالبات و هەڤالێن مە، | ◐ | V |

Design names (manifest `title`; they become the designs' Kurdish names in Admin, which the owner can change):

| # | Arabic | English | Suggested Sorani (ckb) | Suggested Badini (bdn) | Conf. |
|---|---|---|---|---|---|
| 35 | العنابي والدانتيل | Burgundy & Lace | عەنابی و دانتێلا | عەنابی و دانتێل | ○ |
| 36 | الإسبريسو والعاجي | Espresso & Ivory | ئێسپرێسۆ و عاجی | ئێسپرێسۆ و عاجی | ○ |
| 37 | زهرة الشتاء | Winter Flower | گوڵی زستان | گولا زڤستانێ | ● |
| 38 | رسائل الحب العتيقة | Vintage Love Letters | نامە کۆنەکانی خۆشەویستی | نامێن کەڤن یێن ڤیانێ | ◐ |

## Batch 32 — how long a package stays online (30 days, 60 days, 1 year, forever) — ✅ APPROVED (2026-10-16)

The owner now picks per package how long the invitation stays online, and a package with several card shapes lets the
customer tick one, several or all of the cards (rows 13–14; the approved single-choice help text stays live in Kurdish until row 13 is approved). The packages on a theme page show it
(«Online for 30 days» … «Online forever»), and the receipt shows «No end date» for a package that never ends.
The home page's line and first FAQ answer no longer promise only 30 days in Arabic and English. Their approved Kurdish
said 30 days; rows 10–11 replace it. Approved by the owner and live, rows 1–14 (row 12 in the starter Terms).

| # | Key | Arabic | English | Suggested Sorani (ckb) | Suggested Badini (bdn) | Conf. |
|---|---|---|---|---|---|---|
| 1 | `common.lifetime.30` | ٣٠ يوماً | 30 days | ٣٠ ڕۆژ | ٣٠ ڕۆژ | ● |
| 2 | `common.lifetime.60` | ٦٠ يوماً | 60 days | ٦٠ ڕۆژ | ٦٠ ڕۆژ | ● |
| 3 | `common.lifetime.365` | سنة واحدة | 1 year | ساڵێک | ساڵەک | ● |
| 4 | `common.lifetime.forever` | للأبد | Forever | بۆ هەمیشە | بۆ هەردەم | ◐ |
| 5 | `common.onlineFor.30` | متاحة لمدة ٣٠ يوماً | Online for 30 days | بۆ ماوەی ٣٠ ڕۆژ بەردەستە | بۆ ماوێ ٣٠ ڕۆژان بەردەستە | ◐ |
| 6 | `common.onlineFor.60` | متاحة لمدة ٦٠ يوماً | Online for 60 days | بۆ ماوەی ٦٠ ڕۆژ بەردەستە | بۆ ماوێ ٦٠ ڕۆژان بەردەستە | ◐ |
| 7 | `common.onlineFor.365` | متاحة لمدة سنة | Online for 1 year | بۆ ماوەی ساڵێک بەردەستە | بۆ ماوێ ساڵەکێ بەردەستە | ◐ |
| 8 | `common.onlineFor.forever` | متاحة للأبد | Online forever | بۆ هەمیشە بەردەستە | بۆ هەردەم بەردەستە | ◐ |
| 9 | `common.noEnd` | بلا تاريخ انتهاء | No end date | بێ بەرواری کۆتایی | بێ دیرۆکا دوماهیێ | ◐ |
| 10 | `home.featureDays` | متاحة ٣٠ يوماً أو سنة أو للأبد حسب الباقة | Online for 30 days, a year or forever, depending on the package | ٣٠ ڕۆژ، ساڵێک یان بۆ هەمیشە بەردەستە، بەپێی پاکێجەکە | ٣٠ ڕۆژان، ساڵەکێ یان بۆ هەردەم بەردەستە، ل دویڤ پاکێجێ | ◐ |
| 11 | `home.faq1a` | حسب الباقة التي تختارونها: ٣٠ يوماً أو ٦٠ يوماً أو سنة أو للأبد، من لحظة نشرها. تظهر مدة كل باقة عليها، ويمكنكم التواصل معنا لتمديدها. | It depends on the package you choose: 30 days, 60 days, a year, or forever, counted from the moment it is published. Each package shows how long it lasts, and you can contact us to extend it. | بەپێی ئەو پاکێجەی هەڵیدەبژێرن: ٣٠ ڕۆژ، ٦٠ ڕۆژ، ساڵێک یان بۆ هەمیشە، لە کاتی بڵاوکردنەوەیەوە. ماوەی هەر پاکێجێک لەسەری نووسراوە، و دەتوانن پەیوەندیمان پێوە بکەن بۆ درێژکردنەوەی. | ل دویڤ وی پاکێجێ هوین هەلدبژێرن: ٣٠ ڕۆژان، ٦٠ ڕۆژان، ساڵەکێ یان بۆ هەردەم، ژ دەمێ بەلاڤکرنا وێ. ماوێ هەر پاکێجەکێ ل سەر نڤیسییە، و هوین دشێن پەیوەندیێ ب مە بکەن بۆ درێژکرنا وێ. | ◐ |
| 13 | `store.cardShape.help` | اختر البطاقة العادية أو أحد أشكال هذا التصميم أو أكثر من واحد. تحصل لكل بطاقة تختارها على ملف PDF خاص للطباعة (وللشكل صورة PNG بخلفية شفافة أيضاً)، ونجهّز للمطبعة خط القص حول كل شكل. | Tick the regular card, one of this design's shapes, or several. Each card you tick comes as its own print-ready PDF (a shape also as a transparent PNG), and the print shop gets the cut line around each shape. | کارتە ئاساییەکە، یەکێک لە شێوەکانی ئەم دیزاینە، یان زیاتر لە یەکێک هەڵبژێرە. بۆ هەر کارتێک کە هەڵیدەبژێریت فایلێکی PDFـی تایبەت بۆ چاپ وەردەگریت (بۆ شێوەکانیش وێنەیەکی PNG بە باکگراوندی ڕوون)، و هێڵی بڕینی دەوری هەر شێوەیەک بۆ چاپخانە ئامادە دەکەین. | کارتا ئاسایی، ئێک ژ شێوەیێن ڤی دیزاینی، یان پتر ژ ئێکێ هەلبژێرە. بۆ هەر کارتەکا تو هەلدبژێری دێ فایلەکێ PDF یێ تایبەت بۆ چاپێ وەرگری (بۆ شێوەیان ژی وێنەیەکێ PNG ب پشتەکا ڕوهن)، و ئەم دێ هێلا بڕینێ ل دۆر هەر شێوەیەکێ بۆ چاپخانێ ئامادە کەین. | ◐ |
| 14 | `store.cardShape.required` | اختر بطاقة واحدة على الأقل. | Choose at least one card. | لانیکەم کارتێک هەڵبژێرە. | کێمترین ئێک کارتێ هەلبژێرە. | ◐ |


The starter Terms (`src/server/legal/seed.ts`, only used before the owner publishes their own) now say the invitation stays
online for its package's time. Their Kurdish line still says 30 days and was left as it is; suggested replacements
(the live Terms are edited in Admin → Legal):

| # | Where | Suggested Sorani (ckb) | Suggested Badini (bdn) | Conf. |
|---|---|---|---|---|
| 12 | Terms, the invitation's online time | بانگهێشتنامەکە بە درێژایی ماوەی پاکێجەکە (٣٠ ڕۆژ، ٦٠ ڕۆژ، ساڵێک یان بۆ هەمیشە) لە بەرواری بڵاوکردنەوەوە بڵاو دەمێنێتەوە، پاشان پەیامێکی کۆتاییهاتنی بانگهێشتنامەکە بۆ سەردانکەران دەردەکەوێت. دەکرێت بە ڕێککەوتن لەگەڵمان درێژ بکرێتەوە. | داخوازنامە ب درێژاهیا ماوێ پاکێجێ (٣٠ ڕۆژان، ٦٠ ڕۆژان، ساڵەکێ یان بۆ هەردەم) ژ دیرۆکا بەلاڤکرنێ بەلاڤکری دمینیت، پاشان نامەیەک بۆ سەرەدانکەران دیار دبیت کو داخوازنامە ب دوماهی هاتیە. دبیت ب ڕێککەفتنێ دگەل مە بهێتە درێژکرن. | ◐ |

## Batch 33 — the four wedding designs v2: families, engagement wording, the arch card — ✅ APPROVED (2026-10-17)

Burgundy & Lace (B, #12), Espresso & Ivory (E, #13), Winter Flower (W, #14) and Vintage Love Letters (V, #15), version 2.
Each design now has a section for the two families (the customer types each family's name), and says «engagement»
instead of «wedding» when it is sold as an engagement. Row 17 («قوس») is also used by the graduation designs. Glossary reused from approved rows: engagement دەستگیرانی / دەزگرانی (section names),
fiancé / fiancée دەستگیرانی کوڕ / کچ, دەزگرانێ کوڕ / دەزگرانا کچ (field labels), family بنەماڵە / مالبات.

| # | Where | Arabic | English | Suggested Sorani (ckb) | Suggested Badini (bdn) | Conf. |
|---|---|---|---|---|---|---|
| 1 | All four: families heading | بمباركة العائلتين | Together with their families | بە بەرەکەتی هەردوو بنەماڵە | ب بەرەکەتا هەردوو مالباتان | ◐ |
| 2 | All four: caption, wedding | عائلة العريس | The groom’s family | بنەماڵەی زاوا | مالباتا زاڤای | ● |
| 3 | All four: caption, wedding | عائلة العروس | The bride’s family | بنەماڵەی بووک | مالباتا بویکێ | ● |
| 4 | All four: caption, engagement | عائلة الخطيب | The groom-to-be’s family | بنەماڵەی دەستگیرانی کوڕ | مالباتا دەزگرانێ کوڕ | ◐ |
| 5 | All four: caption, engagement | عائلة الخطيبة | The bride-to-be’s family | بنەماڵەی دەستگیرانی کچ | مالباتا دەزگرانا کچ | ◐ |
| 6 | B, E, W: engagement of batch 31 row 1 | بمناسبة خطوبتنا | The engagement of | بە بۆنەی دەستگیرانیمان | ب بۆنا دەزگرانیا مە | ● |
| 7 | B, E: engagement of batch 31 row 2 | ندعوكم لمشاركتنا / فرحة خطوبتنا | You are cordially invited to the engagement of | بانگهێشتتان دەکەین بۆ بەشداریکردن / لە خۆشیی دەستگیرانیمان | مە هوین داخواز کرینە بۆ پشکداریێ / د شاهیا دەزگرانیا مە دا | ◐ |
| 8 | B, E: engagement of batch 31 row 4 | دعوة خطوبة | You are invited | بانگهێشتنامەی دەستگیرانی | داخوازناما دەزگرانیێ | ● |
| 9 | All four: engagement of batch 31 row 9 | تفاصيل الخطوبة | Details | زانیارییەکانی دەستگیرانی | زانیاریێن دەزگرانیێ | ◐ |
| 10 | B, E keepsake: engagement of batch 31 row 15 | رسائل الأهل والأحبة في يوم خطوبتنا | Wishes from our family and friends | نامەی خێزان و خۆشەویستان لە ڕۆژی دەستگیرانیماندا | نامێن مالباتێ و هەڤالان د ڕۆژا دەزگرانیا مە دا | ◐ |
| 11 | V: poster title, second word (under «دعوة») | خطوبة | Engagement | دەستگیرانی | دەزگرانی | ● |
| 12 | `store.features.card_arch` | بطاقة مطبوعة على شكل قوس أو إطار مزخرف، تختارها بدل البطاقة | An arch- or frame-shaped printed card, instead of the card | کارتێکی چاپکراو بە شێوەی کەوانە یان چوارچێوەی نەخشێنراو، لە جیاتی کارتەکە | کارتەکا چاپکری ب شێوێ کەڤانەکێ یان چوارچۆڤەیەکا نەخشاندی، ل شوینا کارتێ | ◐ |
| 13 | Field library: `person_1_family` | عائلة العريس | Groom's family | بنەماڵەی زاوا | مالباتا زاڤای | ● |
| 14 | Field library: `person_2_family` | عائلة العروس | Bride's family | بنەماڵەی بووک | مالباتا بویکێ | ● |
| 15 | Engagement section: `person_1_family` | عائلة الخطيب | Fiancé's family | بنەماڵەی دەستگیرانی کوڕ | مالباتا دەزگرانێ کوڕ | ◐ |
| 16 | Engagement section: `person_2_family` | عائلة الخطيبة | Fiancée's family | بنەماڵەی دەستگیرانی کچ | مالباتا دەزگرانا کچ | ◐ |
| 17 | Card shape name, B, W, V | قوس | Arch | کەوانە | کەڤان | ● |
| 18 | Card shape name, E | إطار البطاقة | Cartouche | چوارچێوەی کارت | چوارچۆڤا کارتێ | ◐ |
| 19 | `invitationSamples.short.person_1_family` / `person_2_family` (previews) | آل الحسني / آل الكرخي | The Al-Husseini family / The Al-Karkhi family | بنەماڵەی ئەحمەد / بنەماڵەی کەریم | بنەمالا ئەحمەد / بنەمالا کەریم | ● |
| 20 | `invitationSamples.long.person_1_family` / `person_2_family` (previews) | آل عبد الرحمن الحسني الكرام / آل محمد الكرخي الكرام | The family of Abdulrahman Al-Husseini / … Mohammed Al-Karkhi | بنەماڵەی بەڕێز عەبدولڕەحمان ئەحمەد / بنەماڵەی بەڕێز محەمەد کەریم | بنەمالا بەڕێز عەبدولرەحمان ئەحمەد / بنەمالا بەڕێز محەمەد کەریم | ● |

Not translated (Arabic and English only, like every design's yes/no question): Burgundy's switch «الأحرف الأولى من اسمينا
على ختم الشمع (بدل الوردة)». The Vintage poster's «ENGAGEMENT» band is English lettering in every language, like the
poster's own «WEDDING Invitation».


## Batch 34 — customers' own photos in a design — ✅ APPROVED (2026-10-17)

Designs can now show the customer's own photos (up to 20). The review page gets a "Your photos" panel and the package
checklist says how many photos a design holds. Placeholders (`{max}`, `{min}`, `{n}` and the `{max, plural, …}` form) stay as they are.

| # | Key | Arabic | English | Suggested Sorani (ckb) | Suggested Badini (bdn) |
|---|---|---|---|---|---|
| 1 | `store.features.photos` | صوركم الخاصة داخل التصميم | Your own photos in the design | وێنەکانی خۆتان لەناو دیزاینەکەدا | وێنێن هەوە د دیزاینێ دا |
| 2 | `store.photosUpTo` | {max, plural, one {صورتكم الخاصة داخل التصميم} other {حتى # من صوركم الخاصة}} | {max, plural, one {Your own photo in the design} other {Up to # of your own photos}} | {max, plural, one {وێنەکەی خۆتان لەناو دیزاینەکەدا} other {تا # وێنەی خۆتان}} | {max, plural, one {وێنێ هەوە د دیزاینێ دا} other {هەتا # وێنێن هەوە}} |
| 3 | `store.errors.photosMissing` | أضيفوا الصور التي يحتاجها هذا التصميم (في «صوركم» أعلاه) قبل المتابعة. | Please add the photos this design needs (see “Your photos” above) before continuing. | تکایە پێش بەردەوامبوون ئەو وێنانە زیاد بکەن کە ئەم دیزاینە پێویستی پێیانە (لە «وێنەکانتان» لە سەرەوە). | هیڤیە بەری بەردەوامبوونێ وان وێنان زێدە بکەن یێن ئەڤ دیزاینە پێدڤی پێ هەی (ل «وێنێن هەوە» ل سەری). |
| 4 | `store.photos.title` | صوركم | Your photos | وێنەکانتان | وێنێن هەوە |
| 5 | `store.photos.help` | يعرض هذا التصميم حتى {max} صور بالترتيب: الصورة ١ في المكان الأول وهكذا. أضيفوا صوركم ثم اضغطوا على أي صورة لتروها داخل التصميم وتضبطوها، ويمكنكم تغييرها حتى الدفع. | This design shows up to {max} photos, in order: photo 1 goes in the first place, and so on. Add yours, then tap a photo to see it in the design and place it; you can change them until you pay. | ئەم دیزاینە تا {max} وێنە بە ڕیز پیشان دەدات: وێنەی ١ لە شوێنی یەکەم و بەم شێوەیە. وێنەکانتان زیاد بکەن، پاشان کرتە لە هەر وێنەیەک بکەن بۆ ئەوەی لەناو دیزاینەکەدا بیبینن و ڕێکی بخەن؛ تا کاتی پارەدان دەتوانن بیانگۆڕن. | ئەڤ دیزاینە هەتا {max} وێنەیان ب ڕێز نیشان ددەت: وێنێ ١ ل جهێ ئێکێ و هۆسا. وێنێن خۆ زێدە بکەن، پاشان ل سەر هەر وێنەکێ بدەن دا د دیزاینێ دا ببینن و ڕێک بێخن؛ هەتا دەمێ پارەدانێ هوین دشێن وان بگوهۆڕن. |
| 6 | `store.photos.helpMin` | يعرض هذا التصميم حتى {max} صور بالترتيب، وتحتاجون إلى {min} على الأقل. اضغطوا على أي صورة لتروها داخل التصميم وتضبطوها، ويمكنكم تغييرها حتى الدفع. | This design shows up to {max} photos, in order; add at least {min}. Tap a photo to see it in the design and place it; you can change them until you pay. | ئەم دیزاینە تا {max} وێنە بە ڕیز پیشان دەدات؛ لانیکەم {min} زیاد بکەن. کرتە لە هەر وێنەیەک بکەن بۆ ئەوەی لەناو دیزاینەکەدا بیبینن و ڕێکی بخەن؛ تا کاتی پارەدان دەتوانن بیانگۆڕن. | ئەڤ دیزاینە هەتا {max} وێنەیان ب ڕێز نیشان ددەت؛ کێمترین {min} زێدە بکەن. ل سەر هەر وێنەکێ بدەن دا د دیزاینێ دا ببینن و ڕێک بێخن؛ هەتا دەمێ پارەدانێ هوین دشێن وان بگوهۆڕن. |
| 7 | `store.photos.helpPublished` | يعرض هذا التصميم حتى {max} صور بالترتيب. اضغطوا على أي صورة لتروها داخل التصميم وتضبطوها، وتظهر التغييرات على دعوتكم فوراً. | This design shows up to {max} photos, in order. Tap a photo to see it in the design and place it; changes appear on your invitation straight away. | ئەم دیزاینە تا {max} وێنە بە ڕیز پیشان دەدات. کرتە لە هەر وێنەیەک بکەن بۆ ئەوەی لەناو دیزاینەکەدا بیبینن و ڕێکی بخەن؛ گۆڕانکارییەکان یەکسەر لە بانگهێشتنامەکەتاندا دەردەکەون. | ئەڤ دیزاینە هەتا {max} وێنەیان ب ڕێز نیشان ددەت. ل سەر هەر وێنەکێ بدەن دا د دیزاینێ دا ببینن و ڕێک بێخن؛ گوهۆڕین دەستبجهـ ل سەر داخوازناما هەوە دیار دبن. |
| 8 | `store.photos.count` | أُضيفت {n} من {max} صور | {n} of {max} photos added | {n} لە {max} وێنە زیادکران | {n} ژ {max} وێنەیان هاتنە زێدەکرن |
| 9 | `store.photos.add` | أضف صورة | Add photo | وێنە زیاد بکە | وێنەکێ زێدە بکە |
| 10 | `store.photos.addMany` | أضف عدة صور | Add several photos | چەند وێنەیەک زیاد بکە | چەند وێنەیان زێدە بکە |
| 11 | `store.photos.replace` | استبدال | Replace | گۆڕین | گوهۆڕین |
| 12 | `store.photos.remove` | حذف | Remove | سڕینەوە | ژێبرن |
| 13 | `store.photos.adjust` | ضبط | Adjust | ڕێکخستن | ڕێکخستن |
| 14 | `store.photos.done` | تم | Done | تەواو | تەمام |
| 15 | `store.photos.zoom` | تكبير | Zoom | گەورەکردن | مەزنکرن |
| 16 | `store.photos.uploading` | جارٍ الرفع… | Uploading… | بارکردن… | بارکرن… |
| 17 | `store.photos.photo` | الصورة {n} | Photo {n} | وێنەی {n} | وێنێ {n} |
| 18 | `store.photos.errors.tooLarge` | هذه الصورة كبيرة جداً. اختاروا صورة أقل من ١٥ ميغابايت. | This photo is too large. Please choose one under 15 MB. | ئەم وێنەیە زۆر گەورەیە. تکایە وێنەیەکی کەمتر لە ١٥ مێگابایت هەڵبژێرن. | ئەڤ وێنە گەلەک مەزنە. هیڤیە وێنەکێ ژ ١٥ مێگابایتان کێمتر هەلبژێرن. |
| 19 | `store.photos.errors.unsupportedImage` | هذا الملف ليس صورة يمكن استخدامها. اختاروا صورة JPG أو PNG أو WebP. | This file isn't a photo we can use. Please choose a JPG, PNG or WebP photo. | ئەم فایلە وێنەیەک نییە کە بتوانین بەکاری بهێنین. تکایە وێنەیەکی JPG، PNG یان WebP هەڵبژێرن. | ئەڤ فایلە نە وێنەیەکە کو ئەم بشێین بکاربینین. هیڤیە وێنەکێ JPG، PNG یان WebP هەلبژێرن. |
| 20 | `store.photos.errors.imageTooSmall` | هذه الصورة صغيرة جداً. اختاروا صورة أكبر. | This photo is too small. Please choose a larger one. | ئەم وێنەیە زۆر بچووکە. تکایە وێنەیەکی گەورەتر هەڵبژێرن. | ئەڤ وێنە گەلەک بچووکە. هیڤیە وێنەکێ مەزنتر هەلبژێرن. |
| 21 | `store.photos.errors.rateLimited` | رفعتم صوراً كثيرة الآن. حاولوا بعد قليل. | Too many uploads for now. Please try again in a while. | ئێستا وێنەی زۆرتان بارکرد. تکایە دوای کەمێک هەوڵ بدەنەوە. | نوکە هەوە گەلەک وێنە بارکرن. هیڤیە پشتی دەمەکێ دووبارە هەول بدەن. |
| 22 | `store.photos.errors.generic` | تعذّر حفظ الصورة. حاولوا مرة أخرى. | The photo couldn't be saved. Please try again. | وێنەکە پاشەکەوت نەکرا. تکایە دووبارە هەوڵ بدەنەوە. | وێنە نەهاتە پاشەکەفتکرن. هیڤیە دووبارە هەول بدەن. |

Added with the collage editor (the help lines, rows 5–7, were reworded: the photos go in order and open in the design):

| # | Key | Arabic | English | Suggested Sorani (ckb) | Suggested Badini (bdn) |
|---|---|---|---|---|---|
| 23 | `store.photos.earlier` | تقديم | Move earlier | پێشخستن | پێشئێخستن |
| 24 | `store.photos.later` | تأخير | Move later | دواخستن | پاشئێخستن |
| 25 | `store.photos.previous` | الصورة السابقة | Previous photo | وێنەی پێشوو | وێنێ بەری |
| 26 | `store.photos.next` | الصورة التالية | Next photo | وێنەی دواتر | وێنێ پشتی |
| 27 | `store.photos.inDesign` | شكلها داخل التصميم | How it looks in the design | شێوەی لەناو دیزاینەکەدا | شێوێ وێ د دیزاینێ دا |
| 28 | `store.photos.dragHint` | اسحبوا الصورة لتحريكها داخل إطارها، وكبّروها بالمؤشر. | Drag the photo to move it in its frame; zoom with the slider. | وێنەکە ڕابکێشن بۆ جوڵاندنی لەناو چوارچێوەکەیدا، و بە سلایدەرەکە گەورەی بکەن. | وێنەی ڕاکێشن دا د چوارچۆڤێ وی دا بلڤینن، و ب سلایدەرێ مەزن بکەن. |

## Batch 35 — two graduation designs: Laurel & Bloom (#17) and Golden Arch (#18) — ✅ APPROVED (2026-10-17)

The first graduation designs, and two new fields for graduation. Approved by the owner as suggested; live in the two designs, the field library
and the designs' names, photo places and changeable line. Glossary reused from approved rows: graduation دەرچوون (section name), graduate
دەرچوو / دەرچووی, joy خۆشی / شاهی, presence ئامادەبوون, celebration ئاهەنگ. A «/» marks a line break in the design.

| # | Where | Arabic | English | Suggested Sorani (ckb) | Suggested Badini (bdn) | Conf. |
|---|---|---|---|---|---|---|
| 1 | Field library: `achievement` | الشهادة أو التخصص | Degree or achievement | بڕوانامە یان پسپۆڕی | بڕوانامە یان پسپۆری | ◐ |
| 2 | Field library: `class_year` | سنة الدفعة | Class year | ساڵی دەرچوون | ساڵا دەرچوونێ | ◐ |
| 3 | Design name #17 | الغار والزهر | Laurel & Bloom | گەڵای غار و گوڵ | بەلگێن غارێ و گول | ◐ |
| 4 | Design name #18 | القوس الذهبي | Golden Arch | کەوانەی زێڕین | کەڤانێ زێڕین | ● |
| 5 | #17, #18 | دفعة | Class of | دەرچووی ساڵی | دەرچوویێ ساڵا | ◐ |
| 6 | #17 poster | ندعوكم لمشاركتنا فرحة التخرّج | You’re invited to celebrate | بانگهێشتتان دەکەین بۆ بەشداریکردن لە خۆشیی دەرچوونمان | مە هوین داخواز کرینە بۆ پشکداریێ د شاهیا دەرچوونێ دا | ◐ |
| 7 | #17 poster title | فرحة التخرّج / وبداية الحكاية | Graduation / Celebration | خۆشیی دەرچوون / و دەستپێکی چیرۆکێک | شاهیا دەرچوونێ / و دەستپێکا چیرۆکەکێ | ◐ |
| 8 | #17 | تفاصيل الاحتفال | The celebration | زانیارییەکانی ئاهەنگ | زانیاریێن ئاهەنگێ | ● |
| 9 | #17 | تأكيد الحضور | Kindly reply | دڵنیاکردنەوەی ئامادەبوون | پشتڕاستکرنا ئامادەبوونێ | ● |
| 10 | #17 | فصل جديد من الحكاية | A new chapter | بەشێکی نوێ لە چیرۆکەکە | پشکەکا نوو ژ چیرۆکێ | ◐ |
| 11 | #17 | جذورٌ من الأحلام / وبداياتٌ تزهر | Rooted in dreams. / Ready to bloom. | ڕەگێک لە خەونەکان / و دەستپێکێک کە گوڵ دەکات | ڕەهەک ژ خەونان / و دەستپێکەک کو گول ددەت | ◐ |
| 12 | #17 | لكل ليلة سهر، ولكل إنجاز صغير، ولكل من كان جزءاً من هذه الرحلة. تكتمل فرحة هذا اليوم بمشاركتكم. | For every late night, every small victory… | بۆ هەموو شەونخوونییەک، بۆ هەموو سەرکەوتنێکی بچووک، و بۆ هەموو ئەوانەی بەشێک بوون لەم گەشتە. خۆشیی ئەم ڕۆژە بە بەشداریتان تەواو دەبێت. | بۆ هەمی شەڤبێداریەکێ، بۆ هەمی سەرکەفتنەکا بچووک، و بۆ هەمی ئەوێن پشکەک ژ ڤێ گەشتێ بووین. شاهیا ڤێ ڕۆژێ ب پشکداریا هەوە تەمام دبیت. | ◐ |
| 13 | #17, #18 | حتى نحتفل معاً | The celebration begins in / Until we celebrate | تا پێکەوە ئاهەنگ دەگێڕین | هەتا پێکڤە ئاهەنگێ دگێڕین | ◐ |
| 14 | #17 | نعدّ الأيام لفرحتنا | Counting the days | ڕۆژەکان دەژمێرین بۆ خۆشیمان | ئەم ڕۆژان دهژمێرین بۆ شاهیا خۆ | ◐ |
| 15 | #17 | احفظوا هذا الموعد | Save a little space in your diary | ئەم کاتە لەبیر مەکەن | ڤێ دەمی ژبیر نەکەن | ◐ |
| 16 | #17 | يوم يستحق أن نحتفل به | A day to remember | ڕۆژێک کە شایەنی ئاهەنگە | ڕۆژەک کو هێژای ئاهەنگێیە | ◐ |
| 17 | #17 | الساعة | The time | کاتژمێر | دەمژمێر | ● |
| 18 | #17 | مكان الاحتفال | The place | شوێنی ئاهەنگ | جهێ ئاهەنگێ | ● |
| 19 | #17 | أجمل ما في هذا الإنجاز أن نشاركه معكم. | The best part of this milestone is sharing it with you. | جوانترین شتی ئەم دەستکەوتە ئەوەیە لەگەڵ ئێوەی بەش بکەین. | جوانترین تشتێ ڤێ دەستکەفتێ ئەوە کو دگەل هەوە پارڤە بکەین. | ◐ |
| 20 | #17, #18 | مكانكم بيننا | A place for you | شوێنتان لەناوماندایە | جهێ هەوە د ناڤبەرا مە دایە | ◐ |
| 21 | #17 | شاركونا الفرحة | Celebrate with us | بەشداری خۆشیمان بن | پشکداریێ د شاهیا مە دا بکەن | ◐ |
| 22 | #17, #18 | تكتمل فرحتنا بحضوركم. / تكتمل الفرحة بحضوركم. | It wouldn’t be the same without you. | خۆشیمان بە ئامادەبوونتان تەواو دەبێت. | شاهیا مە ب ئامادەبوونا هەوە تەمام دبیت. | ● |
| 23 | #17 | كلمات لبداية جديدة | Words for the next chapter | وشەگەلێک بۆ دەستپێکێکی نوێ | پەیڤەک بۆ دەستپێکەکا نوو | ◐ |
| 24 | #17 | بكل الامتنان والفرح | With gratitude & great excitement | بە هەموو سوپاس و خۆشییەکەوە | ب هەمی سوپاس و شاهیێ ڤە | ◐ |
| 25 | #17 | لأحلام أكبر / وبدايات أجمل | Here’s to / what comes next. | بۆ خەونی گەورەتر / و دەستپێکی جوانتر | بۆ خەونێن مەزنتر / و دەستپێکێن جوانتر | ◐ |
| 26 | #17, #18 keepsake | شكراً من القلب لكل من شاركنا فرحة التخرّج | With heartfelt thanks to everyone who shared this day | لە دڵەوە سوپاس بۆ هەموو ئەوانەی بەشداری خۆشیی دەرچوونمان بوون | ژ دل سوپاس بۆ هەمی ئەوێن پشکداری د شاهیا دەرچوونێ دا کری | ◐ |
| 27 | #18 closed poster | نحتفل بتخرّج | Celebrating the graduation of | ئاهەنگ دەگێڕین بۆ دەرچوونی | ئەم ئاهەنگێ دگێڕین بۆ دەرچوونا | ◐ |
| 28 | #18 | لحظة فخر | A proud moment | ساتێکی شانازی | دەمەکێ سەربلندیێ | ◐ |
| 29 | #18 | تعب السنين / يزهر اليوم | Years of work, / in full bloom | ماندووبوونی ساڵان / ئەمڕۆ گوڵ دەکات | وەستیانا ساڵان / ئەڤرۆ گول ددەت | ◐ |
| 30 | #18 | لكل من آمن بالحلم، ورافق الطريق خطوة بخطوة. | For everyone who believed in the dream and walked the road with us. | بۆ هەموو ئەوانەی باوەڕیان بە خەونەکە هەبوو و هەنگاو بە هەنگاو لەگەڵمان بوون. | بۆ هەمی ئەوێن باوەری ب خەونێ هەی و گاڤ ب گاڤ دگەل مە بووین. | ◐ |
| 31 | #18 | نعدّ الأيام | Counting the days | ڕۆژەکان دەژمێرین | ئەم ڕۆژان دهژمێرین | ● |
| 32 | #18 | احفظوا الموعد | Save the date | کاتەکە لەبیر مەکەن | دەمی ژبیر نەکەن | ◐ |
| 33 | #18 | المكان | The place | شوێن | جه | ● |
| 34 | #18 | كلمات للخرّيج | Words for the graduate | وشەگەلێک بۆ دەرچوو | پەیڤەک بۆ دەرچووی | ◐ |
| 35 | #18 | المستقبل لك / فانطلق بثقة | The future / belongs to you | داهاتوو هی تۆیە / بە متمانەوە بڕۆ پێش | پاشەڕۆژ یا تەیە / ب باوەری بچە پێش | ◐ |
| 36 | #18 wording `followLine` (customer can change) | وتكتمل الفرحة بلقائكم | Reception to follow! | خۆشییەکە بە دیدارتان تەواو دەبێت | شاهی ب دیتنا هەوە تەمام دبیت | ◐ |
| 37 | #17, #18 photo place (order form) | صورة التخرّج | Graduation portrait | وێنەی دەرچوون | وێنێ دەرچوونێ | ● |
| 38 | #17 photo place (order form) | لحظة من الرحلة | A moment from the journey | ساتێک لە گەشتەکە | دەمەک ژ گەشتێ | ◐ |
| 39 | #17 under the second photo | لحظة من رحلة لا تُنسى | A little piece of the journey. | ساتێک لە گەشتێکی لەبیرنەکراو | دەمەک ژ گەشتەکا ژبیرنەبوویی | ◐ |

Not translated (Arabic and English only): the label of #18's changeable line («السطر المكتوب بخط اليد تحت المكان»).
Countdown units, buttons and the guest form come from the platform's approved strings.

## Batch 36 — the printed frames from the owner's posters — ⏳ AWAITING APPROVAL

The owner's posters replace the heart and arch printed cards: Burgundy & Lace (cut corners, rounded corners), Winter Flower
(oval, wavy frame, rounded corners) and Laurel & Bloom (oval, rounded corners); Espresso & Ivory and Vintage Love Letters
have one frame each, named «إطار البطاقة» (already approved, batch 33 row 18). The customer picks the frame by these names
on the order form; until approved, Kurdish orders show the Arabic. Everything written on the frames reuses each design's
approved lines.

| # | Where | Arabic | English | Suggested Sorani (ckb) | Suggested Badini (bdn) | Conf. |
|---|---|---|---|---|---|---|
| 1 | Frame name (Burgundy & Lace) | إطار مشطوف الزوايا | Cut corners | چوارچێوەی گۆشە بڕاو | چوارچۆڤا قولنچ بڕی | ◐ |
| 2 | Frame name (Burgundy, Winter Flower, Laurel & Bloom) | إطار بزوايا مقوّسة | Rounded corners | چوارچێوەی گۆشە خڕ | چوارچۆڤا قولنچ گروڤەر | ◐ |
| 3 | Frame name (Winter Flower, Laurel & Bloom) | بيضاوي | Oval | هێلکەیی | هێکەیی | ◐ |
| 4 | Frame name (Winter Flower) | إطار متموّج | Wavy frame | چوارچێوەی شەپۆلی | چوارچۆڤا پێلی | ◐ |

## Batch 37 — the customer's own song, and the new lines in the Terms and Privacy policy — ✅ APPROVED (2026-10-19)

Packages with **Your own song** (`custom_music`) let the customer upload a song or a video; its sound plays (2 minutes at
most, from where they choose) instead of the design's song. Rows 1–25 are the order page and the receipt's edit page;
until approved, Kurdish visitors see the Arabic. Rows 26–33 are the new lines of the Terms (wedding and newborn) and the
Privacy policy, published in all four languages by the deploy's seed (`updatePoliciesForUploads`).
"Song" is گۆرانی in Sorani and ستران in Badini.

| # | Where | Arabic | English | Suggested Sorani (ckb) | Suggested Badini (bdn) | Conf. |
|---|---|---|---|---|---|---|
| 1 | Package feature | أغنيتكم الخاصة (حتى دقيقتين) | Your own song (up to 2 minutes) | گۆرانی تایبەتی خۆتان (تا دوو خولەک) | سترانا هەوە یا تایبەت (هەتا دوو خولەکان) | ◐ |
| 2 | Song: title | أغنيتكم الخاصة | Your own song | گۆرانییەکەی خۆتان | سترانا هەوە | ● |
| 3 | Song: help (order page) | أضيفوا أغنية أو فيديو من هاتفكم وسنستخدم صوته. تُشغَّل حتى دقيقتين تبدأ من المكان الذي تختارونه. وإن لم تضيفوا شيئاً تُشغَّل أغنية التصميم. | Add a song or a video from your phone; we use its sound. Up to 2 minutes play, starting where you choose. Without one, the design's song plays. | گۆرانییەک یان ڤیدیۆیەک لە مۆبایلەکەتانەوە زیاد بکەن؛ دەنگەکەی بەکاردەهێنین. تا دوو خولەک لێدەدرێت، لەو شوێنەوە دەست پێدەکات کە هەڵیدەبژێرن. ئەگەر زیادی نەکەن، گۆرانی دیزاینەکە لێدەدرێت. | سترانەکێ یان ڤیدیۆیەکێ ژ مۆبایلا خۆ زێدە بکەن؛ ئەم دەنگێ وێ بکاردئینین. هەتا دوو خولەکان دهێتە لێدان، ژ وی جهی دەست پێدکەت یێ هوین هەلدبژێرن. ئەگەر هوین زێدە نەکەن، سترانا دیزاینێ دهێتە لێدان. | ◐ |
| 4 | Song: help (after publishing) | غيّروا الأغنية التي يسمعها ضيوفكم. تُشغَّل حتى دقيقتين تبدأ من المكان الذي تختارونه. | Change the song your guests hear. Up to 2 minutes play, starting where you choose. | ئەو گۆرانییە بگۆڕن کە میوانەکانتان گوێی لێدەگرن. تا دوو خولەک لێدەدرێت، لەو شوێنەوە دەست پێدەکات کە هەڵیدەبژێرن. | وێ سترانێ بگوهۆڕن یا مێڤانێن هەوە گوهداریێ دکەن. هەتا دوو خولەکان دهێتە لێدان، ژ وی جهی دەست پێدکەت یێ هوین هەلدبژێرن. | ◐ |
| 5 | Song: none added (design has one) | تُشغَّل أغنية التصميم حالياً. | The design's own song plays for now. | ئێستا گۆرانی دیزاینەکە لێدەدرێت. | نوکە سترانا دیزاینێ دهێتە لێدان. | ◐ |
| 6 | Song: none added | لم تُضَف أغنية بعد. | No song added yet. | هێشتا هیچ گۆرانییەک زیاد نەکراوە. | هێشتا چ ستران نەهاتینە زێدەکرن. | ◐ |
| 7 | Song: saved | أغنيتكم | Your song | گۆرانییەکەتان | سترانا هەوە | ● |
| 8 | Button | اختاروا أغنية أو فيديو | Choose a song or video | گۆرانییەک یان ڤیدیۆیەک هەڵبژێرن | سترانەکێ یان ڤیدیۆیەکێ هەلبژێرن | ● |
| 9 | Button | اختاروا أغنية أخرى | Choose another song | گۆرانییەکی تر هەڵبژێرن | سترانەکا دی هەلبژێرن | ● |
| 10 | Button | احذفوها واستخدموا أغنية التصميم | Remove it and use the design's song | بیسڕنەوە و گۆرانی دیزاینەکە بەکاربهێنن | ژێببەن و سترانا دیزاینێ بکاربینن | ◐ |
| 11 | Start slider | من أين تبدأ الأغنية | Where the song starts | گۆرانییەکە لە کوێوە دەست پێبکات | ستران ژ کیرێ دەست پێبکەت | ◐ |
| 12 | Under the slider (keep `{from}` `{to}`) | تُشغَّل من {from} إلى {to} | Plays from {from} to {to} | لە {from} تا {to} لێدەدرێت | ژ {from} هەتا {to} دهێتە لێدان | ◐ |
| 13 | File the phone can't preview | ستُستخدم أول دقيقتين. | The first 2 minutes will be used. | یەکەم دوو خولەک بەکاردەهێنرێت. | دوو خولەکێن ئێکێ دێ هێنە بکارئینان. | ◐ |
| 14 | Button | استمعوا | Listen | گوێ بگرن | گوهداری بکەن | ● |
| 15 | Button | إيقاف | Stop | ڕاگرتن | ڕاوەستاندن | ● |
| 16 | Rights checkbox (important) | أؤكد أن لدي الحق في استخدام هذه الأغنية أو هذا الفيديو في دعوتي، وأنني المسؤول عنها (راجعوا الشروط). | I confirm I have the right to use this song or video in my invitation, and I am responsible for it (see the Terms). | پشتڕاستی دەکەمەوە کە مافی بەکارهێنانی ئەم گۆرانی یان ڤیدیۆیەم لە بانگهێشتنامەکەمدا هەیە، و من بەرپرسیارم لێی (سەیری مەرجەکان بکەن). | ئەز پشتڕاست دکەم کو مافێ من هەیە ڤێ سترانێ یان ڤی ڤیدیۆیی د داخوازناما خۆ دا بکاربینم، و ئەز بەرپرسیارم ژێ (سەحکەنە مەرجان). | ◐ |
| 17 | Button | استخدموا هذه الأغنية | Use this song | ئەم گۆرانییە بەکاربهێنن | ڤێ سترانێ بکاربینن | ● |
| 18 | Button | إلغاء | Cancel | هەڵوەشاندنەوە | هەلوەشاندن | ● |
| 19 | While sending (keep `{percent}`) | جارٍ الإرسال… {percent}% | Sending… {percent}% | ناردن… {percent}% | هنارتن… {percent}% | ● |
| 20 | While converting | جارٍ تجهيز أغنيتكم… | Preparing your song… | ئامادەکردنی گۆرانییەکەتان… | ئامادەکرنا سترانا هەوە… | ● |
| 21 | Error | هذا الملف كبير جداً (100 ميغابايت كحد أقصى). اختاروا فيديو أقصر أو ملف الأغنية نفسه. | This file is too large (100 MB at most). Choose a shorter video or the song file itself. | ئەم فایلە زۆر گەورەیە (زۆرترین ١٠٠ مێگابایت). ڤیدیۆیەکی کورتتر یان فایلی گۆرانییەکە خۆی هەڵبژێرن. | ئەڤ فایلە گەلەک مەزنە (پترین ١٠٠ مێگابایت). ڤیدیۆیەکا کورتتر یان فایلا سترانێ ب خۆ هەلبژێرن. | ◐ |
| 22 | Error | لم نتمكن من قراءة أي صوت في هذا الملف. اختاروا أغنية أو فيديو آخر. | We could not read any sound in this file. Choose another song or video. | نەمانتوانی هیچ دەنگێک لەم فایلەدا بخوێنینەوە. گۆرانی یان ڤیدیۆیەکی تر هەڵبژێرن. | مە نەشیا چ دەنگان د ڤێ فایلێ دا بخوینین. سترانەکا دی یان ڤیدیۆیەکا دی هەلبژێرن. | ◐ |
| 23 | Error | يرجى وضع علامة في المربع لتأكيد حقكم في استخدام هذه الأغنية. | Please tick the box to confirm you may use this song. | تکایە نیشانە لە چوارگۆشەکە بدەن بۆ پشتڕاستکردنەوەی مافی بەکارهێنانی ئەم گۆرانییە. | هیڤیە نیشانێ د چارگۆشەیێ دا بدەن دا پشتڕاست بکەن کو مافێ هەوە هەیە ڤێ سترانێ بکاربینن. | ◐ |
| 24 | Error | أُرسلت أغانٍ كثيرة حالياً. يرجى المحاولة بعد ساعة. | Too many songs sent for now. Please try again in an hour. | ئێستا گۆرانی زۆرتان نارد. تکایە دوای کاتژمێرێک هەوڵ بدەنەوە. | نوکە هەوە گەلەک ستران هنارتن. هیڤیە پشتی دەمژمێرەکێ دووبارە هەول بدەن. | ◐ |
| 25 | Error | تعذّر حفظ الأغنية. يرجى المحاولة مرة أخرى. | The song could not be saved. Please try again. | گۆرانییەکە پاشەکەوت نەکرا. تکایە دووبارە هەوڵ بدەنەوە. | ستران نەهاتە پاشەکەفتکرن. هیڤیە دووبارە هەول بدەن. | ● |
| 26 | Terms: new heading (before Ownership) | ## الأغاني والفيديوهات والصور التي تضيفها | ## Songs, videos and photos you add | ## ئەو گۆرانی و ڤیدیۆ و وێنانەی زیادیان دەکەیت | ## ئەو ستران و ڤیدیۆ و وێنێن تو زێدە دکەی | ◐ |
| 27 | Terms | - إذا كانت باقتك تتيح إضافة أغنيتك الخاصة (أو فيديو نستخدم صوته) أو صورك الخاصة، فإنك تؤكد أنك تملكها أو لديك إذن باستخدامها في دعوتك، وأنك المسؤول عنها. | - If your package lets you add your own song (or a video whose sound we use) or your own photos, you confirm that you own them or have permission to use them in your invitation, and that you are responsible for them. | - ئەگەر پاکێجەکەت ڕێگە بدات گۆرانی تایبەتی خۆت (یان ڤیدیۆیەک کە دەنگەکەی بەکاردەهێنین) یان وێنەکانی خۆت زیاد بکەیت، پشتڕاستی دەکەیتەوە کە خاوەنیانیت یان مۆڵەتی بەکارهێنانیانت لە بانگهێشتنامەکەتدا هەیە، و تۆ بەرپرسیاریت لێیان. | - ئەگەر پاکێجا تە ڕێ بدەت تو سترانا خۆ یا تایبەت (یان ڤیدیۆیەکێ کو ئەم دەنگێ وێ بکاردئینین) یان وێنێن خۆ زێدە بکەی، تو پشتڕاست دکەی کو تو خودانێ وانی یان مۆلەتا بکارئینانا وان د داخوازناما خۆ دا هەیە، و تو بەرپرسیاری ژ وان. | ◐ |
| 28 | Terms | - تبقى ملكاً لك، وتمنحنا الإذن بحفظها وتحويلها وعرضها في دعوتك وملفاتها فقط. نقصّ الأغنية إلى دقيقتين، ولا نبيع ما ترفعه ولا نعيد استخدامه. | - They stay yours. You allow us to store, convert and show them in your invitation and its files only. We cut a song to 2 minutes, and we never sell or reuse what you upload. | - هەر موڵکی خۆتن. ڕێگەمان پێدەدەیت تەنها لە بانگهێشتنامەکەت و فایلەکانیدا هەڵیانبگرین، بیانگۆڕین و پیشانیان بدەین. گۆرانی تا دوو خولەک کورت دەکەینەوە، و هەرگیز ئەوەی بارت کردووە نافرۆشین و دووبارە بەکاری ناهێنینەوە. | - ئەو هەر یێن تە نە. تو ڕێ ددەیە مە بتنێ د داخوازناما تە و فایلێن وێ دا وان هەلگرین، بگوهۆڕین و نیشان بدەین. ئەم سترانێ هەتا دوو خولەکان کورت دکەین، و ئەم چ جاران وێ یا تە بارکری نافرۆشین و دووبارە بکار نائینین. | ◐ |
| 29 | Terms | - لا ترفع ما لا يحق لك مشاركته، ولا أي محتوى مسيء أو مخالف للقانون. يحق لنا حذف أي أغنية أو صورة في أي وقت إذا خالفت ذلك أو اعترض عليها صاحب حقوقها، وتعود عندها أغنية التصميم، ولا يترتب على ذلك حق في استرداد المبلغ. | - Do not upload anything you have no right to share, or anything offensive or unlawful. We may remove any song or photo at any time if it breaks this rule or if its rights holder objects; the design's song then plays again, and this gives no right to a refund. | - هیچ شتێک بار مەکە کە مافی هاوبەشکردنیت نییە، یان ناوەڕۆکی سووکایەتیئامێز یان نایاسایی. مافی ئەوەمان هەیە هەر کاتێک هەر گۆرانی یان وێنەیەک بسڕینەوە ئەگەر پێچەوانەی ئەمە بێت یان خاوەنی مافەکەی ناڕەزایی دەربڕێت؛ ئەوکات گۆرانی دیزاینەکە دووبارە لێدەدرێتەوە، و ئەمە مافی گەڕاندنەوەی پارە نادات. | - چ تشتان بار نەکە یێن مافێ تە نەبیت بەلاڤ بکەی، یان ناڤەروکا ڕێزشکێن یان نەیاسایی. مافێ مە هەیە هەر دەمەکێ هەر سترانەکێ یان وێنەکێ ژێببەین ئەگەر ڤێ یەکێ بشکێنیت یان خودانێ مافێ وێ نەڕازیبوونێ دیار بکەت؛ هینگێ سترانا دیزاینێ دووبارە دهێتە لێدان، و ئەڤە چ مافێ ڤەگەڕاندنا پارەی نادەت. | ◐ |
| 30 | Terms | - إذا طالب أحد بهجه بشيء بسبب ما رفعته، فأنت المسؤول عن ذلك. | - If anyone makes a claim against Bahja because of something you uploaded, you are responsible for it. | - ئەگەر کەسێک داوایەک لە بەهجە بکات بەهۆی شتێکەوە کە تۆ بارت کردووە، تۆ بەرپرسیاریت لێی. | - ئەگەر ئێک داخوازیەکێ ژ بەهجە بکەت ژ بەر تشتەکێ تە بارکری، تو بەرپرسیاری ژێ. | ◐ |
| 31 | Terms | - تُحذف مع بقية بيانات دعوتك الشخصية (راجع سياسة الخصوصية). | - They are deleted with your invitation's other personal data (see the Privacy policy). | - لەگەڵ زانیارییە کەسییەکانی تری بانگهێشتنامەکەتدا دەسڕدرێنەوە (سەیری سیاسەتی تایبەتمەندی بکە). | - دگەل زانیاریێن دی یێن کەسی یێن داخوازناما تە دهێنە ژێبرن (سەحکە سیاسەتا تایبەتمەندیێ). | ◐ |
| 32 | Privacy: what we collect | - إذا تضمنتها باقتك: الصور والأغنية (أو الفيديو) التي تضيفها. نحتفظ فقط بما تحتاجه الدعوة (صور بحجم مناسب وأغنية مقصوصة إلى دقيقتين) ونحذف بياناتها المخفية مثل الموقع. | - If your package includes them: the photos and the song (or video) you add. We keep only what the invitation needs (photos at a suitable size, a song cut to 2 minutes) and remove their hidden details such as location. | - ئەگەر پاکێجەکەت تێیدا بێت: ئەو وێنە و گۆرانییە (یان ڤیدیۆیە) کە زیادی دەکەیت. تەنها ئەوەی بانگهێشتنامەکە پێویستیەتی هەڵدەگرین (وێنە بە قەبارەیەکی گونجاو، گۆرانییەک کە تا دوو خولەک کورت کراوەتەوە) و زانیارییە شاراوەکانیان وەک شوێن دەسڕینەوە. | - ئەگەر پاکێجا تە ئەو تێدا هەبن: ئەو وێنە و سترانا (یان ڤیدیۆیا) تو زێدە دکەی. ئەم بتنێ وێ هەلدگرین یا داخوازنامە پێدڤی پێ هەی (وێنە ب قەبارەکا گونجای، سترانەک هەتا دوو خولەکان کورتکری) و زانیاریێن وان یێن ڤەشارتی وەکی جهی ژێدبەین. | ◐ |
| 33 | Privacy: how long we keep it | - صورك وأغنيتك الخاصة: حتى ١٢ شهراً بعد انتهاء الدعوة، وللطلبات التي لم تُدفع: ٣٠ يوماً بعد انتهاء رابط المعاينة. | - Your photos and your own song: up to 12 months after the invitation ends; for orders never paid, 30 days after the preview link expires. | - وێنەکانت و گۆرانی تایبەتی خۆت: تا ١٢ مانگ دوای کۆتاییهاتنی بانگهێشتنامەکە؛ بۆ داواکارییەکانی کە پارەیان نەدراوە، ٣٠ ڕۆژ دوای بەسەرچوونی بەستەری پێشبینین. | - وێنێن تە و سترانا تە یا تایبەت: هەتا ١٢ هەیڤان پشتی ب دوماهیهاتنا داخوازنامێ؛ بۆ وان داخوازیێن پارە بۆ نەهاتییە دان، ٣٠ ڕۆژان پشتی ب دوماهیهاتنا لینکا پێشدیتنێ. | ◐ |

## Batch 38 — preview before paying, sample texts — ✅ AUTO-APPROVED (2026-10-21, owner checks in Admin → Translations)

From now on Kurdish is written directly and approved automatically (owner rule, 2026-10-20); each batch lists what was
added so the owner can check it in Admin → Translations.

| # | Where | Arabic | English | Sorani (ckb) | Badini (bdn) |
|---|---|---|---|---|---|
| 1 | Package choice: notice | عاينوا دعوتكم قبل الدفع | Preview your invitation before you pay | پێش پارەدان بانگهێشتنامەکەتان ببینن | بەری پارەدانێ داخوازناما خۆ ببینن |
| 2 | Package choice: notice text | املؤوا تفاصيلكم وشاهدوا دعوتكم الحقيقية، ولا تدفعون إلا بعد أن تعجبكم. | Fill in your details and see your real invitation. You only pay once you are happy with it. | زانیارییەکانتان پڕ بکەنەوە و بانگهێشتنامە ڕاستەقینەکەتان ببینن؛ تەنها دوای ئەوەی پێتان خۆش بوو پارە دەدەن. | زانیاریێن خۆ پڕ بکەن و داخوازناما خۆ یا ڕاستەقینە ببینن؛ هوین بتنێ پشتی کو حەز ژێ کر پارەی ددەن. |
| 3 | Package choice: notice text (files-only designs) | املؤوا تفاصيلكم وشاهدوا تصاميمكم الحقيقية، ولا تدفعون إلا بعد أن تعجبكم. | Fill in your details and see your real designs. You only pay once you are happy with them. | زانیارییەکانتان پڕ بکەنەوە و دیزاینە ڕاستەقینەکانتان ببینن؛ تەنها دوای ئەوەی پێتان خۆش بوو پارە دەدەن. | زانیاریێن خۆ پڕ بکەن و دیزاینێن خۆ یێن ڕاستەقینە ببینن؛ هوین بتنێ پشتی کو حەز ژێ کر پارەی ددەن. |
| 4 | Graduation sample (short) | بكالوريوس الهندسة | Bachelor of Engineering | بەکالۆریۆسی ئەندازیاری | بەکالۆریۆسا ئەندازیاریێ |
| 5 | Graduation sample (long) | ماجستير في هندسة البرمجيات وأنظمة المعلومات | Master's in Software Engineering and Information Systems | ماستەر لە ئەندازیاری نەرمەکاڵا و سیستەمەکانی زانیاری | ماستەر د ئەندازیاریا نەرمەکاڵا و سیستەمێن زانیاریێ دا |
| 6 | Sample names in previews (`invitationSamples.names.*`, both dialects) | Arabic names | — | Kurdish names: ئاری، ئاراس، ژیار… / ژیلا، ڤیان، ئەڤین… / عەلی، ئەحمەد، کاروان… (see ckb.json) | same lists (bdn.json) |

Batch 36 (printed frame names) is still open: those names live in the designs' manifests, and the activated versions
are frozen, so they need a new design version (the wedding themes chat).

## Batch 39 — four birthday designs: Cherry Confetti (#19), Pink Ribbon (#20), Floral Surprise (#21) and Blush Floral (#22) — ✅ AUTO-APPROVED (2026-10-25, owner checks in Admin → Translations)

The three surprises are cards for someone else's birthday; Blush Floral is the customer's invitation to their own
party (with their signed note). The lines live in each design's `copy.ts` (a design's own words), the names in its
manifest; once a version is activated they are frozen, so a correction there needs a new design version.

| # | Where | Arabic | English | Sorani (ckb) | Badini (bdn) |
|---|---|---|---|---|---|
| 1 | #19 design name | كونفيتي الكرز | Cherry Confetti | کۆنفێتی گێلاس | کۆنفێتی گێلاسێ |
| 2 | #20 design name | الشريطة الوردية | Pink Ribbon | پاپیۆنی پەمەیی | پاپیۆنا پەمبەیی |
| 3 | #21 design name | مفاجأة الزهور | Floral Surprise | سوپرایزی گوڵ | سوپرایزا گولان |
| 4 | #22 design name | زهر الخجل | Blush Floral | گوڵی پەمەیی | گولا پەمبەیی |
| 5 | #19 Cherry Confetti: `hintLine` | مفاجأة صغيرة، لك وحدك | A little surprise, just for you | سوپرایزێکی بچووک، تەنها بۆ تۆ | سوپرایزەکا بچووک، بتنێ بۆ تە |
| 6 | #19 Cherry Confetti: `hintTap` | اضغط للفتح | Tap to open | دەست بنێ بۆ کردنەوە | دەستێ بدە بۆ ڤەکرنێ |
| 7 | #19 Cherry Confetti: `posterEyebrow` | مفاجأة صغيرة إلى | A little surprise for | سوپرایزێکی بچووک بۆ | سوپرایزەکا بچووک بۆ |
| 8 | #19 Cherry Confetti: `posterHappy` | عيد ميلاد سعيد | Happy Birthday | ڕۆژی لەدایکبوونت پیرۆز | ڕۆژا ژدایکبوونا تە پیرۆز |
| 9 | #19 Cherry Confetti: `posterDay` | يومٌ مميّز | Your special day | ڕۆژێکی تایبەت | ڕۆژەکا تایبەت |
| 10 | #19 Cherry Confetti: `posterDress` | يومٌ لك وحدك | A day just for you | ڕۆژێک تەنها بۆ تۆ | ڕۆژەک بتنێ بۆ تە |
| 11 | #19 Cherry Confetti: `you` | أنت | You | تۆ | تو |
| 12 | #19 Cherry Confetti: `more` | مزيد من سحر عيد الميلاد | A little more birthday magic | کەمێکی تر لە جادووی ڕۆژی لەدایکبوون | هندەکێ دی ژ سێهرا ڕۆژا ژدایکبوونێ |
| 13 | #19 Cherry Confetti: `justForYou` | لك وحدك | Just for you | تەنها بۆ تۆ | بتنێ بۆ تە |
| 14 | #19 Cherry Confetti: `introTitle` | عيد ميلاد سعيد، | Happy birthday, | ڕۆژی لەدایکبوونت پیرۆز بێت، | ڕۆژا ژدایکبوونا تە پیرۆز بیت، |
| 15 | #19 Cherry Confetti: `introCopy` | لضحكاتٍ تدوم، ومفاجآتٍ حلوة، / وعامٍ يحمل مزيداً من السحر. | Here’s to laughter that lasts, sweet surprises, / and a year with a little more magic. | بۆ پێکەنینێک کە بمێنێتەوە، سوپرایزی شیرین، / و ساڵێک کە جادووی زیاتری تێدابێت. | بۆ کەنیێن بمینن، سوپرایزێن شرین، / و ساڵەکێ کو سێهرا پتر تێدا هەبیت. |
| 16 | #19 Cherry Confetti: `introSign` | كل عام وأنت بخير. | Happy, happy birthday. | ساڵانێکی پڕ لە خۆشی. | هەمی ساڵ تو ب خێر بی. |
| 17 | #19 Cherry Confetti: `wishEyebrow` | طقسٌ صغير لعيد الميلاد | A small birthday ritual | ڕێوڕەسمێکی بچووکی ڕۆژی لەدایکبوون | ڕێوڕەسمەکا بچووکا ڕۆژا ژدایکبوونێ |
| 18 | #19 Cherry Confetti: `wishTitle` | عينان مغمضتان… | Close your eyes. | چاوەکانت دابخە. | چاڤێن خۆ بگرە. |
| 19 | #19 Cherry Confetti: `wishTitleEm` | وأمنيةٌ صغيرة. | Make a wish. | ئاواتێک بخوازە. | هیڤیەکێ بخوازە. |
| 20 | #19 Cherry Confetti: `wishInstruction` | أمنيةٌ صغيرة تبقى سرّاً، / وضوء الشمعة يحملها بعيداً. | Keep a little wish to yourself, / then let the candlelight carry it. | ئاواتێکی بچووک بۆ خۆت بهێڵەرەوە، / پاشان با ڕووناکی مۆمەکە هەڵیبگرێت. | هیڤیەکا بچووک بۆ خۆ بهێلە، / پاشان بلا ڕوناهیا مۆمێ هەلگریت. |
| 21 | #19 Cherry Confetti: `makeWish` | لحظة الأمنية | Make a birthday wish | ئاواتێکی ڕۆژی لەدایکبوون بخوازە | هیڤیەکا ڕۆژا ژدایکبوونێ بخوازە |
| 22 | #19 Cherry Confetti: `wishMade` | أمنيةٌ لك وحدك | A wish, just for you | ئاواتێک، تەنها بۆ تۆ | هیڤیەک، بتنێ بۆ تە |
| 23 | #19 Cherry Confetti: `wishMadeTitle` | لتجد الأشياء الجميلة | May lovely things | با شتە جوانەکان | بلا تشتێن جوان |
| 24 | #19 Cherry Confetti: `wishMadeEm` | طريقها إليك. | find their way to you. | ڕێگای خۆیان بۆ لای تۆ بدۆزنەوە. | ڕێکا خۆ بۆ نک تە ببیننەڤە. |
| 25 | #19 Cherry Confetti: `wishMadeCopy` | مغامراتٌ جديدة. ولحظاتُ هدوء. / وأسبابٌ كثيرة للابتسام. | New adventures. Peaceful moments. / And so many reasons to smile. | سەرکێشیی نوێ. ساتی ئارام. / و هۆکاری زۆر بۆ زەردەخەنە. | سەربۆرێن نوو. دەمێن ئارام. / و گەلەک ئەگەرێن کەنینێ. |
| 26 | #19 Cherry Confetti: `relight` | أمنيةٌ صغيرة أخرى | One more little wish | ئاواتێکی بچووکی تر | هیڤیەکا بچووکا دی |
| 27 | #19 Cherry Confetti: `candle` | شمعة عيد ميلاد تنتظر أمنية | A birthday candle, waiting for a wish | مۆمێکی ڕۆژی لەدایکبوون، چاوەڕێی ئاواتێکە | مۆمەکا ڕۆژا ژدایکبوونێ، ل هیڤیا هیڤیەکێ |
| 28 | #19 Cherry Confetti: `candleOut` | انطفأت الشمعة، والأمنية في طريقها. | The birthday candle is out. Your birthday wish is made. | مۆمەکە کوژایەوە. ئاواتەکەت خواسترا. | مۆم ڤەمری. هیڤیا تە هاتە خواستن. |
| 29 | #19 Cherry Confetti: `dayToCelebrate` | يومٌ للاحتفال | A day to celebrate | ڕۆژێک بۆ ئاهەنگگێڕان | ڕۆژەک بۆ ئاهەنگێ |
| 30 | #19 Cherry Confetti: `letterEyebrow` | للعام القادم | For the year ahead | بۆ ساڵی داهاتوو | بۆ ساڵا بهێت |
| 31 | #19 Cherry Confetti: `letterTitle` | مزيدٌ من الفرح. / مزيدٌ من الدهشة. | More joy. / More wonder. | خۆشیی زیاتر. / سەرسوڕمانی زیاتر. | دلخۆشیا پتر. / سەرسوڕمانا پتر. |
| 32 | #19 Cherry Confetti: `letterTitleEm` | ومزيدٌ مما يُسعدك. | More of what you love. | و زیاتر لەوەی خۆشت دەوێت. | و پتر ژ وێ تشتێ تو حەز ژێ دکەی. |
| 33 | #19 Cherry Confetti: `message` | أتمنى لك يوماً مليئاً بالمفاجآت الحلوة واللحظات السعيدة وكل ما يُسعدك. | Wishing you a day full of sweet surprises, happy moments, and all the things you love. | ڕۆژێکی پڕ لە سوپرایزی شیرین و ساتی خۆش و هەموو ئەو شتانەی خۆشت دەوێن بۆت دەخوازم. | ڕۆژەکا تژی سوپرایزێن شرین و دەمێن خۆش و هەمی ئەو تشتێن تو حەز ژێ دکەی بۆ تە دخوازم. |
| 34 | #19 Cherry Confetti: `letterSign` | مع أحرّ تمنيات عيد الميلاد. | With the warmest birthday wishes. | بە گەرمترین ئاواتەکانی ڕۆژی لەدایکبوون. | ب گەرمترین هیڤیێن ڕۆژا ژدایکبوونێ. |
| 35 | #19 Cherry Confetti: `footerEyebrow` | عيد ميلاد سعيد | Happy birthday | ڕۆژی لەدایکبوونت پیرۆز | ڕۆژا ژدایکبوونا تە پیرۆز |
| 36 | #19 Cherry Confetti: `footerCopy` | قليلٌ من الحب، قليلٌ من البريق، / ويومٌ كامل للاحتفال بك. | A little love. A little sparkle. / A whole day to celebrate you. | کەمێک خۆشەویستی. کەمێک درەوشانەوە. / ڕۆژێکی تەواو بۆ ئاهەنگگێڕان بە تۆ. | هندەک ڤیان. هندەک بریسک. / ڕۆژەکا تمام بۆ ئاهەنگگێڕانا تە. |
| 37 | #19 Cherry Confetti: `replay` | إعادة المفاجأة | Watch the surprise again | سوپرایزەکە دووبارە ببینە | سوپرایزێ دووبارە ببینە |
| 38 | #19 Cherry Confetti: `posterLabel` | مفاجأة عيد ميلاد إلى {name} | A birthday surprise for {name} | سوپرایزێکی ڕۆژی لەدایکبوون بۆ {name} | سوپرایزەکا ڕۆژا ژدایکبوونێ بۆ {name} |
| 39 | #20 Pink Ribbon: `hintLine` | مفاجأة صغيرة، لك وحدك | A little surprise, just for you | سوپرایزێکی بچووک، تەنها بۆ تۆ | سوپرایزەکا بچووک، بتنێ بۆ تە |
| 40 | #20 Pink Ribbon: `hintTap` | اضغط للفتح | Tap to open | دەست بنێ بۆ کردنەوە | دەستێ بدە بۆ ڤەکرنێ |
| 41 | #20 Pink Ribbon: `posterEyebrow` | مفاجأة صغيرة | A little surprise | سوپرایزێکی بچووک | سوپرایزەکا بچووک |
| 42 | #20 Pink Ribbon: `posterDay` | يومٌ مميّز | Your special day | ڕۆژێکی تایبەت | ڕۆژەکا تایبەت |
| 43 | #20 Pink Ribbon: `posterDress` | بكل الحب، لك وحدك | With love, just for you | بە خۆشەویستییەوە، تەنها بۆ تۆ | ب ڤیان، بتنێ بۆ تە |
| 44 | #20 Pink Ribbon: `you` | أنت | You | تۆ | تو |
| 45 | #20 Pink Ribbon: `more` | مزيد من سحر عيد الميلاد | A little more birthday magic | کەمێکی تر لە جادووی ڕۆژی لەدایکبوون | هندەکێ دی ژ سێهرا ڕۆژا ژدایکبوونێ |
| 46 | #20 Pink Ribbon: `justForYou` | لك وحدك | Just for you | تەنها بۆ تۆ | بتنێ بۆ تە |
| 47 | #20 Pink Ribbon: `introTitle` | عيد ميلاد سعيد، | Happy birthday, | ڕۆژی لەدایکبوونت پیرۆز بێت، | ڕۆژا ژدایکبوونا تە پیرۆز بیت، |
| 48 | #20 Pink Ribbon: `introCopy` | لضحكاتٍ تدوم، ومفاجآتٍ حلوة، / وعامٍ يحمل مزيداً من السحر. | Here’s to laughter that lasts, sweet surprises, / and a year with a little more magic. | بۆ پێکەنینێک کە بمێنێتەوە، سوپرایزی شیرین، / و ساڵێک کە جادووی زیاتری تێدابێت. | بۆ کەنیێن بمینن، سوپرایزێن شرین، / و ساڵەکێ کو سێهرا پتر تێدا هەبیت. |
| 49 | #20 Pink Ribbon: `introSign` | كل عام وأنت بخير. | Happy, happy birthday. | ساڵانێکی پڕ لە خۆشی. | هەمی ساڵ تو ب خێر بی. |
| 50 | #20 Pink Ribbon: `wishEyebrow` | طقسٌ صغير لعيد الميلاد | A small birthday ritual | ڕێوڕەسمێکی بچووکی ڕۆژی لەدایکبوون | ڕێوڕەسمەکا بچووکا ڕۆژا ژدایکبوونێ |
| 51 | #20 Pink Ribbon: `wishTitle` | عينان مغمضتان… | Close your eyes. | چاوەکانت دابخە. | چاڤێن خۆ بگرە. |
| 52 | #20 Pink Ribbon: `wishTitleEm` | وأمنيةٌ صغيرة. | Make a wish. | ئاواتێک بخوازە. | هیڤیەکێ بخوازە. |
| 53 | #20 Pink Ribbon: `wishInstruction` | أمنيةٌ صغيرة تبقى سرّاً، / وضوء الشمعة يحملها بعيداً. | Keep a little wish to yourself, / then let the candlelight carry it. | ئاواتێکی بچووک بۆ خۆت بهێڵەرەوە، / پاشان با ڕووناکی مۆمەکە هەڵیبگرێت. | هیڤیەکا بچووک بۆ خۆ بهێلە، / پاشان بلا ڕوناهیا مۆمێ هەلگریت. |
| 54 | #20 Pink Ribbon: `makeWish` | لحظة الأمنية | Make a birthday wish | ئاواتێکی ڕۆژی لەدایکبوون بخوازە | هیڤیەکا ڕۆژا ژدایکبوونێ بخوازە |
| 55 | #20 Pink Ribbon: `wishMade` | أمنيةٌ لك وحدك | A wish, just for you | ئاواتێک، تەنها بۆ تۆ | هیڤیەک، بتنێ بۆ تە |
| 56 | #20 Pink Ribbon: `wishMadeTitle` | لتجد الأشياء الجميلة | May lovely things | با شتە جوانەکان | بلا تشتێن جوان |
| 57 | #20 Pink Ribbon: `wishMadeEm` | طريقها إليك. | find their way to you. | ڕێگای خۆیان بۆ لای تۆ بدۆزنەوە. | ڕێکا خۆ بۆ نک تە ببیننەڤە. |
| 58 | #20 Pink Ribbon: `wishMadeCopy` | مغامراتٌ جديدة. ولحظاتُ هدوء. / وأسبابٌ كثيرة للابتسام. | New adventures. Peaceful moments. / And so many reasons to smile. | سەرکێشیی نوێ. ساتی ئارام. / و هۆکاری زۆر بۆ زەردەخەنە. | سەربۆرێن نوو. دەمێن ئارام. / و گەلەک ئەگەرێن کەنینێ. |
| 59 | #20 Pink Ribbon: `relight` | أمنيةٌ صغيرة أخرى | One more little wish | ئاواتێکی بچووکی تر | هیڤیەکا بچووکا دی |
| 60 | #20 Pink Ribbon: `candle` | شمعة عيد ميلاد تنتظر أمنية | A birthday candle, waiting for a wish | مۆمێکی ڕۆژی لەدایکبوون، چاوەڕێی ئاواتێکە | مۆمەکا ڕۆژا ژدایکبوونێ، ل هیڤیا هیڤیەکێ |
| 61 | #20 Pink Ribbon: `candleOut` | انطفأت الشمعة، والأمنية في طريقها. | The birthday candle is out. Your birthday wish is made. | مۆمەکە کوژایەوە. ئاواتەکەت خواسترا. | مۆم ڤەمری. هیڤیا تە هاتە خواستن. |
| 62 | #20 Pink Ribbon: `dayToCelebrate` | يومٌ للاحتفال | A day to celebrate | ڕۆژێک بۆ ئاهەنگگێڕان | ڕۆژەک بۆ ئاهەنگێ |
| 63 | #20 Pink Ribbon: `letterEyebrow` | للعام القادم | For the year ahead | بۆ ساڵی داهاتوو | بۆ ساڵا بهێت |
| 64 | #20 Pink Ribbon: `letterTitle` | مزيدٌ من الفرح. / مزيدٌ من الدهشة. | More joy. / More wonder. | خۆشیی زیاتر. / سەرسوڕمانی زیاتر. | دلخۆشیا پتر. / سەرسوڕمانا پتر. |
| 65 | #20 Pink Ribbon: `letterTitleEm` | ومزيدٌ مما يُسعدك. | More of what you love. | و زیاتر لەوەی خۆشت دەوێت. | و پتر ژ وێ تشتێ تو حەز ژێ دکەی. |
| 66 | #20 Pink Ribbon: `message` | أتمنى لك يوماً مليئاً بالمفاجآت الحلوة واللحظات السعيدة وكل ما يُسعدك. | Wishing you a day full of sweet surprises, happy moments, and all the things you love. | ڕۆژێکی پڕ لە سوپرایزی شیرین و ساتی خۆش و هەموو ئەو شتانەی خۆشت دەوێن بۆت دەخوازم. | ڕۆژەکا تژی سوپرایزێن شرین و دەمێن خۆش و هەمی ئەو تشتێن تو حەز ژێ دکەی بۆ تە دخوازم. |
| 67 | #20 Pink Ribbon: `letterSign` | مع أحرّ تمنيات عيد الميلاد. | With the warmest birthday wishes. | بە گەرمترین ئاواتەکانی ڕۆژی لەدایکبوون. | ب گەرمترین هیڤیێن ڕۆژا ژدایکبوونێ. |
| 68 | #20 Pink Ribbon: `footerEyebrow` | عيد ميلاد سعيد | Happy birthday | ڕۆژی لەدایکبوونت پیرۆز | ڕۆژا ژدایکبوونا تە پیرۆز |
| 69 | #20 Pink Ribbon: `footerCopy` | قليلٌ من الحب، قليلٌ من البريق، / ويومٌ كامل للاحتفال بك. | A little love. A little sparkle. / A whole day to celebrate you. | کەمێک خۆشەویستی. کەمێک درەوشانەوە. / ڕۆژێکی تەواو بۆ ئاهەنگگێڕان بە تۆ. | هندەک ڤیان. هندەک بریسک. / ڕۆژەکا تمام بۆ ئاهەنگگێڕانا تە. |
| 70 | #20 Pink Ribbon: `replay` | إعادة المفاجأة | Watch the surprise again | سوپرایزەکە دووبارە ببینە | سوپرایزێ دووبارە ببینە |
| 71 | #20 Pink Ribbon: `posterLabel` | مفاجأة عيد ميلاد إلى {name} | A birthday surprise for {name} | سوپرایزێکی ڕۆژی لەدایکبوون بۆ {name} | سوپرایزەکا ڕۆژا ژدایکبوونێ بۆ {name} |
| 72 | #21 Floral Surprise: `hintLine` | مفاجأة صغيرة، لك وحدك | A little surprise, just for you | سوپرایزێکی بچووک، تەنها بۆ تۆ | سوپرایزەکا بچووک، بتنێ بۆ تە |
| 73 | #21 Floral Surprise: `hintTap` | اضغط للفتح | Tap to open | دەست بنێ بۆ کردنەوە | دەستێ بدە بۆ ڤەکرنێ |
| 74 | #21 Floral Surprise: `posterEyebrow` | إليك | For you | بۆ تۆ | بۆ تە |
| 75 | #21 Floral Surprise: `posterParty` | مع الحب | With love | بە خۆشەویستییەوە | ب ڤیان |
| 76 | #21 Floral Surprise: `posterDay` | يومٌ مميّز | Your special day | ڕۆژێکی تایبەت | ڕۆژەکا تایبەت |
| 77 | #21 Floral Surprise: `posterDress` | يومٌ لك وحدك | A day just for you | ڕۆژێک تەنها بۆ تۆ | ڕۆژەک بتنێ بۆ تە |
| 78 | #21 Floral Surprise: `you` | أنت | You | تۆ | تو |
| 79 | #21 Floral Surprise: `more` | مزيد من سحر عيد الميلاد | A little more birthday magic | کەمێکی تر لە جادووی ڕۆژی لەدایکبوون | هندەکێ دی ژ سێهرا ڕۆژا ژدایکبوونێ |
| 80 | #21 Floral Surprise: `justForYou` | لك وحدك | Just for you | تەنها بۆ تۆ | بتنێ بۆ تە |
| 81 | #21 Floral Surprise: `introTitle` | عيد ميلاد سعيد، | Happy birthday, | ڕۆژی لەدایکبوونت پیرۆز بێت، | ڕۆژا ژدایکبوونا تە پیرۆز بیت، |
| 82 | #21 Floral Surprise: `introCopy` | لضحكاتٍ تدوم، ومفاجآتٍ حلوة، / وعامٍ يحمل مزيداً من السحر. | Here’s to laughter that lasts, sweet surprises, / and a year with a little more magic. | بۆ پێکەنینێک کە بمێنێتەوە، سوپرایزی شیرین، / و ساڵێک کە جادووی زیاتری تێدابێت. | بۆ کەنیێن بمینن، سوپرایزێن شرین، / و ساڵەکێ کو سێهرا پتر تێدا هەبیت. |
| 83 | #21 Floral Surprise: `introSign` | كل عام وأنت بخير. | Happy, happy birthday. | ساڵانێکی پڕ لە خۆشی. | هەمی ساڵ تو ب خێر بی. |
| 84 | #21 Floral Surprise: `wishEyebrow` | طقسٌ صغير لعيد الميلاد | A small birthday ritual | ڕێوڕەسمێکی بچووکی ڕۆژی لەدایکبوون | ڕێوڕەسمەکا بچووکا ڕۆژا ژدایکبوونێ |
| 85 | #21 Floral Surprise: `wishTitle` | عينان مغمضتان… | Close your eyes. | چاوەکانت دابخە. | چاڤێن خۆ بگرە. |
| 86 | #21 Floral Surprise: `wishTitleEm` | وأمنيةٌ صغيرة. | Make a wish. | ئاواتێک بخوازە. | هیڤیەکێ بخوازە. |
| 87 | #21 Floral Surprise: `wishInstruction` | أمنيةٌ صغيرة تبقى سرّاً، / وضوء الشمعة يحملها بعيداً. | Keep a little wish to yourself, / then let the candlelight carry it. | ئاواتێکی بچووک بۆ خۆت بهێڵەرەوە، / پاشان با ڕووناکی مۆمەکە هەڵیبگرێت. | هیڤیەکا بچووک بۆ خۆ بهێلە، / پاشان بلا ڕوناهیا مۆمێ هەلگریت. |
| 88 | #21 Floral Surprise: `makeWish` | لحظة الأمنية | Make a birthday wish | ئاواتێکی ڕۆژی لەدایکبوون بخوازە | هیڤیەکا ڕۆژا ژدایکبوونێ بخوازە |
| 89 | #21 Floral Surprise: `wishMade` | أمنيةٌ لك وحدك | A wish, just for you | ئاواتێک، تەنها بۆ تۆ | هیڤیەک، بتنێ بۆ تە |
| 90 | #21 Floral Surprise: `wishMadeTitle` | لتجد الأشياء الجميلة | May lovely things | با شتە جوانەکان | بلا تشتێن جوان |
| 91 | #21 Floral Surprise: `wishMadeEm` | طريقها إليك. | find their way to you. | ڕێگای خۆیان بۆ لای تۆ بدۆزنەوە. | ڕێکا خۆ بۆ نک تە ببیننەڤە. |
| 92 | #21 Floral Surprise: `wishMadeCopy` | مغامراتٌ جديدة. ولحظاتُ هدوء. / وأسبابٌ كثيرة للابتسام. | New adventures. Peaceful moments. / And so many reasons to smile. | سەرکێشیی نوێ. ساتی ئارام. / و هۆکاری زۆر بۆ زەردەخەنە. | سەربۆرێن نوو. دەمێن ئارام. / و گەلەک ئەگەرێن کەنینێ. |
| 93 | #21 Floral Surprise: `relight` | أمنيةٌ صغيرة أخرى | One more little wish | ئاواتێکی بچووکی تر | هیڤیەکا بچووکا دی |
| 94 | #21 Floral Surprise: `candle` | شمعة عيد ميلاد تنتظر أمنية | A birthday candle, waiting for a wish | مۆمێکی ڕۆژی لەدایکبوون، چاوەڕێی ئاواتێکە | مۆمەکا ڕۆژا ژدایکبوونێ، ل هیڤیا هیڤیەکێ |
| 95 | #21 Floral Surprise: `candleOut` | انطفأت الشمعة، والأمنية في طريقها. | The birthday candle is out. Your birthday wish is made. | مۆمەکە کوژایەوە. ئاواتەکەت خواسترا. | مۆم ڤەمری. هیڤیا تە هاتە خواستن. |
| 96 | #21 Floral Surprise: `dayToCelebrate` | يومٌ للاحتفال | A day to celebrate | ڕۆژێک بۆ ئاهەنگگێڕان | ڕۆژەک بۆ ئاهەنگێ |
| 97 | #21 Floral Surprise: `letterEyebrow` | للعام القادم | For the year ahead | بۆ ساڵی داهاتوو | بۆ ساڵا بهێت |
| 98 | #21 Floral Surprise: `letterTitle` | مزيدٌ من الفرح. / مزيدٌ من الدهشة. | More joy. / More wonder. | خۆشیی زیاتر. / سەرسوڕمانی زیاتر. | دلخۆشیا پتر. / سەرسوڕمانا پتر. |
| 99 | #21 Floral Surprise: `letterTitleEm` | ومزيدٌ مما يُسعدك. | More of what you love. | و زیاتر لەوەی خۆشت دەوێت. | و پتر ژ وێ تشتێ تو حەز ژێ دکەی. |
| 100 | #21 Floral Surprise: `message` | أتمنى لك عيد ميلاد جميلاً كباقة ورد، حلواً كأول قطعة من الكعكة، ومليئاً بلحظاتٍ تستحق أن تبقى. | Wishing you a birthday as lovely as a bouquet, as sweet as the first slice of cake, and full of moments you’ll want to keep. | ڕۆژی لەدایکبوونێکت بۆ دەخوازم بە جوانیی چەپکە گوڵێک، بە شیرینیی یەکەم پارچەی کێک، و پڕ لەو ساتانەی دەتەوێت بیانپارێزیت. | ڕۆژا ژدایکبوونەکێ بۆ تە دخوازم ب جوانیا چەپکە گولەکێ، ب شرینیا ئێکەمین پارچا کێکێ، و تژی وان دەمێن تو دڤێی بپارێزی. |
| 101 | #21 Floral Surprise: `letterSign` | مع أحرّ تمنيات عيد الميلاد. | With the warmest birthday wishes. | بە گەرمترین ئاواتەکانی ڕۆژی لەدایکبوون. | ب گەرمترین هیڤیێن ڕۆژا ژدایکبوونێ. |
| 102 | #21 Floral Surprise: `footerEyebrow` | عيد ميلاد سعيد | Happy birthday | ڕۆژی لەدایکبوونت پیرۆز | ڕۆژا ژدایکبوونا تە پیرۆز |
| 103 | #21 Floral Surprise: `footerCopy` | قليلٌ من الحب، قليلٌ من البريق، / ويومٌ كامل للاحتفال بك. | A little love. A little sparkle. / A whole day to celebrate you. | کەمێک خۆشەویستی. کەمێک درەوشانەوە. / ڕۆژێکی تەواو بۆ ئاهەنگگێڕان بە تۆ. | هندەک ڤیان. هندەک بریسک. / ڕۆژەکا تمام بۆ ئاهەنگگێڕانا تە. |
| 104 | #21 Floral Surprise: `replay` | إعادة المفاجأة | Watch the surprise again | سوپرایزەکە دووبارە ببینە | سوپرایزێ دووبارە ببینە |
| 105 | #21 Floral Surprise: `posterLabel` | مفاجأة عيد ميلاد إلى {name} | A birthday surprise for {name} | سوپرایزێکی ڕۆژی لەدایکبوون بۆ {name} | سوپرایزەکا ڕۆژا ژدایکبوونێ بۆ {name} |
| 106 | #22 Blush Floral: `hintTap` | اضغط للفتح | Tap to open | دەست بنێ بۆ کردنەوە | دەستێ بدە بۆ ڤەکرنێ |
| 107 | #22 Blush Floral: `posterEyebrow` | أنتم مدعوّون إلى | You are invited to | بانگهێشتن بۆ | هوین داخوازکرینە بۆ |
| 108 | #22 Blush Floral: `posterName` | {name} | {name}’s | {name} | {name} |
| 109 | #22 Blush Floral: `posterParty` | حفلة عيد الميلاد | Party | ئاهەنگی ڕۆژی لەدایکبوون | ئاهەنگا ڕۆژا ژدایکبوونێ |
| 110 | #22 Blush Floral: `posterSoon` | احفظوا الموعد | Save the date | ڕێکەوتەکە بپارێزن | ڕێکەفتێ بپارێزن |
| 111 | #22 Blush Floral: `more` | الاحتفال | The celebration | ئاهەنگەکە | ئاهەنگ |
| 112 | #22 Blush Floral: `invited` | أنتم مدعوّون | You’re invited | بانگهێشتکراون | هوین داخوازکرینە |
| 113 | #22 Blush Floral: `introTitle` | احتفالٌ صغير. | A little celebration. | ئاهەنگێکی بچووک. | ئاهەنگەکا بچووک. |
| 114 | #22 Blush Floral: `introEm` | في كامل تفتّحه. | In full bloom. | لە ئەوپەڕی گوڵکردندا. | د گەشبوونا خۆ یا تمام دا. |
| 115 | #22 Blush Floral: `introCopy` | عامٌ آخر نجتمع فيه ونتمنّى أمنية، / ونملأ المساء بذكرياتٍ جميلة. | Another year to gather, make a wish, / and fill the evening with lovely memories. | ساڵێکی تر بۆ کۆبوونەوە و خواستنی ئاواتێک، / و پڕکردنی ئێوارەکە بە یادەوەریی جوان. | ساڵەکا دی بۆ کۆمبوونێ و خواستنا هیڤیەکێ، / و تژیکرنا ئێڤارێ ب بیرهاتنێن جوان. |
| 116 | #22 Blush Floral: `introSign` | تعالوا احتفلوا مع {name}. | Come celebrate with {name}. | وەرن لەگەڵ {name} ئاهەنگ بگێڕن. | وەرن دگەل {name} ئاهەنگێ بگێڕن. |
| 117 | #22 Blush Floral: `occasionNo` | ٠١ / المناسبة | 01 / The occasion | ٠١ / بۆنەکە | ٠١ / بۆنە |
| 118 | #22 Blush Floral: `detailsTitle` | كلّ التفاصيل | All the | هەموو | هەمی |
| 119 | #22 Blush Floral: `detailsEm` | الجميلة. | lovely details. | وردەکارییە جوانەکان. | هوویرکاریێن جوان. |
| 120 | #22 Blush Floral: `thePlace` | المكان | The place | شوێن | جه |
| 121 | #22 Blush Floral: `gathering` | لقاءٌ لعيد الميلاد / مع أحبّ الناس إلينا. | A birthday gathering / with our favourite people. | کۆبوونەوەیەکی ڕۆژی لەدایکبوون / لەگەڵ خۆشەویستترین کەسەکانمان. | کۆمبوونەکا ڕۆژا ژدایکبوونێ / دگەل خۆشتڤیترین کەسێن مە. |
| 122 | #22 Blush Floral: `untilWe` | حتى نحتفل | Until we celebrate | تا ئاهەنگ دەگێڕین | هەتا ئاهەنگێ دگێڕین |
| 123 | #22 Blush Floral: `soonTitle` | شيءٌ جميل | Something lovely | شتێکی جوان | تشتەکێ جوان |
| 124 | #22 Blush Floral: `soonEm` | في الطريق. | is on the way. | لە ڕێگادایە. | ل ڕێکێ یە. |
| 125 | #22 Blush Floral: `wishCaption` | أمنيةٌ لكلّ شمعة | A wish for every candle | ئاواتێک بۆ هەر مۆمێک | هیڤیەک بۆ هەر مۆمەکێ |
| 126 | #22 Blush Floral: `wishEyebrow` | زهورٌ وشموعٌ وصحبةٌ طيبة | Flowers, candles & good company | گوڵ و مۆم و هاوڕێیەتیی خۆش | گول و مۆم و هەڤالینیا خۆش |
| 127 | #22 Blush Floral: `wishTitle` | أحضِروا قليلاً من الفرح. | Bring a little joy. | کەمێک خۆشی لەگەڵ خۆتان بهێنن. | هندەک دلخۆشیێ دگەل خۆ بینن. |
| 128 | #22 Blush Floral: `wishEm` | سنحتفظ لكم بقطعة. | We’ll save you a slice. | پارچەیەک کێکتان بۆ هەڵدەگرین. | دێ پارچەکا کێکێ بۆ هەوە هەلگرین. |
| 129 | #22 Blush Floral: `wishCopy` | لحظةٌ لأمنيات عيد الميلاد، ونخبٌ للعام القادم، وللناس الذين يجعلون كلّ احتفالٍ أحلى. | A moment for birthday wishes, a toast to the year ahead, and the people who make every celebration sweeter. | ساتێک بۆ ئاواتەکانی ڕۆژی لەدایکبوون، بەرزکردنەوەی پەرداخێک بۆ ساڵی داهاتوو، و ئەو کەسانەی هەموو ئاهەنگێک شیرینتر دەکەن. | دەمەک بۆ هیڤیێن ڕۆژا ژدایکبوونێ، بلندکرنا پەرداخەکێ بۆ ساڵا بهێت، و ئەو کەسێن هەمی ئاهەنگان شرینتر دکەن. |
| 130 | #22 Blush Floral: `wishLink` | كونوا جزءاً من الاحتفال | Be part of the celebration | ببنە بەشێک لە ئاهەنگەکە | ببنە پشکەک ژ ئاهەنگێ |
| 131 | #22 Blush Floral: `photo1` | لحظةٌ صغيرة، وذكرى جميلة. | A little moment, a lovely memory. | ساتێکی بچووک، یادەوەرییەکی جوان. | دەمەکێ بچووک، بیرهاتنەکا جوان. |
| 132 | #22 Blush Floral: `photo2` | والكثير مما هو آتٍ. | And so many more to come. | و زۆری تریش لە ڕێگادایە. | و گەلەکێن دی ل ڕێکێ نە. |
| 133 | #22 Blush Floral: `noteEyebrow` | كلمةٌ صغيرة | A little note | چەند وشەیەک | چەند پەیڤەک |
| 134 | #22 Blush Floral: `noteDefault` | يسعدني أن نحتفل معاً. تعالوا للكعكة والشموع والصحبة الطيبة، فلن يكتمل اليوم من دونكم. | I would love to celebrate with you. Come for cake, candles and good company — it wouldn’t be the same without you. | زۆر دڵخۆش دەبم ئەگەر پێکەوە ئاهەنگ بگێڕین. وەرن بۆ کێک و مۆم و هاوڕێیەتیی خۆش، بەبێ ئێوە ڕۆژەکە تەواو نابێت. | دێ گەلەک دلخۆش بم ئەگەر پێکڤە ئاهەنگێ بگێڕین. وەرن بۆ کێک و مۆم و هەڤالینیا خۆش، بێ هەوە ڕۆژ تمام نابیت. |
| 135 | #22 Blush Floral: `replyEyebrow` | ردٌّ صغير | A little note back | وەڵامێکی بچووک | بەرسڤەکا بچووک |
| 136 | #22 Blush Floral: `replyTitle` | هل ستنضمّون | Will you | ئایا دێنە | ئەرێ هوین دێ |
| 137 | #22 Blush Floral: `replyEm` | إلينا؟ | join us? | لامان؟ | ئێنە نک مە؟ |
| 138 | #22 Blush Floral: `replyCopy` | حضوركم يجعل كلّ شيءٍ أجمل. | Your presence would make it all the lovelier. | ئامادەبوونتان هەموو شتێک جوانتر دەکات. | ئامادەبوونا هەوە هەمی تشتان جوانتر دکەت. |
| 139 | #22 Blush Floral: `guestbook` | تهاني عيد الميلاد | Birthday wishes | پیرۆزباییەکانی ڕۆژی لەدایکبوون | پیرۆزباهیێن ڕۆژا ژدایکبوونێ |
| 140 | #22 Blush Floral: `footerEyebrow` | مع الحب | With love | بە خۆشەویستییەوە | ب ڤیان |
| 141 | #22 Blush Floral: `footerCopy` | إلى عامٍ جميلٍ آخر. | Here’s to another beautiful year. | بۆ ساڵێکی جوانی تر. | بۆ ساڵەکا جوان یا دی. |
| 142 | #22 Blush Floral: `replay` | شاهدوها من جديد | Watch it unfold again | دووبارە بیبینەوە | دووبارە ببینە |
| 143 | #22 Blush Floral: `posterLabel` | دعوة إلى حفلة عيد ميلاد {name} | An invitation to {name}’s birthday party | بانگهێشتنامە بۆ ئاهەنگی ڕۆژی لەدایکبوونی {name} | داخوازنامە بۆ ئاهەنگا ڕۆژا ژدایکبوونا {name} |
| 144 | #22 Blush Floral: photo label 1 | الصورة الأولى | First photo | وێنەی یەکەم | وێنێ ئێکێ |
| 145 | #22 Blush Floral: photo label 2 | الصورة الثانية | Second photo | وێنەی دووەم | وێنێ دوویێ |

## Batch 39 — coming or not beside each guest's message — ✅ AUTO-APPROVED (2026-10-27, owner checks in Admin → Translations)

| # | Where | Arabic | English | Sorani (ckb) | Badini (bdn) |
|---|---|---|---|---|---|
| 1 | Keepsake, beside the guest's name | حضور | Coming | ئامادە دەبێت | دێ ئامادە بیت |
| 2 | Keepsake, beside the guest's name | اعتذار | Not coming | ئامادە نابێت | ئامادە نابیت |
| 3 | Receipt: list of replies (keep `{count}`) | من ردّ ({count}) | Who replied ({count}) | کێ وەڵامی داوەتەوە ({count}) | کێ بەرسڤ دایە ({count}) |
| 4 | Receipt: a reply | سيحضر | Coming | ئامادە دەبێت | دێ ئامادە بیت |
| 5 | Receipt: a reply | لن يحضر | Not coming | ئامادە نابێت | ئامادە نابیت |

## Batch 40 — homepage designs row — ✅ AUTO-APPROVED (2026-10-27, owner checks in Admin → Translations)

| # | Where | Arabic | English | Sorani (ckb) | Badini (bdn) |
|---|---|---|---|---|---|
| 1 | Under the moving row of designs | اسحبوا لتتصفحوا التصاميم | Swipe to browse the designs | ڕایبکێشن بۆ بینینی دیزاینەکان | ڕابکێشن دا دیزاینان ببینن |

## Batch 41 — how many people a guest replies for — ✅ AUTO-APPROVED (2026-10-28, owner checks in Admin → Translations)

| # | Where | Arabic | English | Sorani (ckb) | Badini (bdn) |
|---|---|---|---|---|---|
| 1 | Guest form, under the name (`invitation.partySize`) | عدد الأشخاص | How many of you? | ژمارەی کەسەکان | هژمارا کەسان |
| 2 | Its − button, read out (`invitation.partyFewer`) | شخص أقل | One fewer | کەسێک کەمتر | کەسەک کێمتر |
| 3 | Its + button, read out (`invitation.partyMore`) | شخص إضافي | One more | کەسێک زیاتر | کەسەک پتر |
| 4 | Keepsake, after a guest's name when more than one (`invitation.guestParty`) | العدد {count} | {count} people | {count} کەس | {count} کەس |
| 5 | Couple's receipt, beside a reply (`receipt.replyParty`) | العدد {count} | {count} people | {count} کەس | {count} کەس |

## Batch 42 — a birthday's place is optional — ✅ AUTO-APPROVED (2026-10-28, owner checks in Admin → Translations)

| # | Where | Arabic | English | Sorani (ckb) | Badini (bdn) |
|---|---|---|---|---|---|
| 1 | Order form, the tick box before the place (`store.addPlace`) | إضافة مكان الحفل | Add the place of the celebration | زیادکردنی شوێنی ئاهەنگ | زێدەکرنا جهێ ئاهەنگێ |

## Batch 43 — birthday designs v2 (#19–#22), Cherry Confetti Party (#23), Pink Ribbon Party (#24), photo collages — ✅ AUTO-APPROVED (2026-10-28, owner checks in Admin → Translations)

The birthday designs' wording was rewritten to read naturally (owner request: «too robotic»), so v2 of #19–#22 lists
every line that changed. #23 and #24 are the own-party invitations of #19 and #20; their other lines are Blush Floral
v2's (rows above). The design lines live in each design's `copy.ts` (frozen once activated); the platform lines (the
photo collages) are in `src/i18n/messages`.

| # | Where | Arabic | English | Sorani (ckb) | Badini (bdn) |
|---|---|---|---|---|---|
| 1 | #19 Cherry Confetti v2: `hintLine` | عندي لك مفاجأة صغيرة | A little surprise, just for you | سوپرایزێکی بچووکم بۆت هەیە | سوپرایزەکا بچووک بۆ تە هەیە |
| 2 | #19 Cherry Confetti v2: `hintTap` | اضغط لتفتحها | Tap to open | دەست بنێ بۆ کردنەوە | دەستێ بدە بۆ ڤەکرنێ |
| 3 | #19 Cherry Confetti v2: `posterEyebrow` | إلى أغلى الناس | A little surprise for | بۆ خۆشەویستترین کەس | بۆ خۆشتڤیترین کەسی |
| 4 | #19 Cherry Confetti v2: `posterDay` | يومك الحلو | Your special day | ڕۆژە شیرینەکەت | ڕۆژا تە یا شرین |
| 5 | #19 Cherry Confetti v2: `posterDress` | كل عام وأنت بخير | A day just for you | ساڵانێکی پڕ لە خۆشی | هەمی ساڵ تو ب خێر بی |
| 6 | #19 Cherry Confetti v2: `more` | وهذه ليست كل المفاجأة | A little more birthday magic | سوپرایزەکە هێشتا تەواو نەبووە | سوپرایز هێشتا ب دوماهی نەهاتیە |
| 7 | #19 Cherry Confetti v2: `justForYou` | خصيصاً لك | Just for you | تایبەت بۆ تۆ | تایبەت بۆ تە |
| 8 | #19 Cherry Confetti v2: `introCopy` | أتمنى أن تكون سنتك الجديدة مليئة بالضحك والمفاجآت الحلوة، / وأن تحمل لك كل ما تتمناه. | Here’s to laughter that lasts, sweet surprises, / and a year with a little more magic. | هیوادارم ساڵە نوێیەکەت پڕ بێت لە پێکەنین و سوپرایزی شیرین، / و هەموو ئەوەی ئاواتی پێ دەخوازیت بۆت بهێنێت. | هیڤیدارم ساڵا تە یا نوو تژی کەنی و سوپرایزێن شرین بیت، / و هەمی ئەوێ تو دخوازی بۆ تە بینیت. |
| 9 | #19 Cherry Confetti v2: `introSign` | وكل عام وأنت بألف خير. | Happy, happy birthday. | هەزار ساڵی تر بە خۆشی. | هەزار ساڵێن دی ب خێر. |
| 10 | #19 Cherry Confetti v2: `wishEyebrow` | لحظة الأمنية | A small birthday ritual | ساتی ئاوات | دەمێ هیڤیێ |
| 11 | #19 Cherry Confetti v2: `wishTitle` | لحظة هادئة… | Close your eyes. | ساتێکی ئارام… | دەمەکێ ئارام… |
| 12 | #19 Cherry Confetti v2: `wishTitleEm` | وأمنية من القلب. | Make a wish. | و ئاواتێک لە دڵەوە. | و هیڤیەک ژ دلی. |
| 13 | #19 Cherry Confetti v2: `wishInstruction` | أمنية في القلب، / وشمعة تنتظر أن تُطفأ. | Keep a little wish to yourself, / then let the candlelight carry it. | ئاواتێک لە دڵدا، / و مۆمێک چاوەڕێی کوژاندنەوەیە. | هیڤیەک د دلی دا، / و مۆمەک ل هیڤیا ڤەمراندنێ. |
| 14 | #19 Cherry Confetti v2: `makeWish` | إطفاء الشمعة | Make a birthday wish | کوژاندنەوەی مۆمەکە | ڤەمراندنا مۆمێ |
| 15 | #19 Cherry Confetti v2: `wishMade` | وصلت الأمنية | A wish, just for you | ئاواتەکە گەیشت | هیڤی گەهشت |
| 16 | #19 Cherry Confetti v2: `wishMadeTitle` | إن شاء الله | May lovely things | بە هیوای خوا | ب هیڤیا خودێ |
| 17 | #19 Cherry Confetti v2: `wishMadeEm` | تتحقق كل أمنياتك. | find their way to you. | هەموو ئاواتەکانت دێنە دی. | هەمی هیڤیێن تە دێ ب جه هێن. |
| 18 | #19 Cherry Confetti v2: `wishMadeCopy` | سنة فيها مغامرات جديدة وراحة بال، / وأسباب كثيرة للابتسامة. | New adventures. Peaceful moments. / And so many reasons to smile. | ساڵێک پڕ لە سەرکێشیی نوێ و ئاسوودەیی، / و هۆکاری زۆر بۆ زەردەخەنە. | ساڵەک تژی سەربۆرێن نوو و ئارامی، / و گەلەک ئەگەرێن کەنیێ. |
| 19 | #19 Cherry Confetti v2: `relight` | أمنية ثانية؟ | One more little wish | ئاواتێکی تر؟ | هیڤیەکا دی؟ |
| 20 | #19 Cherry Confetti v2: `candle` | شمعة عيد الميلاد تنتظر الأمنية | A birthday candle, waiting for a wish | مۆمێکی ڕۆژی لەدایکبوون، چاوەڕێی ئاواتێکە | مۆمەکا ڕۆژا ژدایکبوونێ، ل هیڤیا هیڤیەکێ |
| 21 | #19 Cherry Confetti v2: `candleOut` | انطفأت الشمعة، والأمنية في الطريق. | The birthday candle is out. Your birthday wish is made. | مۆمەکە کوژایەوە. ئاواتەکەت خواسترا. | مۆم ڤەمری. هیڤیا تە هاتە خواستن. |
| 22 | #19 Cherry Confetti v2: `dayToCelebrate` | يوم الاحتفال | A day to celebrate | ڕۆژی ئاهەنگ | ڕۆژا ئاهەنگێ |
| 23 | #19 Cherry Confetti v2: `letterEyebrow` | لسنتك الجديدة | For the year ahead | بۆ ساڵە نوێیەکەت | بۆ ساڵا تە یا نوو |
| 24 | #19 Cherry Confetti v2: `letterTitle` | فرح أكثر، / وضحك أكثر، | More joy. / More wonder. | خۆشیی زیاتر، / پێکەنینی زیاتر، | دلخۆشیا پتر، / کەنیا پتر، |
| 25 | #19 Cherry Confetti v2: `letterTitleEm` | وكل ما يسعدك أكثر. | More of what you love. | و هەموو ئەوەی دڵخۆشت دەکات زیاتر. | و هەمی ئەوێ تە دلخۆش دکەت پتر. |
| 26 | #19 Cherry Confetti v2: `message` | أتمنى لك يوماً حلواً مثلك، مليئاً بالمفاجآت الجميلة والضحك وكل ما يسعدك. كل عام وأنت بخير. | Wishing you a day full of sweet surprises, happy moments, and all the things you love. | ڕۆژێکی شیرین وەک خۆتت بۆ دەخوازم، پڕ لە سوپرایزی جوان و پێکەنین و هەموو ئەوەی دڵخۆشت دەکات. ساڵانێکی پڕ لە خۆشی. | ڕۆژەکا شرین وەکی تە بۆ تە دخوازم، تژی سوپرایزێن جوان و کەنی و هەمی ئەوێ تە دلخۆش دکەت. هەمی ساڵ تو ب خێر بی. |
| 27 | #19 Cherry Confetti v2: `letterSign` | مع كل الحب. | With the warmest birthday wishes. | بە هەموو خۆشەویستییەوە. | ب هەمی ڤیانێ. |
| 28 | #19 Cherry Confetti v2: `footerCopy` | كل الحب لك اليوم وكل يوم، / وعقبال المية سنة. | A little love. A little sparkle. / A whole day to celebrate you. | هەموو خۆشەویستییەک بۆ تۆ ئەمڕۆ و هەموو ڕۆژێک، / و بە هیوای سەد ساڵی تر. | هەمی ڤیان بۆ تە ئەڤرۆ و هەمی ڕۆژان، / و ب هیڤیا سەد ساڵێن دی. |
| 29 | #19 Cherry Confetti v2: `replay` | المفاجأة من جديد | Watch the surprise again | سوپرایزەکە لە سەرەتاوە | سوپرایز ژ دەستپێکێ |
| 30 | #19 Cherry Confetti v2: `posterLabel` | مفاجأة عيد ميلاد لـ{name} | A birthday surprise for {name} | سوپرایزێکی ڕۆژی لەدایکبوون بۆ {name} | سوپرایزەکا ڕۆژا ژدایکبوونێ بۆ {name} |
| 31 | #19 Cherry Confetti v2: `memoriesEyebrow` | لحظات حلوة | Little moments | ساتە شیرینەکان | دەمێن شرین |
| 32 | #19 Cherry Confetti v2: `memoriesTitle` | من أحلى | Some of my favourite | هەندێک لە جوانترین | هندەک ژ جوانترین |
| 33 | #19 Cherry Confetti v2: `memoriesEm` | ذكرياتنا معاً. | memories with you. | یادگارییەکانمان پێکەوە. | بیرهاتنێن مە پێکڤە. |
| 34 | #19 Cherry Confetti v2: photo label 1 | الصورة الأولى | First photo | وێنەی یەکەم | وێنێ ئێکێ |
| 35 | #19 Cherry Confetti v2: photo label 2 | الصورة الثانية | Second photo | وێنەی دووەم | وێنێ دوویێ |
| 36 | #19 Cherry Confetti v2: photo label 3 | الصورة الثالثة | Third photo | وێنەی سێیەم | وێنێ سێیێ |
| 37 | #20 Pink Ribbon v2: `hintLine` | عندي لك مفاجأة صغيرة | A little surprise, just for you | سوپرایزێکی بچووکم بۆت هەیە | سوپرایزەکا بچووک بۆ تە هەیە |
| 38 | #20 Pink Ribbon v2: `hintTap` | اضغط لتفتحها | Tap to open | دەست بنێ بۆ کردنەوە | دەستێ بدە بۆ ڤەکرنێ |
| 39 | #20 Pink Ribbon v2: `posterDay` | يومك الحلو | Your special day | ڕۆژە شیرینەکەت | ڕۆژا تە یا شرین |
| 40 | #20 Pink Ribbon v2: `posterDress` | بكل الحب، لك أنت | With love, just for you | بە خۆشەویستییەوە، تەنها بۆ تۆ | ب ڤیان، بتنێ بۆ تە |
| 41 | #20 Pink Ribbon v2: `more` | وهذه ليست كل المفاجأة | A little more birthday magic | سوپرایزەکە هێشتا تەواو نەبووە | سوپرایز هێشتا ب دوماهی نەهاتیە |
| 42 | #20 Pink Ribbon v2: `justForYou` | خصيصاً لك | Just for you | تایبەت بۆ تۆ | تایبەت بۆ تە |
| 43 | #20 Pink Ribbon v2: `introCopy` | أتمنى أن تكون سنتك الجديدة مليئة بالضحك والمفاجآت الحلوة، / وأن تحمل لك كل ما تتمناه. | Here’s to laughter that lasts, sweet surprises, / and a year with a little more magic. | هیوادارم ساڵە نوێیەکەت پڕ بێت لە پێکەنین و سوپرایزی شیرین، / و هەموو ئەوەی ئاواتی پێ دەخوازیت بۆت بهێنێت. | هیڤیدارم ساڵا تە یا نوو تژی کەنی و سوپرایزێن شرین بیت، / و هەمی ئەوێ تو دخوازی بۆ تە بینیت. |
| 44 | #20 Pink Ribbon v2: `introSign` | وكل عام وأنت بألف خير. | Happy, happy birthday. | هەزار ساڵی تر بە خۆشی. | هەزار ساڵێن دی ب خێر. |
| 45 | #20 Pink Ribbon v2: `wishEyebrow` | لحظة الأمنية | A small birthday ritual | ساتی ئاوات | دەمێ هیڤیێ |
| 46 | #20 Pink Ribbon v2: `wishTitle` | لحظة هادئة… | Close your eyes. | ساتێکی ئارام… | دەمەکێ ئارام… |
| 47 | #20 Pink Ribbon v2: `wishTitleEm` | وأمنية من القلب. | Make a wish. | و ئاواتێک لە دڵەوە. | و هیڤیەک ژ دلی. |
| 48 | #20 Pink Ribbon v2: `wishInstruction` | أمنية في القلب، / وشمعة تنتظر أن تُطفأ. | Keep a little wish to yourself, / then let the candlelight carry it. | ئاواتێک لە دڵدا، / و مۆمێک چاوەڕێی کوژاندنەوەیە. | هیڤیەک د دلی دا، / و مۆمەک ل هیڤیا ڤەمراندنێ. |
| 49 | #20 Pink Ribbon v2: `makeWish` | إطفاء الشمعة | Make a birthday wish | کوژاندنەوەی مۆمەکە | ڤەمراندنا مۆمێ |
| 50 | #20 Pink Ribbon v2: `wishMade` | وصلت الأمنية | A wish, just for you | ئاواتەکە گەیشت | هیڤی گەهشت |
| 51 | #20 Pink Ribbon v2: `wishMadeTitle` | إن شاء الله | May lovely things | بە هیوای خوا | ب هیڤیا خودێ |
| 52 | #20 Pink Ribbon v2: `wishMadeEm` | تتحقق كل أمنياتك. | find their way to you. | هەموو ئاواتەکانت دێنە دی. | هەمی هیڤیێن تە دێ ب جه هێن. |
| 53 | #20 Pink Ribbon v2: `wishMadeCopy` | سنة فيها مغامرات جديدة وراحة بال، / وأسباب كثيرة للابتسامة. | New adventures. Peaceful moments. / And so many reasons to smile. | ساڵێک پڕ لە سەرکێشیی نوێ و ئاسوودەیی، / و هۆکاری زۆر بۆ زەردەخەنە. | ساڵەک تژی سەربۆرێن نوو و ئارامی، / و گەلەک ئەگەرێن کەنیێ. |
| 54 | #20 Pink Ribbon v2: `relight` | أمنية ثانية؟ | One more little wish | ئاواتێکی تر؟ | هیڤیەکا دی؟ |
| 55 | #20 Pink Ribbon v2: `candle` | شمعة عيد الميلاد تنتظر الأمنية | A birthday candle, waiting for a wish | مۆمێکی ڕۆژی لەدایکبوون، چاوەڕێی ئاواتێکە | مۆمەکا ڕۆژا ژدایکبوونێ، ل هیڤیا هیڤیەکێ |
| 56 | #20 Pink Ribbon v2: `candleOut` | انطفأت الشمعة، والأمنية في الطريق. | The birthday candle is out. Your birthday wish is made. | مۆمەکە کوژایەوە. ئاواتەکەت خواسترا. | مۆم ڤەمری. هیڤیا تە هاتە خواستن. |
| 57 | #20 Pink Ribbon v2: `dayToCelebrate` | يوم الاحتفال | A day to celebrate | ڕۆژی ئاهەنگ | ڕۆژا ئاهەنگێ |
| 58 | #20 Pink Ribbon v2: `letterEyebrow` | لسنتك الجديدة | For the year ahead | بۆ ساڵە نوێیەکەت | بۆ ساڵا تە یا نوو |
| 59 | #20 Pink Ribbon v2: `letterTitle` | فرح أكثر، / وضحك أكثر، | More joy. / More wonder. | خۆشیی زیاتر، / پێکەنینی زیاتر، | دلخۆشیا پتر، / کەنیا پتر، |
| 60 | #20 Pink Ribbon v2: `letterTitleEm` | وكل ما يسعدك أكثر. | More of what you love. | و هەموو ئەوەی دڵخۆشت دەکات زیاتر. | و هەمی ئەوێ تە دلخۆش دکەت پتر. |
| 61 | #20 Pink Ribbon v2: `message` | أتمنى لك يوماً حلواً مثلك، مليئاً بالمفاجآت الجميلة والضحك وكل ما يسعدك. كل عام وأنت بخير. | Wishing you a day full of sweet surprises, happy moments, and all the things you love. | ڕۆژێکی شیرین وەک خۆتت بۆ دەخوازم، پڕ لە سوپرایزی جوان و پێکەنین و هەموو ئەوەی دڵخۆشت دەکات. ساڵانێکی پڕ لە خۆشی. | ڕۆژەکا شرین وەکی تە بۆ تە دخوازم، تژی سوپرایزێن جوان و کەنی و هەمی ئەوێ تە دلخۆش دکەت. هەمی ساڵ تو ب خێر بی. |
| 62 | #20 Pink Ribbon v2: `letterSign` | مع كل الحب. | With the warmest birthday wishes. | بە هەموو خۆشەویستییەوە. | ب هەمی ڤیانێ. |
| 63 | #20 Pink Ribbon v2: `footerCopy` | كل الحب لك اليوم وكل يوم، / وعقبال المية سنة. | A little love. A little sparkle. / A whole day to celebrate you. | هەموو خۆشەویستییەک بۆ تۆ ئەمڕۆ و هەموو ڕۆژێک، / و بە هیوای سەد ساڵی تر. | هەمی ڤیان بۆ تە ئەڤرۆ و هەمی ڕۆژان، / و ب هیڤیا سەد ساڵێن دی. |
| 64 | #20 Pink Ribbon v2: `replay` | المفاجأة من جديد | Watch the surprise again | سوپرایزەکە لە سەرەتاوە | سوپرایز ژ دەستپێکێ |
| 65 | #20 Pink Ribbon v2: `posterLabel` | مفاجأة عيد ميلاد لـ{name} | A birthday surprise for {name} | سوپرایزێکی ڕۆژی لەدایکبوون بۆ {name} | سوپرایزەکا ڕۆژا ژدایکبوونێ بۆ {name} |
| 66 | #20 Pink Ribbon v2: `posterHappy` | عيد ميلاد سعيد | Happy Birthday | ڕۆژی لەدایکبوونت پیرۆز | ڕۆژا ژدایکبوونا تە پیرۆز |
| 67 | #20 Pink Ribbon v2: `memoriesEyebrow` | لحظات حلوة | Little moments | ساتە شیرینەکان | دەمێن شرین |
| 68 | #20 Pink Ribbon v2: `memoriesTitle` | من أحلى | Some of my favourite | هەندێک لە جوانترین | هندەک ژ جوانترین |
| 69 | #20 Pink Ribbon v2: `memoriesEm` | ذكرياتنا معاً. | memories with you. | یادگارییەکانمان پێکەوە. | بیرهاتنێن مە پێکڤە. |
| 70 | #20 Pink Ribbon v2: photo label 1 | الصورة الأولى | First photo | وێنەی یەکەم | وێنێ ئێکێ |
| 71 | #20 Pink Ribbon v2: photo label 2 | الصورة الثانية | Second photo | وێنەی دووەم | وێنێ دوویێ |
| 72 | #20 Pink Ribbon v2: photo label 3 | الصورة الثالثة | Third photo | وێنەی سێیەم | وێنێ سێیێ |
| 73 | #21 Floral Surprise v2: `hintLine` | عندي لك مفاجأة صغيرة | A little surprise, just for you | سوپرایزێکی بچووکم بۆت هەیە | سوپرایزەکا بچووک بۆ تە هەیە |
| 74 | #21 Floral Surprise v2: `hintTap` | اضغط لتفتحها | Tap to open | دەست بنێ بۆ کردنەوە | دەستێ بدە بۆ ڤەکرنێ |
| 75 | #21 Floral Surprise v2: `posterParty` | مع كل الحب | With love | بە هەموو خۆشەویستییەوە | ب هەمی ڤیانێ |
| 76 | #21 Floral Surprise v2: `posterDay` | يومك الحلو | Your special day | ڕۆژە شیرینەکەت | ڕۆژا تە یا شرین |
| 77 | #21 Floral Surprise v2: `posterDress` | كل عام وأنت بخير | A day just for you | ساڵانێکی پڕ لە خۆشی | هەمی ساڵ تو ب خێر بی |
| 78 | #21 Floral Surprise v2: `more` | وهذه ليست كل المفاجأة | A little more birthday magic | سوپرایزەکە هێشتا تەواو نەبووە | سوپرایز هێشتا ب دوماهی نەهاتیە |
| 79 | #21 Floral Surprise v2: `justForYou` | خصيصاً لك | Just for you | تایبەت بۆ تۆ | تایبەت بۆ تە |
| 80 | #21 Floral Surprise v2: `introCopy` | أتمنى أن تكون سنتك الجديدة مليئة بالضحك والمفاجآت الحلوة، / وأن تحمل لك كل ما تتمناه. | Here’s to laughter that lasts, sweet surprises, / and a year with a little more magic. | هیوادارم ساڵە نوێیەکەت پڕ بێت لە پێکەنین و سوپرایزی شیرین، / و هەموو ئەوەی ئاواتی پێ دەخوازیت بۆت بهێنێت. | هیڤیدارم ساڵا تە یا نوو تژی کەنی و سوپرایزێن شرین بیت، / و هەمی ئەوێ تو دخوازی بۆ تە بینیت. |
| 81 | #21 Floral Surprise v2: `introSign` | وكل عام وأنت بألف خير. | Happy, happy birthday. | هەزار ساڵی تر بە خۆشی. | هەزار ساڵێن دی ب خێر. |
| 82 | #21 Floral Surprise v2: `wishEyebrow` | لحظة الأمنية | A small birthday ritual | ساتی ئاوات | دەمێ هیڤیێ |
| 83 | #21 Floral Surprise v2: `wishTitle` | لحظة هادئة… | Close your eyes. | ساتێکی ئارام… | دەمەکێ ئارام… |
| 84 | #21 Floral Surprise v2: `wishTitleEm` | وأمنية من القلب. | Make a wish. | و ئاواتێک لە دڵەوە. | و هیڤیەک ژ دلی. |
| 85 | #21 Floral Surprise v2: `wishInstruction` | أمنية في القلب، / وشمعة تنتظر أن تُطفأ. | Keep a little wish to yourself, / then let the candlelight carry it. | ئاواتێک لە دڵدا، / و مۆمێک چاوەڕێی کوژاندنەوەیە. | هیڤیەک د دلی دا، / و مۆمەک ل هیڤیا ڤەمراندنێ. |
| 86 | #21 Floral Surprise v2: `makeWish` | إطفاء الشمعة | Make a birthday wish | کوژاندنەوەی مۆمەکە | ڤەمراندنا مۆمێ |
| 87 | #21 Floral Surprise v2: `wishMade` | وصلت الأمنية | A wish, just for you | ئاواتەکە گەیشت | هیڤی گەهشت |
| 88 | #21 Floral Surprise v2: `wishMadeTitle` | إن شاء الله | May lovely things | بە هیوای خوا | ب هیڤیا خودێ |
| 89 | #21 Floral Surprise v2: `wishMadeEm` | تتحقق كل أمنياتك. | find their way to you. | هەموو ئاواتەکانت دێنە دی. | هەمی هیڤیێن تە دێ ب جه هێن. |
| 90 | #21 Floral Surprise v2: `wishMadeCopy` | سنة فيها مغامرات جديدة وراحة بال، / وأسباب كثيرة للابتسامة. | New adventures. Peaceful moments. / And so many reasons to smile. | ساڵێک پڕ لە سەرکێشیی نوێ و ئاسوودەیی، / و هۆکاری زۆر بۆ زەردەخەنە. | ساڵەک تژی سەربۆرێن نوو و ئارامی، / و گەلەک ئەگەرێن کەنیێ. |
| 91 | #21 Floral Surprise v2: `relight` | أمنية ثانية؟ | One more little wish | ئاواتێکی تر؟ | هیڤیەکا دی؟ |
| 92 | #21 Floral Surprise v2: `candle` | شمعة عيد الميلاد تنتظر الأمنية | A birthday candle, waiting for a wish | مۆمێکی ڕۆژی لەدایکبوون، چاوەڕێی ئاواتێکە | مۆمەکا ڕۆژا ژدایکبوونێ، ل هیڤیا هیڤیەکێ |
| 93 | #21 Floral Surprise v2: `candleOut` | انطفأت الشمعة، والأمنية في الطريق. | The birthday candle is out. Your birthday wish is made. | مۆمەکە کوژایەوە. ئاواتەکەت خواسترا. | مۆم ڤەمری. هیڤیا تە هاتە خواستن. |
| 94 | #21 Floral Surprise v2: `dayToCelebrate` | يوم الاحتفال | A day to celebrate | ڕۆژی ئاهەنگ | ڕۆژا ئاهەنگێ |
| 95 | #21 Floral Surprise v2: `letterEyebrow` | لسنتك الجديدة | For the year ahead | بۆ ساڵە نوێیەکەت | بۆ ساڵا تە یا نوو |
| 96 | #21 Floral Surprise v2: `letterTitle` | فرح أكثر، / وضحك أكثر، | More joy. / More wonder. | خۆشیی زیاتر، / پێکەنینی زیاتر، | دلخۆشیا پتر، / کەنیا پتر، |
| 97 | #21 Floral Surprise v2: `letterTitleEm` | وكل ما يسعدك أكثر. | More of what you love. | و هەموو ئەوەی دڵخۆشت دەکات زیاتر. | و هەمی ئەوێ تە دلخۆش دکەت پتر. |
| 98 | #21 Floral Surprise v2: `message` | أتمنى لك عيد ميلاد جميلاً مثل باقة ورد، حلواً مثل أول قطعة من الكيكة، ومليئاً بلحظات لا تُنسى. | Wishing you a birthday as lovely as a bouquet, as sweet as the first slice of cake, and full of moments you’ll want to keep. | ڕۆژی لەدایکبوونێکی جوان وەک چەپکە گوڵێکت بۆ دەخوازم، شیرین وەک یەکەم پارچەی کێک، و پڕ لە ساتی لەبیرنەکراو. | ڕۆژا ژدایکبوونەکا جوان وەکی چەپکە گولەکێ بۆ تە دخوازم، شرین وەکی ئێکەمین پارچا کێکێ، و تژی دەمێن ژبیرنەبوویی. |
| 99 | #21 Floral Surprise v2: `letterSign` | مع كل الحب. | With the warmest birthday wishes. | بە هەموو خۆشەویستییەوە. | ب هەمی ڤیانێ. |
| 100 | #21 Floral Surprise v2: `footerCopy` | كل الحب لك اليوم وكل يوم، / وعقبال المية سنة. | A little love. A little sparkle. / A whole day to celebrate you. | هەموو خۆشەویستییەک بۆ تۆ ئەمڕۆ و هەموو ڕۆژێک، / و بە هیوای سەد ساڵی تر. | هەمی ڤیان بۆ تە ئەڤرۆ و هەمی ڕۆژان، / و ب هیڤیا سەد ساڵێن دی. |
| 101 | #21 Floral Surprise v2: `replay` | المفاجأة من جديد | Watch the surprise again | سوپرایزەکە لە سەرەتاوە | سوپرایز ژ دەستپێکێ |
| 102 | #21 Floral Surprise v2: `posterLabel` | مفاجأة عيد ميلاد لـ{name} | A birthday surprise for {name} | سوپرایزێکی ڕۆژی لەدایکبوون بۆ {name} | سوپرایزەکا ڕۆژا ژدایکبوونێ بۆ {name} |
| 103 | #21 Floral Surprise v2: `posterHappy` | عيد ميلاد سعيد | Happy Birthday | ڕۆژی لەدایکبوونت پیرۆز | ڕۆژا ژدایکبوونا تە پیرۆز |
| 104 | #21 Floral Surprise v2: `memoriesEyebrow` | لحظات حلوة | Little moments | ساتە شیرینەکان | دەمێن شرین |
| 105 | #21 Floral Surprise v2: `memoriesTitle` | من أحلى | Some of my favourite | هەندێک لە جوانترین | هندەک ژ جوانترین |
| 106 | #21 Floral Surprise v2: `memoriesEm` | ذكرياتنا معاً. | memories with you. | یادگارییەکانمان پێکەوە. | بیرهاتنێن مە پێکڤە. |
| 107 | #21 Floral Surprise v2: photo label 1 | الصورة الأولى | First photo | وێنەی یەکەم | وێنێ ئێکێ |
| 108 | #21 Floral Surprise v2: photo label 2 | الصورة الثانية | Second photo | وێنەی دووەم | وێنێ دوویێ |
| 109 | #21 Floral Surprise v2: photo label 3 | الصورة الثالثة | Third photo | وێنەی سێیەم | وێنێ سێیێ |
| 110 | #22 Blush Floral v2: `hintTap` | اضغط لفتح الدعوة | Tap to open | دەست بنێ بۆ کردنەوەی بانگهێشتنامەکە | دەستێ بدە بۆ ڤەکرنا داخوازنامێ |
| 111 | #22 Blush Floral v2: `posterEyebrow` | يسعدنا دعوتكم إلى | You are invited to | بە خۆشحاڵییەوە بانگهێشتتان دەکەین بۆ | ب دلخۆشی ڤە داخوازا هەوە دکەین بۆ |
| 112 | #22 Blush Floral v2: `posterName` |  | {name}’s |  |  |
| 113 | #22 Blush Floral v2: `posterParty` | {name} | Party | {name} | {name} |
| 114 | #22 Blush Floral v2: `more` | تفاصيل الحفلة | The celebration | وردەکارییەکانی ئاهەنگ | هوویرکاریێن ئاهەنگێ |
| 115 | #22 Blush Floral v2: `invited` | دعوة خاصة | You’re invited | بانگهێشتنێکی تایبەت | داخوازەکا تایبەت |
| 116 | #22 Blush Floral v2: `introTitle` | حفلة صغيرة، | A little celebration. | ئاهەنگێکی بچووک، | ئاهەنگەکا بچووک، |
| 117 | #22 Blush Floral v2: `introEm` | وفرحتها تكتمل بكم. | In full bloom. | و خۆشییەکەی بە ئێوە تەواو دەبێت. | و دلخۆشیا وێ ب هەوە تمام دبیت. |
| 118 | #22 Blush Floral v2: `introCopy` | سنة جديدة من العمر، / ونحب أن نحتفل بها معكم. | Another year to gather, make a wish, / and fill the evening with lovely memories. | ساڵێکی نوێی تەمەن، / و حەز دەکەین پێکەوە ئاهەنگی بۆ بگێڕین. | ساڵەکا نوو یا ژیانێ، / و دخوازین پێکڤە ئاهەنگێ بۆ بگێڕین. |
| 119 | #22 Blush Floral v2: `introSign` | بانتظاركم لنحتفل مع {name}. | Come celebrate with {name}. | چاوەڕێتانین بۆ ئاهەنگ لەگەڵ {name}. | ل هیڤیا هەوە نە بۆ ئاهەنگێ دگەل {name}. |
| 120 | #22 Blush Floral v2: `detailsTitle` | موعدنا | All the | کات | دەم |
| 121 | #22 Blush Floral v2: `detailsEm` | ومكان اللقاء. | lovely details. | و شوێنی دیدار. | و جهێ دیتنێ. |
| 122 | #22 Blush Floral v2: `gathering` | نجتمع مع الأحبة / ونحتفل معاً. | A birthday gathering / with our favourite people. | لەگەڵ خۆشەویستان کۆدەبینەوە / و پێکەوە ئاهەنگ دەگێڕین. | دگەل خۆشتڤیان کۆم دبین / و پێکڤە ئاهەنگێ دگێڕین. |
| 123 | #22 Blush Floral v2: `untilWe` | باقي على الحفلة | Until we celebrate | ماوە بۆ ئاهەنگ | مایە بۆ ئاهەنگێ |
| 124 | #22 Blush Floral v2: `soonTitle` | العدّ التنازلي | Something lovely | ژماردنی پێچەوانە | ژمارتنا بەرەڤاژی |
| 125 | #22 Blush Floral v2: `soonEm` | بدأ! | is on the way. | دەستی پێکرد! | دەست پێکر! |
| 126 | #22 Blush Floral v2: `wishCaption` | لكل شمعة أمنية | A wish for every candle | بۆ هەر مۆمێک ئاواتێک | بۆ هەر مۆمەکێ هیڤیەک |
| 127 | #22 Blush Floral v2: `wishEyebrow` | ورد وشموع وأحلى صحبة | Flowers, candles & good company | گوڵ و مۆم و خۆشترین هاوڕێیەتی | گول و مۆم و خۆشترین هەڤالینی |
| 128 | #22 Blush Floral v2: `wishTitle` | أحضروا معكم الفرحة، | Bring a little joy. | خۆشی لەگەڵ خۆتان بهێنن، | دلخۆشیێ دگەل خۆ بینن، |
| 129 | #22 Blush Floral v2: `wishEm` | والكيكة علينا! | We’ll save you a slice. | کێکەکە لەسەر ئێمە! | کێک ل سەر مە! |
| 130 | #22 Blush Floral v2: `wishCopy` | نطفئ الشموع، ونتمنّى الأماني، ونحتفل بسنة جديدة مع أحلى الناس. | A moment for birthday wishes, a toast to the year ahead, and the people who make every celebration sweeter. | مۆمەکان دەکوژێنینەوە، ئاوات دەخوازین، و ساڵێکی نوێ لەگەڵ خۆشترین کەسەکان ئاهەنگ دەگێڕین. | مۆمان ڤەدمرینین، هیڤیان دخوازین، و ساڵەکا نوو دگەل خۆشترین کەسان ئاهەنگێ دگێڕین. |
| 131 | #22 Blush Floral v2: `wishLink` | أكّدوا حضوركم | Be part of the celebration | هاتنتان پشتڕاست بکەنەوە | هاتنا خۆ پشتڕاست بکەن |
| 132 | #22 Blush Floral v2: `photo1` | ذكرى حلوة | A little moment, a lovely memory. | یادگارییەکی شیرین | بیرهاتنەکا شرین |
| 133 | #22 Blush Floral v2: `photo2` | والأجمل لم يأتِ بعد. | And so many more to come. | و جوانترینیان هێشتا نەهاتووە. | و یا جوانتر هێشتا نەهاتیە. |
| 134 | #22 Blush Floral v2: `noteEyebrow` | كلمة من القلب | A little note | چەند وشەیەک لە دڵەوە | چەند پەیڤەک ژ دلی |
| 135 | #22 Blush Floral v2: `noteDefault` | وجودكم أجمل هدية. تعالوا نحتفل معاً بالكيكة والشموع والضحكات، فالحفلة لا تحلو من دونكم. | I would love to celebrate with you. Come for cake, candles and good company — it wouldn’t be the same without you. | بوونتان جوانترین دیارییە. وەرن با پێکەوە بە کێک و مۆم و پێکەنین ئاهەنگ بگێڕین، ئاهەنگەکە بەبێ ئێوە خۆش نابێت. | هەبوونا هەوە جوانترین دیاریە. وەرن بلا پێکڤە ب کێک و مۆم و کەنی ئاهەنگێ بگێڕین، ئاهەنگ بێ هەوە خۆش نابیت. |
| 136 | #22 Blush Floral v2: `replyEyebrow` | تأكيد الحضور | A little note back | پشتڕاستکردنەوەی هاتن | پشتڕاستکرنا هاتنێ |
| 137 | #22 Blush Floral v2: `replyTitle` | هل ستكونون | Will you | ئایا | ئەرێ هوین دێ |
| 138 | #22 Blush Floral v2: `replyEm` | معنا؟ | join us? | لەگەڵمان دەبن؟ | دگەل مە بن؟ |
| 139 | #22 Blush Floral v2: `replyCopy` | حضوركم يكمّل فرحتنا. | Your presence would make it all the lovelier. | ئامادەبوونتان خۆشییەکەمان تەواو دەکات. | ئامادەبوونا هەوە دلخۆشیا مە تمام دکەت. |
| 140 | #22 Blush Floral v2: `guestbook` | تهاني الأحبة | Birthday wishes | پیرۆزبایی خۆشەویستان | پیرۆزباهیێن خۆشتڤیان |
| 141 | #22 Blush Floral v2: `footerEyebrow` | مع كل الحب | With love | بە هەموو خۆشەویستییەوە | ب هەمی ڤیانێ |
| 142 | #22 Blush Floral v2: `footerCopy` | بانتظاركم. | Here’s to another beautiful year. | چاوەڕێتانین. | ل هیڤیا هەوە نە. |
| 143 | #22 Blush Floral v2: `replay` | الدعوة من جديد | Watch it unfold again | بانگهێشتنامەکە لە سەرەتاوە | داخوازنامە ژ دەستپێکێ |
| 144 | #22 Blush Floral v2: `posterTitle` | حفلة عيد ميلاد | Birthday | ئاهەنگی ڕۆژی لەدایکبوونی | ئاهەنگا ڕۆژا ژدایکبوونا |
| 145 | #23 design name | حفلة كونفيتي الكرز | Cherry Confetti Party | ئاهەنگی کۆنفێتی گێلاس | ئاهەنگا کۆنفێتی گێلاسێ |
| 146 | #23 Cherry Confetti Party: `hintLine` | دعوة خاصة لكم | You are invited | بانگهێشتنێکی تایبەت بۆ ئێوە | داخوازەکا تایبەت بۆ هەوە |
| 147 | #23 Cherry Confetti Party: `posterBig` | حفلة عيد ميلاد | {name}’s | ئاهەنگی ڕۆژی لەدایکبوونی | ئاهەنگا ڕۆژا ژدایکبوونا |
| 148 | #23 Cherry Confetti Party: `posterSmall` | {name} | Birthday Party | {name} | {name} |
| 149 | #24 design name | حفلة الشريطة الوردية | Pink Ribbon Party | ئاهەنگی پاپیۆنی پەمەیی | ئاهەنگا پاپیۆنا پەمبەیی |
| 150 | #24 Pink Ribbon Party: `posterName` | {name} | {name}’s party | {name} | {name} |
| 151 | #24 Pink Ribbon Party: `hintLine` | دعوة خاصة لكم | You are invited | بانگهێشتنێکی تایبەت بۆ ئێوە | داخوازەکا تایبەت بۆ هەوە |
| 152 | #24 Pink Ribbon Party: `posterHappy` | حفلة عيد ميلاد | Birthday | ئاهەنگی ڕۆژی لەدایکبوونی | ئاهەنگا ڕۆژا ژدایکبوونا |
| 153 | Platform: `admin.catalog.features.collage_polaroids` | كولاج صور: بوستر (٣ صور) | Photo collage: poster (3 photos) | کۆلاژی وێنە: پۆستەر (٣ وێنە) | کۆلاژا وێنەیان: پۆستەر (٣ وێنە) |
| 154 | Platform: `admin.catalog.features.collage_story` | كولاج صور: ستوري (٤ صور) | Photo collage: story (4 photos) | کۆلاژی وێنە: ستۆری (٤ وێنە) | کۆلاژا وێنەیان: ستۆری (٤ وێنە) |
| 155 | Platform: `admin.catalog.features.collage_wall` | كولاج صور: جدار صور (٩ صور) | Photo collage: photo wall (9 photos) | کۆلاژی وێنە: دیواری وێنە (٩ وێنە) | کۆلاژا وێنەیان: دیوارێ وێنەیان (٩ وێنە) |
| 156 | Platform: `store.features.collage_polaroids` | بوستر كولاج (A3) بثلاث من صوركم | A photo collage poster (A3) with three of your photos | پۆستەرێکی کۆلاژ (A3) بە سێ لە وێنەکانتان | پۆستەرەکێ کۆلاژێ (A3) ب سێ ژ وێنێن هەوە |
| 157 | Platform: `store.features.collage_story` | كولاج لستوري إنستغرام بأربع من صوركم | A photo collage for your Instagram story, with four of your photos | کۆلاژێک بۆ ستۆری ئینستاگرام بە چوار لە وێنەکانتان | کۆلاژەک بۆ ستۆریا ئینستاگرامێ ب چار ژ وێنێن هەوە |
| 158 | Platform: `store.features.collage_wall` | جدار صور بتسع من صوركم، جاهز للطباعة (4 × 6) | A photo wall collage with nine of your photos, ready to print (4 × 6) | دیوارێکی وێنە بە نۆ لە وێنەکانتان، ئامادە بۆ چاپ (4 × 6) | دیوارەکێ وێنەیان ب نەهـ ژ وێنێن هەوە، ئامادە بۆ چاپێ (4 × 6) |
| 159 | Platform: `store.extras.collagePolaroids` | بوستر الكولاج | Collage poster | پۆستەری کۆلاژ | پۆستەرێ کۆلاژێ |
| 160 | Platform: `store.extras.collageStory` | كولاج الستوري | Story collage | کۆلاژی ستۆری | کۆلاژا ستۆریێ |
| 161 | Platform: `store.extras.collageWall` | جدار الصور | Photo wall | دیواری وێنە | دیوارێ وێنەیان |
| 162 | Platform: `store.extras.downloadJpg` | صورة (JPG) | Picture (JPG) | وێنە (JPG) | وێنە (JPG) |
| 163 | Platform: `invitation.print.collage.headingTop` | عيد ميلاد | Happy | ڕۆژی لەدایکبوونت | ڕۆژا ژدایکبوونا تە |
| 164 | Platform: `invitation.print.collage.headingBottom` | سعيد | Birthday | پیرۆز | پیرۆز |
| 165 | Platform: `invitation.print.collage.kicker` | عيد ميلاد | HAPPY | ڕۆژی لەدایکبوونت | ڕۆژا ژدایکبوونا تە |
| 166 | Platform: `invitation.print.collage.title` | سعيد! | Birthday! | پیرۆز! | پیرۆز! |
| 167 | Platform: `invitation.print.collage.caption` | عيد ميلاد سعيد | HAPPY BIRTHDAY | ڕۆژی لەدایکبوونت پیرۆز | ڕۆژا ژدایکبوونا تە پیرۆز |
| 168 | Platform: `invitation.print.collage.wish` | أتمنى لك فرحاً لا ينتهي وسعادة حقيقية في كل يوم! | Wishing you endless joy and true happiness every single day! | خۆشییەکی بێ کۆتایی و بەختەوەرییەکی ڕاستەقینەت بۆ دەخوازم لە هەموو ڕۆژێکدا! | دلخۆشیەکا بێ دوماهی و بەختەوەریەکا ڕاستەقینە بۆ تە دخوازم د هەمی ڕۆژان دا! |
| 169 | Platform: `store.photos.collageHelp` | وتملأ صورُكم أيضاً كولاجات الصور بالترتيب نفسه. | They also fill your photo collages, in the same order. | هەمان وێنەکان بە هەمان ڕیز کۆلاژەکانی وێنەش پڕ دەکەنەوە. | هەمان وێنە ب هەمان ڕیزێ کۆلاژێن وێنەیان ژی پڕ دکەن. |

## Batch 44 — the birthday invitations' printed poster (#22, #23, #24) — ✅ AUTO-APPROVED (2026-10-28, owner checks in Admin → Translations)

The printed poster's name on the order form (manifest `print.shapes[].label`, feature `card_arch`).

| # | Where | Arabic | English | Sorani (ckb) | Badini (bdn) |
|---|---|---|---|---|---|
| 1 | #22 Blush Floral v2, #23 Cherry Confetti Party, #24 Pink Ribbon Party: shape `arch-poster` | بوستر | Poster | پۆستەر | پۆستەر |

## Batch 45 — the customer's page after paying — ✅ AUTO-APPROVED (2026-10-29, owner checks in Admin → Translations)

The redesigned receipt page (`/r/…`): the header, the row of section chips and the shared-link picture.

| # | Where | Arabic | English | Sorani (ckb) | Badini (bdn) |
|---|---|---|---|---|---|
| 1 | Platform: `receipt.navLabel` | أقسام الصفحة | Page sections | بەشەکانی پەڕە | پشکێن پەرێ |
| 2 | Platform: `receipt.navInvitation` | الدعوة | Invitation | بانگهێشت | داخوازنامە |
| 3 | Platform: `receipt.navEdit` | التعديل | Edit | دەستکاری | دەستکاری |
| 4 | Platform: `receipt.navReplies` | الردود | Replies | وەڵامەکان | بەرسڤ |
| 5 | Platform: `receipt.navGuestbook` | الرسائل | Messages | نامەکان | نامە |
| 6 | Platform: `receipt.navFiles` | ملفات الطباعة | Print files | فایلەکانی چاپ | فایلێن چاپێ |
| 7 | Platform: `receipt.navExtras` | التصاميم | Designs | دیزاینەکان | دیزاین |
| 8 | Platform: `receipt.navDetails` | تفاصيل الطلب | Order details | وردەکاریی داواکاری | هویرگۆشیێن داخوازێ |
| 9 | Platform: `receipt.detailsTitle` | تفاصيل الطلب | Order details | وردەکاریی داواکاری | هویرگۆشیێن داخوازێ |
| 10 | Platform: `receipt.heroPaid` | كل ما يخص مناسبتك هنا: رابط الدعوة لضيوفك، والبطاقات للطباعة، والتعديل والردود. | Everything for your celebration is here: the invitation link for your guests, printable cards, edits and replies. | هەموو شتێکی بۆنەکەت لێرەیە: بەستەری بانگهێشت بۆ میوانەکانت، کارتەکانی چاپ، دەستکاری و وەڵامەکان. | هەمی تشتێن بۆنا تە ل ڤێرێنە: لینکا داخوازنامێ بۆ میڤانێن تە، کارتێن چاپێ، دەستکاری و بەرسڤ. |
| 11 | Platform: `receipt.heroPending` | طلبك محفوظ. بعد الدفع يصلك كل شيء هنا مباشرة. | Your order is saved. Once paid, everything arrives here straight away. | داواکارییەکەت پاشەکەوت کرا. دوای پارەدان هەموو شتێک یەکسەر لێرە دەگات. | داخوازا تە هاتە پاشەکەفتکرن. پشتی پارەدانێ هەمی تشت دێ یەکسەر ل ڤێرێ گەهیت. |
| 12 | Platform: `receipt.invitationPictureAlt` | صورة الدعوة كما تظهر عند المشاركة | The invitation picture, as it shows when shared | وێنەی بانگهێشت وەک لە کاتی ناردندا دەردەکەوێت | وێنێ داخوازنامێ وەکی د دەمێ هنارتنێ دا دیار دبیت |

## Batch 46 — Couples: BAHJAFLIX (#25), its template editor, video and posters — ✅ AUTO-APPROVED (2026-10-31, owner checks in Admin → Translations)

The new Couples section, the BAHJAFLIX design (its own lines, buttons and example photos), the template editor where the customer fills the design in place, the video and the couple posters.

| # | Where | Arabic | English | Sorani (ckb) | Badini (bdn) |
|---|---|---|---|---|---|
| 1 | Platform: `store.features.video` | فيديو واحد خاص بكم في أعلى الصفحة (حتى دقيقة) | Your own video at the top of the page (up to a minute) | ڤیدیۆیەکی تایبەتی خۆتان لە سەرەوەی پەڕەکە (تا خولەکێک) | ڤیدیۆیەکا تایبەت ب هەوە ل سەرێ پەرێ (هەتا خولەکەکێ) |
| 2 | Platform: `store.features.couple_poster` | ملصقان للطباعة (عرضي وطولي) بتصميمكم | Two posters to print (landscape and portrait) in your design | دوو پۆستەر بۆ چاپ (پانی و درێژی) بە دیزاینەکەتان | دوو پۆستەر بۆ چاپێ (پانی و درێژی) ب دیزاینا هەوە |
| 3 | Platform: `store.template.title` | املؤوا تصميمكم | Fill in your design | دیزاینەکەتان پڕ بکەنەوە | دیزاینا خۆ تژی بکەن |
| 4 | Platform: `store.template.subtitle` | هذا تصميمكم نفسه. اضغطوا على أي نص لكتابته، وعلى أي إطار لإضافة صورة أو الفيديو. كل شيء يُحفظ تلقائياً، ويمكنكم تعديله لاحقاً. | This is your design itself. Tap any text to write it, any frame to add a photo or the video. Everything is saved as you go, and you can change it later. | ئەمە خودی دیزاینەکەتانە. لەسەر هەر دەقێک دابگرن بۆ نووسینی، و لەسەر هەر چوارچێوەیەک بۆ زیادکردنی وێنە یان ڤیدیۆکە. هەموو شتێک خۆکارانە پاشەکەوت دەکرێت، و دواتریش دەتوانن بیگۆڕن. | ئەڤە دیزاینا هەوە ب خۆیە. ل سەر هەر نڤیسینەکێ بکەن دا بنڤیسن، و ل سەر هەر چوارچووڤەیەکێ دا وێنەیەکێ یان ڤیدیۆیێ زێدە بکەن. هەمی تشت ب خۆکاری دهێتە پاراستن، و پاشی ژی دشێن بگوهۆڕن. |
| 5 | Platform: `store.template.orderSubtitle` | اختاروا لغة الصفحة ثم تابعوا: في الخطوة التالية تملؤون التصميم نفسه بنصوصكم وصوركم والفيديو. | Choose the page’s language, then continue: next you fill the design itself with your texts, photos and video. | زمانی پەڕەکە هەڵبژێرن و بەردەوام بن: لە هەنگاوی داهاتوودا خودی دیزاینەکە بە دەق و وێنە و ڤیدیۆکەتان پڕ دەکەنەوە. | زمانێ پەرێ هەلبژێرن و بەردەوام بن: د گاڤا بێتدا هوین دیزاینێ ب خۆ ب نڤیسین و وێنە و ڤیدیۆیا خۆ تژی دکەن. |
| 6 | Platform: `store.template.hint` | اضغطوا على أي نص لكتابته، وعلى أي إطار لإضافة صورة أو الفيديو | Tap any text to write it, any frame to add a photo or the video | لەسەر هەر دەقێک دابگرن بۆ نووسینی، و لەسەر هەر چوارچێوەیەک بۆ زیادکردنی وێنە یان ڤیدیۆکە | ل سەر هەر نڤیسینەکێ بکەن دا بنڤیسن، و ل سەر هەر چوارچووڤەیەکێ دا وێنەیەکێ یان ڤیدیۆیێ زێدە بکەن |
| 7 | Platform: `store.template.texts` | النصوص | Texts | دەقەکان | نڤیسین |
| 8 | Platform: `store.template.photos` | الصور | Photos | وێنەکان | وێنە |
| 9 | Platform: `store.template.video` | الفيديو | Video | ڤیدیۆ | ڤیدیۆ |
| 10 | Platform: `store.template.preview` | معاينة | Preview | پێشبینین | پێشدیتن |
| 11 | Platform: `store.template.save` | حفظ ومتابعة | Save and continue | پاشەکەوت و بەردەوامبوون | پاراستن و بەردەوامبوون |
| 12 | Platform: `store.template.finish` | تم | Done | تەواو | تەمام |
| 13 | Platform: `store.template.saved` | محفوظ | Saved | پاشەکەوت کرا | هاتە پاراستن |
| 14 | Platform: `store.template.saving` | جارٍ الحفظ… | Saving… | پاشەکەوت دەکرێت… | دهێتە پاراستن… |
| 15 | Platform: `store.template.cancel` | إلغاء | Cancel | هەڵوەشاندنەوە | بەتالکرن |
| 16 | Platform: `store.template.done` | تم | Done | تەواو | تەمام |
| 17 | Platform: `store.template.next` | التالي | Next | دواتر | یا پشتی |
| 18 | Platform: `store.template.back` | رجوع | Back | گەڕانەوە | زڤرین |
| 19 | Platform: `store.template.textPlaceholder` | اكتبوا هنا | Write it here | لێرە بنووسن | ل ڤێرێ بنڤیسن |
| 20 | Platform: `store.template.addPhoto` | أضيفوا صورة | Add a photo | وێنەیەک زیاد بکەن | وێنەیەکێ زێدە بکەن |
| 21 | Platform: `store.template.choosePhoto` | اختيار صورة | Choose a photo | هەڵبژاردنی وێنە | هەلبژارتنا وێنەی |
| 22 | Platform: `store.template.frameTitle` | اضبطوا الصورة داخل الإطار | Place the photo in its frame | وێنەکە لەناو چوارچێوەکەدا ڕێک بخەن | وێنەی د ناڤ چوارچووڤەیێدا رێک بێخن |
| 23 | Platform: `store.template.frameHint` | ما يظهر داخل الإطار هو ما سيظهر في صفحتكم بالضبط. اسحبوا الصورة لتحريكها، وكبّروها إن أردتم. | What is inside the frame is exactly what your page shows. Drag the photo to move it, and zoom in if you like. | ئەوەی لەناو چوارچێوەکەدایە ڕێک ئەوەیە کە لە پەڕەکەتاندا دەردەکەوێت. وێنەکە ڕابکێشن بۆ جوڵاندنی، و ئەگەر ویستتان گەورەی بکەن. | یا د ناڤ چوارچووڤەیێدا ب دروستی ئەوە یا د پەرا هەوەدا دیار دبیت. وێنەی بکێشن دا بلڤینن، و ئەگەر هەوە ڤیا مەزن بکەن. |
| 24 | Platform: `store.template.frameCaption` | هكذا ستظهر | How it will look | بەم شێوەیە دەردەکەوێت | ب ڤی رەنگی دیار دبیت |
| 25 | Platform: `store.template.uploading` | جارٍ الرفع… | Uploading… | بار دەکرێت… | دهێتە بارکرن… |
| 26 | Platform: `store.template.wordsTitle` | عنوان الصورة ووصفها | The photo’s title and words | ناونیشان و وەسفی وێنەکە | ناڤونیشان و وەسفا وێنەی |
| 27 | Platform: `store.template.photoTitle` | عنوان الصورة | Title | ناونیشانی وێنە | ناڤونیشانێ وێنەی |
| 28 | Platform: `store.template.photoCaption` | وصف قصير (يظهر عند فتح الصورة) | A few words (shown when the photo is opened) | وەسفێکی کورت (کاتی کردنەوەی وێنەکە دەردەکەوێت) | وەسفەکا کورت (دەمێ ڤەکرنا وێنەی دیار دبیت) |
| 29 | Platform: `store.template.reframe` | ضبط الإطار | Adjust the frame | ڕێکخستنی چوارچێوە | رێکخستنا چوارچووڤەیێ |
| 30 | Platform: `store.template.videoTitle` | الفيديو | Video | ڤیدیۆ | ڤیدیۆ |
| 31 | Platform: `store.template.videoHint` | فيديو واحد يعمل في أعلى صفحتكم. حتى دقيقة واحدة (الأطول يُقصّ)، وحجم الملف حتى 100 ميغابايت. | One video plays at the top of your page. Up to a minute (longer ones are cut), files up to 100 MB. | یەک ڤیدیۆ لە سەرەوەی پەڕەکەتان کار دەکات. تا خولەکێک (درێژتر دەبڕدرێت)، و قەبارەی فایل تا ١٠٠ مێگابایت. | ئێک ڤیدیۆ ل سەرێ پەرا هەوە کار دکەت. هەتا خولەکەکێ (یا درێژتر دهێتە بڕین)، و قەبارێ فایلی هەتا ١٠٠ مێگابایت. |
| 32 | Platform: `store.template.chooseVideo` | اختيار فيديو | Choose a video | هەڵبژاردنی ڤیدیۆ | هەلبژارتنا ڤیدیۆیێ |
| 33 | Platform: `store.template.replaceVideo` | تغيير الفيديو | Change the video | گۆڕینی ڤیدیۆ | گوهۆڕینا ڤیدیۆیێ |
| 34 | Platform: `store.template.removeVideo` | حذف الفيديو | Remove the video | سڕینەوەی ڤیدیۆ | ژێبرنا ڤیدیۆیێ |
| 35 | Platform: `store.template.converting` | نجهّز الفيديو… قد يستغرق ذلك دقيقة. | Preparing your video… this can take a minute. | ڤیدیۆکە ئامادە دەکەین… لەوانەیە خولەکێک بخایەنێت. | ئەم ڤیدیۆیێ بەرهەڤ دکەین… رەنگە خولەکەکێ ببەت. |
| 36 | Platform: `store.template.missing` | ما زال ينقص: {list} | Still missing: {list} | هێشتا ماوە: {list} | هێشتا مایە: {list} |
| 37 | Platform: `store.template.errors.tooLarge` | هذا الملف كبير جداً (100 ميغابايت كحد أقصى). اختاروا فيديو أقصر. | This file is too large (100 MB at most). Choose a shorter video. | ئەم فایلە زۆر گەورەیە (زۆرترین ١٠٠ مێگابایت). ڤیدیۆیەکی کورتتر هەڵبژێرن. | ئەڤ فایلە گەلەک مەزنە (پترین ١٠٠ مێگابایت). ڤیدیۆیەکا کورتتر هەلبژێرن. |
| 38 | Platform: `store.template.errors.unsupportedVideo` | لم نتمكن من قراءة هذا الفيديو. اختاروا فيديو آخر. | We couldn’t read this video. Choose another one. | نەمانتوانی ئەم ڤیدیۆیە بخوێنینەوە. ڤیدیۆیەکی تر هەڵبژێرن. | مە نەشیا ئەڤێ ڤیدیۆیێ بخوینین. ڤیدیۆیەکا دی هەلبژێرن. |
| 39 | Platform: `store.template.errors.tooLong` | النص أطول من المسموح. | This text is too long. | دەقەکە لە ڕادەی ڕێگەپێدراو درێژترە. | نڤیسین ژ رادەیا رێپێدای درێژترە. |
| 40 | Platform: `store.template.errors.invalidText` | لا يمكن حفظ هذا النص. جرّبوا نصاً آخر. | This text can’t be saved. Try another. | ناتوانرێت ئەم دەقە پاشەکەوت بکرێت. دەقێکی تر تاقی بکەنەوە. | ئەڤ نڤیسینە نەشێت بهێتە پاراستن. نڤیسینەکا دی تاقی بکەن. |
| 41 | Platform: `store.extras.posterLandscape` | الملصق العرضي | Landscape poster | پۆستەری پانی | پۆستەرێ پانی |
| 42 | Platform: `store.extras.posterPortrait` | الملصق الطولي | Portrait poster | پۆستەری درێژی | پۆستەرێ درێژی |
| 43 | Section `couples` (seed): name | للأزواج | Couples | بۆ هاوسەران | بۆ هەڤژینان |
| 44 | Section `couples`: field `person_1_name` | اسمه | His name | ناوی ئەو (پیاو) | ناڤێ وی |
| 45 | Section `couples`: field `person_2_name` | اسمها | Her name | ناوی ئەو (ئافرەت) | ناڤێ وێ |
| 46 | Section `couples`: field `invitation_message` | قصتكما | Your story | چیرۆکەکەتان | چیرۆکا هەوە |
| 47 | #25 BAHJAFLIX: title | بهجة فليكس | BAHJAFLIX | بەهجەفلیکس | بەهجەفلیکس |
| 48 | #25 BAHJAFLIX: wording `title` (label) | عنوان فيلمكما | Your film's title | ناونیشانی فیلمەکەتان | ناڤونیشانێ فیلما هەوە |
| 49 | #25 BAHJAFLIX: wording `title` (text) | معاً إلى الأبد | Together Forever | پێکەوە بۆ هەمیشە | پێکڤە بۆ هەروهەر |
| 50 | #25 BAHJAFLIX: wording `label` (label) | الكلمة بجانب شعار B | The word next to the B | وشەی تەنیشت B | پەیڤا تەنشت B |
| 51 | #25 BAHJAFLIX: wording `label` (text) | ذكريات | MEMORIES | یادەوەری | بیرهاتن |
| 52 | #25 BAHJAFLIX: wording `badge` (label) | السطر بجانب TOP #01 | The line next to TOP #01 | دێڕی تەنیشت TOP #01 | رێزا تەنشت TOP #01 |
| 53 | #25 BAHJAFLIX: wording `badge` (text) | رقم 1 في قلبي | No. 1 in my heart | یەکەم لە دڵمدا | ئێکەم د دلێ مندا |
| 54 | #25 BAHJAFLIX: wording `since` (label) | سطر التاريخ | The date line | دێڕی بەروار | رێزا رێکەفتێ |
| 55 | #25 BAHJAFLIX: wording `since` (text) | منذ 14 شباط 2019 | Since 14 February 2019 | لە ١٤ی شوباتی ٢٠١٩ەوە | ژ ١٤ی شوباتا ٢٠١٩ێ |
| 56 | #25 BAHJAFLIX: wording `tag` (label) | المناسبة | The occasion | بۆنە | بۆنە |
| 57 | #25 BAHJAFLIX: wording `tag` (text) | ذكرى زواجنا | Our anniversary | یادی هاوسەرگیریمان | بیرهاتنا زەواجا مە |
| 58 | #25 BAHJAFLIX: wording `row1` (label) | عنوان الصف الأول | First row title | ناونیشانی ڕیزی یەکەم | ناڤونیشانێ رێزا ئێکێ |
| 59 | #25 BAHJAFLIX: wording `row1` (text) | أجمل ذكرياتنا | Our best memories | جوانترین یادەوەرییەکانمان | جوانترین بیرهاتنێن مە |
| 60 | #25 BAHJAFLIX: wording `row2` (label) | عنوان الصف الثاني | Second row title | ناونیشانی ڕیزی دووەم | ناڤونیشانێ رێزا دووێ |
| 61 | #25 BAHJAFLIX: wording `row2` (text) | لحظاتنا | Our moments | ساتەکانمان | دەمێن مە |
| 62 | #25 BAHJAFLIX: wording `row3` (label) | عنوان الصف الثالث | Third row title | ناونیشانی ڕیزی سێیەم | ناڤونیشانێ رێزا سێیێ |
| 63 | #25 BAHJAFLIX: wording `row3` (text) | نحن | Us | ئێمە | ئەم |
| 64 | #25 BAHJAFLIX: `home` | الرئيسية | Home | سەرەکی | سەرەکی |
| 65 | #25 BAHJAFLIX: `video` | الفيديو | Video | ڤیدیۆ | ڤیدیۆ |
| 66 | #25 BAHJAFLIX: `play` | تشغيل | Play | لێدان | لێدان |
| 67 | #25 BAHJAFLIX: `moreInfo` | مزيد من المعلومات | More info | زانیاری زیاتر | پتر پێزانین |
| 68 | #25 BAHJAFLIX: `info` | معلومات | Info | زانیاری | پێزانین |
| 69 | #25 BAHJAFLIX: `starring` | البطولة: | Starring: | ئەکتەران: | ئەکتەر: |
| 70 | #25 BAHJAFLIX: `match` | تطابق 100% | 100% match | ١٠٠٪ گونجاو | ١٠٠٪ گونجای |
| 71 | #25 BAHJAFLIX: `close` | إغلاق | Close | داخستن | گرتن |
| 72 | #25 BAHJAFLIX: `previous` | السابق | Previous | پێشوو | یا بەری |
| 73 | #25 BAHJAFLIX: `next` | التالي | Next | دواتر | یا پشتی |
| 74 | #25 BAHJAFLIX: `mute` | كتم الصوت | Mute | بێدەنگکردن | بێدەنگکرن |
| 75 | #25 BAHJAFLIX: `unmute` | تشغيل الصوت | Unmute | دەنگ | دەنگ |
| 76 | #25 BAHJAFLIX: `addVideo` | أضيفوا فيديو واحداً (حتى دقيقة) | Add one video (up to a minute) | یەک ڤیدیۆ زیاد بکەن (تا خولەکێک) | ئێک ڤیدیۆ زێدە بکەن (هەتا خولەکەکێ) |
| 77 | #25 BAHJAFLIX: `addPhoto` | أضيفوا صورة | Add a photo | وێنەیەک زیاد بکەن | وێنەیەکێ زێدە بکەن |
| 78 | #25 BAHJAFLIX: `namesHint` | الاسم | Name | ناو | ناڤ |
| 79 | #25 BAHJAFLIX: `storyHint` | اكتبوا هنا قصتكما في سطرين أو ثلاثة… | Write your story here in two or three lines… | چیرۆکەکەتان لێرە لە دوو سێ دێڕدا بنووسن… | چیرۆکا خۆ ل ڤێرێ د دوو سێ رێزاندا بنڤیسن… |
| 80 | #25 BAHJAFLIX: `storyLabel` | القصة (تظهر عند الضغط على «معلومات») | The story (shown under “Info”) | چیرۆکەکە (لە «زانیاری»دا دەردەکەوێت) | چیرۆک (د «پێزانین»ێدا دیار دبیت) |
| 81 | #25 BAHJAFLIX: `sampleStory` | الحضور الثابت الذي يمشي بجانبي في كل فصل من فصول الحياة. قلبك الذي أستند إليه، وصوتك الذي أثق به، وحبك الذي يجعل العالم أكثر دفئاً وإشراقاً. | The steady presence beside me through every season of life. Your heart I lean on, your voice I trust, and your love that makes the world warmer and brighter. | ئەو هاوڕێیە جێگیرەی لە هەموو وەرزەکانی ژیاندا لە تەنیشتمە. دڵت کە پشتی پێ دەبەستم، دەنگت کە متمانەی پێ دەکەم، و خۆشەویستییەکەت کە جیهان گەرمتر و ڕووناکتر دەکات. | ئەو هەڤالێ جێگیر یێ د هەمی وەرزێن ژیانێدا ل تەنشت من. دلێ تە یێ ئەز پشتا خۆ پێ گرێ ددەم، دەنگێ تە یێ ئەز باوەریێ پێ دکەم، و ڤیانا تە یا جیهانێ گەرمتر و رۆناهیتر دکەت. |
| 82 | #25 BAHJAFLIX: sample photo 1 title | كورنيش الغروب | Sunset on the corniche | ئاوابوونی کۆرنیش | ئاڤابوونا کۆرنیشێ |
| 83 | #25 BAHJAFLIX: sample photo 1 words | مساء على الكورنيش، والشمس تغيب خلفنا. | An evening by the sea, the sun going down behind us. | ئێوارەیەک لە کەناری دەریا، خۆر لە پشتمانەوە ئاوا دەبێت. | ئێڤارەک ل بەر دەریایێ، رۆژ ل پشت مە ئاڤا دبیت. |
| 84 | #25 BAHJAFLIX: sample photo 2 title | ليلة على الميناء | A night at the harbour | شەوێک لە بەندەر | شەڤەک ل بەندەرێ |
| 85 | #25 BAHJAFLIX: sample photo 2 words | أول صورة لنا معاً، ولم نكن نعرف بعدُ أنها البداية. | Our first photo together; we didn’t know yet it was the start. | یەکەم وێنەمان پێکەوە، هێشتا نەماندەزانی سەرەتایە. | ئێکەم وێنێ مە پێکڤە، هێشتا مە نەدزانی کو دەستپێکە. |
| 86 | #25 BAHJAFLIX: sample photo 3 title | بالأبيض والأسود | Black and white | ڕەش و سپی | رەش و سپی |
| 87 | #25 BAHJAFLIX: sample photo 3 words | لقطة كلاسيكية لا تُنسى. | A classic we will never forget. | وێنەیەکی کلاسیکی کە لەبیر ناچێت. | وێنەیەکێ کلاسیک کو ژبیر ناچیت. |
| 88 | #25 BAHJAFLIX: sample photo 4 title | دفء المساء | Warm evening | گەرمی ئێوارە | گەرمیا ئێڤارێ |
| 89 | #25 BAHJAFLIX: sample photo 4 words | ضحكة ودفء وبحر. | Laughter, warmth and the sea. | پێکەنین و گەرمی و دەریا. | کەنی و گەرمی و دەریا. |
| 90 | #25 BAHJAFLIX: sample photo 5 title | الخاتم | The ring | ئەڵقەکە | ئەلقە |
| 91 | #25 BAHJAFLIX: sample photo 5 words | اللحظة التي قالت فيها: نعم. | The moment she said yes. | ئەو ساتەی گوتی: بەڵێ. | ئەو دەمێ وێ گۆتی: بەلێ. |
| 92 | #25 BAHJAFLIX: sample photo 6 title | المراكب | The boats | بەلەمەکان | بەلەم |
| 93 | #25 BAHJAFLIX: sample photo 6 words | نزهة هادئة بين المراكب. | A quiet walk among the boats. | پیاسەیەکی ئارام لە نێوان بەلەمەکاندا. | گەشتەکا ئارام د ناڤبەرا بەلەماندا. |
