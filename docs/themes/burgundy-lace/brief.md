# Theme Brief: Burgundy & Lace (`burgundy-lace` v1, theme #12)

Built 2026-10-15 from the designer's hand-off `bahja-final-wedding-themes-2026-10-13.zip` (theme
`burgundy-and-lace`). Code in `themes/burgundy-lace/v1/`.

## Idea

- **Occasion:** Wedding.
- **Opening:** a wine page framed in ivory lace corners and fine double rails; an ivory envelope sealed with a
  burgundy rose wax seal. The tap (on the button or the envelope) lifts the seal, swings the flap open and raises
  a lace card with the names, date and venue; a painting of swans fades in behind it (about 2.5 s). The music
  starts with the tap.
- **Then:** ivory stationery with the message, family names and the names; a countdown over the painting; a
  calendar card (date, month grid with the day ringed, time, venue, map button); a small lace card leading to
  the guest form; guest messages; a monogram of the two initials and the date.

## Owner decisions (chat, 2026-10-15)

- **No couple photo** for now: the oval photo frame is removed (a small ornament sits in its place) and the
  reply screen's photo header is gone; the guest form sits in the page under the lace reply card.
- **Artwork and fonts are used as supplied.** The hand-off's `ASSET_NOTICES.md` records that the painting and
  the sample photo are OakleyCoDesigns reference artwork and that the lace was generated from it; the
  calligraphy font (Set Sail Studios) and "WeddingSerif" (Monotype) are commercial. The owner chose not to
  replace them at this stage.

## Contract notes

- **Border:** the lace corner (`assets/lace-corner-tr.webp`, `corners`, 114 px). The platform draws the top-right
  and bottom-left corners; with the theme's own border the theme adds the other two and the rails, as designed.
- **Packages:** the designer's Normal / VIP / VVIP are the three `validStates` (Normal has no guest form).
- **Long names** (over 10 letters) switch to the design's compact stacked layout.
- **Kurdish:** the design's lines show in Arabic on Kurdish invitations until the owner approves Kurdish
  wording (`copy.ts`).
- **Print:** the design's print card (wine, lace frame, names on the lace square, details, QR) on A5 + 3 mm
  bleed; a landscape back in the same frame; an A4 keepsake with a wine cover and ivory message pages.
