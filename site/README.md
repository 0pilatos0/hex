# HEX marketing site (.dev)

`bun run dev` starts Vite. `bun run build` checks TypeScript and builds the site;
`wrangler deploy` publishes it to `hex.kitlangton.dev`.

The wind-up teeth in `src/ChatteringTeeth.tsx` use separate body and foot groups:
the soles remain planted during anticipation, the whole toy travels during the
hop, and the body settles after contact. Wide screens use the perimeter; narrow
screens use the space above the copy. Reduced motion freezes idle movement.
The canvas is click-through and microphone access remains an explicit button action.

## Social image

The Open Graph and Twitter image is `public/og-teeth.png` (1200 × 630). It is
rendered from the same Three.js model, using `?og` for a deterministic poster pose.
With the dev server running, regenerate after changing the model:

```sh
bunx playwright install chromium
bun run generate:og
# If Vite chose another port:
HEX_SITE_URL=http://127.0.0.1:5174 bun run generate:og
```

Inspect the resulting image, rebuild, then deploy. Verify the production HTML's
image metadata and fetch the published PNG. The separate `.com` site lives in
`/Users/kit/code/projects/hex-marketing-site` and deploys through Vercel.
