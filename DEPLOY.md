# Deploying Haturi Studio

Same setup as `habijabi/tizadid`: GitHub repo under TIZadid, Cloudflare Worker serving `dist/` as static assets (`wrangler.jsonc`).

## 1. GitHub (once)

Create an empty repo on github.com: **TIZadid/haturi-studio** (no README, no .gitignore). Then:

```bash
cd ~/Talha/Business/Haturi/site
git remote add origin git@github.com:TIZadid/haturi-studio.git
git push -u origin main feat/site-v1
```

`main` only has the plan docs for now. The site is on `feat/site-v1` until it is merged.

## 2. Cloudflare preview (first deploy creates the Worker)

```bash
cd ~/Talha/Business/Haturi/site
nvm use 20
npm install
npm run deploy
```

Wrangler is already logged in as talhazadid@gmail.com. The last lines print the live URL, e.g. `https://haturi-studio.<subdomain>.workers.dev`. Run `npm run deploy` again any time to push the latest build.

## 3. Auto-deploy on push (optional)

Cloudflare dashboard → Workers & Pages → **haturi-studio** → Settings → Builds → Connect → `TIZadid/haturi-studio`.

- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
- Variable: `NODE_VERSION` = `20`
- Production branch: `main`
