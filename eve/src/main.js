import { resetAmbience, resolveAmbienceProfile, updateAmbience } from "./ambience.js";
import { Assets } from "./assets.js";
import { AudioManager, loadAudioSettings, saveAudioSettings } from "./audio.js";
import { DUNGEON_CHECKPOINT_FLOORS, IMPLEMENTED_DUNGEON_FLOOR, dungeonFloorFromMapId, dungeonMapId } from "./dungeon.js";
import { Input } from "./input.js";
import { loadGameData } from "./data.js";
import { Renderer } from "./renderer.js";
import { AUDIO_SETTING_ROWS, PARTY_DISPLAY_OPTIONS, loadGameSettings, normalizeGameSettings, saveGameSettings } from "./settings.js";
import { createInitialState, loadGame, saveGame } from "./state.js";

const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const input = new Input(canvas);
const TITLE_MENU_ITEMS = ["New Game", "Continue"];
const FIELD_MENU_ITEMS = ["Inventory", "Party", "Quest Log", "Journal", "Settings", "Save", "Load", "Close"];
const JOURNAL_CHAPTER_ROWS = { x: 106, y: 116, w: 314, h: 30, rowH: 35 };
const JOURNAL_ENTRY_ROWS = { x: 112, y: 294, w: 314, h: 20, rowH: 22, max: 11 };
const JOURNAL_DETAIL_RECT = { x: 506, y: 64, w: 356, h: 496 };
const COMBAT_ROOT_ITEMS = ["Attack", "Skill", "Item", "Defend", "Flee"];
const HARVEST_OPTION_KEYS = ["trophy", "meat", "pouch", "gear"];
const PARTY_BASIC_DAMAGE_TYPES = { rowan: "slash", elara: "blunt", cassian: "magic", nia: "pierce" };
const PROP_COLLISION_PADDING = 0.22;
const NPC_DIALOGUE_PANEL = { x: 34, y: 444, w: 660, h: 170 };
const NPC_DIALOGUE_ROWS = { x: 74, y: 490, w: 570, h: 21, rowH: 22 };
const NPC_INSPECT_PLACEHOLDER = "Inspect details are not written yet.";

const data = await loadGameData();
const assets = new Assets(data.assets);
await assets.load();
const renderer = new Renderer(ctx, assets, data);
const state = createInitialState(data);
state.audioSettings = loadAudioSettings();
state.gameSettings = loadGameSettings();
const audio = new AudioManager(state.audioSettings);
globalThis.__eveDebugState = state;
globalThis.__eveDebugData = data;
globalThis.__eveRenderer = renderer;
globalThis.__eveAudio = audio;
globalThis.__eveDebugHooks = {
  startCombat,
  winCombat,
  startQuest,
  advanceQuest,
  resolveHarvestForSmoke(index, selectedOptions) {
    const remains = state.harvest?.remains?.[index];
    if (!remains) return false;
    remains.selectedOptions = [...selectedOptions];
    resolveHarvestRemains(remains);
    return true;
  },
  advanceHarvest
};
const TILE = 32;
const PLAYER_SPEED = 194;
globalThis.__eveDebugHooks.playerSpeed = () => PLAYER_SPEED;
const FOLLOW_SPACING = 1.2;
const TRAIL_LENGTH = 240;
const PARTY_CARD_X = 60;
const PARTY_CARD_Y = 156;
const PARTY_CARD_W = 190;
const PARTY_CARD_H = 334;
const PARTY_CARD_GAP = 218;
const PARTY_HELP_RECT = { x: 173, y: 73, w: 28, h: 28 };
const PROFILE_BIO_CHARS_PER_LINE = 30;
const PROFILE_BIO_LINE_HEIGHT = 22;
const PROFILE_BIO_VISIBLE_H = 116;
const NEW_GAME_DOOR_TRANSITION_DURATION = 3.3;

input.onPress = (action) => {
  audio.unlock();
  routeInputCue(action);
};
canvas.addEventListener("pointerdown", () => audio.unlock());

let last = performance.now();
requestAnimationFrame(loop);

function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(dt);
  syncAmbience(dt);
  audio.update(state);
  renderer.draw(state);
  requestAnimationFrame(loop);
}

function syncAmbience(dt) {
  if (state.mode === "title") return;
  const map = data.maps[state.mapId];
  if (!map) return;
  state.ambience ??= {};
  const floor = map.dungeonFloor ?? state.dungeon?.currentFloor ?? null;
  if (state.ambience.lastMapId !== state.mapId || state.ambience.lastDungeonFloor !== floor) {
    resetAmbience(state);
    state.ambience.lastMapId = state.mapId;
    state.ambience.lastDungeonFloor = floor;
  }
  updateAmbience(state, map, dt);
  const profile = resolveAmbienceProfile(map, state);
  const nextAudioProfile = profile.audio?.profile || profile.id;
  if (state.ambience.audioProfileId !== nextAudioProfile) {
    audio.setAmbienceProfile(nextAudioProfile, {
      intensity: profile.audio?.intensity ?? 1,
      fadeMs: 1000
    });
    state.ambience.audioProfileId = nextAudioProfile;
  }
}

function update(dt) {
  if (state.toastTimer > 0) state.toastTimer -= dt;
  if (state.toastTimer <= 0) state.toastPriority = false;
  updateWorldTextEffects(dt);
  if (state.transition) return updateTransition(dt);
  if (state.mode === "title") updateTitle(dt);
  else if (state.mode === "world") updateWorld(dt);
  else if (state.mode === "dialogue") updateDialogue();
  else if (state.mode === "shop") updateShop();
  else if (state.mode === "map") updateDungeonMap();
  else if (state.mode === "journal") updateJournal();
  else if (state.mode === "combat") updateCombat(dt);
  else if (state.mode === "combat-summary") updateCombatSummary();
  else if (state.mode === "harvest") updateHarvest();
  else updateMenus();
}

function updateTitle(dt) {
  state.title ??= { index: 0, elapsed: 0, message: "", messageTimer: 0 };
  state.title.elapsed += dt;
  if (state.title.messageTimer > 0) state.title.messageTimer -= dt;
  input.consumeWheel();
  updateTitlePointer();
  if (input.consume("down")) state.title.index++;
  if (input.consume("up")) state.title.index--;
  state.title.index = wrapIndex(state.title.index, TITLE_MENU_ITEMS.length);
  if (!input.consume("confirm")) return;
  selectTitleOption(state.title.index);
}

function updateTransition(dt) {
  state.transition.timer += dt;
  const transition = state.transition;
  if (transition.phase === "out" && transition.timer >= transition.duration) {
    if (transition.kind === "title-new-game") resetToNewGame({ fadeIn: false });
    return;
  }
  if (transition.phase === "in" && transition.timer >= transition.duration) state.transition = null;
}

function updateTitlePointer() {
  const hovered = hitIndex(titleMenuRects(), input.pointer);
  if (hovered >= 0) state.title.index = hovered;
  const click = input.consumeClick();
  if (!click) return;
  const clicked = hitIndex(titleMenuRects(), click);
  if (clicked < 0) return;
  state.title.index = clicked;
  audio.playCue("confirm");
  selectTitleOption(clicked);
}

function selectTitleOption(index) {
  const choice = TITLE_MENU_ITEMS[index];
  if (choice === "New Game") return beginNewGameTransition();
  if (choice !== "Continue") return;
  if (loadGame(state, data)) return;
  state.mode = "title";
  state.title ??= { index: 1, elapsed: 0, message: "", messageTimer: 0 };
  state.title.index = 1;
  state.title.message = "No save found.";
  state.title.messageTimer = 2.6;
}

function beginNewGameTransition() {
  input.flush();
  state.transition = { kind: "title-new-game", phase: "out", timer: 0, duration: NEW_GAME_DOOR_TRANSITION_DURATION };
}

function startNewGame() {
  resetToNewGame({ fadeIn: false });
}

function resetToNewGame({ fadeIn }) {
  const audioSettings = state.audioSettings;
  const gameSettings = normalizeGameSettings(state.gameSettings);
  const fresh = createInitialState(data);
  Object.assign(state, fresh, { mode: "world", audioSettings, gameSettings });
  resetAmbience(state);
  updateDungeonProgress(data.maps[state.mapId]);
  updateDungeonVisibility();
  state.transition = fadeIn ? { kind: "title-new-game", phase: "in", timer: 0, duration: 0.35 } : null;
  input.flush();
}

function updateWorld(dt) {
  const wheel = input.consumeWheel();
  if (wheel) {
    const delta = wheel < 0 ? 0.1 : -0.1;
    state.cameraZoom = Math.max(0.75, Math.min(2, Math.round(((state.cameraZoom ?? 1) + delta) * 100) / 100));
  }
  if (input.consume("inventory")) openMode("inventory");
  if (input.consume("party")) openMode("party");
  if (input.consume("quests")) openMode("quests");
  if (input.consume("journal")) openJournal();
  if (input.consume("map")) openDungeonMap();
  if (input.consume("cancel") || input.consume("menu")) openMode("menu");
  if (input.consume("confirm")) interact();
  if (state.mode !== "world") return;

  state.player.stepTimer -= dt;
  for (const follower of state.followers) follower.stepTimer = Math.max(0, (follower.stepTimer ?? 0) - dt);
  updateDungeonDoors();
  updateNpcPatrols(dt);
  updateWorldEffects(dt);
  updatePlayerMovement(dt);
  updateDungeonDoors();
  updateDungeonVisibility();
  checkPickup();
  checkTrap();
  updateTentInterior();
  updateBuildingInterior();
  checkExit();
  checkEncounter();
}

function updatePlayerMovement(dt) {
  const vector = inputMovementVector();
  if (!vector) return;
  movePlayer(vector.x, vector.y, dt);
}

function updateNpcPatrols(dt) {
  const map = data.maps[state.mapId];
  const patrolNpcs = (map?.npcs ?? []).filter((npc) => npc.patrol?.points?.length);
  if (!patrolNpcs.length) return;
  state.npcStates ??= {};
  const mapStates = state.npcStates[map.id] ??= {};
  for (const npc of patrolNpcs) {
    const points = npc.patrol.points;
    const live = mapStates[npc.id] ??= {
      x: npc.x,
      y: npc.y,
      dir: npc.dir ?? "down",
      target: Math.min(1, points.length - 1),
      moving: false
    };
    const target = points[live.target % points.length];
    const dx = target[0] - live.x;
    const dy = target[1] - live.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 0.025) {
      live.x = target[0];
      live.y = target[1];
      live.target = (live.target + 1) % points.length;
      live.moving = false;
      continue;
    }
    const step = Math.min(distance, (npc.patrol.speed ?? 1) * dt);
    live.x += (dx / distance) * step;
    live.y += (dy / distance) * step;
    live.dir = directionFromVector(dx, dy, live.dir);
    live.moving = step > 0.001;
  }
}

function inputMovementVector() {
  const x = (input.isDown("right") ? 1 : 0) - (input.isDown("left") ? 1 : 0);
  const y = (input.isDown("down") ? 1 : 0) - (input.isDown("up") ? 1 : 0);
  if (!x && !y) return null;
  const length = Math.hypot(x, y);
  return { x: x / length, y: y / length };
}

function movePlayer(dx, dy, dt) {
  const map = data.maps[state.mapId];
  const step = (PLAYER_SPEED / currentMapTileSize()) * dt;
  const from = { x: state.player.x, y: state.player.y };
  const ignoreWorldCollision = isBlockedByWorldCollision(map, from.x, from.y);
  state.player.dir = directionFromVector(dx, dy, state.player.dir);

  const stepX = dx * step;
  const stepY = dy * step;
  let nextX = state.player.x;
  let nextY = state.player.y;

  if (!isBlocked(nextX + stepX, nextY + stepY, { ignoreWorldCollision })) {
    nextX += stepX;
    nextY += stepY;
  } else {
    if (stepX && !isBlocked(nextX + stepX, nextY, { ignoreWorldCollision })) nextX += stepX;
    if (stepY && !isBlocked(nextX, nextY + stepY, { ignoreWorldCollision })) nextY += stepY;
  }

  if (nextX === from.x && nextY === from.y) return;
  state.player.x = nextX;
  state.player.y = nextY;
  state.player.stepTimer = 0.13;
  recordLeaderTrail();
  updateFollowers();
}

function recordLeaderTrail() {
  const head = state.leaderTrail[0];
  if (!head || Math.hypot(state.player.x - head.x, state.player.y - head.y) >= 0.02) {
    state.leaderTrail.unshift({ x: state.player.x, y: state.player.y, dir: state.player.dir });
    state.leaderTrail = state.leaderTrail.slice(0, TRAIL_LENGTH);
  }
}

function updateFollowers() {
  state.followers.forEach((follower, index) => {
    const point = sampleLeaderTrail((index + 1) * FOLLOW_SPACING);
    if (point) {
      const moved = Math.hypot(follower.x - point.x, follower.y - point.y) > 0.01;
      follower.x = point.x;
      follower.y = point.y;
      follower.dir = point.dir ?? follower.dir ?? "down";
      if (moved) follower.stepTimer = 0.13;
    }
  });
}

function sampleLeaderTrail(distance) {
  const trail = state.leaderTrail ?? [];
  if (!trail.length) return null;
  let traveled = 0;
  for (let i = 1; i < trail.length; i++) {
    const previous = trail[i - 1];
    const point = trail[i];
    const segment = Math.hypot(previous.x - point.x, previous.y - point.y);
    if (traveled + segment >= distance) {
      const t = segment ? (distance - traveled) / segment : 0;
      return {
        x: previous.x + (point.x - previous.x) * t,
        y: previous.y + (point.y - previous.y) * t,
        dir: point.dir ?? previous.dir
      };
    }
    traveled += segment;
  }
  return trail[trail.length - 1];
}

function directionFromVector(dx, dy, fallback = "down") {
  const horizontal = dx < -0.01 ? "left" : dx > 0.01 ? "right" : "";
  const vertical = dy < -0.01 ? "up" : dy > 0.01 ? "down" : "";
  if (horizontal && vertical) return `${vertical}-${horizontal}`;
  return vertical || horizontal || fallback;
}

function isBlocked(x, y, options = {}) {
  const map = data.maps[state.mapId];
  return isBlockedOnMap(map, x, y, options);
}

function isBlockedOnMap(map, x, y, options = {}) {
  if (x < 0 || y < 0 || x >= map.width || y >= map.height) return true;
  if (closedDoorAt(map, x, y)) return true;
  for (const tile of map.blockedTiles ?? []) {
    if (x >= tile[0] && y >= tile[1] && x < tile[0] + 1 && y < tile[1] + 1) return true;
  }
  for (const rect of map.blocked ?? []) {
    const [rx, ry, rw, rh] = rect;
    if (x >= rx && y >= ry && x < rx + rw && y < ry + rh) return true;
  }
  if (!options.ignoreWorldCollision && isBlockedByWorldCollision(map, x, y)) return true;
  for (const npc of map.npcs ?? []) {
    if (npc.collision === false) continue;
    const live = npcRuntimePosition(map, npc);
    if (Math.abs(x - live.x) < 0.62 && Math.abs(y - live.y) < 0.62) return true;
  }
  return false;
}

function isBlockedByWorldCollision(map, x, y) {
  const candidates = [
    ...(map.props ?? []),
    ...(map.overlays ?? []),
    ...Object.values(map.dungeonLayers ?? {}).flatMap((layer) => Array.isArray(layer) ? layer : [])
  ];
  return candidates.some((item) => collisionObjectBlocksPoint(item, map, x, y));
}

function collisionObjectBlocksPoint(item, map, x, y) {
  const collision = item?.collision ?? (item?.solid ? true : null);
  if (!collision || collision === false || !collisionObjectAvailable(item, map)) return false;
  return collisionRects(item, collision).some((rect) => {
    const padding = rect.padding ?? PROP_COLLISION_PADDING;
    return x >= rect.x - padding && y >= rect.y - padding && x < rect.x + rect.w + padding && y < rect.y + rect.h + padding;
  });
}

function collisionObjectAvailable(item, map) {
  if (item.requires && !state.flags[item.requires]) return false;
  const pickupKey = item.id ? `pickup_${map.id}_${item.id}` : null;
  if (item.pickup && ((item.flag && state.flags[item.flag]) || (pickupKey && state.flags[pickupKey]))) return false;
  if (item.hideWhenInsideTent && state.insideTent) return false;
  if (item.showWhenInsideTent && !state.insideTent) return false;
  return true;
}

function collisionRects(item, collision) {
  const specs = Array.isArray(collision) && Array.isArray(collision[0])
    ? collision
    : Array.isArray(collision) || typeof collision === "object"
      ? [collision]
      : [true];
  return specs.map((spec) => collisionRect(item, spec)).filter(Boolean);
}

function collisionRect(item, spec) {
  if (spec === true) return { x: item.x, y: item.y, w: 1, h: 1 };
  if (Array.isArray(spec)) {
    const [dx = 0, dy = 0, w = 1, h = 1, padding] = spec;
    return { x: item.x + dx, y: item.y + dy, w, h, padding };
  }
  if (typeof spec === "object") {
    return {
      x: item.x + (spec.x ?? 0),
      y: item.y + (spec.y ?? 0),
      w: spec.w ?? 1,
      h: spec.h ?? 1,
      padding: spec.padding
    };
  }
  return null;
}

function npcRuntimePosition(map, npc) {
  return state.npcStates?.[map.id]?.[npc.id] ?? npc;
}

function closedDoorAt(map, x, y) {
  return (map.doors ?? []).some((door) => !doorIsOpen(map, door) && x >= door.x && y >= door.y && x < door.x + 1 && y < door.y + 1);
}

function updateDungeonDoors() {
  const map = data.maps[state.mapId];
  if (!map?.doors?.length) return;
  state.doorStates ??= {};
  const mapDoors = state.doorStates[map.id] ??= {};
  for (const door of map.doors) {
    const near = partyNearDoor(door);
    mapDoors[door.id] = { open: near };
  }
}

function partyNearDoor(door) {
  const actors = state.gameSettings?.partyDisplayMode === "leader" ? [state.player] : [state.player, ...(state.followers ?? [])];
  return actors.some((actor) => Math.abs(actor.x - door.x) <= 1.05 && Math.abs(actor.y - door.y) <= 1.05);
}

function doorIsOpen(map, door) {
  return Boolean(state.doorStates?.[map.id]?.[door.id]?.open);
}

function facingTile() {
  const tile = currentTile();
  const d = directionTileDelta(state.player.dir);
  return { x: tile.x + d[0], y: tile.y + d[1] };
}

function interact() {
  const map = data.maps[state.mapId];
  const p = facingTile();
  const npc = (map.npcs ?? []).find((n) => {
    const live = npcRuntimePosition(map, n);
    return Math.abs(live.x - p.x) < 0.65 && Math.abs(live.y - p.y) < 0.65;
  });
  if (npc) {
    recordJournalNpc(npc);
    const scriptId = resolveNpcScript(npc);
    if (data.npcDialogues?.[scriptId]) return openNpcDialogue(npc, scriptId);
    return runScript(scriptId);
  }
  const prop = findInteractableProp(map);
  if (prop) return interactProp(prop);
  toast("Nothing answers.");
}

function checkPickup() {
  const prop = findPickupProp(data.maps[state.mapId]);
  if (prop) interactProp(prop);
}

function interactionTiles() {
  const tile = currentTile();
  const p = facingTile();
  return [
    tile,
    p,
    { x: tile.x + 1, y: tile.y },
    { x: tile.x - 1, y: tile.y },
    { x: tile.x, y: tile.y + 1 },
    { x: tile.x, y: tile.y - 1 },
    { x: tile.x + 1, y: tile.y + 1 },
    { x: tile.x + 1, y: tile.y - 1 },
    { x: tile.x - 1, y: tile.y + 1 },
    { x: tile.x - 1, y: tile.y - 1 }
  ];
}

function findPickupProp(map) {
  const tiles = interactionTiles();
  return (map.props ?? []).find((prop) => prop.pickup && propAvailable(prop) && tiles.some((tile) => tile.x === prop.x && tile.y === prop.y));
}

function findInteractableProp(map) {
  const tiles = interactionTiles();
  return (map.props ?? []).find((prop) => propAvailable(prop) && tiles.some((tile) => tile.x === prop.x && tile.y === prop.y));
}

function resolveNpcScript(npc) {
  if (npc.afterFlagScript) {
    for (const [flag, script] of Object.entries(npc.afterFlagScript)) {
      if (state.flags[flag]) return script;
    }
  }
  return npc.script;
}

function propAvailable(prop) {
  if (prop.requires && !state.flags[prop.requires]) return false;
  const pickupKey = prop.id ? `pickup_${state.mapId}_${prop.id}` : null;
  if (prop.pickup && ((prop.flag && state.flags[prop.flag]) || (pickupKey && state.flags[pickupKey]))) return false;
  return true;
}

function interactProp(prop) {
  if (prop.requires && !state.flags[prop.requires]) return toast("It is not ready yet.");
  if (prop.pickup) {
    const pickupKey = prop.id ? `pickup_${state.mapId}_${prop.id}` : null;
    if ((prop.flag && state.flags[prop.flag]) || (pickupKey && state.flags[pickupKey])) return toast("Already collected.");
    addItem(prop.pickup, 1);
    if (prop.flag) state.flags[prop.flag] = true;
    if (pickupKey) state.flags[pickupKey] = true;
    if (prop.pickup === "moonroot-key") maybeOpenMoonGate();
    if (prop.pickup === "emberleaf") {
      const count = state.inventory.emberleaf ?? 0;
      if (count >= 3) {
        state.flags.emberleaf_done = true;
        advanceQuest("q-tutorial", 2);
      }
    }
    audio.playCue("item");
    return toast(`Got ${data.itemById[prop.pickup].name}.`);
  }
  if (prop.flagOnInteract) {
    state.flags[prop.flagOnInteract] = true;
    maybeOpenMoonGate();
    audio.playCue("skill");
    return toast("The lantern glows.");
  }
  if (prop.script) return runScript(prop.script);
}

function maybeOpenMoonGate() {
  if (state.inventory["moonroot-key"] && state.flags.lantern_1_lit && state.flags.lantern_2_lit && state.flags.lantern_3_lit) {
    state.flags.moon_gate_open = true;
    toast("The Moon Gate unlocks.");
  }
}

function checkExit() {
  const map = data.maps[state.mapId];
  const tile = currentTile();
  const exit = (map.exits ?? []).find((e) => e.x === tile.x && e.y === tile.y);
  if (!exit) return;
  if (exit.requires && !state.flags[exit.requires]) {
    state.player.x += exit.x === 0 ? 1 : exit.x === map.width - 1 ? -1 : 0;
    resetPartyTrail(state.player.x, state.player.y);
    toast("Something still needs doing first.");
    return;
  }
  const target = dungeonEntryTarget(exit);
  transferMap(target.map, target.spawn);
}

function dungeonEntryTarget(exit) {
  if (exit.to !== "moonroot_hollow" || dungeonFloorFromMapId(state.mapId)) return { map: exit.to, spawn: exit.spawn };
  const checkpointFloor = state.dungeon?.checkpointFloor ?? 1;
  if (checkpointFloor > 1) return { map: dungeonMapId(checkpointFloor), spawn: "entrance" };
  return { map: exit.to, spawn: exit.spawn };
}

function checkTrap() {
  const map = data.maps[state.mapId];
  const tile = currentTile();
  const trap = (map.traps ?? []).find((candidate) => candidate.x === tile.x && candidate.y === tile.y && !state.flags[`trap_${state.mapId}_${candidate.id}`]);
  if (!trap) return;
  const trapType = data.trapByType?.[trap.type] ?? {};
  recordJournalTrapSeen(trap.type);
  recordJournalTrapTriggered(trap.type);
  addTrapEffect(trap, trapType);
  advanceQuestFromHook(trap.questAdvance);
  state.flags[`trap_revealed_${state.mapId}_${trap.id}`] = true;
  state.flags[`trap_${state.mapId}_${trap.id}`] = true;
  audio.playCue("cancel");

  if (trap.armed === false || trap.type === "practice") {
    return toast("A marked practice plate clicks harmlessly.");
  }
  if (trap.type === "pitfall") return triggerPitfall(map);
  if (trap.type === "teleport") return triggerTeleport(map);
  if (trap.type === "alarm") {
    toast("An alarm rune wakes the floor.");
    return startCombat({ id: `${trap.id}_alarm`, enemies: alarmEnemies(map), flag: `trap_alarm_${state.mapId}_${trap.id}_won` });
  }

  const damageByType = { spikes: 16, darts: 20, poison: 12, crumble: 14 };
  const amount = damageByType[trap.type] ?? 10;
  damageParty(amount, trap.type === "darts" ? "leader" : "party");
  const labels = { spikes: "Spikes snap up from the stone.", darts: "Darts hiss from the wall.", poison: "A poison mist rolls across the floor.", crumble: "The old bridge stones give way." };
  toast(labels[trap.type] ?? "A hidden trap triggers.");
}

function updateWorldEffects(dt) {
  state.worldEffects = (state.worldEffects ?? [])
    .map((effect) => ({ ...effect, elapsed: (effect.elapsed ?? 0) + dt }))
    .filter((effect) => (effect.elapsed ?? 0) < (effect.duration ?? 0.5));
}

function updateWorldTextEffects(dt) {
  state.worldTextEffects = (state.worldTextEffects ?? [])
    .map((effect) => ({ ...effect, elapsed: (effect.elapsed ?? 0) + dt }))
    .filter((effect) => (effect.elapsed ?? 0) < (effect.duration ?? 1));
}

function addTrapEffect(trap, trapType) {
  const asset = trap.effect ?? trapType.effect;
  if (!asset) return;
  state.worldEffects ??= [];
  state.worldEffects.push({
    kind: "trap",
    asset,
    x: trap.x,
    y: trap.y,
    elapsed: 0,
    duration: trap.effectDuration ?? trapType.effectDuration ?? 0.5,
    drawW: currentMapTileSize(),
    drawH: currentMapTileSize(),
    light: trap.effectLight ?? trapType.light
  });
}

function triggerPitfall(map) {
  const floor = map.dungeonFloor ?? dungeonFloorFromMapId(map.id) ?? 1;
  const maxTarget = firstUnclearedBossFloorAtOrAfter(floor);
  const drop = 1 + (floor % 3);
  const targetFloor = Math.max(floor + 1, Math.min(floor + drop, maxTarget, IMPLEMENTED_DUNGEON_FLOOR));
  toast(`Pitfall! The party drops to floor ${targetFloor}.`);
  transferMap(dungeonMapId(targetFloor), "pitfall");
}

function triggerTeleport(map) {
  const spawn = map.spawns?.pitfall ?? map.spawn;
  state.player.x = spawn.x;
  state.player.y = spawn.y;
  resetPartyTrail(spawn.x, spawn.y);
  toast("A teleport snare throws the party across the floor.");
}

function firstUnclearedBossFloorAtOrAfter(floor) {
  for (let bossFloor = Math.ceil(floor / 10) * 10; bossFloor <= IMPLEMENTED_DUNGEON_FLOOR; bossFloor += 10) {
    if (!state.flags[`boss_floor_${bossFloor}_won`]) return bossFloor;
  }
  return IMPLEMENTED_DUNGEON_FLOOR;
}

function alarmEnemies(map) {
  const floor = map.dungeonFloor ?? dungeonFloorFromMapId(map.id) ?? 1;
  if (floor >= 11) return ["deep-moonroot-bat", "gloom-ooze"];
  if (floor >= 8) return ["moonroot-bat", "crystal-ooze"];
  return ["moonroot-bat"];
}

function damageParty(amount, target = "party") {
  const victims = target === "leader"
    ? [state.party.find((member) => member.id === state.partyOrder[0]) ?? state.party[0]]
    : state.party;
  victims.forEach((member, index) => {
    const before = member.hp;
    member.hp = Math.max(1, member.hp - amount);
    const actual = before - member.hp;
    if (actual > 0) addWorldDamageText(actual, index);
  });
}

function addWorldDamageText(amount, stack = 0) {
  state.worldTextEffects ??= [];
  state.worldTextEffects.push({
    kind: "damage",
    text: `${amount}`,
    x: state.player.x + 0.72,
    y: state.player.y + 0.18 + stack * 0.24,
    elapsed: 0,
    duration: 1,
    stack
  });
}

function checkEncounter() {
  const map = data.maps[state.mapId];
  const tile = currentTile();
  const encounter = (map.encounters ?? []).find((e) => e.x === tile.x && e.y === tile.y && !state.flags[e.flag]);
  if (encounter) startCombat(encounter);
}

function updateTentInterior() {
  const map = data.maps[state.mapId];
  const area = map.tentInterior;
  if (!area) {
    state.insideTent = false;
    return;
  }
  const [x, y, w, h] = area.rect;
  state.insideTent = state.player.x >= x && state.player.y >= y && state.player.x < x + w && state.player.y < y + h;
}

function updateBuildingInterior() {
  const map = data.maps[state.mapId];
  const building = (map.buildings ?? []).find((candidate) => {
    const rect = candidate.interiorRect ?? candidate.rect;
    return pointInTileRect(state.player, rect);
  });
  state.insideBuildingId = building?.id ?? null;
}

function pointInTileRect(point, rect) {
  if (!rect) return false;
  const [x, y, w, h] = rect;
  return point.x >= x && point.y >= y && point.x < x + w && point.y < y + h;
}

function transferMap(mapId, spawnId) {
  const map = data.maps[mapId];
  const spawn = (map.spawns && map.spawns[spawnId]) || map.spawn;
  state.mapId = mapId;
  state.player.x = spawn.x;
  state.player.y = spawn.y;
  state.insideBuildingId = null;
  state.worldEffects = [];
  resetAmbience(state);
  updateDungeonProgress(map);
  resetPartyTrail(spawn.x, spawn.y);
  updateDungeonVisibility();
  audio.playCue("transition");
  toast(map.name);
}

function updateDungeonProgress(map) {
  const floor = map.dungeonFloor ?? dungeonFloorFromMapId(map.id);
  if (!floor) {
    state.dungeon.currentFloor = 0;
    return;
  }
  state.dungeon.currentFloor = floor;
  state.dungeon.deepestFloor = Math.max(state.dungeon.deepestFloor ?? 0, floor);
  recordJournalFloorVisit(floor);
  if (floor === 1 && !(state.dungeon.checkpointFloor > 1)) state.dungeon.checkpointFloor = 1;
  if (DUNGEON_CHECKPOINT_FLOORS.includes(floor) && !(state.dungeon.unlockedCheckpoints ?? []).includes(floor)) {
    state.dungeon.unlockedCheckpoints = [...(state.dungeon.unlockedCheckpoints ?? []), floor];
    state.dungeon.checkpointFloor = floor;
    toast(`Checkpoint unlocked: floor ${floor}.`);
  }
}

function updateDungeonVisibility() {
  const map = data.maps[state.mapId];
  if (!map?.dungeonFloor || !map.regionTiles) return;
  state.dungeon.explored ??= {};
  state.dungeon.currentRegion ??= {};
  state.dungeon.mappedRegions ??= {};
  const tile = currentTile();
  const directRegionId = map.regionTiles?.[tile.y]?.[tile.x];
  if (directRegionId) markDungeonRegionMapped(map, directRegionId);
  const regionId = regionAt(map, tile.x, tile.y);
  if (!regionId) return;
  state.dungeon.currentRegion[map.id] = regionId;
  const explored = new Set(state.dungeon.explored[map.id] ?? []);
  explored.add(regionId);
  const region = (map.regions ?? []).find((candidate) => candidate.id === regionId);
  for (const linked of region?.reveal ?? []) explored.add(linked);
  state.dungeon.explored[map.id] = [...explored];
  recordJournalVisibleTraps(map, regionId);
}

function markDungeonRegionMapped(map, regionId) {
  const mapped = new Set(state.dungeon.mappedRegions?.[map.id] ?? []);
  if (mapped.has(regionId)) return;
  mapped.add(regionId);
  state.dungeon.mappedRegions[map.id] = [...mapped];
}

function openDungeonMap() {
  const map = data.maps[state.mapId];
  if (!map?.dungeonFloor || !map.regionTiles) return toast("No dungeon map here.");
  updateDungeonVisibility();
  state.mode = "map";
  input.flush();
}

function updateDungeonMap() {
  input.consumeWheel();
  input.consumeClick();
  if (input.consume("map") || input.consume("cancel") || input.consumeRightClick()) openMode("world");
}

function openJournal() {
  ensureJournalView();
  state.mode = "journal";
  state.menu.index = 0;
  input.flush();
}

function updateJournal() {
  const view = ensureJournalView();
  updateJournalPointer();
  const sections = data.journal.sections ?? [];
  if (input.consume("journal") || input.consume("cancel")) return openMode("world");
  if (input.consume("left")) {
    view.sectionIndex = wrapIndex(view.sectionIndex - 1, sections.length);
    view.entryIndex = 0;
    view.scroll = 0;
  }
  if (input.consume("right")) {
    view.sectionIndex = wrapIndex(view.sectionIndex + 1, sections.length);
    view.entryIndex = 0;
    view.scroll = 0;
  }
  const entries = journalCurrentEntries();
  if (input.consume("up")) {
    view.entryIndex = wrapIndex(view.entryIndex - 1, entries.length);
    view.scroll = 0;
  }
  if (input.consume("down")) {
    view.entryIndex = wrapIndex(view.entryIndex + 1, entries.length);
    view.scroll = 0;
  }
  input.consume("confirm");
}

function updateJournalPointer() {
  const view = ensureJournalView();
  const sectionRects = journalSectionRects();
  const entryRects = journalEntryRects();
  const hoveredSection = hitIndex(sectionRects, input.pointer);
  const hoveredEntry = hitIndex(entryRects, input.pointer);
  const wheel = input.consumeWheel();
  if (wheel && pointInRect(input.pointer, journalDetailRect())) {
    view.scroll = Math.max(0, Math.min(520, (view.scroll ?? 0) + (wheel > 0 ? 42 : -42)));
  }
  const click = input.consumeClick();
  if (!click) {
    input.consumeRightClick();
    return;
  }
  if (hoveredSection >= 0 && pointInRect(click, sectionRects[hoveredSection])) {
    view.sectionIndex = hoveredSection;
    view.entryIndex = 0;
    view.scroll = 0;
    audio.playCue("confirm");
    return;
  }
  if (hoveredEntry >= 0 && pointInRect(click, entryRects[hoveredEntry])) {
    view.entryIndex = entryRects[hoveredEntry].index;
    view.scroll = 0;
    audio.playCue("confirm");
  }
}

function ensureJournalView() {
  state.journalView ??= { sectionIndex: 0, entryIndex: 0, scroll: 0 };
  const sections = data.journal.sections ?? [];
  state.journalView.sectionIndex = Math.max(0, Math.min(state.journalView.sectionIndex ?? 0, Math.max(0, sections.length - 1)));
  const entries = journalCurrentEntries();
  state.journalView.entryIndex = Math.max(0, Math.min(state.journalView.entryIndex ?? 0, Math.max(0, entries.length - 1)));
  state.journalView.scroll = Math.max(0, state.journalView.scroll ?? 0);
  return state.journalView;
}

function journalCurrentEntries() {
  const view = state.journalView ?? { sectionIndex: 0 };
  return data.journal.sections?.[view.sectionIndex]?.entries ?? [];
}

function journalSectionRects() {
  return (data.journal.sections ?? []).map((section, index) => ({
    id: section.id,
    x: JOURNAL_CHAPTER_ROWS.x,
    y: JOURNAL_CHAPTER_ROWS.y + index * JOURNAL_CHAPTER_ROWS.rowH,
    w: JOURNAL_CHAPTER_ROWS.w,
    h: JOURNAL_CHAPTER_ROWS.h
  }));
}

function journalEntryRects() {
  const entries = journalCurrentEntries();
  const view = ensureJournalView();
  const start = journalVisibleEntryStart(entries.length, view.entryIndex);
  return entries.slice(start, start + JOURNAL_ENTRY_ROWS.max).map((entry, offset) => ({
    id: entry.id,
    index: start + offset,
    x: JOURNAL_ENTRY_ROWS.x,
    y: JOURNAL_ENTRY_ROWS.y + offset * JOURNAL_ENTRY_ROWS.rowH - 14,
    w: JOURNAL_ENTRY_ROWS.w,
    h: JOURNAL_ENTRY_ROWS.h + 4
  }));
}

function journalDetailRect() {
  return JOURNAL_DETAIL_RECT;
}

function journalVisibleEntryStart(total, selectedIndex) {
  if (total <= JOURNAL_ENTRY_ROWS.max) return 0;
  return Math.max(0, Math.min(total - JOURNAL_ENTRY_ROWS.max, selectedIndex - Math.floor(JOURNAL_ENTRY_ROWS.max / 2)));
}

function ensureJournalState() {
  state.journal ??= {};
  state.journal.seenNpcs ??= {};
  state.journal.seenTrapTypes ??= {};
  state.journal.triggeredTrapTypes ??= {};
  state.journal.seenEnemies ??= {};
  state.journal.defeatedEnemies ??= {};
  state.journal.harvestedItemsByEnemy ??= {};
  state.journal.visitedFloors ??= {};
  return state.journal;
}

function recordJournalNpc(npc) {
  if (!npc?.id) return;
  ensureJournalState().seenNpcs[npc.id] = true;
}

function recordJournalTrapSeen(type) {
  if (!type) return;
  ensureJournalState().seenTrapTypes[type] = true;
}

function recordJournalTrapTriggered(type) {
  if (!type) return;
  const journal = ensureJournalState();
  journal.seenTrapTypes[type] = true;
  journal.triggeredTrapTypes[type] = true;
}

function recordJournalVisibleTraps(map, regionId) {
  if (!map?.traps?.length) return;
  const tile = currentTile();
  for (const trap of map.traps) {
    if (trap.hidden && !state.flags[`trap_revealed_${map.id}_${trap.id}`]) continue;
    const sameRegion = trap.room && trap.room === regionId;
    const nearby = Math.abs(trap.x - tile.x) + Math.abs(trap.y - tile.y) <= 4;
    if (sameRegion || nearby) recordJournalTrapSeen(trap.type);
  }
}

function recordJournalEnemiesSeen(enemyIds) {
  const journal = ensureJournalState();
  for (const enemyId of enemyIds ?? []) if (enemyId) journal.seenEnemies[enemyId] = true;
}

function recordJournalEnemiesDefeated(enemyIds) {
  const journal = ensureJournalState();
  for (const enemyId of enemyIds ?? []) {
    if (!enemyId) continue;
    journal.seenEnemies[enemyId] = true;
    journal.defeatedEnemies[enemyId] = true;
  }
}

function recordJournalHarvest(enemyId, itemIds) {
  if (!enemyId) return;
  const journal = ensureJournalState();
  journal.harvestedItemsByEnemy[enemyId] ??= {};
  for (const itemId of itemIds ?? []) if (itemId) journal.harvestedItemsByEnemy[enemyId][itemId] = true;
}

function recordJournalFloorVisit(floor) {
  if (!floor) return;
  ensureJournalState().visitedFloors[String(floor)] = true;
}

function regionAt(map, x, y) {
  const direct = map.regionTiles?.[y]?.[x];
  if (direct) return direct;
  for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
    const nearby = map.regionTiles?.[y + dy]?.[x + dx];
    if (nearby) return nearby;
  }
  return null;
}

function resetPartyTrail(x, y) {
  const map = data.maps[state.mapId];
  state.followers.forEach((follower, index) => {
    const point = trailPoint(map, x, y, (index + 1) * FOLLOW_SPACING, state.player.dir);
    follower.x = point.x;
    follower.y = point.y;
    follower.dir = point.dir;
    follower.stepTimer = 0;
  });
  state.leaderTrail = Array.from({ length: TRAIL_LENGTH }, (_, index) => trailPoint(map, x, y, index + 1, state.player.dir));
}

function trailPoint(map, x, y, distance, dir = "down") {
  const candidates = [
    { x, y: y + distance, dir },
    { x: x - distance, y, dir },
    { x: x + distance, y, dir },
    { x, y: y - distance, dir },
    { x, y, dir }
  ];
  return candidates.find((point) => !isBlockedOnMap(map, point.x, point.y)) ?? { x, y };
}

function openNpcDialogue(npc, scriptId) {
  const definition = data.npcDialogues?.[scriptId];
  if (!definition) return runScript(scriptId);
  const options = npcDialogueOptions(definition);
  state.npcDialogue = {
    npcId: npc.id,
    scriptId,
    speaker: definition.speaker || npc.name || "NPC",
    options,
    index: 0,
    mode: "menu",
    lineKind: null,
    lineIndex: 0,
    lines: []
  };
  state.dialogue = null;
  state.scriptQueue = [];
  state.currentScriptBase = null;
  state.menu.index = 0;
  state.mode = "dialogue";
}

function npcDialogueOptions(definition) {
  const options = [
    { kind: "talk", label: "Talk" },
    { kind: "rumours", label: "Rumours" },
    { kind: "inspect", label: "Inspect" }
  ];
  for (const option of definition.questOptions ?? []) {
    const quest = data.questById[option.quest];
    options.push({
      kind: "quest",
      label: `Quest: ${quest?.name ?? option.quest}`,
      quest: option.quest,
      script: option.script
    });
  }
  if (definition.shopOption?.script) {
    options.push({
      kind: "shop",
      label: definition.shopOption.label ?? "Shop",
      script: definition.shopOption.script
    });
  }
  return options;
}

function runScript(scriptId) {
  const actions = data.scripts[scriptId];
  if (!actions) return toast(`Missing script ${scriptId}`);
  state.dialogue = null;
  state.npcDialogue = null;
  state.scriptQueue = actions.slice();
  state.currentScriptBase = scriptId;
  state.mode = "dialogue";
  continueScript();
}

function continueScript() {
  while (state.scriptQueue?.length) {
    const action = state.scriptQueue.shift();
    if (action.kind === "say") {
      state.dialogue = { speaker: action.speaker, text: action.text };
      return;
    }
    if (action.kind === "checkFlag") {
      if (state.flags[action.flag]) {
        const base = state.currentScriptBase || "";
        const next = data.scripts[`${base}:${action.goto}`] || data.scripts[action.goto];
        state.scriptQueue = next ? next.slice() : state.scriptQueue;
      }
      continue;
    }
    if (action.kind === "checkAll") {
      if (action.flags.every((flag) => state.flags[flag])) {
        const base = state.currentScriptBase || "";
        const next = data.scripts[`${base}:${action.goto}`] || data.scripts[action.goto];
        state.scriptQueue = next ? next.slice() : state.scriptQueue;
      }
      continue;
    }
    applyScriptAction(action);
    if (state.mode !== "dialogue") return;
  }
  state.mode = "world";
  state.dialogue = null;
  state.npcDialogue = null;
}

function updateDialogue() {
  if (state.npcDialogue) return updateNpcDialogue();
  const click = input.consumeClick();
  if (click && pointInRect(click, NPC_DIALOGUE_PANEL)) continueScript();
  if (input.consume("confirm")) continueScript();
  if (input.consume("cancel")) {
    state.mode = "world";
    state.dialogue = null;
    state.scriptQueue = [];
  }
}

function updateNpcDialogue() {
  const dialogue = state.npcDialogue;
  if (dialogue.mode === "menu") return updateNpcDialogueMenu(dialogue);
  if (input.consume("cancel")) return returnToNpcDialogueMenu();
  const click = input.consumeClick();
  if (click && pointInRect(click, NPC_DIALOGUE_PANEL)) return advanceNpcDialogueLine();
  if (input.consume("confirm")) advanceNpcDialogueLine();
}

function updateNpcDialogueMenu(dialogue) {
  const rects = npcDialogueOptionRects(dialogue.options.length);
  const hovered = hitIndex(rects, input.pointer);
  if (hovered >= 0) dialogue.index = hovered;
  const click = input.consumeClick();
  if (click) {
    const clicked = hitIndex(rects, click);
    if (clicked >= 0) {
      dialogue.index = clicked;
      audio.playCue("confirm");
      return selectNpcDialogueOption(dialogue.options[clicked]);
    }
  }
  if (input.consume("cancel")) return closeNpcDialogue();
  if (input.consume("down")) dialogue.index++;
  if (input.consume("up")) dialogue.index--;
  dialogue.index = wrapIndex(dialogue.index, dialogue.options.length);
  if (input.consume("confirm")) {
    audio.playCue("confirm");
    selectNpcDialogueOption(dialogue.options[dialogue.index]);
  }
}

function selectNpcDialogueOption(option) {
  const definition = data.npcDialogues?.[state.npcDialogue?.scriptId];
  if (!definition) return closeNpcDialogue();
  if (option.kind === "talk") return startNpcDialogueLines("talk", definition.talk);
  if (option.kind === "rumours") return startNpcDialogueLines("rumours", definition.rumours?.lines);
  if (option.kind === "inspect") return startNpcDialogueLines("inspect", [NPC_INSPECT_PLACEHOLDER]);
  if (option.kind === "quest" || option.kind === "shop") {
    state.npcDialogue = null;
    state.dialogue = null;
    return runScript(option.script);
  }
}

function startNpcDialogueLines(kind, lines = []) {
  const dialogue = state.npcDialogue;
  const safeLines = lines.filter((line) => typeof line === "string" && line.trim());
  dialogue.mode = "line";
  dialogue.lineKind = kind;
  dialogue.lineIndex = 0;
  dialogue.lines = safeLines.length ? safeLines : [NPC_INSPECT_PLACEHOLDER];
  state.dialogue = { speaker: dialogue.speaker, text: dialogue.lines[0] };
}

function advanceNpcDialogueLine() {
  const dialogue = state.npcDialogue;
  dialogue.lineIndex++;
  if (dialogue.lineIndex >= dialogue.lines.length) return returnToNpcDialogueMenu();
  state.dialogue = { speaker: dialogue.speaker, text: dialogue.lines[dialogue.lineIndex] };
}

function returnToNpcDialogueMenu() {
  const dialogue = state.npcDialogue;
  if (!dialogue) return;
  dialogue.mode = "menu";
  dialogue.lineKind = null;
  dialogue.lineIndex = 0;
  dialogue.lines = [];
  state.dialogue = null;
}

function closeNpcDialogue() {
  state.mode = "world";
  state.dialogue = null;
  state.npcDialogue = null;
  state.scriptQueue = [];
  state.currentScriptBase = null;
}

function applyScriptAction(action) {
  if (action.kind === "setFlag") state.flags[action.flag] = action.value;
  if (action.kind === "giveItem") addItem(action.item, action.count ?? 1);
  if (action.kind === "takeItem") removeItem(action.item, action.count ?? 1);
  if (action.kind === "giveGold") state.gold += action.amount ?? 0;
  if (action.kind === "startQuest") startQuest(action.quest);
  if (action.kind === "advanceQuest") advanceQuest(action.quest, action.stage);
  if (action.kind === "completeQuest") completeQuest(action.quest);
  if (action.kind === "completeQuestIfStage") completeQuestIfStage(action.quest, action.stage);
  if (action.kind === "openShop") {
    state.dialogue = null;
    state.npcDialogue = null;
    state.shop = { id: action.shop };
    state.menu.index = 0;
    state.mode = "shop";
    state.scriptQueue = [];
  }
  if (action.kind === "transferMap") transferMap(action.map, action.spawn);
}

function startQuest(id) {
  const quest = data.questById[id];
  if (!quest || state.quests[id]) return;
  state.quests[id] = { stage: 0, complete: false };
  state.flags[`${id}-started`] = true;
  state.flags[`quest_${id.replaceAll("-", "_")}_started`] = true;
  toastQuestObjective(id, "Quest started");
}

function advanceQuest(id, stage) {
  if (!state.quests[id]) startQuest(id);
  const current = state.quests[id];
  if (!current || current.complete) return;
  const nextStage = Math.max(current.stage ?? 0, stage ?? 0);
  if (nextStage === (current.stage ?? 0)) return;
  current.stage = nextStage;
  toastQuestObjective(id, "Quest updated");
}

function completeQuest(id) {
  const quest = data.questById[id];
  if (!quest || state.quests[id]?.complete) return;
  state.quests[id] = { stage: quest.stages.length - 1, complete: true };
  markQuestCompleteFlags(id);
  const rewards = quest.rewards ?? {};
  state.gold += rewards.gold ?? 0;
  for (const actor of state.party) actor.xp += rewards.xp ?? 0;
  for (const item of rewards.items ?? []) addItem(item.id, item.count);
  toast(`Quest complete: ${quest.name}`, { priority: true });
}

function markQuestCompleteFlags(id) {
  state.flags[`${id}-complete`] = true;
  state.flags[`quest_${id.replaceAll("-", "_")}_complete`] = true;
}

function completeQuestIfStage(id, stage) {
  const current = state.quests[id];
  if (!current) return;
  if (current.complete) {
    markQuestCompleteFlags(id);
    return;
  }
  if ((current.stage ?? 0) < (stage ?? 0)) return;
  completeQuest(id);
}

function advanceQuestFromHook(hook) {
  if (!hook?.id) return;
  advanceQuest(hook.id, hook.stage ?? 0);
}

function questStageIndex(quest, live) {
  return Math.max(0, Math.min(quest.stages.length - 1, live?.stage ?? 0));
}

function questObjectiveTitle(quest, index) {
  return quest.stages?.[index] ?? "Objective";
}

function questObjectiveText(quest, index) {
  return quest.objectives?.[index]?.text ?? questObjectiveTitle(quest, index);
}

function toastQuestObjective(id, heading) {
  const quest = data.questById[id];
  const live = state.quests[id];
  if (!quest || !live) return;
  const index = questStageIndex(quest, live);
  toast(`${heading}: ${quest.name}\nObjective: ${questObjectiveTitle(quest, index)}`, { priority: true });
}

function addItem(id, count) {
  state.inventory[id] = (state.inventory[id] ?? 0) + count;
}

function removeItem(id, count) {
  state.inventory[id] = Math.max(0, (state.inventory[id] ?? 0) - count);
}

function updateMenus() {
  updateMenuPointer();
  if (input.consume("journal")) return openJournal();
  if (state.mode === "party" && state.pointerUi?.partyProfile && input.consume("cancel")) {
    state.pointerUi.partyProfile = null;
    return;
  }
  if (state.mode === "party" && state.pointerUi?.partyProfile) return;
  if (input.consume("cancel")) return openMode("world");
  if (input.consume("down")) state.menu.index++;
  if (input.consume("up")) state.menu.index--;
  if (state.mode === "menu") state.menu.index = wrapIndex(state.menu.index, FIELD_MENU_ITEMS.length);
  if (state.mode === "quests") state.menu.index = wrapIndex(state.menu.index, Math.max(1, liveQuestIds().length));
  if (state.mode === "settings") return updateAudioSettings();
  if (state.mode === "inventory") state.menu.index = 0;
  if (state.mode === "party" && input.consume("confirm")) rotateParty();
  if (state.mode === "inventory" && input.consume("confirm")) useFirstFieldItem();
  if (state.mode === "menu" && input.consume("confirm")) {
    selectFieldMenuChoice(FIELD_MENU_ITEMS[state.menu.index]);
  }
}

function updateMenuPointer() {
  if (state.mode === "menu") return updateFieldMenuPointer();
  if (state.mode === "inventory") return updateInventoryPointer();
  if (state.mode === "quests") return updateQuestPointer();
  if (state.mode === "party" && state.pointerUi?.partyProfile) return updatePartyProfilePointer();
  if (state.mode === "party") return updatePartyPointer();
  if (state.mode === "settings") return updateSettingsPointer();
  input.consumeWheel();
  input.consumeClick();
}

function updateFieldMenuPointer() {
  const hovered = hitIndex(fieldMenuRects(), input.pointer);
  if (hovered >= 0) state.menu.index = hovered;
  const click = input.consumeClick();
  if (!click) return;
  const clicked = hitIndex(fieldMenuRects(), click);
  if (clicked < 0) return;
  state.menu.index = clicked;
  audio.playCue("confirm");
  selectFieldMenuChoice(FIELD_MENU_ITEMS[clicked]);
}

function selectFieldMenuChoice(choice) {
  if (choice === "Inventory") openMode("inventory");
  if (choice === "Party") openMode("party");
  if (choice === "Quest Log") openMode("quests");
  if (choice === "Journal") openJournal();
  if (choice === "Settings") openMode("settings");
  if (choice === "Save") {
    saveGame(state);
    toast("Game saved.");
  }
  if (choice === "Load") {
    if (!loadGame(state, data)) toast("No save found.");
  }
  if (choice === "Close") openMode("world");
}

function updateInventoryPointer() {
  const rows = inventoryRows();
  const click = input.consumeClick();
  if (!click) return;
  const clicked = hitIndex(rows.map((row) => row.rect), click);
  if (clicked < 0) return;
  const row = rows[clicked];
  if (!data.itemById[row.id].usable?.includes("field")) return toast("That cannot be used here.");
  useItemOnParty(row.id);
}

function updateQuestPointer() {
  const rows = questRows();
  const hovered = hitIndex(rows.map((row) => row.rect), input.pointer);
  if (hovered >= 0) state.menu.index = hovered;
  const click = input.consumeClick();
  if (click) {
    const clicked = hitIndex(rows.map((row) => row.rect), click);
    if (clicked >= 0) {
      state.menu.index = clicked;
      audio.playCue("confirm");
    }
  }
  input.consumeWheel();
}

function updateSettingsPointer() {
  const rows = settingsRowRects();
  const hovered = hitIndex(rows, input.pointer);
  if (hovered >= 0) state.menu.index = hovered;
  const wheel = input.consumeWheel();
  if (wheel && hovered >= 0 && rows[hovered].type === "audio") {
    const key = rows[hovered].key;
    setAudioSetting(key, (state.audioSettings[key] ?? 0) + (wheel < 0 ? 0.05 : -0.05));
  }
  const meterIndex = rows.findIndex((row) => row.type === "audio" && pointInRect(input.pointer, row.meter));
  if (input.pointer.down && meterIndex >= 0) {
    state.menu.index = meterIndex;
    setAudioSettingFromPointer(meterIndex, input.pointer.x);
  }
  const click = input.consumeClick();
  if (!click) return;
  const clicked = hitIndex(rows, click);
  if (clicked < 0) return;
  state.menu.index = clicked;
  const row = rows[clicked];
  if (row.type === "audio" && pointInRect(click, row.meter)) setAudioSettingFromPointer(clicked, click.x);
  if (row.type === "partyDisplay") {
    const optionIndex = hitIndex(partyDisplayOptionRects(), click);
    if (optionIndex >= 0) setPartyDisplayMode(PARTY_DISPLAY_OPTIONS[optionIndex].key);
    else cyclePartyDisplayMode(1);
  }
}

function updatePartyPointer() {
  const rects = partyCardRects();
  state.pointerUi.partyHelpHover = pointInRect(input.pointer, PARTY_HELP_RECT);
  const down = input.consumePointerDown();
  if (down) {
    const hit = hitIndex(rects, down);
    if (hit >= 0) {
      state.menu.index = hit;
      state.pointerUi.partyDrag = {
        from: hit,
        target: hit,
        x: down.x,
        y: down.y,
        offsetX: down.x - rects[hit].x,
        offsetY: down.y - rects[hit].y
      };
    }
  }
  const drag = state.pointerUi.partyDrag;
  if (drag && input.pointer.down) {
    drag.x = input.pointer.x;
    drag.y = input.pointer.y;
    drag.target = partyDropIndex(input.pointer.x);
    state.menu.index = drag.target;
  }
  const up = input.consumePointerUp();
  if (up && drag) {
    const target = partyDropIndex(up.x);
    const dragged = up.dragged || drag.target !== drag.from;
    state.pointerUi.partyDrag = null;
    if (dragged) reorderParty(drag.from, target);
  }
  const click = input.consumeClick();
  if (!click) return;
  const portraitClicked = hitIndex(partyPortraitRects(), click);
  if (portraitClicked >= 0) {
    state.menu.index = portraitClicked;
    const actor = data.partyById[state.partyOrder[portraitClicked]];
    if (actor.profile) openPartyProfile(actor.id);
    return;
  }
  const clicked = hitIndex(rects, click);
  if (clicked >= 0) state.menu.index = clicked;
}

function updatePartyProfilePointer() {
  const profile = state.pointerUi.partyProfile;
  const actor = data.partyById[profile.id];
  const wheel = input.consumeWheel();
  if (wheel) {
    const amount = Math.min(96, Math.max(28, Math.abs(wheel) * 0.35));
    const next = (profile.bioScroll ?? 0) + (wheel > 0 ? amount : -amount);
    profile.bioScroll = Math.max(0, Math.min(partyProfileMaxScroll(actor), next));
  }
  input.consumePointerDown();
  input.consumePointerUp();
  const click = input.consumeClick();
  if (click && pointInRect(click, partyProfileBackRect())) {
    state.pointerUi.partyProfile = null;
    audio.playCue("cancel");
  }
}

function openPartyProfile(id) {
  state.pointerUi.partyProfile = { id, bioScroll: 0 };
  audio.playCue("confirm");
}

function partyProfileMaxScroll(actor) {
  const bio = actor.profileBio ?? actor.lore ?? "";
  const estimatedLines = estimatedWrappedLines(bio, PROFILE_BIO_CHARS_PER_LINE);
  const visibleH = actor.profileLayout === "scene" ? 164 : PROFILE_BIO_VISIBLE_H;
  return Math.max(0, estimatedLines * PROFILE_BIO_LINE_HEIGHT - visibleH);
}

function estimatedWrappedLines(text, maxChars) {
  let lines = 0;
  for (const paragraph of text.split("\n")) {
    let line = "";
    for (const word of paragraph.split(" ")) {
      const test = line ? `${line} ${word}` : word;
      if (test.length > maxChars && line) {
        lines++;
        line = word;
      } else {
        line = test;
      }
    }
    if (line) lines++;
  }
  return lines;
}

function partyProfileBackRect() {
  return { x: 28, y: 24, w: 92, h: 34 };
}

function updateAudioSettings() {
  state.menu.index = wrapIndex(state.menu.index, settingsRowCount());
  const row = settingRowForIndex(state.menu.index);
  if (row?.type === "partyDisplay") {
    const left = input.consume("left");
    const right = input.consume("right");
    const confirm = input.consume("confirm");
    if (left || right || confirm) cyclePartyDisplayMode(left ? -1 : 1);
    return;
  }

  const delta = input.consume("left") ? -0.05 : input.consume("right") ? 0.05 : 0;
  input.consume("confirm");
  if (!delta || !row) return;
  setAudioSetting(row.key, state.audioSettings[row.key] + delta);
}

function setAudioSettingFromPointer(index, x) {
  const row = settingsRowRects()[index];
  const value = Math.max(0, Math.min(1, (x - row.meter.x) / row.meter.w));
  setAudioSetting(AUDIO_SETTING_ROWS[index].key, value);
}

function setAudioSetting(key, value) {
  const next = Math.max(0, Math.min(1, Math.round(value * 20) / 20));
  if (state.audioSettings[key] === next) return;
  state.audioSettings[key] = next;
  audio.applySettings(state.audioSettings);
  saveAudioSettings(state.audioSettings);
  audio.playCue("menuMove");
}

function cyclePartyDisplayMode(direction = 1) {
  const current = normalizeGameSettings(state.gameSettings).partyDisplayMode;
  const index = Math.max(0, PARTY_DISPLAY_OPTIONS.findIndex((option) => option.key === current));
  const nextIndex = wrapIndex(index + direction, PARTY_DISPLAY_OPTIONS.length);
  setPartyDisplayMode(PARTY_DISPLAY_OPTIONS[nextIndex].key);
}

function setPartyDisplayMode(mode) {
  const next = normalizeGameSettings({ partyDisplayMode: mode });
  const current = normalizeGameSettings(state.gameSettings);
  if (current.partyDisplayMode === next.partyDisplayMode) return;
  state.gameSettings = next;
  saveGameSettings(state.gameSettings);
  audio.playCue("menuMove");
}

function openMode(mode) {
  state.mode = mode;
  state.menu.index = 0;
  state.pointerUi.partyDrag = null;
  input.flush();
}

function rotateParty() {
  state.partyOrder.push(state.partyOrder.shift());
  rebuildFollowers();
  toast(`${data.partyById[state.partyOrder[0]].name} leads.`);
}

function reorderParty(from, to) {
  if (from === to || from < 0 || to < 0 || from >= state.partyOrder.length || to >= state.partyOrder.length) return;
  const oldLeader = state.partyOrder[0];
  const [id] = state.partyOrder.splice(from, 1);
  state.partyOrder.splice(to, 0, id);
  rebuildFollowers();
  if (state.partyOrder[0] !== oldLeader) toast(`${data.partyById[state.partyOrder[0]].name} leads.`);
  else toast("Party order changed.");
}

function rebuildFollowers() {
  state.followers = state.partyOrder.slice(1).map((id) => ({ id, x: state.player.x, y: state.player.y, dir: state.player.dir, stepTimer: 0 }));
  resetPartyTrail(state.player.x, state.player.y);
}

function useFirstFieldItem() {
  const id = Object.keys(state.inventory).find((itemId) => state.inventory[itemId] > 0 && data.itemById[itemId].usable?.includes("field"));
  if (!id) return toast("No field item available.");
  useItemOnParty(id);
}

function useItemOnParty(id) {
  const item = data.itemById[id];
  const effect = item.effect;
  const result = { kind: effect.kind, indicators: [] };
  if (effect.kind === "party-heal") {
    for (const live of state.party) {
      const base = data.partyById[live.id];
      const beforeHp = live.hp;
      live.hp = Math.min(base.stats.hp, live.hp + effect.amount);
      const restored = live.hp - beforeHp;
      if (restored > 0) result.indicators.push(combatIndicator({ side: "party", actorId: live.id, kind: "heal", amount: restored }));
    }
  } else {
    const live = state.party.find((p) => p.hp > 0) ?? state.party[0];
    const base = data.partyById[live.id];
    if (effect.kind === "heal") {
      const beforeHp = live.hp;
      live.hp = Math.min(base.stats.hp, live.hp + effect.amount);
      const restored = live.hp - beforeHp;
      if (restored > 0) result.indicators.push(combatIndicator({ side: "party", actorId: live.id, kind: "heal", amount: restored }));
    }
    if (effect.kind === "mp") live.mp = Math.min(base.stats.mp, live.mp + effect.amount);
    if (effect.kind === "revive" && live.hp <= 0) {
      const beforeHp = live.hp;
      live.hp = effect.amount;
      const restored = live.hp - beforeHp;
      if (restored > 0) result.indicators.push(combatIndicator({ side: "party", actorId: live.id, kind: "heal", amount: restored }));
    }
  }
  removeItem(id, 1);
  audio.playCue("item");
  toast(`Used ${item.name}.`);
  return result;
}

function updateShop() {
  const shop = data.shopById[state.shop.id];
  updateShopPointer(shop);
  if (input.consume("cancel")) return openMode("world");
  if (input.consume("down")) state.menu.index = wrapIndex(state.menu.index + 1, shop.items.length);
  if (input.consume("up")) state.menu.index = wrapIndex(state.menu.index - 1, shop.items.length);
  if (input.consume("confirm")) buyShopItem(shop, state.menu.index);
}

function updateShopPointer(shop) {
  const rects = shopRowRects(shop);
  const hovered = hitIndex(rects, input.pointer);
  if (hovered >= 0) state.menu.index = hovered;
  const click = input.consumeClick();
  if (!click) return;
  const clicked = hitIndex(rects, click);
  if (clicked < 0) return;
  state.menu.index = clicked;
  buyShopItem(shop, clicked);
}

function buyShopItem(shop, index) {
  const row = shop.items[index];
  if (!row) return;
  const item = data.itemById[row.id];
  if (state.gold < item.price) return toast("Not enough gold.");
  state.gold -= item.price;
  addItem(item.id, 1);
  audio.playCue("item");
  toast(`Bought ${item.name}.`);
}

function startCombat(encounter) {
  const enemies = encounter.enemies.map((id, index) => {
    const base = data.enemyById[id];
    return { id, name: base.name, asset: base.asset, boss: base.boss, drawW: base.drawW, drawH: base.drawH, hp: base.stats.hp, mp: base.stats.mp, index, stats: base.stats, xp: base.xp, gold: base.gold };
  });
  recordJournalEnemiesSeen(enemies.map((enemy) => enemy.id));
  state.combat = { encounter, enemies, log: "Enemies appear!", menu: "root", turnQueue: [], turn: null, action: null, boss: enemies.some((e) => e.boss), backdrop: chooseBattleBackdrop(enemies) };
  state.mode = "combat";
  state.menu.index = 0;
  audio.playCue("encounter");
  rebuildTurns();
}

function chooseBattleBackdrop(enemies) {
  const map = data.maps[state.mapId] ?? {};
  const boss = enemies.some((enemy) => enemy.boss);
  const fallback = boss ? (map.bossBackdrop ?? map.backdrop) : map.backdrop;
  const pool = boss
    ? (map.bossBattleBackdrops ?? ["backdrop.battle.boss.a", "backdrop.battle.boss.b", "backdrop.battle.boss.c"])
    : (map.battleBackdrops ?? (map.dungeonFloor ? ["backdrop.battle.dungeon.a", "backdrop.battle.dungeon.b", "backdrop.battle.dungeon.c"] : []));
  if (!pool?.length) return fallback;
  return pool[Math.floor(Math.random() * pool.length)] ?? fallback;
}

function rebuildTurns() {
  const c = state.combat;
  c.turnQueue = [
    ...state.party.filter((p) => p.hp > 0).map((p) => ({ side: "party", id: p.id, agility: data.partyById[p.id].stats.agility })),
    ...c.enemies.filter((e) => e.hp > 0).map((e) => ({ side: "enemy", id: e.index, agility: e.stats.agility }))
  ].sort((a, b) => b.agility - a.agility);
  nextTurn();
}

function nextTurn() {
  const c = state.combat;
  if (!c) return;
  c.action = null;
  if (c.enemies.every((e) => e.hp <= 0)) return winCombat();
  if (state.party.every((p) => p.hp <= 0)) return loseCombat();
  if (!c.turnQueue.length) return rebuildTurns();
  c.turn = c.turnQueue.shift();
  c.menu = "root";
  state.menu.index = 0;
  if (c.turn.side === "enemy") enemyTurn();
}

function updateCombat(dt) {
  const c = state.combat;
  if (c?.action) return updateCombatAction(c, dt);
  if (!c || c.turn?.side !== "party") return;
  updateCombatPointer();
  const root = COMBAT_ROOT_ITEMS;
  if (input.consume("cancel")) {
    c.menu = "root";
    state.menu.index = 0;
  }
  if (input.consume("down")) state.menu.index++;
  if (input.consume("up")) state.menu.index--;
  const actor = data.partyById[c.turn.id];
  const live = state.party.find((p) => p.id === actor.id);
  if (c.menu === "root") {
    state.menu.index = wrapIndex(state.menu.index, root.length);
    if (!input.consume("confirm")) return;
    const choice = root[state.menu.index];
    if (choice === "Attack") return partyAttack(live, null);
    if (choice === "Skill") {
      c.menu = "skills";
      state.menu.index = 0;
    }
    if (choice === "Item") {
      c.menu = "items";
      state.menu.index = 0;
    }
    if (choice === "Defend") {
      live.guard = true;
      c.log = `${actor.name} defends.`;
      audio.playCue("guard");
      return beginCombatAction({ side: "party", actorId: actor.id, kind: "guard", effect: "guard", label: "Defend", duration: 0.58 });
    }
    if (choice === "Flee") {
      if (c.boss) return c.log = "There is nowhere to run.";
      state.mode = "world";
      state.combat = null;
      audio.playCue("cancel");
      toast("You fled.");
    }
  } else if (c.menu === "skills") {
    const skills = actor.skills.concat(live.ult >= 100 ? [actor.ultimate] : []);
    state.menu.index = wrapIndex(state.menu.index, skills.length);
    if (input.consume("confirm")) partyAttack(live, data.skillById[skills[state.menu.index]]);
  } else if (c.menu === "items") {
    const ids = Object.keys(state.inventory).filter((id) => state.inventory[id] > 0 && data.itemById[id].usable?.includes("battle"));
    state.menu.index = wrapIndex(state.menu.index, Math.max(1, ids.length));
    if (input.consume("confirm") && ids.length) {
      const itemId = ids[state.menu.index];
      const result = useItemOnParty(itemId);
      c.log = `${actor.name} used ${data.itemById[itemId]?.name ?? "an item"}.`;
      beginCombatAction({ side: "party", actorId: actor.id, kind: "item", effect: "heal", label: "Item", duration: 0.58, indicators: result?.indicators ?? [] });
    }
  }
}

function updateCombatAction(c, dt) {
  c.action.elapsed = Math.min(c.action.duration, (c.action.elapsed ?? 0) + dt);
  c.action.timer -= dt;
  if (c.action.timer > 0) return;
  nextTurn();
}

function beginCombatAction(action) {
  const c = state.combat;
  c.action = { elapsed: 0, timer: action.duration, ...action };
}

function updateCombatPointer() {
  const c = state.combat;
  if (!c || c.turn?.side !== "party") return;
  const actor = data.partyById[c.turn.id];
  const live = state.party.find((p) => p.id === actor.id);
  const items = combatMenuItems(c, actor, live);
  const rects = listRects(68, 494, items.length, 30, 360);
  const hovered = hitIndex(rects, input.pointer);
  if (hovered >= 0) state.menu.index = hovered;
  const click = input.consumeClick();
  if (!click) return;
  const clicked = hitIndex(rects, click);
  if (clicked < 0) return;
  state.menu.index = clicked;
  input.pressed.add("confirm");
  audio.playCue("confirm");
}

function partyAttack(live, skill) {
  const c = state.combat;
  const actor = data.partyById[live.id];
  if (skill && skill.kind === "ultimate" && live.ult < 100) return c.log = "Ultimate is not ready.";
  if (skill && live.mp < skill.mp) return c.log = "Not enough MP.";
  audio.playCue(skill ? "skill" : "attack");
  const targets = skill?.target === "enemies" ? c.enemies.filter((e) => e.hp > 0) : [c.enemies.find((e) => e.hp > 0)];
  if (skill) live.mp -= skill.mp;
  if (skill?.kind === "ultimate") live.ult = 0;
  const actionTargets = targets.filter(Boolean).map((target) => target.index);
  const effect = combatEffectFor(actor, skill);
  const indicators = [];
  if (skill?.effect?.includes("heal")) {
    const amount = Math.round(skill.power);
    for (const ally of state.party) {
      const base = data.partyById[ally.id];
      const beforeHp = ally.hp;
      ally.hp = Math.min(base.stats.hp, ally.hp + amount);
      const restored = ally.hp - beforeHp;
      if (restored > 0) indicators.push(combatIndicator({ side: "party", actorId: ally.id, kind: "heal", amount: restored }));
    }
    c.log = skill.text;
  } else if (skill?.effect === "guard" || skill?.effect === "barrier" || skill?.effect === "evasion") {
    live.guard = true;
    c.log = skill.text;
  } else if (skill?.effect === "cleanse") {
    live.status = [];
    const beforeHp = live.hp;
    live.hp = Math.min(actor.stats.hp, live.hp + 12);
    const restored = live.hp - beforeHp;
    if (restored > 0) indicators.push(combatIndicator({ side: "party", actorId: live.id, kind: "heal", amount: restored }));
    c.log = skill.text;
  } else {
    const damageType = damageTypeForAttack(actor, skill);
    let totalDamage = 0;
    let stack = 0;
    for (const target of targets) {
      if (!target) continue;
      const attack = skill?.effect?.startsWith("magic") ? actor.stats.magic : actor.stats.attack;
      const power = skill?.power ?? 1.0;
      const damage = Math.max(1, Math.round(attack * power - target.stats.defense * 0.55));
      const beforeHp = target.hp;
      target.hp = Math.max(0, target.hp - damage);
      const actualDamage = beforeHp - target.hp;
      totalDamage += actualDamage;
      if (actualDamage > 0) indicators.push(combatIndicator({ side: "enemy", enemyIndex: target.index, kind: "damage", amount: actualDamage, damageType, stack: stack++ }));
      if (beforeHp > 0 && target.hp <= 0) markEnemyKilled(target, damageType, skill, actor);
      live.ult = Math.min(100, live.ult + 14);
      if (skill?.effect?.includes("steal")) state.gold += 5;
    }
    c.log = skill ? `${skill.text} (${totalDamage})` : `${actor.name} attacks for ${totalDamage}.`;
  }
  beginCombatAction({
    side: "party",
    actorId: actor.id,
    kind: skill ? "skill" : "attack",
    skillId: skill?.id ?? null,
    effect,
    targetIndexes: actionTargets,
    label: skill?.name ?? "Attack",
    indicators,
    duration: ["heal", "magic", "fire", "frost", "arcane", "barrier", "smoke"].includes(effect) ? 0.86 : 0.64
  });
}

function combatIndicator({ side, actorId = null, enemyIndex = null, kind, amount, damageType = null, stack = 0 }) {
  return { side, actorId, enemyIndex, kind, amount, damageType, stack };
}

function combatEffectFor(actor, skill) {
  if (!skill) return actor.id === "rowan" ? "shield-slash" : actor.id === "nia" ? "pierce" : "strike";
  if (skill.id === "guard-break") return "shield-bash";
  if (skill.id === "smoke-step") return "smoke";
  if (skill.effect?.includes("heal") || skill.effect === "cleanse") return "heal";
  if (skill.effect === "guard" || skill.effect === "barrier" || skill.effect === "evasion") return "barrier";
  if (skill.id === "ember-bolt") return "fire";
  if (skill.id === "frost-sigil") return "frost";
  if (skill.id === "arc-burst" || skill.id === "astral-cascade") return "arcane";
  if (skill.effect?.startsWith("magic")) return "magic";
  if (actor.id === "rowan") return "shield-slash";
  if (actor.id === "nia") return "pierce";
  return "strike";
}

function damageTypeForAttack(actor, skill) {
  if (!skill) return PARTY_BASIC_DAMAGE_TYPES[actor.id] ?? "slash";
  if (skill.id === "ember-bolt") return "fire";
  if (skill.effect?.startsWith("magic")) return "magic";
  if (actor.id === "rowan") return "blunt";
  if (actor.id === "nia") return "pierce";
  return PARTY_BASIC_DAMAGE_TYPES[actor.id] ?? "magic";
}

function markEnemyKilled(enemy, damageType, skill, actor) {
  enemy.killedByDamageType = data.loot.supportedDamageTypes.includes(damageType) ? damageType : "magic";
  enemy.killedBySkillId = skill?.id ?? null;
  enemy.killedByActorId = actor.id;
}

function enemyTurn() {
  const c = state.combat;
  const enemy = c.enemies.find((e) => e.index === c.turn.id);
  if (!enemy || enemy.hp <= 0) return nextTurn();
  const target = state.party.filter((p) => p.hp > 0).sort((a, b) => a.hp - b.hp)[0];
  const base = data.partyById[target.id];
  const rawDamage = Math.max(1, Math.round(enemy.stats.attack - base.stats.defense * 0.45));
  let damage = rawDamage;
  let mitigated = 0;
  if (target.guard) {
    damage = Math.ceil(damage / 2);
    mitigated = rawDamage - damage;
    target.guard = false;
  }
  const beforeHp = target.hp;
  target.hp = Math.max(0, target.hp - damage);
  const actualDamage = beforeHp - target.hp;
  target.ult = Math.min(100, target.ult + 18);
  c.log = `${enemy.name} hits ${base.name.split(" ")[0]} for ${actualDamage}.`;
  audio.playCue("enemy");
  const indicators = [];
  if (mitigated > 0) indicators.push(combatIndicator({ side: "party", actorId: target.id, kind: "mitigation", amount: mitigated, stack: 0 }));
  if (actualDamage > 0) indicators.push(combatIndicator({ side: "party", actorId: target.id, kind: "damage", amount: actualDamage, damageType: "slash", stack: mitigated > 0 ? 1 : 0 }));
  beginCombatAction({ side: "enemy", enemyIndex: enemy.index, targetActorId: target.id, kind: "attack", effect: "enemy-strike", label: "Attack", duration: 0.62, indicators });
}

function winCombat() {
  const c = state.combat;
  let xp = 0;
  let gold = 0;
  for (const enemy of c.enemies) {
    xp += enemy.xp;
    gold += enemy.gold;
  }
  for (const member of state.party) member.xp += xp;
  state.gold += gold;
  state.flags[c.encounter.flag] = true;
  recordJournalEnemiesDefeated(c.enemies.filter((enemy) => enemy.hp <= 0).map((enemy) => enemy.id));
  advanceQuestFromHook(c.encounter.questAdvance);
  if (c.encounter.id === "tutorial_slime") advanceQuest("q-tutorial", 3);
  if (c.encounter.id === "vorthane") {
    addItem("moonroot-bloom", 1);
    completeQuest("q-moonroot");
  }
  const victory = { xp, gold };
  const remains = createHarvestRemains(c);
  state.combat = null;
  audio.playCue("victory");
  state.mode = "combat-summary";
  state.combatSummary = {
    victory,
    remains,
    backdrop: c.backdrop,
    defeated: c.enemies.map((enemy) => ({ id: enemy.id, name: enemy.name, gold: enemy.gold, xp: enemy.xp }))
  };
  state.menu.index = 0;
  input.flush();
}

function updateCombatSummary() {
  input.consumeWheel();
  if (input.consume("confirm") || input.consume("cancel")) finishCombatSummary();
  const click = input.consumeClick();
  if (click) finishCombatSummary();
}

function finishCombatSummary() {
  const summary = state.combatSummary;
  if (summary?.remains?.length) {
    state.mode = "harvest";
    state.harvest = { victory: summary.victory, remains: summary.remains, currentIndex: 0, results: [] };
    state.combatSummary = null;
    state.menu.index = 0;
    input.flush();
    return;
  }
  state.combatSummary = null;
  state.mode = "world";
  toast(`Victory! ${summary?.victory?.xp ?? 0}xp ${summary?.victory?.gold ?? 0}g`);
}

function createHarvestRemains(combat) {
  return combat.enemies
    .filter((enemy) => enemy.hp <= 0 && data.harvestProfileByEnemyId[enemy.id])
    .map((enemy) => {
      const profile = data.harvestProfileByEnemyId[enemy.id];
      return {
        id: `${combat.encounter.id}_${enemy.index}_remains`,
        enemyId: enemy.id,
        name: enemy.name,
        killedByDamageType: enemy.killedByDamageType ?? "magic",
        harvestChoices: profile.harvestChoices,
        selectedOptions: [],
        resolved: false,
        result: null
      };
    });
}

function updateHarvest() {
  const harvest = state.harvest;
  if (!harvest) return openMode("world");
  updateHarvestPointer();
  const remains = harvest.remains[harvest.currentIndex];
  if (!remains) return finishHarvest();
  if (remains.result) {
    if (input.consume("confirm") || input.consume("cancel")) advanceHarvest();
    return;
  }
  if (input.consume("cancel")) {
    remains.selectedOptions.pop();
    return;
  }
  if (input.consume("down")) state.menu.index = wrapIndex(state.menu.index + 1, HARVEST_OPTION_KEYS.length);
  if (input.consume("up")) state.menu.index = wrapIndex(state.menu.index - 1, HARVEST_OPTION_KEYS.length);
  state.menu.index = wrapIndex(state.menu.index, HARVEST_OPTION_KEYS.length);
  if (!input.consume("confirm")) return;
  if (remains.selectedOptions.length >= remains.harvestChoices) return resolveHarvestRemains(remains);
  toggleHarvestOption(remains, HARVEST_OPTION_KEYS[state.menu.index]);
}

function updateHarvestPointer() {
  const harvest = state.harvest;
  const remains = harvest?.remains?.[harvest.currentIndex];
  if (!remains) {
    input.consumeClick();
    return;
  }
  const click = input.consumeClick();
  const hovered = hitIndex(harvestOptionRects(), input.pointer);
  if (hovered >= 0) state.menu.index = hovered;
  if (!click) return;
  if (remains.result) {
    input.pressed.add("confirm");
    audio.playCue("confirm");
    return;
  }
  const clicked = hitIndex(harvestOptionRects(), click);
  if (clicked >= 0) {
    state.menu.index = clicked;
    if (remains.selectedOptions.length >= remains.harvestChoices) input.pressed.add("confirm");
    else toggleHarvestOption(remains, HARVEST_OPTION_KEYS[clicked]);
    audio.playCue("confirm");
    return;
  }
  if (pointInRect(click, harvestResolveRect()) && remains.selectedOptions.length >= remains.harvestChoices) {
    input.pressed.add("confirm");
    audio.playCue("confirm");
  }
}

function toggleHarvestOption(remains, optionKey) {
  const selectedIndex = remains.selectedOptions.indexOf(optionKey);
  if (selectedIndex >= 0) {
    remains.selectedOptions.splice(selectedIndex, 1);
    return;
  }
  if (remains.selectedOptions.length < remains.harvestChoices) remains.selectedOptions.push(optionKey);
}

function resolveHarvestRemains(remains) {
  const items = [];
  for (const optionKey of remains.selectedOptions) {
    const itemId = resolveHarvestItem(remains, optionKey);
    if (itemId) items.push({ itemId, count: 1, optionKey });
  }
  for (const item of items) addItem(item.itemId, item.count);
  recordJournalHarvest(remains.enemyId, items.map((item) => item.itemId));
  const reactions = resolveLootReactions(items.map((item) => item.itemId));
  remains.resolved = true;
  remains.result = { remainsId: remains.id, selectedOptions: [...remains.selectedOptions], items, reactions };
  state.harvest.results.push(remains.result);
  audio.playCue("item");
}

function resolveHarvestItem(remains, optionKey) {
  const profile = data.harvestProfileByEnemyId[remains.enemyId];
  const option = profile?.harvestOptions?.[optionKey];
  const damageTypeItems = option?.byKillingDamageType?.[remains.killedByDamageType];
  return (damageTypeItems?.[0] ?? option?.common?.[0]) ?? null;
}

function resolveLootReactions(itemIds) {
  state.loot ??= { reactionFlags: {} };
  state.loot.reactionFlags ??= {};
  const itemSet = new Set(itemIds);
  const reactions = [];
  for (const reaction of data.loot.reactions ?? []) {
    if (state.loot.reactionFlags[reaction.id]) continue;
    if (!(reaction.itemIds ?? []).some((itemId) => itemSet.has(itemId))) continue;
    state.loot.reactionFlags[reaction.id] = true;
    reactions.push({ id: reaction.id, speaker: reaction.speaker, text: reaction.text });
    break;
  }
  return reactions;
}

function advanceHarvest() {
  state.harvest.currentIndex++;
  state.menu.index = 0;
  if (state.harvest.currentIndex >= state.harvest.remains.length) finishHarvest();
}

function finishHarvest() {
  const total = (state.harvest?.results ?? []).reduce((sum, result) => sum + result.items.reduce((itemSum, item) => itemSum + item.count, 0), 0);
  state.harvest = null;
  state.mode = "world";
  toast(total ? `Recovered ${total} item${total === 1 ? "" : "s"}.` : "Harvest complete.");
}

function loseCombat() {
  for (const member of state.party) {
    const base = data.partyById[member.id];
    member.hp = Math.ceil(base.stats.hp * 0.5);
  }
  const checkpointFloor = state.dungeon?.checkpointFloor ?? 1;
  if (state.mapId.startsWith("moonroot_") && checkpointFloor > 1) transferMap(dungeonMapId(checkpointFloor), "entrance");
  else transferMap("brindlemarket_village", "moon_gate_return");
  state.mode = "world";
  state.combat = null;
  audio.playCue("cancel");
  toast("The party retreats to Brindlemarket.");
}

function wrapIndex(index, length) {
  if (length <= 0) return 0;
  return ((index % length) + length) % length;
}

function toast(text, options = {}) {
  if (!options.priority && state.toastPriority && state.toastTimer > 0) return;
  state.toast = text;
  state.toastTimer = options.duration ?? 3;
  state.toastPriority = Boolean(options.priority);
}

function pointInRect(point, rect) {
  return point.x >= rect.x && point.y >= rect.y && point.x < rect.x + rect.w && point.y < rect.y + rect.h;
}

function currentTile() {
  return { x: Math.round(state.player.x), y: Math.round(state.player.y) };
}

function currentMapTileSize() {
  return data.maps[state.mapId]?.tileSize ?? TILE;
}

function directionTileDelta(dir) {
  return {
    up: [0, -1],
    down: [0, 1],
    left: [-1, 0],
    right: [1, 0],
    "up-left": [-1, -1],
    "up-right": [1, -1],
    "down-left": [-1, 1],
    "down-right": [1, 1]
  }[dir] ?? [0, 1];
}

function hitIndex(rects, point) {
  return rects.findIndex((rect) => pointInRect(point, rect));
}

function measuredTextWidth(text, size = 15) {
  ctx.font = `${size}px monospace`;
  return ctx.measureText(text).width;
}

function titleMenuRects() {
  const baseY = 560;
  return TITLE_MENU_ITEMS.map((item, index) => {
    const rowY = baseY + index * 42;
    const w = Math.round(measuredTextWidth(item, 18) + 76);
    return { x: Math.round(960 / 2 - w / 2), y: rowY - 31, w, h: 40 };
  });
}

function listRects(x, y, count, rowH = 32, w = 320) {
  return Array.from({ length: count }, (_, index) => ({ x: x - 46, y: y - 24 + index * rowH, w, h: rowH }));
}

function npcDialogueOptionRects(count) {
  return Array.from({ length: count }, (_, index) => ({
    x: NPC_DIALOGUE_ROWS.x,
    y: NPC_DIALOGUE_ROWS.y + index * NPC_DIALOGUE_ROWS.rowH,
    w: NPC_DIALOGUE_ROWS.w,
    h: NPC_DIALOGUE_ROWS.h
  }));
}

function fieldMenuRects() {
  return listRects(150, 162, FIELD_MENU_ITEMS.length, 44, 380);
}

function harvestOptionRects() {
  return HARVEST_OPTION_KEYS.map((key, index) => ({ x: 48, y: 272 + index * 70, w: 590, h: 66 }));
}

function harvestResolveRect() {
  return { x: 690, y: 508, w: 178, h: 42 };
}

function inventoryRows() {
  return Object.entries(state.inventory)
    .filter(([, count]) => count > 0)
    .map(([id], index) => ({ id, rect: { x: 140, y: 150 + index * 48, w: 430, h: 44 } }));
}

function liveQuestIds() {
  return data.quests.filter((quest) => state.quests[quest.id]).map((quest) => quest.id);
}

function questRows() {
  return liveQuestIds().map((id, index) => ({ id, rect: { x: 120, y: 148 + index * 72, w: 250, h: 62 } }));
}

function settingsRowCount() {
  return AUDIO_SETTING_ROWS.length + 1;
}

function settingRowForIndex(index) {
  if (index < AUDIO_SETTING_ROWS.length) return { type: "audio", ...AUDIO_SETTING_ROWS[index] };
  if (index === AUDIO_SETTING_ROWS.length) return { type: "partyDisplay" };
  return null;
}

function settingsRowRects() {
  const audioRows = AUDIO_SETTING_ROWS.map((row, index) => {
    const y = 196 + index * 58;
    return { type: "audio", key: row.key, x: 130, y: y - 30, w: 555, h: 46, meter: { x: 292, y: y - 19, w: 280, h: 24 } };
  });
  return [...audioRows, { type: "partyDisplay", x: 130, y: 390, w: 660, h: 72 }];
}

function partyDisplayOptionRects() {
  return PARTY_DISPLAY_OPTIONS.map((option, index) => ({ x: 336 + index * 188, y: 398, w: 176, h: 38 }));
}

function partyCardRects() {
  return state.partyOrder.map((id, index) => ({ id, x: PARTY_CARD_X + index * PARTY_CARD_GAP, y: PARTY_CARD_Y, w: PARTY_CARD_W, h: PARTY_CARD_H }));
}

function partyPortraitRects() {
  return partyCardRects().map((rect) => ({ id: rect.id, x: rect.x + 18, y: rect.y + 30, w: rect.w - 36, h: 166 }));
}

function partyDropIndex(x) {
  const rects = partyCardRects();
  const centers = rects.map((rect) => rect.x + rect.w / 2);
  let nearest = 0;
  let best = Infinity;
  centers.forEach((center, index) => {
    const distance = Math.abs(x - center);
    if (distance < best) {
      best = distance;
      nearest = index;
    }
  });
  return nearest;
}

function shopRowRects(shop) {
  return shop.items.map((row, index) => ({ x: 104, y: 178 + index * 55, w: 630, h: 48 }));
}

function combatMenuItems(c, actor, live) {
  if (c.menu === "root") return COMBAT_ROOT_ITEMS;
  if (c.menu === "skills") return actor.skills.concat(live.ult >= 100 ? [actor.ultimate] : []);
  if (c.menu === "items") return Object.keys(state.inventory).filter((id) => state.inventory[id] > 0 && data.itemById[id].usable?.includes("battle"));
  return [];
}

function routeInputCue(action) {
  if (state.mode === "title") {
    if (["up", "down"].includes(action)) audio.playCue("menuMove");
    if (action === "confirm") audio.playCue("confirm");
    return;
  }
  if (state.mode === "world" && ["menu", "inventory", "party", "quests", "journal", "cancel"].includes(action)) {
    audio.playCue("confirm");
    return;
  }
  if (!["menu", "inventory", "party", "quests", "journal", "shop", "settings", "combat", "combat-summary", "harvest", "dialogue"].includes(state.mode)) return;
  if (["up", "down", "left", "right"].includes(action)) audio.playCue("menuMove");
  if (action === "confirm") audio.playCue("confirm");
  if (action === "cancel") audio.playCue("cancel");
}
