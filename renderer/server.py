"""
server.py - HTTP front end for the headless Blender invite renderer.

Recommended (asynchronous) flow - a render takes minutes, so nothing waits on one request:
    POST /jobs              body {"initials", "names", "date", "venue", "music"?, "music_url"?}
                            -> 202 {"id", "status", ...}
    GET  /jobs/{id}         -> {"status": "queued|rendering|done|failed", "progress": 0..1, ...}
    GET  /jobs/{id}/video   -> video/mp4 once status is "done"

Also available:
    GET  /health            -> {"status": "ok", ...}   (no API key needed)
    POST /render            -> waits for the render and returns video/mp4 directly
                               (fine for short test renders; long ones may hit proxy timeouts)

Identical requests share one render: a finished or running job with the same inputs is reused.

Every video gets the sewing-machine sound. Optional music plays well below it:
    "music": "song.mp3"           a file in APP_DIR/music/ (mp3, m4a, aac, wav, ogg, flac)
    "music_url": "https://..."    downloaded first; only hosts listed in MUSIC_URL_HOSTS

Environment (all optional):
    APP_DIR                 folder with the template, script and assets (default /app)
    BLENDER_BIN             Blender executable (default "blender" on PATH)
    BLENDER_EXTRA_ARGS      extra Blender CLI args (default "--gpu-backend opengl")
    USE_XVFB                1 = run Blender inside xvfb-run for EEVEE's OpenGL context (default 1)
    RENDER_TIMEOUT          seconds before one render is killed (default 2700)
    MAX_CONCURRENT_RENDERS  renders running at once (default 1; each one uses every CPU core)
    MAX_QUEUED_JOBS         jobs allowed to wait; more get 429 (default 20)
    RESULT_TTL              seconds a finished video is kept for download (default 3600)
    KEEP_AWAKE_AFTER_DONE   seconds to keep the service awake after the last render (default 900)
    HEARTBEAT_URL           URL fetched every minute while working, so a sleeping-enabled
                            (serverless) Railway service is not put to sleep mid-render
    RENDER_API_KEY          if set, every endpoint except /health needs "X-API-Key: <value>"
    MUSIC_URL_HOSTS         comma-separated hosts "music_url" may download from (default: none)
    MAX_MUSIC_MB            largest music download accepted (default 40)
    RENDER_RES / RENDER_SAMPLES / RENDER_FRAMES are passed through to render_invite.py
"""

import asyncio
import collections
import hashlib
import json
import logging
import os
import re
import secrets
import shlex
import shutil
import signal
import tempfile
import time
import urllib.request
import uuid
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Dict, Optional, Tuple

from fastapi import Depends, FastAPI, Header, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, Field, field_validator

APP_DIR = Path(os.environ.get("APP_DIR", "/app"))
TEMPLATE = APP_DIR / "master_template.blend"
SCRIPT = APP_DIR / "render_invite.py"
BLENDER_BIN = os.environ.get("BLENDER_BIN", "blender")
BLENDER_EXTRA_ARGS = shlex.split(os.environ.get("BLENDER_EXTRA_ARGS", "--gpu-backend opengl"))
USE_XVFB = os.environ.get("USE_XVFB", "1") not in ("0", "false", "False", "")
RENDER_TIMEOUT = int(os.environ.get("RENDER_TIMEOUT", "2700"))
MAX_CONCURRENT = max(1, int(os.environ.get("MAX_CONCURRENT_RENDERS", "1")))
MAX_QUEUED = max(1, int(os.environ.get("MAX_QUEUED_JOBS", "20")))
RESULT_TTL = int(os.environ.get("RESULT_TTL", "3600"))
KEEP_AWAKE_AFTER_DONE = int(os.environ.get("KEEP_AWAKE_AFTER_DONE", "900"))
API_KEY = os.environ.get("RENDER_API_KEY", "")
MUSIC_DIR = APP_DIR / "music"
MUSIC_URL_HOSTS = {h.strip().lower() for h in os.environ.get("MUSIC_URL_HOSTS", "").split(",") if h.strip()}
MAX_MUSIC_BYTES = int(float(os.environ.get("MAX_MUSIC_MB", "40")) * 1024 * 1024)
MUSIC_EXTENSIONS = (".mp3", ".m4a", ".aac", ".wav", ".ogg", ".flac")
WORK_ROOT = Path(tempfile.gettempdir()) / "invite-renders"


def _default_heartbeat() -> str:
    if os.environ.get("HEARTBEAT_URL"):
        return os.environ["HEARTBEAT_URL"]
    if os.environ.get("RAILWAY_PUBLIC_DOMAIN"):
        return f"https://{os.environ['RAILWAY_PUBLIC_DOMAIN']}/health"
    return "https://1.1.1.1/cdn-cgi/trace"


HEARTBEAT_URL = _default_heartbeat()

log = logging.getLogger("invite-renderer")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

_CONTROL = re.compile(r"[\x00-\x1f\x7f]")
_VENUE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_.-]{0,80}\.svg$")
_MUSIC = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_. -]{0,100}\.(mp3|m4a|aac|wav|ogg|flac)$", re.I)
_PROGRESS = re.compile(r"^\[progress\] (\d+) (\d+)")


# --------------------------------------------------------------------------------------
# Request model
# --------------------------------------------------------------------------------------
class RenderRequest(BaseModel):
    initials: str = Field(..., min_length=1, max_length=20, examples=["Y | M"])
    names: str = Field(..., min_length=1, max_length=80, examples=["Yuval & Mevorah"])
    date: str = Field(..., min_length=1, max_length=24, examples=["01.06.2027"])
    venue: str = Field("venue.svg", examples=["venue.svg"])
    music: Optional[str] = Field(None, examples=["song.mp3"])
    music_url: Optional[str] = Field(None, examples=["https://media.example.com/music/song.mp3"])

    @field_validator("initials", "names", "date")
    @classmethod
    def _clean_text(cls, v: str) -> str:
        v = " ".join(v.split())
        if not v or _CONTROL.search(v):
            raise ValueError("must be non-empty text without control characters")
        return v

    @field_validator("venue")
    @classmethod
    def _check_venue(cls, v: str) -> str:
        v = (v or "venue.svg").strip()
        if not _VENUE.fullmatch(v):
            raise ValueError("must be a plain .svg file name such as 'venue.svg'")
        if not (APP_DIR / v).is_file():
            raise ValueError(f"'{v}' does not exist in {APP_DIR}")
        return v

    @field_validator("music")
    @classmethod
    def _check_music(cls, v: Optional[str]) -> Optional[str]:
        v = (v or "").strip()
        if not v:
            return None
        if not _MUSIC.fullmatch(v):
            raise ValueError("must be a plain audio file name such as 'song.mp3'")
        if not (MUSIC_DIR / v).is_file():
            raise ValueError(f"'{v}' is not in the renderer's music folder")
        return v

    @field_validator("music_url")
    @classmethod
    def _check_music_url(cls, v: Optional[str]) -> Optional[str]:
        v = (v or "").strip()
        if not v:
            return None
        from urllib.parse import urlparse
        u = urlparse(v)
        if u.scheme != "https" or not u.hostname:
            raise ValueError("must be an https:// link")
        if u.hostname.lower() not in MUSIC_URL_HOSTS:
            raise ValueError("music links are only accepted from the hosts in MUSIC_URL_HOSTS")
        return v

    def cache_key(self) -> str:
        settings = {k: os.environ.get(k, "") for k in ("RENDER_RES", "RENDER_SAMPLES", "RENDER_FRAMES")}
        raw = json.dumps([self.model_dump(), settings], sort_keys=True)
        return hashlib.sha256(raw.encode()).hexdigest()


# --------------------------------------------------------------------------------------
# Jobs
# --------------------------------------------------------------------------------------
class Job:
    def __init__(self, req: RenderRequest):
        self.id = uuid.uuid4().hex
        self.req = req
        self.key = req.cache_key()
        self.status = "queued"            # queued | rendering | done | failed
        self.created = time.time()
        self.started: Optional[float] = None
        self.finished: Optional[float] = None
        self.frames_done = 0
        self.frames_total = 0
        self.error: Optional[dict] = None
        self.work = Path(tempfile.mkdtemp(prefix="job-", dir=WORK_ROOT))
        self.video = self.work / "invite.mp4"
        self.music_path: Optional[Path] = (MUSIC_DIR / req.music) if req.music else None
        self.done_event = asyncio.Event()

    def public(self) -> dict:
        body = {
            "id": self.id,
            "status": self.status,
            "progress": round(self.frames_done / self.frames_total, 3) if self.frames_total else 0.0,
            "frames_done": self.frames_done,
            "frames_total": self.frames_total,
            "created_at": int(self.created),
            "status_url": f"/jobs/{self.id}",
            "request": self.req.model_dump(),
        }
        if self.status == "queued":
            body["queue_position"] = queue_position(self)
        if self.started:
            body["render_seconds"] = round((self.finished or time.time()) - self.started, 1)
        if self.status == "done":
            body["video_url"] = f"/jobs/{self.id}/video"
            body["expires_at"] = int(self.finished + RESULT_TTL)
        if self.error:
            body["error"] = self.error
        return body


JOBS: Dict[str, Job] = {}
BY_KEY: Dict[str, Job] = {}
QUEUE: "asyncio.Queue[Job]" = None  # created in lifespan (needs the running loop)
_last_activity = time.time()


def queue_position(job: Job) -> int:
    waiting = sorted((j for j in JOBS.values() if j.status == "queued"), key=lambda j: j.created)
    return next((i + 1 for i, j in enumerate(waiting) if j is job), 0)


def busy() -> bool:
    return any(j.status in ("queued", "rendering") for j in JOBS.values())


def discard(job: Job) -> None:
    JOBS.pop(job.id, None)
    if BY_KEY.get(job.key) is job:
        BY_KEY.pop(job.key, None)
    shutil.rmtree(job.work, ignore_errors=True)


def blender_path() -> Optional[str]:
    return shutil.which(BLENDER_BIN) or (BLENDER_BIN if os.access(BLENDER_BIN, os.X_OK) else None)


def build_command(job: Job) -> list:
    req = job.req
    cmd = []
    if USE_XVFB and shutil.which("xvfb-run"):
        cmd += ["xvfb-run", "-a", "-s", "-screen 0 1280x1024x24"]
    cmd += [blender_path(), "-b", str(TEMPLATE), *BLENDER_EXTRA_ARGS,
            "--python-exit-code", "1", "-P", str(SCRIPT), "--",
            # "--flag=value" keeps values that start with "-" from being read as flags
            f"--initials={req.initials}", f"--names={req.names}", f"--date={req.date}",
            f"--venue={req.venue}", f"--out={job.video}"]
    if job.music_path:
        cmd.append(f"--music={job.music_path}")
    return cmd


def download_music(url: str, dest_dir: Path) -> Path:
    """Fetch a music file from an allowed host (size-limited)."""
    from urllib.parse import urlparse
    ext = os.path.splitext(urlparse(url).path)[1].lower()
    path = dest_dir / ("music" + (ext if ext in MUSIC_EXTENSIONS else ".mp3"))
    req = urllib.request.Request(url, headers={"User-Agent": "invite-renderer"})
    with urllib.request.urlopen(req, timeout=30) as r, open(path, "wb") as f:
        if urlparse(r.geturl()).hostname.lower() not in MUSIC_URL_HOSTS:
            raise RuntimeError("the music link redirected to a host that is not allowed")
        total = 0
        while True:
            chunk = r.read(1 << 16)
            if not chunk:
                break
            total += len(chunk)
            if total > MAX_MUSIC_BYTES:
                raise RuntimeError(f"the music file is larger than {MAX_MUSIC_BYTES // (1024 * 1024)} MB")
            f.write(chunk)
    if total == 0:
        raise RuntimeError("the music link returned an empty file")
    return path


def log_tail(lines, limit: int = 4000) -> str:
    noise = re.compile(r"^(Fra:\d+|Append frame|\[progress\]|\s*$)")
    return "\n".join(ln for ln in lines if not noise.match(ln))[-limit:]


async def run_simple(cmd: list, timeout: float, cwd: Path) -> int:
    proc = await asyncio.create_subprocess_exec(*cmd, cwd=str(cwd), start_new_session=True,
                                                stdout=asyncio.subprocess.DEVNULL,
                                                stderr=asyncio.subprocess.DEVNULL)
    try:
        return await asyncio.wait_for(proc.wait(), timeout)
    except asyncio.TimeoutError:
        os.killpg(proc.pid, signal.SIGKILL)
        await proc.wait()
        return -1


async def faststart(path: Path, work: Path) -> None:
    """Move the MP4 index to the front so browsers can start playing before it fully loads."""
    if not shutil.which("ffmpeg"):
        return
    tmp = work / "faststart.mp4"
    code = await run_simple(["ffmpeg", "-v", "error", "-y", "-i", str(path), "-c", "copy",
                             "-movflags", "+faststart", str(tmp)], 120, work)
    if code == 0 and tmp.is_file() and tmp.stat().st_size > 0:
        tmp.replace(path)
    else:
        tmp.unlink(missing_ok=True)


async def render_job(job: Job) -> None:
    global _last_activity
    job.status, job.started = "rendering", time.time()
    log.info("job %s rendering: %s", job.id, job.req.model_dump())
    if job.req.music_url:
        try:
            job.music_path = await asyncio.to_thread(download_music, job.req.music_url, job.work)
        except Exception as exc:
            job.error = {"message": f"Could not download the music: {exc}"}
            job.status, job.finished = "failed", time.time()
            job.done_event.set()
            return
    tail = collections.deque(maxlen=400)
    proc = await asyncio.create_subprocess_exec(
        *build_command(job), cwd=str(job.work), start_new_session=True,
        stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.STDOUT,
        env={**os.environ, "ASSET_DIR": str(APP_DIR)})

    async def pump():
        async for raw in proc.stdout:
            line = raw.decode("utf-8", "replace").rstrip()
            m = _PROGRESS.match(line)
            if m:
                job.frames_done, job.frames_total = int(m.group(1)), int(m.group(2))
            else:
                tail.append(line)
        return await proc.wait()

    timed_out = False
    try:
        code = await asyncio.wait_for(pump(), timeout=RENDER_TIMEOUT)
    except asyncio.TimeoutError:
        timed_out, code = True, None
    finally:
        if proc.returncode is None:
            try:
                os.killpg(proc.pid, signal.SIGKILL)
            except ProcessLookupError:
                pass
            await proc.wait()

    elapsed = round(time.time() - job.started, 1)
    if timed_out:
        job.error = {"message": f"Rendering took longer than {RENDER_TIMEOUT} s and was stopped",
                     "hint": "Lower RENDER_RES or RENDER_SAMPLES, or give the service more CPU."}
    elif code != 0 or not job.video.is_file() or job.video.stat().st_size == 0:
        job.error = {"message": "Blender failed to render the invite", "exit_code": code,
                     "log_tail": log_tail(tail)}
    if job.error:
        job.status = "failed"
        log.error("job %s failed after %ss: %s\n%s", job.id, elapsed, job.error["message"],
                  job.error.get("log_tail", "")[-2000:])
    else:
        await faststart(job.video, job.work)
        job.status = "done"
        log.info("job %s done in %ss (%.1f MB)", job.id, elapsed, job.video.stat().st_size / 1e6)
    job.finished = time.time()
    _last_activity = job.finished
    job.done_event.set()


async def worker(n: int) -> None:
    while True:
        job = await QUEUE.get()
        try:
            if job.id in JOBS:                 # skip jobs that expired while waiting
                await render_job(job)
        except Exception as exc:  # never let one job kill the worker
            log.exception("job %s crashed", job.id)
            job.status, job.error, job.finished = "failed", {"message": str(exc)}, time.time()
            job.done_event.set()
        finally:
            QUEUE.task_done()


def _ping(url: str) -> None:
    try:
        with urllib.request.urlopen(urllib.request.Request(url, method="GET"), timeout=10) as r:
            r.read(256)
    except Exception as exc:
        log.debug("heartbeat failed: %s", exc)


async def housekeeping() -> None:
    """Expire old results and keep a serverless service awake while there is work."""
    while True:
        await asyncio.sleep(60)
        now = time.time()
        for job in list(JOBS.values()):
            if job.status in ("done", "failed") and job.finished and now - job.finished > RESULT_TTL:
                discard(job)
        if busy() or now - _last_activity < KEEP_AWAKE_AFTER_DONE:
            await asyncio.to_thread(_ping, HEARTBEAT_URL)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    global QUEUE
    shutil.rmtree(WORK_ROOT, ignore_errors=True)        # nothing survives a restart anyway
    WORK_ROOT.mkdir(parents=True, exist_ok=True)
    QUEUE = asyncio.Queue()
    tasks = [asyncio.create_task(worker(i)) for i in range(MAX_CONCURRENT)]
    tasks.append(asyncio.create_task(housekeeping()))
    log.info("blender=%s template=%s xvfb=%s workers=%s heartbeat=%s", blender_path(),
             TEMPLATE.is_file(), USE_XVFB and bool(shutil.which("xvfb-run")), MAX_CONCURRENT,
             HEARTBEAT_URL)
    yield
    for t in tasks:
        t.cancel()


app = FastAPI(title="Bahja invite renderer", version="2.0.0", lifespan=lifespan)


def error(status: int, message: str, headers: Optional[dict] = None, **extra) -> JSONResponse:
    return JSONResponse(status_code=status, content={"error": message, **extra}, headers=headers)


class ApiError(Exception):
    def __init__(self, status: int, message: str, **extra):
        self.status, self.message, self.extra = status, message, extra


@app.exception_handler(ApiError)
async def _api_error(_request: Request, exc: ApiError):
    headers = {"Retry-After": "60"} if exc.status == 429 else None
    return error(exc.status, exc.message, headers=headers, **exc.extra)


@app.exception_handler(RequestValidationError)
async def _validation_error(_request: Request, exc: RequestValidationError):
    problems = [{"field": ".".join(str(p) for p in e["loc"][1:]) or "body", "message": e["msg"]}
                for e in exc.errors()]
    return error(422, "Invalid request body", problems=problems)


def require_key(x_api_key: Optional[str] = Header(default=None)) -> None:
    if API_KEY and not secrets.compare_digest(x_api_key or "", API_KEY):
        raise ApiError(401, "Missing or wrong X-API-Key header")


def submit(req: RenderRequest) -> Tuple[Job, bool]:
    """Return (job, created). Reuses a running or finished job with the same inputs."""
    if blender_path() is None:
        raise ApiError(500, f"Blender executable '{BLENDER_BIN}' was not found")
    missing = [p.name for p in (TEMPLATE, SCRIPT) if not p.is_file()]
    if missing:
        raise ApiError(500, "Renderer files are missing from the image", missing_files=missing)
    existing = BY_KEY.get(req.cache_key())
    if existing and existing.id in JOBS and existing.status != "failed" and \
            (existing.status != "done" or existing.video.is_file()):
        return existing, False
    if sum(1 for j in JOBS.values() if j.status == "queued") >= MAX_QUEUED:
        raise ApiError(429, "Too many invites are waiting to render. Try again in a few minutes.")
    job = Job(req)
    JOBS[job.id] = job
    BY_KEY[job.key] = job
    QUEUE.put_nowait(job)
    return job, True


# --------------------------------------------------------------------------------------
# Routes
# --------------------------------------------------------------------------------------
@app.get("/health")
async def health():
    missing = [p.name for p in (TEMPLATE, SCRIPT) if not p.is_file()]
    ok = blender_path() is not None and not missing
    counts = collections.Counter(j.status for j in JOBS.values())
    return JSONResponse(status_code=200 if ok else 503, content={
        "status": "ok" if ok else "degraded",
        "blender": blender_path(),
        "missing_files": missing,
        "jobs": dict(counts),
        "max_concurrent_renders": MAX_CONCURRENT,
        "render_res": os.environ.get("RENDER_RES", "720x1280"),
    })


@app.post("/jobs", status_code=202, dependencies=[Depends(require_key)])
async def create_job(req: RenderRequest):
    job, created = submit(req)
    return JSONResponse(status_code=202 if created else 200, content=job.public())


@app.get("/jobs/{job_id}", dependencies=[Depends(require_key)])
async def get_job(job_id: str):
    job = JOBS.get(job_id)
    if not job:
        raise ApiError(404, "No such job (finished videos are kept for a limited time)")
    return job.public()


@app.get("/jobs/{job_id}/video", dependencies=[Depends(require_key)],
         responses={200: {"content": {"video/mp4": {}}}})
async def get_video(job_id: str):
    job = JOBS.get(job_id)
    if not job:
        raise ApiError(404, "No such job (finished videos are kept for a limited time)")
    if job.status != "done" or not job.video.is_file():
        raise ApiError(409, f"The video is not ready (status: {job.status})", job=job.public())
    return FileResponse(job.video, media_type="video/mp4", filename="invite.mp4",
                        headers={"Cache-Control": "private, max-age=3600"})


@app.post("/render", dependencies=[Depends(require_key)],
          responses={200: {"content": {"video/mp4": {}}}})
async def render_sync(req: RenderRequest):
    job, _ = submit(req)
    if job.status not in ("done", "failed"):
        await job.done_event.wait()
    if job.status == "failed":
        err = dict(job.error or {})
        status = 504 if "longer than" in err.get("message", "") else 500
        raise ApiError(status, err.pop("message", "Rendering failed"), job_id=job.id, **err)
    return FileResponse(job.video, media_type="video/mp4", filename="invite.mp4",
                        headers={"X-Job-Id": job.id, "Cache-Control": "no-store"})
