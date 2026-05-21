import { createAmbienceState, hydrateAmbienceState, serializeAmbienceState } from "./ambience.js";

const SAVE_KEY = "eve-rpg-save-v1";
export const CAMERA_ZOOM_MIN = 0.65;
export const CAMERA_ZOOM_MAX = 2;
export const CAMERA_ZOOM_DEFAULT = CAMERA_ZOOM_MIN;

export function createInitialState(data) {
  const party = data.actors.party.map((base) => ({
    id: base.id,
    hp: base.stats.hp,
    mp: base.stats.mp,
    ult: 0,
    level: base.level,
    xp: base.xp,
    status: []
  }));
  const start = startSpawn(data);
  const startDir = "up";
  return {
    mode: "title",
    title: { index: 0, elapsed: 0, message: "", messageTimer: 0 },
    mapId: "moonroot_hollow",
    player: { x: start.x, y: start.y, dir: startDir, stepTimer: 0 },
    followers: party.slice(1).map((member, index) => ({ id: member.id, x: start.x, y: start.y + (index + 1) * 0.8, dir: startDir, stepTimer: 0 })),
    leaderTrail: Array.from({ length: 240 }, (_, index) => ({ x: start.x, y: start.y + index * 0.25, dir: startDir })),
    partyOrder: party.map((member) => member.id),
    party,
    flags: {},
    quests: {},
    inventory: { potion: 2 },
    gold: 30,
    doorStates: {},
    npcStates: {},
    journal: createJournalState(),
    dungeon: {
      currentFloor: 0,
      deepestFloor: 0,
      floorSeed: Math.floor(Math.random() * 1000000),
      checkpointFloor: 1,
      unlockedCheckpoints: [],
      explored: {},
      currentRegion: {},
      mappedRegions: {}
    },
    dialogue: null,
    npcDialogue: null,
    menu: { index: 0, stack: [] },
    shop: null,
    combat: null,
    combatSummary: null,
    worldEffects: [],
    worldTextEffects: [],
    loot: { reactionFlags: {} },
    harvest: null,
    toast: "WASD move. Hold two directions to move diagonally.",
    toastTimer: 4,
    toastPriority: false,
    ambience: createAmbienceState(),
    cameraZoom: CAMERA_ZOOM_DEFAULT,
    insideTent: false,
    insideBuildingId: null,
    transition: null,
    pointerUi: { partyDrag: null }
  };
}

function startSpawn(data) {
  const map = data.maps?.moonroot_hollow;
  return map?.spawns?.guild_base ?? map?.spawns?.entrance ?? map?.spawn ?? { x: 12, y: 24 };
}

export function saveGame(state) {
  const snapshot = {
    mapId: state.mapId,
    player: state.player,
    followers: state.followers,
    partyOrder: state.partyOrder,
    party: state.party,
    flags: state.flags,
    quests: state.quests,
    inventory: state.inventory,
    gold: state.gold,
    loot: state.loot,
    journal: state.journal,
    dungeon: state.dungeon,
    ambience: serializeAmbienceState(state.ambience),
    cameraZoom: state.cameraZoom
  };
  localStorage.setItem(SAVE_KEY, JSON.stringify(snapshot));
}

export function loadGame(state, data = null) {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return false;
  const snapshot = JSON.parse(raw);
  Object.assign(state, snapshot);
  state.player.x = Number(state.player.x ?? 8);
  state.player.y = Number(state.player.y ?? 25);
  state.player.dir ??= "down";
  state.player.stepTimer = 0;
  state.cameraZoom = Math.max(CAMERA_ZOOM_MIN, Math.min(CAMERA_ZOOM_MAX, state.cameraZoom ?? CAMERA_ZOOM_DEFAULT));
  state.dungeon ??= {
    currentFloor: 0,
    deepestFloor: 0,
    floorSeed: Math.floor(Math.random() * 1000000),
    checkpointFloor: 1,
    unlockedCheckpoints: [],
    explored: {},
    currentRegion: {}
  };
  state.dungeon.explored ??= {};
  state.dungeon.currentRegion ??= {};
  state.dungeon.mappedRegions ??= {};
  state.ambience = hydrateAmbienceState(snapshot.ambience);
  state.insideTent = false;
  state.insideBuildingId = null;
  state.followers = (state.followers ?? []).map((follower) => ({
    ...follower,
    x: Number(follower.x ?? state.player.x),
    y: Number(follower.y ?? state.player.y),
    dir: follower.dir ?? state.player.dir,
    stepTimer: 0
  }));
  state.leaderTrail = (state.leaderTrail ?? []).map((point) => ({
    x: Number(point.x ?? state.player.x),
    y: Number(point.y ?? state.player.y),
    dir: point.dir ?? state.player.dir
  }));
  state.mode = "world";
  state.dialogue = null;
  state.npcDialogue = null;
  state.shop = null;
  state.combat = null;
  state.combatSummary = null;
  state.worldEffects = [];
  state.worldTextEffects = [];
  state.loot ??= { reactionFlags: {} };
  state.loot.reactionFlags ??= {};
  state.journal = hydrateJournalState(snapshot.journal);
  const currentFloor = data?.maps?.[state.mapId]?.dungeonFloor;
  if (currentFloor) state.journal.visitedFloors[String(currentFloor)] = true;
  state.harvest = null;
  state.transition = null;
  state.pointerUi = { partyDrag: null };
  state.doorStates = {};
  state.npcStates = {};
  sanitizeLoadedPosition(state, data);
  state.toast = "Save loaded.";
  state.toastTimer = 3;
  state.toastPriority = false;
  return true;
}

export function createJournalState() {
  return {
    seenNpcs: {},
    seenTrapTypes: {},
    triggeredTrapTypes: {},
    seenEnemies: {},
    defeatedEnemies: {},
    harvestedItemsByEnemy: {},
    visitedFloors: {}
  };
}

export function hydrateJournalState(journal) {
  const fresh = createJournalState();
  const source = journal && typeof journal === "object" ? journal : {};
  return {
    seenNpcs: objectRecord(source.seenNpcs),
    seenTrapTypes: objectRecord(source.seenTrapTypes),
    triggeredTrapTypes: objectRecord(source.triggeredTrapTypes),
    seenEnemies: objectRecord(source.seenEnemies),
    defeatedEnemies: objectRecord(source.defeatedEnemies),
    harvestedItemsByEnemy: Object.fromEntries(Object.entries(source.harvestedItemsByEnemy ?? {}).map(([enemyId, items]) => [enemyId, objectRecord(items)])),
    visitedFloors: objectRecord(source.visitedFloors ?? fresh.visitedFloors)
  };
}

function objectRecord(value) {
  if (Array.isArray(value)) return Object.fromEntries(value.map((id) => [id, true]));
  if (!value || typeof value !== "object") return {};
  return Object.fromEntries(Object.entries(value).filter(([, present]) => Boolean(present)));
}

function sanitizeLoadedPosition(state, data) {
  if (!data?.maps) return;
  let map = data.maps[state.mapId];
  if (!map) {
    state.mapId = "moonroot_hollow";
    map = data.maps[state.mapId];
  }
  if (!map?.dungeonFloor) return;
  const tile = { x: Math.round(state.player.x), y: Math.round(state.player.y) };
  if (isValidDungeonTile(map, tile.x, tile.y)) return;
  const spawn = map.spawn ?? startSpawn(data);
  state.player.x = spawn.x;
  state.player.y = spawn.y;
  resetLoadedPartyTrail(state, spawn.x, spawn.y);
}

function isValidDungeonTile(map, x, y) {
  if (!map || x < 0 || y < 0 || x >= map.width || y >= map.height) return false;
  if (map.blockedTiles?.some((tile) => tile[0] === x && tile[1] === y)) return false;
  if (map.regionTiles && !map.regionTiles[y]?.[x]) return false;
  return true;
}

function resetLoadedPartyTrail(state, x, y) {
  const dir = state.player.dir ?? "down";
  const order = state.partyOrder?.length ? state.partyOrder : state.party?.map((member) => member.id) ?? [];
  state.followers = order.slice(1).map((id) => ({ id, x, y, dir, stepTimer: 0 }));
  state.leaderTrail = Array.from({ length: 240 }, (_, index) => ({ x, y: y + index * 0.25, dir }));
}
