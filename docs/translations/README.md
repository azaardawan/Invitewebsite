# Translations

## Languages
| Code | Language | Direction | Who translates |
|---|---|---|---|
| `ar` | Arabic (primary, default) | RTL | Written with the code; reviewed by the owner |
| `en` | English | LTR | Written with the code |
| `ckb` | Kurdish Sorani | RTL | **Owner approves every string** |
| `bdn` | Kurdish Badini (Arabic script) | RTL | **Owner approves every string** |

## Kurdish workflow (agreed with the owner)
1. When new customer-facing text is added, its Sorani and Badini **suggestions** are added to
   [`KURDISH_REVIEW.md`](./KURDISH_REVIEW.md) with status `PENDING`. Suggestions are **never** shipped.
2. The owner replies per row: **approve**, or gives the correct wording.
3. Only then is the text copied into `src/i18n/messages/ckb.json` / `bdn.json` and the row marked `APPROVED`.
4. Until a key is approved, the Kurdish site shows the **Arabic** text for it (never a guess).

`pnpm i18n:check` reports how many keys are approved/pending per Kurdish dialect and fails CI if
English and Arabic drift apart.

## No text in another language (owner rule)
After switching language, nothing stays in the previous language:
- every site text has approved Sorani and Badini (`pnpm i18n:check` shows 100%);
- texts the owner writes in Admin (design, package and occasion names, field labels, contact details) must
  be filled in all four languages, or left empty in all four; policies can only be published with all four;
- the Admin dashboard lists anything still missing Kurdish;
- prices and dates follow the language (Kurdish writes «دینار»; Badini uses its own month names);
- `e2e/languages.spec.ts` fails if a storefront page shows text from another language.

## Admin panel
The admin panel is **Arabic and English only**. It is used by Bahja staff, not customers, so it
doesn't create Kurdish translation work. `admin.*` keys are excluded from the Kurdish review.

## Later
In milestone M10 these strings move into an Admin → Translations screen, so the owner can edit
them without a developer. The files remain the defaults.
