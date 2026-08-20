import { COUNTRIES, RECIPES, CURATED_CODES } from "../js/data.js";

const issues = [];
const codes = COUNTRIES.map((country) => country.code);
if (COUNTRIES.length !== 197) issues.push(`Forventet 197 land, fant ${COUNTRIES.length}`);
if (new Set(codes).size !== COUNTRIES.length) issues.push("Dupliserte landkoder");
if (Object.keys(RECIPES).length !== COUNTRIES.length) issues.push("Antall oppskrifter matcher ikke land");
if (CURATED_CODES.length !== COUNTRIES.length) issues.push("Ikke alle land er aktivert som komplette");

for (const country of COUNTRIES) {
  const recipe = RECIPES[country.code];
  if (!country.name || !country.dish || !country.city || !country.videoQuery) issues.push(`${country.code}: ufullstendig landkort`);
  if (!Array.isArray(country.facts) || country.facts.length < 3) issues.push(`${country.code}: mangler fakta`);
  if (!Array.isArray(country.alternatives) || country.alternatives.length < 2) issues.push(`${country.code}: mangler alternativer`);
  if (!recipe) { issues.push(`${country.code}: mangler oppskrift`); continue; }
  if (!Array.isArray(recipe.ingredients) || recipe.ingredients.length < 7) issues.push(`${country.code}: for få ingredienser`);
  if (!Array.isArray(recipe.steps) || recipe.steps.length < 4) issues.push(`${country.code}: for få steg`);
  for (const [index, step] of (recipe.steps || []).entries()) {
    for (const field of ["title", "minutes", "heat", "instruction", "cue", "tip"]) {
      if (step[field] === undefined || step[field] === "") issues.push(`${country.code}: steg ${index + 1} mangler ${field}`);
    }
  }
  if (!Array.isArray(recipe.signatureTweaks) || recipe.signatureTweaks.length < 3) issues.push(`${country.code}: mangler signaturgrep`);
  if (!recipe.balance || Object.keys(recipe.balance).length < 5) issues.push(`${country.code}: mangler balansemodell`);
  if (!recipe.plating) issues.push(`${country.code}: mangler serveringsplan`);
}

const continents = Object.fromEntries([...new Set(COUNTRIES.map((c) => c.continent))].sort().map((continent) => [continent, COUNTRIES.filter((c) => c.continent === continent).length]));
console.log(JSON.stringify({
  ok: issues.length === 0,
  countries: COUNTRIES.length,
  recipes: Object.keys(RECIPES).length,
  videoQueries: COUNTRIES.filter((c) => c.videoQuery).length,
  embeddedVideos: COUNTRIES.filter((c) => c.videoId).length,
  continents,
  issues,
}, null, 2));
if (issues.length) process.exitCode = 1;
