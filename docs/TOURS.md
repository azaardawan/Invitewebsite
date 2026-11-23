# Virtual tours (cafés)

Owner, 2026-11-21: the owner makes a 3D model of a café; the café puts the tour's link in its Instagram bio, and
visitors walk through the place on Bahja. Sold as a subscription (paid outside the site): each tour has an end date.

- **Admin → Tours** (`/admin/tours`, permission `tours.manage`): add a café (its name and link name), upload its model,
  its logo, its buttons' links (Instagram, location, menu, WhatsApp number) and the subscription's end date, then turn
  it on. The list shows each tour's link (with a copy button), whether it shows, its visits and when it ends.
- **The link**: `https://<site>/tour/<link-name>`. It shows while the tour is on, has its model, and its end date
  (the end of that day, Baghdad time) has not passed; otherwise a calm page says it is closed or has ended. Unknown
  names are a 404 (misses rate-limited). Every opening counts a visit.
- **Private link** (owner, 2026-11-21): tick "Private link" when adding a tour (or "Make the link private" on its page)
  and its address becomes `/tour/<link-name>-<16-letter code>`; the bare `/tour/<link-name>` opens nothing. "New
  private link" makes a new code and ends the old link at once; "Make the link public" goes back. The code is a secret:
  the audit log records only whether a tour is private, and the tour pages send no referrer to the sites their buttons
  open.
- **The page**: full screen; the café's logo and name at the top, its buttons at the bottom (only those with a link),
  and a small "Virtual tour by Bahja". Visitors walk with the arrow keys / W A S D or the round pad on a phone, and
  drag to look around. Its language follows the visitor's browser (Arabic when it is none of the site's).
- Code: `src/server/tours/*` (service, audited), `src/app/admin/(shell)/(panel)/tours`, the upload route
  `src/app/admin/api/tours/[id]/model`, the page `src/app/tour/[slug]`, the walk `src/components/tour/*`.
  Models are stored as `tours/<uuid>.glb` (a `MODEL` asset) and always served by the site itself (`/media/`), since
  WebGL needs same-site files. The tour pages' CSP also allows `blob:` (the model's own pictures) and WebAssembly
  (meshopt decoding).

## Making a model

- **Format**: one binary glTF file (`.glb`), at most **80 MB** (phones download it on mobile data: aim for 10–30 MB).
  Blender: File → Export → glTF 2.0, format "glTF Binary".
- **Units and axes**: metres, Y up (Blender's export does this). Doors ~2.1 m, ceilings ~3 m.
- **Where visitors begin**: an Empty named `START` (or `SPAWN`) standing on the floor; visitors look along its −Z
  (in Blender, the Empty's −Y before export: point a "Single Arrow" Empty's arrow the way to look, or check in the
  preview). Without one, visitors start at the open spot nearest the middle of the lowest floor.
- **Floors and stairs**: visitors follow any floor below them; a step up of at most 45 cm (stairs, a doorstep), never
  off an edge deeper than 70 cm. Ramps work too.
- **Spots**: an Empty named `HOTSPOT_menu` (e.g. in front of the counter): a visitor within 1.8 m is offered a
  "See the menu" button (the tour's Menu link).
- **Seats** (owner, 2026-11-23: "sit down on any chair"): an Empty named `SEAT_<n>` at each seat's sitting spot, at the
  seat's height. Its custom properties (glTF extras): `yaw` (the way a seated visitor faces, radians, as the tour's look:
  0 looks along −Z), `eye` (the eye above the seat, default 0.72 m) and `table` (`[x, y, z]`, the spot on a table in
  reach where their coffee is put down; without one it goes on the floor beside the seat). Within a metre the visitor is
  offered «Sit down»; seated, they look round, put down and pick up what they hold, and «Stand up».
- **A barista** (owner, 2026-11-23): a person named `BARISTA` standing behind the counter, facing the customers along
  his +Z, with joints the page turns: `BARISTA_torso`, `BARISTA_head`, `BARISTA_armL|R` (shoulders),
  `BARISTA_foreL|R` (elbows), `BARISTA_handL|R` (what he holds), `BARISTA_legL|R` (hips); and his places, Empties:
  `BARISTA_coffee` (where he makes coffee, its +Z toward the machine), `BARISTA_cookies` (by the cookie pile),
  `BARISTA_steam` (the machine's steam). With an Empty `HOTSPOT_counter` in front of the counter, a visitor there gets
  «Get a coffee» / «Get a cookie»: he walks to the machine (or the pile), makes it, walks back and hands it over. The
  visitor holds it at the bottom of the screen (the cookie in a second hand when they also hold a coffee): five sips,
  five bites (`src/components/tour/props.ts`). See `tours/koupup/barista.js` (a cartoon person in the
  tour's style: owner, 2026-11-23, a photographed face did not suit it).
- **Staff going round** (owner, 2026-11-23): a person named `CLEANER` with the barista's joints (`CLEANER_torso`, …) and
  his round, Empties `CLEANER_stop_<n>` (in order, looping; each faces the way he faces there, its extras' `wipe` the
  seconds he wipes a table there, 0 to walk on). Lines between stops must be clear of furniture; he waits for a visitor
  standing in his way (`src/components/tour/staff.ts`).
- **Calling the waiter** (owner, 2026-11-23): a seated visitor gets «Call the waiter». He walks to them along the
  café's walkways, Empties `NAV_<n>` whose extras' `links` list the points reached in a straight, clear line (`NAV_0`
  is at the counter, where orders are picked up), stands by the seat (each `SEAT_<n>`'s extras `stand`, `[x, y, z]`, and
  `nav`, its walkway point), takes the order, the barista makes it and hands it to him, and he brings it.
- **Walls**: every mesh stops visitors (between their knees and head). Name a mesh `NOCOLLIDE…` to walk through it
  (leaves, curtains, a light's beam). Name a mesh `COLLIDER…` for an invisible wall (e.g. to keep visitors off a terrace
  edge or behind the counter).
- **Scans** (Polycam, Luma, RealityScan… exported as `.glb`) work as they are: their colours are baked into their photos,
  so the page draws them unlit, exactly as shot. Without a `START`, visitors begin on the level with the most room to
  stand on, near its middle, facing the way with the most room. Holes in a scanned floor stop visitors like an edge.
- **Light**: the page adds soft daylight. Lamps exported from Blender (point and spot lights) are brought down from
  Blender's units automatically. Baked lighting in the textures looks best on phones.
- **Weight**: keep textures at 2K or less, JPEG/WebP inside the glTF; meshopt compression (gltfpack `-cc`) is
  supported, Draco and KTX2 are not.
- Check the result: upload it to a tour that is still off, then open the link from Admin (the "off" page shows to
  visitors until it is turned on, so test with a second, test tour if the café's is already live).

## Cafés rebuilt from a scan

When a café sends a 3D scan, the owner may want it redrawn in the site's animation style rather than shown as scanned
(owner, 2026-11-21: "make it animation style like the other ones … it looks exactly like the place"). The scan is the
measuring tape: its floor plan, wall elevations and eye-level views give every wall, opening, level and piece of
furniture, and the café is rebuilt from code at those positions. Each rebuilt café lives in `tours/<café>/` (the first:
`tours/koupup/`, see its README); `node tours/<café>/export.cjs` builds the `.glb` to upload in Admin → Tours.
