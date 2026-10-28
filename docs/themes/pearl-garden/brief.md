# Theme brief — Pearl Garden (working title), baby girl

Agreed with the owner on 2026-10-13 (the display name is chosen later in Admin). Code: `themes/pearl-garden/v1/`
(design **#10**; files only, `onlineInvitation: false`). The girl's sister of Embroidered Garden (#6).
References: `owner-designs/` (story, A5 card, round and square stickers, bottle wrap).

## Idea
- **Occasion:** welcoming a baby girl (section `newborn`, group **Girl**). Same two packages as the other newborn designs.
- **Product:** files only: Instagram story, A5 card (front and back), chocolate stickers (round, square or both), bottle label.
- **Look:** pink embroidered flowers, pearl sprigs and stitched doves on linen. Rebuilt from the owner's pieces
  (two garlands, two bird branches, a dove; owner's option B); the linen is made to match.

## Text
Fixed, Arabic in every language (not editable):
- «الحمد لله على جميل ما أعطى / وعلى لُطفه فيما وهب / أشرقت حياتنا بقدوم صغيرتنا»
  («على»: the owner's design had «علي»; corrected with the owner).
- «وأكرمنا الله بأجمل العطايا»
- Du'a: «اللهمّ احفظها بعينك التي لا تنام / وأنِر قلبها بالإيمان / واجعلها قرةَ عينٍ لنا / وبارك لنا فيها»
  («عينٍ»: the design had «عينَ»; corrected with the owner).
- «@Bahjaa.iq» on the story and card only.

Customer choices: the connector «بنت» ("Daughter of" / «کچی» / «کچا» by default for those languages, or
their own word); the date of birth (format on the order form); the father's name on stickers and bottle (off by default).

## Type
- Name: Marhey Bold, stitched in dusty rose (as #6, in pink; owner).
- Small text: Noto Sans Arabic (all Kurdish letters).

## Online invitation (v2, 2026-10-28)

The owner changed their mind: newborn designs get an online invitation too. `v2` adds one, built from this
design's own artwork: a cover with the baby's name, the date of birth and the open button; tapping it starts the
music while the artwork parts and the story composition settles in; then the date of birth, the guest form with
congratulations, the guests' messages and the name again (`Theme.tsx`, `cover.tsx`, `invitation.module.css`,
`border.ts`). No venue, time, map or countdown. The files (story, card, stickers, bottle label) are unchanged. If
something doesn't fit, the owner may replace this invitation with another.

