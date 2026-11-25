# Bahja invite renderer: headless Blender (EEVEE on CPU via Mesa llvmpipe + Xvfb) behind FastAPI.
FROM ubuntu:24.04

# master_template.blend is generated below with this same Blender, so versions always match.
ARG BLENDER_VERSION=5.3.0

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONUNBUFFERED=1 \
    PATH=/opt/venv/bin:/opt/blender:$PATH \
    APP_DIR=/app \
    BLENDER_BIN=/opt/blender/blender \
    LIBGL_ALWAYS_SOFTWARE=1 \
    GALLIUM_DRIVER=llvmpipe \
    RENDER_RES=720x1280 \
    RENDER_SAMPLES=1

# System libraries for the official Blender build, software OpenGL, a virtual display,
# FFmpeg (to make the MP4 start playing quickly in browsers) and Python for the API.
RUN apt-get update && apt-get install -y --no-install-recommends \
        ca-certificates curl xz-utils \
        python3 python3-venv \
        xvfb xauth \
        libgl1 libglx-mesa0 libgl1-mesa-dri libegl1 libegl-mesa0 libglu1-mesa \
        libx11-6 libxext6 libxi6 libxxf86vm1 libxfixes3 libxrender1 libxrandr2 \
        libxinerama1 libxcursor1 libxkbcommon0 libxkbcommon-x11-0 libsm6 libice6 \
        libwayland-client0 libwayland-cursor0 libwayland-egl1 libdecor-0-0 \
        libdbus-1-3 libfontconfig1 libfreetype6 \
        ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Official Blender Linux build
RUN set -eux; \
    series="${BLENDER_VERSION%.*}"; \
    curl -fsSL "https://download.blender.org/release/Blender${series}/blender-${BLENDER_VERSION}-linux-x64.tar.xz" \
        -o /tmp/blender.tar.xz; \
    mkdir -p /opt/blender; \
    tar -xJf /tmp/blender.tar.xz -C /opt/blender --strip-components=1; \
    rm /tmp/blender.tar.xz; \
    /opt/blender/blender --version

WORKDIR /app

COPY requirements.txt /app/requirements.txt
RUN python3 -m venv /opt/venv \
    && /opt/venv/bin/pip install --no-cache-dir -r /app/requirements.txt

COPY build_template.py render_invite.py server.py audio_mix.py make_needle_sound.py shape_text.py \
     wreath.svg divider.svg venue.svg \
     CormorantGaramond-Regular.ttf CormorantGaramond-Medium.ttf \
     CormorantGaramond-SemiBold.ttf CormorantGaramond-Bold.ttf Amiri-Regular.ttf OFL-amiri.txt /app/

COPY music/ /app/music/

# The sewing-machine sound (same for every invitation) and master_template.blend, built in
# the image (no GPU needed for either).
RUN python3 /app/make_needle_sound.py /app/needle.wav
RUN blender -b --factory-startup --python-exit-code 1 -P /app/build_template.py \
    && test -s /app/master_template.blend

EXPOSE 8000

# One worker: jobs live in this process's memory.
CMD ["sh", "-c", "exec uvicorn server:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1"]
