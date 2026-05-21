import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const outPath = path.join(root, "data/maps/emberleaf_trail.json");

const map = {
  schema_version: 1,
  id: "emberleaf_trail",
  name: "Emberleaf Trail",
  tileSize: 32,
  width: 72,
  height: 45,
  defaultTile: "tile.tutorial.grass",
  tileVariants: {
    "tile.tutorial.grass": [
      { tile: "tile.tutorial.grass", weight: 50 },
      { tile: "tile.tutorial.grass.soft", weight: 11 },
      { tile: "tile.tutorial.grass.deep", weight: 10 },
      { tile: "tile.tutorial.grass.clover", weight: 8 },
      { tile: "tile.tutorial.grass.sprout", weight: 7 },
      { tile: "tile.tutorial.grass.wind", weight: 5 }
    ]
  },
  spawn: { x: 8, y: 25 },
  tentInterior: { rect: [10, 21, 4, 4] },
  fills: [
    { tile: "tile.tutorial.pathH", rect: [4, 25, 42, 1] },
    { tile: "tile.tutorial.pathH", rect: [50, 25, 22, 1] },
    { tile: "tile.tutorial.pathV", rect: [8, 21, 1, 5] },
    { tile: "tile.tutorial.pathH", rect: [8, 21, 5, 1] },
    { tile: "tile.tutorial.pathV", rect: [18, 18, 1, 8] },
    { tile: "tile.tutorial.pathH", rect: [18, 18, 9, 1] },
    { tile: "tile.tutorial.pathV", rect: [31, 25, 1, 8] },
    { tile: "tile.tutorial.pathH", rect: [31, 32, 10, 1] },
    { tile: "tile.tutorial.waterLeft", rect: [45, 0, 1, 45] },
    { tile: "tile.tutorial.water.shimmer", rect: [46, 0, 3, 45] },
    { tile: "tile.tutorial.waterRight", rect: [49, 0, 1, 45] },
    { tile: "tile.tutorial.bridge", rect: [45, 25, 5, 1] },
    { tile: "tile.tutorial.pathH", rect: [50, 25, 22, 1] }
  ],
  blocked: [
    [0, 0, 72, 1],
    [0, 44, 72, 1],
    [0, 0, 1, 45],
    [71, 0, 1, 24],
    [71, 26, 1, 19],
    [45, 0, 5, 25],
    [45, 26, 5, 19]
  ],
  props: [],
  npcs: [
    { id: "mira", name: "Mira", asset: "actor.elara", x: 7, y: 23, drawW: 43, drawH: 56, anchorY: 28, script: "mira-intro", afterFlagScript: { "q-tutorial-started": "mira-return" } }
  ],
  encounters: [
    { id: "tutorial_slime", x: 38, y: 25, asset: "prop.tutorial.slime.standalone", drawW: 48, drawH: 37, enemies: ["training-slime"], flag: "tutorial_combat_won" },
    { id: "thorn_imp", x: 66, y: 25, asset: "enemy.thorn.standalone", drawW: 50, drawH: 50, enemies: ["thorn-imp"], flag: "trail_imp_won" }
  ],
  exits: [
    { x: 71, y: 25, to: "brindlemarket_village", spawn: "west_gate", requires: "tutorial_complete" }
  ],
  backdrop: "backdrop.tutorial.generated"
};

const addProp = (prop) => map.props.push(prop);
const blockTree = (x, y) => map.blocked.push([x, y, 2, 2]);

addProp({ id: "tent_interior", asset: "prop.tutorial.tent.interior", x: 11, y: 23, drawW: 104, drawH: 78, anchorY: 58, showWhenInsideTent: true });
addProp({ id: "tent_roof", asset: "prop.tutorial.tent", x: 11, y: 23, drawW: 100, drawH: 100, anchorY: 74, hideWhenInsideTent: true });
addProp({ id: "campfire", asset: "prop.tutorial.campfire.standalone", x: 8, y: 22, drawW: 54, drawH: 54, anchorY: 36 });
addProp({ id: "camp_bedroll", asset: "prop.tutorial.bedroll", x: 6, y: 26, drawW: 54, drawH: 44, anchorY: 30 });
addProp({ id: "camp_supplies", asset: "prop.tutorial.supplies", x: 11, y: 26, drawW: 56, drawH: 56, anchorY: 38 });
addProp({ id: "camp_log", asset: "prop.tutorial.log.standalone", x: 13, y: 24, drawW: 78, drawH: 43, anchorY: 28 });

addProp({ id: "emberleaf_1", asset: "prop.tutorial.flowers.standalone", x: 5, y: 23, drawW: 34, drawH: 34, anchorY: 24, pickup: "emberleaf" });
addProp({ id: "emberleaf_2", asset: "prop.tutorial.flowers.standalone", x: 12, y: 27, drawW: 34, drawH: 34, anchorY: 24, pickup: "emberleaf" });
addProp({ id: "emberleaf_3", asset: "prop.tutorial.flowers.standalone", x: 15, y: 22, drawW: 34, drawH: 34, anchorY: 24, pickup: "emberleaf" });

const trees = [
  [3, 4, "prop.tutorial.tree.standalone", 76, 76, 58],
  [6, 3, "prop.tutorial.tree.wind", 86, 86, 64],
  [9, 5, "prop.tutorial.tree.standalone", 74, 74, 56],
  [12, 2, "prop.tutorial.tree.maple.wind", 78, 86, 64],
  [15, 5, "prop.tutorial.tree.standalone", 74, 74, 56],
  [18, 3, "prop.tutorial.tree.pine.wind", 76, 82, 62],
  [21, 6, "prop.tutorial.tree.standalone", 72, 72, 55],
  [4, 9, "prop.tutorial.tree.maple.wind", 78, 86, 64],
  [8, 10, "prop.tutorial.tree.standalone", 72, 72, 55],
  [13, 9, "prop.tutorial.tree.wind", 84, 84, 62],
  [17, 11, "prop.tutorial.tree.standalone", 72, 72, 55],
  [22, 10, "prop.tutorial.tree.pine.wind", 76, 82, 62],
  [27, 7, "prop.tutorial.tree.standalone", 72, 72, 55],
  [32, 8, "prop.tutorial.tree.maple.wind", 78, 86, 64],
  [38, 7, "prop.tutorial.tree.standalone", 72, 72, 55],
  [54, 6, "prop.tutorial.tree.pine.wind", 76, 82, 62],
  [60, 8, "prop.tutorial.tree.standalone", 72, 72, 55],
  [65, 5, "prop.tutorial.tree.wind", 80, 84, 62],
  [19, 31, "prop.tutorial.tree.standalone", 72, 72, 55],
  [29, 36, "prop.tutorial.tree.maple.wind", 78, 86, 64],
  [56, 34, "prop.tutorial.tree.wind", 80, 84, 62],
  [66, 36, "prop.tutorial.tree.standalone", 72, 72, 55]
];

for (const [x, y, asset, drawW, drawH, anchorY] of trees) {
  addProp({ id: `tree_${x}_${y}`, asset, x, y, drawW, drawH, anchorY });
  blockTree(x, y);
}

addProp({ id: "waystone", asset: "prop.tutorial.waystone.standalone", x: 58, y: 26, drawW: 46, drawH: 62, anchorY: 44, script: "waystone" });
addProp({ id: "trail_log", asset: "prop.tutorial.log.standalone", x: 25, y: 18, drawW: 78, drawH: 43, anchorY: 28 });
map.blocked.push([24, 17, 3, 2]);

fs.writeFileSync(outPath, `${JSON.stringify(map, null, 2)}\n`);
console.log(`Wrote ${path.relative(root, outPath)} (${map.width}x${map.height})`);
