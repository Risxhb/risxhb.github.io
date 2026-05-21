import fs from "node:fs";
import path from "node:path";
import { createMoonrootDungeonMaps } from "../src/dungeon.js";

const root = path.resolve(import.meta.dirname, "..");
const read = (file) => JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
const data = {
  assets: read("data/asset_manifest.json"),
  actors: read("data/actors.json"),
  skills: read("data/skills.json").skills,
  items: read("data/items.json").items,
  loot: read("data/loot.json"),
  journal: read("data/journal.json"),
  shops: read("data/shops.json").shops,
  quests: read("data/quests.json").quests,
  scripts: read("data/npc-scripts.json").scripts,
  npcDialogues: read("data/npc-scripts.json").npcDialogues ?? {},
  maps: [
    read("data/maps/emberleaf_trail.json"),
    read("data/maps/brindlemarket_village.json"),
    ...Object.values(createMoonrootDungeonMaps())
  ]
};

const errors = [];
const ids = (items) => new Set(items.map((item) => item.id));
const assetIds = new Set();

function isSupportedPartyMovementFormat(animation) {
  const frames = animation?.frames;
  return (
    (animation?.frame_width === 64 && animation?.frame_height === 64 && animation?.frames === 4) ||
    (animation?.frame_width === 96 && animation?.frame_height === 128 && Number.isInteger(frames) && frames >= 4 && frames <= 8) ||
    (animation?.frame_width === 192 && animation?.frame_height === 256 && frames === 8)
  );
}

const CARDINAL_DIRECTIONS = ["down", "left", "right", "up"];
const EIGHT_WAY_DIRECTIONS = ["down", "down-right", "right", "up-right", "up", "up-left", "left", "down-left"];

function requiredPartyMovementRows(animation) {
  const rows = animation?.rows ?? {};
  const hasDiagonalRows = EIGHT_WAY_DIRECTIONS.some((dir) => dir.includes("-") && Number.isInteger(rows[dir]));
  return hasDiagonalRows ? EIGHT_WAY_DIRECTIONS : CARDINAL_DIRECTIONS;
}

for (const [id, asset] of Object.entries(data.assets.images ?? {})) {
  assetIds.add(id);
  const assetPath = path.join(root, asset.path);
  if (!fs.existsSync(assetPath)) errors.push(`Missing image file: ${asset.path}`);
  if (!Number.isFinite(asset.width) || asset.width <= 0) errors.push(`Bad image width for ${id}`);
  if (!Number.isFinite(asset.height) || asset.height <= 0) errors.push(`Bad image height for ${id}`);
  if (asset.animation) {
    if (asset.kind !== "spritesheet") errors.push(`Animated image ${id} must be a spritesheet`);
    if (!Number.isFinite(asset.animation.frame_width) || asset.animation.frame_width <= 0) errors.push(`Bad animation frame width for ${id}`);
    if (!Number.isFinite(asset.animation.frame_height) || asset.animation.frame_height <= 0) errors.push(`Bad animation frame height for ${id}`);
    if (!Number.isFinite(asset.animation.frames) || asset.animation.frames <= 0) errors.push(`Bad animation frame count for ${id}`);
    if (!Number.isFinite(asset.animation.fps) || asset.animation.fps <= 0) errors.push(`Bad animation fps for ${id}`);
    if (asset.width % asset.animation.frame_width !== 0) errors.push(`Animation width does not fit frames for ${id}`);
    if (asset.height % asset.animation.frame_height !== 0) errors.push(`Animation height does not fit frames for ${id}`);
    if (id.startsWith("tile.") && !id.startsWith("tile.moonroot.") && (asset.animation.frame_width !== 32 || asset.animation.frame_height !== 32)) errors.push(`Animated tile ${id} must use 32x32 frames`);
    if (id.startsWith("prop.tutorial.tree") && (asset.animation.frame_width !== 128 || asset.animation.frame_height !== 128)) errors.push(`Animated tree ${id} must use 128x128 frames`);
  }
  if ((asset.edge_alpha_pixels ?? 0) > 0) errors.push(`Standalone image touches crop edge: ${id}`);
}
for (const atlas of Object.values(data.assets.atlases)) {
  const atlasPath = path.join(root, atlas.path);
  if (!fs.existsSync(atlasPath)) errors.push(`Missing atlas file: ${atlas.path}`);
  for (const [id, region] of Object.entries(atlas.regions)) {
    assetIds.add(id);
    for (const key of ["x", "y", "w", "h"]) {
      if (!Number.isFinite(region[key]) || region[key] < 0) errors.push(`Bad region ${id}.${key}`);
    }
  }
}

const skillIds = ids(data.skills);
const itemIds = ids(data.items);
const enemyIds = ids(data.actors.enemies);
const shopIds = ids(data.shops);
const questIds = ids(data.quests);
const mapIds = ids(data.maps);
const mapNpcIds = new Set(data.maps.flatMap((map) => (map.npcs ?? []).map((npc) => npc.id)));
const scriptIds = new Set(Object.keys(data.scripts ?? {}));
const npcScriptIds = new Set();
const supportedDamageTypes = new Set(data.loot.supportedDamageTypes ?? []);
const harvestOptionKeys = ["trophy", "meat", "pouch", "gear"];

if (data.actors.party.length !== 4) errors.push("Party must have exactly four characters");
const nia = data.actors.party.find((actor) => actor.id === "nia");
if (!nia || nia.class !== "Thief" || !/cat girl/i.test(nia.lore)) errors.push("Nia must be the Thief cat girl");

for (const actor of data.actors.party) {
  if (!assetIds.has(actor.asset)) errors.push(`Missing actor asset: ${actor.asset}`);
  if (actor.sprites?.move) {
    const move = data.assets.images?.[actor.sprites.move];
    if (!assetIds.has(actor.sprites.move)) errors.push(`Missing actor movement sprite: ${actor.sprites.move}`);
    if (move?.kind !== "spritesheet") errors.push(`${actor.sprites.move} must be a spritesheet`);
    if (!isSupportedPartyMovementFormat(move?.animation)) errors.push(`${actor.sprites.move} must use a supported party movement format`);
    for (const dir of requiredPartyMovementRows(move?.animation)) {
      if (!Number.isInteger(move?.animation?.rows?.[dir])) errors.push(`${actor.sprites.move} missing ${dir} row metadata`);
    }
  }
  if (actor.sprites?.side_walk) errors.push(`${actor.id} uses unsupported side_walk override; use one movement sheet with direction rows`);
  if (actor.sprites?.idle) {
    const idle = data.assets.images?.[actor.sprites.idle];
    if (!assetIds.has(actor.sprites.idle)) errors.push(`Missing actor idle sprite: ${actor.sprites.idle}`);
    if (idle?.kind !== "spritesheet") errors.push(`${actor.sprites.idle} must be a spritesheet`);
    if (!isSupportedPartyMovementFormat(idle?.animation)) errors.push(`${actor.sprites.idle} must use a supported party movement format`);
    for (const dir of requiredPartyMovementRows(idle?.animation)) {
      if (!Number.isInteger(idle?.animation?.rows?.[dir])) errors.push(`${actor.sprites.idle} missing ${dir} row metadata`);
    }
  }
  if (!assetIds.has(actor.portrait)) errors.push(`Missing portrait asset: ${actor.portrait}`);
  if (actor.profile && !assetIds.has(actor.profile)) errors.push(`Missing profile asset: ${actor.profile}`);
  if (!assetIds.has(actor.card)) errors.push(`Missing card asset: ${actor.card}`);
  if (actor.skills.length !== 3) errors.push(`${actor.id} must have exactly 3 skills`);
  for (const skill of actor.skills) if (!skillIds.has(skill)) errors.push(`Missing skill ${skill}`);
  if (!skillIds.has(actor.ultimate)) errors.push(`Missing ultimate ${actor.ultimate}`);
}

for (const enemy of data.actors.enemies) {
  if (!assetIds.has(enemy.asset)) errors.push(`Missing enemy asset: ${enemy.asset}`);
}

for (const item of data.items) {
  if (!assetIds.has(item.icon)) errors.push(`Missing item icon: ${item.icon}`);
}

for (const shop of data.shops) {
  for (const row of shop.items) if (!itemIds.has(row.id)) errors.push(`Shop ${shop.id} references ${row.id}`);
}

for (const quest of data.quests) {
  if (quest.description != null && typeof quest.description !== "string") errors.push(`Quest ${quest.id} description must be a string`);
  if (quest.objectives != null) {
    if (!Array.isArray(quest.objectives)) errors.push(`Quest ${quest.id} objectives must be an array`);
    else if (quest.objectives.length !== quest.stages.length) errors.push(`Quest ${quest.id} objectives must match stages length`);
    for (const [index, objective] of (quest.objectives ?? []).entries()) {
      if (typeof objective?.text !== "string" || !objective.text.trim()) errors.push(`Quest ${quest.id} objective ${index} needs text`);
      if (objective?.completeText != null && typeof objective.completeText !== "string") errors.push(`Quest ${quest.id} objective ${index} completeText must be a string`);
    }
  }
  for (const reward of quest.rewards?.items ?? []) {
    if (!itemIds.has(reward.id)) errors.push(`Quest ${quest.id} rewards missing item ${reward.id}`);
  }
}

for (const profile of data.loot.harvestProfiles ?? []) {
  if (!enemyIds.has(profile.enemyId)) errors.push(`Harvest profile missing enemy ${profile.enemyId}`);
  if (!Number.isInteger(profile.harvestChoices) || profile.harvestChoices < 1) errors.push(`Harvest profile ${profile.enemyId} has bad harvestChoices`);
  for (const key of harvestOptionKeys) {
    const option = profile.harvestOptions?.[key];
    if (!option) {
      errors.push(`Harvest profile ${profile.enemyId} missing ${key}`);
      continue;
    }
    for (const itemId of [...(option.common ?? []), ...(option.rare ?? [])]) {
      if (!itemIds.has(itemId)) errors.push(`Harvest profile ${profile.enemyId}.${key} missing item ${itemId}`);
    }
    for (const [damageType, itemList] of Object.entries(option.byKillingDamageType ?? {})) {
      if (!supportedDamageTypes.has(damageType)) errors.push(`Harvest profile ${profile.enemyId}.${key} has bad damage type ${damageType}`);
      for (const itemId of itemList) if (!itemIds.has(itemId)) errors.push(`Harvest profile ${profile.enemyId}.${key} missing item ${itemId}`);
    }
  }
}

for (const reaction of data.loot.reactions ?? []) {
  if (!reaction.id) errors.push("Loot reaction missing id");
  for (const itemId of reaction.itemIds ?? []) if (!itemIds.has(itemId)) errors.push(`Loot reaction ${reaction.id} missing item ${itemId}`);
}

validateJournal();

for (const [scriptId, actions] of Object.entries(data.scripts)) {
  if (!Array.isArray(actions) || !actions.length) errors.push(`Script ${scriptId} is empty`);
  for (const action of actions) {
    if (action.kind === "openShop" && !shopIds.has(action.shop)) errors.push(`Script ${scriptId} missing shop ${action.shop}`);
    if ((action.kind === "startQuest" || action.kind === "advanceQuest" || action.kind === "completeQuest" || action.kind === "completeQuestIfStage") && !questIds.has(action.quest)) errors.push(`Script ${scriptId} missing quest ${action.quest}`);
    if ((action.kind === "giveItem" || action.kind === "takeItem") && !itemIds.has(action.item)) errors.push(`Script ${scriptId} missing item ${action.item}`);
    if (action.kind === "transferMap" && !mapIds.has(action.map)) errors.push(`Script ${scriptId} missing map ${action.map}`);
  }
}

for (const map of data.maps) {
    for (const row of map.tiles ?? []) {
      for (const tile of row) if (!assetIds.has(tile)) errors.push(`Map ${map.id} missing grid tile ${tile}`);
    }
    for (const fill of map.fills ?? []) {
      if (!assetIds.has(fill.tile)) errors.push(`Map ${map.id} missing tile ${fill.tile}`);
      const tileAsset = data.assets.images?.[fill.tile];
      if (tileAsset?.animation && (tileAsset.animation.frame_width !== map.tileSize || tileAsset.animation.frame_height !== map.tileSize)) errors.push(`Map ${map.id} animated fill ${fill.tile} must match tile size`);
    }
    for (const [baseTile, variants] of Object.entries(map.tileVariants ?? {})) {
      if (!assetIds.has(baseTile)) errors.push(`Map ${map.id} variants missing base tile ${baseTile}`);
      for (const variant of variants) {
        if (!assetIds.has(variant.tile)) errors.push(`Map ${map.id} missing tile variant ${variant.tile}`);
        if (!Number.isFinite(variant.weight) || variant.weight <= 0) errors.push(`Map ${map.id} has bad tile variant weight for ${variant.tile}`);
      }
    }
  for (const building of map.buildings ?? []) {
    if (!building.id) errors.push(`Map ${map.id} has building without id`);
    for (const key of ["rect", "interiorRect"]) {
      if (!Array.isArray(building[key]) || building[key].length !== 4 || building[key].some((value) => !Number.isInteger(value))) {
        errors.push(`Map ${map.id} building ${building.id} has bad ${key}`);
      }
    }
    if (!Array.isArray(building.entry) || building.entry.length !== 2 || building.entry.some((value) => !Number.isInteger(value))) {
      errors.push(`Map ${map.id} building ${building.id} has bad entry`);
    }
    if (!assetIds.has(building.roofAsset)) errors.push(`Map ${map.id} building ${building.id} missing roof ${building.roofAsset}`);
    if (!assetIds.has(building.interiorAsset)) errors.push(`Map ${map.id} building ${building.id} missing interior ${building.interiorAsset}`);
    if (building.signAsset && !assetIds.has(building.signAsset)) errors.push(`Map ${map.id} building ${building.id} missing sign ${building.signAsset}`);
  }
  for (const prop of map.props ?? []) {
    if (!assetIds.has(prop.asset)) errors.push(`Map ${map.id} missing prop ${prop.asset}`);
    if (data.assets.images?.[prop.asset]?.animation && (!Number.isFinite(prop.drawW) || !Number.isFinite(prop.drawH) || !Number.isFinite(prop.anchorY))) errors.push(`Map ${map.id} animated prop ${prop.id} needs drawW, drawH, and anchorY`);
    if (prop.pickup && !itemIds.has(prop.pickup)) errors.push(`Map ${map.id} pickup missing item ${prop.pickup}`);
    if (prop.script && !data.scripts[prop.script]) errors.push(`Map ${map.id} prop missing script ${prop.script}`);
    if (prop.light) {
      if (!Number.isFinite(prop.light.radius) || prop.light.radius <= 0) errors.push(`Map ${map.id} prop ${prop.id} light.radius must be > 0`);
      if (prop.light.intensity != null && (prop.light.intensity < 0 || prop.light.intensity > 1)) errors.push(`Map ${map.id} prop ${prop.id} light.intensity must be between 0 and 1`);
      if (prop.light.color != null && typeof prop.light.color !== "string") errors.push(`Map ${map.id} prop ${prop.id} light.color must be a string`);
    }
  }
  if (map.ambience) {
    if (typeof map.ambience.id !== "string") errors.push(`Map ${map.id} ambience.id must be a string`);
    if (map.ambience.visual?.darkness != null && (map.ambience.visual.darkness < 0 || map.ambience.visual.darkness > 0.85)) errors.push(`Map ${map.id} ambience.visual.darkness must be between 0 and 0.85`);
    if (map.ambience.visual?.playerLightRadius != null && map.ambience.visual.playerLightRadius < 0) errors.push(`Map ${map.id} ambience.visual.playerLightRadius must be >= 0`);
    if (map.ambience.audio?.intensity != null && (map.ambience.audio.intensity < 0 || map.ambience.audio.intensity > 1)) errors.push(`Map ${map.id} ambience.audio.intensity must be between 0 and 1`);
  }
  for (const key of ["battleBackdrops", "bossBattleBackdrops"]) {
    if (map[key] && (!Array.isArray(map[key]) || !map[key].length)) errors.push(`Map ${map.id} ${key} must be a non-empty array`);
    for (const backdrop of map[key] ?? []) if (!assetIds.has(backdrop)) errors.push(`Map ${map.id} missing battle backdrop ${backdrop}`);
  }
  for (const overlay of map.overlays ?? []) {
    if (!assetIds.has(overlay.asset)) errors.push(`Map ${map.id} missing overlay ${overlay.asset}`);
  }
  if (map.semanticTiles) {
    if (map.semanticTiles.length !== map.height) errors.push(`Map ${map.id} semanticTiles height mismatch`);
    for (const [y, row] of map.semanticTiles.entries()) {
      if (row.length !== map.width) errors.push(`Map ${map.id} semanticTiles row ${y} width mismatch`);
      for (const tile of row) {
        if (!["VOID", "FLOOR", "WALL", "DOOR_CLOSED", "DOOR_OPEN", "WATER", "PIT", "STAIRS_DOWN", "CHEST", "TRAP_SPIKES", "TRAP_GAS", "TRAP_FALSE_FLOOR"].includes(tile)) errors.push(`Map ${map.id} has bad semantic tile ${tile}`);
      }
    }
  }
  if (map.dungeonLayers) {
    for (const key of ["base", "details", "hazards", "wallSides", "wallTops", "sortables"]) {
      if (!Array.isArray(map.dungeonLayers[key])) errors.push(`Map ${map.id} dungeonLayers.${key} must be an array`);
      for (const drawable of map.dungeonLayers[key] ?? []) {
        if (!assetIds.has(drawable.asset)) errors.push(`Map ${map.id} missing dungeon layer asset ${drawable.asset}`);
        if (!Number.isFinite(drawable.x) || !Number.isFinite(drawable.y)) errors.push(`Map ${map.id} has bad dungeon layer coordinate ${drawable.id}`);
      }
    }
  }
  if (map.regionTiles) {
    if (map.regionTiles.length !== map.height) errors.push(`Map ${map.id} regionTiles height mismatch`);
    for (const [y, row] of map.regionTiles.entries()) if (row.length !== map.width) errors.push(`Map ${map.id} regionTiles row ${y} width mismatch`);
  }
  for (const [name, spawn] of Object.entries(map.spawns ?? {})) {
    if (spawn.x < 0 || spawn.y < 0 || spawn.x >= map.width || spawn.y >= map.height) errors.push(`Map ${map.id} spawn ${name} out of bounds`);
    if ((map.blockedTiles ?? []).some(([x, y]) => x === spawn.x && y === spawn.y)) errors.push(`Map ${map.id} spawn ${name} is blocked`);
  }
  for (const trap of map.traps ?? []) {
    if (!trap.id) errors.push(`Map ${map.id} has trap without id`);
    if (!["practice", "pitfall", "spikes", "darts", "poison", "alarm", "crumble", "teleport"].includes(trap.type)) errors.push(`Map ${map.id} has bad trap type ${trap.type}`);
  }
  for (const npc of map.npcs ?? []) {
    if (!assetIds.has(npc.asset)) errors.push(`Map ${map.id} missing npc asset ${npc.asset}`);
    if (!data.scripts[npc.script]) errors.push(`Map ${map.id} missing npc script ${npc.script}`);
    npcScriptIds.add(npc.script);
    for (const script of Object.values(npc.afterFlagScript ?? {})) {
      if (!scriptIds.has(script)) errors.push(`Map ${map.id} npc ${npc.id} afterFlagScript missing ${script}`);
      npcScriptIds.add(script);
    }
  }
  for (const encounter of map.encounters ?? []) {
    if (encounter.asset && !assetIds.has(encounter.asset)) errors.push(`Map ${map.id} missing encounter asset ${encounter.asset}`);
    for (const enemy of encounter.enemies) if (!enemyIds.has(enemy)) errors.push(`Map ${map.id} missing enemy ${enemy}`);
  }
  for (const exit of map.exits ?? []) if (!mapIds.has(exit.to)) errors.push(`Map ${map.id} exit missing target ${exit.to}`);
}

for (const [npcId, sprites] of Object.entries(data.assets.npc_sprites ?? {})) {
  if (sprites.idle && !assetIds.has(sprites.idle)) errors.push(`NPC ${npcId} missing idle sprite ${sprites.idle}`);
  const idle = data.assets.images?.[sprites.idle];
  if (idle && idle.kind !== "spritesheet") errors.push(`NPC ${npcId} idle sprite ${sprites.idle} must be a spritesheet`);
  const supportedIdle = idle?.animation?.frames === 4 && (
    (idle.animation.frame_width === 64 && idle.animation.frame_height === 64) ||
    (idle.animation.frame_width === 96 && idle.animation.frame_height === 128)
  );
  if (idle?.animation && !supportedIdle) {
    errors.push(`NPC ${npcId} idle sprite ${sprites.idle} must be a supported 4-frame idle sheet`);
  }
}

for (const scriptId of npcScriptIds) {
  if (!data.npcDialogues?.[scriptId]) errors.push(`NPC script ${scriptId} missing dialogue definition`);
}

for (const [scriptId, dialogue] of Object.entries(data.npcDialogues ?? {})) {
  if (!scriptIds.has(scriptId)) errors.push(`NPC dialogue ${scriptId} has no matching script`);
  if (typeof dialogue?.speaker !== "string" || !dialogue.speaker.trim()) errors.push(`NPC dialogue ${scriptId} needs speaker`);
  if (!Array.isArray(dialogue?.talk) || dialogue.talk.length !== 5) errors.push(`NPC dialogue ${scriptId} needs exactly 5 talk lines`);
  for (const line of dialogue?.talk ?? []) if (typeof line !== "string" || !line.trim()) errors.push(`NPC dialogue ${scriptId} has empty talk line`);
  if (dialogue?.rumours?.placeholder !== true) errors.push(`NPC dialogue ${scriptId} rumours must be marked placeholder`);
  if (!Array.isArray(dialogue?.rumours?.lines) || !dialogue.rumours.lines.length) errors.push(`NPC dialogue ${scriptId} needs rumour placeholder lines`);
  for (const line of dialogue?.rumours?.lines ?? []) if (typeof line !== "string" || !line.trim()) errors.push(`NPC dialogue ${scriptId} has empty rumour line`);
  for (const option of dialogue?.questOptions ?? []) {
    if (!questIds.has(option.quest)) errors.push(`NPC dialogue ${scriptId} missing quest ${option.quest}`);
    if (!scriptIds.has(option.script)) errors.push(`NPC dialogue ${scriptId} quest option missing script ${option.script}`);
  }
  if (dialogue?.shopOption && !scriptIds.has(dialogue.shopOption.script)) errors.push(`NPC dialogue ${scriptId} shop option missing script ${dialogue.shopOption.script}`);
}

function validateJournal() {
  const sectionIds = new Set();
  const entryIds = new Set();
  if (!Array.isArray(data.journal?.sections) || !data.journal.sections.length) {
    errors.push("Journal must define sections");
    return;
  }
  for (const section of data.journal.sections) {
    if (!section.id || sectionIds.has(section.id)) errors.push(`Journal section has bad id ${section.id}`);
    sectionIds.add(section.id);
    if (typeof section.label !== "string" || !section.label.trim()) errors.push(`Journal section ${section.id} needs label`);
    if (!Array.isArray(section.entries) || !section.entries.length) errors.push(`Journal section ${section.id} needs entries`);
    for (const entry of section.entries ?? []) {
      if (!entry.id || entryIds.has(entry.id)) errors.push(`Journal entry has bad id ${entry.id}`);
      entryIds.add(entry.id);
      if (typeof entry.title !== "string" || !entry.title.trim()) errors.push(`Journal entry ${entry.id} needs title`);
      if (!assetIds.has(entry.art)) errors.push(`Journal entry ${entry.id} missing art ${entry.art}`);
      if (entry.mapId && !mapIds.has(entry.mapId)) errors.push(`Journal entry ${entry.id} missing map ${entry.mapId}`);
      if (entry.npcId && !mapNpcIds.has(entry.npcId)) errors.push(`Journal entry ${entry.id} missing NPC ${entry.npcId}`);
      if (entry.trapType && !["practice", "pitfall", "spikes", "darts", "poison", "alarm", "crumble", "teleport"].includes(entry.trapType)) errors.push(`Journal entry ${entry.id} missing trap type ${entry.trapType}`);
      if (entry.enemyId && !enemyIds.has(entry.enemyId)) errors.push(`Journal entry ${entry.id} missing enemy ${entry.enemyId}`);
      for (const enemyId of entry.enemyIds ?? []) if (!enemyIds.has(enemyId)) errors.push(`Journal entry ${entry.id} missing family enemy ${enemyId}`);
      for (const itemId of entry.itemIds ?? []) if (!itemIds.has(itemId)) errors.push(`Journal entry ${entry.id} missing item ${itemId}`);
    }
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log("Data validation ok");
