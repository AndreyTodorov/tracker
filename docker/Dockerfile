# Firebase Local Emulator Suite in a container — keeps Java off the host.
FROM node:20-bookworm-slim

# JRE for the Auth + Realtime Database emulators (they run on the JVM).
RUN apt-get update \
 && apt-get install -y --no-install-recommends openjdk-17-jre-headless \
 && rm -rf /var/lib/apt/lists/*

# Firebase CLI. Pinned to the same major the project uses on the host; v13
# runs on JDK 17, so the host's Java version is irrelevant for this path.
RUN npm install -g firebase-tools@13

WORKDIR /app

# Container-specific emulator config — binds 0.0.0.0 so published ports are
# reachable from the host browser. The host firebase.json is left untouched.
COPY docker/firebase.json ./firebase.json

# Pre-download the emulator JARs into the image so first start is fast/offline.
RUN firebase setup:emulators:database \
 && firebase setup:emulators:ui

# auth, database, emulator UI, hub
EXPOSE 9099 9000 4000 4400

# database.rules.json is bind-mounted at runtime (see docker-compose.yml).
CMD ["firebase", "emulators:start", "--project", "demo-tracker"]
