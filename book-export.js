const BOOK_PRESETS = {
  square30: {
    id: "square30",
    label: "Kvadratisk XL · 30 × 30 cm",
    width: 3543,
    height: 3543,
    safe: 150,
    format: "1:1",
    providers: "FotoKnudsen Kvadratisk XL / CEWE FOTOBOK XL",
  },
  square21: {
    id: "square21",
    label: "Kvadratisk L · 21 × 21 cm",
    width: 2480,
    height: 2480,
    safe: 120,
    format: "1:1",
    providers: "FotoKnudsen Kvadratisk L / CEWE Kvadratisk",
  },
  landscape28: {
    id: "landscape28",
    label: "Liggende L · 28 × 21 cm",
    width: 3307,
    height: 2480,
    safe: 130,
    format: "4:3",
    providers: "FotoKnudsen Liggende L / CEWE Stor panorama",
  },
};

const COLORS = {
  ink: "#101416",
  deep: "#080b0d",
  paper: "#eee7d9",
  paper2: "#e4dccd",
  cream: "#faf4e9",
  muted: "#a9a092",
  line: "#c9bfae",
  gold: "#c6a66a",
  terracotta: "#b96949",
};

const CONTINENT_COLORS = {
  Europa: "#6e8582",
  Asia: "#aa684f",
  Afrika: "#9c7b46",
  "Nord-Amerika": "#5c7898",
  "Sør-Amerika": "#5d805e",
  Oseania: "#76698f",
};

const encoder = new TextEncoder();

export function getBookPresets() {
  return Object.values(BOOK_PRESETS);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function averageRating(entry) {
  const ratings = [Number(entry.ratingPerson1) || 0, Number(entry.ratingPerson2) || 0].filter(Boolean);
  return ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
}

function cleanText(value = "") {
  return String(value).replace(/\s+/g, " ").trim();
}

function fitText(ctx, text, maxWidth, startSize, minSize, family = 'Arial, sans-serif', weight = 600) {
  let size = startSize;
  while (size > minSize) {
    ctx.font = `${weight} ${size}px ${family}`;
    if (ctx.measureText(text).width <= maxWidth) break;
    size -= 2;
  }
  return size;
}

function wrapLines(ctx, text, maxWidth, maxLines = Infinity) {
  const words = cleanText(text).split(" ").filter(Boolean);
  const lines = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth || !line) {
      line = candidate;
    } else {
      lines.push(line);
      line = word;
      if (lines.length >= maxLines) break;
    }
  }
  if (line && lines.length < maxLines) lines.push(line);
  if (words.length && lines.length === maxLines) {
    const joined = lines.join(" ");
    if (joined.length < cleanText(text).length) {
      let last = lines.at(-1) || "";
      while (ctx.measureText(`${last}…`).width > maxWidth && last.length > 1) last = last.slice(0, -1);
      lines[lines.length - 1] = `${last.trim()}…`;
    }
  }
  return lines;
}

function drawWrapped(ctx, text, x, y, maxWidth, lineHeight, maxLines = Infinity) {
  const lines = wrapLines(ctx, text, maxWidth, maxLines);
  lines.forEach((line, index) => ctx.fillText(line, x, y + index * lineHeight));
  return { lines, bottom: y + lines.length * lineHeight };
}

function roundedRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawPaperTexture(ctx, width, height, opacity = 0.035) {
  ctx.save();
  ctx.globalAlpha = opacity;
  for (let i = 0; i < 1800; i += 1) {
    const x = (Math.sin(i * 91.71) * 0.5 + 0.5) * width;
    const y = (Math.sin(i * 41.37 + 1.2) * 0.5 + 0.5) * height;
    const r = 0.6 + ((i * 7) % 9) / 10;
    ctx.fillStyle = i % 3 ? "#000000" : "#ffffff";
    ctx.fillRect(x, y, r, r);
  }
  ctx.restore();
}

function drawPageNumber(ctx, pageNumber, width, height, safe, dark = false) {
  ctx.save();
  ctx.fillStyle = dark ? "rgba(255,255,255,.65)" : "rgba(16,20,22,.55)";
  ctx.font = `500 ${Math.round(width * 0.012)}px Arial, sans-serif`;
  ctx.textAlign = pageNumber % 2 === 0 ? "left" : "right";
  ctx.fillText(String(pageNumber).padStart(3, "0"), pageNumber % 2 === 0 ? safe : width - safe, height - safe * 0.48);
  ctx.restore();
}

function drawFlagCode(ctx, code, x, y, size, accent) {
  ctx.save();
  ctx.fillStyle = accent;
  roundedRect(ctx, x, y, size * 1.55, size, size * 0.16);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,.92)";
  ctx.font = `700 ${size * 0.42}px Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(code, x + size * 0.775, y + size * 0.52);
  ctx.restore();
}

function drawImageCover(ctx, image, x, y, width, height) {
  if (!image) return;
  const imageRatio = image.naturalWidth / image.naturalHeight;
  const targetRatio = width / height;
  let sx = 0;
  let sy = 0;
  let sw = image.naturalWidth;
  let sh = image.naturalHeight;
  if (imageRatio > targetRatio) {
    sw = image.naturalHeight * targetRatio;
    sx = (image.naturalWidth - sw) / 2;
  } else {
    sh = image.naturalWidth / targetRatio;
    sy = (image.naturalHeight - sh) / 2;
  }
  ctx.drawImage(image, sx, sy, sw, sh, x, y, width, height);
}

function loadImage(source) {
  if (!source) return Promise.resolve(null);
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = source;
  });
}

function canvasToBlob(canvas, quality = 0.92) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Kunne ikke opprette JPG-side")), "image/jpeg", quality);
  });
}

function createCanvas(preset) {
  const canvas = document.createElement("canvas");
  canvas.width = preset.width;
  canvas.height = preset.height;
  return canvas;
}

function countryFor(entry, countries) {
  return countries.find((country) => country.code === entry.countryCode) || {
    code: entry.countryCode,
    name: entry.countryName,
    continent: "Verden",
    dish: entry.dishName,
    city: "",
  };
}

async function renderCover({ entries, countries, preset, volume, totalVolumes, title }) {
  const canvas = createCanvas(preset);
  const ctx = canvas.getContext("2d", { alpha: false });
  const { width, height, safe } = preset;
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#080b0d");
  gradient.addColorStop(0.52, "#14191b");
  gradient.addColorStop(1, "#2c211c");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  drawPaperTexture(ctx, width, height, 0.025);

  const accent = COLORS.gold;
  ctx.strokeStyle = "rgba(198,166,106,.35)";
  ctx.lineWidth = Math.max(4, width * 0.0017);
  for (let radius = width * 0.14; radius <= width * 0.42; radius += width * 0.07) {
    ctx.beginPath();
    ctx.arc(width * 0.79, height * 0.22, radius, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(width * 0.79, height * 0.22, width * 0.016, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,.64)";
  ctx.font = `600 ${Math.round(width * 0.025)}px Arial, sans-serif`;
  ctx.letterSpacing = `${Math.round(width * 0.003)}px`;
  ctx.fillText(`VERDENSBORDET · VOLUME ${String(volume).padStart(2, "0")}`, safe, height * 0.14);

  ctx.fillStyle = COLORS.cream;
  ctx.font = `500 ${Math.round(width * 0.115)}px Georgia, serif`;
  ctx.fillText("Smaker", safe, height * 0.42);
  ctx.fillStyle = accent;
  ctx.font = `italic 500 ${Math.round(width * 0.115)}px Georgia, serif`;
  ctx.fillText("fra verden.", safe, height * 0.54);

  ctx.fillStyle = "rgba(255,255,255,.78)";
  ctx.font = `500 ${Math.round(width * 0.032)}px Arial, sans-serif`;
  ctx.fillText(title || "En matreise", safe, height * 0.64);

  const countriesCount = new Set(entries.map((entry) => entry.countryCode)).size;
  ctx.fillStyle = "rgba(255,255,255,.58)";
  ctx.font = `500 ${Math.round(width * 0.022)}px Arial, sans-serif`;
  ctx.fillText(`${entries.length} retter · ${countriesCount} land${totalVolumes > 1 ? ` · del ${volume} av ${totalVolumes}` : ""}`, safe, height * 0.7);

  const dotY = height - safe * 1.35;
  const display = entries.slice(0, 28);
  display.forEach((entry, index) => {
    const country = countryFor(entry, countries);
    const x = safe + index * ((width - safe * 2) / Math.max(28, display.length));
    ctx.fillStyle = CONTINENT_COLORS[country.continent] || COLORS.terracotta;
    ctx.beginPath();
    ctx.arc(x, dotY - Math.sin(index * 1.8) * width * 0.018, width * 0.0065, 0, Math.PI * 2);
    ctx.fill();
  });

  return canvasToBlob(canvas, 0.94);
}

async function renderIntroPage({ entries, countries, preset, pageNumber, volume, totalVolumes }) {
  const canvas = createCanvas(preset);
  const ctx = canvas.getContext("2d", { alpha: false });
  const { width, height, safe } = preset;
  ctx.fillStyle = COLORS.paper;
  ctx.fillRect(0, 0, width, height);
  drawPaperTexture(ctx, width, height);

  ctx.fillStyle = COLORS.ink;
  ctx.font = `500 ${Math.round(width * 0.07)}px Georgia, serif`;
  ctx.fillText("Reisen så langt", safe, safe * 1.5);
  ctx.fillStyle = COLORS.terracotta;
  ctx.fillRect(safe, safe * 1.8, width * 0.14, width * 0.008);

  const unique = [...new Set(entries.map((entry) => entry.countryCode))];
  ctx.fillStyle = COLORS.ink;
  ctx.font = `500 ${Math.round(width * 0.16)}px Georgia, serif`;
  ctx.fillText(String(unique.length).padStart(2, "0"), safe, height * 0.39);
  ctx.font = `600 ${Math.round(width * 0.028)}px Arial, sans-serif`;
  ctx.fillText("LAND I DENNE BOKEN", safe, height * 0.445);

  ctx.fillStyle = "rgba(16,20,22,.68)";
  ctx.font = `400 ${Math.round(width * 0.025)}px Arial, sans-serif`;
  drawWrapped(ctx, "Hver helg valgte kloden én ny destinasjon. Vi lagde maten, tok bildene og skrev ned det som faktisk skjedde – ikke bare den perfekte versjonen.", safe, height * 0.53, width * 0.6, width * 0.036, 6);

  const startX = width * 0.68;
  const startY = safe * 1.65;
  const radius = width * 0.17;
  ctx.strokeStyle = "rgba(16,20,22,.14)";
  ctx.lineWidth = width * 0.002;
  for (let i = 1; i <= 4; i += 1) {
    ctx.beginPath();
    ctx.arc(startX, startY + radius, radius * i / 4, 0, Math.PI * 2);
    ctx.stroke();
  }
  entries.slice(0, 42).forEach((entry, index) => {
    const country = countryFor(entry, countries);
    const angle = index * 2.39996;
    const distance = radius * Math.sqrt((index + 1) / Math.min(entries.length, 42));
    ctx.fillStyle = CONTINENT_COLORS[country.continent] || COLORS.terracotta;
    ctx.beginPath();
    ctx.arc(startX + Math.cos(angle) * distance, startY + radius + Math.sin(angle) * distance, width * 0.007, 0, Math.PI * 2);
    ctx.fill();
  });

  const chipsY = height * 0.76;
  const availableWidth = width - safe * 2;
  const chipWidth = availableWidth / 3 - width * 0.018;
  const stats = [
    ["RETTER", String(entries.length)],
    ["BILDER", String(entries.reduce((sum, entry) => sum + (entry.photos?.length || 0), 0))],
    ["VOLUME", `${String(volume).padStart(2, "0")}${totalVolumes > 1 ? ` / ${String(totalVolumes).padStart(2, "0")}` : ""}`],
  ];
  stats.forEach(([label, value], index) => {
    const x = safe + index * (chipWidth + width * 0.027);
    ctx.fillStyle = "rgba(255,255,255,.42)";
    roundedRect(ctx, x, chipsY, chipWidth, height * 0.12, width * 0.018);
    ctx.fill();
    ctx.fillStyle = "rgba(16,20,22,.55)";
    ctx.font = `600 ${Math.round(width * 0.016)}px Arial, sans-serif`;
    ctx.fillText(label, x + width * 0.025, chipsY + height * 0.038);
    ctx.fillStyle = COLORS.ink;
    ctx.font = `500 ${Math.round(width * 0.045)}px Georgia, serif`;
    ctx.fillText(value, x + width * 0.025, chipsY + height * 0.09);
  });

  drawPageNumber(ctx, pageNumber, width, height, safe, false);
  return canvasToBlob(canvas, 0.93);
}

async function renderIndexPage({ entries, countries, preset, pageNumber }) {
  const canvas = createCanvas(preset);
  const ctx = canvas.getContext("2d", { alpha: false });
  const { width, height, safe } = preset;
  ctx.fillStyle = COLORS.deep;
  ctx.fillRect(0, 0, width, height);
  drawPaperTexture(ctx, width, height, 0.022);

  ctx.fillStyle = COLORS.cream;
  ctx.font = `500 ${Math.round(width * 0.066)}px Georgia, serif`;
  ctx.fillText("Destinasjonene", safe, safe * 1.5);
  ctx.fillStyle = "rgba(255,255,255,.55)";
  ctx.font = `400 ${Math.round(width * 0.022)}px Arial, sans-serif`;
  ctx.fillText("En sideorden laget for automatisk opplasting til fotobok.", safe, safe * 1.95);

  const columns = preset.format === "1:1" ? 3 : 4;
  const rows = Math.ceil(entries.length / columns);
  const top = height * 0.24;
  const rowHeight = Math.min(height * 0.065, (height - top - safe * 1.3) / Math.max(rows, 1));
  const colWidth = (width - safe * 2) / columns;

  entries.forEach((entry, index) => {
    const column = Math.floor(index / rows);
    const row = index % rows;
    const x = safe + column * colWidth;
    const y = top + row * rowHeight;
    const country = countryFor(entry, countries);
    const accent = CONTINENT_COLORS[country.continent] || COLORS.terracotta;
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(x + width * 0.006, y - width * 0.004, width * 0.0045, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.58)";
    ctx.font = `600 ${Math.round(width * 0.012)}px Arial, sans-serif`;
    ctx.fillText(`${String(index + 1).padStart(2, "0")} · ${country.code}`, x + width * 0.018, y);
    ctx.fillStyle = COLORS.cream;
    ctx.font = `500 ${Math.round(width * 0.017)}px Georgia, serif`;
    const dish = cleanText(entry.dishName);
    ctx.fillText(dish.length > 28 ? `${dish.slice(0, 27)}…` : dish, x + width * 0.018, y + rowHeight * 0.38);
  });

  drawPageNumber(ctx, pageNumber, width, height, safe, true);
  return canvasToBlob(canvas, 0.93);
}

async function renderPhotoPage({ entry, country, preset, pageNumber }) {
  const canvas = createCanvas(preset);
  const ctx = canvas.getContext("2d", { alpha: false });
  const { width, height, safe } = preset;
  ctx.fillStyle = COLORS.deep;
  ctx.fillRect(0, 0, width, height);

  const photo = await loadImage(entry.photos?.[0]);
  if (photo) {
    drawImageCover(ctx, photo, 0, 0, width, height);
  } else {
    const gradient = ctx.createRadialGradient(width * 0.72, height * 0.25, width * 0.02, width * 0.5, height * 0.5, width * 0.75);
    gradient.addColorStop(0, CONTINENT_COLORS[country.continent] || COLORS.terracotta);
    gradient.addColorStop(1, COLORS.deep);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "rgba(255,255,255,.07)";
    ctx.font = `700 ${Math.round(width * 0.36)}px Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(country.code, width / 2, height * 0.55);
    ctx.textAlign = "left";
  }

  const overlay = ctx.createLinearGradient(0, height * 0.32, 0, height);
  overlay.addColorStop(0, "rgba(3,5,6,0)");
  overlay.addColorStop(0.55, "rgba(3,5,6,.28)");
  overlay.addColorStop(1, "rgba(3,5,6,.95)");
  ctx.fillStyle = overlay;
  ctx.fillRect(0, 0, width, height);

  const accent = CONTINENT_COLORS[country.continent] || COLORS.terracotta;
  drawFlagCode(ctx, country.code, safe, height * 0.59, width * 0.09, accent);

  ctx.fillStyle = "rgba(255,255,255,.72)";
  ctx.font = `600 ${Math.round(width * 0.022)}px Arial, sans-serif`;
  ctx.fillText(`${country.name.toUpperCase()} · ${country.city || country.continent}`, safe, height * 0.715);

  const titleSize = fitText(ctx, entry.dishName, width - safe * 2, width * 0.075, width * 0.045, 'Georgia, serif', 500);
  ctx.fillStyle = COLORS.cream;
  ctx.font = `500 ${titleSize}px Georgia, serif`;
  ctx.fillText(entry.dishName, safe, height * 0.79);

  ctx.fillStyle = "rgba(255,255,255,.74)";
  ctx.font = `400 ${Math.round(width * 0.024)}px Arial, sans-serif`;
  drawWrapped(ctx, entry.memory || entry.personalTwist || "Et nytt kapittel rundt Verdensbordet.", safe, height * 0.845, width * 0.71, width * 0.034, 3);

  const score = averageRating(entry);
  const scoreText = score ? `${score.toFixed(1)} / 5` : "Ikke vurdert";
  ctx.textAlign = "right";
  ctx.fillStyle = COLORS.gold;
  ctx.font = `500 ${Math.round(width * 0.045)}px Georgia, serif`;
  ctx.fillText(scoreText, width - safe, height * 0.74);
  ctx.fillStyle = "rgba(255,255,255,.6)";
  ctx.font = `600 ${Math.round(width * 0.015)}px Arial, sans-serif`;
  ctx.fillText(`${entry.cookedAt || ""} · VERDENSBORDET`, width - safe, height * 0.78);
  ctx.textAlign = "left";

  drawPageNumber(ctx, pageNumber, width, height, safe, true);
  return canvasToBlob(canvas, 0.94);
}

function ingredientLine(item) {
  const amount = item.scaledAmount ?? item.amount ?? "";
  const amountString = typeof amount === "number" ? Number(amount.toFixed(2)).toString().replace(".", ",") : amount;
  return `${amountString} ${item.unit || ""} ${item.name || ""}`.trim();
}

async function renderRecipePage({ entry, country, preset, pageNumber }) {
  const canvas = createCanvas(preset);
  const ctx = canvas.getContext("2d", { alpha: false });
  const { width, height, safe } = preset;
  ctx.fillStyle = COLORS.paper;
  ctx.fillRect(0, 0, width, height);
  drawPaperTexture(ctx, width, height);

  const accent = CONTINENT_COLORS[country.continent] || COLORS.terracotta;
  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, width * 0.025, height);
  drawFlagCode(ctx, country.code, safe, safe, width * 0.055, accent);

  ctx.fillStyle = "rgba(16,20,22,.55)";
  ctx.font = `600 ${Math.round(width * 0.018)}px Arial, sans-serif`;
  ctx.fillText(`${country.name.toUpperCase()} · VÅR VERSJON`, safe + width * 0.08, safe + width * 0.035);

  const titleSize = fitText(ctx, entry.dishName, width - safe * 2, width * 0.065, width * 0.04, 'Georgia, serif', 500);
  ctx.fillStyle = COLORS.ink;
  ctx.font = `500 ${titleSize}px Georgia, serif`;
  ctx.fillText(entry.dishName, safe, safe + width * 0.13);

  const metaTop = safe + width * 0.19;
  const meta = [
    ["TID", entry.actualMinutes ? `${entry.actualMinutes} min` : "—"],
    ["KOSTNAD", entry.costNok ? `${Number(entry.costNok).toLocaleString("nb-NO")} kr` : "—"],
    ["PERSON 1", entry.ratingPerson1 ? `${entry.ratingPerson1}/5` : "—"],
    ["PERSON 2", entry.ratingPerson2 ? `${entry.ratingPerson2}/5` : "—"],
  ];
  const metaWidth = (width - safe * 2) / meta.length;
  meta.forEach(([label, value], index) => {
    const x = safe + index * metaWidth;
    ctx.fillStyle = "rgba(16,20,22,.42)";
    ctx.font = `600 ${Math.round(width * 0.012)}px Arial, sans-serif`;
    ctx.fillText(label, x, metaTop);
    ctx.fillStyle = COLORS.ink;
    ctx.font = `500 ${Math.round(width * 0.023)}px Georgia, serif`;
    ctx.fillText(value, x, metaTop + width * 0.035);
  });

  ctx.strokeStyle = "rgba(16,20,22,.18)";
  ctx.lineWidth = Math.max(2, width * 0.001);
  ctx.beginPath();
  ctx.moveTo(safe, metaTop + width * 0.07);
  ctx.lineTo(width - safe, metaTop + width * 0.07);
  ctx.stroke();

  const contentTop = metaTop + width * 0.12;
  const gutter = width * 0.055;
  const leftWidth = (width - safe * 2 - gutter) * 0.39;
  const rightX = safe + leftWidth + gutter;
  const rightWidth = width - safe - rightX;

  ctx.fillStyle = COLORS.terracotta;
  ctx.font = `600 ${Math.round(width * 0.015)}px Arial, sans-serif`;
  ctx.fillText("INGREDIENSER", safe, contentTop);

  const recipe = entry.recipeSnapshot || {};
  const ingredients = recipe.ingredients || [];
  let y = contentTop + width * 0.042;
  let currentGroup = "";
  const bodySize = Math.round(width * (ingredients.length > 16 ? 0.014 : 0.016));
  ingredients.slice(0, 24).forEach((item) => {
    if (item.group && item.group !== currentGroup) {
      currentGroup = item.group;
      y += width * 0.018;
      ctx.fillStyle = "rgba(16,20,22,.48)";
      ctx.font = `600 ${Math.round(width * 0.011)}px Arial, sans-serif`;
      ctx.fillText(currentGroup.toUpperCase(), safe, y);
      y += width * 0.026;
    }
    ctx.fillStyle = COLORS.ink;
    ctx.font = `400 ${bodySize}px Arial, sans-serif`;
    const line = ingredientLine(item);
    const lines = wrapLines(ctx, line, leftWidth, 2);
    lines.forEach((part) => {
      ctx.fillText(part, safe, y);
      y += bodySize * 1.48;
    });
  });

  ctx.fillStyle = COLORS.terracotta;
  ctx.font = `600 ${Math.round(width * 0.015)}px Arial, sans-serif`;
  ctx.fillText("FREMGANGSMÅTE", rightX, contentTop);
  y = contentTop + width * 0.044;
  const steps = recipe.steps || [];
  const stepBodySize = Math.round(width * (steps.length > 5 ? 0.013 : 0.015));
  steps.slice(0, 7).forEach((step, index) => {
    ctx.fillStyle = accent;
    ctx.font = `600 ${Math.round(width * 0.012)}px Arial, sans-serif`;
    ctx.fillText(`${String(index + 1).padStart(2, "0")} · ${(step.title || "STEG").toUpperCase()} · ${step.minutes || "—"} MIN`, rightX, y);
    y += width * 0.027;
    ctx.fillStyle = COLORS.ink;
    ctx.font = `400 ${stepBodySize}px Arial, sans-serif`;
    const result = drawWrapped(ctx, step.instruction || "", rightX, y, rightWidth, stepBodySize * 1.48, 4);
    y = result.bottom + width * 0.026;
  });

  const noteHeight = height * 0.17;
  const noteY = height - safe - noteHeight;
  ctx.fillStyle = "rgba(255,255,255,.38)";
  roundedRect(ctx, safe, noteY, width - safe * 2, noteHeight, width * 0.018);
  ctx.fill();
  ctx.fillStyle = "rgba(16,20,22,.48)";
  ctx.font = `600 ${Math.round(width * 0.012)}px Arial, sans-serif`;
  ctx.fillText("DET VI LÆRTE", safe + width * 0.025, noteY + height * 0.045);
  ctx.fillStyle = COLORS.ink;
  ctx.font = `400 ${Math.round(width * 0.016)}px Arial, sans-serif`;
  const learning = [entry.personalTwist, entry.notes, entry.nextTime].filter(Boolean).join(" · ") || "Kapittelet er klart for egne notater etter neste servering.";
  drawWrapped(ctx, learning, safe + width * 0.025, noteY + height * 0.085, width - safe * 2 - width * 0.05, width * 0.025, 3);

  drawPageNumber(ctx, pageNumber, width, height, safe, false);
  return canvasToBlob(canvas, 0.93);
}

async function renderBackCover({ entries, preset, volume, totalVolumes }) {
  const canvas = createCanvas(preset);
  const ctx = canvas.getContext("2d", { alpha: false });
  const { width, height, safe } = preset;
  ctx.fillStyle = COLORS.deep;
  ctx.fillRect(0, 0, width, height);
  drawPaperTexture(ctx, width, height, 0.022);

  ctx.fillStyle = COLORS.gold;
  ctx.font = `italic 500 ${Math.round(width * 0.065)}px Georgia, serif`;
  ctx.fillText("Neste helg", safe, height * 0.34);
  ctx.fillStyle = COLORS.cream;
  ctx.font = `500 ${Math.round(width * 0.085)}px Georgia, serif`;
  ctx.fillText("venter en ny verden.", safe, height * 0.45);
  ctx.fillStyle = "rgba(255,255,255,.62)";
  ctx.font = `400 ${Math.round(width * 0.024)}px Arial, sans-serif`;
  drawWrapped(ctx, "Vi laget ikke bare oppskriftene. Vi bygget et arkiv over smak, kaos, samarbeid og små kvelder vi ellers kunne ha glemt.", safe, height * 0.56, width * 0.66, width * 0.036, 5);
  ctx.fillStyle = "rgba(255,255,255,.38)";
  ctx.font = `600 ${Math.round(width * 0.016)}px Arial, sans-serif`;
  ctx.fillText(`VERDENSBORDET · VOLUME ${String(volume).padStart(2, "0")}${totalVolumes > 1 ? ` / ${String(totalVolumes).padStart(2, "0")}` : ""} · ${entries.length} KAPITLER`, safe, height - safe);

  return canvasToBlob(canvas, 0.94);
}

function dosDateTime(date = new Date()) {
  const year = Math.max(1980, date.getFullYear());
  const time = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const dosDate = ((year - 1980) << 9) | (month << 5) | day;
  return { time, date: dosDate };
}

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let value = i;
    for (let j = 0; j < 8; j += 1) value = (value & 1) ? (0xedb88320 ^ (value >>> 1)) : (value >>> 1);
    table[i] = value >>> 0;
  }
  return table;
})();

function crc32(bytes) {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i += 1) crc = crcTable[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function uint16(value) {
  const bytes = new Uint8Array(2);
  new DataView(bytes.buffer).setUint16(0, value, true);
  return bytes;
}

function uint32(value) {
  const bytes = new Uint8Array(4);
  new DataView(bytes.buffer).setUint32(0, value >>> 0, true);
  return bytes;
}

function concatBytes(chunks) {
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  chunks.forEach((chunk) => {
    result.set(chunk, offset);
    offset += chunk.length;
  });
  return result;
}

async function buildZip(files) {
  const localChunks = [];
  const centralChunks = [];
  let offset = 0;
  const { time, date } = dosDateTime();

  for (const file of files) {
    const nameBytes = encoder.encode(file.name);
    const bytes = file.bytes instanceof Uint8Array ? file.bytes : new Uint8Array(await file.blob.arrayBuffer());
    const crc = crc32(bytes);
    const localHeader = concatBytes([
      uint32(0x04034b50), uint16(20), uint16(0x0800), uint16(0), uint16(time), uint16(date),
      uint32(crc), uint32(bytes.length), uint32(bytes.length), uint16(nameBytes.length), uint16(0), nameBytes,
    ]);
    localChunks.push(localHeader, bytes);

    const centralHeader = concatBytes([
      uint32(0x02014b50), uint16(20), uint16(20), uint16(0x0800), uint16(0), uint16(time), uint16(date),
      uint32(crc), uint32(bytes.length), uint32(bytes.length), uint16(nameBytes.length), uint16(0), uint16(0),
      uint16(0), uint16(0), uint32(0), uint32(offset), nameBytes,
    ]);
    centralChunks.push(centralHeader);
    offset += localHeader.length + bytes.length;
  }

  const central = concatBytes(centralChunks);
  const end = concatBytes([
    uint32(0x06054b50), uint16(0), uint16(0), uint16(files.length), uint16(files.length),
    uint32(central.length), uint32(offset), uint16(0),
  ]);
  return new Blob([...localChunks, central, end], { type: "application/zip" });
}

function textFile(name, text) {
  return { name, bytes: encoder.encode(text) };
}

function filenameSafe(value) {
  return cleanText(value).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "side";
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function uploadGuide(preset, volumeEntries, pageCount, volume, totalVolumes) {
  return `VERDENSBORDET – FOTOBOKPAKKE\n\nFORMAT\n${preset.label}\n${preset.width} × ${preset.height} piksler · JPG · sRGB\nTilpasset: ${preset.providers}\n\nINNHOLD\n- cover-front.jpg: bruk som bildeomslag/forside\n- pages/page-001.jpg osv.: last opp i numerisk rekkefølge\n- cover-back.jpg: kan brukes som bakside eller siste side\n- manifest.json: teknisk sideorden og kapitteldata\n\nVOLUME\n${volume} av ${totalVolumes}\n${volumeEntries.length} kokebokkapitler · ${pageCount} innholdssider\n\nBESTILLING\n1. Velg fotobokformatet som matcher pakken.\n2. Last opp alle JPG-filene fra pages-mappen i nummerrekkefølge.\n3. Bruk ett bilde per side og velg et rent helsideoppsett.\n4. Kontroller automatisk beskjæring, særlig ansikter, tallerkenkant og tekst.\n5. Hold tekst innenfor den synlige sikkerhetssonen. Eksporten har allerede ca. ${preset.safe}px intern sikkerhetsmargin.\n6. Se gjennom forhåndsvisningen før bestilling. Leverandørenes skjæring og innbinding kan variere noen millimeter.\n\nMERK\nFotoKnudsen støtter JPG og PNG i nettredigeringen. CEWE/Japan Photo lar deg laste opp bilder i fotobokverktøyet. Denne pakken er laget som universelle helsider, ikke som et leverandørspesifikt prosjektformat.\n`;
}

export async function exportPhotoBook({
  entries,
  countries,
  presetId = "square30",
  volumeSize = 58,
  includeOriginals = false,
  title = "En matreise",
  onProgress = () => {},
} = {}) {
  const preset = BOOK_PRESETS[presetId] || BOOK_PRESETS.square30;
  const sorted = [...(entries || [])].sort((a, b) => new Date(a.cookedAt || a.createdAt) - new Date(b.cookedAt || b.createdAt));
  if (!sorted.length) throw new Error("Albumet trenger minst ett lagret kokebokkapittel.");

  const safeVolumeSize = clamp(Number(volumeSize) || 58, 1, 58);
  const volumes = [];
  for (let i = 0; i < sorted.length; i += safeVolumeSize) volumes.push(sorted.slice(i, i + safeVolumeSize));
  const files = [];
  let generated = 0;
  const totalPagesToGenerate = volumes.reduce((sum, volume) => sum + 4 + volume.length * 2, 0);

  for (let volumeIndex = 0; volumeIndex < volumes.length; volumeIndex += 1) {
    const volume = volumeIndex + 1;
    const folder = volumes.length > 1 ? `volume-${String(volume).padStart(2, "0")}/` : "";
    const volumeEntries = volumes[volumeIndex];
    let pageNumber = 1;

    const addBlob = async (name, promise) => {
      const blob = await promise;
      files.push({ name: `${folder}${name}`, blob });
      generated += 1;
      onProgress({ current: generated, total: totalPagesToGenerate, label: name, volume, totalVolumes: volumes.length });
      await new Promise((resolve) => setTimeout(resolve, 0));
    };

    await addBlob("cover-front.jpg", renderCover({ entries: volumeEntries, countries, preset, volume, totalVolumes: volumes.length, title }));
    await addBlob(`pages/page-${String(pageNumber).padStart(3, "0")}-intro.jpg`, renderIntroPage({ entries: volumeEntries, countries, preset, pageNumber, volume, totalVolumes: volumes.length }));
    pageNumber += 1;
    await addBlob(`pages/page-${String(pageNumber).padStart(3, "0")}-destinasjoner.jpg`, renderIndexPage({ entries: volumeEntries, countries, preset, pageNumber }));
    pageNumber += 1;

    for (const entry of volumeEntries) {
      const country = countryFor(entry, countries);
      const slug = filenameSafe(`${country.code}-${entry.dishName}`);
      await addBlob(`pages/page-${String(pageNumber).padStart(3, "0")}-${slug}-foto.jpg`, renderPhotoPage({ entry, country, preset, pageNumber }));
      pageNumber += 1;
      await addBlob(`pages/page-${String(pageNumber).padStart(3, "0")}-${slug}-oppskrift.jpg`, renderRecipePage({ entry, country, preset, pageNumber }));
      pageNumber += 1;
    }

    await addBlob("cover-back.jpg", renderBackCover({ entries: volumeEntries, preset, volume, totalVolumes: volumes.length }));

    if (includeOriginals) {
      volumeEntries.forEach((entry, entryIndex) => {
        (entry.photos || []).forEach((source, photoIndex) => {
          const match = /^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i.exec(source);
          if (!match) return;
          const extension = match[1].includes("png") ? "png" : "jpg";
          const binary = atob(match[2]);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
          files.push({ name: `${folder}originals/${String(entryIndex + 1).padStart(3, "0")}-${entry.countryCode}-${photoIndex + 1}.${extension}`, bytes });
        });
      });
    }

    const manifest = {
      product: "Verdensbordet Photo Book Export",
      version: 2,
      createdAt: new Date().toISOString(),
      preset,
      volume,
      totalVolumes: volumes.length,
      pageCount: pageNumber - 1,
      entryCount: volumeEntries.length,
      entries: volumeEntries.map((entry, index) => ({
        order: index + 1,
        countryCode: entry.countryCode,
        countryName: entry.countryName,
        dishName: entry.dishName,
        cookedAt: entry.cookedAt,
        score: averageRating(entry),
      })),
    };
    files.push(textFile(`${folder}manifest.json`, JSON.stringify(manifest, null, 2)));
    files.push(textFile(`${folder}README-FOTOBOK.txt`, uploadGuide(preset, volumeEntries, pageNumber - 1, volume, volumes.length)));
  }

  onProgress({ current: generated, total: totalPagesToGenerate, label: "Pakker ZIP …", volume: volumes.length, totalVolumes: volumes.length });
  const zip = await buildZip(files);
  const filename = `Verdensbordet-fotobok-${preset.id}-${new Date().toISOString().slice(0, 10)}.zip`;
  downloadBlob(zip, filename);
  return { blob: zip, filename, volumeCount: volumes.length, entries: sorted.length, files: files.length, preset };
}
