# KOUP — the demo (owner, 2026-11-25)

"Demo first, nothing replaced until I approve." This folder holds the demo of the next KOUP tour. KOUP's live tour
keeps its own model (`tours/koupup/koupup.glb`) and behaves exactly as before. What the demo shows is switched on by
the demo model itself: a node `TOUR_FEATURES` whose extras name the features. A tour whose model has no such node
(every live tour) gets none of them.

## Part 2 — hands that fit what they hold (`fitGrip`)

`node tours/koupup-v2/make-demo.cjs` copies the live model and adds `TOUR_FEATURES { fitGrip: true }`, giving
`tours/koupup-v2/koupup-v2.glb` (14.4 MB, the same café).

With it, every hand (the barista's, the waiter's and the visitor's own) holds each thing by its own grip shape
(`src/components/tour/grip.ts`):

- **Cups, bottles, jars, the milk carton, the pitcher, the blender's jug:** the thing sits in the palm by its size, so
  the palm touches its side. Each finger and the thumb close only until they are 3 mm from it. For wide things the
  thumb opens out first.
- **Cookie, notes, a lime slice:** pinched between the thumb and fingers, as they were taken.
- **The ice scoop:** keeps its old grip.

`?debug=1` on the tour's link measures, every frame, each finger's least distance to what its hand holds, by person,
thing and moment. The results are in `window.tourFingers`; negative numbers mean a finger is inside the thing.

### Trying it

1. Admin → Tours → **Add a tour**. Give it a test name (e.g. "KOUP demo"), tick **Private link**, and save. Do not use
   KOUP's own tour.
2. On the new tour's page, upload `tours/koupup-v2/koupup-v2.glb` as its model, then turn the tour on.
3. Open the private link from Admin, on a phone held sideways and on a computer. Add `?debug=1` to the link to see the
   sockets and the measurements.

### Once approved

The fitted grips become the normal behaviour: the switch (`setFitGrip`, `fitGripOn`) and this demo copy are removed,
and KOUP's live model needs no new upload for this part (it is code only).
