const COMMON_WORDS = new Set([
  "agurk", "allehånde", "and", "ansjos", "appelsin", "aubergine", "avokado", "bacon", "banan", "basmatiris",
  "biff", "bladgrønnsaker", "blekksprut", "bok choy", "brød", "brødsmuler", "bulgur", "butterdeig", "byggmel",
  "bønner", "chili", "chiliflak", "chorizo", "couscous", "dadler", "dill", "eddik", "egg", "emmentaler",
  "eple", "eplecidereddik", "eplemos", "erter", "feta", "fetaost", "filodeig", "fløte", "garam masala",
  "gresk yoghurt", "gresskar", "gresskarkjerner", "gul løk", "gulrot", "gurkemeie", "hakkede tomater", "harissa",
  "helmelk", "honning", "hvetemel", "hvit fisk", "hvite bønner", "hvitløk", "hvitvin", "høyrygg", "ingefær",
  "jasminris", "kanel", "kardemomme", "karri", "karve", "kidneybønner", "kikerter", "kimchi", "kjøttdeig",
  "klaret smør", "klippfisk", "kokos", "kokosmelk", "koriander", "kraft", "kremfløte", "kylling",
  "kyllingkraft", "kål", "kålrot", "laks", "lam", "lammebog", "laurbær", "laurbærblad", "lime", "linser",
  "løk", "mais", "maismel", "maisstivelse", "makaroni", "makrell", "mandler", "mango chutney", "mangold",
  "mel", "melk", "merian", "mungbønner", "mynte", "mørk sjokolade", "nellik", "noriark", "nøytral olje",
  "okra", "oksekraft", "oliven", "olivenolje", "oregano", "ost", "paprika", "parmesan", "passata", "pasta",
  "peanøtter", "peanøttsmør", "persille", "pinjekjerner", "pita", "plantain", "potet", "poteter", "prosciutto",
  "pære", "reker", "ricotta", "ris", "riseddik", "risnudler", "rosiner", "rotgrønnsaker", "rugbrød", "rød chili",
  "rødbete", "røde bønner", "rødløk", "rødvin", "rømme", "safran", "salat", "salt", "selleri", "sennep",
  "sesam", "sesamfrø", "sesamolje", "sitron", "sitrongress", "sjampinjong", "skinke", "smør", "sopp",
  "sort pepper", "soyasaus", "spinat", "spisskummen", "stjerneanis", "storfekjøtt", "sukker", "sumak", "surkål",
  "sushiris", "svarte bønner", "svinebog", "svinebryst", "svinekjøtt", "svinenakke", "svisker", "sylteagurk",
  "søtpotet", "tagliatelle", "tamarind", "tamarindpasta", "tilapia", "timian", "tomat", "tomatpuré",
  "tomatsaus", "torsk", "tunfisk", "tørrgjær", "urter", "vanilje", "vann", "vårløk", "wasabi",
  "worcestershire", "yoghurt", "øl"
]);

export const RETAILERS = {
  oda: {
    id: "oda",
    name: "Oda",
    kind: "online",
    description: "Direkte produktsøk og hjemlevering der Oda leverer.",
    homeUrl: "https://oda.com/no/",
    searchUrl: (query) => `https://oda.com/no/search/products/?q=${encodeURIComponent(query)}`,
  },
  meny: {
    id: "meny",
    name: "MENY",
    kind: "online",
    description: "Produktsøk, handlelister og netthandel med valgt butikk eller levering.",
    homeUrl: "https://meny.no/varer",
    searchUrl: (query) => `https://meny.no/sok/?expanded=products&query=${encodeURIComponent(query)}`,
  },
  spar: {
    id: "spar",
    name: "SPAR",
    kind: "online",
    description: "Nettbutikk i utvalgte SPAR- og EUROSPAR-butikker.",
    homeUrl: "https://spar.no/om-nettbutikk",
    searchUrl: (query) => `https://spar.no/sok?query=${encodeURIComponent(query)}`,
  },
  kiwi: {
    id: "kiwi",
    name: "KIWI",
    kind: "store",
    description: "Butikkmodus med ferdig sjekkliste og butikkfinner.",
    homeUrl: "https://kiwi.no/finn-butikk/",
    searchUrl: null,
  },
  rema: {
    id: "rema",
    name: "REMA 1000",
    kind: "store",
    description: "Butikkmodus med ferdig sjekkliste og butikkfinner.",
    homeUrl: "https://www.rema.no/butikker/",
    searchUrl: null,
  },
  coop: {
    id: "coop",
    name: "Coop",
    kind: "store",
    description: "Butikkmodus for Extra, Mega, Prix og Obs med butikkfinner.",
    homeUrl: "https://www.coop.no/butikker",
    searchUrl: null,
  },
};

const EXACT_MATCHES = new Map(Object.entries({
  "ají": {
    preferred: "ají amarillo paste",
    substitute: "gul chili eller jalapeño",
    recipe: "Bruk gul chili/jalapeño for middels varme. For mer fruktighet: litt gul paprika; for mer sting: en liten bit habanero.",
    level: "specialty",
  },
  "achar": { preferred: "achar indisk pickles", substitute: "mango chutney og syltede grønnsaker", recipe: "Bland mango chutney med litt sitron og finhakket sylteagurk.", level: "specialty" },
  "attiéké eller couscous": { preferred: "couscous", substitute: "couscous", recipe: "Couscous er enklest i vanlig norsk butikk; attiéké finnes oftest i afrikanske spesialbutikker.", level: "substitute" },
  "baharat": { preferred: "baharat krydder", substitute: "ras el hanout eller allehånde og spisskummen", recipe: "Bland 2 deler allehånde med 1 del spisskummen, paprika og litt kanel.", level: "specialty" },
  "bananblad": { preferred: "bananblad frossent", substitute: "bakepapir og aluminiumsfolie", recipe: "Gir ikke samme aroma, men holder på damp og form. Legg gjerne et tynt lag kålblad innerst.", level: "specialty" },
  "bananstamme": { preferred: "bananstamme", substitute: "selleristang og fennikel", recipe: "Bruk selleri for sprøhet og litt fennikel for frisk anisnote.", level: "specialty" },
  "bara-deig": { preferred: "kikertmel", substitute: "kikertmel", recipe: "Lag røren fra bunnen med kikertmel og krydder.", level: "substitute" },
  "berbere": { preferred: "berbere krydder", substitute: "paprika, cayenne, spisskummen og koriander", recipe: "Bland paprika med litt cayenne, spisskummen, koriander, ingefær og kanel.", level: "specialty" },
  "bitre blader eller spinat": { preferred: "spinat og ruccola", substitute: "spinat og ruccola", recipe: "Bruk mest spinat og litt ruccola for den bitre kanten.", level: "substitute" },
  "bogobe og morogo": { preferred: "maismel og spinat", substitute: "polenta og spinat", recipe: "Polenta gir riktig grøtkonsistens; spinat erstatter morogo.", level: "substitute" },
  "bokhvetenudler": { preferred: "soba nudler", substitute: "fullkornsspaghetti", recipe: "Soba er nærmest; fullkornsspaghetti fungerer som nødvalg.", level: "specialty" },
  "brødfrukt": { preferred: "brødfrukt frossen", substitute: "søtpotet eller melne poteter", recipe: "Søtpotet gir sødme; melne poteter gir mer nøytral stivelse.", level: "specialty" },
  "bryndza eller feta": { preferred: "feta og cottage cheese", substitute: "feta og cottage cheese", recipe: "Mos 2 deler feta med 1 del cottage cheese for en mildere bryndza-lignende krem.", level: "substitute" },
  "bukkehornskum": { preferred: "bukkehornkløver malt", substitute: "karripulver", recipe: "Bruk lite karripulver; det inneholder ofte bukkehornkløver, men gir flere smaker.", level: "specialty" },
  "callaloo": { preferred: "callaloo frossen", substitute: "spinat eller mangold", recipe: "Mangold gir mer struktur; spinat er lettest tilgjengelig.", level: "specialty" },
  "callaloo eller spinat": { preferred: "spinat", substitute: "spinat", recipe: "Spinat er den enkleste norske erstatningen.", level: "substitute" },
  "cassareep": { preferred: "cassareep", substitute: "mørk sirup, soyasaus og lime", recipe: "Bland mørk sirup med litt soyasaus, lime og en klype allehånde. Det er en nødløsning, ikke identisk.", level: "specialty" },
  "cassava chips": { preferred: "cassava eller yuca frossen", substitute: "søtpotetfries", recipe: "Søtpotet gir lignende sprø utside og myk kjerne.", level: "specialty" },
  "cassava eller ris": { preferred: "ris", substitute: "ris", recipe: "Velg ris i vanlig dagligvare; cassava finnes ofte i internasjonale butikker.", level: "substitute" },
  "cassavablader": { preferred: "cassavablader frossen", substitute: "spinat og grønnkål", recipe: "Bruk mest spinat og litt grønnkål for både mykhet og struktur.", level: "specialty" },
  "chop-up": { preferred: "spinat og aubergine", substitute: "spinat og aubergine", recipe: "Lag en grov grønnsaksstuing av spinat, aubergine og okra.", level: "substitute" },
  "conch eller fast hvit fisk": { preferred: "fast hvit fisk", substitute: "torsk eller kveite", recipe: "Fast hvit fisk er enklere enn conch og tåler samme syrlige/krydrede behandling.", level: "substitute" },
  "culantro": { preferred: "koriander", substitute: "koriander", recipe: "Bruk litt mer korianderstilk enn vanlig; culantro er kraftigere.", level: "substitute" },
  "dakkous": { preferred: "sterk tomatsaus", substitute: "hakkede tomater, chili og hvitløk", recipe: "Kok en enkel sterk tomatsaus med hvitløk og chili.", level: "substitute" },
  "egusifrø": { preferred: "egusi melonfrø", substitute: "gresskarkjerner", recipe: "Mal ristede gresskarkjerner. Smaken er ikke identisk, men fett og fylde blir lignende.", level: "specialty" },
  "fufu": { preferred: "instant fufu", substitute: "potetmos og tapiokastivelse", recipe: "Bland fast potetmos med litt tapioka-/potetstivelse for mer elastisk konsistens.", level: "specialty" },
  "fufu og saka-saka": { preferred: "instant fufu og spinat", substitute: "potetmos og spinat", recipe: "Bruk fast potetmos og en godt innkokt spinatstuing.", level: "substitute" },
  "funge": { preferred: "polenta", substitute: "polenta", recipe: "Polenta er den nærmeste lett tilgjengelige grøtbasen.", level: "substitute" },
  "geitekjøtt eller lam": { preferred: "lam", substitute: "lam", recipe: "Lam er lettere å finne og har lignende fylde.", level: "substitute" },
  "gochujang": { preferred: "gochujang", substitute: "miso, sriracha og litt sukker", recipe: "Bland 2 deler miso, 1 del sriracha og litt sukker.", level: "specialty" },
  "grønn banan": { preferred: "grønn plantain", substitute: "faste poteter", recipe: "Plantain er nærmest. Faste poteter fungerer når stivelse er viktigere enn banansmak.", level: "specialty" },
  "hilsa eller makrell": { preferred: "makrell", substitute: "makrell", recipe: "Makrell har riktig fet fiskekarakter og finnes bredt.", level: "substitute" },
  "injera": { preferred: "injera", substitute: "surdeigslefse eller myk tortilla", recipe: "Tilsett litt sitron i en enkel pannekakerøre for et syrligere nødvalg.", level: "specialty" },
  "jamid eller yoghurt": { preferred: "gresk yoghurt og feta", substitute: "gresk yoghurt og feta", recipe: "Blend yoghurt med litt feta og salt for syrlig, salt fylde.", level: "substitute" },
  "kajmak": { preferred: "kajmak", substitute: "crème fraîche og kremost", recipe: "Bland like deler crème fraîche og naturell kremost med litt salt.", level: "specialty" },
  "kambuzi chili": { preferred: "bird's eye chili", substitute: "rød chili eller habanero", recipe: "Bruk vanlig rød chili mildt, habanero svært forsiktig for mer varme.", level: "specialty" },
  "karriblader": { preferred: "karriblader", substitute: "limeskall og laurbærblad", recipe: "Ingen perfekt erstatning; bruk litt limeskall og ett laurbærblad for frisk aroma.", level: "specialty" },
  "kecap manis": { preferred: "kecap manis", substitute: "soyasaus og brunt sukker", recipe: "Bland 2 deler soyasaus med 1 del brunt sukker og kok kort inn.", level: "specialty" },
  "kroeung": { preferred: "kroeung paste", substitute: "rød currypaste og ekstra sitrongress", recipe: "Bruk mild rød currypaste og frisk opp med sitrongress, lime og ingefær.", level: "specialty" },
  "llajua": { preferred: "llajua salsa", substitute: "tomat, chili og koriander", recipe: "Blend tomat, chili og koriander grovt; smak til med salt og lime.", level: "substitute" },
  "moringa": { preferred: "moringa blader", substitute: "spinat", recipe: "Spinat erstatter grønnfargen og mykheten, men ikke den karakteristiske smaken.", level: "specialty" },
  "palmenøttsaus": { preferred: "palmenøttsaus", substitute: "kokosmelk, tomatpuré og paprika", recipe: "Bland kokosmelk med litt tomatpuré og røkt paprika for fylde og farge.", level: "specialty" },
  "palmeolje": { preferred: "rød palmeolje", substitute: "nøytral olje og paprika", recipe: "Bruk nøytral olje og litt paprika for farge; smaken blir mildere.", level: "specialty" },
  "palmesmør": { preferred: "palmesmør", substitute: "peanøttsmør og kokosmelk", recipe: "Bland peanøttsmør med kokosmelk for fylde; ikke samme smak, men lignende kropp.", level: "specialty" },
  "paellaris eller bomba-ris": { preferred: "paellaris", substitute: "risottoris", recipe: "Risottoris absorberer godt, men rør minst mulig.", level: "specialty" },
  "pomtajer eller potet": { preferred: "potet", substitute: "potet", recipe: "Velg en melken potetsort.", level: "substitute" },
  "pounded yam": { preferred: "instant pounded yam", substitute: "fast potetmos", recipe: "Lag en svært fast, glatt potetmos og arbeid den godt.", level: "specialty" },
  "pulaka eller taro": { preferred: "taro", substitute: "søtpotet eller melne poteter", recipe: "Søtpotet gir mild sødme; potet er mer nøytral.", level: "specialty" },
  "qurut eller yoghurt": { preferred: "gresk yoghurt og feta", substitute: "gresk yoghurt og feta", recipe: "Bland yoghurt med smuldret feta for syrlig og salt smak.", level: "substitute" },
  "recado": { preferred: "achiote paste", substitute: "paprika, spisskummen og oregano", recipe: "Bland paprika, spisskummen, oregano, hvitløk og litt eddik.", level: "specialty" },
  "sagostivelse": { preferred: "tapiokastivelse", substitute: "potetstivelse", recipe: "Tapioka er nærmest elastisiteten; potetstivelse fungerer som nødvalg.", level: "specialty" },
  "salsa lizano": { preferred: "Salsa Lizano", substitute: "Worcestershire, brunt sukker og lime", recipe: "Bland Worcestershire med litt brunt sukker, lime og spisskummen.", level: "specialty" },
  "scotch bonnet": { preferred: "scotch bonnet", substitute: "habanero", recipe: "Habanero har lignende fruktighet og varme; bruk svært forsiktig.", level: "specialty" },
  "sticky rice": { preferred: "klebrig ris", substitute: "sushiris", recipe: "Sushiris er ikke identisk, men gir kortkornet klebrighet.", level: "specialty" },
  "syltede sennepsblader": { preferred: "syltede sennepsblader", substitute: "surkål og litt sennep", recipe: "Bland hakket surkål med litt grov sennep.", level: "specialty" },
  "taboonbrød": { preferred: "pita", substitute: "pita", recipe: "Varm pita hardt og kort for litt mer røstet smak.", level: "substitute" },
  "tamarind": { preferred: "tamarindpasta", substitute: "lime og brunt sukker", recipe: "Bland lime med litt brunt sukker for syrlig-søt balanse.", level: "specialty" },
  "tamarindpasta": { preferred: "tamarindpasta", substitute: "lime og brunt sukker", recipe: "Bland lime med litt brunt sukker; juster gradvis.", level: "specialty" },
  "taro": { preferred: "taro", substitute: "søtpotet eller melne poteter", recipe: "Bruk søtpotet for sødme eller potet for nøytral stivelse.", level: "specialty" },
  "taro eller ris": { preferred: "ris", substitute: "ris", recipe: "Ris er lettest tilgjengelig.", level: "substitute" },
  "taro eller yam": { preferred: "søtpotet", substitute: "søtpotet", recipe: "Søtpotet er den mest praktiske norske erstatningen.", level: "substitute" },
  "taroblader": { preferred: "taroblader", substitute: "mangold eller spinat", recipe: "Mangold tåler mer varme; spinat er lettest.", level: "specialty" },
  "tørket ancho-chili": { preferred: "ancho chili", substitute: "røkt paprika og mild chili", recipe: "Bland røkt paprika med litt mild chili og en klype kakao.", level: "specialty" },
  "tørket lime": { preferred: "tørket lime", substitute: "limeskall og litt limesaft", recipe: "Bruk finrevet skall under koking og litt saft til slutt.", level: "specialty" },
  "ugali eller ris": { preferred: "maismel eller polenta", substitute: "polenta", recipe: "Kok polenta fastere enn vanlig.", level: "substitute" },
  "yam": { preferred: "yam", substitute: "søtpotet", recipe: "Søtpotet er enklere og har lignende sødme og tekstur.", level: "specialty" },
  "yuca": { preferred: "cassava eller yuca frossen", substitute: "søtpotet eller potet", recipe: "Søtpotet gir mer sødme; potet er mer nøytral.", level: "specialty" },
  "zhug": { preferred: "zhug", substitute: "koriander, grønn chili og hvitløk", recipe: "Blend koriander, grønn chili, hvitløk, spisskummen, olje og sitron.", level: "substitute" }
}));

const PHRASE_RULES = [
  [/^(.+),\s*(finhakket|revet|skivet|svært tynt skivet)$/i, "$1"],
  [/^(.+),\s*saft( og finrevet skall)?$/i, "$1"],
  [/^(.+)\s+med bein$/i, "$1"],
  [/^(.+)\s+uten bein$/i, "$1"],
  [/^(.+)\s+i biter$/i, "$1"],
  [/^(.+)\s+i store terninger$/i, "$1"],
  [/^(.+)\s+godkjent for rå servering$/i, "$1 sashimikvalitet"],
  [/^helt fersk (.+) egnet for rå servering$/i, "$1 sashimikvalitet"],
  [/^saltlake-sitron eller vanlig sitron$/i, "sitron"],
  [/^vann eller mild kraft$/i, "kraft"],
  [/^tørr hvitvin eller rødvin$/i, "tørr vin"],
  [/^palmesukker eller brunt sukker$/i, "brunt sukker"],
  [/^sukker eller honning$/i, "honning"],
  [/^honning eller yoghurt$/i, "honning"],
  [/^crème fraîche eller matfløte$/i, "crème fraîche"],
  [/^kaldt smør eller god olivenolje$/i, "smør"],
  [/^brunet smør eller god olivenolje$/i, "smør"],
  [/^aromatisk olje eller brunet smør$/i, "smør"],
  [/^friske urter.*$/i, "friske urter"],
  [/^sprø sjalottløk eller ristet mais$/i, "sprøstekt løk"],
  [/^sprø sjalottløk eller ristede frø$/i, "sprøstekt løk"],
  [/^ristede nøtter eller frø$/i, "ristede nøtter"],
  [/^mild urte- eller chiliolje$/i, "chiliolje"],
  [/^mild urteolje$/i, "urteolje"],
];

function cleanName(name) {
  let value = String(name || "").trim();
  for (const [pattern, replacement] of PHRASE_RULES) value = value.replace(pattern, replacement);
  return value.trim();
}

function commonish(name) {
  const lower = name.toLocaleLowerCase("nb-NO");
  if (COMMON_WORDS.has(lower)) return true;
  return [...COMMON_WORDS].some((word) => lower === word || lower.startsWith(`${word} `));
}

export function resolveIngredient(name, mode = "authentic") {
  const original = String(name || "").trim();
  const key = original.toLocaleLowerCase("nb-NO");
  const exact = EXACT_MATCHES.get(key);
  if (exact) {
    const useSubstitute = mode === "easy";
    return {
      original,
      query: useSubstitute ? exact.substitute : exact.preferred,
      preferred: exact.preferred,
      substitute: exact.substitute,
      note: exact.recipe,
      level: exact.level,
      substituted: useSubstitute || exact.level === "substitute",
    };
  }

  const cleaned = cleanName(original);
  if (commonish(cleaned)) {
    return { original, query: cleaned, preferred: cleaned, substitute: null, note: "Vanlig vare i norske dagligvarebutikker.", level: "common", substituted: false };
  }

  const orParts = cleaned.split(/\s+eller\s+/i).map((part) => part.trim()).filter(Boolean);
  if (orParts.length > 1) {
    const common = orParts.find(commonish) || orParts[orParts.length - 1];
    return {
      original,
      query: common,
      preferred: orParts[0],
      substitute: common,
      note: `Oppskriften åpner allerede for alternativet «${common}».`,
      level: "substitute",
      substituted: true,
    };
  }

  return {
    original,
    query: cleaned,
    preferred: cleaned,
    substitute: null,
    note: "Søk på originalnavnet. Kontroller internasjonal hylle eller spesialbutikk dersom vanlig butikk ikke har varen.",
    level: "specialty",
    substituted: false,
  };
}

export function buildShoppingItems(recipe, servings, mode = "authentic") {
  if (!recipe?.ingredients?.length) return [];
  const factor = Number(servings || recipe.servings || 1) / Number(recipe.servings || 1);
  return recipe.ingredients.map((ingredient, index) => ({
    id: `${index}-${ingredient.name}`,
    ...ingredient,
    amountScaled: Number(ingredient.amount) * factor,
    resolution: resolveIngredient(ingredient.name, mode),
  }));
}

export function retailerSearchUrl(retailerId, query) {
  const retailer = RETAILERS[retailerId];
  if (!retailer?.searchUrl) return retailer?.homeUrl || "#";
  return retailer.searchUrl(query);
}
