# ApexDevs Blockchain Lab

Five interactive blockchain sandboxes, built with React, TypeScript, and Vite for **blockchaindemo.apexdevs.io**. No accounts, backend, wallets, or API keys are required. All hashing and mining happen locally in the browser, and fonts are self-hosted.

## Run locally

Requires Node.js 22 or later.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. `npm run build` produces `dist/`; `npm run preview` serves that production build. `npm test` runs the automated checks.

## Sandboxes

- `/hash` — SHA-256 input/output, copy hash, sample inputs, side-by-side comparison with changed hexadecimal characters and differing bit count.
- `/block` — editable number, nonce, and data; actual proof-of-work mining in a cancellable Web Worker.
- `/blockchain` — five linked blocks; edits recalculate all downstream hashes. Mine from left to right to restore validity.
- `/distributed` — three independent five-block chains, peer switching, validity overview, and matching-peer count.
- `/tokens` — editable sender, recipient, and amount; add/remove transfers; independent peer ledgers and mining.

The root opens Hash. Original-style nested routes such as `/blockchain/hash` also work through the SPA fallback. Navigation retains experiments during the current session. Reloading restores defaults. Reset restores the active sandbox, including all its peers.

## Model details

SHA-256 comes from `@noble/hashes`. Block input is UTF-8 encoding of `JSON.stringify([number, nonce, transactions ?? data, previousHash])`. The genesis previous hash is 64 zeros. Default proof of work requires four leading hexadecimal zeros; two and three zeros are also selectable. All initial blocks are genuinely pre-mined. A block is marked valid only when its proof and the entire preceding chain are valid.

Mining runs in a module Web Worker, keeping the UI responsive. Editing is disabled during mining. Stop, reset, changing peers, or changing sandboxes terminates the worker and discards incomplete work.

This is a simplified visual model: transfers do not enforce balances, ownership, or signatures; there is no networking, automatic synchronization, cumulative-work fork choice, or full consensus protocol. Matching peers are counted only among fully valid chains. Re-mining can produce a valid chain that still disagrees with other peers.

## Design

Light color tokens from https://apexdevs.io/brand, with Montserrat for interface text and JetBrains Mono for hashes and numeric data. Responsive navigation and panels, reduced-motion support, accessible field labels, native modal focus handling, and keyboard-operable controls.

Inspired by Anders Brownworth's blockchain demonstration: https://andersbrownworth.com/blockchain/. The application is an original implementation; Anders Brownworth’s source and assets are not copied. ApexDevs branding uses the official light wordmark component (original SVG geometry, colors, and Space Grotesk font) from its brand page. Favicons and the Apple touch icon are the official assets downloaded from apexdevs.io.

## Deploy

The app is ready for static hosting. Domain/DNS activation is a separate hosting step and has not been performed.

**Vercel:** import this directory/repository, select Vite, use `npm run build` and output directory `dist`. `vercel.json` includes the SPA fallback. Add `blockchaindemo.apexdevs.io` under the project's domains, then add the DNS records Vercel specifies.

**Netlify / Cloudflare Pages:** use build command `npm run build`, output `dist`, and Node.js 22+. The bundled `_redirects` enables direct routes. Add the custom subdomain using the hosting provider's instructions.

**Nginx:** serve `dist/` with HTTPS and a fallback:

```nginx
server {
    listen 80;
    server_name blockchaindemo.apexdevs.io;
    root /var/www/blockchaindemo/dist;
    index index.html;
    location / { try_files $uri $uri/ /index.html; }
}
```

Configure TLS through your infrastructure. HTTPS is needed for clipboard access outside localhost. Cache fingerprinted `/assets/` files for a long duration, and avoid long caching for `index.html`.

## Validation

`npm test` verifies published SHA-256 vectors, Unicode hashing against Node crypto, seed validity, tamper propagation, sequential repair, invalid ancestors, independent peers, transaction hashing, and UI interactions.

`npm run build` performs TypeScript checking and emits the production app and mining worker. Browser visual QA should be performed on desktop and mobile before publishing; no browser was connected during initial implementation.
