# Kurdish translation review

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

## Batch 2 — currency switcher (PENDING)

Shown next to the language choice once you set an exchange rate in Admin → Website settings.

| # | Key | Arabic | English | Suggested Sorani (ckb) | Suggested Badini (bdn) | Conf. | Status |
|---|---|---|---|---|---|---|---|
| 13 | `common.currency` | العملة | Currency | دراو | دراڤ | ◐ | PENDING |
| 14 | `common.currencyIqd` | دينار | IQD | دینار | دینار | ● | PENDING |
| 15 | `common.currencyUsd` | دولار | USD | دۆلار | دۆلار | ● | PENDING |
| 16 | `common.usdApproxNote` | الأسعار بالدولار تقريبية حسب سعر الصرف؛ يتم الدفع بالدينار العراقي. | USD prices are approximate at our exchange rate; payment is made in Iraqi dinars. | نرخەکان بە دۆلار نزیکەیین بەپێی نرخی ئاڵوگۆڕ؛ پارەدان بە دیناری عێراقی دەکرێت. | بهایێن ب دۆلاری نێزیکن ل دویڤ بهایێ گوهۆڕینێ؛ پارەدان ب دینارێ عیراقی دهێتە کرن. | ○ | PENDING |

## Batch 3 — Olive Ring Box theme wording (AWAITING TRANSLATION)

The theme's fixed wording lives in `themes/olive-ring-box/v1/copy.ts` (Arabic and English), not in
the site message files. Until Kurdish wording is approved, Sorani and Badini invitations of this
theme show the Arabic. Please supply or approve Kurdish for the guest-facing lines below; the rest
of the file (form errors, keepsake PDF) can follow in the same batch.

| # | Key (`copy.ts`) | Arabic | English | Status |
|---|---|---|---|---|
| 17 | `open` | افتح الدعوة | Open invitation | AWAITING |
| 18 | `date` / `time` / `venue` | التاريخ / الوقت / المكان | Date / Time / Venue | AWAITING |
| 19 | `countdownTitle` | يبدأ الحفل بعد | The celebration begins in | AWAITING |
| 20 | `map` | افتح الموقع على الخريطة | Open location on the map | AWAITING |
| 21 | `formTitle` | تأكيد الحضور | Kindly reply | AWAITING |
| 22 | `attending` / `notAttending` | سأحضر بإذن الله / أعتذر عن الحضور | Joyfully attending / Regretfully declining | AWAITING |
| 23 | `message` | رسالتك للعروسين | Your message to the couple | AWAITING |
| 24 | `send` / `successTitle` / `successBody` | إرسال الرد / شكرًا لك / تم إرسال ردك إلى العروسين. | Send reply / Thank you / Your reply has been sent to the couple. | AWAITING |
| 25 | `closing` / `closingSub` | شكرًا لمشاركتكم فرحتنا / حضوركم يتمّ سعادتنا | Thank you for sharing our joy / Your presence completes our happiness | AWAITING |

The basmala (بسم الله الرحمن الرحيم) always stays in Arabic.
