# Theme brief — Embroidered Garden (حديقة التطريز), baby boy

Agreed with the owner on 2026-10-10; updated 2026-10-11 with the owner's finished designs for every
product (`owner-designs/`); name font chosen and date of birth added back (2026-10-11). Code:
`themes/embroidered-garden/v1/` (design **#6**; files only, `onlineInvitation: false`).

## 1. Idea
- **Occasion:** welcoming a baby boy (section `newborn`, group **Boy**). Boys only.
- **Product:** files only, **no online invitation** (no link, no QR, no `/i/` page): an Instagram story,
  an A5 card to print, chocolate stickers, and a water-bottle wrap. The design draws all four itself
  (`print/Card|Story|Sticker|Bottle.tsx`).
- **Mood:** white embroidered flowers, sage leaves and stitched doves on cream linen; the baby's
  name stitched in sage thread. References: `owner-designs/` (story, A5 card, round and square
  stickers, bottle wrap) and `original-story.jpg` (the first story).

## 2. Fields (all required, nothing else)
| Field | Arabic | English | Max |
|---|---|---|---|
| `baby_name` | اسم المولود | Baby's name | 25 |
| `father_name` | اسم الأب | Father's name | 30 |
| `birth_date` | تاريخ الولادة | Date of birth | past date, ≤ 5 years |

The customer chooses how the date is written on the order form: Gregorian («٥ تشرين الأول ٢٠٢٦»),
numeric («٥ / ١٠ / ٢٠٢٦»), Hijri, or Gregorian + Hijri; Arabic-Indic or Western digits. The date
sits under «بن …» between two embroidered sprigs (no sprigs on the small stickers).

Fixed text (not editable by the customer):
- Always Arabic, in every language (owner decision): «الحمد لله الذي جعل لنا من زينة الحياة نصيبًا ومن الذكور حظًّا وسندًا»
  and the du'a «اللّهُمَّ أنبِتهُ نباتًا حسنًا واجعلهُ قُرّةَ عينٍ لنا، واجعَلهُ صغيرًا بارًّا وكبيرًا بارًّا».
- Changeable by the customer on the order form (manifest `wording`): «رزقنا الله بأجمل العطايا» and «بن».
  Arabic is the default in every language; the customer may pick their language's version (English "God has
  blessed us with the most beautiful of gifts" / "son of"; Sorani «کوڕی», Badini «کوڕێ», owner's wording) or
  write their own. No Kurdish blessing yet (owner to approve).

## 3. Products and the customer's choices
| Product | Text on it | Files | Chosen on the order form |
|---|---|---|---|
| Instagram story | verse, blessing, name, father, date, du'a | PNG 1080 × 1920 | date style |
| A5 card (`print_card`) | same as the story | PDF (3 mm bleed); the back is the platform's (optional message) | date style |
| Chocolate sticker (`sticker`) | blessing, name, father, date | 4 cm: A4 PDF sheet of 24 with cut guides, or a PNG to resize | round or square, date style |
| Bottle wrap (`bottle_label`) | verse + blessing (right), name + father + date (middle), du'a (left) | A4 PDF sheet with cut lines, or a PNG | 250 / 330 / 500 / 600 ml, date style |

Packages, names and prices are set by the owner in Admin (any mix of the four products). Everything is
watermarked until paid; the files download from the receipt.

## 4. Artwork
The owner's own design for each product. Stickers and the bottle wrap come from the owner's PDFs
(clean artwork, no text). The story and the card had their text removed from the owner's images,
so names are set as live text. The art is about 175–270 dpi at print size.

## 5. Fonts (all cover ڕ ۆ ێ ڵ ە ڤ, OFL licence in `fonts/OFL.txt`)
- Baby's name: **Marhey** Bold (owner's choice, #12 on the comparison sheet), filled with a sage
  satin-stitch thread texture.
- Story and card text: **Noto Sans Arabic**. Sticker and bottle-wrap text: **Aref Ruqaa** (as in the owner's designs).
