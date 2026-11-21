# Pink Dreamhouse (#30): the packages

The owner's plan (2026-11-19) has three packages, made in **Admin → Themes → Pink Dreamhouse → Packages** with the
owner's prices. The house a customer gets follows **Photo sets in this package** (sets of three photos): 2 sets = the
Basic house, 4 = VIP, 8 = VVIP. Each package also ticks its **Colour sets offered** and, with video, sets **Videos in
this package**. Fields: the birthday person's name and the message (for Friends, also the second name).

The design's own name, description and six colour sets are added automatically on deploy
(`src/server/catalog/owner-setup.ts`). Its own colours (Blush Cream) are always offered as «Original colour».

| | Basic | VIP | VVIP |
|---|---|---|---|
| Photo sets (photos) | 2 (6) | 4 (12) | 8 (24) |
| Rooms | living room, bedroom | and kitchen, vanity (upstairs) | and cinema, secret suite |
| Features | photos, colour choice | photos, video, colour choice | photos, video, colour choice, music (and custom music for their own song) |
| Videos in this package | — | 1 (the fridge) | 3 (fridge, cinema, suite) |
| Colour sets offered | Rose Cream | Rose Cream, Lavender Cloud, Peach Glow | all six (none ticked = all) |
| Drawers with messages | 2 | 4 | 8 |
| The ending | the gift and confetti | and the cake's confetti switch, the cupcake, the mirror | and the secret suite (opens once every drawer outside it is opened), the golden chest, the final button |

The customer can always choose no music (the editor's «No music»).

## Basic

| | Name | Description |
|---|---|---|
| Arabic | أساسية | غرفة المعيشة وغرفة النوم: 6 صور على الجدران، رسالتان مخبأتان في الأدراج، وهدية تُفتح بتهنئة عيد الميلاد. لونان للاختيار. |
| English | Basic | The living room and the bedroom: 6 photos on the walls, two messages hidden in the drawers, and a gift that opens with a birthday wish. Two colours to choose from. |
| Sorani (ckb) | سەرەتایی | ژووری دانیشتن و ژووری نووستن: ٦ وێنە لەسەر دیوارەکان، دوو نامە لە چەکمەجەکاندا شاردراونەتەوە، و دیارییەک کە بە پیرۆزبایی ڕۆژی لەدایکبوون دەکرێتەوە. دوو ڕەنگ بۆ هەڵبژاردن. |
| Badini (bdn) | سەرەتایی | ژوورا روینشتنێ و ژوورا نڤستنێ: ٦ وێنە ل سەر دیواران، دوو نامە د چەکمەجان دا هاتینە ڤەشارتن، و دیاریەک ب پیرۆزباهیا ڕۆژا ژدایکبوونێ ڤەدبیت. دوو ڕەنگ بۆ هەلبژارتنێ. |

## VIP

| | Name | Description |
|---|---|---|
| Arabic | VIP | أربع غرف: المعيشة والنوم ومقهى المطبخ واستوديو التجميل في الطابق العلوي، 12 صورة، 4 رسائل في الأدراج، فيديو على شاشة الثلاجة، كب كيك ومرآة تحمل رسائلك. أربعة ألوان. |
| English | VIP | Four rooms: the living room, the bedroom, the kitchen café and the vanity studio upstairs, 12 photos, 4 drawer messages, a video on the fridge screen, and a cupcake and a mirror with your notes. Four colours. |
| Sorani (ckb) | VIP | چوار ژوور: ژووری دانیشتن، ژووری نووستن، کافێی چێشتخانە و ستۆدیۆی جوانکاری لە نهۆمی سەرەوە، ١٢ وێنە، ٤ نامە لە چەکمەجەکاندا، ڤیدیۆیەک لەسەر شاشەی سەلاجەکە، و کەپ کەیک و ئاوێنەیەک کە نامەکانت هەڵدەگرن. چوار ڕەنگ. |
| Badini (bdn) | VIP | چار ژوور: ژوورا روینشتنێ، ژوورا نڤستنێ، کافێیا مەتبەخێ و ستۆدیۆیا جوانکاریێ ل قاتێ سەرێ، ١٢ وێنە، ٤ نامە د چەکمەجان دا، ڤیدیۆیەک ل سەر شاشا سەلاجێ، و کەپ کەیکەک و نەینکەک کو نامەیێن تە هەلدگرن. چار ڕەنگ. |

## VVIP

| | Name | Description |
|---|---|---|
| Arabic | VVIP | البيت كاملاً بست غرف: مع سينما الأصدقاء والجناح السري الذي لا يُفتح إلا بعد العثور على كل الذكريات، 24 صورة، 8 رسائل، 3 فيديوهات، صندوق ذهبي ونهاية احتفالية، موسيقى في الخلفية، وسبعة ألوان. |
| English | VVIP | The whole house of six rooms: with the bestie cinema and the secret suite that opens only once every memory is found, 24 photos, 8 messages, 3 videos, a golden chest and a grand finale, background music, and seven colours. |
| Sorani (ckb) | VVIP | هەموو خانووەکە بە شەش ژوورەوە: لەگەڵ سینەمای هاوڕێیان و ژووری نهێنی کە تەنها دوای دۆزینەوەی هەموو یادەوەرییەکان دەکرێتەوە، ٢٤ وێنە، ٨ نامە، ٣ ڤیدیۆ، سندووقێکی زێڕین و کۆتاییەکی ئاهەنگئامێز، مۆسیقای پاشبنەما، و حەوت ڕەنگ. |
| Badini (bdn) | VVIP | هەمی خانی ب شەش ژووران: دگەل سینەمایا هەڤالان و ژوورا نهێنی کو بتنێ پشتی دیتنا هەمی بیرهاتنان ڤەدبیت، ٢٤ وێنە، ٨ نامە، ٣ ڤیدیۆ، سندوقەکا زێڕین و دووماهیکەکا ئاهەنگی، مۆسیقایا پاشبنەمایێ، و حەفت ڕەنگ. |
