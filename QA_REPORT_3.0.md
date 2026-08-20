# QA – Verdensbordet Full Production 3.0

- 197 land og 197 komplette oppskrifter verifisert
- Alle JavaScript-moduler består syntakskontroll
- Autentisk modus beholder grunnoppskriften uten Bistro-ingredienser
- Bistro-modus gir egen ingrediensgruppe, eget sluttsteg, bistrogrep, smaksbalanse og plating
- Modusvalg lagres i kokebokkapittelets oppskriftssnapshot
- Albumdetalj viser valgt oppskriftsversjon
- Fotobokeksport testet med et lagret Bistro-kapittel
- Generert ZIP: 8 filer, omtrent 2,4 MB, integritet bestått
- Mobiltest: 390 px bredde uten horisontal overflyt
- Trekking viser tre fakta og full land-/rettsfortelling

Testmiljøets nettverk sperrer direkte lokal navigasjon og ekstern CDN. Integrasjonstesten brukte derfor samme appkode med en lokal QA-klodemock. Produksjonskoden beholder den faktiske Three.js WebGL-implementasjonen og fallbacken.
