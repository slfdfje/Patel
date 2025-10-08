# Patel
Backend dashboard for uploading 1–4 PNGs and generating a 3D model (glasses) via Meshy API. Includes JWT auth, SQLite, uploads, and a minimal HTML dashboard.

Run locally
1) Install deps
```
npm install
```
2) Configure env
```
cp .env.example .env
# set MESHY_API_KEY=...
# optionally set PUBLIC_BASE_URL if your server is publicly reachable
```
3) Start
```
npm run start
# open http://localhost:8080
```

Notes
- If Meshy cannot fetch images from your local server, we fallback to uploading images to transfer.sh to get a temporary public URL for each uploaded file.
- To avoid transfer.sh, expose your server publicly and set `PUBLIC_BASE_URL=https://your-host` so Meshy can fetch `PUBLIC_BASE_URL/public/...`.
