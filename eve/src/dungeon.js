export const MAX_DUNGEON_FLOOR = 100;
export const IMPLEMENTED_DUNGEON_FLOOR = 11;
export const DUNGEON_CHECKPOINT_FLOORS = [25, 50, 75];

const TRAP_EFFECT_DURATION = 0.48;

export const TRAP_TYPES = {
  practice: { asset: "tile.moonroot.spikePlate", label: "Practice Plate", effect: "trap.effect.spikes", effectDuration: TRAP_EFFECT_DURATION, light: { radius: 2.5, color: "#f0f4ff", intensity: 0.24 } },
  pitfall: { asset: "tile.moonroot.pitfall", label: "Pitfall", effect: "trap.effect.pitfall", effectDuration: 0.58, light: { radius: 2.8, color: "#7f9bb6", intensity: 0.2 } },
  spikes: { asset: "tile.moonroot.spikePlate", label: "Spike Plate", effect: "trap.effect.spikes", effectDuration: TRAP_EFFECT_DURATION, light: { radius: 2.5, color: "#f0f4ff", intensity: 0.24 } },
  darts: { asset: "tile.moonroot.dartLine", label: "Dart Line", effect: "trap.effect.dart", effectDuration: 0.42, light: { radius: 2.2, color: "#ffe7a8", intensity: 0.22 } },
  poison: { asset: "tile.moonroot.poisonMist", label: "Poison Mist", effect: "trap.effect.poison", effectDuration: 0.7, light: { radius: 3.2, color: "#9cff6c", intensity: 0.28 } },
  alarm: { asset: "tile.moonroot.alarmRune", label: "Alarm Rune", effect: "trap.effect.alarm", effectDuration: 0.62, light: { radius: 4, color: "#ffb33f", intensity: 0.38 } },
  crumble: { asset: "tile.moonroot.crumblingBridge", label: "Crumbling Bridge", effect: "trap.effect.crumble", effectDuration: 0.58, light: { radius: 2.5, color: "#d6b68f", intensity: 0.18 } },
  teleport: { asset: "tile.moonroot.teleportSnare", label: "Teleport Snare", effect: "trap.effect.teleport", effectDuration: 0.66, light: { radius: 4, color: "#8da8ff", intensity: 0.42 } }
};

const FLOOR_VARIANTS = [
  { tile: "tile.moonroot.floor.a", weight: 34 },
  { tile: "tile.moonroot.floor.b", weight: 18 },
  { tile: "tile.moonroot.floor.c", weight: 14 },
  { tile: "tile.moonroot.floor.d", weight: 10 }
];

const FLOOR_1_LIGHT_FLOOR_VARIANTS = [
  { tile: "tile.moonroot.floor1.light.a", weight: 6 },
  { tile: "tile.moonroot.floor1.light.b", weight: 5 },
  { tile: "tile.moonroot.floor1.light.c", weight: 4 },
  { tile: "tile.moonroot.floor1.light.d", weight: 3 }
];
const BATTLE_BACKDROPS = {
  dungeon: ["backdrop.battle.dungeon.a", "backdrop.battle.dungeon.b", "backdrop.battle.dungeon.c"],
  boss: ["backdrop.battle.boss.a", "backdrop.battle.boss.b", "backdrop.battle.boss.c"]
};

export const DUNGEON_TILE_REGISTRY = {
  floor: {
    "floor.stone.base": "tile.moonroot.semantic.floorBase",
    "floor.stone.cracked": "tile.moonroot.semantic.floorCracked",
    "floor.stone.roots": "tile.moonroot.semantic.floorRoots",
    "floor.stone.blue_crystal": "tile.moonroot.semantic.floorCrystal"
  },
  wallTop: {
    "wall.top.straight": ["tile.moonroot.wall.top.a", "tile.moonroot.wall.top.b", "tile.moonroot.wall.top.c"],
    "wall.top.left_end": ["tile.moonroot.wall.top.a", "tile.moonroot.wall.top.b", "tile.moonroot.wall.top.c"],
    "wall.top.right_end": ["tile.moonroot.wall.top.a", "tile.moonroot.wall.top.b", "tile.moonroot.wall.top.c"],
    "wall.top.inner_corner": ["tile.moonroot.wall.top.a", "tile.moonroot.wall.top.b", "tile.moonroot.wall.top.c"],
    "wall.top.outer_corner": ["tile.moonroot.wall.top.a", "tile.moonroot.wall.top.b", "tile.moonroot.wall.top.c"]
  },
  wallBottom: {
    "wall.bottom.straight": ["tile.moonroot.semantic.wallBottomStraightA", "tile.moonroot.semantic.wallBottomStraightB", "tile.moonroot.semantic.wallBottomStraightC"]
  },
  wallFace: {
    "wall.face.straight": ["tile.moonroot.wall.face.a", "tile.moonroot.wall.face.b", "tile.moonroot.wall.face.roots"],
    "wall.face.left_edge": ["tile.moonroot.wall.face.a", "tile.moonroot.wall.face.b", "tile.moonroot.wall.face.roots"],
    "wall.face.right_edge": ["tile.moonroot.wall.face.a", "tile.moonroot.wall.face.b", "tile.moonroot.wall.face.roots"],
    "wall.face.shadow": ["tile.moonroot.wall.face.a", "tile.moonroot.wall.face.b", "tile.moonroot.wall.face.roots"],
    "wall.face.roots": "tile.moonroot.wall.face.roots"
  },
  wallSide: {
    "wall.side.left": ["tile.moonroot.semantic.wallSideLeftA", "tile.moonroot.semantic.wallSideLeftB", "tile.moonroot.semantic.wallSideLeftC"],
    "wall.side.right": ["tile.moonroot.semantic.wallSideRightA", "tile.moonroot.semantic.wallSideRightB", "tile.moonroot.semantic.wallSideRightC"],
    "wall.side.left_torch": ["tile.moonroot.semantic.wallSideLeftA", "tile.moonroot.semantic.wallSideLeftB", "tile.moonroot.semantic.wallSideLeftC"],
    "wall.side.right_torch": ["tile.moonroot.semantic.wallSideRightA", "tile.moonroot.semantic.wallSideRightB", "tile.moonroot.semantic.wallSideRightC"]
  },
  wallEdge: {
    "wall.edge.west": ["tile.moonroot.semantic.wallEdgeImagegenWestA", "tile.moonroot.semantic.wallEdgeImagegenWestB", "tile.moonroot.semantic.wallEdgeImagegenWestC"],
    "wall.edge.east": ["tile.moonroot.semantic.wallEdgeImagegenEastA", "tile.moonroot.semantic.wallEdgeImagegenEastB", "tile.moonroot.semantic.wallEdgeImagegenEastC"]
  },
  wallCorner: {
    "wall.corner.outer_tl": "tile.moonroot.wall.corner.outer.tl.a",
    "wall.corner.outer_tr": "tile.moonroot.wall.corner.outer.tr.a",
    "wall.corner.outer_bl": "tile.moonroot.wall.corner.outer.bl.a",
    "wall.corner.outer_br": "tile.moonroot.wall.corner.outer.br.a",
    "wall.corner.inner_left": "tile.moonroot.wall.corner.inner.left.a",
    "wall.corner.inner_right": "tile.moonroot.wall.corner.inner.right.a"
  },
  door: {
    "door.wood.closed.top": "tile.moonroot.semantic.doorTop",
    "door.wood.closed.face": "tile.moonroot.semantic.doorFace",
    "door.wood.open.top": "tile.moonroot.semantic.doorTop",
    "door.arch.stone": "tile.moonroot.semantic.wallTopCorner",
    "door.ns.closed": ["tile.moonroot.door.ns.closed.a", "tile.moonroot.door.ns.closed.b"],
    "door.ns.open": ["tile.moonroot.door.ns.open.a", "tile.moonroot.door.ns.open.b"],
    "door.ew.closed": ["tile.moonroot.semantic.doorEwClosedA", "tile.moonroot.semantic.doorEwClosedB"],
    "door.ew.open": ["tile.moonroot.semantic.doorEwOpenA", "tile.moonroot.semantic.doorEwOpenB"],
    "door.ew.east.closed": "tile.moonroot.semantic.doorEwEastClosed",
    "door.ew.east.open": "tile.moonroot.semantic.doorEwEastOpen",
    "door.ew.west.closed": "tile.moonroot.semantic.doorEwWestClosed",
    "door.ew.west.open": "tile.moonroot.semantic.doorEwWestOpen"
  },
  prop: {
    "prop.torch.wall": "tile.moonroot.semantic.torch",
    "prop.banner.red": "tile.moonroot.semantic.banner",
    "prop.chest": "tile.moonroot.chest",
    "prop.grate": "tile.moonroot.ironGrate",
    "prop.stairs.down": "tile.moonroot.stairsDown",
    "prop.water.channel": "tile.moonroot.waterChannel",
    "prop.pit": "tile.moonroot.pitfall"
  },
  trap: {
    "trap.spikes": "tile.moonroot.spikePlate",
    "trap.gas": "tile.moonroot.poisonMist",
    "trap.false_floor": "tile.moonroot.crumblingBridge"
  },
  fallbackNotes: [
    "wall.face.left_edge, wall.face.right_edge, wall.face.shadow, and wall.face.roots currently reuse wall.face.straight art.",
    "door.arch.stone currently reuses wall.top corner art as an arch placeholder."
  ]
};

const SEMANTIC = {
  void: "VOID",
  floor: "FLOOR",
  wall: "WALL",
  doorClosed: "DOOR_CLOSED",
  doorOpen: "DOOR_OPEN",
  water: "WATER",
  pit: "PIT",
  stairsDown: "STAIRS_DOWN",
  chest: "CHEST",
  trapSpikes: "TRAP_SPIKES",
  trapGas: "TRAP_GAS",
  trapFalseFloor: "TRAP_FALSE_FLOOR"
};

const SEMANTIC_FLOOR_VARIANTS = [
  { tile: DUNGEON_TILE_REGISTRY.floor["floor.stone.base"], weight: 4 },
  { tile: DUNGEON_TILE_REGISTRY.floor["floor.stone.cracked"], weight: 3 },
  { tile: DUNGEON_TILE_REGISTRY.floor["floor.stone.roots"], weight: 3 },
  { tile: DUNGEON_TILE_REGISTRY.floor["floor.stone.blue_crystal"], weight: 2 }
];

const DUNGEON_BASE_TILE_SIZE = 64;
const DUNGEON_TILE_SIZE = 96;
const dungeonScale = (value) => Math.round(value * DUNGEON_TILE_SIZE / DUNGEON_BASE_TILE_SIZE);
const DEFAULT_PROP_COLLISIONS = {
  "prop.guild.expedition_desk": { x: -0.8, y: -0.35, w: 1.6, h: 0.9, padding: 0.2 },
  "prop.guild.map_board": { x: -0.55, y: -0.25, w: 1.1, h: 0.65, padding: 0.18 },
  "prop.guild.supply_crate_stack.a": { x: -0.75, y: -0.25, w: 1.5, h: 0.85, padding: 0.22 },
  "prop.guild.lantern_rack": { x: -0.45, y: -0.35, w: 0.9, h: 0.95, padding: 0.2 },
  "prop.guild.wounded_cot": { x: -0.8, y: -0.25, w: 1.6, h: 0.75, padding: 0.2 },
  "prop.guild.clean_water_barrel": { x: -0.35, y: -0.3, w: 0.7, h: 0.8, padding: 0.2 },
  "prop.guild.field_kitchen.cookpot": { x: -0.65, y: -0.35, w: 1.3, h: 1.05, padding: 0.22 },
  "prop.guild.barricade.a": { x: -0.45, y: -0.15, w: 1.1, h: 0.7, padding: 0.2 },
  "prop.guild.barricade.reinforced": { x: -0.45, y: -0.15, w: 1.15, h: 0.75, padding: 0.2 },
  "prop.dungeon.broken_camp_pack": { x: -0.55, y: -0.2, w: 1.1, h: 0.7, padding: 0.18 },
  "prop.moonroot.root_cracked_altar": { x: -0.42, y: -0.35, w: 0.84, h: 0.95, padding: 0.2 },
  "tile.moonroot.chest": { x: -0.42, y: -0.3, w: 0.84, h: 0.72, padding: 0.18 },
  "tile.moonroot.column": { x: -0.36, y: -0.36, w: 0.72, h: 0.84, padding: 0.22 }
};

export function dungeonMapId(floor) {
  return floor <= 1 ? "moonroot_hollow" : `moonroot_floor_${floor}`;
}

export function dungeonFloorFromMapId(mapId) {
  if (mapId === "moonroot_hollow") return 1;
  const match = /^moonroot_floor_(\d+)$/.exec(mapId);
  return match ? Number(match[1]) : null;
}

export function createMoonrootDungeonMaps() {
  const maps = { moonroot_hollow: createTutorialFloor() };
  for (let floor = 2; floor <= IMPLEMENTED_DUNGEON_FLOOR; floor++) {
    maps[dungeonMapId(floor)] = floor === 2 ? createSecondFloor() : createGeneratedFloor(floor);
  }
  return maps;
}

function getMoonrootAmbienceForFloor(floor) {
  if (floor === 1) return { id: "moonroot_entry_safe" };
  if (floor === 10) return { id: "moonroot_boss" };
  if (floor >= 7) {
    return {
      id: "moonroot_entry_deep",
      visual: {
        darkness: 0.52,
        dungeonMist: true,
        rainLeaks: true
      },
      audio: { intensity: 0.7 }
    };
  }
  return {
    id: "moonroot_entry_contested",
    visual: {
      darkness: 0.34 + floor * 0.015,
      dungeonMist: floor >= 4,
      rainLeaks: floor >= 3
    },
    audio: { intensity: 0.45 + floor * 0.03 }
  };
}

function createTutorialFloor() {
  const rooms = [
    room("floor_1_forward_base_hall", 9, 30, 21, 10, { type: "forward_base_hall", control: "guild", safety: "safe", lighting: "bright" }),
    room("floor_1_quartermaster_nook", 32, 31, 11, 8, { type: "quartermaster_nook", control: "guild", safety: "safe", lighting: "bright" }),
    room("floor_1_infirmary_corner", 32, 23, 11, 7, { type: "infirmary_corner", control: "guild", safety: "safe", lighting: "warm" }),
    room("floor_1_field_kitchen", 7, 22, 12, 7, { type: "field_kitchen", control: "guild", safety: "safe", lighting: "warm" }),
    room("floor_1_training_barricade_room", 13, 16, 15, 9, { type: "training_barricade_room", control: "guild", safety: "tutorial", lighting: "bright" }),
    room("floor_1_torch_depot", 12, 8, 12, 7, { type: "torch_depot", control: "guild", safety: "tutorial", lighting: "mixed" }),
    room("floor_1_chalk_marked_fork", 25, 8, 13, 8, { type: "chalk_marked_fork", control: "contested", safety: "warning", lighting: "medium" }),
    room("floor_1_side_cache", 41, 11, 9, 6, { type: "lost_supply_cache", control: "contested", safety: "minor_reward", lighting: "dim" }),
    room("floor_1_broken_camp", 25, 2, 13, 6, { type: "broken_camp", control: "contested", safety: "danger", lighting: "dim" }),
    room("floor_1_root_cracked_shrine", 10, 1, 12, 7, { type: "root_cracked_shrine", control: "hollow", safety: "mystery", lighting: "moonroot_glow" }),
    room("floor_1_descent_gate", 43, 2, 12, 8, { type: "sealed_door_antechamber", control: "threshold", safety: "floor_exit", lighting: "guarded" })
  ];
  const corridors = [
    corridor("corridor_base_to_training", 19, 25, 3, 6, { from: "floor_1_forward_base_hall", to: "floor_1_training_barricade_room" }),
    corridor("corridor_training_to_torch", 18, 13, 3, 4, { from: "floor_1_training_barricade_room", to: "floor_1_torch_depot" }),
    corridor("corridor_torch_to_fork", 23, 10, 3, 3, { from: "floor_1_torch_depot", to: "floor_1_chalk_marked_fork" }),
    corridor("corridor_fork_to_broken_camp", 30, 7, 3, 2, { from: "floor_1_chalk_marked_fork", to: "floor_1_broken_camp" }),
    corridor("corridor_broken_camp_to_shrine", 21, 4, 5, 3, { from: "floor_1_broken_camp", to: "floor_1_root_cracked_shrine" }),
    corridor("corridor_broken_camp_to_descent", 37, 4, 7, 3, { from: "floor_1_broken_camp", to: "floor_1_descent_gate" }),
    corridor("corridor_fork_to_side_cache", 37, 12, 5, 3, { from: "floor_1_chalk_marked_fork", to: "floor_1_side_cache" }),
    corridor("corridor_base_to_quartermaster", 29, 34, 4, 3, { from: "floor_1_forward_base_hall", to: "floor_1_quartermaster_nook" }),
    corridor("corridor_quartermaster_to_infirmary", 36, 29, 3, 3, { from: "floor_1_quartermaster_nook", to: "floor_1_infirmary_corner" }),
    corridor("corridor_base_to_kitchen", 10, 28, 3, 3, { from: "floor_1_forward_base_hall", to: "floor_1_field_kitchen" })
  ];
  const openThresholds = [
    openThreshold("threshold_fork_to_broken_camp", 31, 7, "ns", "corridor_fork_to_broken_camp", { length: 2 }),
    openThreshold("threshold_broken_camp_to_shrine", 22, 5, "ew", "corridor_broken_camp_to_shrine", { length: 3 }),
    openThreshold("threshold_base_to_quartermaster", 30, 35, "ew", "corridor_base_to_quartermaster", { length: 2 }),
    openThreshold("threshold_quartermaster_to_infirmary", 37, 30, "ns", "corridor_quartermaster_to_infirmary"),
    openThreshold("threshold_base_to_kitchen", 11, 29, "ns", "corridor_base_to_kitchen")
  ];

  return buildSemanticDungeonMap({
    id: "moonroot_hollow",
    name: "Moonroot Hollow - Floor 1: Guild Forward Base",
    floor: 1,
    width: 63,
    height: 45,
    rooms,
    corridors,
    ambience: getMoonrootAmbienceForFloor(1),
    spawn: { x: 18, y: 36 },
    spawns: {
      entrance: { x: 18, y: 36 },
      guild_base: { x: 18, y: 36 },
      from_floor_2: { x: 49, y: 7 },
      pitfall: { x: 18, y: 36 }
    },
    semanticCells: [
      ...thresholdWallCells({ x: 20, y: 26, orientation: "ns", region: "corridor_base_to_training" }),
      ...thresholdWallCells({ x: 19, y: 15, orientation: "ns", region: "corridor_training_to_torch" }),
      ...thresholdWallCells({ x: 24, y: 11, orientation: "ew", region: "corridor_torch_to_fork" }),
      ...thresholdWallCells({ x: 39, y: 13, orientation: "ew", region: "corridor_fork_to_side_cache" }),
      ...thresholdWallCells({ x: 41, y: 5, orientation: "ew", region: "corridor_broken_camp_to_descent" }),
      ...openThresholds.flatMap(thresholdWallCells),
      cell(50, 7, SEMANTIC.stairsDown, "floor_1_descent_gate")
    ],
    openThresholds,
    floorVariants: FLOOR_1_LIGHT_FLOOR_VARIANTS,
    doors: [
      door("door_base_to_training", 20, 26, "ns", "corridor_base_to_training", "north", { startsOpen: true, tutorialDoor: true }),
      door("door_training_to_torch", 19, 15, "ns", "corridor_training_to_torch", "north"),
      door("door_torch_to_fork", 24, 11, "ew", "corridor_torch_to_fork", "east"),
      door("door_fork_to_cache", 39, 13, "ew", "corridor_fork_to_side_cache", "east"),
      door("door_broken_to_descent", 41, 5, "ew", "corridor_broken_camp_to_descent", "east", { guarded: true })
    ],
    links: [
      ["floor_1_forward_base_hall", "corridor_base_to_training"],
      ["corridor_base_to_training", "floor_1_training_barricade_room"],
      ["floor_1_training_barricade_room", "corridor_training_to_torch"],
      ["corridor_training_to_torch", "floor_1_torch_depot"],
      ["floor_1_torch_depot", "corridor_torch_to_fork"],
      ["corridor_torch_to_fork", "floor_1_chalk_marked_fork"],
      ["floor_1_chalk_marked_fork", "corridor_fork_to_broken_camp"],
      ["corridor_fork_to_broken_camp", "floor_1_broken_camp"],
      ["floor_1_broken_camp", "corridor_broken_camp_to_shrine"],
      ["corridor_broken_camp_to_shrine", "floor_1_root_cracked_shrine"],
      ["floor_1_broken_camp", "corridor_broken_camp_to_descent"],
      ["corridor_broken_camp_to_descent", "floor_1_descent_gate"],
      ["floor_1_chalk_marked_fork", "corridor_fork_to_side_cache"],
      ["corridor_fork_to_side_cache", "floor_1_side_cache"],
      ["floor_1_forward_base_hall", "corridor_base_to_quartermaster"],
      ["corridor_base_to_quartermaster", "floor_1_quartermaster_nook"],
      ["floor_1_quartermaster_nook", "corridor_quartermaster_to_infirmary"],
      ["corridor_quartermaster_to_infirmary", "floor_1_infirmary_corner"],
      ["floor_1_forward_base_hall", "corridor_base_to_kitchen"],
      ["corridor_base_to_kitchen", "floor_1_field_kitchen"]
    ],
    decor: [
      layerObject("decal_floor_1_chalk_arrow_safe", "decal.guild.chalk_arrow", 28, 12, { drawW: DUNGEON_TILE_SIZE, drawH: DUNGEON_TILE_SIZE, anchorY: 0 }),
      layerObject("decal_floor_1_chalk_arrow_base", "decal.guild.route_ribbon", 17, 33, { drawW: DUNGEON_TILE_SIZE, drawH: DUNGEON_TILE_SIZE, anchorY: 0 }),
      layerObject("decal_floor_1_chalk_warning", "decal.guild.warning_marks", 34, 13, { drawW: DUNGEON_TILE_SIZE, drawH: DUNGEON_TILE_SIZE, anchorY: 0 }),
      layerObject("decal_floor_1_training_warning", "decal.guild.warning_marks", 20, 23, { drawW: DUNGEON_TILE_SIZE, drawH: DUNGEON_TILE_SIZE, anchorY: 0 }),
      layerObject("decal_floor_1_blood_trail", "decal.dungeon.blood_trail.subtle", 31, 5, { drawW: dungeonScale(120), drawH: dungeonScale(92), anchorY: dungeonScale(34) }),
      layerObject("decal_floor_1_blood_trail_b", "decal.dungeon.blood_trail.subtle", 36, 5, { drawW: dungeonScale(100), drawH: dungeonScale(80), anchorY: dungeonScale(32) }),
      layerObject("decal_floor_1_scorch_cache", "decal.dungeon.scorch_mark", 45, 15, { drawW: dungeonScale(96), drawH: dungeonScale(96), anchorY: dungeonScale(24) }),
      layerObject("decal_floor_1_moonroot_glow_a", "decal.moonroot.glowing_root_crack", 15, 5, { drawW: DUNGEON_TILE_SIZE, drawH: DUNGEON_TILE_SIZE, anchorY: 0, light: { radius: 2.5, color: "#8ccce8", intensity: 0.28 } }),
      layerObject("decal_floor_1_moonroot_glow_b", "decal.moonroot.glowing_root_crack", 19, 3, { drawW: DUNGEON_TILE_SIZE, drawH: DUNGEON_TILE_SIZE, anchorY: 0, light: { radius: 2.5, color: "#8ccce8", intensity: 0.24 } })
    ],
    wallDecor: [
      { x: 17, y: 21, asset: "wall.face.roots" },
      { x: 18, y: 7, asset: "wall.face.roots" },
      { x: 15, y: 0, asset: "wall.face.roots" },
      { x: 34, y: 1, asset: "wall.face.roots" },
      { x: 47, y: 1, asset: "wall.face.roots" }
    ],
    props: [
      prop("prop_floor_1_map_board", "prop.guild.map_board", 23, 32, { drawW: dungeonScale(138), drawH: dungeonScale(132), anchorY: dungeonScale(92) }),
      prop("prop_floor_1_guild_banner", "tile.moonroot.banner", 10, 32, { drawW: dungeonScale(72), drawH: dungeonScale(96), anchorY: dungeonScale(80) }),
      prop("prop_floor_1_guild_banner_b", "tile.moonroot.banner", 28, 32, { drawW: dungeonScale(64), drawH: dungeonScale(88), anchorY: dungeonScale(74) }),
      prop("prop_floor_1_bedroll_cluster", "prop.guild.bedroll_cluster", 12, 38, { drawW: dungeonScale(160), drawH: dungeonScale(72), anchorY: dungeonScale(40) }),
      prop("prop_floor_1_bedroll_cluster_b", "prop.guild.bedroll_cluster", 22, 37, { drawW: dungeonScale(154), drawH: dungeonScale(70), anchorY: dungeonScale(38) }),
      prop("prop_floor_1_supply_stack_a", "prop.guild.supply_crate_stack.a", 26, 38, { drawW: dungeonScale(184), drawH: dungeonScale(96), anchorY: dungeonScale(60) }),
      prop("prop_floor_1_supply_stack_b", "prop.guild.supply_crate_stack.a", 17, 36, { drawW: dungeonScale(142), drawH: dungeonScale(78), anchorY: dungeonScale(50) }),
      prop("prop_floor_1_lantern_rack_base", "prop.guild.lantern_rack", 13, 31, { drawW: dungeonScale(128), drawH: dungeonScale(120), anchorY: dungeonScale(88), light: { radius: 5, color: "#f2b35d", intensity: 0.7, flicker: true } }),
      prop("prop_floor_1_base_torch_east", "tile.moonroot.torch", 28, 31, { drawW: dungeonScale(72), drawH: dungeonScale(72), anchorY: dungeonScale(54), light: { radius: 4.5, color: "#f2b35d", intensity: 0.68, flicker: true } }),
      prop("prop_floor_1_quartermaster_shelves", "prop.guild.supply_crate_stack.a", 34, 34, { drawW: dungeonScale(170), drawH: dungeonScale(92), anchorY: dungeonScale(60) }),
      prop("prop_floor_1_quartermaster_crates", "prop.guild.supply_crate_stack.a", 40, 36, { drawW: dungeonScale(138), drawH: dungeonScale(74), anchorY: dungeonScale(48) }),
      prop("prop_floor_1_quartermaster_lantern", "tile.moonroot.torch", 32, 32, { drawW: dungeonScale(64), drawH: dungeonScale(64), anchorY: dungeonScale(48), light: { radius: 4, color: "#f2b35d", intensity: 0.62, flicker: true } }),
      prop("prop_floor_1_wounded_cot", "prop.guild.wounded_cot", 35, 26, { drawW: dungeonScale(160), drawH: dungeonScale(80), anchorY: dungeonScale(44), script: "floor_1_wounded_delver_warning" }),
      prop("prop_floor_1_infirmary_water", "prop.guild.clean_water_barrel", 41, 28, { drawW: dungeonScale(94), drawH: dungeonScale(92), anchorY: dungeonScale(58) }),
      prop("prop_floor_1_infirmary_lantern", "tile.moonroot.torch", 32, 24, { drawW: dungeonScale(64), drawH: dungeonScale(64), anchorY: dungeonScale(48), light: { radius: 4, color: "#f2b35d", intensity: 0.58, flicker: true } }),
      prop("prop_floor_1_cookpot", "prop.guild.field_kitchen.cookpot", 10, 24, { drawW: dungeonScale(170), drawH: dungeonScale(160), anchorY: dungeonScale(116), script: "field_kitchen_intro", light: { radius: 4.5, color: "#f2b35d", intensity: 0.65, flicker: true } }),
      prop("prop_floor_1_kitchen_barrel", "prop.guild.clean_water_barrel", 17, 26, { drawW: dungeonScale(100), drawH: dungeonScale(98), anchorY: dungeonScale(62) }),
      prop("prop_floor_1_kitchen_crates", "prop.guild.supply_crate_stack.a", 15, 23, { drawW: dungeonScale(120), drawH: dungeonScale(64), anchorY: dungeonScale(42) }),
      prop("prop_floor_1_training_dummy", "prop.guild.barricade.a", 24, 19, { drawW: dungeonScale(130), drawH: dungeonScale(72), anchorY: dungeonScale(44), script: "training_dummy" }),
      prop("prop_floor_1_barricade_a", "prop.guild.barricade.a", 16, 21, { drawW: dungeonScale(146), drawH: dungeonScale(84), anchorY: dungeonScale(52) }),
      prop("prop_floor_1_barricade_b", "prop.guild.barricade.reinforced", 22, 23, { drawW: dungeonScale(152), drawH: dungeonScale(82), anchorY: dungeonScale(50) }),
      prop("prop_floor_1_training_torch", "tile.moonroot.torch", 14, 17, { drawW: dungeonScale(64), drawH: dungeonScale(64), anchorY: dungeonScale(48), light: { radius: 5, color: "#f2b35d", intensity: 0.75, flicker: true } }),
      prop("prop_floor_1_lantern_rack", "prop.guild.lantern_rack", 14, 10, { drawW: dungeonScale(128), drawH: dungeonScale(120), anchorY: dungeonScale(88), light: { radius: 6, color: "#f2b35d", intensity: 0.85, flicker: true } }),
      prop("prop_floor_1_torch_depot_stack", "prop.guild.supply_crate_stack.a", 21, 12, { drawW: dungeonScale(124), drawH: dungeonScale(68), anchorY: dungeonScale(44) }),
      prop("prop_floor_1_torch_depot_wall_torch", "tile.moonroot.torch", 19, 9, { drawW: dungeonScale(72), drawH: dungeonScale(72), anchorY: dungeonScale(54), light: { radius: 6, color: "#f2b35d", intensity: 0.9, flicker: true } }),
      prop("prop_floor_1_fork_torch", "tile.moonroot.torch", 27, 10, { drawW: dungeonScale(64), drawH: dungeonScale(64), anchorY: dungeonScale(48), light: { radius: 4, color: "#f2b35d", intensity: 0.55, flicker: true } }),
      prop("prop_floor_1_torn_bedrolls", "prop.dungeon.torn_bedrolls", 27, 4, { drawW: dungeonScale(160), drawH: dungeonScale(72), anchorY: dungeonScale(40) }),
      prop("prop_floor_1_broken_pack", "prop.dungeon.broken_camp_pack", 35, 5, { drawW: dungeonScale(128), drawH: dungeonScale(72), anchorY: dungeonScale(42), pickup: "potion" }),
      prop("prop_floor_1_broken_dim_torch", "tile.moonroot.torch", 25, 3, { drawW: dungeonScale(56), drawH: dungeonScale(56), anchorY: dungeonScale(42), light: { radius: 2.5, color: "#d88b4d", intensity: 0.28, flicker: true } }),
      prop("prop_floor_1_root_cracked_altar", "prop.moonroot.root_cracked_altar", 15, 4, { drawW: dungeonScale(104), drawH: dungeonScale(104), anchorY: dungeonScale(80), script: "floor_1_shrine_lore", light: { radius: 4, color: "#8ccce8", intensity: 0.55, flicker: false } }),
      prop("prop_floor_1_shrine_rubble", "prop.dungeon.broken_camp_pack", 20, 6, { drawW: dungeonScale(96), drawH: dungeonScale(56), anchorY: dungeonScale(36) }),
      prop("prop_floor_1_guarded_barricade", "prop.guild.barricade.reinforced", 48, 5, { drawW: dungeonScale(180), drawH: dungeonScale(92), anchorY: dungeonScale(58) }),
      prop("prop_floor_1_descent_torch", "tile.moonroot.torch", 44, 3, { drawW: dungeonScale(72), drawH: dungeonScale(72), anchorY: dungeonScale(54), light: { radius: 5, color: "#f2b35d", intensity: 0.7, flicker: true } })
    ],
    traps: [
      { id: "trap_floor_1_practice_plate", type: "spikes", x: 21, y: 23, hidden: false, armed: false, room: "floor_1_training_barricade_room", questAdvance: { id: "q-moonroot-floor1", stage: 2 } },
      { id: "trap_floor_1_torch_depot_gas", type: "poison", x: 18, y: 13, hidden: false, armed: true, room: "corridor_training_to_torch", questAdvance: { id: "q-moonroot-floor1", stage: 3 } },
      { id: "trap_floor_1_chalk_fork_dart", type: "darts", x: 33, y: 12, hidden: false, armed: true, room: "floor_1_chalk_marked_fork", questAdvance: { id: "q-moonroot-floor1", stage: 4 } },
      { id: "trap_floor_1_cache_crumble", type: "crumble", x: 45, y: 14, hidden: false, armed: true, room: "floor_1_side_cache", questAdvance: { id: "q-moonroot-floor1", stage: 5 } }
    ],
    npcs: [
      {
        id: "npc_floor_1_quartermaster",
        name: "Quartermaster Sella",
        asset: "actor.rowan.move",
        x: 37,
        y: 35,
        dir: "down",
        drawW: 92,
        drawH: 148,
        anchorY: 110,
        script: "floor_1_quartermaster_intro"
      },
      {
        id: "npc_floor_1_mapper",
        name: "Guild Mapper",
        asset: "actor.cassian.move",
        x: 24,
        y: 34,
        dir: "down",
        drawW: 86,
        drawH: 142,
        anchorY: 106,
        script: "floor_1_mapper_intro"
      },
      {
        id: "npc_floor_1_cook",
        name: "Cook Marlo",
        asset: "actor.elara.move",
        x: 12,
        y: 26,
        dir: "down",
        drawW: 94,
        drawH: 150,
        anchorY: 112,
        script: "floor_1_cooking_intro"
      },
      {
        id: "npc_floor_1_wounded_delver",
        name: "Wounded Delver",
        asset: "npc.moonroot.visitor",
        x: 39,
        y: 27,
        dir: "left",
        drawW: 86,
        drawH: 142,
        anchorY: 106,
        script: "floor_1_wounded_delver_warning"
      },
      {
        id: "npc_floor_1_rookie",
        name: "Guild Rookie",
        asset: "actor.nia.move",
        x: 22,
        y: 22,
        dir: "down",
        drawW: 84,
        drawH: 140,
        anchorY: 104,
        script: "floor_1_rookie_training_hint"
      },
      {
        id: "npc_floor_1_descent_guard",
        name: "Descent Guard",
        asset: "actor.rowan.move",
        x: 50,
        y: 6,
        dir: "left",
        drawW: 92,
        drawH: 150,
        anchorY: 112,
        script: "floor_1_descent_warning"
      }
    ],
    encounters: [
      // Future deeper-floor monsters should be authored at this runtime scale; the dungeon now breathes around full-size sprites.
      { id: "enc_floor_1_broken_camp_scouts", x: 33, y: 4, asset: "npc.moonroot.goblin_grunt.move", drawW: 92, drawH: 112, anchorY: 84, enemies: ["goblin-scout", "goblin-scout"], flag: "floor_1_broken_camp_scouts_defeated", questAdvance: { id: "q-moonroot-floor1", stage: 6 } },
      { id: "enc_floor_1_shrine_scout", x: 18, y: 3, asset: "npc.moonroot.goblin_grunt.move", drawW: 92, drawH: 112, anchorY: 84, enemies: ["goblin-scout"], flag: "floor_1_shrine_scout_defeated" },
      { id: "enc_floor_1_cache_goblin_scout", x: 46, y: 15, asset: "npc.moonroot.goblin_grunt.move", drawW: 92, drawH: 112, anchorY: 84, enemies: ["goblin-scout", "goblin-scout", "goblin-scout"], flag: "floor_1_cache_goblin_scout_defeated" }
    ],
    exits: [
      { x: 9, y: 35, to: "brindlemarket_village", spawn: "moon_gate_return" },
      { x: 50, y: 7, to: dungeonMapId(2), spawn: "entrance" }
    ]
  });
}

function createSecondFloor() {
  const rooms = [
    room("silt_gate", 3, 20, 10, 9),
    room("lantern_nave", 18, 17, 13, 15),
    room("moon_cistern", 38, 7, 15, 12),
    room("root_archive", 37, 28, 14, 12),
    room("reliquary", 56, 28, 10, 10),
    room("descent", 58, 14, 11, 9)
  ];
  const corridors = [
    corridor("gate_to_nave", 13, 23, 5, 3),
    corridor("nave_to_crossing", 31, 22, 7, 3),
    corridor("crossing_to_cistern", 43, 19, 3, 9),
    corridor("cistern_to_descent", 53, 16, 5, 3),
    corridor("archive_to_reliquary", 51, 32, 5, 3),
    corridor("archive_shortcut", 30, 30, 7, 3)
  ];
  const waterCells = [
    ...cellsRect(41, 10, 9, 2, SEMANTIC.water, "moon_cistern"),
    ...cellsRect(44, 12, 3, 5, SEMANTIC.water, "moon_cistern")
  ];

  return buildSemanticDungeonMap({
    id: dungeonMapId(2),
    name: "Moonroot Hollow - Floor 2",
    floor: 2,
    width: 72,
    height: 48,
    ambience: getMoonrootAmbienceForFloor(2),
    rooms,
    corridors,
    spawn: { x: 5, y: 24 },
    spawns: {
      entrance: { x: 5, y: 24 },
      from_next: { x: 65, y: 18 },
      pitfall: { x: 43, y: 33 }
    },
    semanticCells: [
      ...waterCells,
      cell(44, 33, SEMANTIC.trapFalseFloor, "root_archive"),
      cell(45, 33, SEMANTIC.trapFalseFloor, "root_archive"),
      cell(60, 33, SEMANTIC.chest, "reliquary"),
      cell(67, 18, SEMANTIC.stairsDown, "descent")
    ],
    doors: [
      door("gate_nave_door", 17, 24, "ew", "gate_to_nave", "east"),
      door("nave_crossing_door", 31, 23, "ew", "lantern_nave", "east"),
      door("cistern_lintel", 44, 19, "ns", "moon_cistern", "south"),
      door("descent_lintel", 57, 17, "ew", "descent", "west"),
      door("archive_lintel", 36, 31, "ew", "root_archive", "west"),
      door("reliquary_lintel", 55, 33, "ew", "reliquary", "west")
    ],
    links: [
      ["silt_gate", "gate_to_nave"],
      ["gate_to_nave", "lantern_nave"],
      ["lantern_nave", "nave_to_crossing"],
      ["nave_to_crossing", "moon_cistern"],
      ["moon_cistern", "crossing_to_cistern"],
      ["moon_cistern", "cistern_to_descent"],
      ["cistern_to_descent", "descent"],
      ["lantern_nave", "archive_shortcut"],
      ["archive_shortcut", "root_archive"],
      ["root_archive", "archive_to_reliquary"],
      ["archive_to_reliquary", "reliquary"]
    ],
    decor: [
      layerObject("floor_2_cistern_column_a", "tile.moonroot.column", 39, 14, { anchorY: dungeonScale(48) }),
      layerObject("floor_2_cistern_column_b", "tile.moonroot.column", 51, 14, { anchorY: dungeonScale(48) }),
      layerObject("floor_2_archive_grate", "tile.moonroot.ironGrate", 41, 34, { anchorY: dungeonScale(48) }),
      layerObject("floor_2_reliquary_torch", "tile.moonroot.torch", 58, 31, { anchorY: dungeonScale(56), light: { radius: 4.5, color: "#f2b35d", intensity: 0.65, flicker: true } })
    ],
    wallDecor: [
      { x: 22, y: 16, asset: "wall.face.roots" },
      { x: 26, y: 16, asset: "wall.face.roots" },
      { x: 43, y: 27, asset: "wall.face.roots" },
      { x: 47, y: 27, asset: "wall.face.roots" }
    ],
    props: [
      prop("floor_2_supply_chest", "tile.moonroot.chest", 60, 33, { pickup: "ether" })
    ],
    traps: [
      { id: "floor_2_spike_warning", type: "spikes", x: 24, y: 24, hidden: true },
      { id: "floor_2_alarm_rune", type: "alarm", x: 46, y: 16, hidden: true },
      { id: "floor_2_crumble_bridge", type: "crumble", x: 44, y: 33, hidden: true }
    ],
    encounters: [
      { id: "floor_2_bat_cistern", x: 48, y: 16, asset: "enemy.bat", drawW: dungeonScale(50), drawH: dungeonScale(50), enemies: ["moonroot-bat"], flag: "floor_2_bat_cistern_won" },
      { id: "floor_2_wisp_archive", x: 43, y: 33, asset: "enemy.wisp", drawW: dungeonScale(50), drawH: dungeonScale(50), enemies: ["road-wisp", "bramble-rat"], flag: "floor_2_wisp_archive_won" }
    ],
    exits: [
      { x: 3, y: 24, to: dungeonMapId(1), spawn: "from_floor_2" },
      { x: 68, y: 18, to: dungeonMapId(3), spawn: "entrance" }
    ]
  });
}

function buildSemanticDungeonMap(spec) {
  const semanticTiles = Array.from({ length: spec.height }, () => Array.from({ length: spec.width }, () => SEMANTIC.void));
  const regionTiles = Array.from({ length: spec.height }, () => Array.from({ length: spec.width }, () => null));
  const regions = [...spec.rooms, ...spec.corridors].map((region) => ({
    id: region.id,
    kind: region.kind,
    rect: region.rect,
    reveal: []
  }));

  for (const region of [...spec.rooms, ...spec.corridors]) {
    paintRect(semanticTiles, region.rect, SEMANTIC.floor);
    paintRegion(regionTiles, region.rect, region.id);
  }
  for (const [a, b] of spec.links ?? []) linkRegions(regions, a, b);

  addSemanticBoundaryWalls(semanticTiles);
  for (const semanticCell of spec.semanticCells ?? []) {
    semanticTiles[semanticCell.y][semanticCell.x] = semanticCell.tile;
    regionTiles[semanticCell.y][semanticCell.x] = semanticCell.region;
  }
  const doors = (spec.doors ?? []).map((item) => ({
    ...item,
    closedAsset: doorAsset(item, "closed"),
    openAsset: doorAsset(item, "open"),
    concealAsset: doorConcealAsset(item)
  }));
  const doorByCell = new Map(doors.map((item) => [`${item.x},${item.y}`, item]));
  for (const item of doors) {
    semanticTiles[item.y][item.x] = SEMANTIC.doorOpen;
    regionTiles[item.y][item.x] = item.region;
  }
  assignWallRegions(semanticTiles, regionTiles);

  const tiles = Array.from({ length: spec.height }, (_, y) => Array.from({ length: spec.width }, (_, x) => baseTileForSemantic(semanticTiles[y][x])));
  const blockedTiles = [];
  const dungeonLayers = {
    base: [],
    details: [],
    hazards: [],
    wallSides: [],
    wallTops: [],
    sortables: [...(spec.decor ?? [])]
  };
  const wallDecorByCell = new Map((spec.wallDecor ?? []).map((item) => [`${item.x},${item.y}`, item]));
  const floorOverrideByCell = new Map((spec.floorOverrides ?? []).map((item) => [`${item.x},${item.y}`, item]));

  for (let y = 0; y < spec.height; y++) {
    for (let x = 0; x < spec.width; x++) {
      const tile = semanticTiles[y][x];
      if (semanticHasFloorBase(tile)) {
        const override = floorOverrideByCell.get(`${x},${y}`);
        dungeonLayers.base.push(override ?? layerTile(`base_${x}_${y}`, DUNGEON_TILE_REGISTRY.floor["floor.stone.base"], x, y));
        const detail = detailAssetFor(x, y, spec.id);
        if (detail) dungeonLayers.details.push(layerTile(`detail_${x}_${y}`, detail, x, y));
      }
      if (isSemanticBlocked(tile)) blockedTiles.push([x, y]);
      if (tile === SEMANTIC.wall) {
        const floorBelow = isSemanticWalkable(semanticTiles[y + 1]?.[x]);
        const floorAbove = isSemanticWalkable(semanticTiles[y - 1]?.[x]);
        const floorWest = isSemanticWalkable(semanticTiles[y]?.[x - 1]);
        const floorEast = isSemanticWalkable(semanticTiles[y]?.[x + 1]);
        const sideFacing = floorWest || floorEast;
        const decoratedWall = wallDecorByCell.get(`${x},${y}`);
        if (sideFacing) {
          if (floorWest) {
            dungeonLayers.wallSides.push(layerTile(`wall_edge_west_${x}_${y}`, wallEdgeAsset("west", x, y), x, y));
          }
          if (floorEast) {
            dungeonLayers.wallSides.push(layerTile(`wall_edge_east_${x}_${y}`, wallEdgeAsset("east", x, y), x, y));
          }
        }
        if (floorBelow) {
          dungeonLayers.wallTops.push(layerTile(`wall_top_${x}_${y}`, wallTopAsset(semanticTiles, x, y), x, y - 1));
          // Logical WALL cells keep collision at (x, y), while the face is sorted at that same grid cell.
          dungeonLayers.sortables.push(layerObject(`wall_face_${x}_${y}`, decoratedWall ? registryAsset(DUNGEON_TILE_REGISTRY.wallFace[decoratedWall.asset], x, y, "decor") : wallFaceAsset(semanticTiles, x, y), x, y, { group: "wallFace" }));
        } else if (floorAbove) {
          dungeonLayers.wallTops.push(layerTile(`wall_bottom_cap_${x}_${y}`, wallBottomAsset(x, y), x, y));
        } else if (!sideFacing) {
          const cornerAsset = wallCornerAsset(semanticTiles, x, y);
          if (cornerAsset) {
            const topCornerSide = topOuterCornerSide(semanticTiles, x, y);
            if (topCornerSide) {
              dungeonLayers.wallSides.push(layerTile(`wall_edge_${topCornerSide}_${x}_${y}`, wallEdgeAsset(topCornerSide, x, y), x, y));
            }
            const cornerY = topCornerSide ? y - 1 : y;
            dungeonLayers.wallTops.push(layerTile(`wall_corner_${x}_${y}`, cornerAsset, x, cornerY));
          }
        }
      } else if (tile === SEMANTIC.doorClosed) {
        const door = doorByCell.get(`${x},${y}`);
        if (door && (door.facing ?? "north") !== "north") continue;
        dungeonLayers.wallTops.push(layerTile(`door_top_${x}_${y}`, DUNGEON_TILE_REGISTRY.door["door.wood.closed.top"], x, y - 1));
        dungeonLayers.sortables.push(layerObject(`door_face_${x}_${y}`, DUNGEON_TILE_REGISTRY.door["door.wood.closed.face"], x, y, { group: "door" }));
      } else if (tile === SEMANTIC.doorOpen) {
        const door = doorByCell.get(`${x},${y}`);
        if (door && (door.facing ?? "north") !== "north") continue;
        dungeonLayers.wallTops.push(layerTile(`door_open_top_${x}_${y}`, DUNGEON_TILE_REGISTRY.door["door.wood.open.top"], x, y - 1));
      } else if (tile === SEMANTIC.stairsDown) {
        dungeonLayers.hazards.push(layerTile(`stairs_${x}_${y}`, DUNGEON_TILE_REGISTRY.prop["prop.stairs.down"], x, y));
      } else if (tile === SEMANTIC.water) {
        dungeonLayers.hazards.push(layerTile(`water_${x}_${y}`, DUNGEON_TILE_REGISTRY.prop["prop.water.channel"], x, y));
      } else if (tile === SEMANTIC.pit) {
        dungeonLayers.hazards.push(layerTile(`pit_${x}_${y}`, DUNGEON_TILE_REGISTRY.prop["prop.pit"], x, y));
      } else if (tile === SEMANTIC.trapSpikes) {
        dungeonLayers.hazards.push(layerTile(`spikes_${x}_${y}`, DUNGEON_TILE_REGISTRY.trap["trap.spikes"], x, y));
      } else if (tile === SEMANTIC.trapGas) {
        dungeonLayers.hazards.push(layerTile(`gas_${x}_${y}`, DUNGEON_TILE_REGISTRY.trap["trap.gas"], x, y));
      } else if (tile === SEMANTIC.trapFalseFloor) {
        dungeonLayers.hazards.push(layerTile(`false_floor_${x}_${y}`, DUNGEON_TILE_REGISTRY.trap["trap.false_floor"], x, y));
      }
    }
  }

  return {
    schema_version: 1,
    id: spec.id,
    name: spec.name,
    dungeonFloor: spec.floor,
    tileSize: DUNGEON_TILE_SIZE,
    width: spec.width,
    height: spec.height,
    ambience: spec.ambience,
    defaultTile: "tile.moonroot.void",
    tileVariants: { [DUNGEON_TILE_REGISTRY.floor["floor.stone.base"]]: spec.floorVariants ?? SEMANTIC_FLOOR_VARIANTS },
    semanticTiles,
    dungeonLayers,
    tiles,
    blockedTiles,
    rooms: spec.rooms,
    corridors: spec.corridors,
    regions,
    regionTiles,
    overlays: [],
    openThresholds: spec.openThresholds ?? [],
    spawn: spec.spawn,
    spawns: spec.spawns,
    props: spec.props ?? [],
    traps: spec.traps ?? [],
    doors,
    npcs: spec.npcs ?? [],
    encounters: spec.encounters ?? [],
    exits: spec.exits ?? [],
    backdrop: "backdrop.dungeon",
    bossBackdrop: "backdrop.boss",
    battleBackdrops: spec.battleBackdrops ?? BATTLE_BACKDROPS.dungeon,
    bossBattleBackdrops: spec.bossBattleBackdrops ?? BATTLE_BACKDROPS.boss
  };
}

function cell(x, y, tile, region) {
  return { x, y, tile, region };
}

function cellsRect(x, y, w, h, tile, region) {
  const cells = [];
  for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) cells.push(cell(xx, yy, tile, region));
  return cells;
}

function openThreshold(id, x, y, orientation, region, extra = {}) {
  return { id, x, y, orientation, region, length: extra.length ?? 1 };
}

function thresholdWallCells(threshold) {
  const cells = [];
  const length = threshold.length ?? 1;
  for (let offset = 0; offset < length; offset++) {
    const x = threshold.orientation === "ew" ? threshold.x + offset : threshold.x;
    const y = threshold.orientation === "ns" ? threshold.y + offset : threshold.y;
    if (threshold.orientation === "ns") {
      cells.push(cell(x - 1, y, SEMANTIC.wall, threshold.region), cell(x + 1, y, SEMANTIC.wall, threshold.region));
    } else {
      cells.push(cell(x, y - 1, SEMANTIC.wall, threshold.region), cell(x, y + 1, SEMANTIC.wall, threshold.region));
    }
  }
  return cells;
}

function registryAsset(assetOrVariants, x, y, salt = "") {
  if (!Array.isArray(assetOrVariants)) return assetOrVariants;
  if (!assetOrVariants.length) return null;
  return assetOrVariants[stableTileHash(salt, x, y) % assetOrVariants.length];
}

function layerTile(id, asset, x, y, extra = {}) {
  return { id, asset, x, y, ...extra };
}

function layerObject(id, asset, x, y, extra = {}) {
  return {
    id,
    asset,
    x,
    y,
    drawW: DUNGEON_TILE_SIZE,
    drawH: DUNGEON_TILE_SIZE,
    anchorX: 0,
    anchorY: 0,
    sort: (y + 1) * DUNGEON_TILE_SIZE,
    ...defaultCollisionForAsset(asset),
    ...extra
  };
}

function addSemanticBoundaryWalls(semanticTiles) {
  const additions = [];
  for (let y = 0; y < semanticTiles.length; y++) {
    for (let x = 0; x < semanticTiles[y].length; x++) {
      if (semanticTiles[y][x] !== SEMANTIC.void) continue;
      const cardinal = semanticNeighbors(semanticTiles, x, y).some(([nx, ny]) => isSemanticWalkable(semanticTiles[ny]?.[nx]));
      const diagonal = [[x - 1, y - 1], [x + 1, y - 1], [x - 1, y + 1], [x + 1, y + 1]]
        .some(([nx, ny]) => isSemanticWalkable(semanticTiles[ny]?.[nx]));
      if (cardinal || diagonal) additions.push([x, y]);
    }
  }
  for (const [x, y] of additions) semanticTiles[y][x] = SEMANTIC.wall;
}

function assignWallRegions(semanticTiles, regionTiles) {
  for (let y = 0; y < semanticTiles.length; y++) {
    for (let x = 0; x < semanticTiles[y].length; x++) {
      if (![SEMANTIC.wall, SEMANTIC.doorClosed, SEMANTIC.doorOpen].includes(semanticTiles[y][x]) || regionTiles[y][x]) continue;
      const owner = semanticNeighbors(semanticTiles, x, y)
        .map(([nx, ny]) => regionTiles[ny]?.[nx])
        .find(Boolean);
      if (owner) regionTiles[y][x] = owner;
    }
  }
}

function semanticNeighbors(grid, x, y) {
  return [[x, y - 1], [x, y + 1], [x - 1, y], [x + 1, y]].filter(([nx, ny]) => grid[ny]?.[nx] !== undefined);
}

function isSemanticWalkable(tile) {
  return [SEMANTIC.floor, SEMANTIC.doorOpen, SEMANTIC.stairsDown, SEMANTIC.chest, SEMANTIC.trapSpikes, SEMANTIC.trapGas, SEMANTIC.trapFalseFloor, SEMANTIC.pit].includes(tile);
}

function isSemanticBlocked(tile) {
  return [SEMANTIC.wall, SEMANTIC.doorClosed, SEMANTIC.water].includes(tile);
}

function semanticHasFloorBase(tile) {
  return tile !== SEMANTIC.void && tile !== SEMANTIC.wall && tile !== SEMANTIC.doorClosed;
}

function baseTileForSemantic(tile) {
  return semanticHasFloorBase(tile) ? DUNGEON_TILE_REGISTRY.floor["floor.stone.base"] : "tile.moonroot.void";
}

function detailAssetFor(x, y, mapId) {
  return null;
}

function wallTopAsset(grid, x, y) {
  const west = grid[y]?.[x - 1] === SEMANTIC.wall || grid[y]?.[x - 1] === SEMANTIC.doorClosed;
  const east = grid[y]?.[x + 1] === SEMANTIC.wall || grid[y]?.[x + 1] === SEMANTIC.doorClosed;
  const north = grid[y - 1]?.[x] === SEMANTIC.wall || grid[y - 1]?.[x] === SEMANTIC.doorClosed;
  const south = grid[y + 1]?.[x] === SEMANTIC.wall || grid[y + 1]?.[x] === SEMANTIC.doorClosed;
  if ((north || south) && (west || east)) return registryAsset(DUNGEON_TILE_REGISTRY.wallTop["wall.top.inner_corner"], x, y, "top-inner");
  if (!west && east) return registryAsset(DUNGEON_TILE_REGISTRY.wallTop["wall.top.left_end"], x, y, "top-left");
  if (west && !east) return registryAsset(DUNGEON_TILE_REGISTRY.wallTop["wall.top.right_end"], x, y, "top-right");
  return registryAsset(DUNGEON_TILE_REGISTRY.wallTop["wall.top.straight"], x, y, "top");
}

function wallBottomAsset(x, y) {
  return registryAsset(DUNGEON_TILE_REGISTRY.wallBottom["wall.bottom.straight"], x, y, "bottom");
}

function wallEdgeAsset(side, x, y) {
  return registryAsset(DUNGEON_TILE_REGISTRY.wallEdge[`wall.edge.${side}`], x, y, `edge-${side}`);
}

function wallFaceAsset(grid, x, y) {
  const west = grid[y]?.[x - 1] === SEMANTIC.wall || grid[y]?.[x - 1] === SEMANTIC.doorClosed;
  const east = grid[y]?.[x + 1] === SEMANTIC.wall || grid[y]?.[x + 1] === SEMANTIC.doorClosed;
  if (!west && east) return registryAsset(DUNGEON_TILE_REGISTRY.wallFace["wall.face.left_edge"], x, y, "face-left");
  if (west && !east) return registryAsset(DUNGEON_TILE_REGISTRY.wallFace["wall.face.right_edge"], x, y, "face-right");
  return registryAsset(DUNGEON_TILE_REGISTRY.wallFace["wall.face.straight"], x, y, "face");
}

function doorAsset(item, state) {
  if (item.orientation === "ew" && (item.facing === "east" || item.facing === "west")) {
    return DUNGEON_TILE_REGISTRY.door[`door.ew.${item.facing}.${state}`];
  }
  return registryAsset(DUNGEON_TILE_REGISTRY.door[`door.${item.orientation}.${state}`], item.x, item.y, `${item.id}-${state}`);
}

function doorConcealAsset(item) {
  if (item.facing === "east" || item.facing === "west") return wallEdgeAsset(item.facing, item.x, item.y);
  if (item.facing === "south") return wallBottomAsset(item.x, item.y);
  return null;
}

function wallCornerAsset(grid, x, y) {
  const nw = isSemanticWalkable(grid[y - 1]?.[x - 1]);
  const ne = isSemanticWalkable(grid[y - 1]?.[x + 1]);
  const sw = isSemanticWalkable(grid[y + 1]?.[x - 1]);
  const se = isSemanticWalkable(grid[y + 1]?.[x + 1]);
  if (se) return registryAsset(DUNGEON_TILE_REGISTRY.wallCorner["wall.corner.outer_tl"], x, y, "corner-tl");
  if (sw) return registryAsset(DUNGEON_TILE_REGISTRY.wallCorner["wall.corner.outer_tr"], x, y, "corner-tr");
  if (ne) return registryAsset(DUNGEON_TILE_REGISTRY.wallCorner["wall.corner.outer_bl"], x, y, "corner-bl");
  if (nw) return registryAsset(DUNGEON_TILE_REGISTRY.wallCorner["wall.corner.outer_br"], x, y, "corner-br");
  return null;
}

function topOuterCornerSide(grid, x, y) {
  if (isSemanticWalkable(grid[y + 1]?.[x - 1])) return "west";
  if (isSemanticWalkable(grid[y + 1]?.[x + 1])) return "east";
  return null;
}

function stableTileHash(mapId, x, y) {
  let hash = 2166136261;
  for (let i = 0; i < mapId.length; i++) hash = Math.imul(hash ^ mapId.charCodeAt(i), 16777619);
  hash = Math.imul(hash ^ (x * 374761393), 668265263);
  hash = Math.imul(hash ^ (y * 2246822519), 3266489917);
  return hash >>> 0;
}

function createGeneratedFloor(floor) {
  const rng = mulberry32(0x9e3779b9 ^ floor * 0x45d9f3b);
  const boss = floor === 10;
  const hard = floor >= 11;
  const rooms = boss
    ? [
        room("entry", 3, 12, 9, 8),
        room("antechamber", 16, 9, 10, 12),
        room("boss", 31, 5, 17, 20),
        room("exit", 53, 12, 8, 8)
      ]
    : [
        room("entry", 3, 11, 9, 8),
        room("north", 16, 4, 10 + Math.floor(rng() * 3), 8 + Math.floor(rng() * 3)),
        room("center", 28, 14, 12, 10),
        room("south", 15, 28, 12, 9),
        room("treasure", 43, 27, 9, 8),
        room("exit", 52, 10, 9, 9)
      ];
  const corridors = boss
    ? [
        corridor("entry_to_antechamber", 12, 15, 5, 2),
        corridor("ante_to_boss", 25, 15, 7, 2),
        corridor("boss_to_exit", 48, 15, 6, 2),
        corridor("exit_to_edge", 60, 14, 4, 3)
      ]
    : [
        corridor("entry_to_center", 12, 14, 17, 3),
        corridor("north_drop", 21, 11, 3, 5),
        corridor("center_to_south", 31, 24, 3, 6),
        corridor("center_to_exit", 40, 16, 13, 3),
        corridor("south_to_treasure", 27, 31, 17, 3),
        corridor("treasure_to_exit", 49, 19, 3, 9),
        corridor("exit_to_edge", 60, 13, 4, 3)
      ];
  const props = [
    prop(`floor_${floor}_torch_a`, "tile.moonroot.torch", 5, 13),
    prop(`floor_${floor}_column_a`, "tile.moonroot.column", boss ? 34 : 30, boss ? 9 : 17),
    prop(`floor_${floor}_column_b`, "tile.moonroot.column", boss ? 45 : 37, boss ? 21 : 21),
    prop(`floor_${floor}_grate`, "tile.moonroot.ironGrate", hard ? 47 : 22, hard ? 31 : 7),
    ...placeLoot(floor, rng)
  ];
  const encounters = placeEncounters(floor);
  const traps = boss ? [] : placeTraps(floor, rng);
  const exits = [
    { x: 3, y: 15, to: dungeonMapId(floor - 1), spawn: floor === 2 ? "from_floor_2" : "from_next" }
  ];
  if (floor < IMPLEMENTED_DUNGEON_FLOOR) {
    exits.push({
      x: 63,
      y: boss ? 15 : 14,
      to: dungeonMapId(floor + 1),
      spawn: "entrance",
      ...(boss ? { requires: "boss_floor_10_won" } : {})
    });
  }

  return buildDungeonMap({
    id: dungeonMapId(floor),
    name: `Moonroot Hollow - Floor ${floor}`,
    floor,
    width: 64,
    height: 44,
    ambience: getMoonrootAmbienceForFloor(floor),
    rooms,
    corridors,
    spawn: { x: 7, y: boss ? 15 : 14 },
    spawns: {
      entrance: { x: 7, y: boss ? 15 : 14 },
      from_next: { x: 57, y: boss ? 15 : 14 },
      pitfall: { x: boss ? 20 : 31, y: boss ? 15 : 19 }
    },
    boss,
    props,
    traps,
    encounters,
    exits
  });
}

function buildDungeonMap(spec) {
  const tiles = Array.from({ length: spec.height }, () => Array.from({ length: spec.width }, () => "tile.moonroot.void"));
  const walkable = Array.from({ length: spec.height }, () => Array.from({ length: spec.width }, () => false));
  const regionTiles = Array.from({ length: spec.height }, () => Array.from({ length: spec.width }, () => null));
  const regions = [...spec.rooms, ...spec.corridors].map((region) => ({
    id: region.id,
    kind: region.kind,
    rect: region.rect,
    reveal: []
  }));

  for (const region of [...spec.rooms, ...spec.corridors]) {
    paintRect(walkable, region.rect, true);
    paintTiles(tiles, region.rect, "tile.moonroot.floor.a");
    paintRegion(regionTiles, region.rect, region.id);
  }

  const doors = [];
  for (const corridorRegion of spec.corridors) {
    for (const roomRegion of spec.rooms) {
      if (!touching(corridorRegion.rect, roomRegion.rect)) continue;
      linkRegions(regions, corridorRegion.id, roomRegion.id);
      const door = sharedDoor(corridorRegion.rect, roomRegion.rect);
      if (door) doors.push({ ...door, id: `door_${corridorRegion.id}_${roomRegion.id}`, regions: [corridorRegion.id, roomRegion.id] });
    }
  }

  const overlays = [];
  const blockedTiles = [];
  for (let y = 0; y < spec.height; y++) {
    for (let x = 0; x < spec.width; x++) {
      if (walkable[y][x]) continue;
      blockedTiles.push([x, y]);
      if (!hasWalkableNeighbor(walkable, x, y)) continue;
      tiles[y][x] = "tile.moonroot.wallTop";
      if (y + 1 < spec.height && walkable[y + 1][x]) {
        overlays.push(overlay(`wall_face_${x}_${y}`, "tile.moonroot.wallFace", x, y + 1, { sortOffset: -18 }));
      }
    }
  }

  for (const door of doors) {
    tiles[door.y][door.x] = "tile.moonroot.doorTop";
    overlays.push(overlay(`${door.id}_face`, "tile.moonroot.doorFace", door.x, door.y + 1, { sortOffset: -12 }));
    paintRegion(regionTiles, [door.x, door.y, 1, 1], door.regions[0]);
    blockedTiles.push([door.x, door.y]);
  }

  decorateWalls(overlays, walkable, spec);

  return {
    schema_version: 1,
    id: spec.id,
    name: spec.name,
    dungeonFloor: spec.floor,
    tileSize: DUNGEON_TILE_SIZE,
    width: spec.width,
    height: spec.height,
    ambience: spec.ambience,
    defaultTile: "tile.moonroot.void",
    tileVariants: { "tile.moonroot.floor.a": FLOOR_VARIANTS },
    tiles,
    blockedTiles,
    rooms: spec.rooms,
    corridors: spec.corridors,
    regions,
    regionTiles,
    overlays,
    spawn: spec.spawn,
    spawns: spec.spawns,
    props: spec.props ?? [],
    traps: spec.traps ?? [],
    npcs: spec.npcs ?? [],
    encounters: spec.encounters ?? [],
    exits: spec.exits ?? [],
    backdrop: spec.boss ? "backdrop.boss" : "backdrop.dungeon",
    bossBackdrop: "backdrop.boss",
    battleBackdrops: spec.boss ? BATTLE_BACKDROPS.boss : BATTLE_BACKDROPS.dungeon,
    bossBattleBackdrops: BATTLE_BACKDROPS.boss
  };
}

function room(id, x, y, w, h, extra = {}) {
  return { id, kind: "room", rect: [x, y, w, h], ...extra };
}

function corridor(id, x, y, w, h, extra = {}) {
  return { id, kind: "corridor", rect: [x, y, w, h], ...extra };
}

function door(id, x, y, orientation, region, facing = "north", extra = {}) {
  return { id, x, y, orientation, region, facing, ...extra };
}

function prop(id, asset, x, y, extra = {}) {
  return { id, asset, x, y, drawW: DUNGEON_TILE_SIZE, drawH: DUNGEON_TILE_SIZE, anchorY: dungeonScale(48), ...defaultCollisionForAsset(asset), ...extra };
}

function trapProp(id, type, x, y, script) {
  return prop(id, TRAP_TYPES[type].asset, x, y, { script });
}

function overlay(id, asset, x, y, extra = {}) {
  return { id, asset, x, y, drawW: DUNGEON_TILE_SIZE, drawH: DUNGEON_TILE_SIZE, anchorY: DUNGEON_TILE_SIZE, ...extra };
}

function defaultCollisionForAsset(asset) {
  const collision = DEFAULT_PROP_COLLISIONS[asset];
  return collision ? { collision } : {};
}

function paintRect(grid, rect, value) {
  const [x, y, w, h] = rect;
  for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) grid[yy][xx] = value;
}

function paintTiles(tiles, rect, tile) {
  paintRect(tiles, rect, tile);
}

function paintRegion(regionTiles, rect, regionId) {
  paintRect(regionTiles, rect, regionId);
}

function touching(a, b) {
  const [ax, ay, aw, ah] = a;
  const [bx, by, bw, bh] = b;
  const horizontal = ax < bx + bw && ax + aw > bx && (ay + ah === by || by + bh === ay);
  const vertical = ay < by + bh && ay + ah > by && (ax + aw === bx || bx + bw === ax);
  const overlapClose = ax <= bx + bw && ax + aw >= bx && ay <= by + bh && ay + ah >= by;
  return horizontal || vertical || overlapClose;
}

function sharedDoor(a, b) {
  const [ax, ay, aw, ah] = a;
  const [bx, by, bw, bh] = b;
  const minX = Math.max(ax, bx);
  const maxX = Math.min(ax + aw - 1, bx + bw - 1);
  const minY = Math.max(ay, by);
  const maxY = Math.min(ay + ah - 1, by + bh - 1);
  const centerAx = ax + (aw - 1) / 2;
  const centerAy = ay + (ah - 1) / 2;
  const centerBx = bx + (bw - 1) / 2;
  const centerBy = by + (bh - 1) / 2;
  const horizontalContact = maxY >= minY;
  const verticalContact = maxX >= minX;
  if (horizontalContact && (!verticalContact || Math.abs(centerAx - centerBx) >= Math.abs(centerAy - centerBy))) {
    const y = Math.round((minY + maxY) / 2);
    const x = centerAx <= centerBx ? bx - 1 : bx + bw;
    return { x: clamp(x, ax, ax + aw - 1), y: clamp(y, ay, ay + ah - 1) };
  }
  if (verticalContact) {
    const x = Math.round((minX + maxX) / 2);
    const y = centerAy <= centerBy ? by - 1 : by + bh;
    return { x: clamp(x, ax, ax + aw - 1), y: clamp(y, ay, ay + ah - 1) };
  }
  return null;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function linkRegions(regions, a, b) {
  const first = regions.find((region) => region.id === a);
  const second = regions.find((region) => region.id === b);
  if (first && !first.reveal.includes(b)) first.reveal.push(b);
  if (second && !second.reveal.includes(a)) second.reveal.push(a);
}

function hasWalkableNeighbor(walkable, x, y) {
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    if (walkable[y + dy]?.[x + dx]) return true;
  }
  return false;
}

function decorateWalls(overlays, walkable, spec) {
  const torchEvery = spec.floor === 1 ? 9 : 13;
  for (let y = 1; y < spec.height - 1; y++) {
    for (let x = 1; x < spec.width - 1; x++) {
      if (!walkable[y][x] || walkable[y - 1][x]) continue;
      if ((x + y + spec.floor) % torchEvery === 0) overlays.push(overlay(`torch_${x}_${y}`, "tile.moonroot.torch", x, y, { sortOffset: -8, light: { radius: 3.5, color: "#f2b35d", intensity: 0.54, flicker: true } }));
      else if ((x * 3 + y + spec.floor) % 31 === 0) overlays.push(overlay(`banner_${x}_${y}`, "tile.moonroot.banner", x, y, { sortOffset: -8 }));
    }
  }
}

function placeEncounters(floor) {
  if (floor === 10) {
    return [{ id: "vorthane", x: 39, y: 15, asset: "enemy.boss", drawW: 86, drawH: 56, enemies: ["vorthane"], flag: "boss_floor_10_won" }];
  }
  const pools = floor >= 11
    ? [["deep-moonroot-bat", "gloom-ooze"], ["rootbound-guard"], ["rootbound-guard", "deep-moonroot-bat"]]
    : floor >= 8
      ? [["moonroot-bat", "crystal-ooze"], ["hollow-guard"], ["moonroot-bat", "moonroot-bat"]]
      : floor >= 5
        ? [["moonroot-bat"], ["crystal-ooze"], ["moonroot-bat", "bramble-rat"]]
        : [["moonroot-bat"], ["bramble-rat"], ["road-wisp"]];
  const points = [[33, 18], [20, 7], [19, 32], [47, 31]];
  const count = floor >= 8 ? 4 : floor >= 5 ? 3 : 2;
  return Array.from({ length: count }, (_, index) => ({
    id: `floor_${floor}_encounter_${index + 1}`,
    x: points[index][0],
    y: points[index][1],
    asset: encounterMarker(pools[index % pools.length][0]),
    drawW: 50,
    drawH: 50,
    enemies: pools[index % pools.length],
    flag: `floor_${floor}_encounter_${index + 1}_won`
  }));
}

function encounterMarker(enemyId) {
  if (enemyId.includes("guard")) return "enemy.guard";
  if (enemyId.includes("ooze")) return "enemy.ooze";
  if (enemyId.includes("wisp")) return "enemy.wisp";
  if (enemyId.includes("rat")) return "enemy.rat";
  return "enemy.bat";
}

function placeTraps(floor, rng) {
  const types = ["spikes", "darts", "poison", "alarm", "crumble", "teleport"];
  if (floor >= 8 && floor < 10) types.push("pitfall");
  const points = [[32, 15], [22, 11], [31, 28], [48, 21], [50, 31], [38, 17]];
  const count = floor >= 11 ? 6 : floor >= 8 ? 5 : floor >= 5 ? 4 : 2;
  return Array.from({ length: count }, (_, index) => ({
    id: `floor_${floor}_trap_${index + 1}`,
    type: floor >= 8 && floor < 10 && index === 0 ? "pitfall" : types[Math.floor(rng() * types.length)],
    x: points[index][0],
    y: points[index][1],
    hidden: true
  }));
}

function placeLoot(floor, rng) {
  const loot = floor >= 11 ? ["ether", "revive-feather"] : floor >= 8 ? ["ether", "potion"] : ["potion"];
  const points = [[47, 31], [20, 33]];
  const count = floor >= 8 ? 2 : 1;
  return Array.from({ length: count }, (_, index) => prop(`floor_${floor}_chest_${index + 1}`, "tile.moonroot.chest", points[index][0], points[index][1], { pickup: loot[index % loot.length] }));
}

function mulberry32(seed) {
  return function next() {
    let t = seed += 0x6d2b79f5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
