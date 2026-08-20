# Verdensbordet — komplett produksjonsversjon 2.0

Verdensbordet er en installérbar, offline-først webapp for brukernes helgeritual:

1. Kloden trekker én ny kulinarisk destinasjon.
2. Dere får en representativ nasjonal eller sterkt identitetsbærende rett.
3. Landkortet viser sted, smaksprofil, alternative retter, morsom kontekst og stemningsfilm/videosøk.
4. Retten lages i en strukturert kokkemodus med mise en place, varme, tid, sansekriterier og timere.
5. Dere dokumenterer bilder, arbeidsfordeling, kostnad, egne grep, separate vurderinger, læring og kveldens minne.
6. Resultatet blir et albumkort og et permanent kokebokkapittel.
7. Bokstudio eksporterer høyoppløselige, ferdig designede JPG-sider til fotobok.

## Innhold

- 197 kulinariske destinasjoner
- 195 bredt anerkjente suverene stater, pluss Kosovo og Taiwan som valgfrie kulinariske reisemål
- 197 komplette, kjørbare oppskrifter
- 197 videoforespørsler til riktig land/by/region
- tre fakta-/kontekstpunkter per destinasjon
- alternative nasjonalretter per land
- WebGL-klode med rute fra Oslo
- Bistro-modus for restaurantfølelse, balanse og plating
- bildealbum, søk, filtre, statistikk og detaljvisning
- JSON-backup og gjenoppretting
- lokal IndexedDB-lagring og valgfri Supabase-synk

`LAND_OG_RETTER.csv` gir en komplett redaksjonell oversikt.

## Om begrepet «nasjonalrett»

Mange land har ingen juridisk eller universelt vedtatt nasjonalrett, og regionale identiteter kan være like viktige som landegrenser. Appen bruker derfor én representativ nasjonal eller sterkt identitetsbærende rett som hovedreise, og viser alternative kandidater på landkortet.

Alle 197 destinasjoner har full oppskriftsflyt. De 12 opprinnelige flaggskipoppskriftene er individuelt håndkuratert. De øvrige er country-spesifikke produksjonsoppskrifter bygget fra en strukturert matrise med valgt rett, råvarer, teknikkfamilie, tidsbruk, servering og lokale alternativer. Før eventuell kommersiell utgivelse bør hele databasen få en separat kulturell og kildebasert redaksjonsrunde.

## Bokstudio og fysisk fotobok

Bokstudio lager universelle helsider som JPG, ikke et låst leverandørprosjekt. Hver dokumenterte rett blir et oppslag:

- venstre side: bilde, land, dato, vurdering og minne
- høyre side: ingredienser, fremgangsmåte, tid, kostnad og læring

Pakken inneholder:

- `cover-front.jpg`
- `cover-back.jpg`
- nummererte filer i `pages/`
- `manifest.json`
- `README-FOTOBOK.txt` med opplastingsrekkefølge
- valgfri mappe med originalbilder

Formater:

- 30 × 30 cm — 3543 × 3543 px
- 21 × 21 cm — 2480 × 2480 px
- 28 × 21 cm — 3307 × 2480 px

Maks 58 kapitler per volum gir 118 innholdssider: to startsider og to sider per rett. Ved 197 retter deles reisen automatisk i fire trykkbare volum. Første naturlige bokmilepæl er 12 retter, som gir 26 innholdssider og passer vanlige minstegrenser bedre enn en bok etter bare noen få helger.

## Kjør lokalt

Appen bruker ES-moduler og service worker og må åpnes gjennom en webserver:

```bash
cd verdensbordet-final
python3 -m http.server 8080
```

Åpne `http://localhost:8080`.

## Deploy til Vercel

Appen er statisk og krever ikke byggesteg:

```bash
vercel
```

Alternativt kan mappen legges i et GitHub-repo og importeres i Vercel.

## Slå på konto og sky-synk

1. Opprett et Supabase-prosjekt.
2. Kjør `supabase/001_schema.sql` i SQL Editor.
3. Fyll inn prosjektdata i `config.js`:

```js
window.VERDENSBORDET_CONFIG = {
  supabaseUrl: "https://PROJECT.supabase.co",
  supabasePublishableKey: "sb_publishable_...",
};
```

4. Legg produksjonsdomenet til under Supabase Auth → URL Configuration.
5. Deploy på nytt.

Publiserbar nøkkel kan ligge i frontend. Service-role key skal aldri legges i appen.

## Personvern og lagring

- Lokalmodus sender ingen reiser eller bilder til server.
- Bilder komprimeres til opptil 3600 × 3600 px med høy JPEG-kvalitet for bokbruk.
- Skymodus bruker magisk e-postlenke, Postgres, privat Storage-bøtte og RLS.
- Bildene vises gjennom tidsbegrensede signed URLs i skymodus.

## Viktige filer

- `index.html` — applikasjonens struktur
- `assets/styles.css` — komplett responsivt design
- `js/data.js` — 197 land og oppskrifter
- `js/app.js` — brukerflyt og interaksjoner
- `js/book-export.js` — høyoppløselig fotobokgenerator og ZIP-pakking
- `js/db.js` — lokal lagring og bildekomprimering
- `js/cloud.js` — valgfri Supabase-synk
- `js/globe.js` — WebGL-klode
- `tools/generate_world_data.py` — reproducerbar datagenerator
- `tools/country_dishes.tsv` — redaksjonell råmatrise
- `QA_REPORT.md` — verifiserte kontroller og testbegrensninger

## Full Production 3.1 — smarte handlelister

Oppskriftsvisningen har nå «Lag handleliste hos butikk» med støtte for Oda, MENY, SPAR, KIWI, REMA 1000 og Coop. Listen skaleres etter porsjoner og tilbyr både autentiske søkeord og nærmeste praktiske norske erstatning. Oda, MENY og SPAR får direkte produktsøk; øvrige butikker får en ferdig sjekkliste og butikkfinner.
