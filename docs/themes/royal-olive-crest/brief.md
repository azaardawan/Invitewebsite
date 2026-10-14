# Theme Brief: Royal Olive Crest (`royal-olive-crest` v1, theme #11)

Agreed with the owner in chat, 2026-10-14. Code in `themes/royal-olive-crest/v1/`.

## 1. Idea

- **Occasion:** Wedding.
- **Mood:** royal, rich, calm. Olive green and gold for the crest pages, cream paper for reading.
- **Experience:** A closed olive-green envelope with a gold wax seal bearing **the couple's initials**. On the
  guest's tap, gold light sweeps over the embossing, the seal glints and lifts away, light glows from where
  the flaps meet, and the four flaps swing open onto the crowned crest page with the couple's names and the
  date in calligraphy. **The music begins when the invitation appears**, not with the tap. The guest then
  scrolls through the Quran verse, the couple's message, the venue, the countdown and the guest form.
- **No scroll animations** for now (owner's choice); sections are simply there as the guest scrolls.

## 2. The owner's artwork and where it is used

Numbers are the owner's (chat, 2026-10-14). Shipped files are in `themes/royal-olive-crest/v1/assets/` (WebP).

| # | Artwork | Used for | File |
|---|---|---|---|
| 1 | Green envelope, blank gold seal | Opening. The seal was cut out (`seal.webp`) and the envelope rebuilt underneath it (`envelope.webp`) so the seal can lift away; the four flaps are cut along the envelope's own fold lines. | `envelope.webp`, `seal.webp` |
| 2 | Green crest page | What the envelope opens onto: names + date in calligraphy | `sheet-names.webp` |
| 3 | Cream oval frame | Quran verse (Ar-Rum 30:21) | `sheet-verse.webp` |
| 7 | Green border, cream panel, crest | The couple's message | `sheet-message.webp` |
| 5 | Cream page, gold frame | Venue, date, time and the map button | `sheet-venue.webp` |
| 4 | Green page, gold circle | Countdown (in the circle), date and time below | `sheet-countdown.webp` |
| 6 | Form mockup | Style reference for the guest form, congratulations messages and the music button (built in code) | — |
| 11 | Cream crest card, portrait | Printed A5 card, front | `card-front.webp` |
| 8 | Cream framed card, landscape | Printed A5 card, back (title + message + names) | `card-back.webp` |
| 10 | Cream crest page | Keepsake PDF cover | `keepsake-cover.webp` |
| 16 / P5 | Crown and shield | Guest form and closing ornament | `crest.webp` |
| P1 | Gold divider | Between venue and details, closing | `divider.webp` |
| P7 | Corner flourish | The theme border (top-right and bottom-left corners) on the invitation, card and keepsake | `corner.webp` |
| 12 / 9, 14 / 13 | Leaf front / back, heart front / back | Shaped printed cards (see §8) | `leaf-*.webp`, `heart-*.webp` |
| 15 | Scalloped panel | Not used | — |

The red/yellow halos on the cut-outs came from background removal (they are not cut marks); the export
cleans them. Regenerate everything with the scripts in `scripts/` (Python 3 with Pillow, NumPy, OpenCV):

```bash
python3 -I scripts/envelope.py <owner #1 PNG> env-clean.png seal-layer.png
python3 -I scripts/export.py <folder with env-clean.png, seal-layer.png and src/*.png> themes/royal-olive-crest/v1/assets
```

## 3. Fields and wording

| Field | Use | Notes |
|---|---|---|
| `person_1_name` | Groom | Platform convention (starter label "اسم العريس"). |
| `person_2_name` | Bride | |
| `seal_initials` | **New in the Field Library, optional.** Initials on the seal | Empty: the first letter of each name, **groom first**, in the script the names were typed in (Arabic names → Arabic letters). Filled: printed exactly as typed (up to 9 characters). |
| `event_date`, `event_time` | Crest page, venue page, countdown page | |
| `venue_name`, `venue_map_url` | Venue page | |
| `invitation_message` | Message page | Fits the 300-character limit. |

Wording choice on the order form (manifest `wording.sealJoin`): the symbol between the two initials,
**& (default), ♥, · or و**. Only used when the customer leaves `seal_initials` empty. The ♥ is drawn in the
letters' gold, never as an emoji.

The letters are engraved into the seal's flat face: dark bronze, bolder than the script font's default,
sized by how many letters there are, and always inside the face with room to spare.

## 4. Packages

Every combination is allowed; the owner sets the packages in Admin. Designed examples (`validStates`):

| | Normal | VIP | VVIP |
|---|---|---|---|
| Envelope opening, music, names, date, verse, message, venue | ✅ | ✅ | ✅ |
| Printed A5 card | ✅ | ✅ | ✅ |
| Countdown, map, guest form | — | ✅ | ✅ |
| Congratulations messages, keepsake PDF | — | — | ✅ |
| Leaf or heart card instead of the A5 card (`card_shapes`) | — | — | ✅ |

A missing feature removes its whole page (the countdown page, the map button, the form).

## 5. Opening timeline (after the tap; total under 4 s)

| Time | What happens |
|---|---|
| 0–0.85 s | Gold light sweeps across the envelope |
| 0.15–0.85 s | The seal glints |
| 0.8–1.35 s | The seal lifts and fades |
| 0.5–2.5 s | Warm light grows where the flaps meet, then fades |
| 1–2.45 s | The four flaps swing open, revealing the crest page underneath |
| 2.05 s | The invitation is live: the names and date rise in, **the song starts** (fading in) |

Reduced motion: the envelope simply fades and the song starts with the tap.

Platform change for this: `useMusic().prime()` unlocks sound on the tap without playing; `start()` later plays
it (see `docs/THEME_CONTRACT.md` §4). `start()` now fades the song in over 1.2 s on every theme.

## 6. Colours and fonts

- Olive `#4A5228`, deep olive `#262A10`, ink `#39412D`, gold `#C9A45C` / light `#E6C77D` / deep `#8C6C2C`,
  cream `#F6ECD4`. Text on cream is dark olive (owner's choice for the verse); gold only for decoration and
  for the names on green.
- Script (names, initials, dates): **Pinyon Script** (Latin) + **Aref Ruqaa Bold** (Arabic, Kurdish).
- Text: **Cormorant Garamond** (Latin) + **Amiri** (Arabic, Kurdish, the verse). All SIL OFL 1.1.

## 7. Print

- **A5 card front** (#11): names, message, date, time, venue, optional QR, between the crest and the bottom ornament.
- **A5 card back** (#8, landscape): the customer's title and message, then the names. The artwork's frame is its border.
- **Keepsake** (A4): #10 as the cover, then the messages on cream pages with the corner flourishes on every page.

## 8. Shaped printed cards: leaf and heart (built, 2026-10-14)

The customer chooses **one** printed card on the order form: the **A5 card**, the **leaf** or the **heart**, in
packages with the new feature **"Shaped printed card" (`card_shapes`)**; a package without it (e.g. Normal) only has
the A5 card. Platform feature: see `docs/THEME_CONTRACT.md` §6 "Shaped cards".

| | Leaf | Heart |
|---|---|---|
| Size (cut) | 107 × 180.6 mm (the agreed "about 12 × 18", at the artwork's own proportions) | 150 × 157.9 mm |
| Front | #12: names + date in calligraphy, gold on green | #14: names + date |
| Back | **The leaf in cream** (#12 mirrored, green turned cream): the owner's #9 is a slimmer, even "eye" shape that can't share the front's cut line (see below) | #13, fitted to the front's outline |
| Both backs | The customer's title and message (long messages step down a size), the names, the QR code | |

A card is cut along **one** line, so each back must have the front's outline, mirrored. Neither owner back
matched its front (heart back 10 % narrower, leaf back a different shape): the heart back was reshaped row by
row onto the front's outline; the leaf back could not be without tearing its ornaments, so it is the cream
version of the front for now. **To use #9's look, the owner can supply a leaf back drawn on #12's outline.**

Files the customer gets (receipt): the PDF (each side on a page with a 10 mm margin) and a transparent 300 dpi
PNG of each side. The print shop file (Admin → invitation → print-shop download) adds a thin magenta cut line
exactly on the outline. The artwork ends at the cut line (no bleed beyond it): ask the print shop to cut on the line.

Regenerate the artwork and cut lines with `scripts/shapes.py` (outlines go to `themes/royal-olive-crest/v1/outlines.ts`):

```bash
python3 -I scripts/shapes.py leaf <#12 PNG> <#9 PNG> cream 107 out/
python3 -I scripts/shapes.py heart <#14 PNG> <#13 PNG> none 150 out/
```

## 9. Admin setup after deploy

1. Field Library: `seal_initials` appears automatically (labels editable).
2. Themes → Royal Olive Crest → Fields: label `person_1_name` "اسم العريس" / "Groom's name" and `person_2_name`
   "اسم العروس" / "Bride's name" if not already the section defaults.
3. Packages: include `seal_initials` so customers can type their own initials (without it the initials are
   always worked out from the names). Add "Shaped printed card" to the packages that offer the leaf and heart.
4. Pick the song and the Kurdish design name (suggestions in `docs/translations/KURDISH_REVIEW.md`, batches 25–26).
