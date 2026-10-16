# Theme Brief: Winter Flower (`winter-flower` v1, theme #14)

Built 2026-10-15 from the designer's hand-off `winter-flower-wedding-2026-10-15.zip`. Code in
`themes/winter-flower/v1/`. The flowers and flourish come from the owner's PowerPoint invitation.

## Idea

- **Occasion:** Wedding.
- **Opening:** a white page between slate-blue double rules, with the two flower stems (blue roses, white
  anemones, eucalyptus) joined in the middle. A tap anywhere on the flowers parts them, the left one up and left,
  the right one down and right, and the names, message and date appear between them (about 2 s). There is no
  card swap: the same page becomes the top of the invitation. The music starts with the tap.
- **Then:** an interlude line, the dark-blue countdown cartouche, the arched details card (weekday, big day
  number, time, venue, map), the reply card, guest messages and an arched closing panel with the names.

## Owner decisions (chat, 2026-10-15)

- **No couple photos** for now: the arched photo mount and the second photo are removed; its caption is kept as
  a large italic line.
- **Open button:** the contract needs a button labelled "Open invitation". The whole flower arrangement is that
  button, with a small, softly pulsing "Open invitation" line under the flowers.

## Contract notes

- **Border:** the double rule (`assets/double-rule.svg`, `strips`, 42 px in from each edge).
- **Packages:** Normal / VIP / VVIP as the three `validStates`.
- **Names** are spaced capitals, one per line; a long word shrinks to stay on its line.
- **Kurdish:** Arabic until the owner approves Kurdish wording (`copy.ts`).
- **Print:** the original card's layout rebuilt with live text (the supplied card has the template's own names
  and date drawn in, so it is not used): side rules, a stem top-left and bottom-right, names, message, a
  date and time table, venue and QR. Landscape back and A4 keepsake in the same style.
- **Fonts:** Playfair Display and Amiri, both SIL OFL.
