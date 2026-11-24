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
- **A barista** (owner, 2026-11-23): a person named `BARISTA` (the skeleton of «People» below) standing behind the
  counter, facing the customers along his +Z; his places are Empties (`BARISTA_coffee`, where he stands at the machine,
  `BARISTA_cookies` by the cookie pile, and those of «The café's menu» below). With an Empty `HOTSPOT_counter` in front
  of the counter, a visitor there can order from the menu. The visitor holds what they get at the bottom of the screen
  (the cookie in a second hand when they also hold a drink): five sips, five bites (`src/components/tour/props.ts`). See
  `tours/koupup/barista.js` (a cartoon person in the tour's style: owner, 2026-11-23, a photographed face did not suit
  it).
- **Staff going round** (owner, 2026-11-23): a person named `CLEANER` with the barista's joints (`CLEANER_torso`, …) and
  his round, Empties `CLEANER_stop_<n>` (in order, looping; each faces the way he faces there, its extras' `wipe` the
  seconds he wipes a table there, 0 to walk on). Lines between stops must be clear of furniture; he waits for a visitor
  standing in his way (`src/components/tour/staff.ts`).
- **The café's menu** (owner, 2026-11-24): an Empty `MENU` whose extras hold the menu (`menu`: categories, items with
  their prices and how each is made; `photos`: one picture of the items' photos as a data URL) — for KOUP,
  `tours/koupup/menu.json`, from the café's own online menu (re-run its builder when the café changes it). At the
  counter «See the menu» opens it (the café's photos); a drink chosen and «Order», the barista makes it step by step
  (`make`: the shot under the group head, hot water, milk steamed in the pitcher at the wand and poured with its pattern,
  a syrup from its bottle in the rack, milk, soda, water or tea poured, ice scooped, the blender, a slice or mint from
  the tray, a dusting, crumbs or a drizzle), in the café's own cup (espresso, hot, iced: `src/components/tour/drink.ts`).
  He holds out his free hand: the visitor's hand comes up with the exact money in Iraqi dinar notes and puts it in it;
  then it takes the order. The money goes in the till's drawer. The things he picks up are named `PROP_bottle_<key>`,
  `PROP_pitcher`, `PROP_jug`, `PROP_scoop`, `PROP_drawer`; his places `BARISTA_<place>` (`src/components/tour/barista.ts`).
- **The paper menu on the tables**: an Empty `MENU_<n>` on each table (in its item); standing by one, «See the menu»
  reads it (as the café's printed menu); seated, ordering from it brings the waiter: he walks to them along the café's
  walkways, Empties `NAV_<n>` whose extras' `links` list the points reached in a straight, clear line (`NAV_0` is at the
  counter, where orders are picked up), stands by the seat (each `SEAT_<n>`'s extras `stand`, `[x, y, z]`, and `nav`, its
  walkway point), takes the order (a nod), the barista makes it and hands it to him, and he brings it; the visitor pays
  him, and the money goes in his pocket.
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

## People (owner, 2026-11-24: the character and NPC interaction skills)

The staff are skinned bodies on one skeleton (`tours/koupup/people.js`; the bone names are in its header and in
`src/components/tour/character.ts`): an adult man of about 1.80 m, ~7.6 heads; shoulders, elbows, wrists, two-part
fingers and an opposable thumb, hips, knees and ankles bend the skin smoothly. Faces have eyes that turn to look,
lids that blink, brows and a mouth for expression; a café's people keep their own faces (`eyes()` adds the parts).

Each frame a person is posed by layers in a fixed order (`Character.update`): rest pose → the walk (the gait advances
with the distance actually walked, so the feet keep pace with the floor; knees lift the swinging foot; heel strike and
push-off) → bending and crouching → looking (head, then eyes) → each arm's two-bone IK toward its target (the elbow
bending down and out; weights eased in and out) → the fingers' pose (relaxed, grip, pinch, flat) → blinking and the face.

What they do is a script of steps (`interaction.ts`): walk to a place (turning first, slowing to a stop), step up to
within reach, take (the hand reaches the thing's holding point; it is held only on contact), put down (its base on the
surface), carry (upright, in front), and hand over (held out where both hands can reach; it changes hands when the
receiver's hand is on it; nobody comes, it is put down for them). Every step has a time limit. A held thing stays in the
world and follows its hand's socket each frame, so changing hands never moves it. The visitor's own hands
(`makeFPHand`, the same anatomy) reach, close, carry, set down and pick up the same way, in the camera's space.

`?debug=1` on a tour's link shows each hand's socket (green) and target (red) and keeps the measured error of every
contact in `window.tourContacts` (all within about 1 cm in the checks of 2026-11-24).

The staff walk at a person's pace (the waiter 1.1 m/s going round, 1.3 m/s serving), with longer and quicker steps the
faster they go (`ampFor` in `ik.ts`), and along a whole way at once (`walkPath`): turning as they walk and rounding the
corners, slowing only for a sharp turn and at the end.

## Items and the editor (owner, 2026-11-23)

Every piece of furniture and decor of a tour's model is an **item**: a node `ITEM_<code>` (its extras' `label` says what
it is, e.g. `lounge_chair`) holding that item's meshes, its soft shadow and its invisible block, and its seats
(`SEAT_<n>`, in the item's own space with extras `local: true`, so they go with it). **Codes are permanent**: a rebuilt
café keeps them in `tours/<café>/items.json` (an item is known by its kind and first place; a new item gets the next
number; numbers are never reused). The owner names an item by its code ("move #37 a little left").

**Admin → Tours → the tour → Open the editor** (`/admin/tour-editor/<id>`): the model full screen; click an item to pick
it, drag its arrows to move it (and up and down) or its ring to turn it, or nudge it with the buttons (1 or 10 cm, 1° or
15°); «Show items' codes» puts each item's code over it; «Go to item» walks to one by its code. Saved changes
(`tours.item_edits`, by code: moved by x, y, z in metres, turned by ry in radians; `setTourItemEdits`, audited
`tour.items_edited`) apply when the tour loads, and stay when the model is replaced (the codes stay). For visitors the
items are merged again into a few meshes (`src/components/tour/items.ts`). In the editor the staff stand still and you
walk through walls.

A model made in Blender: name each movable thing `ITEM_<number>` (an Empty holding its parts) to make it editable.

## Cafés rebuilt from a scan

When a café sends a 3D scan, the owner may want it redrawn in the site's animation style rather than shown as scanned
(owner, 2026-11-21: "make it animation style like the other ones … it looks exactly like the place"). The scan is the
measuring tape: its floor plan, wall elevations and eye-level views give every wall, opening, level and piece of
furniture, and the café is rebuilt from code at those positions. Each rebuilt café lives in `tours/<café>/` (the first:
`tours/koupup/`, see its README); `node tours/<café>/export.cjs` builds the `.glb` to upload in Admin → Tours.
