import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const read = (file) => JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));

const map = read("data/maps/emberleaf_trail.json");
const scripts = read("data/npc-scripts.json").scripts;
const quests = read("data/quests.json").quests;

const errors = [];
const hasAction = (scriptId, predicate) => (scripts[scriptId] ?? []).some(predicate);
const qTutorial = quests.find((quest) => quest.id === "q-tutorial");

if (!qTutorial) errors.push("Missing tutorial quest q-tutorial");
if (!hasAction("mira-intro", (a) => a.kind === "startQuest" && a.quest === "q-tutorial")) {
  errors.push("Mira intro does not start q-tutorial");
}
if (!hasAction("mira-intro", (a) => a.kind === "advanceQuest" && a.quest === "q-tutorial" && a.stage >= 1)) {
  errors.push("Mira intro does not advance q-tutorial to the leaf objective");
}
if (!hasAction("mira-return", (a) => a.kind === "checkAll" && a.flags?.includes("emberleaf_done") && a.flags?.includes("tutorial_combat_won") && a.goto === "ready")) {
  errors.push("Mira return does not gate completion on Emberleaf plus slime victory");
}
if (!hasAction("mira-return:ready", (a) => a.kind === "completeQuest" && a.quest === "q-tutorial")) {
  errors.push("Mira ready branch does not complete q-tutorial");
}
if (!hasAction("mira-return:ready", (a) => a.kind === "setFlag" && a.flag === "tutorial_complete" && a.value === true)) {
  errors.push("Mira ready branch does not set tutorial_complete");
}

const emberleafProps = (map.props ?? []).filter((prop) => prop.pickup === "emberleaf");
if (emberleafProps.length < 3) errors.push("Tutorial map needs at least three Emberleaf pickups");

const slime = (map.encounters ?? []).find((encounter) => encounter.id === "tutorial_slime");
if (!slime || slime.flag !== "tutorial_combat_won") errors.push("Tutorial slime encounter must set tutorial_combat_won");

const exit = (map.exits ?? []).find((candidate) => candidate.to === "brindlemarket_village");
if (!exit || exit.requires !== "tutorial_complete") errors.push("Village exit must require tutorial_complete");

const blocked = new Set();
for (const [rx, ry, rw, rh] of map.blocked ?? []) {
  for (let y = ry; y < ry + rh; y++) {
    for (let x = rx; x < rx + rw; x++) blocked.add(`${x},${y}`);
  }
}

for (const npc of map.npcs ?? []) {
  if (npc.collision === false) continue;
  blocked.add(`${npc.x},${npc.y}`);
}

function reachableFrom(start) {
  const seen = new Set();
  const queue = [start];
  while (queue.length) {
    const point = queue.shift();
    const key = `${point.x},${point.y}`;
    if (seen.has(key) || blocked.has(key)) continue;
    if (point.x < 0 || point.y < 0 || point.x >= map.width || point.y >= map.height) continue;
    seen.add(key);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      queue.push({ x: point.x + dx, y: point.y + dy });
    }
  }
  return seen;
}

function assertReachable(seen, label, x, y) {
  if (!seen.has(`${x},${y}`)) errors.push(`Unreachable ${label} at ${x},${y}`);
}

const reachable = reachableFrom(map.spawn);
const mira = (map.npcs ?? []).find((npc) => npc.id === "mira");
if (mira) {
  if (mira.collision === false) errors.push("Mira should keep collision enabled");
  if (reachable.has(`${mira.x},${mira.y}`)) errors.push("Mira's tile should be blocked by NPC collision");
  const adjacent = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => reachable.has(`${mira.x + dx},${mira.y + dy}`));
  if (!adjacent) errors.push("Mira cannot be reached for interaction");
} else errors.push("Missing tutorial NPC Mira");

for (const prop of emberleafProps) assertReachable(reachable, `Emberleaf ${prop.id}`, prop.x, prop.y);
if (slime) assertReachable(reachable, "tutorial slime", slime.x, slime.y);
if (exit) assertReachable(reachable, "village exit", exit.x, exit.y);

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log("Tutorial flow validation ok");
