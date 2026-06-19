# Kefel ✖️ — a multiplication game for kids

**Kefel** (Hebrew: כֵּפֶל, "multiplication") is a colorful, kid-friendly game for
practicing the times tables. Bilingual (English / עברית), works on phones and
tablets, no internet needed once loaded.

![made for kids](https://img.shields.io/badge/made%20for-kids-ff7675)
![runs on](https://img.shields.io/badge/runs%20on-nginx-009639)

## What it does

- Pick a times table (×2 to ×12) or **Mixed** for a challenge.
- Choose 5, 10, 15, or 20 questions.
- Tap the right answer — get stars, streak bonuses, confetti, and sounds.
- Gentle feedback shows the correct answer when a kid misses.
- One tap to switch between **English** and **עברית** (full right-to-left support).

It's a single static page (HTML + CSS + vanilla JS) — no tracking, no accounts,
no external dependencies.

## Run it locally

Any static file server works. The simplest:

```bash
# Python
python3 -m http.server 8080
# then open http://localhost:8080
```

Or with Docker (matches production exactly):

```bash
docker build -t kefel .
docker run --rm -p 8080:80 kefel
# open http://localhost:8080
```

## Deploy to your homelab

GitHub Actions builds a multi-arch image (amd64 + arm64) and publishes it to the
GitHub Container Registry (GHCR) on every push to `main`. Your homelab just pulls it.

1. Copy `docker-compose.yml` to your homelab.
2. Make the GHCR package public (one time), or `docker login ghcr.io` with a token:
   - On GitHub → your profile → **Packages** → `kefel` → **Package settings** →
     **Change visibility** → Public.
3. Pull and start:

   ```bash
   docker compose pull
   docker compose up -d
   ```

The game is now on `http://<homelab-ip>:8080`. Change the port in
`docker-compose.yml` if 8080 is taken. Put it behind your reverse proxy
(Traefik / Nginx Proxy Manager / Caddy) for a nice hostname and HTTPS.

### Updating

When you push changes, Actions rebuilds `:latest`. On the homelab:

```bash
docker compose pull && docker compose up -d
```

Want it automatic? Add [Watchtower](https://containrrr.dev/watchtower/) to your
stack and it will pull new `:latest` images for you.

## Project layout

```
index.html      Game markup (3 screens: home, game, results)
style.css       Theme, layout, animations, RTL support
game.js         Game logic, i18n, Web Audio sounds, confetti
nginx.conf      Static serving + cache + security headers
Dockerfile      nginx:alpine image
docker-compose.yml   Homelab deployment
.github/workflows/docker-publish.yml   CI → GHCR
```

## License

MIT — do whatever you like. Made with ❤️ for little mathematicians.
