# Theme brief — Embroidered Garden (حديقة التطريز), baby boy

Agreed with the owner on 2026-10-10. Code: `themes/embroidered-garden/v1/` (design kit).

## 1. Idea
- **Occasion:** welcoming a baby boy (section `baby`). Boys only.
- **Product:** a design kit, with no online invitation: an Instagram story, an A5 card to print, chocolate
  stickers, and a water-bottle wrap.
- **Mood:** white embroidered flowers, sage leaves and stitched doves on cream linen; the baby's
  name stitched in sage thread. Reference: `original-story.jpg` (the owner's first story).

## 2. Fields (all required, nothing else)
| Field | Arabic | English | Max |
|---|---|---|---|
| `baby_name` | اسم المولود | Baby's name | 25 |
| `father_name` | اسم الأب | Father's name | 30 |
| `birth_date` | تاريخ الولادة | Date of birth | past date, ≤ 5 years |

Fixed text (not editable by the customer):
- Always Arabic, in every kit language (owner decision): «الحمد لله الذي جعل لنا من زينة الحياة نصيبًا ومن الذكور حظًّا وسندًا»
  and the du'a «اللّهُمَّ أنبِتهُ نباتًا حسنًا واجعلهُ قُرّةَ عينٍ لنا، واجعَلهُ صغيرًا بارًّا وكبيرًا بارًّا».
- Translatable and changeable later (`kitCopy.embroidered-garden`): «رزقنا الله بأجمل العطايا» and «بن».

## 3. Products and the customer's choices
| Product | Sizes / files | Chosen when downloading |
|---|---|---|
| Instagram story | PNG 1080 × 1920 | how the date is written |
| A5 card | PDF (3 mm bleed, crop marks) + PNG 300 dpi | how the date is written |
| Chocolate sticker | 5 cm: A4 PDF sheet of 15 with cut guides, or a 2000 px PNG to resize | round or square |
| Bottle wrap | 250 / 330 / 500 / 600 ml: A4 PDF sheet with crop marks, or a PNG at 300 dpi | bottle size |

Date styles: Gregorian («٥ تشرين الأول ٢٠٢٦»), numeric («٥ / ١٠ / ٢٠٢٦»), Hijri, or both; Arabic-Indic
or Western digits. The birth date sits under the father's line, between two embroidered sprigs.

Packages, names and prices are set by the owner in Admin (any mix of the four products).

## 4. Artwork
Fallback artwork cut from the owner's story (text removed, flower bands, corners and doves cut out,
upscaled 2×). Print quality is soft at A5; the owner will supply clean, layered, high-resolution
artwork if they don't like it (copy the folder to `v2` once v1 has been activated).

## 5. Fonts (all cover ڕ ۆ ێ ڵ ە ڤ, OFL licence in `fonts/OFL.txt`)
- Baby's name: **Marhey** Bold, filled with a sage satin-stitch thread texture.
- Everything else: **Noto Sans Arabic**.
