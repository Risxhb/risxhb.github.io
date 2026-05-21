import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const outPath = path.join(root, "data/maps/brindlemarket_village.json");

const blocked = [
  [0, 0, 80, 1],
  [0, 53, 80, 1],
  [0, 0, 1, 26],
  [0, 28, 1, 25],
  [79, 0, 1, 10],
  [79, 12, 1, 41],
  [38, 24, 4, 4]
];

const buildings = [];

function addBuilding(spec) {
  const [x, y, w, h] = spec.rect;
  const entry = spec.entry ?? [x + Math.floor(w / 2), y + h - 1];
  const building = {
    id: spec.id,
    name: spec.name,
    rect: spec.rect,
    entry,
    interiorRect: spec.interiorRect ?? [x + 1, y + 1, w - 2, h - 1],
    roofAsset: spec.roofAsset,
    interiorAsset: spec.interiorAsset,
    district: spec.district
  };
  buildings.push(building);

  blocked.push([x, y, w, 1], [x, y, 1, h], [x + w - 1, y, 1, h]);
  const leftBottom = entry[0] - x;
  const rightBottom = x + w - entry[0] - 1;
  if (leftBottom > 0) blocked.push([x, y + h - 1, leftBottom, 1]);
  if (rightBottom > 0) blocked.push([entry[0] + 1, y + h - 1, rightBottom, 1]);
  return building;
}

addBuilding({ id: "pippas-provisions", name: "Pippa's Provisions", rect: [20, 18, 6, 5], roofAsset: "village.roof.shop", interiorAsset: "village.interior.shop", district: "market" });
addBuilding({ id: "tovins-tools", name: "Tovin's Tools", rect: [52, 18, 6, 5], roofAsset: "village.roof.guild", interiorAsset: "village.interior.guild", district: "craft-row" });
addBuilding({ id: "lumas-hearth", name: "Luma's Hearth", rect: [18, 34, 6, 5], roofAsset: "village.roof.inn", interiorAsset: "village.interior.inn", district: "inn-row" });
addBuilding({ id: "elder-hall", name: "Elder Hall", rect: [44, 34, 6, 5], roofAsset: "village.roof.home", interiorAsset: "village.interior.home", district: "civic" });
addBuilding({ id: "moonroot-guild", name: "Moonroot Guildhall", rect: [62, 20, 6, 5], roofAsset: "village.roof.guild", interiorAsset: "village.interior.guild", district: "dungeon-gate" });
addBuilding({ id: "wayfarer-house", name: "Wayfarer's House", rect: [7, 18, 5, 5], roofAsset: "village.roof.home", interiorAsset: "village.interior.home", district: "residential-west" });
addBuilding({ id: "rootcutter-house", name: "Rootcutter House", rect: [7, 32, 5, 5], roofAsset: "village.roof.home", interiorAsset: "village.interior.home", district: "residential-west" });
addBuilding({ id: "ledger-house", name: "Ledger House", rect: [68, 20, 5, 5], roofAsset: "village.roof.home", interiorAsset: "village.interior.home", district: "dungeon-gate" });
addBuilding({ id: "delver-bunks", name: "Delver Bunks", rect: [68, 34, 5, 5], roofAsset: "village.roof.inn", interiorAsset: "village.interior.inn", district: "dungeon-gate" });
addBuilding({ id: "carpenter-yard", name: "Carpenter Yard", rect: [29, 8, 5, 5], roofAsset: "village.roof.shop", interiorAsset: "village.interior.shop", district: "craft-row" });
addBuilding({ id: "apothecary", name: "Moonroot Apothecary", rect: [45, 8, 5, 5], roofAsset: "village.roof.shop", interiorAsset: "village.interior.shop", district: "market" });
addBuilding({ id: "storehouse", name: "Expedition Storehouse", rect: [64, 8, 5, 5], roofAsset: "village.roof.home", interiorAsset: "village.interior.guild", district: "dungeon-gate" });
addBuilding({ id: "south-cottage-a", name: "South Cottage", rect: [29, 42, 5, 5], roofAsset: "village.roof.home", interiorAsset: "village.interior.home", district: "residential-south" });
addBuilding({ id: "south-cottage-b", name: "Weaver Cottage", rect: [45, 42, 5, 5], roofAsset: "village.roof.home", interiorAsset: "village.interior.home", district: "residential-south" });

const props = [
  { id: "fountain", asset: "village.fountain", x: 40, y: 27, drawW: 128, drawH: 128, anchorX: 48, anchorY: 96 },
  { id: "west_market_stall", asset: "village.market-stall", x: 31, y: 23, drawW: 92, drawH: 80, anchorY: 58 },
  { id: "east_market_stall", asset: "village.market-stall", x: 49, y: 23, drawW: 92, drawH: 80, anchorY: 58 },
  { id: "south_market_stall", asset: "village.market-stall", x: 33, y: 31, drawW: 88, drawH: 77, anchorY: 56 },
  { id: "guild_supplies", asset: "village.dungeon-supplies", x: 61, y: 27, drawW: 88, drawH: 76, anchorY: 54 },
  { id: "gate_supplies", asset: "village.dungeon-supplies", x: 73, y: 12, drawW: 84, drawH: 73, anchorY: 52 },
  { id: "notice_square", asset: "village.notice-board", x: 35, y: 24, drawW: 80, drawH: 70, anchorY: 52 },
  { id: "notice_gate", asset: "village.notice-board", x: 65, y: 14, drawW: 80, drawH: 70, anchorY: 52 },
  { id: "ore_bundle_gate", asset: "village.ore-bundle", x: 70, y: 13, drawW: 66, drawH: 66, anchorY: 46 },
  { id: "ore_bundle_guild", asset: "village.ore-bundle", x: 61, y: 24, drawW: 58, drawH: 58, anchorY: 42 },
  { id: "herbs_apothecary", asset: "village.herb-bundle", x: 46, y: 14, drawW: 54, drawH: 54, anchorY: 38 },
  { id: "herbs_market", asset: "village.herb-bundle", x: 29, y: 28, drawW: 54, drawH: 54, anchorY: 38 },
  { id: "bench_north", asset: "village.bench", x: 37, y: 22, drawW: 84, drawH: 48, anchorY: 30 },
  { id: "bench_south", asset: "village.bench", x: 44, y: 31, drawW: 84, drawH: 48, anchorY: 30 },
  { id: "west_lantern", asset: "village.lantern", x: 16, y: 26, drawW: 40, drawH: 60, anchorY: 44 },
  { id: "square_lantern_nw", asset: "village.lantern", x: 31, y: 21, drawW: 40, drawH: 60, anchorY: 44 },
  { id: "square_lantern_se", asset: "village.lantern", x: 49, y: 32, drawW: 40, drawH: 60, anchorY: 44 },
  { id: "gate_lantern", asset: "village.lantern", x: 76, y: 11, drawW: 40, drawH: 60, anchorY: 44 },
  { id: "guild_counter", asset: "prop.counter", x: 63, y: 23 },
  { id: "pippa_counter", asset: "prop.counter", x: 22, y: 21 },
  { id: "tovin_counter", asset: "prop.counter", x: 54, y: 21 },
  { id: "luma_chest", asset: "prop.chest", x: 21, y: 37 },
  { id: "elder_sign", asset: "prop.sign", x: 47, y: 39 },
  { id: "moon_gate_marker", asset: "prop.crystalBlue", x: 77, y: 10 }
];

const npcs = [
  { id: "elder_bram", name: "Elder Bram", asset: "actor.rowan", x: 47, y: 37, script: "elder-bram" },
  { id: "pippa", name: "Pippa", asset: "actor.elara", x: 23, y: 21, script: "pippa" },
  { id: "tovin", name: "Tovin", asset: "actor.rowan", x: 55, y: 21, script: "tovin" },
  { id: "luma", name: "Luma", asset: "actor.elara", x: 21, y: 37, script: "luma" },
  { id: "nia_npc", name: "Nia", asset: "actor.nia", x: 35, y: 30, script: "nia-rumor" },
  { id: "porter_moss", name: "Porter Moss", asset: "actor.cassian", x: 60, y: 26, script: "porter-moss" },
  { id: "wounded_delver", name: "Wounded Delver", asset: "actor.rowan", x: 64, y: 23, script: "wounded-delver" },
  { id: "fountain_runner", name: "Fountain Runner", asset: "actor.elara", x: 43, y: 25, script: "fountain-runner" },
  { id: "gate_guard", name: "Gate Guard", asset: "actor.cassian", x: 76, y: 10, script: "gate-guard" },
  { id: "supply_clerk", name: "Supply Clerk", asset: "actor.elara", x: 66, y: 11, script: "supply-clerk" },
  { id: "rumor_merchant", name: "Rumor Merchant", asset: "actor.rowan", x: 31, y: 28, script: "rumor-merchant" }
];

const map = {
  schema_version: 1,
  id: "brindlemarket_village",
  name: "Brindlemarket Village",
  tileSize: 32,
  width: 80,
  height: 54,
  defaultTile: "tile.grass",
  spawn: { x: 2, y: 26 },
  spawns: {
    west_gate: { x: 2, y: 26 },
    moon_gate_return: { x: 76, y: 12 },
    town_square: { x: 40, y: 30 }
  },
  fills: [
    { tile: "tile.path", rect: [0, 26, 80, 2] },
    { tile: "tile.path", rect: [12, 10, 2, 32] },
    { tile: "tile.path", rect: [38, 8, 2, 38] },
    { tile: "tile.path", rect: [58, 10, 2, 36] },
    { tile: "tile.path", rect: [18, 14, 42, 2] },
    { tile: "tile.path", rect: [18, 40, 42, 2] },
    { tile: "tile.path", rect: [58, 10, 22, 2] },
    { tile: "tile.stone", rect: [30, 20, 20, 14] },
    { tile: "tile.path", rect: [30, 26, 20, 2] },
    { tile: "tile.path", rect: [38, 20, 2, 14] },
    { tile: "tile.stone", rect: [18, 17, 10, 7] },
    { tile: "tile.stone", rect: [50, 17, 10, 7] },
    { tile: "tile.stone", rect: [16, 33, 10, 7] },
    { tile: "tile.stone", rect: [42, 33, 10, 7] },
    { tile: "tile.stone", rect: [60, 19, 14, 7] },
    { tile: "tile.stone", rect: [6, 17, 8, 7] },
    { tile: "tile.stone", rect: [6, 31, 8, 7] },
    { tile: "tile.stone", rect: [28, 7, 8, 7] },
    { tile: "tile.stone", rect: [44, 7, 8, 7] },
    { tile: "tile.stone", rect: [62, 7, 8, 7] },
    { tile: "tile.stone", rect: [28, 41, 8, 7] },
    { tile: "tile.stone", rect: [44, 41, 8, 7] },
    { tile: "tile.stone", rect: [66, 33, 8, 7] }
  ],
  blocked,
  buildings,
  props,
  npcs,
  encounters: [
    { id: "road_wisp", x: 72, y: 11, enemies: ["road-wisp", "bramble-rat"], flag: "village_road_won" }
  ],
  exits: [
    { x: 0, y: 26, to: "emberleaf_trail", spawn: "east_return" },
    { x: 0, y: 27, to: "emberleaf_trail", spawn: "east_return" },
    { x: 79, y: 10, to: "moonroot_hollow", spawn: "entrance", requires: "quest_q_moonroot_started" },
    { x: 79, y: 11, to: "moonroot_hollow", spawn: "entrance", requires: "quest_q_moonroot_started" }
  ],
  backdrop: "backdrop.village"
};

fs.writeFileSync(outPath, `${JSON.stringify(map, null, 2)}\n`);
