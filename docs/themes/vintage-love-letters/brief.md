# Theme Brief: Vintage Love Letters (`vintage-love-letters` v1, theme #15)

Built 2026-10-15 from the designer's hand-off `vintage-love-letters-poster-2026-10-15.zip` (poster edition).
Code in `themes/vintage-love-letters/v1/`. The artwork comes from the owner's `Invitation.svg` poster.

## Idea

- **Occasion:** Wedding.
- **Opening:** the poster itself (lined letter paper, lace, a red rose, striped tulips, the burgundy "Wedding
  Invitation" title, the two red name strips) with its sealed envelope. The tap fades the poster, brings the
  envelope forward, opens the flap, breaks the seal and draws out a letter with the couple's names (about 3.4 s).
  The music starts with the tap.
- **Then:** a letter-style website: the poster heading (Arabic-script invitations get the title as text), a
  "save the date" stamp, the names on red strips, the letter with the message, a ticket-style countdown, a
  calendar card and the venue card on lace, a reply letter with a postmark and wax seal, guest messages, and a
  closing page with tulips.

## Owner decisions (chat, 2026-10-15)

- **The names are the customer's.** The poster's placeholder names were artwork; they were painted out of the
  cover (`assets/cover-base.webp`: the lettering inside both strips was replaced by the strip colour, blended
  column by column from the clean pixels above and below) and the names are live text on the strips, in the
  envelope letter, on the reply postmark and on the closing page. Previews use the platform's sample names.
- **No couple photos** for now; the date stamp that sat on the photo now sits above the name strips.
- **Fonts used as supplied:** WeddingSerif, Aref Ruqaa, Amiri.

## Contract notes

- **Border:** the poster's burgundy lace turned upright (`assets/lace-strip.webp`, `strips`) down both sides of
  the closing page, the card back and the keepsake pages. The card front is the poster itself, which already has
  its lace; it draws the border only when the owner sets a replacement.
- **Packages:** Normal / VIP / VVIP as the three `validStates`.
- **Kurdish:** Arabic until the owner approves Kurdish wording (`copy.ts`).
- **Print:** the poster with the names on its strips, and the date, time, venue and QR code in the empty lined
  paper at the bottom right; landscape back on the poster's paper; A4 keepsake with the poster as its cover.
