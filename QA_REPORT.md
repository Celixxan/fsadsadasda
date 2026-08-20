# QA-rapport — Verdensbordet 2.0

Dato: 25. juli 2026

## Datakontroll

Bestått:

- 197 unike destinasjonskoder
- 197 landkort med navn, rett, sted, kontinent og koordinater
- 197 komplette oppskriftsobjekter
- ingen destinasjoner uten oppskrift
- minst 7 ingredienser per oppskrift
- minst 4 kokkesteg per oppskrift
- alle steg har tittel, tid, varme, instruksjon, sansekriterium og tips
- alle oppskrifter har tre Bistro-grep
- alle oppskrifter har balansemodell og serveringsplan
- alle land har tre fakta-/kontekstpunkter
- alle land har videoforespørsel og alternative retter
- 197 land kan trekkes som ferdige oppdrag; ingen åpner et tomt verksted

Kontinentfordeling:

- Afrika: 54
- Asia: 49
- Europa: 45
- Nord-Amerika: 23
- Oseania: 14
- Sør-Amerika: 12

## Kodekontroll

Følgende moduler er syntakskontrollert med Node:

- `js/data.js`
- `js/app.js`
- `js/book-export.js`
- `js/db.js`
- `js/cloud.js`
- `js/globe.js`
- `sw.js`

HTML er kontrollert for dupliserte ID-er, og CSS-reglene har balanserte klammer.

## Visuell kontroll

Kontrollert med ekte Chromium-rendering ved:

- 1440 px desktop
- 390 px mobil
- reisevisning
- kokebok og Bokstudio

Resultat:

- ingen horisontal overflow på mobil
- navigasjon og hovedhandlinger beholder tydelig hierarki
- Bokstudio skalerer til smale skjermer
- kontrast og typografisk hierarki fungerer i mørk premiumprofil

Forhåndsvisninger ligger i `previews/`.

## Fotoboktest

Bestått med produksjonsoppløsning 2480 × 2480 px:

- forside rendret som JPG
- innholdsintro rendret
- destinasjonsindeks rendret
- foto-/minneside rendret
- oppskriftsside rendret
- bakside rendret
- manifest og opplastingsguide opprettet
- ZIP-fil pakket og integritetstestet uten feil
- norsk tekst, æ/ø/å og numerisk filrekkefølge bevart
- sikkerhetsmargin og sidetall kontrollert visuelt

Testpakken med ett kapittel inneholdt åtte filer og var omtrent 1,26 MB uten brukerfoto. Reelle bøker blir større fordi bilder beholdes i høy kvalitet.

## Video

- Italia har innebygd personvernforbedret YouTube-video fra den opprinnelige kurateringen.
- Alle 197 land har en spesifikk videosøkestreng for land/by/region og matreise.
- Uklarerte videoer åpnes som videosøk fremfor å bli innebygd automatisk. Dette reduserer risiko for døde videoer, uønsket innhold og uklare bruksrettigheter.

## Testbegrensning

Kjøremiljøet blokkerte vanlig navigasjon til lokal server og eksterne CDN-er. Designet ble derfor rendret via lokal HTML/CSS-injeksjon i Chromium. Fotobokgeneratoren ble kjørt direkte i Chromium med produksjonsoppløsning. Three.js-CDN, Supabase og YouTube må få en siste smoke-test på det faktiske Vercel-domenet etter deploy. Appen har eksplisitt fallback dersom WebGL eller CDN ikke er tilgjengelig.

## Redaksjonell grense

Teknisk og funksjonelt er alle 197 oppskrifter komplette. «Nasjonalrett» er likevel et kulturelt og noen ganger omstridt begrep. Før offentlig eller kommersiell bokutgivelse anbefales en egen kilde- og kulturkontroll per land, særlig for rå sjømat, fermentering, allergener og retter med mange regionale varianter.
