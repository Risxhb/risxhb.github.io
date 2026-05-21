import { createMoonrootDungeonMaps, TRAP_TYPES } from "./dungeon.js";

const JSON_FILES = [
  "data/asset_manifest.json",
  "data/actors.json",
  "data/skills.json",
  "data/items.json",
  "data/loot.json",
  "data/journal.json",
  "data/shops.json",
  "data/quests.json",
  "data/npc-scripts.json",
  "data/maps/emberleaf_trail.json",
  "data/maps/brindlemarket_village.json",
  "data/maps/moonroot_hollow.json"
];

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

export async function loadGameData() {
  const loaded = await Promise.all(
    JSON_FILES.map(async (path) => {
      const response = await fetch(path);
      if (!response.ok) throw new Error(`Could not load ${path}`);
      return [path, await response.json()];
    })
  );
  const byPath = Object.fromEntries(loaded);
  const moonrootDungeonMaps = createMoonrootDungeonMaps();
  const data = {
    assets: byPath["data/asset_manifest.json"],
    actors: byPath["data/actors.json"],
    skills: byPath["data/skills.json"].skills,
    items: byPath["data/items.json"].items,
    loot: byPath["data/loot.json"],
    journal: byPath["data/journal.json"],
    shops: byPath["data/shops.json"].shops,
    quests: byPath["data/quests.json"].quests,
    scripts: byPath["data/npc-scripts.json"].scripts,
    npcDialogues: byPath["data/npc-scripts.json"].npcDialogues ?? {},
    trapByType: TRAP_TYPES,
    maps: {
      emberleaf_trail: byPath["data/maps/emberleaf_trail.json"],
      brindlemarket_village: byPath["data/maps/brindlemarket_village.json"],
      ...moonrootDungeonMaps
    }
  };
  validateData(data);
  return indexData(data);
}

function indexData(data) {
  data.partyById = Object.fromEntries(data.actors.party.map((actor) => [actor.id, actor]));
  data.enemyById = Object.fromEntries(data.actors.enemies.map((actor) => [actor.id, actor]));
  data.skillById = Object.fromEntries(data.skills.map((skill) => [skill.id, skill]));
  data.itemById = Object.fromEntries(data.items.map((item) => [item.id, item]));
  data.harvestProfileByEnemyId = Object.fromEntries((data.loot.harvestProfiles ?? []).map((profile) => [profile.enemyId, profile]));
  data.shopById = Object.fromEntries(data.shops.map((shop) => [shop.id, shop]));
  data.questById = Object.fromEntries(data.quests.map((quest) => [quest.id, quest]));
  data.journalSectionById = Object.fromEntries((data.journal.sections ?? []).map((section) => [section.id, section]));
  data.journalEntryById = Object.fromEntries((data.journal.sections ?? []).flatMap((section) => (section.entries ?? []).map((entry) => [entry.id, entry])));
  data.trapByType = TRAP_TYPES;
  return data;
}

export function validateData(data) {
  const errors = [];
  const assetIds = new Set();
  for (const id of Object.keys(data.assets.images ?? {})) assetIds.add(id);
  for (const atlas of Object.values(data.assets.atlases)) {
    for (const id of Object.keys(atlas.regions)) assetIds.add(id);
  }
  const skillIds = new Set(data.skills.map((skill) => skill.id));
  const itemIds = new Set(data.items.map((item) => item.id));
  const enemyIds = new Set(data.actors.enemies.map((enemy) => enemy.id));
  const shopIds = new Set(data.shops.map((shop) => shop.id));
  const questIds = new Set(data.quests.map((quest) => quest.id));
  const scriptIds = new Set(Object.keys(data.scripts ?? {}));
  const mapIds = new Set(Object.keys(data.maps ?? {}));
  const mapNpcIds = new Set(Object.values(data.maps ?? {}).flatMap((map) => (map.npcs ?? []).map((npc) => npc.id)));
  const npcScriptIds = new Set();
  const supportedDamageTypes = new Set(data.loot.supportedDamageTypes ?? []);
  const harvestOptionKeys = ["trophy", "meat", "pouch", "gear"];

  for (const actor of data.actors.party) {
    if (!assetIds.has(actor.asset)) errors.push(`Missing party asset ${actor.asset}`);
    if (actor.sprites?.move) {
      const move = data.assets.images?.[actor.sprites.move];
      if (!assetIds.has(actor.sprites.move)) errors.push(`Missing movement sprite ${actor.sprites.move}`);
      if (move?.kind !== "spritesheet") errors.push(`${actor.sprites.move} must be a spritesheet`);
      if (!isSupportedPartyMovementFormat(move?.animation)) errors.push(`${actor.sprites.move} must use a supported party movement format`);
      for (const dir of requiredPartyMovementRows(move?.animation)) {
        if (!Number.isInteger(move?.animation?.rows?.[dir])) errors.push(`${actor.sprites.move} missing ${dir} row`);
      }
    }
    if (actor.sprites?.side_walk) errors.push(`${actor.id} uses unsupported side_walk override; use one movement sheet with direction rows`);
    if (actor.sprites?.idle) {
      const idle = data.assets.images?.[actor.sprites.idle];
      if (!assetIds.has(actor.sprites.idle)) errors.push(`Missing idle sprite ${actor.sprites.idle}`);
      if (idle?.kind !== "spritesheet") errors.push(`${actor.sprites.idle} must be a spritesheet`);
      if (!isSupportedPartyMovementFormat(idle?.animation)) errors.push(`${actor.sprites.idle} must use a supported party movement format`);
      for (const dir of requiredPartyMovementRows(idle?.animation)) {
        if (!Number.isInteger(idle?.animation?.rows?.[dir])) errors.push(`${actor.sprites.idle} missing ${dir} row`);
      }
    }
    if (!assetIds.has(actor.portrait)) errors.push(`Missing portrait ${actor.portrait}`);
    if (actor.profile && !assetIds.has(actor.profile)) errors.push(`Missing profile ${actor.profile}`);
    if (actor.skills.length !== 3) errors.push(`${actor.name} must have exactly 3 skills`);
    for (const skill of actor.skills.concat(actor.ultimate)) {
      if (!skillIds.has(skill)) errors.push(`Missing skill ${skill}`);
    }
  }
  if (data.actors.party.length !== 4) errors.push("Party must have exactly 4 characters");
  const nia = data.actors.party.find((actor) => actor.id === "nia");
  if (!nia || nia.class !== "Thief") errors.push("Nia must be the Thief cat girl");

  for (const item of data.items) {
    if (!assetIds.has(item.icon)) errors.push(`Missing item icon ${item.icon}`);
  }
  for (const shop of data.shops) {
    for (const row of shop.items) if (!itemIds.has(row.id)) errors.push(`Shop ${shop.id} missing item ${row.id}`);
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
  validateJournal(data, errors, { assetIds, enemyIds, itemIds, mapIds, mapNpcIds });
  for (const [scriptId, actions] of Object.entries(data.scripts ?? {})) {
    if (!Array.isArray(actions) || !actions.length) errors.push(`Script ${scriptId} is empty`);
    for (const action of actions ?? []) {
      if (action.kind === "openShop" && !shopIds.has(action.shop)) errors.push(`Script ${scriptId} missing shop ${action.shop}`);
      if ((action.kind === "startQuest" || action.kind === "advanceQuest" || action.kind === "completeQuest" || action.kind === "completeQuestIfStage") && !questIds.has(action.quest)) errors.push(`Script ${scriptId} missing quest ${action.quest}`);
      if ((action.kind === "giveItem" || action.kind === "takeItem") && !itemIds.has(action.item)) errors.push(`Script ${scriptId} missing item ${action.item}`);
      if (action.kind === "transferMap" && !mapIds.has(action.map)) errors.push(`Script ${scriptId} missing map ${action.map}`);
    }
  }
  for (const map of Object.values(data.maps)) {
    for (const row of map.tiles ?? []) {
      for (const tile of row) if (!assetIds.has(tile)) errors.push(`Map ${map.id} missing grid tile ${tile}`);
    }
    for (const fill of map.fills ?? []) {
      if (!assetIds.has(fill.tile)) errors.push(`Map ${map.id} missing fill tile ${fill.tile}`);
      const tile = data.assets.images?.[fill.tile];
      if (tile?.animation && (tile.animation.frame_width !== map.tileSize || tile.animation.frame_height !== map.tileSize)) errors.push(`Map ${map.id} animated fill ${fill.tile} must match tile size`);
    }
    for (const [baseTile, variants] of Object.entries(map.tileVariants ?? {})) {
      if (!assetIds.has(baseTile)) errors.push(`Map ${map.id} variants missing base tile ${baseTile}`);
      for (const variant of variants) if (!assetIds.has(variant.tile)) errors.push(`Map ${map.id} missing tile variant ${variant.tile}`);
    }
    for (const building of map.buildings ?? []) {
      if (!building.id) errors.push(`Map ${map.id} has building without id`);
      for (const key of ["rect", "entry", "interiorRect"]) {
        if (building[key] && (!Array.isArray(building[key]) || building[key].length !== (key === "entry" ? 2 : 4))) errors.push(`Map ${map.id} building ${building.id} has bad ${key}`);
      }
      if (!assetIds.has(building.roofAsset)) errors.push(`Map ${map.id} building ${building.id} missing roof ${building.roofAsset}`);
      if (!assetIds.has(building.interiorAsset)) errors.push(`Map ${map.id} building ${building.id} missing interior ${building.interiorAsset}`);
      if (building.signAsset && !assetIds.has(building.signAsset)) errors.push(`Map ${map.id} building ${building.id} missing sign ${building.signAsset}`);
    }
    for (const prop of map.props ?? []) {
      if (!assetIds.has(prop.asset)) errors.push(`Map ${map.id} missing prop ${prop.asset}`);
      if (data.assets.images?.[prop.asset]?.animation && (!Number.isFinite(prop.drawW) || !Number.isFinite(prop.drawH))) errors.push(`Map ${map.id} animated prop ${prop.id} needs draw size`);
      if (prop.light) {
        if (!Number.isFinite(prop.light.radius) || prop.light.radius <= 0) errors.push(`Map ${map.id} prop ${prop.id} light radius must be > 0`);
        if (prop.light.intensity != null && (prop.light.intensity < 0 || prop.light.intensity > 1)) errors.push(`Map ${map.id} prop ${prop.id} light intensity must be between 0 and 1`);
        if (prop.light.color != null && typeof prop.light.color !== "string") errors.push(`Map ${map.id} prop ${prop.id} light color must be a string`);
      }
    }
    if (map.ambience) {
      if (typeof map.ambience.id !== "string") errors.push(`Map ${map.id} ambience id must be a string`);
      if (map.ambience.visual?.darkness != null && (map.ambience.visual.darkness < 0 || map.ambience.visual.darkness > 0.85)) errors.push(`Map ${map.id} ambience darkness must be between 0 and 0.85`);
      if (map.ambience.visual?.playerLightRadius != null && map.ambience.visual.playerLightRadius < 0) errors.push(`Map ${map.id} ambience playerLightRadius must be >= 0`);
      if (map.ambience.audio?.intensity != null && (map.ambience.audio.intensity < 0 || map.ambience.audio.intensity > 1)) errors.push(`Map ${map.id} ambience audio intensity must be between 0 and 1`);
    }
    for (const key of ["battleBackdrops", "bossBattleBackdrops"]) {
      if (map[key] && (!Array.isArray(map[key]) || !map[key].length)) errors.push(`Map ${map.id} ${key} must be a non-empty array`);
      for (const backdrop of map[key] ?? []) if (!assetIds.has(backdrop)) errors.push(`Map ${map.id} missing battle backdrop ${backdrop}`);
    }
    for (const overlay of map.overlays ?? []) {
      if (!assetIds.has(overlay.asset)) errors.push(`Map ${map.id} missing overlay ${overlay.asset}`);
    }
    for (const npc of map.npcs ?? []) {
      if (!data.scripts[npc.script]) errors.push(`NPC ${npc.id} missing script ${npc.script}`);
      npcScriptIds.add(npc.script);
      for (const script of Object.values(npc.afterFlagScript ?? {})) {
        if (!scriptIds.has(script)) errors.push(`NPC ${npc.id} afterFlagScript missing script ${script}`);
        npcScriptIds.add(script);
      }
    }
    for (const encounter of map.encounters ?? []) {
      for (const enemy of encounter.enemies) if (!enemyIds.has(enemy)) errors.push(`Encounter ${encounter.id} missing enemy ${enemy}`);
    }
  }
  for (const [npcId, sprites] of Object.entries(data.assets.npc_sprites ?? {})) {
    if (sprites.idle && !assetIds.has(sprites.idle)) errors.push(`NPC ${npcId} missing idle sprite ${sprites.idle}`);
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
  if (errors.length) throw new Error(errors.join("\n"));
}

function validateJournal(data, errors, refs) {
  const { assetIds, enemyIds, itemIds, mapIds, mapNpcIds } = refs;
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
      if (entry.trapType && !TRAP_TYPES[entry.trapType]) errors.push(`Journal entry ${entry.id} missing trap type ${entry.trapType}`);
      if (entry.enemyId && !enemyIds.has(entry.enemyId)) errors.push(`Journal entry ${entry.id} missing enemy ${entry.enemyId}`);
      for (const enemyId of entry.enemyIds ?? []) if (!enemyIds.has(enemyId)) errors.push(`Journal entry ${entry.id} missing family enemy ${enemyId}`);
      for (const itemId of entry.itemIds ?? []) if (!itemIds.has(itemId)) errors.push(`Journal entry ${entry.id} missing item ${itemId}`);
    }
  }
}
