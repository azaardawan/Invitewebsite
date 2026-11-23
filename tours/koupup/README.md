# KOUPUP café: virtual tour model

The owner's 3D scan of the café (`21_11_2026.glb`, 2026-11-21) rebuilt in the site's animation style, to scale: every
wall, opening, level, step and piece of furniture stands where the scan has it, in the scan's own coordinates (metres,
Y up). The scan itself is the café's and is not kept in the repository.

- `build.js`: the building (floors, walls, the glass front and its door, ceilings with their LED coves, the terrace and
  its roof, both staircases, the street, the sky) and the signs (KOUPUP, the KOUP pillar, کوپ).
- `rooms.js`: where everything stands, room by room (north lounge, middle room, bar, toilets, terrace).
- `furniture.js`: the furniture kit (lounge chairs, armchairs, sofas, live-edge table, round chairs, plants, shelves…).
- `barista.js`: the barista (owner, 2026-11-23) behind the counter in the KOUP T-shirt, a cartoon person in the
  café's style (not a photographed face); the shirt's prints are the owner's photos (`models/shirt_front.jpg`, `shirt_back.jpg`); his
  places (the machine, the cookie pile on the back counter). Every chair is a seat and every table a place to put a
  coffee down (`seat()`, `tableTop()` in `lib.js`; `SEAT_<n>` nodes in the model).
- The second member of staff (`cleaner()` in `barista.js`): the same shirt in olive green (`models/shirt_*_olive.jpg`),
  going round the main floor with a cloth and wiping the tables (his round: `CLEANER_stop_<n>`).
- `lib.js`: shapes, textures and materials. Every piece of furniture gets an invisible block (`COLLIDER_…`) so visitors
  walk round it; leaves, rugs and shadows are `NOCOLLIDE_…`; visitors start at `START` (the foot of the north stairs).

Build: `node tours/koupup/export.cjs` → `tours/koupup/out/koupup.glb` (about 6.5 MB), then upload it in Admin → Tours.
Measured levels (scan coordinates): inside floor −1.24, terrace −1.45, inside ceiling 1.90 (LED cove at 1.62),
terrace roof 1.65, bar 1.55, toilets 1.20; the street falls from −2.5 (north) to −3.15 (south).
