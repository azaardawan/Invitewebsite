# Invite renderer

Renders the opening "Save the Date" animation (11.5 s, 9:16, 30 fps) as an MP4 with headless
Blender. It runs as its own Railway service (`invite-renderer`, root directory `/renderer`),
separate from the website.

| File | Purpose |
|---|---|
| `build_template.py` | Builds `master_template.blend` (runs during the Docker build) |
| `render_invite.py` | Personalises the template and renders the MP4 (`blender -b … -P render_invite.py -- …`) |
| `server.py` | FastAPI: job queue, progress, downloads |
| `wreath.svg`, `divider.svg`, `venue.svg` | Gold ornaments |
| `shape_text.py` | Arabic and Kurdish names and initials: shaped with HarfBuzz in Amiri and merged into one outline, which Blender presses into the card in place of the text (Blender can't join Arabic letters) |
| `CormorantGaramond-*.ttf` | Lettering (SIL Open Font License, see `OFL-cormorant-garamond.txt`) |
| `Amiri-Regular.ttf` | Arabic lettering (SIL Open Font License, see `OFL-amiri.txt`) |

## API

All endpoints except `/health` need the header `X-API-Key: $RENDER_API_KEY`.

```
POST /jobs            {"initials": "R | H", "names": "Rami & Hiba", "date": "17.07.2027", "venue": "venue.svg"}
                      -> 202 {"id": "...", "status": "queued", ...}   (200 if an identical job already exists)
GET  /jobs/{id}       -> {"status": "queued|rendering|done|failed", "progress": 0.42, "queue_position": 1, ...}
GET  /jobs/{id}/video -> video/mp4 (once status is "done"; kept for RESULT_TTL seconds, default 1 h)
POST /render          -> waits and returns video/mp4 directly (only for short test renders)
GET  /health
```

**Sound.** Every video has the sewing-machine sound (`make_needle_sound.py`, built into the
image as `needle.wav`): needle ticks, the hook and the motor, which stops cleanly with the stitching.
Optional music plays under it (`audio_mix.py`): `"music": "song.mp3"` for a file in `music/`,
or `"music_url"` for a link on a host listed in `MUSIC_URL_HOSTS`. Whatever the song's own
loudness, it is set 7 LU under the needle and ducked while the needle sews (measured: the
needle stays 11+ LU above the music throughout the stitching).

Poll `GET /jobs/{id}` every 10–20 s. A full render takes roughly 20 minutes per 4 vCPUs at
720×1280. The service sleeps when idle (Railway serverless), so the first request after a quiet
period takes a few extra seconds while it wakes up. Videos live in the container only: download
them (or copy them to the site's storage) when the job is done.

From the website service, call it over the private network:
`http://invite-renderer.railway.internal:8000`.

**The website** (designs with manifest `film`, e.g. Golden Stitch) asks for each couple's film after payment and
again when the names or date change, and collects it when done (`src/server/film/film.ts`, every minute). Names in
Arabic letters get "و" between them and the monogram reads right to left.

## Settings (Railway variables)

| Variable | Default | |
|---|---|---|
| `RENDER_API_KEY` | – | Required header value for the API |
| `RENDER_RES` | `720x1280` | Output size |
| `RENDER_SAMPLES` | `1` | EEVEE samples per frame |
| `RENDER_TIMEOUT` | `2700` | Seconds before a render is stopped |
| `MAX_CONCURRENT_RENDERS` | `1` | Each render already uses every CPU core |
| `MAX_QUEUED_JOBS` | `20` | More waiting jobs get 429 |
| `RESULT_TTL` | `3600` | Seconds a finished video stays downloadable |
| `RENDER_FRAMES` | – | e.g. `1-30` for quick tests |

## Local run

```bash
docker build -t invite-renderer renderer
docker run --rm -p 8000:8000 -e RENDER_API_KEY=dev invite-renderer
```
