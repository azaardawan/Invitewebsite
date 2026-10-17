# Laurel & Bloom — Graduation

A new graduation design combining the three supplied SVGs: soft grey paper, deep green typography, botanical engraving, ivory flowers, and the graduation-cap illustration.

## Preview

Open `index.html` in a browser. No installation or network connection is required. Tap anywhere on the opening poster: its paper panels unfold around the same live text, while the rest of the invitation expands below it. The sequence completes in 2.2 seconds; reduced motion opens immediately.

Use the preview controls for English or Arabic, package selection, the graduate’s name and achievement, class year, date, time, venue, dress code, map link, message and two photographs. Date/time values use Asia/Baghdad. All initial event information is illustrative.

The poster, website and print-card preview share the same details. The website contains a portrait, countdown, celebration details, reply form and closing design. Normal hides RSVP; VIP includes attendance; VVIP adds optional guest messages.

Uploaded photographs and replies only exist in the current browser session. They are not transmitted or retained after reload. The reply form is a local preview, not a connected RSVP service.

## Edit and build

- `source/tools.html` and `source/tools.css`: preview controls.
- `source/preview.html`: poster, website sections and print-card layout.
- `source/theme.css`: colour palette, responsive layout, typography and transitions.
- `source/theme.js`: personalization, language, opening, countdown and local RSVP behavior.
- `assets/`: optimized artwork, editable extracted SVGs, and fonts.
- `originals/`: the three untouched uploaded SVG files.
- `asset-manifest.json`: source layers and extraction details.
- `VALIDATION.json`: checks performed and remaining verification limits.

After editing, run `python3 build.py` to rebuild the self-contained `index.html`. The builder uses only Python’s standard library. Upload this folder to GitHub as a new theme project; keep the older wedding-theme folders intact.

The `checks/verify.cjs` interaction checks can be reproduced with Node.js after `npm install --prefix checks --ignore-scripts --no-audit --no-fund jsdom@26.1.0`, then `node checks/verify.cjs`.

## Integration with the invitation platform

This is an editable design preview and source package. It has not been installed in the Railway site or converted into the platform’s production React theme folder. The existing theme SDK and repository were not supplied for this change.

Use the included `reference-guidelines/THEME_CONTRACT.md` when integrating it. Create a new versioned theme rather than changing an activated wedding theme. Port the scoped styles to CSS Modules and the markup to React, then bind the live poster and print card to `ThemeProps`/`PrintCardProps` and localized `labels`. Replace the local form with `GuestFormSlot`, use `useCountdown`, `useReducedMotion`, and call `useMusic().start()` from the opening tap. Render only fields and features supplied by the package. Preserve private/public guestbook behavior from the SDK.

Keep the poster and website hero mounted throughout opening. Do not replace the invitation DOM at the end of the animation. Finish within four seconds, and immediately when reduced motion is requested. Keep the full-poster button’s accessible open label even though no extra instruction is printed underneath it.

The print card here is a visual companion. Production bleed, crop, QR placement and PDF generation should be supplied through the platform’s print companion contract.

## Verification

Thirteen DOM checks passed, covering initial state, opening completion, cancellation, keyboard focus, reduced motion, EN/AR personalization, date/map handling, package gates, local RSVP validation, escaped guest messages and photograph uploads. JavaScript syntax, element IDs, image dimensions, original-file hashes and archive integrity were also checked.

Deep green on grey has a 9.29:1 contrast ratio; green on ivory and ivory on green have 10.13:1. Source artwork was rendered and inspected. Full browser layout and animation rendering could not be verified with the supported browser preview capability in this session. Review the preview at 320, 390, 430 and desktop widths before production integration, especially with long names and Arabic text.
