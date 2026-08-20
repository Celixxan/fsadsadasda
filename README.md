# Verdensbordet — anonymisert kildekode

Verdensbordet er en installérbar, offline-først webapp for en kulinarisk reise verden rundt.

## Funksjoner

- 197 kulinariske destinasjoner og 197 komplette oppskrifter
- WebGL-klode og tilfeldig trekking av neste land
- fakta, matkultur, opprinnelse og alternative retter
- autentisk oppskriftsmodus med mise en place, steg, timere og smaksbalanse
- smarte handlelister for Oda, MENY, SPAR, KIWI, REMA 1000 og Coop
- norske råvareerstatninger for vanskelig tilgjengelige ingredienser
- bildealbum, vurderinger, kostnader, minner og kokebok
- høyoppløselig fotobokeksport
- lokal IndexedDB-lagring og valgfri Supabase-synk
- JSON-backup og gjenoppretting

Denne delingsutgaven er anonymisert. Personnavn, initialer, privat branding og den personlige restaurantvarianten er fjernet. To separate vurderinger er beholdt som «Person 1» og «Person 2».

## Kjør lokalt

Appen bruker ES-moduler og service worker og må åpnes gjennom en lokal webserver:

```bash
python3 -m http.server 8080
```

Åpne `http://localhost:8080`.

## Deploy

Prosjektet er statisk og kan legges direkte på Vercel, Netlify, Cloudflare Pages eller annen statisk hosting. `vercel.json` følger med.

## Valgfri Supabase-synk

1. Opprett et Supabase-prosjekt.
2. Kjør `supabase/001_schema.sql`.
3. Fyll inn `config.js` med prosjektets URL og publishable key.
4. Legg eget domene til i Supabase Auth URL Configuration.

Ikke legg service-role-nøkler eller andre hemmeligheter i frontend. `config.js` i denne pakken er tom.

## Viktige filer

- `index.html` — applikasjonens struktur
- `assets/styles.css` — responsivt design
- `js/data.js` — 197 land og oppskrifter
- `js/app.js` — hovedlogikk og brukerflyt
- `js/shopping.js` — butikkvalg og ingredienserstatninger
- `js/globe.js` — WebGL-klode
- `js/book-export.js` — fotobokgenerator
- `js/db.js` — lokal lagring og bildekomprimering
- `js/cloud.js` — valgfri Supabase-synk
- `supabase/001_schema.sql` — generisk databaseoppsett

## Redaksjonell merknad

«Nasjonalrett» er brukt som en representativ eller sterkt identitetsbærende rett. Mange land har flere like legitime kandidater og regionale variasjoner. Oppskriftsdatabasen bør få separat kulturell og kildebasert redaksjonskontroll før eventuell kommersiell publisering.
