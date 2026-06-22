# Reflow

Sketch a physics system by hand; an AI reads your drawing and turns it into a live,
running simulation with the governing equations — then you bend the parameters in
real time. Eight engines (pendulum, double pendulum, projectile, incline, spring,
Atwood, orbit, bouncing ball) running real numerical integration (RK4 / Verlet) in
the browser.

## Deploy

The "Bring it to life" step uses Claude vision, which runs through a serverless
function so your API key never reaches the browser. The simulations themselves run
entirely client-side.

### Full version (drawing-reading on) — CLI or Git deploy
Functions don't run on a drag-and-drop "Netlify Drop", so use one of:

**Netlify CLI**
1. `npm i -g netlify-cli`
2. From this folder: `netlify deploy --prod`  (publish dir = ".")
3. Site settings -> Environment variables -> add `ANTHROPIC_API_KEY = sk-ant-...`
4. Redeploy (`netlify deploy --prod`). Done.

**Git**
Push this folder to a repo, "Add new site" in Netlify, set the same
`ANTHROPIC_API_KEY` env var. `netlify.toml` handles the rest.

### Static drop (no key) — still useful
Drag this folder onto https://app.netlify.com/drop and the full simulation sandbox
works immediately — pick a system from the dropdown, read the equations, tune the
sliders. Only the "read my drawing" step needs the key.

## How it works
- React + Babel are loaded from CDN; the app is the same one built in Claude.
- Drawing -> PNG -> `/api/interpret` -> Netlify function -> Claude vision -> a
  structured `{system, params}` spec.
- That spec drives a hand-built physics engine per system; equations and derived
  quantities (period, range, tension, orbit type) update live as you drag sliders.

Idealized models for demonstration — not engineering-grade analysis.
