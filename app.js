import { COUNTRIES, RECIPES, CURATED_CODES } from "./data.js";
import {
  getEntries,
  saveEntry,
  deleteEntry,
  clearEntries,
  getSetting,
  setSetting,
  exportBackup,
  importBackup,
  compressImage,
  downloadJSON,
} from "./db.js";
import {
  initCloud,
  isCloudConfigured,
  getCloudUser,
  sendMagicLink,
  signOutCloud,
  syncEntryToCloud,
  pullCloudEntries,
} from "./cloud.js";
import { createGlobe } from "./globe.js";
import { exportPhotoBook } from "./book-export.js";
import { RETAILERS, buildShoppingItems, retailerSearchUrl } from "./shopping.js";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const byId = (id) => document.getElementById(id);

function createId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  const bytes = new Uint8Array(16);
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = [...bytes].map((value) => value.toString(16).padStart(2, "0"));
    return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10).join("")}`;
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16);
    const value = character === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

const elements = {
  views: $$("[data-view]"),
  navLinks: $$(".nav-link"),
  viewTargets: $$('[data-view-target]'),
  randomizeButton: byId("randomizeButton"),
  randomizeLabel: byId("randomizeLabel"),
  browseCountriesButton: byId("browseCountriesButton"),
  globeCanvas: byId("globeCanvas"),
  globeStage: byId("globeStage"),
  globeFallback: byId("globeFallback"),
  coordinates: byId("coordinates"),
  countryReveal: byId("countryReveal"),
  countryIndex: byId("countryIndex"),
  countryContinent: byId("countryContinent"),
  countryName: byId("countryName"),
  countryDish: byId("countryDish"),
  openMissionButton: byId("openMissionButton"),
  completedMetric: byId("completedMetric"),
  continentMetric: byId("continentMetric"),
  weekendMetric: byId("weekendMetric"),
  experienceSummary: byId("experienceSummary"),
  partySizeValue: byId("partySizeValue"),
  decreasePartySize: byId("decreasePartySize"),
  increasePartySize: byId("increasePartySize"),
  experienceModeButtons: $$('[data-experience-mode]'),
  missionSection: byId("missionSection"),
  missionNumber: byId("missionNumber"),
  missionStatus: byId("missionStatus"),
  missionCountryCode: byId("missionCountryCode"),
  missionRegion: byId("missionRegion"),
  missionCountry: byId("missionCountry"),
  missionCity: byId("missionCity"),
  missionDish: byId("missionDish"),
  missionDescription: byId("missionDescription"),
  missionDifficulty: byId("missionDifficulty"),
  missionTime: byId("missionTime"),
  missionProfile: byId("missionProfile"),
  startRecipeButton: byId("startRecipeButton"),
  lockMissionButton: byId("lockMissionButton"),
  rerollButton: byId("rerollButton"),
  videoFrame: byId("videoFrame"),
  videoPlace: byId("videoPlace"),
  loadVideoButton: byId("loadVideoButton"),
  videoSearchLink: byId("videoSearchLink"),
  factsList: byId("factsList"),
  sourceLabel: byId("sourceLabel"),
  recipeCountryLabel: byId("recipeCountryLabel"),
  recipeSummary: byId("recipeSummary"),
  recipeOriginNote: byId("recipeOriginNote"),
  recipeSafetyNote: byId("recipeSafetyNote"),
  recipeAlternatives: byId("recipeAlternatives"),
  servingsValue: byId("servingsValue"),
  decreaseServings: byId("decreaseServings"),
  increaseServings: byId("increaseServings"),
  recipeModeButtons: $$('[data-recipe-mode]'),
  recipeModeCopy: byId("recipeModeCopy"),
  recipeProgressText: byId("recipeProgressText"),
  recipeProgressBar: byId("recipeProgressBar"),
  finishCookingButton: byId("finishCookingButton"),
  editRecipeButton: byId("editRecipeButton"),
  ingredientGroups: byId("ingredientGroups"),
  signaturePanel: byId("signaturePanel"),
  signatureTweaks: byId("signatureTweaks"),
  recipeSteps: byId("recipeSteps"),
  balanceGrid: byId("balanceGrid"),
  platingCopy: byId("platingCopy"),
  copyShoppingButton: byId("copyShoppingButton"),
  openShoppingDialogButton: byId("openShoppingDialogButton"),
  shoppingDialog: byId("shoppingDialog"),
  closeShoppingDialog: byId("closeShoppingDialog"),
  shoppingDialogTitle: byId("shoppingDialogTitle"),
  shoppingRecipeLabel: byId("shoppingRecipeLabel"),
  shoppingServingsLabel: byId("shoppingServingsLabel"),
  shoppingItemCount: byId("shoppingItemCount"),
  retailerGrid: byId("retailerGrid"),
  shoppingModeButtons: $$('[data-shopping-mode]'),
  shoppingRetailerNote: byId("shoppingRetailerNote"),
  shoppingItems: byId("shoppingItems"),
  shoppingSubstitutionCount: byId("shoppingSubstitutionCount"),
  shoppingFooterTitle: byId("shoppingFooterTitle"),
  shoppingFooterCopy: byId("shoppingFooterCopy"),
  copyRetailerListButton: byId("copyRetailerListButton"),
  downloadRetailerListButton: byId("downloadRetailerListButton"),
  openRetailerButton: byId("openRetailerButton"),
  albumSearch: byId("albumSearch"),
  continentFilter: byId("continentFilter"),
  albumSort: byId("albumSort"),
  albumCountryCount: byId("albumCountryCount"),
  albumPhotoCount: byId("albumPhotoCount"),
  albumAverageRating: byId("albumAverageRating"),
  albumTotalCost: byId("albumTotalCost"),
  albumGrid: byId("albumGrid"),
  albumEmpty: byId("albumEmpty"),
  printCookbookButton: byId("printCookbookButton"),
  exportBackupButton: byId("exportBackupButton"),
  importBackupInput: byId("importBackupInput"),
  profileExportButton: byId("profileExportButton"),
  resetDataButton: byId("resetDataButton"),
  progressPercent: byId("progressPercent"),
  worldProgressBar: byId("worldProgressBar"),
  bookProgressCopy: byId("bookProgressCopy"),
  cookbookChapters: byId("cookbookChapters"),
  bookCount: byId("bookCount"),
  printCookbook: byId("printCookbook"),
  bookFormatSelect: byId("bookFormatSelect"),
  bookVolumeSizeSelect: byId("bookVolumeSizeSelect"),
  bookTitleInput: byId("bookTitleInput"),
  bookIncludeOriginals: byId("bookIncludeOriginals"),
  exportPhotoBookButton: byId("exportPhotoBookButton"),
  bookPageEstimate: byId("bookPageEstimate"),
  bookExportProgress: byId("bookExportProgress"),
  bookExportStatus: byId("bookExportStatus"),
  bookExportProgressText: byId("bookExportProgressText"),
  bookExportProgressBar: byId("bookExportProgressBar"),
  timerDock: byId("timerDock"),
  timerStepLabel: byId("timerStepLabel"),
  timerDisplay: byId("timerDisplay"),
  timerToggleButton: byId("timerToggleButton"),
  timerCloseButton: byId("timerCloseButton"),
  completionDialog: byId("completionDialog"),
  completionForm: byId("completionForm"),
  completionTitle: byId("completionTitle"),
  photoInput: byId("photoInput"),
  photoPreviewGrid: byId("photoPreviewGrid"),
  cookedAtInput: byId("cookedAtInput"),
  actualMinutesInput: byId("actualMinutesInput"),
  costInput: byId("costInput"),
  rolesInput: byId("rolesInput"),
  twistInput: byId("twistInput"),
  notesInput: byId("notesInput"),
  nextTimeInput: byId("nextTimeInput"),
  memoryInput: byId("memoryInput"),
  completionStorageNote: byId("completionStorageNote"),
  entryDialog: byId("entryDialog"),
  entryDetail: byId("entryDetail"),
  profileButton: byId("profileButton"),
  profileDialog: byId("profileDialog"),
  cloudStatusText: byId("cloudStatusText"),
  profileModeHeading: byId("profileModeHeading"),
  profileModeCopy: byId("profileModeCopy"),
  cloudEmailInput: byId("cloudEmailInput"),
  magicLinkButton: byId("magicLinkButton"),
  syncNowButton: byId("syncNowButton"),
  signOutButton: byId("signOutButton"),
  countryBrowserDialog: byId("countryBrowserDialog"),
  closeCountryBrowser: byId("closeCountryBrowser"),
  countrySearchInput: byId("countrySearchInput"),
  countryBrowserGrid: byId("countryBrowserGrid"),
  recipeEditorDialog: byId("recipeEditorDialog"),
  recipeEditorForm: byId("recipeEditorForm"),
  editorTweaksInput: byId("editorTweaksInput"),
  editorPlatingInput: byId("editorPlatingInput"),
  motionButton: byId("motionButton"),
  toast: byId("toast"),
  confettiCanvas: byId("confettiCanvas"),
};

const EXPERIENCE_MODES = {
  date: { label: "Date", size: 2 },
  family: { label: "Familie", size: 4 },
  friends: { label: "Venner", size: 6 },
  solo: { label: "Solo", size: 1 },
};

const state = {
  entries: [],
  currentCountry: null,
  lockedMission: null,
  recipeDrafts: {},
  recipeMode: "original",
  shoppingRetailer: "oda",
  shoppingMode: "authentic",
  shoppingExcluded: new Set(),
  experienceMode: "date",
  partySize: 2,
  servings: 2,
  completedSteps: new Set(),
  pendingPhotos: [],
  ratings: { person1: 0, person2: 0 },
  randomizing: false,
  globe: null,
  motionPaused: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  timer: { interval: null, remaining: 0, running: false, label: "Timer" },
};

const localeDate = new Intl.DateTimeFormat("nb-NO", { day: "numeric", month: "long", year: "numeric" });
const localeMoney = new Intl.NumberFormat("nb-NO", { style: "currency", currency: "NOK", maximumFractionDigits: 0 });

function escapeHTML(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function nextWeekend() {
  const now = new Date();
  const days = (6 - now.getDay() + 7) % 7;
  const saturday = new Date(now);
  saturday.setHours(12, 0, 0, 0);
  saturday.setDate(now.getDate() + days);
  const sunday = new Date(saturday);
  sunday.setDate(saturday.getDate() + 1);
  const format = new Intl.DateTimeFormat("nb-NO", { day: "numeric", month: "short" });
  return { label: `${format.format(saturday)}–${format.format(sunday)}`, key: saturday.toISOString().slice(0, 10) };
}

function showToast(message, duration = 2600) {
  elements.toast.textContent = message;
  elements.toast.classList.add("is-visible");
  clearTimeout(showToast.timeout);
  showToast.timeout = setTimeout(() => elements.toast.classList.remove("is-visible"), duration);
}

function showView(name, { scroll = true } = {}) {
  elements.views.forEach((view) => view.classList.toggle("is-active", view.dataset.view === name));
  elements.navLinks.forEach((button) => button.classList.toggle("is-active", button.dataset.viewTarget === name));
  history.replaceState(null, "", `#${name}`);
  if (scroll) window.scrollTo({ top: 0, behavior: state.motionPaused ? "auto" : "smooth" });
  if (name === "album") renderAlbum();
  if (name === "kokebok") renderCookbook();
  if (name === "oppskrift") renderRecipe();
}

function averageRating(entry) {
  const values = [Number(entry.ratingPerson1), Number(entry.ratingPerson2)].filter((value) => value > 0);
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function completedCountryCodes() {
  return new Set(state.entries.map((entry) => entry.countryCode));
}

function currentRecipe() {
  if (!state.currentCountry) return null;
  return RECIPES[state.currentCountry.code] ?? null;
}

const BISTRO_PROFILE_LIBRARY = {
  rawSeafood: {
    name: "Rå sjømat / frisk servering",
    ingredients: [
      { group: "Bistro-finish", name: "lime, saft og finrevet skall", amount: 1, unit: "stk" },
      { group: "Bistro-finish", name: "friske urter (koriander, gressløk eller dill)", amount: 0.5, unit: "bunt" },
      { group: "Bistro-finish", name: "mild urteolje", amount: 2, unit: "ss" },
      { group: "Bistro-finish", name: "sprø sjalottløk eller ristet mais", amount: 2, unit: "ss", optional: true },
    ],
    moves: [
      "Hold hovedråvaren iskald og gjør all kutting før syren tilsettes.",
      "Bygg friskhet med lime og urteolje, men la råvarens egen smak være sentrum.",
      "Legg til én sprø kontrast og server på kalde tallerkener med presis, luftig plating.",
    ],
    finishInstruction: "Vend inn lime og urter helt til slutt. Legg urteolje rundt – ikke over – hovedkomponenten, og avslutt med den sprø kontrasten rett før servering.",
    finishCue: "Retten er blank og frisk, ikke våt; syren løfter råvaren uten å overdøve den.",
    finishTip: "Dette er Bistro-versjonen: mer presis syre, renere linjer og tydelig tekstur – uten å marinere råvaren i stykker.",
    plating: "Bruk en kald, lys tallerken. Plasser hovedkomponenten lavt og samlet, legg urteolje i små dråper rundt, og avslutt med sprø topping og urter i høyden.",
  },
  cookedSeafood: {
    name: "Fisk og sjømat",
    ingredients: [
      { group: "Bistro-finish", name: "sitron, saft og finrevet skall", amount: 1, unit: "stk" },
      { group: "Bistro-finish", name: "kaldt smør til blank saus", amount: 30, unit: "g" },
      { group: "Bistro-finish", name: "friske urter (dill, persille eller gressløk)", amount: 0.5, unit: "bunt" },
      { group: "Bistro-finish", name: "panko eller fine brødsmuler", amount: 30, unit: "g", optional: true },
    ],
    moves: [
      "Tørk fisken godt og prioriter stekeskorpe før varmebehandlingen fullføres skånsomt.",
      "Monter saus eller kraft med kaldt smør og sitron for glans, syre og restaurantfølelse.",
      "Bruk urter og en lett sprø topping som kontrast – ikke mer fløte og ost enn retten tåler.",
    ],
    finishInstruction: "Trekk pannen av varmen. Pisk inn kaldt smør litt etter litt, smak til med sitron og vend inn urter. Dryss eventuell panko over rett før servering.",
    finishCue: "Sausen er blank og lett syrlig, fisken flaker seg saftig, og toppingen er fortsatt sprø.",
    finishTip: "Bistro skal føles rikere, men ikke tyngre: smør gir glans, mens sitron og urter holder smaken våken.",
    plating: "Legg saus først, plasser fisken med den peneste stekesiden opp, og avslutt med urter, sitronskall og en kontrollert stripe sprø topping.",
  },
  stew: {
    name: "Gryte, curry og langtidskokt",
    ingredients: [
      { group: "Bistro-finish", name: "kaldt smør eller god olivenolje", amount: 25, unit: "g" },
      { group: "Bistro-finish", name: "sitron eller mild eddik", amount: 1, unit: "ss" },
      { group: "Bistro-finish", name: "friske urter som passer retten", amount: 0.5, unit: "bunt" },
      { group: "Bistro-finish", name: "sprøstekt løk", amount: 30, unit: "g", optional: true },
    ],
    moves: [
      "Brun hovedråvaren i små omganger og kok ut pannen, slik at sausen får en dypere bistrobase.",
      "Reduser sausen til den fester seg til baksiden av en skje før fett og syre justeres.",
      "Avslutt med urter og én sprø kontrast, slik at langtidskokt mat får både friskhet og høyde.",
    ],
    finishInstruction: "Løft hovedkomponenten ut om nødvendig og reduser sausen til ønsket konsistens. Trekk av varmen, monter med smør eller olje og balanser med syre. Vend hovedkomponenten tilbake.",
    finishCue: "Sausen er konsentrert og blank, men ikke fet; en skje trukket gjennom etterlater et tydelig spor.",
    finishTip: "Ikke skjul den autentiske krydderprofilen. Bistrogrepet ligger i bruningen, reduksjonen, balansen og serveringen.",
    plating: "Bruk varm, dyp tallerken. Legg base eller tilbehør først, plasser hovedkomponenten samlet og øs blank saus rundt. Avslutt med urter og sprøstekt løk.",
  },
  grill: {
    name: "Grillet og hardt stekt",
    ingredients: [
      { group: "Bistro-finish", name: "kaldt smør", amount: 30, unit: "g" },
      { group: "Bistro-finish", name: "Dijon-sennep", amount: 1, unit: "ts" },
      { group: "Bistro-finish", name: "sitron", amount: 0.5, unit: "stk" },
      { group: "Bistro-finish", name: "persille eller timian", amount: 0.5, unit: "bunt" },
    ],
    moves: [
      "Tørk råvaren, salt i riktig tid og bruk høy varme for en mørk, kontrollert stekeskorpe.",
      "Kok ut pannen og bygg en liten blank panne- eller hvilesaus med Dijon, smør og sitron.",
      "Skjær presist på tvers av fibrene og server med saus rundt kjøttet – ikke druknet over.",
    ],
    finishInstruction: "La hovedråvaren hvile. Kok ut pannen med litt vann eller kraft, visp inn Dijon og kaldt smør, smak til med sitron og urter, og vend inn hvilesaften.",
    finishCue: "Sausen er blank og emulgert, stekeskorpen er tørr og mørk, og kjøttsaften blir i skivene.",
    finishTip: "Bistro-effekten kommer fra hard bruning, korrekt hvile og en liten konsentrert saus – ikke store mengder fløte.",
    plating: "Skjær hovedråvaren i jevne skiver, len dem mot tilbehøret og legg panne­sausen i en kontrollert bue. Avslutt med urter og en frisk detalj.",
  },
  pasta: {
    name: "Pasta og kremet bistro",
    ingredients: [
      { group: "Bistro-finish", name: "Dijon-sennep", amount: 1, unit: "ts", optional: true },
      { group: "Bistro-finish", name: "crème fraîche eller matfløte", amount: 1, unit: "dl", optional: true },
      { group: "Bistro-finish", name: "finrevet parmesan", amount: 35, unit: "g", optional: true },
      { group: "Bistro-finish", name: "sitron, saft og finrevet skall", amount: 0.5, unit: "stk" },
      { group: "Bistro-finish", name: "persille eller timian", amount: 0.5, unit: "bunt" },
    ],
    moves: [
      "Bygg smak med hard bruning av sopp, kjøtt eller grønnsaker før væsken tilsettes.",
      "Reduser sausen og bruk bare nok crème fraîche, fløte eller ost til silkemyk konsistens.",
      "Avslutt med sitron, urter og litt pastavann slik at sausen blir blank og henger rundt hver bit.",
    ],
    finishInstruction: "Reduser sausen til den er konsentrert. Vend inn pasta eller hovedkomponent med litt kokevann, og trekk av varmen før eventuell crème fraîche, parmesan, sitron og urter røres inn.",
    finishCue: "Sausen legger seg som et tynt, blankt lag rundt maten og samler seg ikke som en tung dam i bunnen.",
    finishTip: "Bistro betyr silkemyk og konsentrert – ikke mest mulig fløte. Syre og urter skal være tydelige i avslutningen.",
    plating: "Tvinn eller samle porsjonen med høyde i midten. Legg saus rundt, riv eventuelt litt parmesan fint over og avslutt med urter og sitronskall.",
  },
  grain: {
    name: "Ris, nudler og korn",
    ingredients: [
      { group: "Bistro-finish", name: "aromatisk olje eller brunet smør", amount: 1.5, unit: "ss" },
      { group: "Bistro-finish", name: "sitron eller lime", amount: 1, unit: "stk" },
      { group: "Bistro-finish", name: "friske urter eller vårløk", amount: 0.5, unit: "bunt" },
      { group: "Bistro-finish", name: "ristede nøtter eller frø", amount: 30, unit: "g", optional: true },
    ],
    moves: [
      "Bevar tydelig struktur i ris, nudler eller korn; bistroversjonen skal ikke bli mykere enn originalen.",
      "Tilfør aromatisk fett og frisk syre helt mot slutten, tilpasset matkulturens egen smakspalett.",
      "Server med urter og ristede nøtter eller frø for høyde, duft og kontrast.",
    ],
    finishInstruction: "Løsne korn eller nudler forsiktig. Vend inn aromatisk olje eller brunet smør, frisk syre og urter uten å knuse strukturen. Avslutt med ristet crunch.",
    finishCue: "Hvert korn eller hver nudel er tydelig, smaken er blank og aromatisk, og toppingen beholder bittet.",
    finishTip: "Velg fett etter retten: sesam- eller chiliolje i asiatiske profiler, brunet smør eller olivenolje der det passer bedre.",
    plating: "Samle risen eller nudlene i en ren form, legg hovedkomponenten synlig over og avslutt med urter, syre og ristet crunch i tydelige lag.",
  },
  pastry: {
    name: "Bakverk, pai og fylte deiger",
    ingredients: [
      { group: "Bistro-finish", name: "crème fraîche eller yoghurt", amount: 1, unit: "dl" },
      { group: "Bistro-finish", name: "sitron", amount: 0.5, unit: "stk" },
      { group: "Bistro-finish", name: "friske urter", amount: 0.5, unit: "bunt" },
      { group: "Bistro-finish", name: "ristede frø", amount: 20, unit: "g", optional: true },
    ],
    moves: [
      "Prioriter sprø, godt gjennomstekt bunn og la fyllet avkjøles nok før montering.",
      "Lag en frisk urtekrem med sitron som motvekt til smør, deig og fyll.",
      "Skjær presist og server med en liten salat eller friske urter for et lettere bistrouttrykk.",
    ],
    finishInstruction: "Rør sammen crème fraîche eller yoghurt med sitron og urter. La bakverket hvile før det skjæres, og server urtekremen ved siden av med ristede frø over.",
    finishCue: "Bunnen er tørr og sprø, snittet holder formen, og urtekremen er frisk nok til å balansere bakverket.",
    finishTip: "Ikke legg krem under varm deig; server den ved siden av så sprøheten bevares.",
    plating: "Plasser et rent snitt av bakverket litt utenfor sentrum, legg urtekrem i en skjeform ved siden av og avslutt med urter og ristede frø.",
  },
  freshSavory: {
    name: "Frisk, varm bistro",
    ingredients: [
      { group: "Bistro-finish", name: "lime eller sitron", amount: 1, unit: "stk" },
      { group: "Bistro-finish", name: "friske urter", amount: 1, unit: "bunt" },
      { group: "Bistro-finish", name: "mild urte- eller chiliolje", amount: 1.5, unit: "ss" },
      { group: "Bistro-finish", name: "sprø sjalottløk eller ristede frø", amount: 25, unit: "g", optional: true },
    ],
    moves: [
      "Brun eventuell kjøtt- eller grønnsaksbase raskt og hardt, men behold saftighet og tydelig struktur.",
      "Tilsett syre og urter etter at varmen er slått av, slik at smaken forblir frisk og aromatisk.",
      "Avslutt med en kontrollert olje og én sprø kontrast for bistrofølelse uten tung saus.",
    ],
    finishInstruction: "Trekk pannen av varmen. Vend inn lime eller sitron, friske urter og en liten mengde aromatisk olje. Smak til, og legg sprø topping på rett før servering.",
    finishCue: "Retten er varm og saftig, men urtene dufter friskt og den sprø toppingen har tydelig bitt.",
    finishTip: "Bistro-grepet her er kontrast: hard bruning mot frisk syre, varme mot urter og mykt mot sprøtt.",
    plating: "Samle hovedkomponenten i en lav, ren form. Legg friske urter og sprø topping over i siste sekund, og bruk olje eller saus i små kontrollerte dråper.",
  },
  vegetable: {
    name: "Grønnsaksdrevet",
    ingredients: [
      { group: "Bistro-finish", name: "brunet smør eller god olivenolje", amount: 2, unit: "ss" },
      { group: "Bistro-finish", name: "sitron eller mild eddik", amount: 1, unit: "ss" },
      { group: "Bistro-finish", name: "friske urter", amount: 0.5, unit: "bunt" },
      { group: "Bistro-finish", name: "ristede nøtter eller frø", amount: 30, unit: "g" },
    ],
    moves: [
      "Gi hovedgrønnsaken tydelig karamellisering og behold en kjerne med struktur.",
      "Bruk brunet smør eller olivenolje for dybde og syre for å holde retten levende.",
      "Legg inn ristede nøtter eller frø og friske urter, slik at grønnsaken får både kontrast og restaurantpreg.",
    ],
    finishInstruction: "Karamelliser hovedgrønnsaken ferdig. Vend inn brunet smør eller olivenolje, juster med syre og urter, og avslutt med ristede nøtter eller frø.",
    finishCue: "Grønnsaken har mørke, søte kanter og saftig kjerne; syren er tydelig uten å dominere.",
    finishTip: "La grønnsaken være hovedperson. Bistrogrepet skal forsterke den, ikke skjule den under saus og ost.",
    plating: "Bygg tallerkenen rundt hovedgrønnsaken, legg fett eller saus som støtte og bruk urter og ristede elementer som presise kontraster.",
  },
};

function recipeText(recipe, country) {
  return [country?.dish, country?.profile, recipe?.summary, ...(recipe?.ingredients || []).map((item) => item.name)].join(" ").toLowerCase();
}

function bistroProfile(recipe, country) {
  const dish = (country?.dish || "").toLowerCase();
  const primary = (country?.profile || "").split("·")[0].trim().toLowerCase();
  const text = recipeText(recipe, country).replaceAll("fiskesaus", "").replaceAll("fish sauce", "");
  const main = `${dish} ${primary}`;
  if (/sushi|ceviche|tartar|rå fisk|sashimi|kokoda/.test(dish)) return BISTRO_PROFILE_LIBRARY.rawSeafood;
  if (/larb|salat|salad|tabbouleh/.test(dish)) return BISTRO_PROFILE_LIBRARY.freshSavory;
  if (/\bfisk\b|\bfish\b|laks|torsk|tunfisk|reke|scampi|blekksprut|octopus|conch|hummer|krabbe|seafood|langouste|bacalhau|saltfish/.test(main)) return BISTRO_PROFILE_LIBRARY.cookedSeafood;
  if (/pasta|spaghetti|tagliatelle|nudl|makaroni|lasagn|stroganoff/.test(main)) return BISTRO_PROFILE_LIBRARY.pasta;
  if (/pai|deig|brød|bakverk|dumpling|pierogi|samosa|empanada|salteña|banitsa|khachapuri|pizza/.test(main)) return BISTRO_PROFILE_LIBRARY.pastry;
  if (/grill|barbecue|bbq|asado|schnitzel|kebab|steak|biff|entrecôte|ytrefilet|brisket|khorovats|nyama choma/.test(main)) return BISTRO_PROFILE_LIBRARY.grill;
  if (/gryte|stuing|curry|suppe|wat|tagine|ragù|ragu|gulasj|gulyás|feijoada|bobotie|moamba|mansaf|cassoulet/.test(main)) return BISTRO_PROFILE_LIBRARY.stew;
  if (/ris|rice|nudl|couscous|bulgur|quinoa|polenta|mais|nsima|ugali|sadza|plov|palaw|biryani|paella/.test(main)) return BISTRO_PROFILE_LIBRARY.grain;
  if (/\bfisk\b|\bfish\b|laks|torsk|tunfisk|reke|scampi|blekksprut|octopus|conch|hummer|krabbe|seafood/.test(text)) return BISTRO_PROFILE_LIBRARY.cookedSeafood;
  if (!/kylling|lam|storf|svin|kjøtt|fisk|egg/.test(text)) return BISTRO_PROFILE_LIBRARY.vegetable;
  return BISTRO_PROFILE_LIBRARY.stew;
}

function buildBistroRecipe(base, country) {
  if (!base) return null;
  const profile = bistroProfile(base, country);
  const draft = state.recipeDrafts[country.code];
  const customMoves = draft?.signatureTweaks?.length ? draft.signatureTweaks : [];
  const moves = customMoves.length ? customMoves : [...profile.moves, ...(base.signatureTweaks || []).slice(0, 1)];
  const steps = base.steps.map((step, index) => ({
    ...step,
    tip: index === 0
      ? `${step.tip} Bistro: jobb ryddig og bygg sterkere smak gjennom kontrollert bruning og presis mise en place.`
      : step.tip,
  }));
  steps.push({
    title: "Bistro-finish",
    minutes: 8,
    heat: "Lav / av",
    instruction: profile.finishInstruction,
    cue: profile.finishCue,
    tip: profile.finishTip,
  });
  return {
    ...base,
    summary: `Bistro-tolkning av ${country.dish}: den autentiske teknikken beholdes, mens bruning, saus, syre, tekstur og plating løftes mot restaurantnivå uten å gjøre retten unødvendig tung.`,
    ingredients: [...base.ingredients, ...profile.ingredients],
    steps,
    signatureTweaks: moves,
    balance: {
      ...base.balance,
      acid: "Avslutt med presis syre som løfter sausen eller hovedråvaren. Smaken skal bli klarere, ikke bare surere.",
      fat: "Bruk fett til stekeskorpe, emulsjon og glans. Bistroversjonen skal være rik, men aldri legge igjen et tungt belegg.",
      crunch: "Legg inn én bevisst sprø kontrast rett før servering og beskytt den mot fukt.",
    },
    plating: draft?.plating || profile.plating,
    bistroProfile: profile.name,
    versionLabel: "Bistro",
  };
}

function activeRecipe() {
  const base = currentRecipe();
  if (!base || !state.currentCountry) return base;
  return state.recipeMode === "bistro" ? buildBistroRecipe(base, state.currentCountry) : { ...base, versionLabel: "Autentisk" };
}

function scaledAmount(amount, baseServings) {
  const raw = Number(amount) * (state.servings / baseServings);
  if (!Number.isFinite(raw)) return amount;
  if (raw < 1) return Math.round(raw * 100) / 100;
  if (raw < 10) return Math.round(raw * 10) / 10;
  return Math.round(raw);
}

function formatAmount(amount) {
  return new Intl.NumberFormat("nb-NO", { maximumFractionDigits: 2 }).format(amount);
}

function renderExperiencePlanner() {
  const config = EXPERIENCE_MODES[state.experienceMode] ?? EXPERIENCE_MODES.date;
  elements.experienceSummary.textContent = `${config.label} · ${state.partySize} ${state.partySize === 1 ? "person" : "personer"}`;
  elements.partySizeValue.textContent = state.partySize;
  elements.experienceModeButtons.forEach((button) => button.classList.toggle("is-active", button.dataset.experienceMode === state.experienceMode));
}

async function setExperienceMode(mode) {
  const config = EXPERIENCE_MODES[mode];
  if (!config) return;
  state.experienceMode = mode;
  state.partySize = config.size;
  state.servings = config.size;
  elements.servingsValue.textContent = state.servings;
  await setSetting("experienceMode", state.experienceMode);
  await setSetting("partySize", state.partySize);
  renderExperiencePlanner();
  renderRecipe();
}

async function changePartySize(delta) {
  state.partySize = Math.max(1, Math.min(12, state.partySize + delta));
  state.servings = state.partySize;
  elements.servingsValue.textContent = state.servings;
  await setSetting("partySize", state.partySize);
  renderExperiencePlanner();
  renderRecipe();
}

function renderMetrics() {
  const codes = completedCountryCodes();
  const continents = new Set(state.entries.map((entry) => COUNTRIES.find((country) => country.code === entry.countryCode)?.continent).filter(Boolean));
  elements.completedMetric.textContent = codes.size;
  elements.continentMetric.textContent = continents.size;
  elements.weekendMetric.textContent = nextWeekend().label;
}

function renderMission(country) {
  if (!country) return;
  state.currentCountry = country;
  setSetting("currentCountry", country.code);
  const index = COUNTRIES.indexOf(country) + 1;
  elements.countryReveal.hidden = false;
  elements.countryIndex.textContent = `${String(index).padStart(3, "0")} / ${String(COUNTRIES.length).padStart(3, "0")}`;
  elements.countryContinent.textContent = country.continent;
  elements.countryName.textContent = country.name;
  elements.countryDish.textContent = country.dish;
  elements.coordinates.textContent = `${Math.abs(country.lat).toFixed(2)}° ${country.lat >= 0 ? "N" : "S"} · ${Math.abs(country.lon).toFixed(2)}° ${country.lon >= 0 ? "E" : "W"}`;
  elements.missionNumber.textContent = String(index).padStart(2, "0");
  elements.missionCountryCode.textContent = country.code;
  elements.missionRegion.textContent = country.continent;
  elements.missionCountry.textContent = country.name;
  elements.missionCity.textContent = country.city;
  elements.missionDish.textContent = country.dish;
  elements.missionDescription.textContent = country.description;
  elements.missionDifficulty.textContent = country.difficulty;
  elements.missionTime.textContent = country.time;
  elements.missionProfile.textContent = country.profile;
  elements.startRecipeButton.disabled = false;
  elements.lockMissionButton.disabled = false;
  elements.rerollButton.disabled = false;
  elements.randomizeLabel.textContent = "Trekk et annet land";
  elements.videoPlace.textContent = `${country.city} · ${country.name}`;
  elements.videoSearchLink.href = `https://www.youtube.com/results?search_query=${encodeURIComponent(country.videoQuery)}`;
  elements.loadVideoButton.disabled = false;
  elements.loadVideoButton.textContent = country.videoId ? "Spill av film" : "Finn stemningsfilm";
  elements.videoFrame.innerHTML = `
    <div class="video-placeholder">
      <span class="play-symbol" aria-hidden="true">▶</span>
      <strong>${escapeHTML(country.city)} · ${escapeHTML(country.name)}</strong>
      <small>${country.videoId ? "Klar til å spille av uten informasjonskapsler fra YouTube." : "Åpner et kuratert videosøk for landet."}</small>
    </div>`;
  renderFacts(country);
  updateMissionLockUI();
  state.completedSteps.clear();
  state.servings = state.partySize || RECIPES[country.code]?.servings || 2;
  elements.servingsValue.textContent = state.servings;
  state.globe?.focus(country);
  renderRecipe();
}

function renderFacts(country) {
  if (country.facts?.length) {
    elements.factsList.innerHTML = country.facts.map((fact, index) => `
      <div class="fact-item"><span>0${index + 1}</span><p>${escapeHTML(fact)}</p></div>`).join("");
  } else {
    elements.factsList.innerHTML = `
      <div class="fact-item"><span>01</span><p>${escapeHTML(country.description)}</p></div>
      <div class="fact-item"><span>02</span><p>Landkortet er klart, mens den utvidede fakta- og oppskriftsredaksjonen fortsatt kurateres.</p></div>`;
  }
  elements.sourceLabel.textContent = country.sourceLabel;
  if (country.sourceUrl) {
    elements.sourceLabel.href = country.sourceUrl;
    elements.sourceLabel.hidden = false;
  } else {
    elements.sourceLabel.removeAttribute("href");
    elements.sourceLabel.hidden = false;
  }
}

function updateMissionLockUI() {
  const isLocked = state.lockedMission?.countryCode === state.currentCountry?.code && state.lockedMission?.weekend === nextWeekend().key;
  elements.missionStatus.textContent = isLocked ? `Låst for ${nextWeekend().label}` : "Ikke låst";
  elements.missionStatus.classList.toggle("is-locked", isLocked);
  elements.lockMissionButton.textContent = isLocked ? "Lås opp" : "Lås helgen";
}

function chooseRandomCountry() {
  const completed = completedCountryCodes();
  const currentCode = state.currentCountry?.code;
  const curatedPool = COUNTRIES.filter((country) => CURATED_CODES.includes(country.code) && !completed.has(country.code) && country.code !== currentCode);
  if (curatedPool.length) return curatedPool[Math.floor(Math.random() * curatedPool.length)];
  let pool = COUNTRIES.filter((country) => !completed.has(country.code) && country.code !== currentCode);
  if (!pool.length) pool = COUNTRIES.filter((country) => country.code !== currentCode);
  return pool[Math.floor(Math.random() * pool.length)];
}

async function runRandomizer({ scrollToMission = false } = {}) {
  if (state.randomizing) return;
  state.randomizing = true;
  elements.randomizeButton.disabled = true;
  elements.rerollButton.disabled = true;
  elements.randomizeLabel.textContent = "Kloden velger …";
  elements.countryReveal.hidden = false;
  const finalCountry = chooseRandomCountry();
  const duration = state.motionPaused ? 240 : 1750;
  const started = performance.now();
  let previousSwap = 0;

  await new Promise((resolve) => {
    function frame(now) {
      const elapsed = now - started;
      const progress = Math.min(1, elapsed / duration);
      const interval = 45 + progress ** 3 * 260;
      if (elapsed - previousSwap > interval) {
        const preview = COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)];
        elements.countryName.textContent = preview.name;
        elements.countryDish.textContent = preview.dish;
        elements.countryContinent.textContent = preview.continent;
        state.globe?.spin(0.065 * (1 - progress));
        previousSwap = elapsed;
      }
      if (elapsed < duration) requestAnimationFrame(frame);
      else resolve();
    }
    requestAnimationFrame(frame);
  });

  renderMission(finalCountry);
  elements.randomizeButton.disabled = false;
  elements.rerollButton.disabled = false;
  state.randomizing = false;
  showToast(`${finalCountry.name}: ${finalCountry.dish}`);
  if (scrollToMission) elements.missionSection.scrollIntoView({ behavior: state.motionPaused ? "auto" : "smooth" });
}

function renderRecipe() {
  const country = state.currentCountry;
  const recipe = activeRecipe();
  document.body.dataset.recipeMode = state.recipeMode;
  if (!country) {
    elements.recipeCountryLabel.textContent = "Ingen destinasjon";
    elements.recipeSummary.textContent = "Trekk et land først. Alle 197 destinasjoner har komplett oppskrift med mise en place, varme, tid og sansekriterier.";
    elements.recipeOriginNote.textContent = "Representativ rett og regionale alternativer vises her.";
    elements.recipeSafetyNote.textContent = "Tilpasset sikkerhetsnotat vises her.";
    elements.recipeAlternatives.textContent = "—";
    elements.recipeModeCopy.textContent = state.recipeMode === "bistro"
      ? "Bistro · velg et land for en rettstypebevisst restauranttolkning."
      : "Autentisk · rettens tradisjonelle utgangspunkt, teknikk og smaksidentitet.";
    elements.ingredientGroups.innerHTML = "<p>Ingen oppskrift valgt ennå.</p>";
    elements.recipeSteps.innerHTML = "<p>Stegene vises her.</p>";
    elements.balanceGrid.innerHTML = "<p>Smaksprofil vises her.</p>";
    elements.platingCopy.textContent = "Serveringsplan vises her.";
    elements.finishCookingButton.disabled = true;
    elements.editRecipeButton.disabled = true;
    renderRecipeProgress(0);
    return;
  }

  elements.recipeCountryLabel.textContent = `${country.name} · ${country.dish}`;
  elements.servingsValue.textContent = state.servings;
  elements.finishCookingButton.disabled = false;
  elements.editRecipeButton.disabled = false;

  if (!recipe) {
    renderUncuratedRecipe(country);
    return;
  }

  elements.recipeSummary.textContent = recipe.summary;
  elements.recipeModeCopy.textContent = state.recipeMode === "bistro"
    ? `Bistro · ${recipe.bistroProfile || "restauranttolkning"}: autentisk kjerne, mer stekeskorpe, balanse, tekstur og plating.`
    : "Autentisk · rettens tradisjonelle utgangspunkt, teknikk og smaksidentitet.";
  elements.recipeOriginNote.textContent = state.recipeMode === "bistro"
    ? `${recipe.originNote || country.editorialNote || "Representativ rett med regionale variasjoner."} Bistro er en moderne personlig tolkning, ikke en påstand om tradisjonell autentisitet.`
    : (recipe.originNote || country.editorialNote || "Representativ rett med regionale variasjoner.");
  elements.recipeSafetyNote.textContent = recipe.safetyNote || "Arbeid rent og hold råvarene ved trygg temperatur.";
  elements.recipeAlternatives.textContent = (recipe.alternatives || country.alternatives || []).join(" · ") || "Ingen alternativer registrert";
  const groups = Map.groupBy ? Map.groupBy(recipe.ingredients, (item) => item.group) : recipe.ingredients.reduce((map, item) => {
    if (!map.has(item.group)) map.set(item.group, []);
    map.get(item.group).push(item);
    return map;
  }, new Map());
  elements.ingredientGroups.classList.remove("empty-state");
  elements.ingredientGroups.innerHTML = [...groups.entries()].map(([group, ingredients]) => `
    <div class="ingredient-group">
      <h3>${escapeHTML(group)}</h3>
      <ul class="ingredient-list">
        ${ingredients.map((ingredient) => `
          <li>
            <span class="ingredient-amount">${formatAmount(scaledAmount(ingredient.amount, recipe.servings))} ${escapeHTML(ingredient.unit)}</span>
            <span>${escapeHTML(ingredient.name)} ${ingredient.optional ? '<small class="optional-label">valgfritt</small>' : ""}</span>
          </li>`).join("")}
      </ul>
    </div>`).join("");

  const showBistro = state.recipeMode === "bistro";
  elements.signaturePanel.hidden = !showBistro;
  elements.signatureTweaks.innerHTML = (recipe.signatureTweaks || []).map((tweak, index) => `
    <article class="signature-card"><span>VB-${String(index + 1).padStart(2, "0")}</span><p>${escapeHTML(tweak)}</p></article>`).join("");

  elements.recipeSteps.classList.remove("empty-state");
  elements.recipeSteps.innerHTML = recipe.steps.map((step, index) => {
    const complete = state.completedSteps.has(index);
    return `
      <article class="step-card ${complete ? "is-complete" : ""}" data-step-card="${index}">
        <div class="step-header">
          <input class="step-check" type="checkbox" aria-label="Marker steg ${index + 1} som ferdig" data-step-check="${index}" ${complete ? "checked" : ""}>
          <div class="step-title-row">
            <strong>${String(index + 1).padStart(2, "0")} · ${escapeHTML(step.title)}</strong>
            <span class="step-badge">${escapeHTML(step.heat)}</span>
            <span class="step-badge">${step.minutes} min</span>
          </div>
          <button class="timer-button" type="button" data-timer-minutes="${step.minutes}" data-timer-label="${escapeHTML(step.title)}">Start timer</button>
        </div>
        <div class="step-body">
          <p>${escapeHTML(step.instruction)}</p>
          <div class="step-cues">
            <div class="cue-block"><span>Se / lukt / kjenn etter</span><p>${escapeHTML(step.cue)}</p></div>
            <div class="cue-block"><span>${state.recipeMode === "bistro" ? "Bistro-notat" : "Autentisk notat"}</span><p>${escapeHTML(step.tip)}</p></div>
          </div>
        </div>
      </article>`;
  }).join("");

  elements.balanceGrid.classList.remove("empty-state");
  const balanceNames = { salt: "Salt", acid: "Syre", fat: "Fett", heat: "Varme", crunch: "Crunch" };
  elements.balanceGrid.innerHTML = Object.entries(recipe.balance).map(([key, value]) => `
    <div class="balance-item"><span>${balanceNames[key] ?? key}</span><p>${escapeHTML(value)}</p></div>`).join("");
  elements.platingCopy.textContent = recipe.plating;
  renderRecipeProgress(recipe.steps.length);
}

function renderUncuratedRecipe(country) {
  elements.recipeSummary.textContent = `${country.dish} kunne ikke lastes fra oppskriftsbiblioteket. Bruk redigeringsverktøyet som reserve og gjenopprett datafilen før neste helg.`;
  elements.ingredientGroups.innerHTML = `
    <div class="ingredient-group"><h3>Før dere handler</h3><ul class="ingredient-list">
      <li><span class="ingredient-amount">01</span><span>Finn 2–3 troverdige oppskrifter og sammenlign fellestrekk.</span></li>
      <li><span class="ingredient-amount">02</span><span>Velg én grunnoppskrift og noter norske råvarebytter.</span></li>
      <li><span class="ingredient-amount">03</span><span>Bygg handlelisten i notatfeltet og lag deres versjon.</span></li>
    </ul></div>
    <div class="ingredient-group"><h3>Verdensbordet-prinsippet</h3><ul class="ingredient-list">
      <li><span class="ingredient-amount">A</span><span>Behold rettens viktigste teknikk og smaksidentitet.</span></li>
      <li><span class="ingredient-amount">B</span><span>Endre bevisst – ikke tilfeldig – og dokumenter hvorfor.</span></li>
      <li><span class="ingredient-amount">C</span><span>Vurder resultatet separat før dere lager felles konklusjon.</span></li>
    </ul></div>`;
  elements.signaturePanel.hidden = false;
  elements.signatureTweaks.innerHTML = `
    <article class="signature-card"><span>VB-01</span><p>Bruk «Tilpass Bistro» til å lagre grepene dere bestemmer dere for.</p></article>
    <article class="signature-card"><span>VB-02</span><p>Etter matlaging lagres endringer, læring og neste forbedring i kokebokkapittelet.</p></article>
    <article class="signature-card"><span>VB-03</span><p>Retten kan oppgraderes til kuratert fulloppskrift senere uten å miste historikken.</p></article>`;
  elements.recipeSteps.innerHTML = [
    ["Research og valg", "Ingen varme", 20, "Sammenlign oppskrifter, identifiser den autentiske kjernen og velg én base.", "Dere kan forklare hvorfor akkurat denne oppskriften representerer retten.", "Lagre kildene i notatene."],
    ["Mise en place", "Klargjøring", 20, "Vei, kutt og grupper alle råvarer før komfyren slås på.", "Alt står klart i rekkefølgen det skal brukes.", "Ta et bilde av mise en place til albumet."],
    ["Lag grunnversjonen", "Etter valgt kilde", 60, "Følg grunnteknikken tett første gang, og noter alle avvik underveis.", "Dere vet hvilke steg som påvirket resultatet mest.", "Endre helst bare én eller to hovedvariabler første gang."],
    ["Balanser og server", "Lav / av", 10, "Juster salt, syre, fett, varme og tekstur. Planlegg tallerkenen før maten legges opp.", "Smaken har et tydelig sentrum og minst én kontrast.", "Ta hovedbildet før dere begynner å spise."],
  ].map((step, index) => `
    <article class="step-card ${state.completedSteps.has(index) ? "is-complete" : ""}" data-step-card="${index}">
      <div class="step-header"><input class="step-check" type="checkbox" data-step-check="${index}" ${state.completedSteps.has(index) ? "checked" : ""}><div class="step-title-row"><strong>${String(index + 1).padStart(2,"0")} · ${step[0]}</strong><span class="step-badge">${step[1]}</span><span class="step-badge">${step[2]} min</span></div><button class="timer-button" type="button" data-timer-minutes="${step[2]}" data-timer-label="${step[0]}">Start timer</button></div>
      <div class="step-body"><p>${step[3]}</p><div class="step-cues"><div class="cue-block"><span>Målet</span><p>${step[4]}</p></div><div class="cue-block"><span>Notat</span><p>${step[5]}</p></div></div></div>
    </article>`).join("");
  elements.balanceGrid.innerHTML = ["Salt", "Syre", "Fett", "Varme", "Crunch"].map((name) => `<div class="balance-item"><span>${name}</span><p>Vurder og noter før servering.</p></div>`).join("");
  elements.platingCopy.textContent = "Lag en bevisst serveringsplan: hovedkomponent, saus, kontrast og det ene elementet øyet skal lande på først.";
  renderRecipeProgress(4);
}

function renderRecipeProgress(total) {
  const completed = total ? [...state.completedSteps].filter((index) => index < total).length : 0;
  elements.recipeProgressText.textContent = `${completed} / ${total}`;
  elements.recipeProgressBar.style.width = `${total ? (completed / total) * 100 : 0}%`;
}

function renderAlbum() {
  const query = elements.albumSearch.value.trim().toLocaleLowerCase("nb-NO");
  const continent = elements.continentFilter.value;
  const sort = elements.albumSort.value;
  let entries = state.entries.filter((entry) => {
    const country = COUNTRIES.find((item) => item.code === entry.countryCode);
    const matchesQuery = !query || `${entry.countryName} ${entry.dishName}`.toLocaleLowerCase("nb-NO").includes(query);
    const matchesContinent = continent === "all" || country?.continent === continent;
    return matchesQuery && matchesContinent;
  });
  if (sort === "rating") entries.sort((a, b) => averageRating(b) - averageRating(a));
  else if (sort === "country") entries.sort((a, b) => a.countryName.localeCompare(b.countryName, "nb-NO"));
  else entries.sort((a, b) => new Date(b.cookedAt) - new Date(a.cookedAt));

  const allRatings = state.entries.map(averageRating).filter(Boolean);
  const totalCost = state.entries.reduce((sum, entry) => sum + (Number(entry.costNok) || 0), 0);
  const photoCount = state.entries.reduce((sum, entry) => sum + (entry.photos?.length ?? 0), 0);
  elements.albumCountryCount.textContent = completedCountryCodes().size;
  elements.albumPhotoCount.textContent = photoCount;
  elements.albumAverageRating.textContent = allRatings.length ? `${(allRatings.reduce((a,b) => a+b, 0) / allRatings.length).toFixed(1)} / 5` : "—";
  elements.albumTotalCost.textContent = localeMoney.format(totalCost);
  elements.albumEmpty.hidden = state.entries.length > 0;
  elements.albumGrid.hidden = state.entries.length === 0;

  elements.albumGrid.innerHTML = entries.map((entry) => {
    const photo = entry.photos?.[0];
    const score = averageRating(entry);
    return `
      <button class="album-card" type="button" data-entry-id="${entry.id}">
        ${photo ? `<img src="${photo}" alt="${escapeHTML(entry.dishName)} laget av Person 1 og Person 2">` : `<div class="photo-fallback">${escapeHTML(entry.countryCode)}</div>`}
        <span class="album-score">${score ? `${score.toFixed(1)} / 5` : "Ikke vurdert"}</span>
        <div class="album-card-content"><span>${escapeHTML(entry.countryName)} · ${localeDate.format(new Date(entry.cookedAt))}</span><h2>${escapeHTML(entry.dishName)}</h2><p>${escapeHTML(entry.memory || entry.personalTwist || "Et nytt kapittel i matreisen.")}</p></div>
      </button>`;
  }).join("");
}

function openEntryDetail(id) {
  const entry = state.entries.find((item) => item.id === id);
  if (!entry) return;
  const photo = entry.photos?.[0];
  const score = averageRating(entry);
  elements.entryDetail.innerHTML = `
    <header><div><p class="eyebrow">${escapeHTML(entry.countryName)} · ${localeDate.format(new Date(entry.cookedAt))}</p><h2>Kokebokkapittel</h2></div><button class="dialog-close" type="button" data-close-entry aria-label="Lukk">×</button></header>
    <div class="entry-detail-hero">
      ${photo ? `<img src="${photo}" alt="${escapeHTML(entry.dishName)}">` : `<div class="photo-fallback">${escapeHTML(entry.countryCode)}</div>`}
      <div class="entry-detail-title"><span class="eyebrow">${score ? `${score.toFixed(1)} / 5` : "Ikke vurdert"}</span><h2>${escapeHTML(entry.dishName)}</h2><p>${escapeHTML(entry.countryName)}</p></div>
    </div>
    <div class="entry-detail-body">
      <div class="detail-block"><span>Vurderinger</span><p>Person 1: ${entry.ratingPerson1 || "—"}/5 · Person 2: ${entry.ratingPerson2 || "—"}/5</p></div>
      <div class="detail-block"><span>Kveldens modus</span><p>${escapeHTML(EXPERIENCE_MODES[entry.experienceMode]?.label || "Ikke registrert")} · ${entry.partySize || entry.recipeSnapshot?.servings || "—"} personer</p></div>
      <div class="detail-block"><span>Oppskriftsversjon</span><p>${escapeHTML(entry.recipeSnapshot?.versionLabel || (entry.recipeSnapshot?.mode === "bistro" ? "Bistro" : "Autentisk"))}</p></div>
      <div class="detail-block"><span>Tid og kostnad</span><p>${entry.actualMinutes ? `${entry.actualMinutes} minutter` : "Tid ikke registrert"} · ${entry.costNok ? localeMoney.format(entry.costNok) : "Kostnad ikke registrert"}</p></div>
      <div class="detail-block"><span>Hvem gjorde hva?</span><p>${escapeHTML(entry.roles || "Ikke notert")}</p></div>
      <div class="detail-block"><span>Vår versjon</span><p>${escapeHTML(entry.personalTwist || "Ingen endringer notert")}</p></div>
      <div class="detail-block"><span>Hva lærte vi?</span><p>${escapeHTML(entry.notes || "Ikke notert")}</p></div>
      <div class="detail-block"><span>Neste gang</span><p>${escapeHTML(entry.nextTime || "Ikke notert")}</p></div>
      <div class="detail-block" style="grid-column:1/-1"><span>Minne fra kvelden</span><p>${escapeHTML(entry.memory || "Ikke notert")}</p></div>
    </div>
    <footer><button class="danger-button" type="button" data-delete-entry="${entry.id}">Slett kapittelet</button><button class="primary-button" type="button" data-close-entry>Lukk</button></footer>`;
  elements.entryDialog.showModal();
}

function renderCookbook() {
  const completed = completedCountryCodes().size;
  const percent = Math.round((completed / COUNTRIES.length) * 100);
  elements.progressPercent.textContent = percent;
  elements.worldProgressBar.style.width = `${percent}%`;
  elements.bookCount.textContent = completed;
  elements.bookProgressCopy.textContent = completed < 12 ? `${12 - completed} retter igjen til første ferdige Volume 01.` : `${completed} dokumenterte retter er klare for bok.`;

  const continentCounts = new Map();
  for (const entry of state.entries) {
    const continent = COUNTRIES.find((country) => country.code === entry.countryCode)?.continent ?? "Annet";
    continentCounts.set(continent, (continentCounts.get(continent) ?? 0) + 1);
  }
  const availableCounts = new Map();
  COUNTRIES.forEach((country) => availableCounts.set(country.continent, (availableCounts.get(country.continent) ?? 0) + 1));
  elements.cookbookChapters.innerHTML = [...availableCounts.entries()].map(([continent, total]) => {
    const count = continentCounts.get(continent) ?? 0;
    return `<div class="chapter-row"><strong>${escapeHTML(continent)}</strong><div class="chapter-mini-track"><i style="width:${(count / total) * 100}%"></i></div><span>${count} / ${total}</span></div>`;
  }).join("");
  updateBookEstimate();
  buildPrintCookbook();
}

function updateBookEstimate() {
  if (!elements.bookPageEstimate) return;
  const entries = state.entries.length;
  const volumeSize = Math.max(1, Math.min(58, Number(elements.bookVolumeSizeSelect?.value) || 58));
  const volumes = Math.max(1, Math.ceil(entries / volumeSize));
  const pages = entries ? entries * 2 + volumes * 2 : 2;
  elements.bookPageEstimate.textContent = entries
    ? `${pages} sider · ${volumes} volum${volumes === 1 ? "" : "er"}`
    : "2 startsider";
}

async function runPhotoBookExport() {
  if (!state.entries.length) {
    showToast("Lag og dokumenter minst én rett før fotoboken eksporteres.");
    return;
  }
  const button = elements.exportPhotoBookButton;
  button.disabled = true;
  elements.bookExportProgress.hidden = false;
  elements.bookExportStatus.textContent = "Forbereder høyoppløselige sider …";
  elements.bookExportProgressText.textContent = "0%";
  elements.bookExportProgressBar.style.width = "0%";
  try {
    const result = await exportPhotoBook({
      entries: state.entries,
      countries: COUNTRIES,
      presetId: elements.bookFormatSelect.value,
      volumeSize: Number(elements.bookVolumeSizeSelect.value),
      includeOriginals: elements.bookIncludeOriginals.checked,
      title: elements.bookTitleInput.value.trim() || "En matreise",
      onProgress: ({ current, total, label, volume, totalVolumes }) => {
        const percent = Math.round((current / Math.max(1, total)) * 100);
        elements.bookExportStatus.textContent = totalVolumes > 1 ? `Volume ${volume}/${totalVolumes} · ${label}` : label;
        elements.bookExportProgressText.textContent = `${Math.min(100, percent)}%`;
        elements.bookExportProgressBar.style.width = `${Math.min(100, percent)}%`;
      },
    });
    elements.bookExportStatus.textContent = `${result.volumeCount} volum · ${result.entries} kapitler · ZIP lastet ned`;
    elements.bookExportProgressText.textContent = "100%";
    elements.bookExportProgressBar.style.width = "100%";
    showToast("Den trykkklare fotobokpakken er eksportert.", 4200);
  } catch (error) {
    console.error(error);
    elements.bookExportStatus.textContent = error.message || "Eksporten mislyktes";
    showToast(error.message || "Fotoboken kunne ikke eksporteres.", 4200);
  } finally {
    button.disabled = false;
  }
}

function buildPrintCookbook() {
  const entries = [...state.entries].sort((a, b) => new Date(a.cookedAt) - new Date(b.cookedAt));
  elements.printCookbook.innerHTML = `
    <section class="print-book-cover"><p>Volume 01 · ${new Date().getFullYear()}</p><h1>Smaker<br>fra verden</h1><h2>En kokebok fra Verdensbordet</h2><p>${entries.length} retter · ${new Set(entries.map((entry) => entry.countryCode)).size} land</p></section>
    ${entries.map((entry) => {
      const recipe = entry.recipeSnapshot;
      return `<article class="print-entry">
        ${entry.photos?.[0] ? `<img src="${entry.photos[0]}" alt="">` : ""}
        <p>${escapeHTML(entry.countryName)} · ${localeDate.format(new Date(entry.cookedAt))}</p>
        <h1>${escapeHTML(entry.dishName)}</h1>
        <h2>${escapeHTML(entry.memory || "Et kapittel fra Verdensbordet")}</h2>
        <div class="print-meta"><span>Person 1 ${entry.ratingPerson1 || "—"}/5</span><span>Person 2 ${entry.ratingPerson2 || "—"}/5</span><span>${entry.actualMinutes || "—"} min</span><span>${entry.costNok ? localeMoney.format(entry.costNok) : "—"}</span></div>
        <div class="print-columns">
          <div>
            <h3>Ingredienser</h3>
            ${recipe?.ingredients ? `<ul>${recipe.ingredients.map((item) => `<li>${formatAmount(item.scaledAmount ?? item.amount)} ${escapeHTML(item.unit)} ${escapeHTML(item.name)}</li>`).join("")}</ul>` : "<p>Oppskriftssnapshot manglet i dette eldre kapittelet.</p>"}
            <h3>Vår versjon</h3><p>${escapeHTML(entry.personalTwist || "Ingen endringer notert")}</p>
          </div>
          <div>
            <h3>Fremgangsmåte</h3>
            ${recipe?.steps ? `<ol>${recipe.steps.map((step) => `<li><strong>${escapeHTML(step.title)}</strong><br>${escapeHTML(step.instruction)}</li>`).join("")}</ol>` : "<p>Se læringsnotatene fra kvelden.</p>"}
            <h3>Hva lærte vi?</h3><p>${escapeHTML(entry.notes || "Ikke notert")}</p>
            <h3>Neste gang</h3><p>${escapeHTML(entry.nextTime || "Ikke notert")}</p>
          </div>
        </div>
      </article>`;
    }).join("")}`;
}

function renderCountryBrowser(filter = "") {
  const query = filter.trim().toLocaleLowerCase("nb-NO");
  const completed = completedCountryCodes();
  const countries = COUNTRIES.filter((country) => !query || `${country.name} ${country.dish} ${country.continent}`.toLocaleLowerCase("nb-NO").includes(query));
  elements.countryBrowserGrid.innerHTML = countries.map((country) => `
    <button class="country-option" type="button" data-country-code="${country.code}">
      <span>${country.code} · ${escapeHTML(country.continent)} ${completed.has(country.code) ? "· FULLFØRT" : "· FULL OPPSKRIFT"}</span>
      <strong>${escapeHTML(country.name)}</strong>
      <small>${escapeHTML(country.dish)}</small>
    </button>`).join("");
}

function renderContinentFilter() {
  const values = [...new Set(COUNTRIES.map((country) => country.continent))].sort((a, b) => a.localeCompare(b, "nb-NO"));
  elements.continentFilter.innerHTML = '<option value="all">Alle</option>' + values.map((value) => `<option value="${escapeHTML(value)}">${escapeHTML(value)}</option>`).join("");
}

function renderRatings() {
  $$('[data-rating-owner]').forEach((row) => {
    const owner = row.dataset.ratingOwner;
    row.innerHTML = [1,2,3,4,5].map((rating) => `<button type="button" data-rating-owner-button="${owner}" data-rating-value="${rating}" class="${state.ratings[owner] === rating ? "is-active" : ""}" aria-label="${rating} av 5">${rating}</button>`).join("");
  });
}

function renderPhotoPreviews() {
  elements.photoPreviewGrid.innerHTML = state.pendingPhotos.map((photo, index) => `
    <div class="photo-preview"><img src="${photo}" alt="Forhåndsvisning ${index + 1}"><button type="button" data-remove-photo="${index}" aria-label="Fjern bilde">×</button></div>`).join("");
}

function openCompletionDialog() {
  if (!state.currentCountry) return;
  state.pendingPhotos = [];
  state.ratings = { person1: 0, person2: 0 };
  elements.completionForm.reset();
  elements.cookedAtInput.value = new Date().toISOString().slice(0, 10);
  elements.completionTitle.textContent = `${state.currentCountry.name} · ${state.currentCountry.dish}`;
  elements.completionStorageNote.textContent = isCloudConfigured() ? "Lagres lokalt først og synkroniseres etter innlogging." : "Lagres trygt lokalt i IndexedDB. Ta backup jevnlig.";
  renderRatings();
  renderPhotoPreviews();
  elements.completionDialog.showModal();
}

function recipeSnapshot() {
  const recipe = activeRecipe();
  if (!recipe) return null;
  return {
    countryCode: state.currentCountry.code,
    mode: state.recipeMode,
    experienceMode: state.experienceMode,
    partySize: state.partySize,
    servings: state.servings,
    ingredients: recipe.ingredients.map((item) => ({ ...item, scaledAmount: scaledAmount(item.amount, recipe.servings) })),
    steps: recipe.steps,
    signatureTweaks: state.recipeMode === "bistro" ? recipe.signatureTweaks : [],
    versionLabel: recipe.versionLabel || (state.recipeMode === "bistro" ? "Bistro" : "Autentisk"),
    bistroProfile: recipe.bistroProfile || null,
    plating: recipe.plating,
  };
}

async function saveCompletion() {
  if (!state.currentCountry) return;
  if (!state.ratings.person1 && !state.ratings.person2) {
    showToast("Legg inn minst én vurdering før kapittelet lagres.");
    return;
  }
  const entry = {
    id: createId(),
    countryCode: state.currentCountry.code,
    countryName: state.currentCountry.name,
    dishName: state.currentCountry.dish,
    experienceMode: state.experienceMode,
    partySize: state.partySize,
    cookedAt: elements.cookedAtInput.value || new Date().toISOString().slice(0, 10),
    ratingPerson1: state.ratings.person1,
    ratingPerson2: state.ratings.person2,
    actualMinutes: Number(elements.actualMinutesInput.value) || null,
    costNok: Number(elements.costInput.value) || null,
    roles: elements.rolesInput.value.trim(),
    personalTwist: elements.twistInput.value.trim(),
    notes: elements.notesInput.value.trim(),
    nextTime: elements.nextTimeInput.value.trim(),
    memory: elements.memoryInput.value.trim(),
    photos: state.pendingPhotos,
    recipeSnapshot: recipeSnapshot(),
    createdAt: new Date().toISOString(),
    cloudSynced: false,
  };
  await saveEntry(entry);
  state.entries = [entry, ...state.entries.filter((item) => item.id !== entry.id)];
  elements.completionDialog.close();
  renderMetrics();
  renderExperiencePlanner();
  renderAlbum();
  renderCookbook();
  launchConfetti();
  showToast(`${entry.countryName} er lagt inn i kokeboken.`);
  showView("album");
  if (getCloudUser()) {
    try {
      const cloudResult = await syncEntryToCloud(entry);
      entry.cloudSynced = true;
      entry.cloudPhotoPaths = cloudResult.photoPaths;
      await saveEntry(entry);
      showToast("Kapittelet er også synkronisert til skyen.");
    } catch (error) {
      console.error(error);
      showToast("Lokalt lagret. Sky-synkronisering kunne ikke fullføres.");
    }
  }
}

function startTimer(minutes, label) {
  clearInterval(state.timer.interval);
  state.timer.remaining = Math.max(1, Number(minutes)) * 60;
  state.timer.label = label;
  state.timer.running = true;
  elements.timerDock.hidden = false;
  elements.timerStepLabel.textContent = label;
  elements.timerToggleButton.textContent = "Pause";
  renderTimer();
  state.timer.interval = setInterval(tickTimer, 1000);
}

function tickTimer() {
  if (!state.timer.running) return;
  state.timer.remaining -= 1;
  renderTimer();
  if (state.timer.remaining <= 0) {
    clearInterval(state.timer.interval);
    state.timer.running = false;
    elements.timerToggleButton.textContent = "Ferdig";
    showToast(`${state.timer.label} er ferdig.`);
    if (navigator.vibrate) navigator.vibrate([150, 80, 150]);
  }
}

function renderTimer() {
  const minutes = Math.floor(Math.max(0, state.timer.remaining) / 60);
  const seconds = Math.max(0, state.timer.remaining) % 60;
  elements.timerDisplay.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  document.title = state.timer.running ? `${elements.timerDisplay.textContent} · ${state.timer.label}` : "Verdensbordet";
}

function closeTimer() {
  clearInterval(state.timer.interval);
  state.timer = { interval: null, remaining: 0, running: false, label: "Timer" };
  elements.timerDock.hidden = true;
  document.title = "Verdensbordet";
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    document.body.append(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }
}

function shoppingListText() {
  const recipe = activeRecipe();
  if (!recipe || !state.currentCountry) return "";
  const groups = recipe.ingredients.reduce((map, item) => {
    if (!map[item.group]) map[item.group] = [];
    map[item.group].push(item);
    return map;
  }, {});
  return [`${state.currentCountry.dish} · ${recipe.versionLabel || "Autentisk"} · ${state.servings} porsjoner`, "", ...Object.entries(groups).flatMap(([group, items]) => [group.toUpperCase(), ...items.map((item) => `□ ${formatAmount(scaledAmount(item.amount, recipe.servings))} ${item.unit} ${item.name}${item.optional ? " (valgfritt)" : ""}`), ""])].join("\n");
}


function shoppingItems() {
  const recipe = activeRecipe();
  if (!recipe) return [];
  return buildShoppingItems(recipe, state.servings, state.shoppingMode);
}

function selectedShoppingItems() {
  return shoppingItems().filter((item) => !state.shoppingExcluded.has(item.id));
}

function shoppingListForRetailer() {
  const retailer = RETAILERS[state.shoppingRetailer];
  const recipe = activeRecipe();
  if (!retailer || !recipe || !state.currentCountry) return "";
  const rows = selectedShoppingItems();
  const lines = [
    `${state.currentCountry.dish} · ${recipe.versionLabel || "Autentisk"}`,
    `${state.servings} porsjoner · ${retailer.name}`,
    "",
  ];
  let currentGroup = "";
  for (const item of rows) {
    if (item.group !== currentGroup) {
      currentGroup = item.group;
      lines.push(currentGroup.toUpperCase());
    }
    const amount = `${formatAmount(item.amountScaled)} ${item.unit}`.trim();
    const chosen = item.resolution.query;
    const changed = chosen.toLocaleLowerCase("nb-NO") !== item.name.toLocaleLowerCase("nb-NO");
    lines.push(`□ ${amount} ${chosen}${item.optional ? " (valgfritt)" : ""}`);
    if (changed) lines.push(`  Original: ${item.name}`);
    if (item.resolution.note && item.resolution.level !== "common") lines.push(`  Tips: ${item.resolution.note}`);
  }
  lines.push("", "Merk: Kontroller lagerstatus, allergener og pakningsstørrelse i butikken før kjøp.");
  return lines.join("\n");
}

function downloadText(filename, text) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

function renderRetailerGrid() {
  elements.retailerGrid.innerHTML = Object.values(RETAILERS).map((retailer) => `
    <button type="button" class="retailer-card ${retailer.id === state.shoppingRetailer ? "is-active" : ""}" data-retailer-id="${retailer.id}">
      <span class="retailer-kind">${retailer.kind === "online" ? "Nettbutikk" : "Fysisk butikk"}</span>
      <strong>${escapeHTML(retailer.name)}</strong>
      <small>${escapeHTML(retailer.description)}</small>
    </button>`).join("");
}

function renderShoppingDialog() {
  const recipe = activeRecipe();
  const country = state.currentCountry;
  const retailer = RETAILERS[state.shoppingRetailer];
  if (!recipe || !country || !retailer) return;
  const items = shoppingItems();
  const included = items.filter((item) => !state.shoppingExcluded.has(item.id));
  const substitutions = included.filter((item) => item.resolution.substituted || item.resolution.level === "specialty").length;

  elements.shoppingDialogTitle.textContent = `Handle ${country.dish}`;
  elements.shoppingRecipeLabel.textContent = `${country.name} · ${recipe.versionLabel || "Autentisk"}`;
  elements.shoppingServingsLabel.textContent = String(state.servings);
  elements.shoppingItemCount.textContent = String(included.length);
  elements.shoppingSubstitutionCount.textContent = `${substitutions} ${substitutions === 1 ? "vare krever vurdering" : "varer krever vurdering"}`;
  elements.shoppingModeButtons.forEach((button) => button.classList.toggle("is-active", button.dataset.shoppingMode === state.shoppingMode));
  renderRetailerGrid();

  elements.shoppingRetailerNote.textContent = retailer.kind === "online"
    ? `${retailer.name}: åpne live produktsøk vare for vare. Verdensbordet foreslår søkeord og erstatning, mens butikken viser faktisk lagerstatus, pris og pakningsstørrelse.`
    : `${retailer.name}: bruk den sorterte sjekklisten i butikken. Åpne butikkfinneren for å velge nærmeste filial.`;

  elements.shoppingItems.innerHTML = items.map((item) => {
    const checked = !state.shoppingExcluded.has(item.id);
    const resolution = item.resolution;
    const badge = resolution.level === "common" ? "Vanlig vare" : resolution.substituted ? "Norsk erstatning" : "Spesialvare";
    const searchLink = retailer.kind === "online"
      ? `<a class="shopping-search-link" href="${escapeHTML(retailerSearchUrl(retailer.id, resolution.query))}" target="_blank" rel="noopener noreferrer">Søk hos ${escapeHTML(retailer.name)} ↗</a>`
      : "";
    const alternative = resolution.substitute && resolution.substitute.toLocaleLowerCase("nb-NO") !== resolution.preferred.toLocaleLowerCase("nb-NO")
      ? `<div class="shopping-alternative"><span>Nærmeste norske alternativ</span><strong>${escapeHTML(resolution.substitute)}</strong><p>${escapeHTML(resolution.note)}</p></div>`
      : resolution.level !== "common"
        ? `<div class="shopping-alternative"><span>Tilgjengelighetstips</span><p>${escapeHTML(resolution.note)}</p></div>`
        : "";
    return `<article class="shopping-item ${checked ? "" : "is-excluded"}">
      <label class="shopping-item-check">
        <input type="checkbox" data-shopping-item-id="${escapeHTML(item.id)}" ${checked ? "checked" : ""}>
        <span><strong>${formatAmount(item.amountScaled)} ${escapeHTML(item.unit)} · ${escapeHTML(item.name)}</strong><small>${escapeHTML(item.group)}${item.optional ? " · valgfritt" : ""}</small></span>
      </label>
      <div class="shopping-match">
        <span class="shopping-match-badge ${resolution.level}">${badge}</span>
        <div><span>Søk etter</span><strong>${escapeHTML(resolution.query)}</strong></div>
        ${searchLink}
      </div>
      ${alternative}
    </article>`;
  }).join("");

  elements.shoppingFooterTitle.textContent = `${included.length} varer · ${retailer.name}`;
  elements.shoppingFooterCopy.textContent = retailer.kind === "online"
    ? "Åpne produktsøkene enkeltvis og legg ønsket vare i kurven."
    : "Kopier eller last ned listen før dere går i butikken.";
  elements.openRetailerButton.href = retailer.homeUrl;
  elements.openRetailerButton.textContent = retailer.kind === "online" ? `Åpne ${retailer.name}` : `Finn nærmeste ${retailer.name}`;
}

function openShoppingDialog() {
  if (!activeRecipe() || !state.currentCountry) return showToast("Velg en oppskrift først.");
  state.shoppingExcluded = new Set();
  renderShoppingDialog();
  elements.shoppingDialog.showModal();
}

function openRecipeEditor() {
  if (!state.currentCountry) return;
  const recipe = currentRecipe();
  const existing = state.recipeDrafts[state.currentCountry.code];
  elements.editorTweaksInput.value = (existing?.signatureTweaks ?? recipe?.signatureTweaks ?? []).join("\n");
  elements.editorPlatingInput.value = existing?.plating ?? recipe?.plating ?? "";
  elements.recipeEditorDialog.showModal();
}

async function saveRecipeDraft() {
  if (!state.currentCountry) return;
  state.recipeDrafts[state.currentCountry.code] = {
    signatureTweaks: elements.editorTweaksInput.value.split("\n").map((line) => line.trim()).filter(Boolean),
    plating: elements.editorPlatingInput.value.trim(),
    updatedAt: new Date().toISOString(),
  };
  await setSetting("recipeDrafts", state.recipeDrafts);
  elements.recipeEditorDialog.close();
  state.recipeMode = "bistro";
  updateRecipeModeButtons();
  renderRecipe();
  showToast("Bistro-versjonen er lagret.");
}

function updateRecipeModeButtons() {
  elements.recipeModeButtons.forEach((button) => button.classList.toggle("is-active", button.dataset.recipeMode === state.recipeMode));
}

function updateCloudUI(user = getCloudUser()) {
  const configured = isCloudConfigured();
  if (!configured) {
    elements.cloudStatusText.textContent = "Lokalt";
    elements.profileModeHeading.textContent = "Lokal produksjonsmodus";
    elements.profileModeCopy.textContent = "Alt fungerer uten konto og lagres i IndexedDB. Fyll inn Supabase-verdiene i config.js for innlogging og synk mellom enheter.";
    elements.magicLinkButton.disabled = true;
    elements.cloudEmailInput.disabled = true;
    elements.cloudEmailInput.placeholder = "Aktiveres etter Supabase-oppsett";
    elements.syncNowButton.hidden = true;
    elements.signOutButton.hidden = true;
    return;
  }
  elements.cloudEmailInput.disabled = false;
  elements.magicLinkButton.disabled = false;
  if (user) {
    elements.cloudStatusText.textContent = "Synk på";
    elements.profileModeHeading.textContent = user.email ?? "Tilkoblet";
    elements.profileModeCopy.textContent = "Kapitler kan synkroniseres mellom enheter. Lokalt lager brukes fortsatt som rask og offline-først kopi.";
    elements.magicLinkButton.hidden = true;
    elements.cloudEmailInput.parentElement.hidden = true;
    elements.syncNowButton.hidden = false;
    elements.signOutButton.hidden = false;
  } else {
    elements.cloudStatusText.textContent = "Sky klar";
    elements.profileModeHeading.textContent = "Supabase er konfigurert";
    elements.profileModeCopy.textContent = "Logg inn med magisk lenke for å synkronisere Verdensbordet-reisen.";
    elements.magicLinkButton.hidden = false;
    elements.cloudEmailInput.parentElement.hidden = false;
    elements.syncNowButton.hidden = true;
    elements.signOutButton.hidden = true;
  }
}

async function syncAll() {
  if (!getCloudUser()) return;
  elements.syncNowButton.disabled = true;
  elements.syncNowButton.textContent = "Synkroniserer …";
  try {
    for (const entry of state.entries) {
      const result = await syncEntryToCloud(entry);
      entry.cloudSynced = true;
      entry.cloudPhotoPaths = result.photoPaths;
      await saveEntry(entry);
    }
    const cloudEntries = await pullCloudEntries();
    for (const entry of cloudEntries) {
      const existing = state.entries.find((item) => item.id === entry.id);
      if (!existing || existing.cloudSynced) await saveEntry({ ...existing, ...entry });
    }
    state.entries = await getEntries();
    renderMetrics();
    renderAlbum();
    renderCookbook();
    showToast("Sky og lokal reise er synkronisert.");
  } catch (error) {
    console.error(error);
    showToast("Synkronisering feilet. Lokale data er urørt.");
  } finally {
    elements.syncNowButton.disabled = false;
    elements.syncNowButton.textContent = "Synkroniser nå";
  }
}

function launchConfetti() {
  if (state.motionPaused) return;
  const canvas = elements.confettiCanvas;
  const context = canvas.getContext("2d");
  canvas.width = innerWidth * devicePixelRatio;
  canvas.height = innerHeight * devicePixelRatio;
  canvas.style.width = `${innerWidth}px`;
  canvas.style.height = `${innerHeight}px`;
  context.scale(devicePixelRatio, devicePixelRatio);
  const pieces = Array.from({ length: 120 }, () => ({
    x: innerWidth / 2 + (Math.random() - 0.5) * 180,
    y: innerHeight * 0.55,
    vx: (Math.random() - 0.5) * 16,
    vy: -5 - Math.random() * 12,
    gravity: 0.18 + Math.random() * 0.13,
    rotation: Math.random() * Math.PI,
    spin: (Math.random() - 0.5) * 0.25,
    size: 3 + Math.random() * 6,
    life: 1,
  }));
  function animate() {
    context.clearRect(0, 0, innerWidth, innerHeight);
    pieces.forEach((piece) => {
      piece.vy += piece.gravity;
      piece.x += piece.vx;
      piece.y += piece.vy;
      piece.rotation += piece.spin;
      piece.life -= 0.009;
      context.save();
      context.globalAlpha = Math.max(0, piece.life);
      context.translate(piece.x, piece.y);
      context.rotate(piece.rotation);
      context.fillStyle = Math.random() > 0.35 ? "#d8ff63" : "#e9efeb";
      context.fillRect(-piece.size / 2, -piece.size / 2, piece.size, piece.size * 0.5);
      context.restore();
    });
    if (pieces.some((piece) => piece.life > 0 && piece.y < innerHeight + 30)) requestAnimationFrame(animate);
    else context.clearRect(0, 0, innerWidth, innerHeight);
  }
  animate();
}

function registerEvents() {
  elements.navLinks.forEach((button) => button.addEventListener("click", () => showView(button.dataset.viewTarget)));
  elements.viewTargets.forEach((button) => button.addEventListener("click", () => showView(button.dataset.viewTarget)));
  elements.randomizeButton.addEventListener("click", () => runRandomizer());
  elements.rerollButton.addEventListener("click", () => runRandomizer({ scrollToMission: true }));
  elements.openMissionButton.addEventListener("click", () => elements.missionSection.scrollIntoView({ behavior: state.motionPaused ? "auto" : "smooth" }));
  elements.startRecipeButton.addEventListener("click", () => showView("oppskrift"));
  elements.lockMissionButton.addEventListener("click", async () => {
    if (!state.currentCountry) return;
    const isLocked = state.lockedMission?.countryCode === state.currentCountry.code && state.lockedMission?.weekend === nextWeekend().key;
    state.lockedMission = isLocked ? null : { countryCode: state.currentCountry.code, weekend: nextWeekend().key, lockedAt: new Date().toISOString() };
    await setSetting("lockedMission", state.lockedMission);
    updateMissionLockUI();
    showToast(isLocked ? "Helgen er låst opp." : `${state.currentCountry.name} er låst for helgen.`);
  });
  elements.loadVideoButton.addEventListener("click", () => {
    if (!state.currentCountry) return;
    if (state.currentCountry.videoId) {
      elements.videoFrame.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${state.currentCountry.videoId}?autoplay=1&rel=0" title="Stemningsfilm fra ${escapeHTML(state.currentCountry.name)}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
    } else window.open(elements.videoSearchLink.href, "_blank", "noopener,noreferrer");
  });
  elements.browseCountriesButton.addEventListener("click", () => {
    renderCountryBrowser();
    elements.countryBrowserDialog.showModal();
  });
  elements.closeCountryBrowser.addEventListener("click", () => elements.countryBrowserDialog.close());
  elements.countrySearchInput.addEventListener("input", () => renderCountryBrowser(elements.countrySearchInput.value));
  elements.countryBrowserGrid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-country-code]");
    if (!button) return;
    const country = COUNTRIES.find((item) => item.code === button.dataset.countryCode);
    elements.countryBrowserDialog.close();
    renderMission(country);
    showView("reise", { scroll: false });
    elements.missionSection.scrollIntoView({ behavior: state.motionPaused ? "auto" : "smooth" });
  });

  elements.decreaseServings.addEventListener("click", () => { state.servings = Math.max(1, state.servings - 1); renderRecipe(); });
  elements.increaseServings.addEventListener("click", () => { state.servings = Math.min(12, state.servings + 1); renderRecipe(); });
  elements.recipeModeButtons.forEach((button) => button.addEventListener("click", () => {
    state.recipeMode = button.dataset.recipeMode === "signature" ? "bistro" : button.dataset.recipeMode;
    updateRecipeModeButtons();
    renderRecipe();
  }));

  elements.experienceModeButtons.forEach((button) => button.addEventListener("click", () => setExperienceMode(button.dataset.experienceMode)));
  elements.decreasePartySize.addEventListener("click", () => changePartySize(-1));
  elements.increasePartySize.addEventListener("click", () => changePartySize(1));
  elements.recipeSteps.addEventListener("change", (event) => {
    const checkbox = event.target.closest("[data-step-check]");
    if (!checkbox) return;
    const index = Number(checkbox.dataset.stepCheck);
    if (checkbox.checked) state.completedSteps.add(index); else state.completedSteps.delete(index);
    const total = currentRecipe()?.steps.length ?? 4;
    renderRecipeProgress(total);
    checkbox.closest(".step-card")?.classList.toggle("is-complete", checkbox.checked);
  });
  elements.recipeSteps.addEventListener("click", (event) => {
    const button = event.target.closest("[data-timer-minutes]");
    if (!button) return;
    startTimer(button.dataset.timerMinutes, button.dataset.timerLabel);
  });
  elements.finishCookingButton.addEventListener("click", openCompletionDialog);
  elements.editRecipeButton.addEventListener("click", openRecipeEditor);
  elements.recipeEditorForm.addEventListener("submit", (event) => { event.preventDefault(); saveRecipeDraft(); });
  elements.copyShoppingButton.addEventListener("click", async () => {
    const text = shoppingListText();
    if (!text) return showToast("Velg en kuratert oppskrift først.");
    await copyText(text);
    showToast("Handlelisten er kopiert.");
  });
  elements.openShoppingDialogButton.addEventListener("click", openShoppingDialog);
  elements.closeShoppingDialog.addEventListener("click", () => elements.shoppingDialog.close());
  elements.retailerGrid.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-retailer-id]");
    if (!button) return;
    state.shoppingRetailer = button.dataset.retailerId;
    await setSetting("shoppingRetailer", state.shoppingRetailer);
    renderShoppingDialog();
  });
  elements.shoppingModeButtons.forEach((button) => button.addEventListener("click", async () => {
    state.shoppingMode = button.dataset.shoppingMode === "easy" ? "easy" : "authentic";
    await setSetting("shoppingMode", state.shoppingMode);
    renderShoppingDialog();
  }));
  elements.shoppingItems.addEventListener("change", (event) => {
    const input = event.target.closest("[data-shopping-item-id]");
    if (!input) return;
    if (input.checked) state.shoppingExcluded.delete(input.dataset.shoppingItemId);
    else state.shoppingExcluded.add(input.dataset.shoppingItemId);
    renderShoppingDialog();
  });
  elements.copyRetailerListButton.addEventListener("click", async () => {
    const text = shoppingListForRetailer();
    if (!text) return;
    await copyText(text);
    showToast(`Handlelisten for ${RETAILERS[state.shoppingRetailer].name} er kopiert.`);
  });
  elements.downloadRetailerListButton.addEventListener("click", () => {
    const text = shoppingListForRetailer();
    if (!text) return;
    const dish = state.currentCountry?.dish?.toLocaleLowerCase("nb-NO").replace(/[^a-z0-9æøå]+/gi, "-").replace(/^-|-$/g, "") || "handleliste";
    downloadText(`verdensbordet-${dish}-${RETAILERS[state.shoppingRetailer].id}.txt`, text);
    showToast("Handlelisten er lastet ned.");
  });

  elements.timerToggleButton.addEventListener("click", () => {
    if (state.timer.remaining <= 0) return closeTimer();
    state.timer.running = !state.timer.running;
    elements.timerToggleButton.textContent = state.timer.running ? "Pause" : "Fortsett";
  });
  elements.timerCloseButton.addEventListener("click", closeTimer);

  elements.photoInput.addEventListener("change", async () => {
    const files = [...elements.photoInput.files].slice(0, 8 - state.pendingPhotos.length);
    if (!files.length) return;
    elements.completionStorageNote.textContent = "Komprimerer bilder …";
    try {
      const images = [];
      for (const file of files) images.push(await compressImage(file));
      state.pendingPhotos.push(...images);
      renderPhotoPreviews();
      elements.completionStorageNote.textContent = `${state.pendingPhotos.length} bilde(r) klare. Maks 8 per kapittel.`;
    } catch (error) {
      console.error(error);
      showToast(error.message || "Bildene kunne ikke leses.");
    }
    elements.photoInput.value = "";
  });
  elements.photoPreviewGrid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove-photo]");
    if (!button) return;
    state.pendingPhotos.splice(Number(button.dataset.removePhoto), 1);
    renderPhotoPreviews();
  });
  elements.completionDialog.addEventListener("click", (event) => {
    const rating = event.target.closest("[data-rating-owner-button]");
    if (!rating) return;
    state.ratings[rating.dataset.ratingOwnerButton] = Number(rating.dataset.ratingValue);
    renderRatings();
  });
  elements.completionForm.addEventListener("submit", (event) => { event.preventDefault(); saveCompletion(); });

  [elements.albumSearch, elements.continentFilter, elements.albumSort].forEach((control) => control.addEventListener("input", renderAlbum));
  elements.albumGrid.addEventListener("click", (event) => {
    const card = event.target.closest("[data-entry-id]");
    if (card) openEntryDetail(card.dataset.entryId);
  });
  elements.entryDetail.addEventListener("click", async (event) => {
    if (event.target.closest("[data-close-entry]")) elements.entryDialog.close();
    const deleteButton = event.target.closest("[data-delete-entry]");
    if (!deleteButton) return;
    if (!confirm("Slette dette kokebokkapittelet permanent fra denne enheten?")) return;
    await deleteEntry(deleteButton.dataset.deleteEntry);
    state.entries = state.entries.filter((entry) => entry.id !== deleteButton.dataset.deleteEntry);
    elements.entryDialog.close();
    renderMetrics(); renderAlbum(); renderCookbook();
    showToast("Kapittelet er slettet lokalt.");
  });

  elements.printCookbookButton.addEventListener("click", () => { buildPrintCookbook(); window.print(); });
  elements.exportPhotoBookButton.addEventListener("click", runPhotoBookExport);
  [elements.bookFormatSelect, elements.bookVolumeSizeSelect].forEach((control) => control.addEventListener("change", updateBookEstimate));
  const doExport = async () => {
    const backup = await exportBackup();
    downloadJSON(`verdensbordet-backup-${new Date().toISOString().slice(0,10)}.json`, backup);
    showToast("Backup er lastet ned.");
  };
  elements.exportBackupButton.addEventListener("click", doExport);
  elements.profileExportButton.addEventListener("click", doExport);
  elements.importBackupInput.addEventListener("change", async () => {
    const file = elements.importBackupInput.files?.[0];
    if (!file) return;
    try {
      const payload = JSON.parse(await file.text());
      await importBackup(payload);
      state.entries = await getEntries();
      state.recipeDrafts = await getSetting("recipeDrafts", {});
      const currentCode = await getSetting("currentCountry", null);
      if (currentCode) renderMission(COUNTRIES.find((country) => country.code === currentCode));
      renderMetrics(); renderAlbum(); renderCookbook();
      showToast("Backup er importert.");
    } catch (error) {
      console.error(error);
      showToast("Backupfilen kunne ikke importeres.");
    }
    elements.importBackupInput.value = "";
  });

  elements.profileButton.addEventListener("click", () => elements.profileDialog.showModal());
  elements.magicLinkButton.addEventListener("click", async () => {
    const email = elements.cloudEmailInput.value.trim();
    if (!email) return showToast("Skriv inn e-postadressen først.");
    elements.magicLinkButton.disabled = true;
    try {
      await sendMagicLink(email);
      showToast("Innloggingslenken er sendt. Sjekk e-posten.", 4200);
    } catch (error) {
      console.error(error);
      showToast("Innloggingslenken kunne ikke sendes.");
    } finally { elements.magicLinkButton.disabled = false; }
  });
  elements.syncNowButton.addEventListener("click", syncAll);
  elements.signOutButton.addEventListener("click", async () => { await signOutCloud(); updateCloudUI(null); showToast("Du er logget ut. Lokale data beholdes."); });
  elements.resetDataButton.addEventListener("click", async () => {
    if (!confirm("Dette sletter alle lokale kapitler og bilder. Ta backup først. Fortsette?")) return;
    await clearEntries();
    state.entries = [];
    renderMetrics(); renderAlbum(); renderCookbook();
    elements.profileDialog.close();
    showToast("Lokale kapitler er slettet.");
  });

  elements.motionButton.addEventListener("click", () => {
    state.motionPaused = !state.motionPaused;
    state.globe?.setPaused(state.motionPaused);
    elements.motionButton.setAttribute("aria-pressed", String(state.motionPaused));
    elements.motionButton.title = state.motionPaused ? "Start animasjon" : "Pause animasjon";
    showToast(state.motionPaused ? "Animasjoner er pauset." : "Animasjoner er aktivert.");
  });

  window.addEventListener("verdensbordet:auth", (event) => updateCloudUI(event.detail.user));
  window.addEventListener("pointermove", (event) => {
    const aura = $(".cursor-aura");
    aura.style.left = `${event.clientX}px`;
    aura.style.top = `${event.clientY}px`;
  }, { passive: true });
}

async function init() {
  elements.weekendMetric.textContent = nextWeekend().label;
  elements.cookedAtInput.value = new Date().toISOString().slice(0, 10);
  state.entries = await getEntries();
  state.recipeDrafts = await getSetting("recipeDrafts", {});
  state.lockedMission = await getSetting("lockedMission", null);
  state.shoppingRetailer = RETAILERS[await getSetting("shoppingRetailer", "oda")] ? await getSetting("shoppingRetailer", "oda") : "oda";
  state.shoppingMode = (await getSetting("shoppingMode", "authentic")) === "easy" ? "easy" : "authentic";
  state.experienceMode = await getSetting("experienceMode", "date");
  state.partySize = Math.max(1, Math.min(12, Number(await getSetting("partySize", EXPERIENCE_MODES[state.experienceMode]?.size || 2)) || 2));
  state.servings = state.partySize;
  const currentCode = await getSetting("currentCountry", null);
  renderContinentFilter();
  renderCountryBrowser();
  renderMetrics();
  renderAlbum();
  renderCookbook();
  updateRecipeModeButtons();
  renderRatings();
  registerEvents();

  state.globe = await createGlobe({
    canvas: elements.globeCanvas,
    stage: elements.globeStage,
    fallback: elements.globeFallback,
    countries: COUNTRIES,
    onSelect: (country) => {
      renderMission(country);
      showToast(`${country.name} · ${country.dish}`);
    },
  });
  state.globe.setPaused(state.motionPaused);
  elements.motionButton.setAttribute("aria-pressed", String(state.motionPaused));

  if (currentCode) {
    const country = COUNTRIES.find((item) => item.code === currentCode);
    if (country) renderMission(country);
  } else renderRecipe();

  try {
    const cloud = await initCloud();
    updateCloudUI(cloud.user);
  } catch (error) {
    console.warn("Cloud init failed", error);
    updateCloudUI(null);
  }

  const initialView = location.hash.replace("#", "");
  if (["reise", "oppskrift", "album", "kokebok"].includes(initialView)) showView(initialView, { scroll: false });
  else showView("reise", { scroll: false });

  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    navigator.serviceWorker.register("/sw.js").catch((error) => console.warn("Service worker", error));
  }
}

init().catch((error) => {
  console.error(error);
  showToast("Verdensbordet startet med en feil. Last siden på nytt.", 6000);
});
