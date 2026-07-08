const TILE_W = 64;
const TILE_H = 32;
const SAVE_KEY = "codex-city.browser.v1";
const ZONES = new Set(["residential", "commercial", "industrial"]);
const CIVICS = new Set(["police", "fire", "hospital", "school", "park", "power", "water_tower", "transit", "landfill"]);
const DIRS = [
  [1, 0, -1],
  [2, 1, 0],
  [4, 0, 1],
  [8, -1, 0],
];
const COSTS = {
  road: 12,
  bridge: 55,
  pipe: 8,
  residential: 25,
  commercial: 35,
  industrial: 30,
  police: 700,
  fire: 650,
  hospital: 900,
  school: 750,
  park: 120,
  power: 1200,
  water_tower: 850,
  transit: 650,
  landfill: 550,
  bulldoze: 4,
};
const MILESTONES = [
  ["Village", 100, 2500],
  ["Town", 350, 5000],
  ["City", 900, 10000],
  ["Metropolis", 2000, 20000],
];
const NEIGHBOR_TEMPLATES = [
  { name: "Northgate", population: 42000, specialty: "High-tech commerce", relation: 62 },
  { name: "Eastbank", population: 36000, specialty: "River freight", relation: 58 },
  { name: "Southworks", population: 51000, specialty: "Heavy industry", relation: 54 },
];
const UPKEEP = {
  police: 55,
  fire: 50,
  hospital: 75,
  school: 60,
  park: 8,
  power: 95,
  water_tower: 55,
  transit: 35,
  landfill: 22,
};
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d", { alpha: false });
const statsEl = document.getElementById("stats");
const reportEl = document.getElementById("report");
const statusEl = document.getElementById("status");
const menuEl = document.getElementById("menu");
const taxSlider = document.getElementById("taxSlider");
const taxLabel = document.getElementById("taxLabel");
let assets = null;
let images = new Map();
let lastTime = performance.now();
let simAccumulator = 0;
let activeTool = "road";
let drag = null;
let hover = null;
let selectedTile = null;
let panning = null;
let mapEditor = false;
let audio = null;
const camera = { x: 0, y: 82, zoom: 1 };
const state = newCity();

function newCity(editor = false) {
  const width = 34;
  const height = 34;
  const tiles = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const river = Math.abs(x - y + 5) < 2 && x > 17;
      const lake = (x - 5) ** 2 + (y - 27) ** 2 < 18;
      const forest = (x * 17 + y * 31) % 19 === 0;
      tiles.push({
        x, y,
        terrain: river || lake ? "water" : forest ? "forest" : "grass",
        road: false,
        bridge: false,
        pipe: false,
        zone: null,
        level: 0,
        civic: null,
        rubble: false,
        fire: 0,
        pollution: 0,
        variant: (x * 97 + y * 53) % 11,
      });
    }
  }
  const city = {
    version: 1,
    seed: Date.now() & 0xffff,
    width,
    height,
    month: 1,
    year: 1,
    money: editor ? 500000 : 15000,
    tax: 9,
    loanBalance: 0,
    paused: false,
    speed: 1,
    population: 0,
    jobs: 0,
    happiness: 62,
    crime: 0,
    fireRisk: 0,
    unemployment: 0,
    powerDemand: 0,
    powerCapacity: 0,
    waterDemand: 0,
    waterCapacity: 0,
    pipeTiles: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    tradeIncome: 0,
    neighborCommuters: 0,
    concerns: ["Welcome, Mayor."],
    budgetLines: {},
    milestones: [],
    neighbors: NEIGHBOR_TEMPLATES.map((neighbor) => ({ ...neighbor, trade: false, exports: 0, commuters: 0 })),
    connectedRoads: 0,
    tiles,
    effects: [],
    vehicles: [],
    events: ["Welcome to Codex City."],
    selectedTile: null,
  };
  seedStarterTown(city);
  return city;
}

function seedStarterTown(city) {
  // New games should feel like a true founding moment: one outside road
  // connection, then the player builds every zone, service, and utility.
  for (let x = 0; x <= 8; x++) buildRoad(city, x, 16, true);
  city.money = mapEditor ? 500000 : 15000;
}

function resetCity(editor = false) {
  const fresh = newCity(editor);
  Object.keys(state).forEach((key) => delete state[key]);
  Object.assign(state, fresh);
  selectedTile = null;
  mapEditor = editor;
  updateHud();
  status(editor ? "Map editor opened: big budget, same living simulation." : "New city started. Draw roads first, then drag zones.");
}

function ensureCityDefaults(city = state) {
  city.loanBalance ??= 0;
  city.pipeTiles ??= 0;
  city.monthlyIncome ??= 0;
  city.monthlyExpenses ??= 0;
  city.tradeIncome ??= 0;
  city.neighborCommuters ??= 0;
  city.concerns ??= [];
  city.budgetLines ??= {};
  city.milestones ??= [];
  city.neighbors ??= NEIGHBOR_TEMPLATES.map((neighbor) => ({ ...neighbor, trade: false, exports: 0, commuters: 0 }));
  city.selectedTile ??= null;
  for (const t of city.tiles || []) t.pipe ??= false;
  return city;
}

async function boot() {
  resize();
  window.addEventListener("resize", resize);
  bindUi();
  try {
    assets = await fetch("./assets/world/manifest.json").then((res) => {
      if (!res.ok) throw new Error(`manifest ${res.status}`);
      return res.json();
    });
    await preloadCriticalAssets();
    updateHud();
    status("Assets loaded. The city is ready.");
  } catch (error) {
    console.error(error);
    updateHud();
    status("Asset loading failed. The game will use colored fallback tiles.");
  }
  centerCamera();
  requestAnimationFrame(frame);
}

function resize() {
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  canvas.width = Math.floor(innerWidth * dpr);
  canvas.height = Math.floor(innerHeight * dpr);
  canvas.style.width = `${innerWidth}px`;
  canvas.style.height = `${innerHeight}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = false;
}

function centerCamera() {
  camera.x = innerWidth / 2;
  camera.y = Math.max(116, innerHeight * 0.18);
  camera.zoom = Math.min(1.05, Math.max(0.72, innerWidth / 1200));
}

function bindUi() {
  document.querySelectorAll(".toolbar [data-tool]").forEach((button) => {
    button.addEventListener("click", () => setTool(button.dataset.tool));
  });
  document.querySelectorAll(".emergencies [data-disaster]").forEach((button) => {
    button.addEventListener("click", () => triggerDisaster(button.dataset.disaster));
  });
  document.querySelectorAll(".speed-row [data-speed]").forEach((button) => {
    button.addEventListener("click", () => {
      state.speed = Number(button.dataset.speed);
      document.querySelectorAll(".speed-row button").forEach((b) => b.classList.toggle("active", b === button));
      status(`Simulation speed set to ${state.speed}x.`);
    });
  });
  document.querySelector('.speed-row [data-speed="1"]')?.classList.add("active");
  taxSlider.addEventListener("input", () => {
    state.tax = Number(taxSlider.value);
    taxLabel.textContent = `${state.tax}%`;
    updateHud();
  });
  reportEl.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-finance],button[data-trade]");
    if (!button) return;
    if (button.dataset.finance === "borrow") borrowMoney();
    if (button.dataset.finance === "repay") repayMoney();
    if (button.dataset.trade) toggleTrade(button.dataset.trade);
  });
  document.getElementById("pauseBtn").addEventListener("click", () => {
    state.paused = !state.paused;
    document.getElementById("pauseBtn").textContent = state.paused ? "Resume" : "Pause";
    status(state.paused ? "Simulation paused." : "Simulation resumed.");
  });
  document.getElementById("saveBtn").addEventListener("click", saveGame);
  document.getElementById("menuBtn").addEventListener("click", () => menuEl.classList.add("open"));
  document.getElementById("newBtn").addEventListener("click", () => {
    resetCity(false);
    menuEl.classList.remove("open");
  });
  document.getElementById("loadBtn").addEventListener("click", () => {
    if (loadGame()) menuEl.classList.remove("open");
  });
  document.getElementById("editorBtn").addEventListener("click", () => {
    resetCity(true);
    menuEl.classList.remove("open");
  });
  document.getElementById("settingsBtn").addEventListener("click", () => {
    camera.zoom = 1;
    centerCamera();
    status("Camera reset. Wheel zoom and right-drag pan are available.");
  });
  canvas.addEventListener("contextmenu", (event) => event.preventDefault());
  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);
  canvas.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("keydown", (event) => {
    const keyTools = { r: "road", z: "residential", c: "commercial", i: "industrial", b: "bulldoze", p: "police", f: "fire", x: "inspect" };
    if (keyTools[event.key.toLowerCase()]) setTool(keyTools[event.key.toLowerCase()]);
    if (event.code === "Space") {
      state.paused = !state.paused;
      event.preventDefault();
    }
  });
}

async function preloadCriticalAssets() {
  if (!assets) return;
  const wanted = new Set([
    "terrain.grass.0", "terrain.grass.1", "terrain.water.0", "terrain.forest.0",
    "zone.residential.base", "zone.commercial.base", "zone.industrial.base",
    "preview.residential.valid", "preview.commercial.valid", "preview.industrial.valid",
  ]);
  for (let mask = 0; mask < 16; mask++) {
    wanted.add(`road.${mask.toString(16).padStart(2, "0")}`);
    wanted.add(`bridge.${mask.toString(16).padStart(2, "0")}`);
  }
  for (const family of Object.keys(assets.families || {})) {
    if (family.startsWith("building.") || family.startsWith("civic.") || family.startsWith("effect.") || family.startsWith("vehicle.car.")) {
      for (const key of assets.families[family]) wanted.add(key);
    }
  }
  await Promise.all([...wanted].map(loadImage));
}

function spriteInfo(key) {
  return assets?.sprites?.[key] || null;
}

function familyChoice(familyName, t) {
  const family = assets?.families?.[familyName] || [];
  if (!family.length) return null;
  return family[Math.abs(t.variant + t.x * 3 + t.y * 5) % family.length];
}

function tileSpriteKey(t) {
  if (!t) return null;
  if (t.rubble) return familyChoice("civic.rubble", t) || "civic.rubble.0";
  if (t.civic) return familyChoice(`civic.${t.civic}`, t) || `civic.${t.civic}.0`;
  if (t.zone && t.level > 0) return familyChoice(`building.${t.zone}.level${t.level}`, t);
  if (t.zone) return `zone.${t.zone}.base`;
  if (t.road) {
    const family = t.bridge ? "bridge" : "road";
    const mask = roadMask(t.x, t.y, t.bridge).toString(16).padStart(2, "0");
    return `${family}.${mask}`;
  }
  return terrainSprite(t);
}

function loadImage(key) {
  if (images.has(key)) return images.get(key);
  const info = spriteInfo(key);
  if (!info) return Promise.resolve(null);
  const promise = new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = `./assets/world/${info.path}`;
  });
  images.set(key, promise);
  return promise;
}

function imageFor(key) {
  const value = images.get(key);
  if (value instanceof HTMLImageElement) return value;
  if (value?.then) {
    value.then((img) => {
      if (img) images.set(key, img);
    });
  }
  return null;
}

function frame(now) {
  const dt = Math.min(80, now - lastTime);
  lastTime = now;
  if (!state.paused && !menuEl.classList.contains("open")) {
    simAccumulator += dt * state.speed;
    while (simAccumulator >= 2500) {
      simulateMonth();
      simAccumulator -= 2500;
    }
  }
  animateVehicles(dt);
  render(now);
  requestAnimationFrame(frame);
}

function worldToScreen(x, y) {
  return {
    x: camera.x + (x - y) * (TILE_W / 2) * camera.zoom,
    y: camera.y + (x + y) * (TILE_H / 2) * camera.zoom,
  };
}

function screenToWorld(sx, sy) {
  const a = (sx - camera.x) / ((TILE_W / 2) * camera.zoom);
  const b = (sy - camera.y) / ((TILE_H / 2) * camera.zoom);
  return { x: Math.round((a + b) / 2), y: Math.round((b - a) / 2) };
}

function inBounds(x, y) {
  return x >= 0 && y >= 0 && x < state.width && y < state.height;
}

function tile(x, y) {
  return inBounds(x, y) ? state.tiles[y * state.width + x] : null;
}

function rectCells(a, b) {
  const out = [];
  for (let y = Math.min(a.y, b.y); y <= Math.max(a.y, b.y); y++) {
    for (let x = Math.min(a.x, b.x); x <= Math.max(a.x, b.x); x++) out.push({ x, y });
  }
  return out;
}

function lineCells(a, b) {
  let x = a.x;
  let y = a.y;
  const dx = Math.abs(b.x - x);
  const sx = x < b.x ? 1 : -1;
  const dy = -Math.abs(b.y - y);
  const sy = y < b.y ? 1 : -1;
  let error = dx + dy;
  const out = [];
  for (;;) {
    out.push({ x, y });
    if (x === b.x && y === b.y) return out;
    const e2 = 2 * error;
    if (e2 >= dy) {
      error += dy;
      x += sx;
    }
    if (e2 <= dx) {
      error += dx;
      y += sy;
    }
  }
}

function gestureCells(tool, a, b) {
  if (tool === "inspect") return [b];
  if (ZONES.has(tool)) return rectCells(a, b);
  if (CIVICS.has(tool)) return [b];
  return lineCells(a, b);
}

function onPointerDown(event) {
  canvas.setPointerCapture(event.pointerId);
  const point = { x: event.clientX, y: event.clientY };
  if (event.button === 2 || event.buttons === 2) {
    panning = { ...point, cameraX: camera.x, cameraY: camera.y };
    return;
  }
  ensureAudio();
  const cell = screenToWorld(point.x, point.y);
  drag = { start: cell, current: cell, pointerId: event.pointerId };
  hover = cell;
}

function onPointerMove(event) {
  if (panning) {
    camera.x = panning.cameraX + event.clientX - panning.x;
    camera.y = panning.cameraY + event.clientY - panning.y;
    return;
  }
  const cell = screenToWorld(event.clientX, event.clientY);
  hover = cell;
  if (drag) drag.current = cell;
}

function onPointerUp(event) {
  if (panning) {
    panning = null;
    return;
  }
  if (!drag) return;
  commitGesture(activeTool, drag.start, drag.current);
  drag = null;
}

function onWheel(event) {
  event.preventDefault();
  const before = screenToWorld(event.clientX, event.clientY);
  const oldZoom = camera.zoom;
  camera.zoom = Math.max(0.48, Math.min(1.85, camera.zoom * (event.deltaY > 0 ? 0.9 : 1.1)));
  const after = worldToScreen(before.x, before.y);
  camera.x += event.clientX - after.x;
  camera.y += event.clientY - after.y;
  if (Math.abs(oldZoom - camera.zoom) > 0.001) status(`Zoom ${Math.round(camera.zoom * 100)}%.`);
}

function setTool(tool) {
  activeTool = tool;
  document.querySelectorAll(".toolbar [data-tool]").forEach((button) => {
    button.classList.toggle("active", button.dataset.tool === tool);
  });
  status(`${label(tool)} tool selected.`);
}

function commitGesture(toolName, start, end) {
  const cells = gestureCells(toolName, start, end).filter((cell) => inBounds(cell.x, cell.y));
  if (!cells.length) return;
  let cost = 0;
  let changed = 0;
  if (toolName === "inspect") {
    const cell = cells[cells.length - 1];
    selectedTile = { x: cell.x, y: cell.y };
    state.selectedTile = selectedTile;
    updateHud();
    status(`Inspecting block ${cell.x + 1}-${cell.y + 1}.`);
    return;
  }
  if (ZONES.has(toolName)) {
    for (const cell of cells) {
      const t = tile(cell.x, cell.y);
      if (!t || t.terrain === "water" || t.road || t.civic || t.rubble) continue;
      if (t.zone !== toolName) cost += COSTS[toolName];
    }
    if (!canAfford(cost)) return;
    for (const cell of cells) if (setZone(state, cell.x, cell.y, toolName)) changed++;
  } else if (toolName === "road") {
    for (const cell of cells) {
      const t = tile(cell.x, cell.y);
      if (!t || t.road || t.civic) continue;
      cost += t.terrain === "water" ? COSTS.bridge : COSTS.road;
    }
    if (!canAfford(cost)) return;
    for (const cell of cells) if (buildRoad(state, cell.x, cell.y)) changed++;
  } else if (toolName === "pipe") {
    for (const cell of cells) {
      const t = tile(cell.x, cell.y);
      if (!t || t.terrain === "water" || t.pipe) continue;
      cost += COSTS.pipe;
    }
    if (!canAfford(cost)) return;
    for (const cell of cells) if (buildPipe(state, cell.x, cell.y)) changed++;
  } else if (toolName === "bulldoze") {
    cost = cells.length * COSTS.bulldoze;
    if (!canAfford(cost)) return;
    for (const cell of cells) if (bulldoze(cell.x, cell.y)) changed++;
  } else if (CIVICS.has(toolName)) {
    const cell = cells[cells.length - 1];
    const t = tile(cell.x, cell.y);
    cost = COSTS[toolName] || 500;
    if (!t || t.terrain === "water" || t.road || t.zone || t.civic || !canAfford(cost)) return;
    if (placeCivic(state, cell.x, cell.y, toolName)) changed++;
  }
  if (changed) {
    state.money -= cost;
    spawnBuildFeedback(cells);
    updateHud();
    playTone(260 + Math.min(400, changed * 18), 0.035, "triangle");
    status(`${label(toolName)} placed: ${changed} cell${changed === 1 ? "" : "s"} for $${cost.toLocaleString()}.`);
  }
}

function canAfford(cost) {
  if (cost <= state.money || mapEditor) return true;
  status(`Not enough funds. Need $${cost.toLocaleString()}, have $${state.money.toLocaleString()}.`);
  playTone(120, 0.08, "sawtooth");
  return false;
}

function borrowMoney() {
  ensureCityDefaults();
  if (state.loanBalance >= 30000) {
    status("Credit limit reached.");
    return;
  }
  state.loanBalance += 10000;
  state.money += 10000;
  status("Municipal bond issued: borrowed $10,000.");
  updateHud();
}

function repayMoney() {
  ensureCityDefaults();
  const amount = Math.min(5000, state.loanBalance);
  if (!amount) {
    status("No outstanding loan.");
    return;
  }
  if (!canAfford(amount)) return;
  state.money -= amount;
  state.loanBalance -= amount;
  status(`Debt repaid: $${amount.toLocaleString()}.`);
  updateHud();
}

function toggleTrade(name) {
  ensureCityDefaults();
  const neighbor = state.neighbors.find((item) => item.name === name);
  if (!neighbor) return;
  neighbor.trade = !neighbor.trade;
  status(`${neighbor.name} trade ${neighbor.trade ? "opened" : "paused"}.`);
  updateRegionalTrade(false);
  updateHud();
}

function buildRoad(city, x, y, free = false) {
  const t = tileIn(city, x, y);
  if (!t || t.civic || t.road) return false;
  t.road = true;
  t.bridge = t.terrain === "water";
  t.zone = null;
  t.level = 0;
  t.rubble = false;
  if (!free) t.variant++;
  return true;
}

function buildPipe(city, x, y, free = false) {
  const t = tileIn(city, x, y);
  if (!t || t.terrain === "water" || t.pipe) return false;
  t.pipe = true;
  if (!free) t.variant++;
  return true;
}

function setZone(city, x, y, zone, free = false) {
  const t = tileIn(city, x, y);
  if (!t || t.terrain === "water" || t.road || t.civic) return false;
  if (t.zone === zone && !t.rubble) return false;
  t.zone = zone;
  t.level = free ? Math.max(t.level, zone === "residential" ? 1 : 0) : 0;
  t.rubble = false;
  t.fire = 0;
  if (!free) t.variant++;
  return true;
}

function placeCivic(city, x, y, kind, free = false) {
  const t = tileIn(city, x, y);
  if (!t || t.terrain === "water" || t.road || t.zone || t.civic) return false;
  t.civic = kind;
  t.rubble = false;
  if (!free) t.variant++;
  return true;
}

function tileIn(city, x, y) {
  return x >= 0 && y >= 0 && x < city.width && y < city.height ? city.tiles[y * city.width + x] : null;
}

function bulldoze(x, y) {
  const t = tile(x, y);
  if (!t || t.terrain === "water") return false;
  const had = t.road || t.zone || t.civic || t.rubble || t.level;
  if (!had && t.pipe) {
    t.pipe = false;
    return true;
  }
  t.road = false;
  t.bridge = false;
  t.zone = null;
  t.level = 0;
  t.civic = null;
  t.rubble = false;
  t.fire = 0;
  return Boolean(had);
}

function simulateMonth() {
  ensureCityDefaults();
  state.month++;
  if (state.month > 12) {
    state.month = 1;
    state.year++;
  }
  const connected = connectedRoadSet();
  let population = 0;
  let jobs = 0;
  let serviceUpkeep = 0;
  let powerCapacity = 0;
  let waterCapacity = 0;
  let powerDemand = 0;
  let waterDemand = 0;
  let policeScore = 0;
  let fireScore = 0;
  let healthScore = 0;
  let educationScore = 0;
  let parkScore = 0;
  let pollution = 0;
  let pipeTiles = 0;
  for (const t of state.tiles) {
    if (t.pipe) pipeTiles++;
    if (t.civic) {
      serviceUpkeep += UPKEEP[t.civic] || 0;
      if (t.civic === "power") powerCapacity += 700;
      if (t.civic === "water_tower") waterCapacity += 650;
      if (t.civic === "police") policeScore += 90;
      if (t.civic === "fire") fireScore += 90;
      if (t.civic === "hospital") healthScore += 90;
      if (t.civic === "school") educationScore += 85;
      if (t.civic === "park") parkScore += 22;
      if (t.civic === "landfill") pollution += 16;
    }
    if (t.zone && t.level > 0 && !t.rubble) {
      powerDemand += t.level * (t.zone === "industrial" ? 18 : 10);
      waterDemand += t.level * (t.zone === "industrial" ? 12 : 9);
      if (t.zone === "residential") population += t.level * 9;
      if (t.zone === "commercial") jobs += t.level * 7;
      if (t.zone === "industrial") {
        jobs += t.level * 10;
        pollution += t.level * 4;
      }
    }
  }
  const powerOK = powerCapacity === 0 ? powerDemand < 80 : powerDemand <= powerCapacity;
  const pipeOK = population < 350 || pipeTiles >= Math.max(12, Math.ceil(population / 28));
  const waterOK = waterCapacity === 0 ? waterDemand < 70 : waterDemand <= waterCapacity && pipeOK;
  const unemployment = population ? Math.max(0, Math.round(((population - jobs) / population) * 100)) : 0;
  Object.assign(state, { population, jobs, pipeTiles });
  const tradeIncome = updateRegionalTrade(true);
  const demand = {
    residential: 54 + Math.min(34, jobs - population * 0.72) - state.tax * 1.6,
    commercial: 44 + Math.min(28, population * 0.28 - jobs) - state.tax + state.neighbors.filter((n) => n.trade).length * 5,
    industrial: 38 + Math.max(0, population * 0.18 - jobs * 0.2) - pollution * 0.15 + state.neighbors.filter((n) => n.trade).length * 4,
  };
  let growth = 0;
  let decay = 0;
  for (const t of state.tiles) {
    if (!t.zone || t.rubble) continue;
    const access = hasAdjacentConnectedRoad(t.x, t.y, connected);
    const supported = access && powerOK && waterOK;
    if (supported && t.level < 3 && demand[t.zone] + pseudo(t.x, t.y, state.month) > 46) {
      t.level++;
      growth++;
    } else if ((!supported || demand[t.zone] < 12) && t.level > 0 && pseudo(t.y, t.x, state.month) > 72) {
      t.level--;
      decay++;
    }
    if (t.fire > 0) {
      t.fire--;
      if (t.fire === 0 && pseudo(t.x, state.month, t.y) > 54) damageTile(t, "rubble");
    }
  }
  const connectedRoads = connected.size;
  const coverage = Math.min(100, policeScore + fireScore + healthScore + educationScore + parkScore);
  const crime = Math.max(0, Math.min(100, Math.round(population / 12 + unemployment * 0.6 - policeScore * 0.45)));
  const fireRisk = Math.max(0, Math.min(100, Math.round(powerDemand / 22 + pollution * 0.32 - fireScore * 0.5)));
  const happiness = Math.max(0, Math.min(100, Math.round(62 + coverage * 0.18 - crime * 0.32 - unemployment * 0.24 - state.tax * 1.15 - (powerOK ? 0 : 14) - (waterOK ? 0 : 12))));
  const income = Math.round(population * state.tax * 0.55 + jobs * 2.4 + happiness * 1.5 + tradeIncome);
  const roadCost = Math.round(state.tiles.filter((t) => t.road).length * 0.9);
  const pipeCost = Math.round(pipeTiles * 0.35);
  const debtInterest = Math.round(state.loanBalance * 0.004);
  const expenses = serviceUpkeep + roadCost + pipeCost + debtInterest;
  state.budgetLines = {
    Services: serviceUpkeep,
    Roads: roadCost,
    Pipes: pipeCost,
    "Debt interest": debtInterest,
  };
  state.money += income - expenses;
  Object.assign(state, { population, jobs, happiness, crime, fireRisk, unemployment, powerDemand, powerCapacity, waterDemand, waterCapacity, connectedRoads, monthlyIncome: income, monthlyExpenses: expenses });
  checkMilestones();
  updateConcerns({ powerOK, waterOK, pipeOK });
  if (growth) state.events.unshift(`${growth} blocks developed.`);
  if (decay) state.events.unshift(`${decay} blocks lost density.`);
  if (Math.random() < disasterChance()) randomDisaster();
  if (state.vehicles.length < Math.min(24, connectedRoads / 3)) spawnVehicle(connected);
  updateHud();
}

function updateRegionalTrade(advance = false) {
  ensureCityDefaults();
  let tradeIncome = 0;
  let neighborCommuters = 0;
  const excessJobs = Math.max(0, state.jobs - state.population);
  for (const neighbor of state.neighbors) {
    if (!neighbor.trade) {
      neighbor.exports = 0;
      neighbor.commuters = 0;
      continue;
    }
    const relationFactor = Math.max(0.25, neighbor.relation / 100);
    neighbor.exports = Math.round(Math.max(30, (state.jobs * 0.16 + state.population * 0.04) * relationFactor));
    neighbor.commuters = Math.round(Math.min(neighbor.population * 0.012, excessJobs * relationFactor));
    tradeIncome += neighbor.exports;
    neighborCommuters += neighbor.commuters;
    if (advance) neighbor.relation = Math.max(10, Math.min(100, neighbor.relation + (state.happiness >= 55 && state.crime < 40 ? 1 : -1)));
  }
  state.tradeIncome = tradeIncome;
  state.neighborCommuters = neighborCommuters;
  return tradeIncome;
}

function checkMilestones() {
  ensureCityDefaults();
  for (const [name, population, reward] of MILESTONES) {
    if (state.population >= population && !state.milestones.includes(name)) {
      state.milestones.push(name);
      state.money += reward;
      state.events.unshift(`Milestone: ${name}. Grant awarded: $${reward.toLocaleString()}.`);
    }
  }
}

function updateConcerns({ powerOK = true, waterOK = true, pipeOK = true } = {}) {
  const concerns = [];
  if (!powerOK) concerns.push("Power brownouts are slowing development.");
  if (!waterOK) concerns.push(pipeOK ? "Water capacity is maxed out." : "Growing districts need more underground pipes.");
  if (state.crime > 38) concerns.push("Residents are worried about crime.");
  if (state.unemployment > 22) concerns.push("Unemployment is pushing families to leave.");
  if (state.loanBalance >= 24000) concerns.push("Debt service is squeezing the budget.");
  if (state.money < 0) concerns.push("City Hall is running a deficit.");
  if (!concerns.length) concerns.push("Citizens are broadly satisfied with city services.");
  state.concerns = concerns.slice(0, 4);
}

function pseudo(a, b, c) {
  return Math.abs((a * 73856093 ^ b * 19349663 ^ c * 83492791) % 101);
}

function connectedRoadSet() {
  const roads = state.tiles.filter((t) => t.road);
  const starts = roads.filter((t) => t.x === 0 || t.y === 0 || t.x === state.width - 1 || t.y === state.height - 1);
  const queue = starts.length ? starts : roads.slice(0, 1);
  const seen = new Set(queue.map((t) => key(t.x, t.y)));
  for (let i = 0; i < queue.length; i++) {
    const t = queue[i];
    for (const [, dx, dy] of DIRS) {
      const n = tile(t.x + dx, t.y + dy);
      const nk = key(t.x + dx, t.y + dy);
      if (n?.road && !seen.has(nk)) {
        seen.add(nk);
        queue.push(n);
      }
    }
  }
  return seen;
}

function hasAdjacentConnectedRoad(x, y, connected) {
  return DIRS.some(([, dx, dy]) => connected.has(key(x + dx, y + dy)));
}

function roadMask(x, y, bridge = false) {
  let mask = 0;
  for (const [bit, dx, dy] of DIRS) {
    const n = tile(x + dx, y + dy);
    if (n?.road && (!bridge || n.bridge)) mask |= bit;
  }
  return mask;
}

function pipeMask(x, y) {
  let mask = 0;
  for (const [bit, dx, dy] of DIRS) {
    const n = tile(x + dx, y + dy);
    if (n?.pipe) mask |= bit;
  }
  return mask;
}

function key(x, y) {
  return `${x},${y}`;
}

function disasterChance() {
  return Math.min(0.08, 0.008 + state.fireRisk / 9000 + Math.max(0, state.year - 1) / 420);
}

function randomDisaster() {
  const kinds = ["fire", "flood", "quake", "tornado"];
  triggerDisaster(kinds[Math.floor(Math.random() * kinds.length)]);
}

function triggerDisaster(kind) {
  const candidates = state.tiles.filter((t) => t.zone || t.civic || t.road);
  const center = candidates[Math.floor(Math.random() * candidates.length)] || tile(16, 16);
  if (!center) return;
  const radius = kind === "quake" ? 4 : kind === "tornado" ? 5 : 3;
  let damaged = 0;
  for (const t of state.tiles) {
    const distance = Math.abs(t.x - center.x) + Math.abs(t.y - center.y);
    if (distance > radius) continue;
    const roll = pseudo(t.x, t.y, state.month + state.year);
    if (kind === "fire" && t.zone && roll > 38) {
      t.fire = 4;
      addEffect("fire", t.x, t.y, 5);
      damaged++;
    } else if (kind === "flood" && roll > 56) {
      damageTile(t, "flood");
      addEffect("flood", t.x, t.y, 4);
      damaged++;
    } else if (kind === "quake" && roll > 70) {
      damageTile(t, "quake");
      addEffect("quake", t.x, t.y, 4);
      damaged++;
    } else if (kind === "tornado" && (distance < 2 || roll > 82)) {
      damageTile(t, "tornado");
      addEffect("tornado", t.x, t.y, 5);
      damaged++;
    }
  }
  state.events.unshift(`${label(kind)} hit near ${center.x},${center.y}: ${damaged} cells affected.`);
  status(`${label(kind)} disaster! ${damaged} cells affected.`);
  playTone(kind === "quake" ? 70 : 150, 0.18, "sawtooth");
  updateHud();
}

function damageTile(t) {
  if (!t) return;
  if (t.civic || t.zone || t.road) {
    t.rubble = true;
    t.level = Math.max(0, t.level - 1);
    if (pseudo(t.x, t.y, state.year) > 70) {
      t.road = false;
      t.bridge = false;
    }
  }
}

function addEffect(kind, x, y, life = 4) {
  state.effects.push({ kind, x, y, age: 0, life });
  if (state.effects.length > 40) state.effects.shift();
}

function spawnBuildFeedback(cells) {
  for (const cell of cells.slice(0, 8)) addEffect("smoke", cell.x, cell.y, 1.6);
}

function spawnVehicle(connected) {
  const roads = state.tiles.filter((t) => connected.has(key(t.x, t.y)));
  const a = roads[Math.floor(Math.random() * roads.length)];
  if (!a) return;
  const neighbors = DIRS.map(([, dx, dy]) => tile(a.x + dx, a.y + dy)).filter((t) => t?.road);
  const b = neighbors[Math.floor(Math.random() * neighbors.length)];
  if (!b) return;
  state.vehicles.push({ from: { x: a.x, y: a.y }, to: { x: b.x, y: b.y }, t: 0, color: Math.floor(Math.random() * 4) });
}

function animateVehicles(dt) {
  for (const vehicle of state.vehicles) vehicle.t += dt / 1500;
  state.vehicles = state.vehicles.filter((vehicle) => vehicle.t < 1.25);
  for (const effect of state.effects) effect.age += dt / 1000;
  state.effects = state.effects.filter((effect) => effect.age < effect.life);
}

function render(now) {
  ctx.save();
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  const sky = ctx.createLinearGradient(0, 0, 0, innerHeight);
  sky.addColorStop(0, "#1b3033");
  sky.addColorStop(1, "#102023");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, innerWidth, innerHeight);
  drawBackdrop(now);
  const ordered = [...state.tiles].sort((a, b) => (a.x + a.y) - (b.x + b.y) || a.y - b.y);
  for (const t of ordered) drawGroundTile(t);
  const drawItems = ordered.map((tile) => {
    const s = worldToScreen(tile.x, tile.y);
    return { depth: tile.x + tile.y, y: s.y, priority: 1, type: "tile", tile };
  });
  for (const vehicle of state.vehicles) {
    const spec = vehicleDrawSpec(vehicle);
    if (spec) drawItems.push(spec);
  }
  drawItems.sort((a, b) => a.depth - b.depth || a.y - b.y || a.priority - b.priority);
  for (const item of drawItems) {
    if (item.type === "vehicle") drawVehicleSpec(item);
    else drawObjectTile(item.tile, now);
  }
  drawEffects(now);
  drawPipes();
  drawPreview();
  drawSelection();
  drawHover();
  ctx.restore();
}

function drawBackdrop(now) {
  ctx.globalAlpha = 0.2;
  ctx.fillStyle = "#72be45";
  for (let i = 0; i < 12; i++) {
    const x = ((now / 70 + i * 147) % (innerWidth + 200)) - 100;
    const y = 95 + Math.sin(i) * 18;
    ctx.fillRect(x, y, 100, 6);
  }
  ctx.globalAlpha = 1;
}

function drawGroundTile(t) {
  const s = worldToScreen(t.x, t.y);
  const terrainKey = terrainSprite(t);
  drawSprite(terrainKey, s.x, s.y);
  if (t.zone && !t.road && !t.rubble) drawSprite(`zone.${t.zone}.base`, s.x, s.y);
  if (t.road) {
    const family = t.bridge ? "bridge" : "road";
    const mask = roadMask(t.x, t.y, t.bridge).toString(16).padStart(2, "0");
    drawSprite(`${family}.${mask}`, s.x, s.y);
  }
}

function terrainSprite(t) {
  if (t.terrain === "water") return `terrain.water.${(t.x + t.y + state.month) % 4}`;
  if (t.terrain === "forest") return `terrain.forest.${t.variant % 2}`;
  return `terrain.grass.${t.variant % 4}`;
}

function drawObjectTile(t, now) {
  const s = worldToScreen(t.x, t.y);
  if (t.rubble) {
    drawSprite(`civic.rubble.${t.variant % 2}`, s.x, s.y);
  } else if (t.civic) {
    drawSprite(`civic.${t.civic}.${t.variant % 2}`, s.x, s.y);
  } else if (t.zone && t.level > 0) {
    const family = assets?.families?.[`building.${t.zone}.level${t.level}`] || [];
    const keyName = family.length ? family[Math.abs(t.variant + t.x * 3 + t.y * 5) % family.length] : null;
    if (keyName) drawSprite(keyName, s.x, s.y);
  }
  if (t.fire > 0) drawEffectSprite("fire", t.x, t.y, now);
}

function vehicleDrawSpec(vehicle) {
  const a = worldToScreen(vehicle.from.x, vehicle.from.y);
  const b = worldToScreen(vehicle.to.x, vehicle.to.y);
  const t = Math.min(1, vehicle.t);
  const x = a.x + (b.x - a.x) * t;
  const y = a.y + (b.y - a.y) * t;
  const gx = vehicle.from.x + (vehicle.to.x - vehicle.from.x) * t;
  const gy = vehicle.from.y + (vehicle.to.y - vehicle.from.y) * t;
  const direction = b.x > a.x ? "se" : b.x < a.x ? "nw" : b.y > a.y ? "sw" : "ne";
  return { depth: gx + gy + 0.15, y, priority: 0, type: "vehicle", key: `vehicle.car.${direction}.${vehicle.color}`, x, drawY: y + 4 };
}

function drawVehicleSpec(item) {
  drawSprite(item.key, item.x, item.drawY);
}

function drawEffects(now) {
  for (const effect of state.effects) drawEffectSprite(effect.kind, effect.x, effect.y, now + effect.age * 1000);
}

function drawEffectSprite(kind, x, y, now) {
  const anim = assets?.animations?.[`effect.${kind}`];
  if (!anim) return;
  const frame = Math.floor((now / 1000) * anim.fps) % anim.frames.length;
  const s = worldToScreen(x, y);
  drawSprite(anim.frames[frame], s.x, s.y);
}

function drawSprite(keyName, x, y) {
  const info = spriteInfo(keyName);
  const img = imageFor(keyName);
  if (!info || !img) {
    drawFallback(keyName, x, y);
    return;
  }
  const [ax, ay] = info.anchor;
  ctx.drawImage(img, Math.round(x - ax * camera.zoom), Math.round(y - ay * camera.zoom), img.width * camera.zoom, img.height * camera.zoom);
}

function drawFallback(keyName, x, y) {
  const color = keyName?.includes("water") ? "#36a9d6" : keyName?.includes("road") ? "#626e72" : keyName?.includes("residential") ? "#61c875" : "#72be45";
  drawDiamond(x, y, color, 1);
}

function drawDiamond(x, y, color, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.strokeStyle = "#26383a";
  ctx.lineWidth = Math.max(1, camera.zoom);
  ctx.beginPath();
  ctx.moveTo(x, y - 16 * camera.zoom);
  ctx.lineTo(x + 32 * camera.zoom, y);
  ctx.lineTo(x, y + 16 * camera.zoom);
  ctx.lineTo(x - 32 * camera.zoom, y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawPipes() {
  if (activeTool !== "pipe") return;
  ctx.save();
  ctx.strokeStyle = "#8bdaf6";
  ctx.fillStyle = "#8bdaf6";
  ctx.lineWidth = Math.max(2, 3 * camera.zoom);
  ctx.lineCap = "round";
  for (const t of state.tiles) {
    if (!t.pipe) continue;
    const s = worldToScreen(t.x, t.y);
    ctx.beginPath();
    ctx.arc(s.x, s.y, Math.max(2, 4 * camera.zoom), 0, Math.PI * 2);
    ctx.fill();
    const mask = pipeMask(t.x, t.y);
    for (const [bit, dx, dy] of [[1, 16, -8], [2, 16, 8], [4, -16, 8], [8, -16, -8]]) {
      if (!(mask & bit)) continue;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x + dx * camera.zoom, s.y + dy * camera.zoom);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawPreview() {
  if (!drag) return;
  const cells = gestureCells(activeTool, drag.start, drag.current).filter((cell) => inBounds(cell.x, cell.y));
  ctx.save();
  for (const cell of cells) {
    const t = tile(cell.x, cell.y);
    if (!t) continue;
    const valid = previewValid(t, activeTool);
    const s = worldToScreen(cell.x, cell.y);
    if (ZONES.has(activeTool)) {
      const keyName = `preview.${activeTool}.${valid ? "valid" : "invalid"}`;
      drawSprite(keyName, s.x, s.y);
    } else {
      drawDiamond(s.x, s.y, valid ? "#f1c84d" : "#e9574f", 0.44);
    }
  }
  ctx.restore();
}

function previewValid(t, toolName) {
  if (toolName === "inspect") return true;
  if (toolName === "bulldoze") return true;
  if (toolName === "road") return !t.civic;
  if (toolName === "pipe") return t.terrain !== "water" && !t.pipe;
  if (ZONES.has(toolName)) return t.terrain !== "water" && !t.road && !t.civic;
  if (CIVICS.has(toolName)) return t.terrain !== "water" && !t.road && !t.zone && !t.civic;
  return false;
}

function drawSelection() {
  const cell = selectedTile || state.selectedTile;
  if (!cell || !inBounds(cell.x, cell.y)) return;
  const s = worldToScreen(cell.x, cell.y);
  drawDiamond(s.x, s.y, "#f1c84d", 0.32);
}

function drawHover() {
  if (!hover || !inBounds(hover.x, hover.y)) return;
  const s = worldToScreen(hover.x, hover.y);
  drawDiamond(s.x, s.y, "#ffffff", 0.18);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;",
  }[char]));
}

function selectedTileCard() {
  const cell = selectedTile || state.selectedTile;
  if (!cell || !inBounds(cell.x, cell.y)) return "";
  const t = tile(cell.x, cell.y);
  const spriteKey = tileSpriteKey(t);
  const info = spriteInfo(spriteKey);
  const image = info ? `<img src="./assets/world/${escapeHtml(info.path)}" alt="">` : "";
  const title = t.civic ? label(t.civic) : t.road ? (t.bridge ? "Bridge" : "Road") : t.zone ? `${label(t.zone)} ${t.level ? `Lv ${t.level}` : "Zone"}` : label(t.terrain);
  const details = [
    `Block ${cell.x + 1}-${cell.y + 1}`,
    t.terrain,
    t.zone ? `${t.level ? "Developed" : "Vacant"} zone` : null,
    t.road ? "road access" : null,
    t.fire > 0 ? "on fire" : null,
  ].filter(Boolean).join(" | ");
  return `<div class="tile-card">${image}<div><small>Block Inspector</small><strong>${escapeHtml(title)}</strong><span>${escapeHtml(details)}</span></div></div>`;
}

function financeCard() {
  ensureCityDefaults();
  const net = Math.round((state.monthlyIncome || 0) - (state.monthlyExpenses || 0));
  return `<div class="wide-card"><h3>Finance</h3>
    <div class="row"><span>Income</span><strong>$${Math.round(state.monthlyIncome || 0).toLocaleString()}</strong></div>
    <div class="row"><span>Expenses</span><strong>$${Math.round(state.monthlyExpenses || 0).toLocaleString()}</strong></div>
    <div class="row"><span>Net</span><strong>${net >= 0 ? "+" : "-"}$${Math.abs(net).toLocaleString()}</strong></div>
    <div class="row"><span>Debt</span><strong>$${state.loanBalance.toLocaleString()} / $30,000</strong></div>
    <div class="row"><button data-finance="borrow" type="button">Borrow 10K</button><button data-finance="repay" type="button">Repay 5K</button></div>
  </div>`;
}

function budgetCard() {
  const rows = Object.entries(state.budgetLines || {}).map(([name, value]) => `<div class="row"><span>${escapeHtml(name)}</span><strong>$${Math.round(value).toLocaleString()}</strong></div>`).join("");
  return `<div class="wide-card"><h3>Budget Lines</h3>${rows || "<p>No expenses yet.</p>"}</div>`;
}

function concernsCard() {
  const concerns = state.concerns?.length ? state.concerns : ["Citizens are broadly satisfied with city services."];
  return `<div class="wide-card"><h3>Citizen Concerns</h3>${concerns.map((concern) => `<p>${escapeHtml(concern)}</p>`).join("")}</div>`;
}

function tradeCard() {
  ensureCityDefaults();
  const rows = state.neighbors.map((neighbor) => `<div class="row"><span>${escapeHtml(neighbor.name)} (${neighbor.relation})</span><button data-trade="${escapeHtml(neighbor.name)}" type="button">${neighbor.trade ? "Trading" : "Open"}</button></div><p>${escapeHtml(neighbor.specialty)} | ${neighbor.population.toLocaleString()} pop | exports $${(neighbor.exports || 0).toLocaleString()}</p>`).join("");
  return `<div class="wide-card"><h3>Neighbor Trade</h3><p>Trade income $${(state.tradeIncome || 0).toLocaleString()} | Outside commuters ${(state.neighborCommuters || 0).toLocaleString()}</p>${rows}</div>`;
}

function milestonesCard() {
  ensureCityDefaults();
  const rows = MILESTONES.map(([name, population, reward]) => {
    const done = state.milestones.includes(name);
    return `<div class="row"><span>${done ? "*" : "-"} ${escapeHtml(name)} (${population.toLocaleString()} pop)</span><strong>$${reward.toLocaleString()}</strong></div>`;
  }).join("");
  return `<div class="wide-card"><h3>Milestones</h3>${rows}</div>`;
}

function updateHud() {
  taxSlider.value = state.tax;
  taxLabel.textContent = `${state.tax}%`;
  statsEl.textContent = `Year ${state.year}, Month ${state.month} | $${Math.round(state.money).toLocaleString()} | Pop ${state.population.toLocaleString()} | Jobs ${state.jobs.toLocaleString()} | Happy ${state.happiness}%`;
  const metrics = [
    ["Money", `$${Math.round(state.money).toLocaleString()}`],
    ["Population", state.population.toLocaleString()],
    ["Jobs", state.jobs.toLocaleString()],
    ["Happiness", `${state.happiness}%`],
    ["Crime", `${state.crime}%`],
    ["Fire risk", `${state.fireRisk}%`],
    ["Power", `${state.powerDemand}/${state.powerCapacity || "grid"}`],
    ["Water", `${state.waterDemand}/${state.waterCapacity || "wells"}`],
    ["Pipes", (state.pipeTiles || 0).toLocaleString()],
    ["Trade", `$${(state.tradeIncome || 0).toLocaleString()}`],
  ];
  reportEl.innerHTML = `${selectedTileCard()}${metrics.map(([name, value]) => `<div class="metric"><small>${escapeHtml(name)}</small><strong>${escapeHtml(value)}</strong></div>`).join("")}${financeCard()}${budgetCard()}${concernsCard()}${tradeCard()}${milestonesCard()}`;
}

function status(message) {
  statusEl.textContent = message;
  state.events.unshift(message);
  state.events = state.events.slice(0, 16);
}

function saveGame() {
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  status("Game saved in this browser.");
  playTone(440, 0.06, "sine");
}

function loadGame() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) {
    status("No browser save found yet.");
    return false;
  }
  try {
    const data = JSON.parse(raw);
    if (data.version !== 1 || !Array.isArray(data.tiles)) throw new Error("bad save");
    Object.keys(state).forEach((keyName) => delete state[keyName]);
    Object.assign(state, data);
    ensureCityDefaults();
    selectedTile = state.selectedTile || null;
    updateHud();
    status("Save loaded.");
    return true;
  } catch (error) {
    console.error(error);
    status("Save could not be loaded.");
    return false;
  }
}

function label(value) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

function ensureAudio() {
  if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)();
  if (audio.state === "suspended") audio.resume();
}

function playTone(freq, duration, type = "square") {
  if (!audio) return;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.035, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + duration);
  osc.connect(gain).connect(audio.destination);
  osc.start();
  osc.stop(audio.currentTime + duration);
}

window.codexCityDebug = { rectCells, lineCells, gestureCells, worldToScreen, screenToWorld, state };
boot();
