# Theme brief — Swan Garden (working title), baby girl

Agreed with the owner on 2026-10-12 (the display name is chosen later in Admin). Code: `themes/swan-garden/v1/`
(design **#9**; files only, `onlineInvitation: false`). References: `owner-designs/` (story, A5 card, round and
square stickers, bottle wrap).

## 1. Idea
- **Occasion:** welcoming a baby girl (section `newborn`, group **Girl**). Same two packages as #7/#8.
- **Product:** files only, no online invitation: Instagram story, A5 card (front and back), chocolate stickers
  (round, square or both) and a water-bottle label.
- **Mood:** two glass swans (one with a pink bow) on a pond, pink and yellow flowers and pink bell-flower sprigs
  on linen; the baby's name in pink glass lettering. Rebuilt from the owner's pieces; the linen and the pond are
  made to match (the pond from a clean patch of the owner's bottle design).

## 2. Fields
`baby_name`, `father_name`, `birth_date` (format chosen on the order form; shown under the father's name, owner
2026-10-12).

## 3. Text
Fixed, Arabic in every language (not editable):
- «الحمد لله على جميل ما أعطى / وعظيم ما وهب»
- «أكرمنا الله بأجمل العطايا» (no birth-order choice, owner)
- Du'a: «اللهم أنبتها نباتاً حسناً / واجعلها قرة عينٍ لنا وبارك لنا فيها» («عينٍ»: the owner's story had
  «عيناً»; corrected with the owner).
- «@Bahjaa.iq» on the story and card only.

Customer choices: the connector «بنت» ("Daughter of" / «کچی» / «کچا» by default for those languages, or their
own word), shown in green as in the design; the father's name on the stickers and bottle (off by default).

## 4. Type
- Name: pink glass, Aref Ruqaa Ink Bold (owner's choice, font #14 of the free-font sheets).
- Small text: Tajawal (Kurdish letters from Noto Sans Arabic).

## 5. Products
| Product | Shows |
|---|---|
| Story 1080×1920 | praise, gift line, name, father, date, du'a, swans, pond, flowers, bell sprigs, handle |
| A5 card (bleed 3 mm) | the same as the story |
| A5 card back (landscape) | title in pink glass, message, the baby's name; linen, flowers, bell sprigs |
| Stickers 40 mm | name (+ father if ticked), swans, pond, flowers; round has a rose ring |
| Bottle label | name (+ father if ticked), a swan with a bow at each end facing the name, pond, flowers |

## Online invitation (v2, 2026-10-28)

The owner changed their mind: newborn designs get an online invitation too. `v2` adds one, built from this
design's own artwork: a cover with the baby's name, the date of birth and the open button; tapping it starts the
music while the artwork parts and the story composition settles in; then the date of birth, the guest form with
congratulations, the guests' messages and the name again (`Theme.tsx`, `cover.tsx`, `invitation.module.css`,
`border.ts`). No venue, time, map or countdown. The files (story, card, stickers, bottle label) are unchanged. If
something doesn't fit, the owner may replace this invitation with another.

