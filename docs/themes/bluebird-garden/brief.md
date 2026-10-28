# Theme brief — Bluebird Garden (طيور الحديقة), baby boy

Agreed with the owner on 2026-10-11. Code: `themes/bluebird-garden/v1/` (design **#7**; files only,
`onlineInvitation: false`). References: `owner-designs/` (story, A5 card, round and square stickers,
bottle wrap, and the one-child family picture the owner asked for).

## 1. Idea
- **Occasion:** welcoming a baby boy (section `newborn`, group **Boy**).
- **Product:** files only, no online invitation: an Instagram story, an A5 card to print, chocolate
  stickers (round, square or both) and a water-bottle label.
- **Mood:** watercolour blue delphiniums, two bluebirds, a family (mother, father, the baby in a navy
  cradle) on soft white paper; the baby's name in blue glass lettering.
- Everything is rebuilt from the owner's pieces (`assets/`), so all text is live and never baked in.

## 2. Fields
| Field | Arabic | English |
|---|---|---|
| `baby_name` | اسم المولود | Baby's name |
| `father_name` | اسم الأب | Father's name |
| `birth_date` | تاريخ الولادة | Date of birth (format chosen on the order form) |

## 3. Text
Fixed, Arabic in every language (not editable):
- «الحمد لله على تمام النعمة واكتمال المِنّة»
- «الحمد لله الذي جعل لنا من زينة الحياة نصيباً ومن الذكور حظّاً وسنداً» (owner's option C)
- Du'a: «جعله الله فرحة وبركة / وغيثاً أينما حل»
- «@Bahjaa.iq» on the story and the card only.

Customer choices on the order form:
- **Birth order** (`wording.order`, fixed choices only, no own text): «وهبنا الله أوّل أفراحنا وأميرنا الأوّل»
  (default), or ثاني / ثالث / رابع.
- **Connector** (`wording.sonOf`): «بن»; English "Son of", Sorani «کوڕی», Badini «کوڕێ» are the defaults
  for orders in those languages; the customer may write their own word.
- **Father's name on the stickers and bottle** (`switches.fatherOnExtras`): off by default; the story
  and card always show it.

## 4. Type
- Name: Scheherazade New Bold (owner's font #5) in blue glass (gradient, outline and shine).
- Small text: Tajawal, as in the owner's design; Kurdish letters it lacks come from Noto Sans Arabic.

## 5. Products
| Product | Shows |
|---|---|
| Story 1080×1920 | praise, birth order, name, father, date, du'a, family, flowers, handle |
| A5 card (bleed 3 mm) | the same as the story |
| Stickers 40 mm | name (+ father if ticked), birds, flowers; round has a blue ring |
| Bottle label | name (+ father if ticked), birds, flowers |
| A5 card back (landscape) | the customer's title in blue glass, their message, the baby's name; paper, delphiniums and birds as on the front |

Before payment everything is watermarked by the platform; files are served only once paid.
Packages and the cover are set by the owner in Admin.

## Version 2 (2026-10-13)
v1 is activated and frozen. `v2` keeps the baby's name clear of the lines and art around it (short names with tall letters/tails, long English names) and wraps a long father line on round stickers. Make it current in Admin (Themes → the design → Versions → Make current); orders already placed keep v1.

## Online invitation (v3, 2026-10-28)

The owner changed their mind: newborn designs get an online invitation too. `v3` adds one, built from this
design's own artwork: a cover with the baby's name, the date of birth and the open button; tapping it starts the
music while the artwork parts and the story composition settles in; then the date of birth, the guest form with
congratulations, the guests' messages and the name again (`Theme.tsx`, `cover.tsx`, `invitation.module.css`,
`border.ts`). No venue, time, map or countdown. The files (story, card, stickers, bottle label) are unchanged. If
something doesn't fit, the owner may replace this invitation with another.

