import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = Number(process.env.PORT ?? 8796);
const screenshotPath = path.join(root, process.env.SCREENSHOT ?? "qa-standalone-props.png");
const chromePath = "C:/Program Files/Google/Chrome/Application/chrome.exe";

const mime = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".css": "text/css"
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url ?? "/", `http://127.0.0.1:${port}`);
  const cleanPath = url.pathname === "/" ? "/index.html" : url.pathname;
  const target = path.normalize(path.join(root, cleanPath));
  if (!target.startsWith(root)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }
  fs.readFile(target, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    res.writeHead(200, { "Content-Type": mime[path.extname(target)] ?? "application/octet-stream" });
    res.end(data);
  });
});

await new Promise((resolve) => server.listen(port, "127.0.0.1", resolve));

let browser;
try {
  browser = await chromium.launch({
    headless: true,
    executablePath: fs.existsSync(chromePath) ? chromePath : undefined
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
  const logs = [];
  page.on("console", (msg) => logs.push(`${msg.type()}: ${msg.text()}`));
  page.on("pageerror", (err) => logs.push(`pageerror: ${err.message}`));
  await page.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: "networkidle" });
  await page.waitForTimeout(900);
  const clickCanvas = async (x, y) => {
    const box = await page.locator("canvas").boundingBox();
    await page.mouse.click(box.x + x * box.width / 960, box.y + y * box.height / 640);
  };
  const dragCanvas = async (fromX, fromY, toX, toY) => {
    const box = await page.locator("canvas").boundingBox();
    const sx = box.x + fromX * box.width / 960;
    const sy = box.y + fromY * box.height / 640;
    const tx = box.x + toX * box.width / 960;
    const ty = box.y + toY * box.height / 640;
    await page.mouse.move(sx, sy);
    await page.mouse.down();
    await page.mouse.move(tx, ty, { steps: 12 });
    await page.mouse.up();
  };
  const titleScenes = new Set(["title", "title-transition", "title-town", "title-dungeon", "title-click-new-game", "title-new-game-door-transition", "title-click-continue-no-save"]);
  if (!titleScenes.has(process.env.SCENE)) {
    await page.keyboard.press("Enter");
    await page.waitForTimeout(1400);
  }
  const runScenes = {
    "run-right": { key: "KeyD", dir: "right", prep: [] },
    "run-left": { key: "KeyA", dir: "left", prep: [["KeyD", 700]] },
    "run-up": { key: "KeyW", dir: "up", prep: [["KeyD", 700]] },
    "run-down": { key: "KeyS", dir: "down", prep: [["KeyD", 700], ["KeyW", 700]] }
  };
  if (process.env.SCENE === "title-transition") {
    await page.evaluate(() => { globalThis.__eveDebugState.title.elapsed = 7.7; });
    await page.waitForTimeout(200);
  } else if (process.env.SCENE === "title-click-new-game") {
    await clickCanvas(480, 560);
    await page.waitForTimeout(3800);
  } else if (process.env.SCENE === "title-new-game-door-transition") {
    await clickCanvas(480, 560);
    await page.waitForTimeout(2300);
  } else if (process.env.SCENE === "title-click-continue-no-save") {
    await page.evaluate(() => localStorage.removeItem("eve-rpg-save-v1"));
    await clickCanvas(480, 602);
    await page.waitForTimeout(500);
  } else if (process.env.SCENE === "title-town") {
    await page.evaluate(() => { globalThis.__eveDebugState.title.elapsed = 9.2; });
    await page.waitForTimeout(200);
  } else if (process.env.SCENE === "title-dungeon") {
    await page.evaluate(() => { globalThis.__eveDebugState.title.elapsed = 17.6; });
    await page.waitForTimeout(200);
  } else if (runScenes[process.env.SCENE]) {
    const scene = runScenes[process.env.SCENE];
    for (const [key, ms] of scene.prep) {
      await page.keyboard.down(key);
      await page.waitForTimeout(ms);
      await page.keyboard.up(key);
      await page.waitForTimeout(120);
    }
    await page.keyboard.down(scene.key);
    await page.waitForTimeout(1400);
  } else if (process.env.SCENE === "elara-tall-leader") {
    await page.evaluate(() => {
      const state = globalThis.__eveDebugState;
      state.partyOrder = ["elara", "rowan", "cassian", "nia"];
      state.player.x = 6;
      state.player.y = 8;
      state.player.dir = "down";
      state.followers = [
        { id: "rowan", x: 6, y: 7, dir: "down", stepTimer: 0 },
        { id: "cassian", x: 6, y: 6, dir: "down", stepTimer: 0 },
        { id: "nia", x: 6, y: 5, dir: "down", stepTimer: 0 }
      ];
      state.leaderTrail = Array.from({ length: 80 }, (_, index) => ({ x: 6, y: 8 - index * 0.04, dir: "down" }));
    });
    await page.waitForTimeout(120);
    await page.keyboard.down("KeyS");
    await page.waitForTimeout(900);
    await page.keyboard.up("KeyS");
    await page.waitForTimeout(200);
  } else if (process.env.SCENE === "elara-tall-follower") {
    await page.evaluate(() => {
      const state = globalThis.__eveDebugState;
      state.mode = "world";
      state.transition = null;
      state.partyOrder = ["rowan", "elara", "cassian", "nia"];
      state.player.x = 12;
      state.player.y = 24;
      state.player.dir = "right";
      state.followers = [
        { id: "elara", x: 11, y: 24, dir: "right", stepTimer: 0 },
        { id: "cassian", x: 10, y: 24, dir: "right", stepTimer: 0 },
        { id: "nia", x: 9, y: 24, dir: "right", stepTimer: 0 }
      ];
      state.leaderTrail = Array.from({ length: 80 }, (_, index) => ({ x: 12 - index * 0.04, y: 24, dir: "right" }));
    });
    await page.waitForTimeout(120);
    await page.keyboard.down("KeyD");
    await page.waitForTimeout(900);
    await page.keyboard.up("KeyD");
    await page.waitForTimeout(200);
  } else if (process.env.SCENE === "battle") {
    await page.keyboard.down("KeyD");
    await page.waitForTimeout(2900);
    await page.keyboard.up("KeyD");
    await page.waitForTimeout(700);
  } else if (process.env.SCENE === "menu") {
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);
  } else if (process.env.SCENE === "field-menu-modern") {
    await page.evaluate(() => {
      const state = globalThis.__eveDebugState;
      state.mode = "menu";
      state.menu.index = 1;
    });
    await page.waitForTimeout(200);
  } else if (process.env.SCENE === "inventory-modern") {
    await page.evaluate(() => {
      const state = globalThis.__eveDebugState;
      state.mode = "inventory";
      state.transition = null;
      state.inventory = { potion: 3, ether: 2, bread: 4, stew: 1 };
      state.menu.index = 0;
    });
    await page.waitForTimeout(200);
  } else if (process.env.SCENE === "quests-modern") {
    await page.evaluate(() => {
      const state = globalThis.__eveDebugState;
      state.mode = "quests";
      state.transition = null;
      state.quests = { "q-tutorial": { stage: 1, complete: false }, "q-moonroot-floor1": { stage: 4, complete: false }, "q-moonroot": { stage: 0, complete: false } };
      state.menu.index = 1;
    });
    await page.waitForTimeout(200);
  } else if (process.env.SCENE === "quest-toast") {
    await page.evaluate(() => {
      const state = globalThis.__eveDebugState;
      state.mode = "world";
      state.transition = null;
      state.quests = {};
      state.flags = {};
      globalThis.__eveDebugHooks.startQuest("q-moonroot-floor1");
      globalThis.__eveDebugHooks.advanceQuest("q-moonroot-floor1", 1);
    });
    await page.waitForTimeout(200);
  } else if (process.env.SCENE === "settings-modern") {
    await page.evaluate(() => {
      const state = globalThis.__eveDebugState;
      state.mode = "settings";
      state.transition = null;
      state.menu.index = 0;
      state.audioSettings.master = 0.7;
      state.audioSettings.sfx = 0.8;
      state.audioSettings.ambience = 0.45;
    });
    await page.waitForTimeout(200);
  } else if (process.env.SCENE === "shop-modern") {
    await page.evaluate(() => {
      const state = globalThis.__eveDebugState;
      state.mode = "shop";
      state.shop = { id: "food-shop" };
      state.gold = 30;
      state.menu.index = 0;
    });
    await page.waitForTimeout(200);
  } else if (process.env.SCENE === "menu-clicks") {
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);
    await clickCanvas(188, 194);
    await page.waitForTimeout(200);
  } else if (process.env.SCENE === "quest-log-input") {
    await page.evaluate(() => {
      const state = globalThis.__eveDebugState;
      state.mode = "world";
      state.transition = null;
      state.quests = { "q-tutorial": { stage: 1, complete: false }, "q-moonroot-floor1": { stage: 4, complete: false } };
      state.menu.index = 0;
    });
    await page.waitForTimeout(120);
    await page.keyboard.press("KeyQ");
    await page.waitForTimeout(120);
    await page.keyboard.press("ArrowDown");
    await page.waitForTimeout(200);
  } else if (process.env.SCENE === "shop-click-buy") {
    await page.evaluate(() => {
      const state = globalThis.__eveDebugState;
      state.mode = "shop";
      state.shop = { id: "food-shop" };
      state.gold = 30;
      state.inventory.bread = 0;
      state.menu.index = 0;
    });
    await page.waitForTimeout(120);
    await clickCanvas(260, 214);
    await page.waitForTimeout(250);
  } else if (process.env.SCENE === "combat-click-command") {
    await page.evaluate(() => {
      const state = globalThis.__eveDebugState;
      state.mode = "combat";
      state.transition = null;
      state.menu.index = 0;
      state.party.find((member) => member.id === "rowan").hp = 118;
      state.party.find((member) => member.id === "elara").hp = 86;
      state.party.find((member) => member.id === "cassian").hp = 28;
      state.party.find((member) => member.id === "nia").hp = 92;
      state.combat = {
        encounter: { id: "smoke_training", flag: "smoke_training_won" },
        enemies: [{ id: "training-slime", name: "Training Slime", asset: "enemy.slime.standalone", hp: 28, mp: 0, index: 0, stats: { hp: 28, mp: 0, attack: 7, magic: 0, defense: 2, agility: 4 }, xp: 0, gold: 0 }],
        log: "Smoke combat.",
        menu: "root",
        turnQueue: [],
        turn: { side: "party", id: "rowan" },
        backdrop: "backdrop.battle.dungeon.a",
        boss: false
      };
    });
    await page.waitForTimeout(120);
    await clickCanvas(108, 488);
    await page.waitForTimeout(350);
  } else if (process.env.SCENE === "combat-goblin-facing") {
    await page.evaluate(() => {
      const state = globalThis.__eveDebugState;
      const data = globalThis.__eveDebugData;
      const base = data.enemyById["goblin-scout"];
      state.mode = "combat";
      state.transition = null;
      state.menu.index = 0;
      state.combat = {
        encounter: { id: "smoke_goblin_facing", flag: "smoke_goblin_facing_won" },
        enemies: [{
          ...base,
          index: 0,
          hp: base.stats.hp,
          mp: base.stats.mp,
          stats: base.stats
        }],
        log: "Goblin scout!",
        menu: "root",
        turnQueue: [],
        turn: { side: "party", id: "rowan" },
        backdrop: "backdrop.battle.dungeon.a",
        boss: false
      };
    });
    await page.waitForTimeout(250);
  } else if (process.env.SCENE === "harvest-goblin-loot") {
    await page.evaluate(() => {
      const state = globalThis.__eveDebugState;
      const data = globalThis.__eveDebugData;
      state.transition = null;
      const enemies = [
        { id: "goblin-scout", index: 0, killedByDamageType: "slash", killedByActorId: "rowan" },
        { id: "goblin-grunt", index: 1, killedByDamageType: "blunt", killedByActorId: "rowan" },
        { id: "goblin-trapper", index: 2, killedByDamageType: "fire", killedByActorId: "cassian", killedBySkillId: "ember-bolt" }
      ].map((enemy) => {
        const base = data.enemyById[enemy.id];
        return {
          ...enemy,
          name: base.name,
          asset: base.asset,
          drawW: base.drawW,
          drawH: base.drawH,
          boss: base.boss,
          hp: 0,
          mp: base.stats.mp,
          stats: base.stats,
          xp: base.xp,
          gold: base.gold
        };
      });
      state.mode = "combat";
      state.inventory = {};
      state.loot = { reactionFlags: {} };
      state.combat = {
        encounter: { id: "smoke_goblin_loot", flag: "smoke_goblin_loot_won" },
        enemies,
        log: "Smoke goblin loot.",
        menu: "root",
        turnQueue: [],
        turn: null,
        boss: false
      };
      globalThis.__eveDebugHooks.winCombat();
    });
    await page.waitForTimeout(160);
    const summaryStarted = await page.evaluate(() => globalThis.__eveDebugState?.mode === "combat-summary" && globalThis.__eveDebugState?.combatSummary?.remains?.length === 3);
    if (!summaryStarted) throw new Error("Goblin victory summary did not start after combat");
    await clickCanvas(640, 620);
    await page.waitForTimeout(160);
    const harvestStarted = await page.evaluate(() => globalThis.__eveDebugState?.mode === "harvest" && globalThis.__eveDebugState?.harvest?.remains?.length === 3);
    if (!harvestStarted) throw new Error("Goblin harvest did not start after victory");

    await page.evaluate(() => globalThis.__eveDebugHooks.resolveHarvestForSmoke(0, ["trophy", "pouch"]));
    const scoutReactions = await page.evaluate(() => globalThis.__eveDebugState.harvest.remains[0].result.reactions.length);
    if (scoutReactions !== 1) throw new Error(`Scout clean-ear reaction did not fire once: ${scoutReactions}`);
    await page.evaluate(() => globalThis.__eveDebugHooks.advanceHarvest());

    await page.evaluate(() => globalThis.__eveDebugHooks.resolveHarvestForSmoke(1, ["meat", "trophy"]));
    const gruntReactions = await page.evaluate(() => globalThis.__eveDebugState.harvest.remains[1].result.reactions.length);
    if (gruntReactions !== 1) throw new Error(`Grunt first-meat reaction should fire once: ${gruntReactions}`);
    await page.evaluate(() => globalThis.__eveDebugHooks.advanceHarvest());

    await page.evaluate(() => globalThis.__eveDebugHooks.resolveHarvestForSmoke(2, ["trophy", "meat"]));
    await page.evaluate(() => globalThis.__eveDebugHooks.advanceHarvest());
    await page.waitForFunction(() => globalThis.__eveDebugState.mode === "world");
  } else if (process.env.SCENE === "party-drag-reorder") {
    await page.evaluate(() => {
      const state = globalThis.__eveDebugState;
      state.mode = "party";
      state.menu.index = 0;
    });
    await page.waitForTimeout(120);
    await dragCanvas(205, 225, 575, 225);
    await page.waitForTimeout(250);
  } else if (process.env.SCENE === "party-help-hover") {
    await page.evaluate(() => {
      const state = globalThis.__eveDebugState;
      state.mode = "party";
      state.menu.index = 0;
    });
    await page.waitForTimeout(120);
    const box = await page.locator("canvas").boundingBox();
    await page.mouse.move(box.x + 185 * box.width / 960, box.y + 85 * box.height / 640);
    await page.waitForTimeout(250);
  } else if (process.env.SCENE === "party-profile-elara") {
    await page.evaluate(() => {
      const state = globalThis.__eveDebugState;
      state.mode = "party";
      state.menu.index = 1;
    });
    await page.waitForTimeout(120);
    await clickCanvas(390, 225);
    await page.waitForTimeout(250);
    for (let i = 0; i < 8; i++) await page.mouse.wheel(0, 240);
    await page.waitForTimeout(150);
  } else if (process.env.SCENE === "party-profile-rowan") {
    await page.evaluate(() => {
      const state = globalThis.__eveDebugState;
      state.mode = "party";
      state.transition = null;
      state.menu.index = 0;
      state.pointerUi.partyProfile = { id: "rowan", bioScroll: 0 };
    });
    await page.waitForTimeout(250);
  } else if (process.env.SCENE === "party-profile-cassian") {
    await page.evaluate(() => {
      const state = globalThis.__eveDebugState;
      state.mode = "party";
      state.menu.index = 2;
    });
    await page.waitForTimeout(120);
    await clickCanvas(590, 225);
    await page.waitForTimeout(250);
  } else if (process.env.SCENE === "party-profile-nia") {
    await page.evaluate(() => {
      const state = globalThis.__eveDebugState;
      state.mode = "party";
      state.menu.index = 3;
    });
    await page.waitForTimeout(120);
    await clickCanvas(810, 225);
    await page.waitForTimeout(250);
  } else if (process.env.SCENE === "party-profile-back") {
    await page.evaluate(() => {
      const state = globalThis.__eveDebugState;
      state.mode = "party";
      state.menu.index = 1;
    });
    await page.waitForTimeout(120);
    await clickCanvas(390, 225);
    await page.waitForTimeout(160);
    await clickCanvas(72, 42);
    await page.waitForTimeout(160);
  } else if (process.env.SCENE === "party-menu-drag-reorder") {
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);
    await clickCanvas(188, 194);
    await page.waitForTimeout(200);
    await dragCanvas(205, 225, 575, 225);
    await page.waitForTimeout(250);
  } else if (process.env.SCENE === "settings-slider-drag") {
    await page.evaluate(() => {
      const state = globalThis.__eveDebugState;
      state.mode = "settings";
      state.transition = null;
      state.menu.index = 0;
      state.audioSettings.master = 0.5;
      globalThis.__eveAudio.applySettings(state.audioSettings);
    });
    await page.waitForTimeout(120);
    await dragCanvas(292, 188, 572, 188);
    await page.waitForTimeout(250);
  } else if (process.env.SCENE === "settings-party-display-persist") {
    await page.evaluate(() => {
      localStorage.removeItem("eve-game-settings-v1");
      const state = globalThis.__eveDebugState;
      state.mode = "settings";
      state.transition = null;
      state.menu.index = 3;
      state.gameSettings = { partyDisplayMode: "full" };
    });
    await page.waitForTimeout(120);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(180);
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(900);
    await page.evaluate(() => {
      const state = globalThis.__eveDebugState;
      state.mode = "settings";
      state.transition = null;
      state.menu.index = 3;
    });
    await page.waitForTimeout(180);
  } else if (process.env.SCENE === "rowan-run-left-right") {
    await page.evaluate(() => {
      const state = globalThis.__eveDebugState;
      state.mode = "world";
      state.transition = null;
      state.partyOrder = ["rowan", "elara", "cassian", "nia"];
      state.player.x = 12;
      state.player.y = 24;
      state.player.dir = "right";
      state.followers = [
        { id: "elara", x: 11, y: 24, dir: "right", stepTimer: 0 },
        { id: "cassian", x: 10, y: 24, dir: "right", stepTimer: 0 },
        { id: "nia", x: 9, y: 24, dir: "right", stepTimer: 0 }
      ];
      state.leaderTrail = Array.from({ length: 80 }, (_, index) => ({ x: 12 - index * 0.04, y: 24, dir: "right" }));
    });
    await page.waitForTimeout(120);
    await page.keyboard.down("KeyD");
    await page.waitForTimeout(900);
    await page.keyboard.up("KeyD");
    await page.waitForTimeout(150);
    await page.keyboard.down("KeyA");
    await page.waitForTimeout(900);
    await page.keyboard.up("KeyA");
    await page.waitForTimeout(250);
  } else if (process.env.SCENE === "pickup") {
    await page.keyboard.down("KeyD");
    await page.waitForTimeout(520);
    await page.keyboard.up("KeyD");
    await page.keyboard.down("KeyW");
    await page.waitForTimeout(260);
    await page.keyboard.up("KeyW");
    await page.keyboard.down("KeyD");
    await page.waitForTimeout(520);
    await page.keyboard.up("KeyD");
    await page.waitForTimeout(500);
  } else if (process.env.SCENE === "thorn") {
    await page.keyboard.down("KeyD");
    await page.waitForTimeout(2900);
    await page.keyboard.up("KeyD");
    await page.waitForTimeout(700);
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press("Enter");
      await page.waitForTimeout(650);
    }
    await page.keyboard.down("KeyD");
    await page.waitForTimeout(1800);
    await page.keyboard.up("KeyD");
    await page.waitForTimeout(700);
  } else if (process.env.SCENE === "zoom-in") {
    await page.mouse.wheel(0, -900);
    await page.waitForTimeout(300);
  } else if (process.env.SCENE === "zoom-out") {
    await page.mouse.wheel(0, 1200);
    await page.waitForTimeout(300);
  } else if (process.env.SCENE === "tent") {
    await page.evaluate(() => {
      const state = globalThis.__eveDebugState;
      state.player.x = 11;
      state.player.y = 23;
      state.player.dir = "down";
      state.followers = [];
    });
    await page.waitForTimeout(500);
  } else if (process.env.SCENE === "forest") {
    await page.evaluate(() => {
      const state = globalThis.__eveDebugState;
      state.player.x = 12;
      state.player.y = 11;
      state.player.dir = "down";
      state.followers = [];
    });
    await page.waitForTimeout(500);
  } else if (process.env.SCENE === "village-default") {
    await page.evaluate(() => {
      const state = globalThis.__eveDebugState;
      state.mapId = "brindlemarket_village";
      state.player.x = 40;
      state.player.y = 30;
      state.player.dir = "down";
      state.followers = [];
    });
    await page.waitForTimeout(500);
  } else if (process.env.SCENE === "village-market") {
    await page.evaluate(() => {
      const state = globalThis.__eveDebugState;
      state.mapId = "brindlemarket_village";
      state.player.x = 31;
      state.player.y = 28;
      state.player.dir = "down";
      state.followers = [];
    });
    await page.waitForTimeout(500);
  } else if (process.env.SCENE === "village-gate") {
    await page.evaluate(() => {
      const state = globalThis.__eveDebugState;
      state.mapId = "brindlemarket_village";
      state.player.x = 76;
      state.player.y = 11;
      state.player.dir = "right";
      state.followers = [];
      state.flags.quest_q_moonroot_started = true;
    });
    await page.waitForTimeout(500);
  } else if (process.env.SCENE === "village-npc-idles") {
    await page.evaluate(() => {
      const state = globalThis.__eveDebugState;
      state.mode = "world";
      state.mapId = "brindlemarket_village";
      state.player.x = 66;
      state.player.y = 11;
      state.player.dir = "right";
      state.followers = [];
      state.cameraZoom = 0.85;
      state.flags.quest_q_moonroot_started = true;
    });
    await page.waitForTimeout(600);
  } else if (process.env.SCENE === "map-outside-dungeon") {
    await page.evaluate(() => {
      const state = globalThis.__eveDebugState;
      state.mode = "world";
      state.mapId = "brindlemarket_village";
      state.player.x = 40;
      state.player.y = 30;
      state.player.dir = "down";
      state.followers = [];
      state.toast = "";
      state.toastTimer = 0;
    });
    await page.keyboard.press("KeyM");
    await page.waitForTimeout(250);
  } else if (process.env.SCENE === "village-building") {
    await page.evaluate(() => {
      const state = globalThis.__eveDebugState;
      state.mapId = "brindlemarket_village";
      state.player.x = 23;
      state.player.y = 21;
      state.player.dir = "down";
      state.followers = [];
    });
    await page.waitForTimeout(500);
  } else if (process.env.SCENE === "village-streets") {
    await page.evaluate(() => {
      const state = globalThis.__eveDebugState;
      state.mapId = "brindlemarket_village";
      state.player.x = 2;
      state.player.y = 26;
      state.player.dir = "right";
      state.followers = [
        { id: "elara", x: 1, y: 26, dir: "right", stepTimer: 0 },
        { id: "cassian", x: 1, y: 27, dir: "right", stepTimer: 0 },
        { id: "nia", x: 2, y: 27, dir: "right", stepTimer: 0 }
      ];
      state.leaderTrail = Array.from({ length: 32 }, (_, index) => ({ x: Math.max(1, 2 - index), y: 26, dir: "right" }));
    });
    await page.keyboard.down("KeyD");
    await page.waitForTimeout(1600);
    await page.keyboard.up("KeyD");
    await page.waitForTimeout(300);
  } else if (process.env.SCENE === "village-zoom-in" || process.env.SCENE === "village-zoom-out") {
    await page.evaluate(() => {
      const state = globalThis.__eveDebugState;
      state.mapId = "brindlemarket_village";
      state.player.x = 40;
      state.player.y = 30;
      state.player.dir = "down";
      state.followers = [];
      state.cameraZoom = 1;
    });
    await page.mouse.wheel(0, process.env.SCENE === "village-zoom-in" ? -900 : 1200);
    await page.waitForTimeout(300);
  } else if (process.env.SCENE === "village-exits") {
    await page.evaluate(() => {
      const state = globalThis.__eveDebugState;
      state.mapId = "brindlemarket_village";
      state.player.x = 78;
      state.player.y = 11;
      state.player.dir = "right";
      state.followers = [];
      state.flags.quest_q_moonroot_started = true;
    });
    await page.keyboard.down("KeyD");
    await page.waitForTimeout(360);
    await page.keyboard.up("KeyD");
    await page.waitForTimeout(180);
    const moonMap = await page.evaluate(() => globalThis.__eveDebugState?.mapId);
    if (moonMap !== "moonroot_hollow") throw new Error(`Village moon gate exit failed: ${moonMap}`);
    await page.evaluate(() => {
      const state = globalThis.__eveDebugState;
      state.mapId = "brindlemarket_village";
      state.player.x = 1;
      state.player.y = 26;
      state.player.dir = "left";
      state.followers = [];
    });
    await page.keyboard.down("KeyA");
    await page.waitForTimeout(360);
    await page.keyboard.up("KeyA");
    await page.waitForTimeout(180);
    const westMap = await page.evaluate(() => globalThis.__eveDebugState?.mapId);
    if (westMap !== "emberleaf_trail") throw new Error(`Village west gate exit failed: ${westMap}`);
  } else if (process.env.SCENE === "dungeon-floor1") {
    await page.evaluate(() => {
      const state = globalThis.__eveDebugState;
      state.mode = "world";
      state.transition = null;
      state.mapId = "moonroot_hollow";
      state.player.x = 18;
      state.player.y = 36;
      state.player.dir = "up";
      state.followers = [];
      state.doorStates = {};
      state.flags.quest_q_moonroot_started = true;
    });
    await page.waitForTimeout(500);
  } else if (process.env.SCENE === "dungeon-prop-collision") {
    await page.evaluate(() => {
      const state = globalThis.__eveDebugState;
      state.mode = "world";
      state.transition = null;
      state.mapId = "moonroot_hollow";
      state.player.x = 19.35;
      state.player.y = 12.2;
      state.player.dir = "right";
      state.followers = [];
      state.flags = { quest_q_moonroot_started: true };
      state.doorStates = {};
    });
    await page.keyboard.down("KeyD");
    await page.waitForTimeout(900);
    await page.keyboard.up("KeyD");
    await page.waitForTimeout(120);
    const blockedByStack = await page.evaluate(() => globalThis.__eveDebugState.player.x);
    if (blockedByStack > 20.18) throw new Error(`Supply stack collision failed, player reached x=${blockedByStack}`);
    await page.evaluate(() => {
      const state = globalThis.__eveDebugState;
      state.player.x = 34.1;
      state.player.y = 5.1;
      state.player.dir = "right";
      state.flags.pickup_moonroot_hollow_prop_floor_1_broken_pack = true;
    });
    await page.keyboard.down("KeyD");
    await page.waitForTimeout(900);
    await page.keyboard.up("KeyD");
    await page.waitForTimeout(120);
  } else if (process.env.SCENE === "trap-effects") {
    await page.evaluate(() => {
      const state = globalThis.__eveDebugState;
      state.mode = "world";
      state.transition = null;
      state.mapId = "moonroot_hollow";
      state.player.x = 18;
      state.player.y = 13;
      state.player.dir = "up";
      state.followers = [];
      state.worldEffects = [];
      state.flags = { quest_q_moonroot_started: true };
      state.quests = { "q-moonroot-floor1": { stage: 2, complete: false } };
    });
    await page.waitForTimeout(180);
  } else if (process.env.SCENE === "quest-indicators") {
    await page.evaluate(() => {
      const state = globalThis.__eveDebugState;
      state.mode = "world";
      state.transition = null;
      state.mapId = "moonroot_hollow";
      state.player.x = 24;
      state.player.y = 34;
      state.player.dir = "up";
      state.followers = [];
      state.flags = { quest_q_moonroot_started: true };
      state.quests = {};
    });
    await page.waitForTimeout(160);
  } else if (process.env.SCENE === "npc-dialogue-flow") {
    await page.evaluate(() => {
      const state = globalThis.__eveDebugState;
      state.mode = "world";
      state.transition = null;
      state.mapId = "moonroot_hollow";
      state.player.x = 24;
      state.player.y = 35;
      state.player.dir = "up";
      state.followers = [];
      state.flags = { quest_q_moonroot_started: true };
      state.quests = {};
      state.dialogue = null;
      state.npcDialogue = null;
      state.scriptQueue = [];
    });
    await page.keyboard.press("Enter");
    await page.waitForTimeout(120);
    const menu = await page.evaluate(() => ({
      mode: globalThis.__eveDebugState.mode,
      npcMode: globalThis.__eveDebugState.npcDialogue?.mode,
      labels: globalThis.__eveDebugState.npcDialogue?.options?.map((option) => option.label)
    }));
    if (menu.mode !== "dialogue" || menu.npcMode !== "menu" || menu.labels?.join("|") !== "Talk|Rumours|Inspect|Quest: Floor One Field Lessons") {
      throw new Error(`NPC dialogue menu failed: ${JSON.stringify(menu)}`);
    }
    await page.keyboard.press("Enter");
    await page.waitForTimeout(80);
    const firstTalk = await page.evaluate(() => ({
      lineKind: globalThis.__eveDebugState.npcDialogue?.lineKind,
      index: globalThis.__eveDebugState.npcDialogue?.lineIndex,
      text: globalThis.__eveDebugState.dialogue?.text
    }));
    if (firstTalk.lineKind !== "talk" || firstTalk.index !== 0 || !firstTalk.text?.includes("maps")) {
      throw new Error(`NPC talk first line failed: ${JSON.stringify(firstTalk)}`);
    }
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press("Enter");
      await page.waitForTimeout(40);
    }
    const afterTalk = await page.evaluate(() => ({
      npcMode: globalThis.__eveDebugState.npcDialogue?.mode,
      dialogue: globalThis.__eveDebugState.dialogue
    }));
    if (afterTalk.npcMode !== "menu" || afterTalk.dialogue) throw new Error(`NPC talk did not return to menu: ${JSON.stringify(afterTalk)}`);
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await page.waitForTimeout(80);
    const rumour = await page.evaluate(() => globalThis.__eveDebugState.dialogue?.text);
    if (!rumour?.includes("RUMOUR PLACEHOLDER")) throw new Error(`NPC rumour placeholder failed: ${rumour}`);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(60);
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await page.waitForTimeout(80);
    const inspect = await page.evaluate(() => globalThis.__eveDebugState.dialogue?.text);
    if (inspect !== "Inspect details are not written yet.") throw new Error(`NPC inspect placeholder failed: ${inspect}`);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(60);
    await clickCanvas(360, 566);
    await page.waitForTimeout(80);
    const questStart = await page.evaluate(() => globalThis.__eveDebugState.dialogue?.text);
    if (!questStart?.includes("Chalk means")) throw new Error(`NPC quest click did not start script: ${questStart}`);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(80);
    const quest = await page.evaluate(() => ({
      stage: globalThis.__eveDebugState.quests?.["q-moonroot-floor1"]?.stage,
      text: globalThis.__eveDebugState.dialogue?.text
    }));
    if (quest.stage !== 1 || !quest.text?.includes("Field lesson")) throw new Error(`NPC quest script failed: ${JSON.stringify(quest)}`);
  } else if (process.env.SCENE === "npc-dialogue-shop") {
    await page.evaluate(() => {
      const state = globalThis.__eveDebugState;
      state.mode = "world";
      state.transition = null;
      state.mapId = "moonroot_hollow";
      state.player.x = 37;
      state.player.y = 36;
      state.player.dir = "up";
      state.followers = [];
      state.flags = { quest_q_moonroot_started: true };
      state.quests = {};
      state.dialogue = null;
      state.npcDialogue = null;
      state.scriptQueue = [];
    });
    await page.keyboard.press("Enter");
    await page.waitForTimeout(120);
    const menu = await page.evaluate(() => globalThis.__eveDebugState.npcDialogue?.options?.map((option) => option.label));
    if (menu?.join("|") !== "Talk|Rumours|Inspect|Shop") throw new Error(`NPC shop menu failed: ${JSON.stringify(menu)}`);
    await clickCanvas(360, 566);
    await page.waitForTimeout(80);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(120);
    const shop = await page.evaluate(() => ({ mode: globalThis.__eveDebugState.mode, shop: globalThis.__eveDebugState.shop?.id }));
    if (shop.mode !== "shop" || shop.shop !== "item-shop") throw new Error(`NPC shop option failed: ${JSON.stringify(shop)}`);
  } else if (process.env.SCENE === "floor1-guard-quest-gate") {
    await page.evaluate(() => {
      const state = globalThis.__eveDebugState;
      state.mode = "world";
      state.transition = null;
      state.mapId = "moonroot_hollow";
      state.player.x = 49;
      state.player.y = 6;
      state.player.dir = "right";
      state.followers = [];
      state.flags = { quest_q_moonroot_started: true };
      state.quests = { "q-moonroot-floor1": { stage: 6, complete: false } };
    });
    await page.keyboard.press("Enter");
    await page.waitForTimeout(120);
    await clickCanvas(360, 566);
    await page.waitForTimeout(120);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(120);
    const early = await page.evaluate(() => ({
      text: globalThis.__eveDebugState.dialogue?.text,
      complete: globalThis.__eveDebugState.quests?.["q-moonroot-floor1"]?.complete,
      flag: Boolean(globalThis.__eveDebugState.flags?.quest_q_moonroot_floor1_complete)
    }));
    if (!early.text?.includes("root-cracked shrine") || early.complete || early.flag) {
      throw new Error(`Descent Guard early gate failed: ${JSON.stringify(early)}`);
    }
    await page.keyboard.press("Escape");
    await page.waitForTimeout(80);
    await page.evaluate(() => {
      const state = globalThis.__eveDebugState;
      state.mode = "world";
      state.dialogue = null;
      state.npcDialogue = null;
      state.scriptQueue = [];
      state.flags = { quest_q_moonroot_started: true };
      state.quests = { "q-moonroot-floor1": { stage: 7, complete: false } };
    });
    await page.keyboard.press("Enter");
    await page.waitForTimeout(120);
    await clickCanvas(360, 566);
    await page.waitForTimeout(120);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(120);
  } else if (process.env.SCENE === "dungeon-floor2") {
    await page.evaluate(() => {
      const state = globalThis.__eveDebugState;
      state.mode = "world";
      state.transition = null;
      state.mapId = "moonroot_floor_2";
      state.player.x = 44;
      state.player.y = 16;
      state.player.dir = "down";
      state.followers = [
        { id: "elara", x: 43, y: 16, dir: "down", stepTimer: 0 },
        { id: "cassian", x: 42, y: 16, dir: "down", stepTimer: 0 }
      ];
      state.doorStates = {};
      state.flags.quest_q_moonroot_started = true;
    });
    await page.waitForTimeout(500);
  } else if (process.env.SCENE === "dungeon-floor1-visitor") {
    await page.evaluate(() => {
      const state = globalThis.__eveDebugState;
      state.mode = "world";
      state.mapId = "moonroot_hollow";
      state.player.x = 21;
      state.player.y = 12;
      state.player.dir = "right";
      state.followers = [];
      state.doorStates = {};
      state.npcStates = {};
      state.flags.quest_q_moonroot_started = true;
    });
    await page.waitForTimeout(500);
  } else if (process.env.SCENE === "dungeon-floor1-goblin-patrol") {
    await page.evaluate(() => {
      const state = globalThis.__eveDebugState;
      state.mode = "world";
      state.mapId = "moonroot_hollow";
      state.player.x = 49;
      state.player.y = 10;
      state.player.dir = "right";
      state.followers = [];
      state.doorStates = {};
      state.npcStates = {};
      state.flags.quest_q_moonroot_started = true;
    });
    await page.waitForTimeout(1700);
  } else if (process.env.SCENE === "dungeon-map-open") {
    await page.evaluate(() => {
      const state = globalThis.__eveDebugState;
      state.mode = "world";
      state.mapId = "moonroot_hollow";
      state.player.x = 2;
      state.player.y = 8;
      state.player.dir = "right";
      state.followers = [];
      state.dungeon.mappedRegions = {};
      state.dungeon.explored = {};
      state.dungeon.currentRegion = {};
      state.flags.quest_q_moonroot_started = true;
    });
    await page.waitForTimeout(250);
    await page.keyboard.press("KeyM");
    await page.waitForTimeout(350);
  } else if (process.env.SCENE === "dungeon-map-progressive") {
    await page.evaluate(() => {
      const state = globalThis.__eveDebugState;
      state.mode = "world";
      state.mapId = "moonroot_hollow";
      state.player.x = 2;
      state.player.y = 8;
      state.player.dir = "right";
      state.followers = [];
      state.dungeon.mappedRegions = {};
      state.dungeon.explored = {};
      state.dungeon.currentRegion = {};
      state.flags.quest_q_moonroot_started = true;
    });
    await page.waitForTimeout(250);
    await page.evaluate(() => {
      const state = globalThis.__eveDebugState;
      globalThis.__mapBefore = [...(state.dungeon.mappedRegions.moonroot_hollow ?? [])].sort();
      state.player.x = 18;
      state.player.y = 8;
    });
    await page.waitForTimeout(250);
    await page.keyboard.press("KeyM");
    await page.waitForTimeout(350);
  } else if (process.env.SCENE === "dungeon-fog-structural") {
    await page.evaluate(() => {
      const state = globalThis.__eveDebugState;
      state.mode = "world";
      state.mapId = "moonroot_hollow";
      state.player.x = 18;
      state.player.y = 8;
      state.player.dir = "right";
      state.followers = [];
      state.doorStates = {};
      state.flags.quest_q_moonroot_started = true;
    });
    await page.waitForTimeout(500);
  } else if (process.env.SCENE === "dungeon-floor1-door") {
    await page.evaluate(() => {
      const state = globalThis.__eveDebugState;
      state.mode = "world";
      state.transition = null;
      state.mapId = "moonroot_hollow";
      state.player.x = 37;
      state.player.y = 13;
      state.player.dir = "right";
      state.followers = [];
      state.doorStates = {};
      state.flags.quest_q_moonroot_started = true;
    });
    await page.waitForTimeout(120);
    await page.keyboard.down("KeyD");
    await page.waitForTimeout(3000);
    await page.keyboard.up("KeyD");
    await page.waitForTimeout(250);
  } else if (process.env.SCENE === "dungeon-floor1-door-reveal") {
    await page.evaluate(() => {
      const state = globalThis.__eveDebugState;
      state.mode = "world";
      state.mapId = "moonroot_hollow";
      state.player.x = 26;
      state.player.y = 17;
      state.player.dir = "down";
      state.followers = [];
      state.doorStates = {};
      state.flags.quest_q_moonroot_started = true;
    });
    await page.waitForTimeout(500);
  } else if (process.env.SCENE === "dungeon-floor1-door-hidden") {
    await page.evaluate(() => {
      const state = globalThis.__eveDebugState;
      state.mode = "world";
      state.mapId = "moonroot_hollow";
      state.player.x = 42;
      state.player.y = 13;
      state.player.dir = "left";
      state.followers = [];
      state.doorStates = {};
      state.flags.quest_q_moonroot_started = true;
    });
    await page.waitForTimeout(500);
  } else if (process.env.SCENE === "dungeon-floor11") {
    await page.evaluate(() => {
      const state = globalThis.__eveDebugState;
      state.mode = "world";
      state.mapId = "moonroot_floor_11";
      state.player.x = 7;
      state.player.y = 14;
      state.player.dir = "right";
      state.followers = [];
      state.flags.boss_floor_10_won = true;
    });
    await page.waitForTimeout(500);
  } else if (process.env.SCENE === "dungeon-pitfall") {
    await page.evaluate(() => {
      const state = globalThis.__eveDebugState;
      const map = globalThis.__eveDebugData.maps.moonroot_floor_8;
      const trap = map.traps.find((candidate) => candidate.type === "pitfall");
      state.mode = "world";
      state.mapId = "moonroot_floor_8";
      state.player.x = trap.x;
      state.player.y = trap.y;
      state.player.dir = "right";
      state.followers = [];
      state.flags = { ...state.flags };
      state.flags.boss_floor_10_won = false;
    });
    await page.waitForTimeout(500);
  } else if (process.env.SCENE === "dungeon-boss-gate") {
    await page.evaluate(() => {
      const state = globalThis.__eveDebugState;
      state.mode = "world";
      state.mapId = "moonroot_floor_10";
      state.player.x = 62;
      state.player.y = 15;
      state.player.dir = "right";
      state.followers = [];
      delete state.flags.boss_floor_10_won;
    });
    await page.keyboard.down("KeyD");
    await page.waitForTimeout(450);
    await page.keyboard.up("KeyD");
    await page.waitForTimeout(250);
  } else if (process.env.SCENE === "party-display-door-proximity") {
    await page.evaluate(() => {
      const state = globalThis.__eveDebugState;
      state.mode = "world";
      state.transition = null;
      state.mapId = "moonroot_hollow";
      state.gameSettings = { partyDisplayMode: "leader" };
      state.partyOrder = ["rowan", "elara", "cassian", "nia"];
      state.player.x = 18;
      state.player.y = 17;
      state.player.dir = "up";
      state.followers = [
        { id: "elara", x: 19, y: 15, dir: "up", stepTimer: 0 },
        { id: "cassian", x: 19, y: 16, dir: "up", stepTimer: 0 },
        { id: "nia", x: 18, y: 16, dir: "up", stepTimer: 0 }
      ];
      state.leaderTrail = Array.from({ length: 80 }, (_, index) => ({ x: 18, y: 17 + index * 0.04, dir: "up" }));
      state.doorStates = { moonroot_hollow: {} };
    });
    await page.waitForTimeout(300);
  }
  await page.screenshot({ path: screenshotPath, fullPage: true });
  const result = await page.evaluate(() => {
    const canvas = document.querySelector("canvas");
    const context = canvas?.getContext("2d");
    const data = context?.getImageData(0, 0, canvas.width, canvas.height).data;
    let nonBlack = 0;
    let magenta = 0;
    let hudDark = 0;
    if (data) {
      for (let i = 0, pixel = 0; i < data.length; i += 4, pixel++) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const x = pixel % canvas.width;
        const y = Math.floor(pixel / canvas.width);
        if (r + g + b > 32) nonBlack++;
        if (r > 230 && g < 40 && b > 230) magenta++;
        if (x >= 632 && x < 952 && y >= 14 && y < 146 && r < 70 && g < 80 && b < 110) hudDark++;
      }
    }
    return {
      canvasCount: document.querySelectorAll("canvas").length,
      shellElementCount: document.body.querySelectorAll("button,input,select,textarea,nav,main,section").length,
      nonBlack,
      magenta,
      hudDark,
      save: localStorage.getItem("eve-rpg-save-v1")
    };
  });
  if (result.canvasCount !== 1) throw new Error(`Expected one canvas, saw ${result.canvasCount}`);
  if (result.shellElementCount !== 0) throw new Error(`Gameplay shell leaked DOM controls: ${result.shellElementCount}`);
  if (result.nonBlack < 5000) throw new Error(`Canvas appears blank: nonBlack=${result.nonBlack}; logs=${logs.join(" | ")}`);
  if (result.magenta > 250) throw new Error(`Chroma-key magenta remains visible: ${result.magenta}`);
  if (process.env.SCENE === "pickup") {
    const state = await page.evaluate(() => globalThis.__eveDebugState);
    if ((state?.inventory?.emberleaf ?? 0) < 1) throw new Error("Standing near Emberleaf did not pick it up");
  }
  if (runScenes[process.env.SCENE]) {
    const expected = runScenes[process.env.SCENE].dir;
    const state = await page.evaluate(() => globalThis.__eveDebugState);
    if (state?.player?.dir !== expected) throw new Error(`Leader direction ${state?.player?.dir} did not match ${expected}`);
    const followerDirs = (state?.followers ?? []).map((follower) => follower.dir);
    if (followerDirs.some((dir) => !["up", "down", "left", "right"].includes(dir))) throw new Error(`Bad follower directions: ${followerDirs.join(",")}`);
  }
  if (process.env.SCENE === "zoom-in" || process.env.SCENE === "zoom-out") {
    const zoom = await page.evaluate(() => globalThis.__eveDebugState?.cameraZoom);
    const expected = process.env.SCENE === "zoom-in" ? 1.1 : 0.9;
    if (Math.abs(zoom - expected) > 0.01) throw new Error(`Unexpected zoom ${zoom}, expected ${expected}`);
  }
  if (process.env.SCENE === "village-zoom-in" || process.env.SCENE === "village-zoom-out") {
    const zoom = await page.evaluate(() => globalThis.__eveDebugState?.cameraZoom);
    const expected = process.env.SCENE === "village-zoom-in" ? 1.1 : 0.9;
    if (Math.abs(zoom - expected) > 0.01) throw new Error(`Unexpected village zoom ${zoom}, expected ${expected}`);
  }
  if (process.env.SCENE === "tent") {
    const insideTent = await page.evaluate(() => globalThis.__eveDebugState?.insideTent);
    if (!insideTent) throw new Error("Tent interior did not activate while standing inside tent rect");
  }
  if (process.env.SCENE === "village-building") {
    const insideBuildingId = await page.evaluate(() => globalThis.__eveDebugState?.insideBuildingId);
    if (insideBuildingId !== "pippas-provisions") throw new Error(`Building roof did not hide for Pippa's Provisions: ${insideBuildingId}`);
  }
  if (process.env.SCENE === "village-streets") {
    const state = await page.evaluate(() => globalThis.__eveDebugState);
    if (state?.mapId !== "brindlemarket_village" || state?.player?.x < 8) throw new Error(`Village street traversal failed: ${state?.mapId} x=${state?.player?.x}`);
    const badFollower = (state?.followers ?? []).find((follower) => follower.x < 0 || follower.y < 0 || follower.x >= 80 || follower.y >= 54);
    if (badFollower) throw new Error(`Follower left village bounds: ${JSON.stringify(badFollower)}`);
  }
  if (process.env.SCENE === "village-npc-idles") {
    const npcSprites = await page.evaluate(() => {
      const manifest = globalThis.__eveDebugData.assets;
      const map = globalThis.__eveDebugData.maps.brindlemarket_village;
      const ids = ["gate_guard", "supply_clerk", "rumor_merchant"];
      return ids.map((id) => {
        const npc = map.npcs.find((candidate) => candidate.id === id);
        const asset = manifest.npc_sprites?.[id]?.idle;
        const image = manifest.images?.[asset];
        return { id, asset, drawW: npc?.drawW, drawH: npc?.drawH, anchorY: npc?.anchorY, frameW: image?.animation?.frame_width, frameH: image?.animation?.frame_height, frames: image?.animation?.frames };
      });
    });
    if (npcSprites.some((row) => !row.asset || row.drawW !== 86 || row.drawH !== 138 || row.anchorY !== 103 || row.frameW !== 96 || row.frameH !== 128 || row.frames !== 4)) {
      throw new Error(`Village NPC idle overrides failed: ${JSON.stringify(npcSprites)}`);
    }
  }
  if (process.env.SCENE === "map-outside-dungeon") {
    const state = await page.evaluate(() => globalThis.__eveDebugState);
    if (state?.mode !== "world" || state?.toast !== "No dungeon map here.") throw new Error(`Outside dungeon map key failed: mode=${state?.mode} toast=${state?.toast}`);
  }
  if (process.env.SCENE === "dungeon-map-open") {
    const state = await page.evaluate(() => globalThis.__eveDebugState);
    const mapped = state?.dungeon?.mappedRegions?.moonroot_hollow ?? [];
    if (state?.mode !== "map" || !mapped.includes("spawn_hall")) throw new Error(`Dungeon map did not open with spawn mapped: mode=${state?.mode} mapped=${mapped.join(",")}`);
    await page.keyboard.press("KeyM");
    await page.waitForTimeout(100);
    const toggled = await page.evaluate(() => globalThis.__eveDebugState?.mode);
    if (toggled !== "world") throw new Error(`Dungeon map did not close with M: ${toggled}`);
    await page.keyboard.press("KeyM");
    await page.waitForTimeout(100);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(100);
    const closed = await page.evaluate(() => globalThis.__eveDebugState?.mode);
    if (closed !== "world") throw new Error(`Dungeon map did not close with Escape: ${closed}`);
  }
  if (process.env.SCENE === "dungeon-map-progressive") {
    const progress = await page.evaluate(() => ({
      before: globalThis.__mapBefore ?? [],
      after: [...(globalThis.__eveDebugState.dungeon.mappedRegions.moonroot_hollow ?? [])].sort(),
      mode: globalThis.__eveDebugState.mode
    }));
    if (progress.mode !== "map" || !progress.before.includes("spawn_hall") || progress.before.includes("room_1") || !progress.after.includes("room_1") || progress.after.includes("room_2")) {
      throw new Error(`Dungeon map progressive discovery failed: ${JSON.stringify(progress)}`);
    }
  }
  if (process.env.SCENE === "dungeon-fog-structural") {
    const structural = await page.evaluate(() => {
      const map = globalThis.__eveDebugData.maps.moonroot_hollow;
      const cells = globalThis.__eveRenderer.dungeonStructuralFogCells(map);
      const top = map.dungeonLayers.wallTops.find((tile) => tile.id.startsWith("wall_top_"));
      const side = map.dungeonLayers.wallSides.find((tile) => tile.id.startsWith("wall_edge_"));
      const face = map.dungeonLayers.sortables.find((item) => item.group === "wallFace");
      const door = map.doors.find((item) => item.id === "room_2_entry_west");
      return {
        top: top && cells.has(`${top.x},${top.y}`),
        side: side && cells.has(`${side.x},${side.y}`),
        face: face && cells.has(`${face.x},${face.y}`) && cells.has(`${face.x},${face.y + 1}`),
        door: door && cells.has(`${door.x},${door.y}`)
      };
    });
    if (!structural.top || !structural.side || !structural.face || !structural.door) throw new Error(`Dungeon fog structural exemptions failed: ${JSON.stringify(structural)}`);
  }
  if (process.env.SCENE === "dungeon-floor1") {
    const state = await page.evaluate(() => globalThis.__eveDebugState);
    if (state?.mapId !== "moonroot_hollow") throw new Error(`Dungeon floor 1 did not render: ${state?.mapId}`);
    const size = await page.evaluate(() => {
      const map = globalThis.__eveDebugData.maps.moonroot_hollow;
      return `${map.width}x${map.height}`;
    });
    if (size !== "63x45") throw new Error(`Dungeon floor 1 has wrong size: ${size}`);
    const semantic = await page.evaluate(() => {
      const map = globalThis.__eveDebugData.maps.moonroot_hollow;
      const manifest = globalThis.__eveDebugData.assets;
      const walkable = new Set(["FLOOR", "DOOR_OPEN", "PIT", "STAIRS_DOWN", "CHEST", "TRAP_SPIKES", "TRAP_GAS", "TRAP_FALSE_FLOOR"]);
      const expectedFloor1Idles = {
        npc_floor_1_quartermaster: "npc.moonroot.floor1.sella.idle",
        npc_floor_1_mapper: "npc.moonroot.floor1.mapper.idle",
        npc_floor_1_cook: "npc.moonroot.floor1.marlo.idle",
        npc_floor_1_wounded_delver: "npc.moonroot.floor1.wounded_delver.idle",
        npc_floor_1_rookie: "npc.moonroot.floor1.rookie.idle",
        npc_floor_1_descent_guard: "npc.moonroot.floor1.descent_guard.idle"
      };
      const thresholdWallCoords = (threshold) => {
        const coords = [];
        const length = threshold.length ?? 1;
        for (let offset = 0; offset < length; offset++) {
          const x = threshold.orientation === "ew" ? threshold.x + offset : threshold.x;
          const y = threshold.orientation === "ns" ? threshold.y + offset : threshold.y;
          if (threshold.orientation === "ns") coords.push([x - 1, y], [x + 1, y]);
          else coords.push([x, y - 1], [x, y + 1]);
        }
        return coords;
      };
      const thresholdCenterCoords = (threshold) => Array.from({ length: threshold.length ?? 1 }, (_, offset) => [
        threshold.orientation === "ew" ? threshold.x + offset : threshold.x,
        threshold.orientation === "ns" ? threshold.y + offset : threshold.y
      ]);
      const insideRoom = (door) => map.rooms.some((room) => {
        const [x, y, w, h] = room.rect;
        return door.x >= x && door.y >= y && door.x < x + w && door.y < y + h;
      });
      const doorRegions = new Set(map.doors?.map((door) => door.region));
      const thresholdRegions = new Set(map.openThresholds?.map((threshold) => threshold.region));
      const wall = map.semanticTiles
        .flatMap((row, y) => row.map((tile, x) => ({ tile, x, y })))
        .find((cell) => cell.tile === "WALL" && walkable.has(map.semanticTiles[cell.y + 1]?.[cell.x]));
      const face = map.dungeonLayers.sortables.find((item) => item.id === `wall_face_${wall.x}_${wall.y}`);
      const top = map.dungeonLayers.wallTops.find((item) => item.id === `wall_top_${wall.x}_${wall.y}`);
      return {
        hasLayers: Boolean(map.dungeonLayers),
        blocked: map.blockedTiles.some(([x, y]) => x === wall.x && y === wall.y),
        faceAtWall: face?.x === wall.x && face?.y === wall.y,
        topAboveWall: top?.x === wall.x && top?.y === wall.y - 1,
        roomCount: map.rooms?.length,
        corridorCount: map.corridors?.length,
        doorCount: map.doors?.length,
        tileSize: map.tileSize,
        doorFacings: map.doors?.map((door) => `${door.id}:${door.facing}`).sort().join("|"),
        doorFixtures: map.doors?.map((door) => `${door.id}:${door.x},${door.y}:${door.region}`).sort().join("|"),
        doorsInsideRooms: map.doors?.filter(insideRoom).map((door) => door.id).sort().join("|"),
        oldMidpointDoors: [[37, 8], [26, 21], [52, 21], [37, 30]].some(([x, y]) => map.doors?.some((door) => door.x === x && door.y === y)),
        corridorEndpoints: map.corridors?.map((corridor) => `${corridor.id}:${corridor.from}->${corridor.to}`).sort().join("|"),
        corridorsWithoutSeams: map.corridors?.filter((corridor) => !doorRegions.has(corridor.id) && !thresholdRegions.has(corridor.id)).map((corridor) => corridor.id).sort().join("|"),
        openThresholdFixtures: map.openThresholds?.map((threshold) => `${threshold.id}:${threshold.x},${threshold.y}:${threshold.orientation}:${threshold.region}:${threshold.length ?? 1}`).sort().join("|"),
        thresholdWallsOk: map.openThresholds?.every((threshold) => thresholdWallCoords(threshold).every(([x, y]) => map.semanticTiles[y]?.[x] === "WALL")),
        thresholdCentersWalkable: map.openThresholds?.every((threshold) => thresholdCenterCoords(threshold).every(([x, y]) => walkable.has(map.semanticTiles[y]?.[x]))),
        floorVariants: map.tileVariants?.["tile.moonroot.semantic.floorBase"]?.map((variant) => `${variant.tile}:${variant.weight}`).join("|"),
        floor1NpcIdles: Object.entries(expectedFloor1Idles).map(([id, idle]) => {
          const npc = map.npcs?.find((candidate) => candidate.id === id);
          const image = manifest.images?.[idle];
          const registered = manifest.npc_sprites?.[id]?.idle;
          return `${id}:${registered}:${npc?.drawW}x${npc?.drawH}:${npc?.anchorY}:${image?.width}x${image?.height}:${image?.animation?.frame_width}x${image?.animation?.frame_height}:${image?.animation?.frames}`;
        }).sort().join("|"),
        spawn: `${map.spawn?.x},${map.spawn?.y}`,
        hasFloor2Exit: map.exits?.some((exit) => exit.to === "moonroot_floor_2"),
        propCount: map.props?.length,
        lightCount: map.props?.filter((prop) => prop.light).length,
        propCollisionCount: map.props?.filter((prop) => prop.collision).length,
        genericLightCount: [
          ...(map.props ?? []),
          ...(map.overlays ?? []),
          ...Object.values(map.dungeonLayers ?? {}).flatMap((layer) => Array.isArray(layer) ? layer : [])
        ].filter((item) => item.light).length,
        ambience: map.ambience?.id,
        battleBackdrops: map.battleBackdrops?.join("|"),
        bossBattleBackdrops: map.bossBattleBackdrops?.join("|"),
        activeAmbience: globalThis.__eveDebugState.ambience?.profileId,
        particleCount: globalThis.__eveDebugState.ambience?.particles?.length ?? 0,
        trapFixtures: map.traps?.map((trap) => `${trap.id}:${trap.type}:${trap.x},${trap.y}:${trap.armed === false ? "safe" : "armed"}`).sort().join("|"),
        goblin: map.encounters?.find((encounter) => encounter.id === "enc_floor_1_cache_goblin_scout"),
        floor1Encounters: map.encounters?.map((encounter) => `${encounter.id}:${encounter.asset}:${encounter.drawW}x${encounter.drawH}:${encounter.enemies.join(",")}`).sort().join("|"),
        hasForwardBaseNpc: map.npcs?.some((npc) => npc.id === "npc_floor_1_quartermaster"),
        hasLeftDesk: map.props?.some((prop) => prop.id === "prop_floor_1_expedition_desk"),
        connectedBaseWall: [12, 13, 14, 15, 16, 17, 18].every((x) => map.semanticTiles[29]?.[x] === "WALL"),
        kitchenThresholdOpen: map.semanticTiles[28]?.[11] === "FLOOR" && map.semanticTiles[29]?.[11] === "FLOOR" && map.semanticTiles[30]?.[11] === "FLOOR"
      };
    });
    if (!semantic.hasLayers || !semantic.blocked || !semantic.faceAtWall || !semantic.topAboveWall) throw new Error(`Dungeon semantic wall stack failed: ${JSON.stringify(semantic)}`);
    if (semantic.roomCount !== 11 || semantic.corridorCount !== 10 || semantic.doorCount !== 5 || semantic.tileSize !== 96 || semantic.spawn !== "18,36" || !semantic.hasFloor2Exit || semantic.propCount < 30 || semantic.lightCount < 10 || semantic.genericLightCount < 12 || semantic.propCollisionCount < 18 || semantic.oldMidpointDoors || !semantic.hasForwardBaseNpc || semantic.hasLeftDesk || !semantic.connectedBaseWall || !semantic.kitchenThresholdOpen) {
      throw new Error(`Dungeon blueprint fixtures failed: ${JSON.stringify(semantic)}`);
    }
    if (semantic.ambience !== "moonroot_entry_safe" || semantic.activeAmbience !== "moonroot_entry_safe" || semantic.particleCount <= 0 || semantic.particleCount > 160) {
      throw new Error(`Dungeon floor 1 ambience failed: ${JSON.stringify(semantic)}`);
    }
    if (semantic.doorFacings !== "door_base_to_training:north|door_broken_to_descent:east|door_fork_to_cache:east|door_torch_to_fork:east|door_training_to_torch:north") {
      throw new Error(`Dungeon door facing metadata failed: ${JSON.stringify(semantic)}`);
    }
    if (semantic.doorsInsideRooms) throw new Error(`Dungeon doors should sit on wall thresholds, not room floors: ${JSON.stringify(semantic)}`);
    if (semantic.doorFixtures !== "door_base_to_training:20,26:corridor_base_to_training|door_broken_to_descent:41,5:corridor_broken_camp_to_descent|door_fork_to_cache:39,13:corridor_fork_to_side_cache|door_torch_to_fork:24,11:corridor_torch_to_fork|door_training_to_torch:19,15:corridor_training_to_torch") {
      throw new Error(`Dungeon room-side door fixtures failed: ${JSON.stringify(semantic)}`);
    }
    if (semantic.corridorEndpoints !== "corridor_base_to_kitchen:floor_1_forward_base_hall->floor_1_field_kitchen|corridor_base_to_quartermaster:floor_1_forward_base_hall->floor_1_quartermaster_nook|corridor_base_to_training:floor_1_forward_base_hall->floor_1_training_barricade_room|corridor_broken_camp_to_descent:floor_1_broken_camp->floor_1_descent_gate|corridor_broken_camp_to_shrine:floor_1_broken_camp->floor_1_root_cracked_shrine|corridor_fork_to_broken_camp:floor_1_chalk_marked_fork->floor_1_broken_camp|corridor_fork_to_side_cache:floor_1_chalk_marked_fork->floor_1_side_cache|corridor_quartermaster_to_infirmary:floor_1_quartermaster_nook->floor_1_infirmary_corner|corridor_torch_to_fork:floor_1_torch_depot->floor_1_chalk_marked_fork|corridor_training_to_torch:floor_1_training_barricade_room->floor_1_torch_depot") {
      throw new Error(`Dungeon corridor topology failed: ${JSON.stringify(semantic)}`);
    }
    if (semantic.corridorsWithoutSeams || !semantic.thresholdWallsOk || !semantic.thresholdCentersWalkable) {
      throw new Error(`Dungeon threshold seams failed: ${JSON.stringify(semantic)}`);
    }
    if (semantic.openThresholdFixtures !== "threshold_base_to_kitchen:11,29:ns:corridor_base_to_kitchen:1|threshold_base_to_quartermaster:30,35:ew:corridor_base_to_quartermaster:2|threshold_broken_camp_to_shrine:22,5:ew:corridor_broken_camp_to_shrine:3|threshold_fork_to_broken_camp:31,7:ns:corridor_fork_to_broken_camp:2|threshold_quartermaster_to_infirmary:37,30:ns:corridor_quartermaster_to_infirmary:1") {
      throw new Error(`Dungeon open threshold fixtures failed: ${JSON.stringify(semantic)}`);
    }
    if (semantic.floorVariants !== "tile.moonroot.floor1.light.a:6|tile.moonroot.floor1.light.b:5|tile.moonroot.floor1.light.c:4|tile.moonroot.floor1.light.d:3") {
      throw new Error(`Dungeon floor 1 light variants failed: ${JSON.stringify(semantic)}`);
    }
    if (semantic.battleBackdrops !== "backdrop.battle.dungeon.a|backdrop.battle.dungeon.b|backdrop.battle.dungeon.c" || semantic.bossBattleBackdrops !== "backdrop.battle.boss.a|backdrop.battle.boss.b|backdrop.battle.boss.c") {
      throw new Error(`Dungeon battle backdrop pools failed: ${JSON.stringify(semantic)}`);
    }
    if (semantic.floor1NpcIdles !== "npc_floor_1_cook:npc.moonroot.floor1.marlo.idle:94x150:112:384x128:96x128:4|npc_floor_1_descent_guard:npc.moonroot.floor1.descent_guard.idle:92x150:112:384x128:96x128:4|npc_floor_1_mapper:npc.moonroot.floor1.mapper.idle:86x142:106:384x128:96x128:4|npc_floor_1_quartermaster:npc.moonroot.floor1.sella.idle:92x148:110:384x128:96x128:4|npc_floor_1_rookie:npc.moonroot.floor1.rookie.idle:84x140:104:384x128:96x128:4|npc_floor_1_wounded_delver:npc.moonroot.floor1.wounded_delver.idle:86x142:106:384x128:96x128:4") {
      throw new Error(`Dungeon floor 1 NPC idle overrides failed: ${JSON.stringify(semantic)}`);
    }
    if (semantic.trapFixtures !== "trap_floor_1_cache_crumble:crumble:45,14:armed|trap_floor_1_chalk_fork_dart:darts:33,12:armed|trap_floor_1_practice_plate:spikes:21,23:safe|trap_floor_1_torch_depot_gas:poison:18,13:armed") {
      throw new Error(`Dungeon trap fixtures failed: ${JSON.stringify(semantic)}`);
    }
    if (semantic.goblin?.asset !== "npc.moonroot.goblin_grunt.move" || semantic.goblin?.enemies?.[0] !== "goblin-scout" || semantic.goblin?.drawW !== 92 || semantic.goblin?.drawH !== 112) {
      throw new Error(`Dungeon goblin scout fixture failed: ${JSON.stringify(semantic.goblin)}`);
    }
    if (semantic.floor1Encounters !== "enc_floor_1_broken_camp_scouts:npc.moonroot.goblin_grunt.move:92x112:goblin-scout,goblin-scout|enc_floor_1_cache_goblin_scout:npc.moonroot.goblin_grunt.move:92x112:goblin-scout,goblin-scout,goblin-scout|enc_floor_1_shrine_scout:npc.moonroot.goblin_grunt.move:92x112:goblin-scout") {
      throw new Error(`Dungeon floor 1 encounter lineup failed: ${JSON.stringify(semantic.floor1Encounters)}`);
    }
  }
  if (process.env.SCENE === "trap-effects") {
    const effects = await page.evaluate(() => {
      const state = globalThis.__eveDebugState;
      const manifest = globalThis.__eveDebugData.assets.images;
      const trapIds = ["spikes", "dart", "poison", "crumble", "alarm", "teleport", "pitfall"].map((slug) => `trap.effect.${slug}`);
      const tileIds = ["tile.moonroot.spikePlate", "tile.moonroot.dartLine", "tile.moonroot.poisonMist", "tile.moonroot.crumblingBridge", "tile.moonroot.alarmRune", "tile.moonroot.teleportSnare", "tile.moonroot.pitfall"];
      return {
        active: state.worldEffects?.map((effect) => `${effect.asset}:${effect.x},${effect.y}:${Math.round((effect.duration ?? 0) * 100)}`).join("|"),
        worldText: state.worldTextEffects?.map((effect) => `${effect.kind}:${effect.text}`).join("|"),
        questStage: state.quests?.["q-moonroot-floor1"]?.stage,
        trapDone: Boolean(state.flags?.trap_moonroot_hollow_trap_floor_1_torch_depot_gas),
        trapEffects: trapIds.map((id) => `${id}:${manifest[id]?.width}x${manifest[id]?.height}:${manifest[id]?.animation?.frame_width}x${manifest[id]?.animation?.frame_height}:${manifest[id]?.animation?.frames}`).join("|"),
        trapTiles: tileIds.map((id) => `${id}:${manifest[id]?.width}x${manifest[id]?.height}`).join("|")
      };
    });
    if (!effects.active?.includes("trap.effect.poison:18,13") || effects.questStage !== 3 || !effects.trapDone || effects.worldText !== "damage:12|damage:12|damage:12|damage:12") {
      throw new Error(`Trap effect trigger failed: ${JSON.stringify(effects)}`);
    }
    if (effects.trapEffects.includes("undefined") || !effects.trapEffects.split("|").every((row) => row.endsWith(":6"))) {
      throw new Error(`Trap effect asset metadata failed: ${JSON.stringify(effects)}`);
    }
    if (!effects.trapTiles.split("|").every((row) => row.endsWith("80x80"))) {
      throw new Error(`Trap tile asset metadata failed: ${JSON.stringify(effects)}`);
    }
  }
  if (process.env.SCENE === "dungeon-prop-collision") {
    const collision = await page.evaluate(() => ({
      x: globalThis.__eveDebugState.player.x,
      picked: Boolean(globalThis.__eveDebugState.flags.pickup_moonroot_hollow_prop_floor_1_broken_pack)
    }));
    if (collision.x < 35.2 || !collision.picked) {
      throw new Error(`Collected pickup collision did not clear: ${JSON.stringify(collision)}`);
    }
  }
  if (process.env.SCENE === "floor1-guard-quest-gate") {
    const gate = await page.evaluate(() => ({
      text: globalThis.__eveDebugState.dialogue?.text,
      complete: globalThis.__eveDebugState.quests?.["q-moonroot-floor1"]?.complete,
      stage: globalThis.__eveDebugState.quests?.["q-moonroot-floor1"]?.stage,
      flag: Boolean(globalThis.__eveDebugState.flags?.quest_q_moonroot_floor1_complete),
      gold: globalThis.__eveDebugState.gold,
      antidote: globalThis.__eveDebugState.inventory?.antidote ?? 0
    }));
    if (!gate.text?.includes("read the marks") || !gate.complete || gate.stage !== 7 || !gate.flag || gate.antidote < 1) {
      throw new Error(`Descent Guard completion gate failed: ${JSON.stringify(gate)}`);
    }
  }
  if (process.env.SCENE === "quest-indicators") {
    const indicators = await page.evaluate(() => {
      const state = globalThis.__eveDebugState;
      const map = globalThis.__eveDebugData.maps.moonroot_hollow;
      const markerFor = (id) => globalThis.__eveRenderer.npcQuestIndicator(map.npcs.find((npc) => npc.id === id), state);
      const early = {
        mapper: markerFor("npc_floor_1_mapper"),
        rookie: markerFor("npc_floor_1_rookie"),
        guard: markerFor("npc_floor_1_descent_guard")
      };
      state.quests = { "q-moonroot-floor1": { stage: 7, complete: false } };
      const readyGuard = markerFor("npc_floor_1_descent_guard");
      state.quests = { "q-moonroot-floor1": { stage: 7, complete: true } };
      state.flags.quest_q_moonroot_floor1_complete = true;
      const completeGuard = markerFor("npc_floor_1_descent_guard");
      return { early, readyGuard, completeGuard };
    });
    if (indicators.early.mapper !== "(!)" || indicators.early.rookie !== "(!)" || indicators.early.guard || indicators.readyGuard !== "(!)" || indicators.completeGuard) {
      throw new Error(`Quest indicator state failed: ${JSON.stringify(indicators)}`);
    }
  }
  if (process.env.SCENE === "dungeon-floor2") {
    const semantic = await page.evaluate(() => {
      const state = globalThis.__eveDebugState;
      const map = globalThis.__eveDebugData.maps.moonroot_floor_2;
      const byType = (type) => map.semanticTiles.flat().filter((tile) => tile === type).length;
      return {
        mapId: state?.mapId,
        tileSize: map.tileSize,
        size: `${map.width}x${map.height}`,
        roomCount: map.rooms?.length,
        corridorCount: map.corridors?.length,
        doorCount: map.doors?.length,
        propCollisionCount: map.props?.filter((prop) => prop.collision).length,
        layerCollisionCount: Object.values(map.dungeonLayers ?? {}).flatMap((layer) => Array.isArray(layer) ? layer : []).filter((item) => item.collision).length,
        ambience: map.ambience?.id,
        water: byType("WATER"),
        falseFloors: byType("TRAP_FALSE_FLOOR"),
        exits: map.exits?.map((exit) => `${exit.x},${exit.y}->${exit.to}`).sort().join("|"),
        traps: map.traps?.map((trap) => `${trap.id}:${trap.type}:${trap.x},${trap.y}`).sort().join("|"),
        encounterCount: map.encounters?.length,
        hasCisternColumn: map.dungeonLayers.sortables?.some((item) => item.id === "floor_2_cistern_column_a")
      };
    });
    if (semantic.mapId !== "moonroot_floor_2" || semantic.tileSize !== 96 || semantic.size !== "72x48" || semantic.roomCount !== 6 || semantic.corridorCount !== 6 || semantic.doorCount !== 6 || semantic.propCollisionCount < 1 || semantic.layerCollisionCount < 2) {
      throw new Error(`Dungeon floor 2 blueprint failed: ${JSON.stringify(semantic)}`);
    }
    if (semantic.ambience !== "moonroot_entry_contested") {
      throw new Error(`Dungeon floor 2 ambience failed: ${JSON.stringify(semantic)}`);
    }
    if (semantic.water !== 33 || semantic.falseFloors !== 2 || semantic.exits !== "3,24->moonroot_hollow|68,18->moonroot_floor_3" || semantic.encounterCount !== 2 || !semantic.hasCisternColumn) {
      throw new Error(`Dungeon floor 2 fixtures failed: ${JSON.stringify(semantic)}`);
    }
    if (semantic.traps !== "floor_2_alarm_rune:alarm:46,16|floor_2_crumble_bridge:crumble:44,33|floor_2_spike_warning:spikes:24,24") {
      throw new Error(`Dungeon floor 2 traps failed: ${JSON.stringify(semantic)}`);
    }
  }
  if (process.env.SCENE === "dungeon-floor1-visitor") {
    const visitor = await page.evaluate(() => {
      const map = globalThis.__eveDebugData.maps.moonroot_hollow;
      const npc = map.npcs.find((candidate) => candidate.id === "moonroot_visitor_room_1");
      const asset = globalThis.__eveDebugData.assets.images?.["npc.moonroot.visitor"];
      return { npc, asset };
    });
    if (visitor.npc?.asset !== "npc.moonroot.visitor" || visitor.npc?.x !== 23 || visitor.npc?.y !== 11 || visitor.npc?.drawW !== 76 || visitor.npc?.drawH !== 128 || visitor.asset?.width !== 96 || visitor.asset?.height !== 128) {
      throw new Error(`Dungeon visitor fixture failed: ${JSON.stringify(visitor)}`);
    }
  }
  if (process.env.SCENE === "dungeon-floor1-goblin-patrol") {
    const goblin = await page.evaluate(() => {
      const map = globalThis.__eveDebugData.maps.moonroot_hollow;
      const npc = map.npcs.find((candidate) => candidate.id === "goblin_grunt_room_2");
      const live = globalThis.__eveDebugState.npcStates?.moonroot_hollow?.goblin_grunt_room_2;
      return { npc, live };
    });
    if (!goblin.live || Math.hypot(goblin.live.x - goblin.npc.x, goblin.live.y - goblin.npc.y) < 0.4) {
      throw new Error(`Goblin patrol did not move: ${JSON.stringify(goblin)}`);
    }
    if (goblin.live.x < 48 || goblin.live.x > 52 || goblin.live.y < 8 || goblin.live.y > 12 || !["up", "down", "left", "right"].includes(goblin.live.dir)) {
      throw new Error(`Goblin patrol moved outside its two-tile route: ${JSON.stringify(goblin.live)}`);
    }
  }
  if (process.env.SCENE === "dungeon-floor11") {
    const state = await page.evaluate(() => globalThis.__eveDebugState);
    if (state?.mapId !== "moonroot_floor_11") throw new Error(`Dungeon floor 11 did not render: ${state?.mapId}`);
  }
  if (process.env.SCENE === "dungeon-floor1-door") {
    const state = await page.evaluate(() => globalThis.__eveDebugState);
    if (state?.mapId !== "moonroot_hollow") throw new Error(`Dungeon floor 1 door test left the tutorial floor: ${state?.mapId}`);
    if (!(state?.player?.x > 41.2)) throw new Error(`Dungeon floor 1 paired room-side doors did not open/pass: x=${state?.player?.x}`);
  }
  if (process.env.SCENE === "dungeon-floor1-door-reveal") {
    const state = await page.evaluate(() => globalThis.__eveDebugState);
    const open = state?.doorStates?.moonroot_hollow?.room_1_exit_south?.open;
    if (!open) throw new Error("South door reveal scene did not open/reveal the nearby door");
  }
  if (process.env.SCENE === "dungeon-floor1-door-hidden") {
    const semantic = await page.evaluate(() => {
      const state = globalThis.__eveDebugState;
      const map = globalThis.__eveDebugData.maps.moonroot_hollow;
      const door = map.doors.find((candidate) => candidate.id === "room_2_entry_west");
      return {
        mapId: state?.mapId,
        distance: Math.hypot(state.player.x - door.x, state.player.y - door.y),
        concealAsset: door?.concealAsset,
        doorOpen: Boolean(state?.doorStates?.moonroot_hollow?.room_2_entry_west?.open)
      };
    });
    if (semantic.mapId !== "moonroot_hollow" || semantic.distance < 3 || !semantic.concealAsset || semantic.doorOpen) {
      throw new Error(`Hidden side-door fixture failed: ${JSON.stringify(semantic)}`);
    }
  }
  if (process.env.SCENE === "dungeon-pitfall") {
    const state = await page.evaluate(() => globalThis.__eveDebugState);
    if (!["moonroot_floor_9", "moonroot_floor_10"].includes(state?.mapId)) throw new Error(`Pitfall landed on invalid map: ${state?.mapId}`);
  }
  if (process.env.SCENE === "dungeon-boss-gate") {
    const state = await page.evaluate(() => globalThis.__eveDebugState);
    if (state?.mapId !== "moonroot_floor_10") throw new Error(`Uncleared boss gate allowed exit to ${state?.mapId}`);
  }
  if (process.env.SCENE === "title-click-new-game") {
    const state = await page.evaluate(() => globalThis.__eveDebugState);
    if (state?.mode !== "world" || state?.mapId !== "moonroot_hollow") throw new Error(`New Game click did not reach dungeon debug start: mode=${state?.mode} map=${state?.mapId}`);
    if (Math.round(state?.player?.x) !== 18 || Math.round(state?.player?.y) !== 36) throw new Error(`New Game did not use Floor 1 spawn: ${JSON.stringify(state?.player)}`);
  }
  if (process.env.SCENE === "title-click-continue-no-save") {
    const state = await page.evaluate(() => globalThis.__eveDebugState);
    if (state?.mode !== "title" || state?.title?.message !== "No save found.") throw new Error("Continue click did not show no-save title message");
  }
  if (process.env.SCENE === "menu-clicks") {
    const mode = await page.evaluate(() => globalThis.__eveDebugState?.mode);
    if (mode !== "party") throw new Error(`Menu click did not open party mode: ${mode}`);
  }
  for (const [scene, mode] of Object.entries({ "field-menu-modern": "menu", "inventory-modern": "inventory", "quests-modern": "quests", "settings-modern": "settings", "shop-modern": "shop" })) {
    if (process.env.SCENE === scene) {
      const actual = await page.evaluate(() => globalThis.__eveDebugState?.mode);
      if (actual !== mode) throw new Error(`${scene} rendered wrong mode: ${actual}`);
    }
  }
  if (process.env.SCENE === "quests-modern") {
    const questLog = await page.evaluate(() => {
      const state = globalThis.__eveDebugState;
      const renderer = globalThis.__eveRenderer;
      const quests = renderer.liveQuests(state);
      const selected = quests[state.menu.index];
      const stage = renderer.questStageIndex(selected.quest, selected.live);
      const completedCount = selected.live.complete ? stage + 1 : stage;
      const visibleTitles = Array.from({ length: completedCount }, (_, index) => renderer.questObjectiveTitle(selected.quest, index))
        .concat(renderer.questObjectiveTitle(selected.quest, stage));
      return {
        selected: selected.quest.id,
        title: selected.quest.name,
        description: selected.quest.description,
        currentTitle: renderer.questObjectiveTitle(selected.quest, stage),
        currentText: renderer.questObjectiveText(selected.quest, stage),
        previousTitle: renderer.questObjectiveTitle(selected.quest, stage - 1),
        visibleTitles,
        hiddenFutureTitle: renderer.questObjectiveTitle(selected.quest, stage + 1)
      };
    });
    if (
      questLog.selected !== "q-moonroot-floor1" ||
      !questLog.description?.includes("read markings") ||
      questLog.currentTitle !== "Claim the side cache" ||
      !questLog.currentText?.includes("crumbling bridge") ||
      questLog.previousTitle !== "Survive the dart line" ||
      questLog.visibleTitles?.includes(questLog.hiddenFutureTitle)
    ) {
      throw new Error(`Quest log objective copy failed: ${JSON.stringify(questLog)}`);
    }
  }
  if (process.env.SCENE === "quest-toast") {
    const toast = await page.evaluate(() => ({
      text: globalThis.__eveDebugState?.toast,
      stage: globalThis.__eveDebugState?.quests?.["q-moonroot-floor1"]?.stage
    }));
    if (toast.stage !== 1 || !toast.text?.includes("Quest updated: Floor One Field Lessons") || !toast.text?.includes("Objective: Step on the marked spike plate")) {
      throw new Error(`Quest update toast failed: ${JSON.stringify(toast)}`);
    }
  }
  if (process.env.SCENE === "quest-log-input") {
    const log = await page.evaluate(() => ({
      mode: globalThis.__eveDebugState?.mode,
      index: globalThis.__eveDebugState?.menu?.index,
      selected: globalThis.__eveRenderer.liveQuests(globalThis.__eveDebugState)?.[globalThis.__eveDebugState?.menu?.index]?.quest?.id
    }));
    if (log.mode !== "quests" || log.index !== 1 || log.selected !== "q-moonroot-floor1") {
      throw new Error(`Quest log input failed: ${JSON.stringify(log)}`);
    }
  }
  if (process.env.SCENE === "shop-click-buy") {
    const state = await page.evaluate(() => globalThis.__eveDebugState);
    if ((state?.inventory?.bread ?? 0) < 1 || state?.gold >= 30) throw new Error("Shop click did not buy bread");
  }
  if (process.env.SCENE === "combat-click-command") {
    const combat = await page.evaluate(() => {
      const manifest = globalThis.__eveDebugData.assets.images;
      const effectIds = ["battle.effect.slash", "battle.effect.shield_slash", "battle.effect.shield_bash", "battle.effect.pierce", "battle.effect.smoke", "battle.effect.fire", "battle.effect.frost", "battle.effect.arcane", "battle.effect.heal", "battle.effect.barrier", "battle.effect.enemy_strike"];
      const uiIds = ["ui.combat.panel", "ui.combat.option", "ui.combat.summary_panel", "ui.combat.summary_button", "ui.victory.harvest_panel", "ui.victory.harvest_option", "ui.victory.harvest_side_panel", "ui.victory.harvest_button"];
      const backdropIds = ["backdrop.battle.forest.a", "backdrop.battle.forest.b", "backdrop.battle.forest.c", "backdrop.battle.village.a", "backdrop.battle.village.b", "backdrop.battle.village.c", "backdrop.battle.dungeon.a", "backdrop.battle.dungeon.b", "backdrop.battle.dungeon.c", "backdrop.battle.boss.a", "backdrop.battle.boss.b", "backdrop.battle.boss.c"];
      const data = globalThis.__eveDebugData;
      const renderer = globalThis.__eveRenderer;
      const party = data.actors.party.map((actor) => {
        const sprite = renderer.combatPartySprite(actor, 0, null);
        return `${actor.id}:${sprite.w}x${sprite.h}`;
      }).join("|");
      const goblinBase = data.enemyById["goblin-scout"];
      const goblin = { ...goblinBase, index: 0, hp: goblinBase.stats.hp, mp: goblinBase.stats.mp };
      const goblinSprite = renderer.combatEnemySprite(goblin, 0);
      const goblinAnim = manifest[goblin.asset]?.animation;
      const statusLayout = renderer.combatStatusLayout();
      const statusBottom = statusLayout.startY + (statusLayout.rowCount - 1) * statusLayout.rowGap + statusLayout.hpH + 5 + statusLayout.mpH;
      return {
        hp: globalThis.__eveDebugState?.combat?.enemies?.[0]?.hp,
        backdrop: globalThis.__eveDebugState?.combat?.backdrop,
        effects: effectIds.map((id) => `${id}:${manifest[id]?.width}x${manifest[id]?.height}:${manifest[id]?.animation?.frame_width}x${manifest[id]?.animation?.frame_height}:${manifest[id]?.animation?.frames}`).join("|"),
        statusIcons: `battle.status_icons:${manifest["battle.status_icons"]?.width}x${manifest["battle.status_icons"]?.height}:${manifest["battle.status_icons"]?.animation?.frame_width}x${manifest["battle.status_icons"]?.animation?.frame_height}:${manifest["battle.status_icons"]?.animation?.frames}`,
        ui: uiIds.map((id) => `${id}:${manifest[id]?.width}x${manifest[id]?.height}`).join("|"),
        backdrops: backdropIds.map((id) => `${id}:${manifest[id]?.width}x${manifest[id]?.height}`).join("|"),
        party,
        goblinFrame: goblinSprite.frame,
        goblinLeftStart: goblinAnim.rows.left * goblinAnim.frames,
        goblinLeftEnd: (goblinAnim.rows.left + 1) * goblinAnim.frames,
        statusBottom,
        panelBottom: statusLayout.panel.y + statusLayout.panel.h,
        menuRight: statusLayout.menu.x - 20 + statusLayout.menu.w,
        statusLeft: statusLayout.nameX
      };
    });
    if (!(combat.hp < 28)) throw new Error(`Combat click did not damage enemy: hp=${combat.hp}`);
    if (combat.backdrop !== "backdrop.battle.dungeon.a") throw new Error(`Combat backdrop failed: ${JSON.stringify(combat)}`);
    if (combat.effects.includes("undefined") || !combat.effects.split("|").every((row) => row.endsWith(":6"))) throw new Error(`Combat effect assets failed: ${JSON.stringify(combat)}`);
    if (combat.statusIcons !== "battle.status_icons:448x64:64x64:7") throw new Error(`Combat status icon asset failed: ${JSON.stringify(combat)}`);
    if (combat.party !== "rowan:120x150|elara:112x150|cassian:112x150|nia:112x150") throw new Error(`Combat party scale failed: ${JSON.stringify(combat)}`);
    if (!(combat.goblinFrame >= combat.goblinLeftStart && combat.goblinFrame < combat.goblinLeftEnd)) throw new Error(`Goblin combat sprite is not using the left row: ${JSON.stringify(combat)}`);
    if (!(combat.statusBottom <= combat.panelBottom && combat.menuRight < combat.statusLeft)) throw new Error(`Combat panel status layout overflowed: ${JSON.stringify(combat)}`);
    if (combat.ui !== "ui.combat.panel:912x220|ui.combat.option:360x48|ui.combat.summary_panel:736x500|ui.combat.summary_button:178x40|ui.victory.harvest_panel:912x560|ui.victory.harvest_option:600x76|ui.victory.harvest_side_panel:260x338|ui.victory.harvest_button:220x52") throw new Error(`Combat UI assets failed: ${JSON.stringify(combat)}`);
    if (combat.backdrops.includes("undefined") || !combat.backdrops.split("|").every((row) => row.endsWith("960x365"))) throw new Error(`Combat backdrop assets failed: ${JSON.stringify(combat)}`);
  }
  if (process.env.SCENE === "combat-goblin-facing") {
    const combat = await page.evaluate(() => {
      const data = globalThis.__eveDebugData;
      const renderer = globalThis.__eveRenderer;
      const goblinBase = data.enemyById["goblin-scout"];
      const goblin = { ...goblinBase, index: 0, hp: goblinBase.stats.hp, mp: goblinBase.stats.mp };
      const sprite = renderer.combatEnemySprite(goblin, 0);
      const anim = data.assets.images[goblin.asset]?.animation;
      return {
        enemyId: globalThis.__eveDebugState?.combat?.enemies?.[0]?.id,
        frame: sprite.frame,
        flipX: sprite.flipX,
        leftStart: anim.rows.left * anim.frames,
        leftEnd: (anim.rows.left + 1) * anim.frames
      };
    });
    if (combat.enemyId !== "goblin-scout" || combat.flipX || combat.frame < combat.leftStart || combat.frame >= combat.leftEnd) {
      throw new Error(`Goblin combat facing failed: ${JSON.stringify(combat)}`);
    }
  }
  if (process.env.SCENE === "harvest-goblin-loot") {
    const state = await page.evaluate(() => ({
      mode: globalThis.__eveDebugState?.mode,
      inventory: globalThis.__eveDebugState?.inventory,
      flags: globalThis.__eveDebugState?.loot?.reactionFlags
    }));
    if (state.mode !== "world") throw new Error(`Harvest did not finish back in world mode: ${state.mode}`);
    for (const [itemId, count] of Object.entries({
      clean_goblin_ear: 2,
      stolen_crumbs: 1,
      bruised_goblin_meat: 1,
      burned_goblin_ear: 1,
      charred_goblin_meat: 1
    })) {
      if ((state.inventory?.[itemId] ?? 0) !== count) throw new Error(`Harvest inventory ${itemId} expected ${count}, got ${state.inventory?.[itemId] ?? 0}`);
    }
    for (const flag of ["loot.first_clean_goblin_ear", "loot.first_goblin_meat", "loot.first_burned_goblin_ear"]) {
      if (!state.flags?.[flag]) throw new Error(`Missing harvest reaction flag ${flag}`);
    }
  }
  if (process.env.SCENE === "party-drag-reorder") {
    const order = await page.evaluate(() => globalThis.__eveDebugState?.partyOrder?.join(","));
    if (order !== "elara,cassian,rowan,nia") throw new Error(`Party drag reorder failed: ${order}`);
  }
  if (process.env.SCENE === "party-help-hover") {
    const hover = await page.evaluate(() => globalThis.__eveDebugState?.pointerUi?.partyHelpHover);
    if (!hover) throw new Error("Party help hover did not set tooltip state");
  }
  if (process.env.SCENE === "party-profile-elara") {
    const profile = await page.evaluate(() => globalThis.__eveDebugState?.pointerUi?.partyProfile);
    if (profile?.id !== "elara" || !(profile?.bioScroll > 100)) throw new Error(`Elara profile did not open and scroll deeply: ${JSON.stringify(profile)}`);
  }
  for (const id of ["rowan", "cassian", "nia"]) {
    if (process.env.SCENE === `party-profile-${id}`) {
      const profile = await page.evaluate(() => globalThis.__eveDebugState?.pointerUi?.partyProfile);
      if (profile?.id !== id) throw new Error(`${id} profile did not open: ${JSON.stringify(profile)}`);
    }
  }
  if (process.env.SCENE === "party-profile-rowan") {
    const state = await page.evaluate(() => {
      const data = globalThis.__eveDebugData;
      const actor = data.partyById.rowan;
      const profile = data.assets.images["profile.rowan"];
      return {
        className: actor?.class,
        profileAsset: actor?.profile,
        profileWidth: profile?.width,
        profileHeight: profile?.height
      };
    });
    if (state.className !== "Templar" || state.profileAsset !== "profile.rowan" || state.profileWidth !== 1672 || state.profileHeight !== 941) {
      throw new Error(`Rowan profile metadata failed: ${JSON.stringify(state)}`);
    }
  }
  if (process.env.SCENE === "party-profile-back") {
    const profile = await page.evaluate(() => globalThis.__eveDebugState?.pointerUi?.partyProfile);
    if (profile) throw new Error(`Elara profile back button did not close: ${JSON.stringify(profile)}`);
  }
  if (process.env.SCENE === "party-menu-drag-reorder") {
    const state = await page.evaluate(() => ({ mode: globalThis.__eveDebugState?.mode, order: globalThis.__eveDebugState?.partyOrder?.join(",") }));
    if (state.mode !== "party" || state.order !== "elara,cassian,rowan,nia") throw new Error(`Party menu drag reorder failed: ${JSON.stringify(state)}`);
  }
  if (process.env.SCENE === "settings-slider-drag") {
    const state = await page.evaluate(() => ({ mode: globalThis.__eveDebugState?.mode, master: globalThis.__eveDebugState?.audioSettings?.master }));
    if (state.mode !== "settings" || state.master < 0.85) throw new Error(`Settings slider drag failed: ${JSON.stringify(state)}`);
  }
  if (process.env.SCENE === "settings-party-display-persist") {
    const state = await page.evaluate(() => ({
      mode: globalThis.__eveDebugState?.mode,
      partyDisplayMode: globalThis.__eveDebugState?.gameSettings?.partyDisplayMode,
      saved: localStorage.getItem("eve-game-settings-v1")
    }));
    const saved = JSON.parse(state.saved || "{}");
    if (state.mode !== "settings" || state.partyDisplayMode !== "leader" || saved.partyDisplayMode !== "leader") {
      throw new Error(`Party display setting persistence failed: ${JSON.stringify(state)}`);
    }
  }
  if (process.env.SCENE === "party-display-door-proximity") {
    const leaderOnly = await page.evaluate(() => ({
      mode: globalThis.__eveDebugState?.gameSettings?.partyDisplayMode,
      open: Boolean(globalThis.__eveDebugState?.doorStates?.moonroot_hollow?.door_training_to_torch?.open),
      followers: globalThis.__eveDebugState?.followers?.length ?? 0
    }));
    if (leaderOnly.mode !== "leader" || leaderOnly.open || leaderOnly.followers !== 3) {
      throw new Error(`Leader-only door proximity failed: ${JSON.stringify(leaderOnly)}`);
    }
    await page.evaluate(() => {
      globalThis.__eveDebugState.gameSettings = { partyDisplayMode: "full" };
      globalThis.__eveDebugState.doorStates = { moonroot_hollow: {} };
    });
    await page.waitForTimeout(200);
    const fullParty = await page.evaluate(() => ({
      mode: globalThis.__eveDebugState?.gameSettings?.partyDisplayMode,
      open: Boolean(globalThis.__eveDebugState?.doorStates?.moonroot_hollow?.door_training_to_torch?.open)
    }));
    if (fullParty.mode !== "full" || !fullParty.open) {
      throw new Error(`Full-party door proximity failed: ${JSON.stringify(fullParty)}`);
    }
  }
  if (process.env.SCENE === "party-sprite-v2") {
    const state = await page.evaluate(() => {
      const data = globalThis.__eveDebugData;
      const inspect = (id) => {
        const actor = data.partyById[id];
        const move = data.assets.images[actor?.sprites?.move];
        const idle = data.assets.images[actor?.sprites?.idle];
        return {
          id,
          draw: actor?.draw,
          moveAsset: actor?.sprites?.move,
          idleAsset: actor?.sprites?.idle,
          moveWidth: move?.width,
          moveHeight: move?.height,
          moveFrameWidth: move?.animation?.frame_width,
          moveFrameHeight: move?.animation?.frame_height,
          moveFrames: move?.animation?.frames,
          moveRows: move?.animation?.rows,
          moveSmooth: move?.rendering?.smooth,
          idleWidth: idle?.width,
          idleHeight: idle?.height,
          idleFrameWidth: idle?.animation?.frame_width,
          idleFrameHeight: idle?.animation?.frame_height,
          idleFrames: idle?.animation?.frames,
          idleRows: idle?.animation?.rows,
          idleSmooth: idle?.rendering?.smooth
        };
      };
      return { cassian: inspect("cassian"), nia: inspect("nia") };
    });
    const hasEightRows = (rows) =>
      rows?.down === 0 &&
      rows?.["down-right"] === 1 &&
      rows?.right === 2 &&
      rows?.["up-right"] === 3 &&
      rows?.up === 4 &&
      rows?.["up-left"] === 5 &&
      rows?.left === 6 &&
      rows?.["down-left"] === 7;
    for (const actor of [state.cassian, state.nia]) {
      if (
        actor.draw?.w !== 112 ||
        actor.draw?.h !== 150 ||
        actor.draw?.anchorY !== 112 ||
        actor.moveWidth !== 1536 ||
        actor.moveHeight !== 2048 ||
        actor.moveFrameWidth !== 192 ||
        actor.moveFrameHeight !== 256 ||
        actor.moveFrames !== 8 ||
        !hasEightRows(actor.moveRows) ||
        actor.moveSmooth !== true ||
        actor.idleWidth !== 1536 ||
        actor.idleHeight !== 2048 ||
        actor.idleFrameWidth !== 192 ||
        actor.idleFrameHeight !== 256 ||
        actor.idleFrames !== 8 ||
        !hasEightRows(actor.idleRows) ||
        actor.idleSmooth !== true
      ) {
        throw new Error(`Party sprite v2 metadata failed: ${JSON.stringify(state)}`);
      }
    }
  }
  if (process.env.SCENE === "rowan-run-left-right") {
    const state = await page.evaluate(() => {
      const data = globalThis.__eveDebugData;
      const actor = data.partyById.rowan;
      const move = data.assets.images["actor.rowan.move"];
      const idle = data.assets.images["actor.rowan.idle"];
      return {
        dir: globalThis.__eveDebugState?.player?.dir,
        className: actor?.class,
        draw: actor?.draw,
        moveAsset: actor?.sprites?.move,
        sideWalkAsset: actor?.sprites?.side_walk,
        sideWalkManifestPresent: Boolean(data.assets.images["actor.rowan.side_walk"]),
        idleAsset: actor?.sprites?.idle,
        playerSpeed: globalThis.__eveDebugHooks.playerSpeed(),
        moveWidth: move?.width,
        moveHeight: move?.height,
        moveFrameWidth: move?.animation?.frame_width,
        moveFrameHeight: move?.animation?.frame_height,
        moveFrames: move?.animation?.frames,
        moveRows: move?.animation?.rows,
        idleWidth: idle?.width,
        idleHeight: idle?.height,
        idleFrameWidth: idle?.animation?.frame_width,
        idleFrameHeight: idle?.animation?.frame_height,
        idleFrames: idle?.animation?.frames,
        idleRows: idle?.animation?.rows
      };
    });
    const hasEightRows = (rows) =>
      rows?.down === 0 &&
      rows?.["down-right"] === 1 &&
      rows?.right === 2 &&
      rows?.["up-right"] === 3 &&
      rows?.up === 4 &&
      rows?.["up-left"] === 5 &&
      rows?.left === 6 &&
      rows?.["down-left"] === 7;
    if (
      state.dir !== "left" ||
      state.className !== "Templar" ||
      state.draw?.w !== 120 ||
      state.draw?.h !== 150 ||
      state.draw?.anchorY !== 112 ||
      state.playerSpeed !== 194 ||
      state.moveAsset !== "actor.rowan.move" ||
      state.sideWalkAsset !== undefined ||
      state.sideWalkManifestPresent !== false ||
      state.idleAsset !== "actor.rowan.idle" ||
      state.moveWidth !== 1536 ||
      state.moveHeight !== 2048 ||
      state.moveFrameWidth !== 192 ||
      state.moveFrameHeight !== 256 ||
      state.moveFrames !== 8 ||
      !hasEightRows(state.moveRows) ||
      state.idleWidth !== 1536 ||
      state.idleHeight !== 2048 ||
      state.idleFrameWidth !== 192 ||
      state.idleFrameHeight !== 256 ||
      state.idleFrames !== 8 ||
      !hasEightRows(state.idleRows)
    ) {
      throw new Error(`Rowan Templar metadata failed: ${JSON.stringify(state)}`);
    }
  }
  if (process.env.SCENE === "elara-tall-leader") {
    const state = await page.evaluate(() => {
      const data = globalThis.__eveDebugData;
      const actor = data.partyById.elara;
      const asset = data.assets.images["actor.elara.move"];
      const idle = data.assets.images["actor.elara.idle"];
      return {
        leader: globalThis.__eveDebugState?.partyOrder?.[0],
        dir: globalThis.__eveDebugState?.player?.dir,
        draw: actor?.draw,
        idleAsset: actor?.sprites?.idle,
        width: asset?.width,
        height: asset?.height,
        frameWidth: asset?.animation?.frame_width,
        frameHeight: asset?.animation?.frame_height,
        frames: asset?.animation?.frames,
        rows: asset?.animation?.rows,
        idleWidth: idle?.width,
        idleHeight: idle?.height,
        idleFrames: idle?.animation?.frames,
        idleRows: idle?.animation?.rows
      };
    });
    const hasEightRows = (rows) =>
      rows?.down === 0 &&
      rows?.["down-right"] === 1 &&
      rows?.right === 2 &&
      rows?.["up-right"] === 3 &&
      rows?.up === 4 &&
      rows?.["up-left"] === 5 &&
      rows?.left === 6 &&
      rows?.["down-left"] === 7;
    if (
      state.leader !== "elara" ||
      state.dir !== "down" ||
      state.draw?.w !== 112 ||
      state.draw?.h !== 150 ||
      state.draw?.anchorY !== 112 ||
      state.idleAsset !== "actor.elara.idle" ||
      state.width !== 768 ||
      state.height !== 1024 ||
      state.frameWidth !== 96 ||
      state.frameHeight !== 128 ||
      state.frames !== 8 ||
      !hasEightRows(state.rows) ||
      state.idleWidth !== 768 ||
      state.idleHeight !== 1024 ||
      state.idleFrames !== 8 ||
      !hasEightRows(state.idleRows)
    ) {
      throw new Error(`Elara tall leader metadata failed: ${JSON.stringify(state)}`);
    }
  }
  if (process.env.SCENE === "elara-tall-follower") {
    const state = await page.evaluate(() => {
      const follower = globalThis.__eveDebugState?.followers?.find((member) => member.id === "elara");
      return { leader: globalThis.__eveDebugState?.partyOrder?.[0], follower };
    });
    if (state.leader !== "rowan" || !state.follower || state.follower.dir !== "right") {
      throw new Error(`Elara tall follower failed: ${JSON.stringify(state)}`);
    }
  }
  console.log(JSON.stringify({ ok: true, screenshot: path.relative(root, screenshotPath), logs, ...result }, null, 2));
} finally {
  if (browser) await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
