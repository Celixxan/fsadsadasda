# Verdensbordet Full Production 3.1 — QA

Dato: 31. juli 2026

## Omfang

Versjon 3.1 viderefører Full Production 3.0 og legger til smarte, norske handlelister direkte i oppskriftsflyten.

## Funksjoner kontrollert

- 197 kulinariske destinasjoner og 197 komplette oppskrifter.
- Autentisk og Bistro som separate oppskriftsvalg.
- Knappen «Lag handleliste hos butikk» i oppskriften.
- Seks butikkvalg: Oda, MENY, SPAR, KIWI, REMA 1000 og Coop.
- Direkte produktsøk hos Oda, MENY og SPAR.
- Kopierbar/nedlastbar sjekkliste og butikkfinner hos KIWI, REMA 1000 og Coop.
- Handlelisten skaleres etter valgt porsjonsantall.
- Modusene «Autentisk når mulig» og «Enklest i norsk butikk».
- Erstatningsnotater for spesialingredienser.
- Bolivia-test: ají → ají amarillo paste i autentisk modus; gul chili eller jalapeño i enkel modus.
- Ingredienser kan fjernes fra handlelisten når de allerede finnes hjemme.
- Valgt butikk og ingrediensmodus lagres lokalt.

## Automatiske kontroller

- `node --check` bestått for alle JavaScript-filer og serviceworker.
- `tools/verify_data.mjs` bestått: 197 land, 197 oppskrifter, 197 videoforespørsler, ingen dataproblemer.
- Erstatningsmotor kjørt gjennom 1 973 ingredienslinjer fra alle 197 oppskrifter uten feil.
- Nettlesertest: Bolivia valgt, oppskriften åpnet og handlelistedialogen generert.
- Nettlesertest: seks butikkvalg og ni skalerte ingredienslinjer i Bolivia-eksempelet.
- Nettlesertest: MENY-søk generert med kodet norsk erstatning.
- Mobiltest ved 390 × 844 CSS-piksler: ingen horisontal overflow.
- Ingen JavaScript-feil i den selvstendige brukerflyttesten.

## Vercel

- Prosjekt: `verdensbordet`
- Produksjonsdomene: `https://verdensbordet.vercel.app/`
- Produksjonsdeploy: `dpl_EVRTG2pC1R2szFxwJC6LZe3bhVWD`
- Status: READY
- Byggmelding: `VERDENSBORDET 3.1 SHOPPING PRODUCTION READY`
- `VERSION.txt`: HTTP 200 og Full Production 3.1.
- `js/shopping.js`: HTTP 200.
- Ingen grupperte runtime-feil registrert etter deploy.

## Integrasjonsgrense

Verdensbordet fyller ikke brukerens private handlekurv automatisk. Funksjonen lager en komplett handleliste og åpner butikkspecifikke produktsøk der kjeden støtter det. Sortiment, pris, leveringsområde og beholdning må bekreftes hos butikken når listen brukes.
