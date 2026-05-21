import { drawAmbienceOverlay, drawAmbienceUnderlay, drawLightMask } from "./ambience.js";
import { AUDIO_SETTING_ROWS, PARTY_DISPLAY_OPTIONS } from "./settings.js";
import { CAMERA_ZOOM_DEFAULT } from "./state.js";

const VIEW_W = 960;
const VIEW_H = 640;
const TILE = 32;
const ACTOR_W = 34;
const ACTOR_H = 44;
const PARTY_CARD_X = 60;
const PARTY_CARD_Y = 156;
const PARTY_CARD_W = 190;
const PARTY_CARD_H = 334;
const PARTY_CARD_GAP = 218;
const PARTY_HELP_RECT = { x: 173, y: 73, w: 28, h: 28 };
const TITLE_MENU_ITEMS = ["New Game", "Continue"];
const TITLE_PARTY_SCALE_MULTIPLIER = 1.5;
const TITLE_SCENES = [
  { label: "Dark Forest", background: "menu.backdrop.darkForest.bg", foreground: "menu.backdrop.darkForest.fg" },
  { label: "Town", background: "menu.backdrop.town.bg", foreground: "menu.backdrop.town.fg", backgroundY: -92, foregroundY: 20 },
  { label: "Dungeon", background: "menu.backdrop.dungeon.bg", foreground: "menu.backdrop.dungeon.fg", foregroundY: 20 }
];
const NEW_GAME_DOOR_TIMING = { close: 0.65, open: 0.65, final: 2 };
const FIELD_MENU_ITEMS = ["Inventory", "Party", "Quest Log", "Journal", "Settings", "Save", "Load", "Close"];
const HARVEST_OPTION_KEYS = ["trophy", "meat", "pouch", "gear"];
const NPC_DIALOGUE_PANEL = { x: 34, y: 444, w: 660, h: 170 };
const NPC_DIALOGUE_ROWS = { x: 74, y: 490, w: 570, h: 21, rowH: 22 };
const JOURNAL_BOOK = { x: 30, y: 20, w: 900, h: 600 };
const JOURNAL_CHAPTER_ROWS = { x: 106, y: 116, w: 314, h: 30, rowH: 35 };
const JOURNAL_ENTRY_ROWS = { x: 112, y: 294, w: 314, h: 20, rowH: 22, max: 11 };
const JOURNAL_RIGHT_PAGE = { x: 506, y: 64, w: 356, h: 496 };
const HUMANOID_NPC_DRAW_DEFAULTS = {
  "actor.rowan": { w: 120, h: 150, anchorY: 112 },
  "actor.elara": { w: 112, h: 150, anchorY: 112 },
  "actor.nia": { w: 112, h: 150, anchorY: 112 },
  "actor.cassian": { w: 112, h: 150, anchorY: 112 }
};
const BATTLE_EFFECT_ASSETS = {
  strike: "battle.effect.slash",
  "shield-slash": "battle.effect.shield_slash",
  "shield-bash": "battle.effect.shield_bash",
  pierce: "battle.effect.pierce",
  smoke: "battle.effect.smoke",
  fire: "battle.effect.fire",
  frost: "battle.effect.frost",
  magic: "battle.effect.arcane",
  arcane: "battle.effect.arcane",
  heal: "battle.effect.heal",
  barrier: "battle.effect.barrier",
  guard: "battle.effect.barrier",
  "enemy-strike": "battle.effect.enemy_strike"
};
const COMBAT_PANEL = { x: 24, y: 414, w: 912, h: 218 };
const COMBAT_MENU = { x: 68, y: 494, rowH: 30, w: 360 };
const STATUS_ICON_FRAMES = {
  slash: 0,
  blunt: 1,
  pierce: 2,
  fire: 3,
  magic: 4,
  heal: 5,
  mitigation: 6
};
// Explicit walk-cycle contracts. The notes describe what each source frame should
// show, while the offsets/lean add runtime weight so weak foot motion reads less
// like sliding until a sheet is repainted.
const PARTY_WALK_FRAME_PLANS = {
  rowan: {
    side: {
      fps: 10.5,
      sequence: [0, 1, 2, 3, 4, 5, 6, 7],
      offsetX: [0, -1, -2, -1, 1, 2, 1, 0],
      offsetY: [0, -1, -2, -1, 0, -1, -2, 0],
      lean: [-0.006, -0.012, -0.016, -0.006, 0.006, 0.012, 0.016, 0],
      frameNotes: ["front boot planted", "weight settles", "rear foot passes", "opposite boot reaches", "opposite boot plants", "body rises", "rear heel pushes off", "recovery aligns to frame 1"]
    },
    vertical: {
      fps: 10.5,
      sequence: [0, 1, 2, 3, 4, 5, 6, 7],
      offsetX: [0, -1, 0, 1, 0, -1, 0, 1],
      offsetY: [0, -1, -2, -1, 0, -1, -2, 0],
      lean: [0, -0.006, -0.01, -0.006, 0, 0.006, 0.01, 0],
      frameNotes: ["front boot planted", "weight settles", "rear foot passes", "opposite boot reaches", "opposite boot plants", "body rises", "rear heel pushes off", "recovery aligns to frame 1"]
    }
  },
  elara: {
    side: {
      fps: 10.5,
      sequence: [0, 1, 2, 3, 4, 5, 6, 7],
      offsetX: [0, -1, -1, 1, 1, 0, -1, 0],
      offsetY: [0, -1, -2, -1, 0, -1, -2, 0],
      lean: [-0.008, -0.014, -0.006, 0.008, 0.014, 0.006, -0.004, 0],
      frameNotes: ["front boot plant", "weight settles", "rear boot passes", "opposite boot plant", "weight settles", "first boot passes", "recovery", "loop match"]
    },
    vertical: {
      fps: 10.5,
      sequence: [0, 1, 2, 3, 4, 5, 6, 7],
      offsetX: [0, 0, -1, 0, 1, 0, -1, 0],
      offsetY: [0, -1, -2, -1, 0, -1, -2, 0],
      lean: [0, -0.006, -0.01, 0.006, 0.01, 0.006, -0.004, 0],
      frameNotes: ["left boot plant", "weight settles", "right boot passes", "right boot plant", "weight settles", "left boot passes", "recovery", "loop match"]
    }
  },
  cassian: {
    side: {
      fps: 10.5,
      sequence: [0, 1, 2, 3, 4, 5, 6, 7],
      offsetX: [0, -1, -1, 1, 1, 0, -1, 0],
      offsetY: [0, -1, -2, -1, 0, -1, -2, 0],
      lean: [-0.008, -0.014, -0.006, 0.008, 0.014, 0.006, -0.004, 0],
      frameNotes: ["passing stance", "lead boot plants", "rear foot passes", "opposite boot plants", "weight shift", "lead boot steps", "heel pushes off", "loop recovery"]
    },
    vertical: {
      fps: 10.5,
      sequence: [0, 1, 2, 3, 4, 5, 6, 7],
      offsetX: [0, -1, 0, 1, 0, -1, 0, 1],
      offsetY: [0, -1, -2, -1, 0, -1, -2, 0],
      lean: [0, -0.006, -0.01, 0.006, 0.01, 0.006, -0.004, 0],
      frameNotes: ["passing stance", "left boot plants", "right boot passes", "right boot plants", "weight shift", "left boot steps", "heel pushes off", "loop recovery"]
    }
  },
  nia: {
    side: {
      fps: 10.5,
      sequence: [0, 1, 2, 3, 4, 5, 6, 7],
      offsetX: [0, -1, -1, 1, 1, 0, -1, 0],
      offsetY: [0, -1, -2, -1, 0, -1, -2, 0],
      lean: [-0.01, -0.018, -0.008, 0.012, 0.018, 0.008, -0.004, 0],
      frameNotes: ["passing stance", "lead boot plants", "rear foot passes", "opposite boot plants", "weight shift", "lead boot steps", "heel pushes off", "loop recovery"]
    },
    vertical: {
      fps: 10.5,
      sequence: [0, 1, 2, 3, 4, 5, 6, 7],
      offsetX: [0, -1, 0, 1, 0, -1, 0, 1],
      offsetY: [0, -1, -2, -1, 0, -1, -2, 0],
      lean: [0, -0.008, -0.012, 0.008, 0.012, 0.008, -0.004, 0],
      frameNotes: ["passing stance", "left boot plants", "right boot passes", "right boot plants", "weight shift", "left boot steps", "heel pushes off", "loop recovery"]
    }
  }
};

export class Renderer {
  constructor(ctx, assets, data) {
    this.ctx = ctx;
    this.assets = assets;
    this.data = data;
    this.titleLayerCache = new Map();
    ctx.imageSmoothingEnabled = false;
    this.prewarmTitleLayers();
  }

  draw(state) {
    const ctx = this.ctx;
    const menuMode = ["menu", "inventory", "party", "quests", "journal", "shop", "settings", "map"].includes(state.mode);
    ctx.clearRect(0, 0, VIEW_W, VIEW_H);
    if (state.mode === "title") this.drawTitle(state);
    else if (state.mode === "combat") this.drawCombat(state);
    else if (state.mode === "combat-summary") this.drawCombatSummary(state);
    else if (state.mode === "harvest") this.drawHarvest(state);
    else this.drawWorld(state);
    if (state.dialogue || state.npcDialogue) this.drawDialogue(state);
    if (menuMode) this.drawMenuMode(state);
    if (["world", "dialogue", "combat-summary", "harvest"].includes(state.mode) && state.toastTimer > 0) this.drawToast(state.toast);
    if (state.transition) this.drawTransition(state.transition);
  }

  drawTitle(state) {
    const ctx = this.ctx;
    const elapsed = state.title?.elapsed ?? performance.now() / 1000;
    const sceneSeconds = 8.4;
    const transitionSeconds = 1.45;
    const cycleSeconds = sceneSeconds * TITLE_SCENES.length;
    const cycle = ((elapsed % cycleSeconds) + cycleSeconds) % cycleSeconds;
    const scenePosition = Math.min(TITLE_SCENES.length - 0.0001, cycle / sceneSeconds);
    const sceneIndex = Math.floor(scenePosition);
    const local = scenePosition - sceneIndex;
    const nextIndex = (sceneIndex + 1) % TITLE_SCENES.length;
    const transitionStart = 1 - transitionSeconds / sceneSeconds;
    const rawTransition = Math.max(0, (local - transitionStart) / (1 - transitionStart));
    const transition = rawTransition * rawTransition * (3 - 2 * rawTransition);

    this.drawTitleBackdrop(TITLE_SCENES[sceneIndex], local, 1, -120 * transition);
    if (transition > 0) this.drawTitleBackdrop(TITLE_SCENES[nextIndex], transition * 0.18, transition, 140 * (1 - transition));
    this.drawTitleShade();

    this.text("EVE", 76, 106, "#ffe9a9", 44);
    this.text("Moonroot Hollow", 82, 144, "#f8f1dc", 18);
    this.text(TITLE_SCENES[sceneIndex].label, 82, 184, "#9bd6ff", 14);

    this.drawTitleParty(elapsed);
    this.drawTitleMenu(state);
  }

  drawTitleBackdrop(scene, phase, alpha = 1, slide = 0) {
    if (scene.background && scene.foreground) {
      this.drawTitleLayer(scene.background, phase, alpha, slide, 1, 0.12, 0.6, 1, false, scene.backgroundY ?? 0);
      this.drawTitleLayer(scene.foreground, phase, alpha * 0.92, slide, 1.07, 0.06, 0.86, 1.2, true, scene.foregroundY ?? 0);
      return;
    }

    this.drawTitleSingleBackdrop(scene.asset, phase, alpha, slide);
  }

  prewarmTitleLayers() {
    for (const scene of TITLE_SCENES) {
      if (scene.background && scene.foreground) {
        this.titleLayerImage(scene.background, 1);
        this.titleLayerImage(scene.foreground, 1.07);
      } else if (scene.asset) {
        this.titleLayerImage(scene.asset, 1);
      }
    }
    this.titleLayerImage("menu.transition.doorClose", 1);
    this.titleLayerImage("menu.transition.doorOpen", 1);
    this.titleLayerImage("menu.transition.doorFinal", 1);
  }

  titleLayerImage(assetId, scaleMultiplier) {
    const key = `${assetId}:${scaleMultiplier}`;
    if (this.titleLayerCache.has(key)) return this.titleLayerCache.get(key);

    const image = this.assets.images.get(assetId);
    if (!image) return null;
    const scale = Math.max(VIEW_W / image.width, VIEW_H / image.height) * 1.24 * scaleMultiplier;
    const width = Math.ceil(image.width * scale);
    const height = Math.ceil(image.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(image, 0, 0, width, height);

    const cached = { image: canvas, width, height };
    this.titleLayerCache.set(key, cached);
    return cached;
  }

  drawTitleLayer(assetId, phase, alpha, slide, scaleMultiplier, start, travel, slideMultiplier, anchorBottom = false, yOffset = 0) {
    const ctx = this.ctx;
    const layer = this.titleLayerImage(assetId, scaleMultiplier);
    if (!layer) return;
    const drawW = layer.width;
    const drawH = layer.height;
    const rangeX = Math.max(0, drawW - VIEW_W);
    const x = -rangeX * (start + phase * travel) + slide * slideMultiplier;
    const y = (anchorBottom ? VIEW_H - drawH + 26 : (VIEW_H - drawH) * 0.5) + yOffset;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.drawImage(layer.image, Math.round(x), Math.round(y));
    ctx.restore();
  }

  drawTitleSingleBackdrop(assetId, phase, alpha = 1, slide = 0) {
    const ctx = this.ctx;
    const image = this.assets.images.get(assetId);
    if (!image) return;
    const scale = Math.max(VIEW_W / image.width, VIEW_H / image.height) * 1.24;
    const drawW = image.width * scale;
    const drawH = image.height * scale;
    const rangeX = Math.max(0, drawW - VIEW_W);
    const x = -rangeX * (0.12 + phase * 0.6) + slide;
    const y = (VIEW_H - drawH) * 0.5;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.drawImage(image, x, y, drawW, drawH);

    const sourceY = Math.floor(image.height * 0.76);
    const sourceH = image.height - sourceY;
    const fgScale = scale * 1.22;
    const fgW = image.width * fgScale;
    const fgH = sourceH * fgScale;
    const fgRangeX = Math.max(0, fgW - VIEW_W);
    const fgX = -fgRangeX * (0.08 + phase * 0.82) + slide * 1.2;
    const fgY = VIEW_H - fgH + 26;
    ctx.globalAlpha = alpha * 0.78;
    ctx.drawImage(image, 0, sourceY, image.width, sourceH, fgX, fgY, fgW, fgH);
    ctx.restore();
  }

  drawTitleShade() {
    const ctx = this.ctx;
    const top = ctx.createLinearGradient(0, 0, 0, 240);
    top.addColorStop(0, "rgba(5, 5, 7, 0.72)");
    top.addColorStop(1, "rgba(5, 5, 7, 0)");
    ctx.fillStyle = top;
    ctx.fillRect(0, 0, VIEW_W, 240);

    const bottom = ctx.createLinearGradient(0, 330, 0, VIEW_H);
    bottom.addColorStop(0, "rgba(5, 5, 7, 0)");
    bottom.addColorStop(1, "rgba(5, 5, 7, 0.74)");
    ctx.fillStyle = bottom;
    ctx.fillRect(0, 330, VIEW_W, VIEW_H - 330);
  }

  drawTitleParty(elapsed) {
    const order = ["cassian", "elara", "nia", "rowan"];
    const startX = 214;
    const spacing = 130;
    const groundY = 478;
    const footPlantOffset = 20;
    order.forEach((id, index) => {
      const actor = this.data.partyById[id];
      const asset = actor.sprites?.move ?? actor.asset;
      const frame = actor.sprites?.move ? this.actorMovementFrame(asset, "right", true, elapsed * 1000 + index * 100) : undefined;
      const baseW = actor.draw?.w ?? ACTOR_W;
      const baseH = actor.draw?.h ?? ACTOR_H;
      const titleScale = Math.min(1.72, 98 / baseH) * TITLE_PARTY_SCALE_MULTIPLIER;
      const drawW = Math.round(baseW * titleScale);
      const drawH = Math.round(baseH * titleScale);
      const x = startX + index * spacing;
      const step = Math.sin(elapsed * Math.PI * 8 + index * 0.75) * 2;
      this.drawEllipseShadow(x + Math.round(drawW / 2), groundY + 17, Math.round(drawW * 0.42), 10);
      this.assets.draw(this.ctx, asset, x, groundY - drawH + footPlantOffset + step, drawW, drawH, { frame });
    });
  }

  drawEllipseShadow(x, y, w, h) {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.34)";
    ctx.beginPath();
    ctx.ellipse(x, y, w, h, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawTitleMenu(state) {
    const baseY = 560;
    TITLE_MENU_ITEMS.forEach((item, index) => {
      const rowY = baseY + index * 42;
      const textW = this.textWidth(item, 18);
      const x = Math.round(VIEW_W / 2 - textW / 2);
      if (index === state.title?.index) {
        const highlightW = Math.round(textW + 58);
        this.assets.draw(this.ctx, "ui.title.highlight", Math.round(VIEW_W / 2 - highlightW / 2), rowY - 27, highlightW, 36);
      }
      this.text(item, x, rowY, index === state.title?.index ? "#ffe9a9" : "#f8f1dc", 18);
    });
    if ((state.title?.messageTimer ?? 0) > 0) {
      const messageW = this.textWidth(state.title.message, 13);
      this.text(state.title.message, Math.round(VIEW_W / 2 - messageW / 2), 632, "#ffb8a8", 13);
    }
  }

  drawWorld(state) {
    const map = this.data.maps[state.mapId];
    const tileSize = map.tileSize ?? TILE;
    const zoom = state.cameraZoom ?? CAMERA_ZOOM_DEFAULT;
    const camera = this.camera(state, map, zoom, tileSize);
    const now = performance.now();
    this.ctx.save();
    this.ctx.scale(zoom, zoom);
    const tileDrawSize = tileSize + 1;
    if (map.dungeonLayers) {
      this.drawDungeonLayerTiles(map, map.dungeonLayers.base, camera, tileSize, now);
      this.drawDungeonLayerTiles(map, map.dungeonLayers.details, camera, tileSize, now);
      this.drawDungeonLayerTiles(map, map.dungeonLayers.hazards, camera, tileSize, now);
      this.drawDungeonLayerTiles(map, map.dungeonLayers.wallSides, camera, tileSize, now);
      this.drawDungeonLayerTiles(map, map.dungeonLayers.wallTops, camera, tileSize, now);
    } else {
      for (let y = 0; y < map.height; y++) {
        for (let x = 0; x < map.width; x++) {
          const tile = this.variantTile(map, this.tileAt(map, x, y), x, y);
          const options = {};
          if (this.assets.isAnimated(tile)) options.frame = this.assets.animationFrame(tile, now + this.tilePhase(x, y));
          this.assets.draw(this.ctx, tile, x * tileSize - camera.x, y * tileSize - camera.y, tileDrawSize, tileDrawSize, options);
        }
      }
    }
    drawAmbienceUnderlay(this.ctx, state, map);
    const objects = [];
    for (const object of map.dungeonLayers?.sortables ?? []) {
      objects.push(this.dungeonLayerObject(object, camera, tileSize));
    }
    for (const door of map.doors ?? []) {
      const open = Boolean(state.doorStates?.[map.id]?.[door.id]?.open);
      const revealAlpha = this.doorRevealAlpha(state, door);
      if (door.concealAsset && (door.facing ?? "north") !== "north") {
        objects.push({
          kind: "doorCover",
          asset: door.concealAsset,
          x: door.x * tileSize - camera.x,
          y: door.y * tileSize - camera.y,
          w: tileSize,
          h: tileSize,
          phase: this.tilePhase(door.x, door.y),
          sort: (door.y + 1) * tileSize - 2
        });
      }
      objects.push({
        kind: "door",
        asset: open ? door.openAsset : door.closedAsset,
        x: door.x * tileSize - camera.x,
        y: door.y * tileSize - camera.y,
        w: tileSize,
        h: tileSize,
        alpha: revealAlpha,
        phase: this.tilePhase(door.x, door.y),
        sort: (door.y + 1) * tileSize - 1
      });
    }
    for (const building of map.buildings ?? []) {
      if (building.interiorAsset) {
        objects.push(this.buildingObject(building, building.interiorAsset, building.interiorRect ?? building.rect, camera, tileSize, {
          drawW: building.interiorDrawW,
          drawH: building.interiorDrawH,
          sortTileY: (building.interiorRect ?? building.rect)[1],
          sortOffset: -6
        }));
      }
      if (building.roofAsset && state.insideBuildingId !== building.id) {
        objects.push(this.buildingObject(building, building.roofAsset, building.rect, camera, tileSize, {
          drawW: building.roofDrawW,
          drawH: building.roofDrawH,
          sortOffset: 4
        }));
      }
    }
    for (const prop of map.props ?? []) {
      if (prop.requires && !state.flags[prop.requires]) continue;
      if (prop.hideWhenInsideTent && state.insideTent) continue;
      if (prop.showWhenInsideTent && !state.insideTent) continue;
      const pickupKey = prop.id ? `pickup_${state.mapId}_${prop.id}` : null;
      if (pickupKey && state.flags[pickupKey]) continue;
      const drawW = prop.drawW ?? 48;
      const drawH = prop.drawH ?? 48;
      const anchorX = prop.anchorX ?? Math.round(drawW / 2 - tileSize / 2);
      const anchorY = prop.anchorY ?? (drawH - tileSize);
      objects.push({
        kind: "prop",
        asset: prop.asset,
        x: prop.x * tileSize - camera.x - anchorX,
        y: prop.y * tileSize - camera.y - anchorY,
        w: drawW,
        h: drawH,
        phase: this.tilePhase(prop.x, prop.y),
        sort: (prop.y + 1) * tileSize
      });
    }
    for (const overlay of map.overlays ?? []) {
      const drawW = overlay.drawW ?? tileSize;
      const drawH = overlay.drawH ?? tileSize;
      const anchorX = overlay.anchorX ?? Math.round(drawW / 2 - tileSize / 2);
      const anchorY = overlay.anchorY ?? drawH;
      objects.push({
        kind: "overlay",
        asset: overlay.asset,
        x: overlay.x * tileSize - camera.x - anchorX,
        y: overlay.y * tileSize - camera.y - anchorY,
        w: drawW,
        h: drawH,
        phase: this.tilePhase(overlay.x, overlay.y),
        sort: (overlay.y + 1) * tileSize + (overlay.sortOffset ?? -24)
      });
    }
    for (const trap of map.traps ?? []) {
      if (state.flags[`trap_${state.mapId}_${trap.id}`]) continue;
      if (trap.hidden && !state.flags[`trap_revealed_${state.mapId}_${trap.id}`]) continue;
      const asset = this.data.trapByType?.[trap.type]?.asset;
      if (!asset) continue;
      objects.push({
        kind: "trap",
        asset,
        x: trap.x * tileSize - camera.x,
        y: trap.y * tileSize - camera.y,
        w: tileSize,
        h: tileSize,
        sort: (trap.y + 1) * tileSize - 2
      });
    }
    for (const effect of state.worldEffects ?? []) {
      if (!effect.asset) continue;
      const drawW = effect.drawW ?? tileSize;
      const drawH = effect.drawH ?? tileSize;
      const anchorX = effect.anchorX ?? Math.round(drawW / 2 - tileSize / 2);
      const anchorY = effect.anchorY ?? Math.round(drawH / 2 - tileSize / 2);
      objects.push({
        kind: effect.kind ?? "worldEffect",
        asset: effect.asset,
        frame: this.worldEffectFrame(effect),
        alpha: this.worldEffectAlpha(effect),
        x: effect.x * tileSize - camera.x - anchorX,
        y: effect.y * tileSize - camera.y - anchorY,
        w: drawW,
        h: drawH,
        sort: (effect.y + 1) * tileSize + 4
      });
    }
    for (const encounter of map.encounters ?? []) {
      if (state.flags[encounter.flag]) continue;
      const drawW = encounter.drawW ?? 44;
      const drawH = encounter.drawH ?? 34;
      const anchorX = encounter.anchorX ?? Math.round(drawW / 2 - tileSize / 2);
      const anchorY = encounter.anchorY ?? (drawH - tileSize + 20);
      objects.push({
        kind: "encounter",
        asset: encounter.asset ?? "prop.tutorial.slimeMarker",
        x: encounter.x * tileSize - camera.x - anchorX,
        y: encounter.y * tileSize - camera.y - anchorY,
        w: drawW,
        h: drawH,
        sort: (encounter.y + 1) * tileSize
      });
    }
    for (const npc of map.npcs ?? []) {
      const live = state.npcStates?.[map.id]?.[npc.id] ?? npc;
      const asset = this.assets.npcIdleAsset(npc.id) ?? npc.asset;
      const metrics = this.npcDrawMetrics(npc, asset);
      const drawW = metrics.w;
      const drawH = metrics.h;
      const anchorX = npc.anchorX ?? Math.round(drawW / 2 - tileSize / 2);
      const anchorY = metrics.anchorY;
      objects.push({
        kind: "npc",
        asset,
        frame: this.assets.isAnimated(asset) ? this.actorMovementFrame(asset, live.dir ?? npc.dir, live.moving, now + this.tilePhase(npc.x, npc.y)) : undefined,
        x: live.x * tileSize - camera.x - anchorX,
        y: live.y * tileSize - camera.y - anchorY,
        w: drawW,
        h: drawH,
        questIndicator: this.npcQuestIndicator(npc, state),
        sort: (live.y + 1) * tileSize
      });
    }
    if (state.gameSettings?.partyDisplayMode !== "leader") {
      for (const follower of state.followers) {
        const base = this.data.partyById[follower.id];
        objects.push(this.actorObject("follower", base, follower.x, follower.y, camera, tileSize, { dir: follower.dir, moving: follower.stepTimer > 0, now }));
      }
    }
    const leader = this.data.partyById[state.partyOrder[0]];
    objects.push(this.actorObject("leader", leader, state.player.x, state.player.y, camera, tileSize, { dir: state.player.dir, moving: state.player.stepTimer > 0, now }));
    objects.sort((a, b) => a.sort - b.sort);
    for (const object of objects) {
      const options = { flipX: object.flipX };
      if (Number.isFinite(object.frame)) options.frame = object.frame;
      else if (this.assets.isAnimated(object.asset)) options.frame = this.assets.animationFrame(object.asset, now + (object.phase ?? 0));
      if (Number.isFinite(object.alpha)) options.alpha = object.alpha;
      this.drawObjectSprite(object, options);
    }
    drawAmbienceOverlay(this.ctx, state, map, camera);
    this.drawDungeonFog(state, map, camera, tileSize);
    drawLightMask(this.ctx, state, map, camera);
    this.drawNpcQuestIndicators(objects);
    this.drawWorldTextEffects(state, camera, tileSize);
    this.ctx.restore();
  }

  drawNpcQuestIndicators(objects) {
    for (const object of objects) {
      if (!object.questIndicator) continue;
      this.drawQuestIndicator(object.x + object.w / 2, object.y - 10);
    }
  }

  drawQuestIndicator(x, y) {
    const ctx = this.ctx;
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(8, 12, 24, 0.82)";
    ctx.strokeStyle = "#f5d76a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    this.roundRectPath(Math.round(x - 18), Math.round(y - 16), 36, 28, 8);
    ctx.fill();
    ctx.stroke();
    ctx.font = "bold 15px monospace";
    ctx.fillStyle = "#ffe978";
    ctx.fillText("(!)", Math.round(x), Math.round(y - 1));
    ctx.restore();
  }

  npcQuestIndicator(npc, state) {
    const scriptId = this.resolveNpcScriptId(npc, state);
    return this.scriptHasAvailableQuestAction(scriptId, state) ? "(!)" : "";
  }

  resolveNpcScriptId(npc, state) {
    for (const [flag, script] of Object.entries(npc.afterFlagScript ?? {})) {
      if (state.flags?.[flag]) return script;
    }
    return npc.script;
  }

  scriptHasAvailableQuestAction(scriptId, state, visited = new Set()) {
    if (!scriptId || visited.has(scriptId)) return false;
    visited.add(scriptId);
    let queue = [...(this.data.scripts?.[scriptId] ?? [])];
    while (queue.length) {
      const action = queue.shift();
      if (action.kind === "checkFlag") {
        if (state.flags?.[action.flag] && this.scriptHasAvailableQuestAction(this.scriptGotoId(scriptId, action.goto), state, visited)) return true;
        continue;
      }
      if (action.kind === "checkAll") {
        if (action.flags?.every((flag) => state.flags?.[flag]) && this.scriptHasAvailableQuestAction(this.scriptGotoId(scriptId, action.goto), state, visited)) return true;
        continue;
      }
      if (this.questActionAvailable(action, state)) return true;
    }
    return false;
  }

  scriptGotoId(base, goto) {
    return this.data.scripts?.[`${base}:${goto}`] ? `${base}:${goto}` : goto;
  }

  questActionAvailable(action, state) {
    const questId = action.quest;
    if (!questId) return false;
    const live = state.quests?.[questId];
    if (action.kind === "startQuest") return !live;
    if (!live || live.complete) return false;
    if (action.kind === "advanceQuest") return (live.stage ?? 0) < (action.stage ?? 0);
    if (action.kind === "completeQuest") return true;
    if (action.kind === "completeQuestIfStage") return (live.stage ?? 0) >= (action.stage ?? 0);
    return false;
  }

  drawWorldTextEffects(state, camera, tileSize) {
    const effects = state.worldTextEffects ?? [];
    if (!effects.length) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 20px monospace";
    for (const effect of effects) {
      const duration = Math.max(0.01, effect.duration ?? 1);
      const progress = Math.max(0, Math.min(1, (effect.elapsed ?? 0) / duration));
      const alpha = progress < 0.72 ? 1 : Math.max(0, (1 - progress) / 0.28);
      const x = effect.x * tileSize - camera.x + Math.sin(progress * Math.PI) * 4;
      const y = effect.y * tileSize - camera.y + progress * 34;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = "#151020";
      ctx.fillText(effect.text, Math.round(x) + 2, Math.round(y) + 2);
      ctx.fillStyle = "#ff6464";
      ctx.fillText(effect.text, Math.round(x), Math.round(y));
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  drawDungeonLayerTiles(map, layer = [], camera, tileSize, now) {
    for (const tile of layer) {
      const asset = this.variantTile(map, tile.asset, tile.x, tile.y);
      const options = {};
      if (this.assets.isAnimated(asset)) options.frame = this.assets.animationFrame(asset, now + this.tilePhase(tile.x, tile.y));
      this.assets.draw(
        this.ctx,
        asset,
        tile.x * tileSize - camera.x + (tile.offsetX ?? 0),
        tile.y * tileSize - camera.y + (tile.offsetY ?? 0),
        tile.drawW ?? tileSize + 1,
        tile.drawH ?? tileSize + 1,
        options
      );
    }
  }

  doorRevealAlpha(state, door) {
    if ((door.facing ?? "north") === "north") return 1;
    const distance = Math.hypot((state.player?.x ?? door.x) - door.x, (state.player?.y ?? door.y) - door.y);
    if (distance <= 1.25) return 1;
    if (distance >= 3) return 0;
    const t = (3 - distance) / 1.75;
    const smooth = t * t * (3 - 2 * t);
    return smooth;
  }

  npcDrawMetrics(npc, asset) {
    if (Number.isFinite(npc.drawW) && Number.isFinite(npc.drawH)) {
      return { w: npc.drawW, h: npc.drawH, anchorY: npc.anchorY ?? (npc.drawH - 28) };
    }
    const animation = this.assets.manifest.images?.[asset]?.animation;
    if (animation?.frame_width === 96 && animation?.frame_height === 128) return { w: 86, h: 138, anchorY: 103 };
    if (HUMANOID_NPC_DRAW_DEFAULTS[npc.asset]) return HUMANOID_NPC_DRAW_DEFAULTS[npc.asset];
    return { w: ACTOR_W, h: ACTOR_H, anchorY: ACTOR_H - 28 };
  }

  dungeonLayerObject(object, camera, tileSize) {
    const drawW = object.drawW ?? tileSize;
    const drawH = object.drawH ?? tileSize;
    const anchorX = object.anchorX ?? Math.round(drawW / 2 - tileSize / 2);
    const anchorY = object.anchorY ?? drawH;
    return {
      kind: object.group ?? "dungeonLayer",
      asset: object.asset,
      x: object.x * tileSize - camera.x - anchorX,
      y: object.y * tileSize - camera.y - anchorY,
      w: drawW,
      h: drawH,
      phase: this.tilePhase(object.x, object.y),
      sort: object.sort ?? (object.y * tileSize + tileSize)
    };
  }

  worldEffectFrame(effect) {
    const animation = this.assets.manifest.images?.[effect.asset]?.animation;
    const frames = Math.max(1, animation?.frames ?? 1);
    const duration = Math.max(0.01, effect.duration ?? 0.5);
    const progress = Math.max(0, Math.min(0.999, (effect.elapsed ?? 0) / duration));
    return Math.min(frames - 1, Math.floor(progress * frames));
  }

  worldEffectAlpha(effect) {
    const duration = Math.max(0.01, effect.duration ?? 0.5);
    const progress = Math.max(0, Math.min(1, (effect.elapsed ?? 0) / duration));
    return progress > 0.75 ? Math.max(0, 1 - (progress - 0.75) / 0.25) : 1;
  }

  variantTile(map, tile, x, y) {
    const variants = map.tileVariants?.[tile];
    if (!variants?.length) return tile;
    const total = variants.reduce((sum, variant) => sum + (variant.weight ?? 1), 0);
    let pick = this.tileHash(map.id, x, y) % total;
    for (const variant of variants) {
      pick -= variant.weight ?? 1;
      if (pick < 0) return variant.tile;
    }
    return tile;
  }

  tileHash(mapId, x, y) {
    let hash = 2166136261;
    for (let i = 0; i < mapId.length; i++) hash = Math.imul(hash ^ mapId.charCodeAt(i), 16777619);
    hash = Math.imul(hash ^ (x * 374761393), 668265263);
    hash = Math.imul(hash ^ (y * 2246822519), 3266489917);
    return hash >>> 0;
  }

  tilePhase(x, y) {
    return ((x * 173 + y * 281) % 1000) * 4;
  }

  actorObject(kind, actor, x, y, camera, tileSize = TILE, motion = {}) {
    const baseW = actor.draw?.w ?? ACTOR_W;
    const baseH = actor.draw?.h ?? ACTOR_H;
    const dir = motion.dir ?? "down";
    const scale = actor.draw?.directionScale?.[dir] ?? 1;
    const drawW = Math.round(baseW * scale);
    const drawH = Math.round(baseH * scale);
    const baseAnchorX = actor.draw?.anchorX ?? Math.round(baseW / 2 - tileSize / 2);
    const baseAnchorY = actor.draw?.anchorY ?? (baseH - 28);
    const anchorX = Math.round(baseAnchorX + (drawW - baseW) / 2);
    const anchorY = Math.round(baseAnchorY + (drawH - baseH));
    const moveAsset = actor.sprites?.move;
    const idleAsset = actor.sprites?.idle;
    const useIdle = Boolean(idleAsset && !motion.moving);
    const asset = useIdle ? idleAsset : (moveAsset ?? actor.asset);
    const walkPose = (!useIdle && moveAsset && motion.moving) ? this.partyWalkPose(actor.id, dir, motion.now) : null;
    return {
      kind,
      asset,
      frame: (moveAsset || useIdle) ? this.actorMovementFrame(asset, motion.dir, useIdle || motion.moving, motion.now, walkPose ? actor.id : null) : undefined,
      x: x * tileSize - camera.x - anchorX + (walkPose?.offsetX ?? 0),
      y: y * tileSize - camera.y - anchorY + (walkPose?.offsetY ?? 0),
      w: drawW,
      h: drawH,
      pose: walkPose,
      sort: (y + 1) * tileSize
    };
  }

  drawObjectSprite(object, options) {
    if (object.pose?.lean) {
      this.ctx.save();
      this.ctx.translate(object.x + object.w / 2, object.y + object.h);
      this.ctx.rotate(object.pose.lean);
      this.assets.draw(this.ctx, object.asset, -object.w / 2, -object.h, object.w, object.h, options);
      this.ctx.restore();
      return;
    }
    this.assets.draw(this.ctx, object.asset, object.x, object.y, object.w, object.h, options);
  }

  actorMovementFrame(asset, dir = "down", moving = false, now = performance.now(), actorId = null) {
    const fallbackDir = {
      "up-left": "left",
      "down-left": "left",
      "up-right": "right",
      "down-right": "right"
    }[dir] ?? dir;
    const rows = this.assets.manifest.images?.[asset]?.animation?.rows ?? { down: 0, left: 1, right: 2, up: 3 };
    const frames = Math.max(1, this.assets.manifest.images?.[asset]?.animation?.frames ?? 4);
    const row = rows[dir] ?? rows[fallbackDir] ?? rows.down;
    const plan = actorId ? this.walkFramePlan(actorId, fallbackDir) : null;
    const frame = moving
      ? (plan ? plan.sequence[this.walkFrameStep(plan, now)] % frames : this.assets.animationFrame(asset, now))
      : 0;
    return row * frames + frame;
  }

  partyWalkPose(actorId, dir = "down", now = performance.now()) {
    const fallbackDir = {
      "up-left": "left",
      "down-left": "left",
      "up-right": "right",
      "down-right": "right"
    }[dir] ?? dir;
    const plan = this.walkFramePlan(actorId, fallbackDir);
    if (!plan) return null;
    const step = this.walkFrameStep(plan, now);
    const sideSign = fallbackDir === "left" ? -1 : 1;
    const side = fallbackDir === "left" || fallbackDir === "right";
    return {
      offsetX: (plan.offsetX?.[step] ?? 0) * (side ? sideSign : 1),
      offsetY: plan.offsetY?.[step] ?? 0,
      lean: (plan.lean?.[step] ?? 0) * (side ? sideSign : 1)
    };
  }

  walkFramePlan(actorId, dir) {
    const actorPlan = PARTY_WALK_FRAME_PLANS[actorId];
    if (!actorPlan) return null;
    return (dir === "left" || dir === "right") ? actorPlan.side : actorPlan.vertical;
  }

  walkFrameStep(plan, now) {
    const length = Math.max(1, plan.sequence?.length ?? 1);
    return Math.floor((now / 1000) * (plan.fps ?? 7)) % length;
  }

  buildingObject(building, asset, rect, camera, tileSize = TILE, options = {}) {
    const [tileX, tileY, tileW, tileH] = rect;
    const drawW = options.drawW ?? tileW * tileSize;
    const drawH = options.drawH ?? tileH * tileSize;
    const x = tileX * tileSize - camera.x - Math.round((drawW - tileW * tileSize) / 2);
    const y = (tileY + tileH) * tileSize - camera.y - drawH;
    return {
      kind: "building",
      asset,
      x,
      y,
      w: drawW,
      h: drawH,
      sort: (options.sortTileY ?? tileY + tileH) * tileSize + (options.sortOffset ?? 0)
    };
  }

  tileAt(map, x, y) {
    if (map.tiles?.[y]?.[x]) return map.tiles[y][x];
    const fills = map.fills ?? [];
    for (let i = fills.length - 1; i >= 0; i--) {
      const fill = fills[i];
      const [fx, fy, fw, fh] = fill.rect;
      if (x >= fx && y >= fy && x < fx + fw && y < fy + fh) return fill.tile;
    }
    return map.defaultTile;
  }

  drawDungeonFog(state, map, camera, tileSize) {
    if (!map.dungeonFloor || !map.regionTiles) return;
    const explored = new Set(state.dungeon?.explored?.[map.id] ?? []);
    const current = state.dungeon?.currentRegion?.[map.id] ?? null;
    const structuralCells = this.dungeonStructuralFogCells(map);
    const ctx = this.ctx;
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        if (structuralCells.has(`${x},${y}`)) continue;
        const region = this.fogRegionAt(map, x, y);
        if (region && region === current) continue;
        const screenX = x * tileSize - camera.x;
        const screenY = y * tileSize - camera.y;
        ctx.fillStyle = region && explored.has(region) ? "rgba(0, 0, 0, 0.56)" : "rgb(0, 0, 0)";
        ctx.fillRect(screenX, screenY, tileSize + 1, tileSize + 1);
      }
    }
  }

  dungeonStructuralFogCells(map) {
    if (map._structuralFogCells) return map._structuralFogCells;
    const cells = new Set();
    const add = (x, y) => {
      if (x >= 0 && y >= 0 && x < map.width && y < map.height) cells.add(`${x},${y}`);
    };
    for (const tile of map.dungeonLayers?.wallTops ?? []) add(tile.x, tile.y);
    for (const tile of map.dungeonLayers?.wallSides ?? []) add(tile.x, tile.y);
    for (const object of map.dungeonLayers?.sortables ?? []) {
      if (!["wallFace", "door"].includes(object.group)) continue;
      add(object.x, object.y);
      add(object.x, object.y - 1);
      add(object.x, object.y + 1);
    }
    for (const door of map.doors ?? []) add(door.x, door.y);
    map._structuralFogCells = cells;
    return cells;
  }

  fogRegionAt(map, x, y) {
    const direct = map.regionTiles?.[y]?.[x];
    if (direct) return direct;
    for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [-1, 1], [1, -1], [-1, -1]]) {
      const nearby = map.regionTiles?.[y + dy]?.[x + dx];
      if (nearby) return nearby;
    }
    return null;
  }

  camera(state, map, zoom = CAMERA_ZOOM_DEFAULT, tileSize = map.tileSize ?? TILE) {
    const viewW = VIEW_W / zoom;
    const viewH = VIEW_H / zoom;
    return {
      x: Math.max(0, Math.min(state.player.x * tileSize - viewW / 2, map.width * tileSize - viewW)),
      y: Math.max(0, Math.min(state.player.y * tileSize - viewH / 2, map.height * tileSize - viewH))
    };
  }

  drawHud(state) {
    const x = 632;
    const y = 14;
    this.assets.draw(this.ctx, "ui.status", x, y, 320, 132);
    this.text(`Gold ${state.gold}`, x + 16, y + 18, "#ffe9a9", 12);
  }

  drawMeter(x, y, w, h, value, color) {
    const ctx = this.ctx;
    ctx.save();
    this.roundRectPath(x, y, w, h, Math.ceil(h / 2));
    ctx.fillStyle = "rgba(4, 8, 18, 0.72)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 231, 170, 0.38)";
    ctx.lineWidth = 1;
    ctx.stroke();
    const fillW = Math.max(0, Math.min(w, Math.round(w * value)));
    if (fillW > 0) {
      this.roundRectPath(x + 2, y + 2, Math.max(2, fillW - 4), h - 4, Math.ceil((h - 4) / 2));
      const glow = ctx.createLinearGradient(x, y, x + w, y);
      glow.addColorStop(0, color);
      glow.addColorStop(1, "#fff0b8");
      ctx.fillStyle = glow;
      ctx.fill();
    }
    ctx.restore();
  }

  drawDialogue(state) {
    if (state.npcDialogue?.mode === "menu") return this.drawNpcDialogueMenu(state);
    const d = state.dialogue;
    if (!d) return;
    this.assets.draw(this.ctx, "ui.dialogue", NPC_DIALOGUE_PANEL.x, NPC_DIALOGUE_PANEL.y, NPC_DIALOGUE_PANEL.w, NPC_DIALOGUE_PANEL.h);
    this.text(d.speaker, 66, 480, "#ffe9a9", 18);
    this.wrap(d.text, 66, 512, 590, "#f8f1dc", 16);
    this.text("Enter", 614, 586, "#ffe9a9", 13);
  }

  drawNpcDialogueMenu(state) {
    const dialogue = state.npcDialogue;
    this.assets.draw(this.ctx, "ui.dialogue", NPC_DIALOGUE_PANEL.x, NPC_DIALOGUE_PANEL.y, NPC_DIALOGUE_PANEL.w, NPC_DIALOGUE_PANEL.h);
    this.text(dialogue.speaker, 66, 480, "#ffe9a9", 18);
    this.text("Choose", 590, 480, "#9bd6ff", 12);
    for (const [index, option] of dialogue.options.entries()) {
      const row = {
        x: NPC_DIALOGUE_ROWS.x,
        y: NPC_DIALOGUE_ROWS.y + index * NPC_DIALOGUE_ROWS.rowH,
        w: NPC_DIALOGUE_ROWS.w,
        h: NPC_DIALOGUE_ROWS.h
      };
      const selected = index === dialogue.index;
      if (selected) this.drawSelectionHighlight(row.x, row.y, row.w, row.h, 0.84);
      const accent = option.kind === "quest" ? "#ffe9a9" : option.kind === "shop" ? "#9bd6ff" : "#dcecff";
      this.text(selected ? ">" : "", row.x + 12, row.y + 16, "#fff4d2", 13);
      this.text(option.label, row.x + 34, row.y + 16, selected ? "#fff4d2" : accent, 14);
    }
    this.text("Esc", 620, 586, "#b8cee8", 12);
  }

  drawGlassPanel(x, y, w, h, r = 22) {
    const ctx = this.ctx;
    ctx.save();
    this.roundRectPath(x, y, w, h, r);
    const glass = ctx.createLinearGradient(x, y, x + w, y + h);
    glass.addColorStop(0, "rgba(10, 18, 38, 0.90)");
    glass.addColorStop(0.48, "rgba(17, 30, 62, 0.78)");
    glass.addColorStop(1, "rgba(6, 10, 24, 0.92)");
    ctx.fillStyle = glass;
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 231, 170, 0.72)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.strokeStyle = "rgba(106, 190, 255, 0.24)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.clip();
    const top = ctx.createLinearGradient(x, y, x, y + 90);
    top.addColorStop(0, "rgba(255, 255, 255, 0.12)");
    top.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = top;
    ctx.fillRect(x, y, w, 110);
    ctx.fillStyle = "rgba(80, 150, 255, 0.05)";
    for (let i = 0; i < 5; i++) ctx.fillRect(x + 36 + i * 172, y + 18, 1, h - 36);
    ctx.restore();
  }

  drawMenuTitle(title, x, y, options = {}) {
    this.text(title, x, y, "#fff4d2", 24);
    const w = Math.max(100, this.textWidth(title, 24) + 44);
    const ctx = this.ctx;
    const grad = ctx.createLinearGradient(x, y + 14, x + w, y + 14);
    grad.addColorStop(0, "rgba(255, 229, 165, 0.88)");
    grad.addColorStop(0.5, "rgba(100, 192, 255, 0.72)");
    grad.addColorStop(1, "rgba(255, 229, 165, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(x, y + 14, w, 2);
    if (options.help) this.drawHelpIcon(PARTY_HELP_RECT.x, PARTY_HELP_RECT.y, options.helpHover);
  }

  drawHelpIcon(x, y, hover = false) {
    const ctx = this.ctx;
    ctx.save();
    this.roundRectPath(x, y, 24, 24, 12);
    ctx.fillStyle = hover ? "rgba(255, 229, 165, 0.28)" : "rgba(8, 13, 28, 0.64)";
    ctx.fill();
    ctx.strokeStyle = hover ? "rgba(255, 244, 210, 0.94)" : "rgba(255, 229, 165, 0.64)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
    this.text("?", x + 8, y + 17, "#fff4d2", 14);
  }

  drawTooltip(text, x, y, w = 310) {
    const ctx = this.ctx;
    this.drawGlassPanel(x, y, w, 58, 10);
    this.wrap(text, x + 14, y + 24, w - 28, "#fff6df", 13, 2);
    ctx.fillStyle = "rgba(255, 229, 165, 0.78)";
    ctx.fillRect(x + 18, y + 8, w - 36, 1);
  }

  drawSelectionHighlight(x, y, w, h, alpha = 1) {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = alpha;
    this.roundRectPath(x, y, w, h, 10);
    const glow = ctx.createLinearGradient(x, y, x + w, y);
    glow.addColorStop(0, "rgba(69, 155, 255, 0.18)");
    glow.addColorStop(0.5, "rgba(255, 229, 165, 0.28)");
    glow.addColorStop(1, "rgba(69, 155, 255, 0.12)");
    ctx.fillStyle = glow;
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 229, 165, 0.72)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }

  drawGlassChip(text, x, y, w, selected = false) {
    this.drawSelectionHighlight(x, y, w, 34, selected ? 1 : 0.36);
    this.text(text, x + 18, y + 23, selected ? "#fff4d2" : "#dcecff", 15);
  }

  drawMenuMode(state) {
    if (state.mode === "map") return this.drawDungeonMap(state);
    if (state.mode === "journal") return this.drawJournal(state);
    if (state.mode === "shop") return this.drawShop(state);
    if (state.mode === "party" && state.pointerUi?.partyProfile) return this.drawPartyProfile(state);
    const titles = { menu: "Field Menu", inventory: "Inventory", party: "Party", quests: "Quest Log", settings: "Settings" };
    const panel = state.mode === "party"
      ? { x: 34, y: 38, w: 892, h: 564, titleX: 72, titleY: 88 }
      : { x: 92, y: 70, w: 776, h: 506, titleX: 132, titleY: 120 };
    this.drawGlassPanel(panel.x, panel.y, panel.w, panel.h, 24);
    this.drawMenuTitle(titles[state.mode], panel.titleX, panel.titleY, { help: state.mode === "party", helpHover: state.pointerUi?.partyHelpHover });
    if (state.mode === "menu") this.list(FIELD_MENU_ITEMS, state.menu.index, 150, 162);
    if (state.mode === "inventory") this.drawInventory(state);
    if (state.mode === "party") this.drawParty(state);
    if (state.mode === "quests") this.drawQuests(state);
    if (state.mode === "settings") this.drawSettings(state);
    if (state.mode === "party" && state.pointerUi?.partyHelpHover) {
      this.drawTooltip("Click portrait to view profile. Drag cards to reorder lineup.", 198, 72, 326);
    }
  }

  drawDungeonMap(state) {
    const map = this.data.maps[state.mapId];
    if (!map?.dungeonFloor || !map.regionTiles) return;
    const ctx = this.ctx;
    const mapped = new Set(state.dungeon?.mappedRegions?.[map.id] ?? []);
    const current = state.dungeon?.currentRegion?.[map.id] ?? null;
    const regions = [...(map.corridors ?? []), ...(map.rooms ?? [])];
    const bounds = this.dungeonMapBounds(regions);
    const panel = { x: 74, y: 42, w: 812, h: 556 };
    const paper = { x: 112, y: 96, w: 736, h: 452 };
    const margin = 34;
    const scale = Math.min((paper.w - margin * 2) / Math.max(1, bounds.w), (paper.h - margin * 2) / Math.max(1, bounds.h));
    const ox = paper.x + paper.w / 2 - (bounds.minX + bounds.w / 2) * scale;
    const oy = paper.y + paper.h / 2 - (bounds.minY + bounds.h / 2) * scale;
    const tileToMap = (x, y) => ({ x: ox + x * scale, y: oy + y * scale });

    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.62)";
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    this.drawGlassPanel(panel.x, panel.y, panel.w, panel.h, 24);
    this.roundRectPath(paper.x, paper.y, paper.w, paper.h, 18);
    const parchment = ctx.createLinearGradient(paper.x, paper.y, paper.x + paper.w, paper.y + paper.h);
    parchment.addColorStop(0, "rgba(236, 219, 176, 0.94)");
    parchment.addColorStop(0.54, "rgba(202, 177, 128, 0.88)");
    parchment.addColorStop(1, "rgba(147, 112, 72, 0.92)");
    ctx.fillStyle = parchment;
    ctx.fill();
    ctx.strokeStyle = "rgba(76, 45, 24, 0.72)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.save();
    ctx.clip();
    ctx.fillStyle = "rgba(64, 43, 27, 0.08)";
    for (let i = 0; i < 14; i++) {
      const y = paper.y + 30 + i * 31 + this.sketchJitter(i, 1.4);
      ctx.fillRect(paper.x + 24, y, paper.w - 48, 1);
    }
    for (const region of regions) {
      if (!mapped.has(region.id)) continue;
      this.drawMappedDungeonRegion(region, tileToMap, scale, region.id === current);
    }
    for (const door of map.doors ?? []) {
      if (!mapped.has(door.region)) continue;
      this.drawMappedDoor(door, tileToMap, scale);
    }
    if (mapped.has(current)) this.drawMappedPlayerMarker(state.player, tileToMap, scale);
    ctx.restore();

    this.text(map.name.replace(" - ", "  "), panel.x + 38, panel.y + 38, "#fff4d2", 18);
    this.text("M / Esc", panel.x + panel.w - 124, panel.y + 38, "#b8cee8", 12);
    this.text("Discovered rooms are inked as you enter them.", paper.x + 30, paper.y + paper.h + 28, "#f4dfb8", 12);
    ctx.restore();
  }

  drawJournal(state) {
    const ctx = this.ctx;
    const sections = this.data.journal?.sections ?? [];
    const view = state.journalView ?? { sectionIndex: 0, entryIndex: 0, scroll: 0 };
    const sectionIndex = Math.max(0, Math.min(view.sectionIndex ?? 0, Math.max(0, sections.length - 1)));
    const section = sections[sectionIndex] ?? { entries: [] };
    const entries = section.entries ?? [];
    const entryIndex = Math.max(0, Math.min(view.entryIndex ?? 0, Math.max(0, entries.length - 1)));
    const entry = entries[entryIndex];

    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.72)";
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    if (!this.assets.draw(ctx, "journal.ui.book_spread", JOURNAL_BOOK.x, JOURNAL_BOOK.y, JOURNAL_BOOK.w, JOURNAL_BOOK.h, { smooth: true })) {
      ctx.fillStyle = "#d8bc82";
      ctx.fillRect(JOURNAL_BOOK.x + 42, JOURNAL_BOOK.y + 44, JOURNAL_BOOK.w - 84, JOURNAL_BOOK.h - 88);
    }

    this.bookText("Dungeoneer's Journal", 116, 88, "#4d2b1b", 20);
    this.bookText("J / Esc", 788, 88, "#60402b", 12);
    this.drawJournalSections(sections, sectionIndex);
    this.drawJournalEntryList(section, entries, entryIndex, state);
    if (entry) this.drawJournalEntryDetail(entry, this.journalEntryStatus(entry, state), state);
    ctx.restore();
  }

  drawJournalSections(sections, selectedIndex) {
    this.bookText("Chapters", 112, 106, "#6c3a21", 13);
    sections.forEach((section, index) => {
      const rect = {
        x: JOURNAL_CHAPTER_ROWS.x,
        y: JOURNAL_CHAPTER_ROWS.y + index * JOURNAL_CHAPTER_ROWS.rowH,
        w: JOURNAL_CHAPTER_ROWS.w,
        h: JOURNAL_CHAPTER_ROWS.h
      };
      const selected = index === selectedIndex;
      const ctx = this.ctx;
      ctx.save();
      ctx.fillStyle = selected ? "rgba(94, 55, 28, 0.22)" : "rgba(94, 55, 28, 0.07)";
      ctx.strokeStyle = selected ? "rgba(88, 45, 22, 0.76)" : "rgba(88, 45, 22, 0.22)";
      ctx.lineWidth = selected ? 1.5 : 1;
      this.roundRectPath(rect.x, rect.y, rect.w, rect.h, 4);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      this.bookText(`Chapter ${this.journalChapterNumber(index + 1)}`, rect.x + 12, rect.y + 12, selected ? "#4a2414" : "#78533b", 10);
      this.bookText(section.label, rect.x + 126, rect.y + 21, selected ? "#2f1f18" : "#6f513b", 13);
    });
  }

  drawJournalEntryList(section, entries, selectedIndex, state) {
    const ctx = this.ctx;
    this.bookText(section?.label ?? "Contents", 112, 262, "#4a2414", 16);
    this.drawJournalBookRule(112, 272, 304);
    const start = this.journalVisibleEntryStart(entries.length, selectedIndex);
    const visible = entries.slice(start, start + JOURNAL_ENTRY_ROWS.max);
    ctx.save();
    ctx.beginPath();
    ctx.rect(JOURNAL_ENTRY_ROWS.x - 4, JOURNAL_ENTRY_ROWS.y - 14, JOURNAL_ENTRY_ROWS.w + 8, JOURNAL_ENTRY_ROWS.rowH * JOURNAL_ENTRY_ROWS.max + 18);
    ctx.clip();
    visible.forEach((entry, offset) => {
      const index = start + offset;
      const status = this.journalEntryStatus(entry, state);
      const rect = {
        x: JOURNAL_ENTRY_ROWS.x,
        y: JOURNAL_ENTRY_ROWS.y + offset * JOURNAL_ENTRY_ROWS.rowH,
        w: JOURNAL_ENTRY_ROWS.w,
        h: JOURNAL_ENTRY_ROWS.h
      };
      const selected = index === selectedIndex;
      if (selected) {
        ctx.fillStyle = "rgba(94, 55, 28, 0.16)";
        this.roundRectPath(rect.x - 4, rect.y - 14, rect.w + 8, rect.h + 4, 4);
        ctx.fill();
      }
      this.bookText(this.journalStatusMark(status), rect.x + 4, rect.y, this.journalStatusColor(status), 10);
      const title = this.journalEntryListTitle(entry, status);
      this.wrapLines(title, rect.w - 54, 12).slice(0, 1).forEach((line) => {
        this.bookText(line, rect.x + 42, rect.y, selected ? "#2f1f18" : status === "locked" ? "#8a735c" : "#4d3423", 12);
      });
    });
    ctx.restore();
    if (entries.length > JOURNAL_ENTRY_ROWS.max) {
      this.bookText(`${start + 1}-${Math.min(entries.length, start + JOURNAL_ENTRY_ROWS.max)} / ${entries.length}`, 340, 552, "#6b4f3b", 10);
    }
  }

  drawJournalEntryDetail(entry, status, state) {
    const ctx = this.ctx;
    const page = JOURNAL_RIGHT_PAGE;
    const title = this.journalEntryListTitle(entry, status);
    this.wrapLines(title, page.w - 54, 18).slice(0, 2).forEach((line, index) => {
      this.bookText(line, page.x + 28, page.y + 34 + index * 22, status === "locked" ? "#7b624d" : "#342017", 18);
    });
    this.bookText(this.journalStatusLabel(status), page.x + 28, page.y + 74, this.journalStatusColor(status), 11);
    this.drawJournalBookRule(page.x + 28, page.y + 84, page.w - 58);

    if (status === "locked") {
      this.drawJournalLockedArt(page.x + 60, page.y + 128, page.w - 120, 154);
      this.bookText("This page is still blank.", page.x + 62, page.y + 326, "#7b624d", 13);
      return;
    }

    const isFloor = entry.kind === "floor" || entry.kind === "floor-overview";
    const artH = isFloor ? 136 : 146;
    this.drawJournalArt(entry.art, page.x + 28, page.y + 102, page.w - 58, artH);

    const content = { x: page.x + 28, y: page.y + 118 + artH, w: page.w - 58, h: page.h - artH - 146 };
    ctx.save();
    ctx.beginPath();
    ctx.rect(content.x, content.y, content.w, content.h);
    ctx.clip();
    let cursorY = content.y + 18 - (state.journalView?.scroll ?? 0);
    cursorY = this.drawJournalSummary(entry, status, state, content.x, cursorY, content.w);
    if (entry.kind === "npc") cursorY = this.drawJournalNpcDetails(entry, status, content.x, cursorY, content.w);
    if (entry.kind === "trap") cursorY = this.drawJournalTrapDetails(entry, status, content.x, cursorY, content.w);
    if (entry.kind === "monster-family") cursorY = this.drawJournalFamilyDetails(entry, status, state, content.x, cursorY, content.w);
    if (entry.kind === "monster") cursorY = this.drawJournalMonsterDetails(entry, status, state, content.x, cursorY, content.w);
    if (entry.kind === "floor" || entry.kind === "floor-overview") this.drawJournalFloorDetails(entry, state, content.x, cursorY, content.w);
    ctx.restore();
  }

  drawJournalLockedArt(x, y, w, h) {
    const ctx = this.ctx;
    this.roundRectPath(x, y, w, h, 6);
    ctx.fillStyle = "rgba(85, 55, 28, 0.10)";
    ctx.fill();
    ctx.strokeStyle = "rgba(77, 43, 23, 0.34)";
    ctx.stroke();
    for (let i = 0; i < 5; i++) {
      const ly = y + 34 + i * 22;
      ctx.strokeStyle = "rgba(77, 43, 23, 0.18)";
      ctx.beginPath();
      ctx.moveTo(x + 20, ly);
      ctx.lineTo(x + w - 20, ly + (i % 2 ? 2 : -1));
      ctx.stroke();
    }
    this.bookText("Unwritten", x + Math.round(w / 2) - 40, y + Math.round(h / 2) + 6, "#7b624d", 14);
  }

  drawJournalArt(assetId, x, y, w, h) {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = "rgba(103, 64, 31, 0.16)";
    this.roundRectPath(x - 5, y - 5, w + 10, h + 10, 7);
    ctx.fill();
    ctx.restore();
    ctx.save();
    this.roundRectPath(x, y, w, h, 5);
    ctx.clip();
    if (!this.drawAssetCover(assetId, x, y, w, h, { smooth: true })) {
      ctx.fillStyle = "rgba(85, 55, 28, 0.18)";
      ctx.fillRect(x, y, w, h);
    }
    ctx.restore();
    ctx.strokeStyle = "rgba(64, 37, 20, 0.62)";
    ctx.lineWidth = 1.5;
    this.roundRectPath(x, y, w, h, 5);
    ctx.stroke();
  }

  drawJournalSummary(entry, status, state, x, y, w) {
    const lines = this.wrapLines(entry.summary ?? "", w, 13).slice(0, status === "partial" ? 4 : 6);
    lines.forEach((line, index) => this.bookText(line, x, y + index * 18, "#3d2a20", 13));
    return y + lines.length * 18 + 18;
  }

  drawJournalNpcDetails(entry, status, x, y, w) {
    this.bookText(entry.role ?? "Guild contact", x, y, "#6c3a21", 13);
    y += 26;
    if (status !== "complete") return y;
    for (const note of entry.notes ?? []) {
      const lines = this.wrapLines(`- ${note}`, w, 12).slice(0, 2);
      lines.forEach((line) => {
        this.bookText(line, x, y, "#4b382b", 12);
        y += 16;
      });
      y += 4;
    }
    return y;
  }

  drawJournalTrapDetails(entry, status, x, y, w) {
    if (status !== "complete") {
      this.bookText("Effect unconfirmed.", x, y, "#7b624d", 12);
      return y + 24;
    }
    y = this.drawJournalLabelBlock("Effect", entry.effect, x, y, w);
    y = this.drawJournalLabelBlock("Counter", entry.counter, x, y + 8, w);
    return y;
  }

  drawJournalFamilyDetails(entry, status, state, x, y, w) {
    y = this.drawJournalLabelBlock("Weakness", entry.weakness, x, y, w);
    y += 8;
    this.bookText("Known Types", x, y, "#6c3a21", 14);
    y += 22;
    for (const enemyId of entry.enemyIds ?? []) {
      const enemy = this.data.enemyById[enemyId];
      const known = state.journal?.seenEnemies?.[enemyId] || state.journal?.defeatedEnemies?.[enemyId];
      this.bookText(known ? enemy?.name ?? enemyId : "Unconfirmed type", x + 8, y, known ? "#4b382b" : "#8a735c", 12);
      y += 18;
    }
    y += 8;
    y = this.drawJournalAbilityList(entry.abilities, x, y, w);
    return y;
  }

  drawJournalMonsterDetails(entry, status, state, x, y, w) {
    const enemy = this.data.enemyById[entry.enemyId];
    if (!enemy) return y;
    if (status === "complete") {
      y = this.drawJournalEnemyStats(enemy, x, y, w);
    } else {
      this.bookText("Stats pending defeat.", x, y, "#7b624d", 12);
      y += 24;
    }
    y = this.drawJournalLabelBlock("Weakness", entry.weakness, x, y + 4, w);
    y = this.drawJournalAbilityList(entry.abilities, x, y + 6, w);
    const floors = this.enemyFloorLabels(entry.enemyId).join(", ") || "No mapped floor";
    y = this.drawJournalLabelBlock("Seen On", floors, x, y + 4, w);
    const drops = Object.keys(state.journal?.harvestedItemsByEnemy?.[entry.enemyId] ?? {});
    const dropText = drops.length ? drops.map((id) => this.data.itemById[id]?.name ?? id).join(", ") : "No recovered drops yet.";
    y = this.drawJournalLabelBlock("Recovered", dropText, x, y + 4, w);
    return y;
  }

  drawJournalEnemyStats(enemy, x, y, w) {
    const rows = [
      ["HP", enemy.stats.hp],
      ["MP", enemy.stats.mp],
      ["ATK", enemy.stats.attack],
      ["MAG", enemy.stats.magic],
      ["DEF", enemy.stats.defense],
      ["AGI", enemy.stats.agility],
      ["XP", enemy.xp],
      ["Gold", enemy.gold]
    ];
    const colW = Math.floor(w / 4);
    rows.forEach(([label, value], index) => {
      const col = index % 4;
      const row = Math.floor(index / 4);
      const rx = x + col * colW;
      const ry = y + row * 28;
      this.ctx.fillStyle = "rgba(94, 55, 28, 0.10)";
      this.ctx.fillRect(rx, ry - 15, colW - 8, 22);
      this.bookText(label, rx + 6, ry, "#6c3a21", 10);
      this.bookText(String(value), rx + 42, ry, "#3d2a20", 10);
    });
    return y + 60;
  }

  drawJournalAbilityList(abilities, x, y, w) {
    if (!abilities?.length) return y;
    this.bookText("Abilities", x, y, "#6c3a21", 14);
    y += 22;
    for (const ability of abilities) {
      this.bookText(`- ${ability}`, x + 8, y, "#4b382b", 12);
      y += 17;
    }
    return y;
  }

  drawJournalLabelBlock(label, value, x, y, w) {
    if (!value) return y;
    this.bookText(label, x, y, "#6c3a21", 14);
    y += 20;
    const lines = this.wrapLines(String(value), w, 12).slice(0, 3);
    lines.forEach((line) => {
      this.bookText(line, x + 8, y, "#4b382b", 12);
      y += 16;
    });
    return y + 6;
  }

  drawJournalFloorDetails(entry, state, x, y, w) {
    const map = this.data.maps[entry.mapId];
    if (!map) return y;
    const mapped = new Set(state.dungeon?.mappedRegions?.[map.id] ?? []);
    const regionCount = map.regions?.length ?? 0;
    this.bookText(`Mapped ${mapped.size}/${regionCount} regions`, x, y, "#6c3a21", 13);
    y += 24;
    this.drawJournalFloorMiniMap(map, state, x, y, w, 120);
    y += 140;
    const trapTypes = [...new Set((map.traps ?? []).map((trap) => trap.type).filter((type) => state.journal?.seenTrapTypes?.[type] || state.journal?.triggeredTrapTypes?.[type]))];
    const enemyIds = [...new Set((map.encounters ?? []).flatMap((encounter) => encounter.enemies ?? []).filter((id) => state.journal?.seenEnemies?.[id] || state.journal?.defeatedEnemies?.[id]))];
    this.bookText(`Traps: ${trapTypes.length ? trapTypes.map((type) => this.data.trapByType[type]?.label ?? type).join(", ") : "Unconfirmed"}`, x, y, "#4b382b", 12);
    y += 18;
    this.bookText(`Monsters: ${enemyIds.length ? enemyIds.map((id) => this.data.enemyById[id]?.name ?? id).join(", ") : "Unconfirmed"}`, x, y, "#4b382b", 12);
    return y + 24;
  }

  drawJournalFloorMiniMap(map, state, x, y, w, h) {
    const regions = [...(map.corridors ?? []), ...(map.rooms ?? [])];
    if (!regions.length) return;
    const bounds = this.dungeonMapBounds(regions);
    const scale = Math.min((w - 20) / Math.max(1, bounds.w), (h - 20) / Math.max(1, bounds.h));
    const ox = x + w / 2 - (bounds.minX + bounds.w / 2) * scale;
    const oy = y + h / 2 - (bounds.minY + bounds.h / 2) * scale;
    const mapped = new Set(state.dungeon?.mappedRegions?.[map.id] ?? []);
    const current = state.dungeon?.currentRegion?.[map.id] ?? null;
    const tileToMap = (tx, ty) => ({ x: ox + tx * scale, y: oy + ty * scale });
    const ctx = this.ctx;

    ctx.save();
    this.roundRectPath(x, y, w, h, 10);
    ctx.fillStyle = "rgba(236, 219, 176, 0.16)";
    ctx.fill();
    ctx.clip();
    for (const region of regions) {
      if (!mapped.has(region.id)) continue;
      this.drawMappedDungeonRegion(region, tileToMap, scale, region.id === current);
    }
    ctx.restore();
    ctx.strokeStyle = "rgba(64, 37, 20, 0.42)";
    this.roundRectPath(x, y, w, h, 10);
    ctx.stroke();
  }

  journalVisibleEntryStart(total, selectedIndex) {
    const max = JOURNAL_ENTRY_ROWS.max;
    if (total <= max) return 0;
    return Math.max(0, Math.min(total - max, selectedIndex - Math.floor(max / 2)));
  }

  journalChapterNumber(number) {
    return ["I", "II", "III", "IV", "V", "VI"][number - 1] ?? String(number);
  }

  drawJournalBookRule(x, y, w) {
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = "rgba(77, 43, 23, 0.36)";
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y + 1);
    ctx.stroke();
    ctx.restore();
  }

  journalEntryStatus(entry, state) {
    const journal = state.journal ?? {};
    if (entry.unlockDefault) return "complete";
    if (entry.kind === "floor" || entry.kind === "floor-overview") return journal.visitedFloors?.[String(entry.floor)] ? "complete" : "locked";
    if (entry.kind === "npc") return journal.seenNpcs?.[entry.npcId] ? "complete" : "locked";
    if (entry.kind === "trap") {
      if (journal.triggeredTrapTypes?.[entry.trapType]) return "complete";
      if (journal.seenTrapTypes?.[entry.trapType]) return "partial";
      return "locked";
    }
    if (entry.kind === "monster-family") {
      const seen = (entry.enemyIds ?? []).some((enemyId) => journal.seenEnemies?.[enemyId] || journal.defeatedEnemies?.[enemyId]);
      const defeated = (entry.enemyIds ?? []).some((enemyId) => journal.defeatedEnemies?.[enemyId]);
      return defeated ? "complete" : seen ? "partial" : "locked";
    }
    if (entry.kind === "monster") {
      if (journal.defeatedEnemies?.[entry.enemyId]) return "complete";
      if (journal.seenEnemies?.[entry.enemyId]) return "partial";
      return "locked";
    }
    return "partial";
  }

  journalEntryListTitle(entry, status) {
    if (status !== "locked") return entry.title;
    if (entry.kind === "floor" || entry.kind === "floor-overview") return entry.title;
    if (entry.kind === "npc") return "Unmet guild contact";
    if (entry.kind === "trap") return "Unseen trap";
    if (entry.kind === "monster-family") return "Unconfirmed family";
    if (entry.kind === "monster") return "Unrecorded monster";
    return "Unwritten entry";
  }

  journalStatusMark(status) {
    return status === "complete" ? "INK" : status === "partial" ? "OBS" : "---";
  }

  journalStatusLabel(status) {
    return status === "complete" ? "Ink complete" : status === "partial" ? "Observed" : "Locked";
  }

  journalStatusColor(status) {
    return status === "complete" ? "#3f6f34" : status === "partial" ? "#8a5b18" : "#8a735c";
  }

  enemyFloorLabels(enemyId) {
    return Object.values(this.data.maps)
      .filter((map) => (map.encounters ?? []).some((encounter) => (encounter.enemies ?? []).includes(enemyId)))
      .map((map) => map.dungeonFloor ? `F${map.dungeonFloor}` : map.name);
  }

  dungeonMapBounds(regions) {
    const rects = regions.map((region) => region.rect);
    const minX = Math.min(...rects.map(([x]) => x));
    const minY = Math.min(...rects.map(([, y]) => y));
    const maxX = Math.max(...rects.map(([x, , w]) => x + w));
    const maxY = Math.max(...rects.map(([, y, , h]) => y + h));
    return { minX, minY, w: maxX - minX, h: maxY - minY };
  }

  drawMappedDungeonRegion(region, tileToMap, scale, current = false) {
    const [x, y, w, h] = region.rect;
    const start = tileToMap(x, y);
    const rw = w * scale;
    const rh = h * scale;
    const ctx = this.ctx;
    ctx.save();
    if (current) {
      ctx.shadowColor = "rgba(64, 139, 202, 0.42)";
      ctx.shadowBlur = 18;
    }
    ctx.fillStyle = region.kind === "corridor" ? "rgba(87, 67, 45, 0.24)" : "rgba(248, 238, 199, 0.30)";
    ctx.fillRect(start.x, start.y, rw, rh);
    ctx.strokeStyle = current ? "rgba(41, 75, 103, 0.92)" : "rgba(47, 36, 26, 0.84)";
    ctx.lineWidth = current ? 3 : 2;
    for (let pass = 0; pass < 3; pass++) {
      const jx = this.sketchJitter(`${region.id}-x-${pass}`, 1.6);
      const jy = this.sketchJitter(`${region.id}-y-${pass}`, 1.6);
      ctx.strokeRect(start.x + jx, start.y + jy, rw + this.sketchJitter(`${region.id}-w-${pass}`, 1.2), rh + this.sketchJitter(`${region.id}-h-${pass}`, 1.2));
    }
    ctx.restore();
  }

  drawMappedDoor(door, tileToMap, scale) {
    const center = tileToMap(door.x + 0.5, door.y + 0.5);
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = "rgba(105, 58, 26, 0.92)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    if (door.orientation === "ew") {
      ctx.moveTo(center.x, center.y - scale * 0.42);
      ctx.lineTo(center.x, center.y + scale * 0.42);
    } else {
      ctx.moveTo(center.x - scale * 0.42, center.y);
      ctx.lineTo(center.x + scale * 0.42, center.y);
    }
    ctx.stroke();
    ctx.restore();
  }

  drawMappedPlayerMarker(player, tileToMap, scale) {
    const p = tileToMap(player.x + 0.5, player.y + 0.5);
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = "rgba(34, 78, 119, 0.94)";
    ctx.strokeStyle = "rgba(255, 244, 210, 0.9)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, Math.max(5, scale * 0.38), 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  sketchJitter(seed, amount) {
    const text = String(seed);
    let hash = 2166136261;
    for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
    return (((hash >>> 0) / 4294967295) * 2 - 1) * amount;
  }

  drawInventory(state) {
    const rows = Object.entries(state.inventory).filter(([, count]) => count > 0);
    rows.forEach(([id, count], i) => {
      const item = this.data.itemById[id];
      const y = 160 + i * 50;
      this.drawSelectionHighlight(136, y - 22, 560, 42, 0.34);
      this.assets.draw(this.ctx, item.icon, 152, y - 16, 32, 32);
      this.text(item.name, 200, y + 7, "#fff6df", 16);
      this.text(`x${count}`, 638, y + 7, "#9bd6ff", 15);
    });
  }

  drawParty(state) {
    const drag = state.pointerUi?.partyDrag;
    if (state.dungeon?.currentFloor) this.text(`Moonroot Floor ${state.dungeon.currentFloor} | Deepest ${state.dungeon.deepestFloor ?? state.dungeon.currentFloor}`, 660, 88, "#b8cee8", 13);
    state.partyOrder.forEach((id, i) => {
      if (drag && i === drag.from) return;
      const base = this.data.partyById[id];
      const live = state.party.find((p) => p.id === id);
      this.drawPartyCard(base, live, PARTY_CARD_X + i * PARTY_CARD_GAP, PARTY_CARD_Y, 1);
    });
    if (drag) {
      const targetX = PARTY_CARD_X + drag.target * PARTY_CARD_GAP;
      this.drawSelectionHighlight(targetX + 8, PARTY_CARD_Y - 34, PARTY_CARD_W - 16, 26, 1);
      const base = this.data.partyById[state.partyOrder[drag.from]];
      const live = state.party.find((p) => p.id === base.id);
      this.drawPartyCard(base, live, drag.x - drag.offsetX, drag.y - drag.offsetY, 0.82);
    }
  }

  drawPartyCard(base, live, x, y, alpha = 1) {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = alpha;
    this.drawGlassPanel(x, y, PARTY_CARD_W, PARTY_CARD_H, 18);
    ctx.fillStyle = "rgba(255, 229, 165, 0.32)";
    ctx.fillRect(x + 18, y + 18, PARTY_CARD_W - 36, 2);
    this.roundRectPath(x + 18, y + 30, PARTY_CARD_W - 36, 166, 14);
    ctx.fillStyle = "rgba(4, 8, 18, 0.54)";
    ctx.fill();
    this.drawActorPortrait(base, x + 22, y + 34, PARTY_CARD_W - 44, 158);
    ctx.strokeStyle = "rgba(255, 229, 165, 0.56)";
    ctx.lineWidth = 1.5;
    this.roundRectPath(x + 18, y + 30, PARTY_CARD_W - 36, 166, 14);
    ctx.stroke();
    ctx.restore();
    this.text(base.name.split(" ")[0], x + 18, y + 222, "#fff4d2", 17);
    this.text(base.class, x + 18, y + 246, "#9bd6ff", 13);
    this.text("HP", x + 18, y + 278, "#f8f1dc", 11);
    this.drawMeter(x + 50, y + 266, 120, 13, live.hp / base.stats.hp, "#e74c5b");
    this.text("MP", x + 18, y + 302, "#f8f1dc", 11);
    this.drawMeter(x + 50, y + 290, 120, 13, live.mp / base.stats.mp, "#459bff");
    this.text("ULT", x + 18, y + 326, "#f8f1dc", 11);
    this.drawMeter(x + 50, y + 314, 120, 13, (live.ult ?? 0) / 100, "#8ecf72");
  }

  drawActorPortrait(actor, x, y, w, h) {
    if (actor.portraitCrop) return this.drawAssetCover(actor.portrait, x, y, w, h, { crop: actor.portraitCrop, smooth: true });
    return this.drawAssetCover(actor.portrait, x, y, w, h, { smooth: true });
  }

  drawPartyProfile(state) {
    const profile = state.pointerUi.partyProfile;
    const base = this.data.partyById[profile.id];
    if (base.profileLayout === "scene") return this.drawScenePartyProfile(state, base, profile);
    const live = state.party.find((p) => p.id === base.id);
    const ctx = this.ctx;

    const backdrop = ctx.createLinearGradient(0, 0, VIEW_W, VIEW_H);
    backdrop.addColorStop(0, "#091023");
    backdrop.addColorStop(0.46, "#10224a");
    backdrop.addColorStop(1, "#050814");
    ctx.fillStyle = backdrop;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.fillStyle = "rgba(255, 229, 165, 0.05)";
    for (let i = 0; i < 7; i++) ctx.fillRect(140 + i * 118, 24, 1, 592);
    ctx.fillStyle = "rgba(85, 165, 255, 0.05)";
    ctx.beginPath();
    ctx.ellipse(420, 338, 350, 260, 0, 0, Math.PI * 2);
    ctx.fill();

    this.drawGlassPanel(32, 24, 896, 592, 26);
    this.drawGlassPanel(72, 108, 410, 438, 24);
    this.drawActorPortrait(base, 94, 130, 366, 366);
    this.drawSelectionHighlight(118, 514, 318, 36, 0.58);
    this.text(base.name, 132, 538, "#fff4d2", 18);

    const panel = { x: 526, y: 92, w: 350, h: 476, r: 22 };
    this.drawGlassPanel(panel.x, panel.y, panel.w, panel.h, panel.r);

    this.drawProfileBackButton();
    this.text(base.name, panel.x + 28, panel.y + 48, "#fff4d2", 24);
    this.text(`${base.class} / ${base.role}`, panel.x + 30, panel.y + 76, "#9bd6ff", 14);
    this.drawProfileStats(base, live, panel.x + 28, panel.y + 116, panel.w - 56);
    this.drawProfileBiography(base, panel.x + 28, panel.y + 300, panel.w - 56, 140, profile.bioScroll ?? 0);
  }

  drawScenePartyProfile(state, base, profile) {
    const live = state.party.find((p) => p.id === base.id);
    const ctx = this.ctx;

    this.drawAssetCover(base.profile, 0, 0, VIEW_W, VIEW_H, { focusX: 0.5, focusY: 0.5, smooth: true });
    const shade = ctx.createLinearGradient(0, 0, VIEW_W, 0);
    shade.addColorStop(0, "rgba(4, 7, 14, 0.08)");
    shade.addColorStop(0.52, "rgba(4, 7, 14, 0.12)");
    shade.addColorStop(1, "rgba(4, 7, 14, 0.54)");
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);

    const panel = { x: 550, y: 34, w: 360, h: 572, r: 34 };
    this.roundRectPath(panel.x, panel.y, panel.w, panel.h, panel.r);
    ctx.save();
    ctx.clip();
    const glass = ctx.createLinearGradient(panel.x, panel.y, panel.x + panel.w, panel.y);
    glass.addColorStop(0, "rgba(8, 13, 28, 0.62)");
    glass.addColorStop(1, "rgba(8, 13, 28, 0.42)");
    ctx.fillStyle = glass;
    ctx.fillRect(panel.x, panel.y, panel.w, panel.h);
    ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
    ctx.fillRect(panel.x, panel.y, panel.w, panel.h);
    ctx.restore();

    ctx.save();
    this.roundRectPath(panel.x, panel.y, panel.w, panel.h, panel.r);
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(255, 229, 165, 0.78)";
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.28)";
    ctx.stroke();
    ctx.restore();

    this.drawProfileBackButton();
    this.text(base.name, panel.x + 34, panel.y + 62, "#fff4d2", 26);
    this.text(base.class, panel.x + 36, panel.y + 88, "#b8cee8", 15);
    this.drawProfileStats(base, live, panel.x + 34, panel.y + 126, panel.w - 68);
    this.drawProfileBiography(base, panel.x + 34, panel.y + 328, panel.w - 68, 188, profile.bioScroll ?? 0);
  }

  drawProfileBackButton() {
    const ctx = this.ctx;
    const x = 28;
    const y = 24;
    const w = 92;
    const h = 34;
    ctx.save();
    this.roundRectPath(x, y, w, h, 8);
    ctx.fillStyle = "rgba(8, 13, 28, 0.58)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 229, 165, 0.68)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
    this.text("< Back", x + 14, y + 23, "#fff4d2", 14);
  }

  drawProfileStats(base, live, x, y, w) {
    this.text("Stats", x, y, "#ffe9a9", 19);
    const rows = [
      [`LV`, `${base.level}`],
      [`Role`, base.role],
      [`HP`, `${live.hp}/${base.stats.hp}`],
      [`MP`, `${live.mp}/${base.stats.mp}`],
      [`ATK`, `${base.stats.attack}`],
      [`MAG`, `${base.stats.magic}`],
      [`DEF`, `${base.stats.defense}`],
      [`AGI`, `${base.stats.agility}`]
    ];
    const colW = Math.floor(w / 2);
    rows.forEach(([label, value], index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const rx = x + col * colW;
      const ry = y + 38 + row * 32;
      this.ctx.fillStyle = "rgba(255, 244, 210, 0.12)";
      this.ctx.fillRect(rx, ry - 19, colW - 10, 24);
      this.text(label, rx + 8, ry, "#9bd6ff", 12);
      this.text(value, rx + 50, ry, "#fff6df", 12);
    });
  }

  drawProfileBiography(base, x, y, w, h, scroll) {
    const ctx = this.ctx;
    this.text("Biography", x, y, "#ffe9a9", 19);
    const boxY = y + 24;
    ctx.save();
    ctx.fillStyle = "rgba(255, 244, 210, 0.14)";
    ctx.fillRect(x, boxY, w, h);
    ctx.strokeStyle = "rgba(255, 229, 165, 0.42)";
    ctx.strokeRect(x, boxY, w, h);
    ctx.beginPath();
    ctx.rect(x + 12, boxY + 12, w - 28, h - 24);
    ctx.clip();
    const lines = this.wrapLines(base.profileBio ?? base.lore, w - 36, 14);
    lines.forEach((line, index) => {
      const lineY = boxY + 32 + index * 22 - scroll;
      if (lineY > boxY && lineY < boxY + h + 18) this.text(line, x + 14, lineY, "#fff6df", 14);
    });
    ctx.restore();

    const contentH = this.wrapLines(base.profileBio ?? base.lore, w - 36, 14).length * 22;
    if (contentH > h - 24) {
      const maxScroll = Math.max(1, contentH - (h - 24));
      const thumbH = Math.max(28, Math.round((h - 24) * ((h - 24) / contentH)));
      const thumbY = boxY + 12 + Math.round((h - 24 - thumbH) * Math.min(1, scroll / maxScroll));
      ctx.fillStyle = "rgba(255, 229, 165, 0.52)";
      ctx.fillRect(x + w - 10, thumbY, 4, thumbH);
    }
  }

  drawQuests(state) {
    const quests = this.liveQuests(state);
    if (!quests.length) {
      this.text("No active quests.", 136, 176, "#b8cee8", 15);
      return;
    }

    const selectedIndex = Math.max(0, Math.min(state.menu.index ?? 0, quests.length - 1));
    const selected = quests[selectedIndex];
    const left = { x: 120, y: 148, w: 250, rowH: 72 };
    const right = { x: 396, y: 148, w: 410 };

    quests.forEach(({ quest, live }, index) => {
      const y = left.y + index * left.rowH;
      const selectedRow = index === selectedIndex;
      this.drawSelectionHighlight(left.x, y, left.w, 62, selectedRow ? 1 : 0.28);
      this.text(live.complete ? "Complete" : "Open", left.x + 16, y + 21, live.complete ? "#8ecf72" : "#9bd6ff", 12);
      this.wrapLines(quest.name, left.w - 28, 15).slice(0, 2).forEach((line, lineIndex) => {
        this.text(line, left.x + 16, y + 43 + lineIndex * 16, "#fff4d2", 15);
      });
    });

    this.drawQuestDetails(selected.quest, selected.live, right.x, right.y, right.w);
  }

  liveQuests(state) {
    return this.data.quests
      .map((quest) => ({ quest, live: state.quests?.[quest.id] }))
      .filter((row) => row.live);
  }

  questStageIndex(quest, live) {
    return Math.max(0, Math.min(quest.stages.length - 1, live?.stage ?? 0));
  }

  questObjectiveTitle(quest, index) {
    return quest.stages?.[index] ?? "Objective";
  }

  questObjectiveText(quest, index, complete = false) {
    const objective = quest.objectives?.[index];
    return complete ? (objective?.completeText ?? objective?.text ?? this.questObjectiveTitle(quest, index)) : (objective?.text ?? this.questObjectiveTitle(quest, index));
  }

  drawQuestDetails(quest, live, x, y, w) {
    const stageIndex = this.questStageIndex(quest, live);
    this.text(quest.name, x, y + 20, "#fff4d2", 20);
    this.text(live.complete ? "Complete" : "Current Objective", x, y + 50, live.complete ? "#8ecf72" : "#9bd6ff", 12);

    let cursorY = y + 78;
    this.wrapLines(quest.description ?? "", w, 13).slice(0, 4).forEach((line) => {
      this.text(line, x, cursorY, "#dcecff", 13);
      cursorY += 18;
    });

    cursorY += 14;
    this.drawSelectionHighlight(x - 10, cursorY - 22, w + 20, 70, 0.42);
    this.text(this.questObjectiveTitle(quest, stageIndex), x, cursorY, "#ffe9a9", 15);
    this.wrapLines(this.questObjectiveText(quest, stageIndex), w - 6, 12).slice(0, 2).forEach((line, lineIndex) => {
      this.text(line, x, cursorY + 24 + lineIndex * 16, "#f8f1dc", 12);
    });
    cursorY += 86;

    const completedCount = live.complete ? stageIndex + 1 : stageIndex;
    if (completedCount <= 0) return;
    this.text("Completed", x, cursorY, "#8ecf72", 13);
    cursorY += 24;
    for (let index = 0; index < completedCount && cursorY < 532; index++) {
      this.text(`- ${this.questObjectiveTitle(quest, index)}`, x, cursorY, "#b8cee8", 12);
      cursorY += 19;
    }
  }

  drawSettings(state) {
    const settings = state.audioSettings ?? {};
    const partyDisplayMode = state.gameSettings?.partyDisplayMode ?? "full";
    this.text("Sound Options", 136, 154, "#ffe9a9", 18);
    AUDIO_SETTING_ROWS.forEach((row, index) => {
      const y = 196 + index * 58;
      const value = Math.max(0, Math.min(1, settings[row.key] ?? 0));
      this.drawSelectionHighlight(136, y - 32, 560, 48, index === state.menu.index ? 1 : 0.28);
      this.text(row.label, 158, y, "#f8f1dc", 17);
      this.drawMeter(292, y - 15, 280, 16, value, "#77d6b2");
      this.text(`${Math.round(value * 100)}%`, 604, y, "#ffe9a9", 15);
    });

    const partyIndex = AUDIO_SETTING_ROWS.length;
    const rowY = 424;
    this.text("Party Display", 136, 376, "#ffe9a9", 18);
    this.drawSelectionHighlight(136, rowY - 32, 642, 58, partyIndex === state.menu.index ? 1 : 0.28);
    this.text("Field Party", 158, rowY + 2, "#f8f1dc", 17);

    PARTY_DISPLAY_OPTIONS.forEach((option, index) => {
      const selected = option.key === partyDisplayMode;
      const x = 336 + index * 188;
      const y = rowY - 26;
      const w = 176;
      const h = 38;
      const ctx = this.ctx;
      ctx.save();
      this.roundRectPath(x, y, w, h, 10);
      ctx.fillStyle = selected ? "rgba(255, 229, 165, 0.30)" : "rgba(8, 13, 28, 0.42)";
      ctx.fill();
      ctx.strokeStyle = selected ? "rgba(255, 229, 165, 0.86)" : "rgba(155, 214, 255, 0.36)";
      ctx.lineWidth = selected ? 2 : 1;
      ctx.stroke();
      ctx.restore();
      const labelW = this.textWidth(option.label, 14);
      this.text(option.label, x + Math.round((w - labelW) / 2), y + 25, selected ? "#fff4d2" : "#b8cee8", 14);
    });
  }

  drawShop(state) {
    const shop = this.data.shopById[state.shop.id];
    this.drawGlassPanel(86, 72, 790, 500, 24);
    this.drawMenuTitle(shop.name, 130, 116);
    this.text(shop.greeting, 130, 150, "#b8cee8", 14);
    shop.items.forEach((row, i) => {
      const item = this.data.itemById[row.id];
      const y = 188 + i * 55;
      this.drawSelectionHighlight(132, y - 12, 600, 48, i === state.menu.index ? 1 : 0.28);
      this.assets.draw(this.ctx, item.icon, 150, y, 38, 38);
      this.text(item.name, 206, y + 26, "#f8f1dc", 16);
      this.text(`${item.price}g`, 638, y + 26, "#ffe9a9", 15);
    });
    this.text(`Gold ${state.gold}`, 130, 526, "#ffe9a9", 14);
  }

  drawHarvest(state) {
    const harvest = state.harvest;
    const remains = harvest?.remains?.[harvest.currentIndex];
    const ctx = this.ctx;
    const backdrop = this.data.maps[state.mapId]?.backdrop ?? "backdrop.dungeon";
    this.assets.draw(ctx, backdrop, 0, 0, VIEW_W, VIEW_H);
    ctx.fillStyle = "rgba(3, 7, 16, 0.68)";
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    if (!this.assets.draw(ctx, "ui.victory.harvest_panel", 24, 32, 912, 560)) this.drawGlassPanel(54, 42, 852, 552, 24);
    this.drawMenuTitle("Victory Harvest", 90, 154);
    this.text(`XP ${harvest?.victory?.xp ?? 0}  Gold ${harvest?.victory?.gold ?? 0}`, 706, 154, "#ffe9a9", 15);
    if (!remains) return;

    const profile = this.data.harvestProfileByEnemyId[remains.enemyId];
    this.text(`${remains.name} remains`, 90, 196, "#fff4d2", 22);
    this.text(`Killed by: ${this.formatDamageType(remains.killedByDamageType)}`, 90, 224, "#b8cee8", 14);
    this.text(`Choices left: ${Math.max(0, remains.harvestChoices - remains.selectedOptions.length)}`, 90, 248, "#9bd6ff", 14);

    if (remains.result) {
      this.drawHarvestResult(remains);
      return;
    }

    HARVEST_OPTION_KEYS.forEach((key, index) => {
      const option = profile.harvestOptions[key];
      const rect = this.harvestOptionRect(index);
      const selected = remains.selectedOptions.includes(key);
      if (!this.assets.draw(ctx, "ui.victory.harvest_option", rect.x, rect.y, rect.w, rect.h, { alpha: index === state.menu.index ? 1 : selected ? 0.84 : 0.48 })) {
        this.drawSelectionHighlight(rect.x, rect.y, rect.w, rect.h, index === state.menu.index ? 1 : selected ? 0.72 : 0.26);
      }
      this.text(`${selected ? "[x]" : "[ ]"} ${option.label}`, rect.x + 72, rect.y + 28, selected ? "#fff4d2" : "#f8f1dc", 16);
      this.text(option.description, rect.x + 72, rect.y + 48, "#b8cee8", 12);
      const likely = this.harvestLikelyItems(option, remains.killedByDamageType)
        .map((itemId) => this.data.itemById[itemId]?.name ?? itemId)
        .join(", ");
      this.wrapLines(`Likely: ${likely}`, 240, 12).slice(0, 2).forEach((line, lineIndex) => {
        this.text(line, rect.x + 350, rect.y + 40 + lineIndex * 15, "#ffe9a9", 12);
      });
    });

    this.drawHarvestSidePanel(remains);
  }

  drawHarvestSidePanel(remains) {
    const x = 642;
    const y = 226;
    if (!this.assets.draw(this.ctx, "ui.victory.harvest_side_panel", x, y, 260, 338)) this.drawGlassPanel(x, y, 216, 304, 16);
    this.text("Selections", x + 44, y + 92, "#ffe9a9", 18);
    if (!remains.selectedOptions.length) this.wrapLines("Choose two harvest actions.", 190, 12).forEach((line, index) => {
      this.text(line, x + 34, y + 128 + index * 17, "#b8cee8", 12);
    });
    remains.selectedOptions.forEach((key, index) => {
      const option = this.data.harvestProfileByEnemyId[remains.enemyId].harvestOptions[key];
      this.text(option.label, x + 34, y + 136 + index * 30, "#fff6df", 14);
    });
    const ready = remains.selectedOptions.length >= remains.harvestChoices;
    const rect = this.harvestResolveRect();
    if (!this.assets.draw(this.ctx, "ui.victory.harvest_button", rect.x, rect.y, rect.w, rect.h, { alpha: ready ? 1 : 0.42 })) {
      this.drawSelectionHighlight(rect.x, rect.y, rect.w, rect.h, ready ? 0.86 : 0.24);
    }
    this.text(ready ? "Resolve harvest" : "Select 2", rect.x + 30, rect.y + 28, ready ? "#fff4d2" : "#b8cee8", 15);
    this.wrapLines("Esc removes the last choice.", 190, 11).forEach((line, index) => {
      this.text(line, x + 34, y + 256 + index * 15, "#9bd6ff", 11);
    });
  }

  drawHarvestResult(remains) {
    const result = remains.result;
    if (!this.assets.draw(this.ctx, "ui.victory.harvest_side_panel", 92, 214, 520, 300)) this.drawGlassPanel(92, 214, 484, 294, 18);
    this.text("Recovered", 122, 254, "#ffe9a9", 20);
    result.items.forEach((item, index) => {
      const dataItem = this.data.itemById[item.itemId];
      const y = 296 + index * 42;
      this.assets.draw(this.ctx, dataItem.icon, 124, y - 24, 30, 30);
      this.text(`${dataItem.name} x${item.count}`, 168, y, "#fff6df", 15);
    });
    result.reactions.forEach((reaction, index) => {
      const lines = this.wrapLines(`${reaction.speaker}: "${reaction.text}"`, 660, 14);
      lines.slice(0, 3).forEach((line, lineIndex) => this.text(line, 122, 430 + index * 72 + lineIndex * 20, "#dcecff", 14));
    });
    if (!this.assets.draw(this.ctx, "ui.victory.harvest_button", 650, 528, 220, 52)) this.drawSelectionHighlight(650, 530, 178, 40, 0.86);
    this.text("Continue", 708, 562, "#fff4d2", 15);
  }

  harvestOptionRect(index) {
    return { x: 48, y: 272 + index * 70, w: 590, h: 66 };
  }

  harvestResolveRect() {
    return { x: 690, y: 508, w: 178, h: 42 };
  }

  harvestLikelyItems(option, damageType) {
    return option.byKillingDamageType?.[damageType] ?? option.common ?? [];
  }

  formatDamageType(type) {
    return `${(type ?? "magic").charAt(0).toUpperCase()}${(type ?? "magic").slice(1)}`;
  }

  drawCombat(state) {
    const c = state.combat;
    const backdrop = c.backdrop ?? (c.boss ? (this.data.maps[state.mapId].bossBackdrop ?? "backdrop.boss") : this.data.maps[state.mapId].backdrop);
    if (!this.drawAssetCover(backdrop, 0, 0, VIEW_W, VIEW_H, { smooth: true })) {
      this.assets.draw(this.ctx, backdrop, 0, 0, VIEW_W, VIEW_H);
    }
    const enemyLayouts = [];
    c.enemies.forEach((enemy, i) => {
      if (enemy.hp <= 0) return;
      const layout = this.combatEnemyLayout(enemy, i, c);
      const sprite = this.combatEnemySprite(enemy, i);
      enemyLayouts.push({ enemy, ...layout });
      this.assets.draw(this.ctx, sprite.asset, layout.x, layout.y, layout.w, layout.h, { frame: sprite.frame, flipX: sprite.flipX });
      const label = `${enemy.name} ${enemy.hp}HP`;
      const labelW = this.textWidth(label, 13);
      const labelX = Math.max(18, Math.min(VIEW_W - labelW - 18, layout.x + layout.w / 2 - labelW / 2));
      this.text(label, labelX, layout.y + layout.h + 22, "#fff6df", 13);
    });
    const partyLayouts = [];
    state.partyOrder.forEach((id, i) => {
      const base = this.data.partyById[id];
      const live = state.party.find((p) => p.id === id);
      const sprite = this.combatPartySprite(base, i, c);
      const layout = this.combatPartyLayout(base, i, sprite, c);
      partyLayouts.push({ actor: base, live, sprite, ...layout });
      this.assets.draw(this.ctx, sprite.asset, layout.x, layout.y, sprite.w, sprite.h, { frame: sprite.frame, flipX: sprite.flipX });
    });
    this.drawCombatActionEffects(c, partyLayouts, enemyLayouts);
    this.drawCombatIndicators(c, partyLayouts, enemyLayouts);
    this.text(c.log, 58, 404, "#ffe9a9", 16);
    if (!this.assets.draw(this.ctx, "ui.combat.panel", COMBAT_PANEL.x, COMBAT_PANEL.y, COMBAT_PANEL.w, COMBAT_PANEL.h)) this.assets.draw(this.ctx, "ui.dialogue", COMBAT_PANEL.x, COMBAT_PANEL.y, COMBAT_PANEL.w, COMBAT_PANEL.h);
    const actor = c.turn && c.turn.side === "party" ? this.data.partyById[c.turn.id] : null;
    if (actor) this.text(`${actor.name.split(" ")[0]}'s turn`, 722, 462, "#f8f1dc", 13);
    if (c.menu === "root") this.combatList(["Attack", "Skill", "Item", "Defend", "Flee"], state.menu.index, COMBAT_MENU.x, COMBAT_MENU.y);
    if (c.menu === "skills" && actor) {
      const skills = actor.skills.concat(state.party.find((p) => p.id === actor.id).ult >= 100 ? [actor.ultimate] : []);
      this.combatList(skills.map((id) => this.data.skillById[id].name), state.menu.index, COMBAT_MENU.x, COMBAT_MENU.y);
    }
    if (c.menu === "items") this.combatList(Object.keys(state.inventory).filter((id) => state.inventory[id] > 0).map((id) => this.data.itemById[id].name), state.menu.index, COMBAT_MENU.x, COMBAT_MENU.y);
    this.drawCombatPartyStatus(state);
  }

  combatEnemyLayout(enemy, index, combat) {
    const drawW = enemy.boss ? 250 : enemy.drawW ?? 95;
    const drawH = enemy.boss ? 170 : enemy.drawH ?? 95;
    let x = 618 + index * 120 - Math.round(drawW / 2);
    let y = 286 - drawH - (enemy.boss ? 65 : 0);
    const action = combat?.action;
    const progress = this.combatActionProgress(action);
    const pulse = Math.sin(progress * Math.PI);
    if (action?.side === "enemy" && action.enemyIndex === enemy.index) x -= Math.round(26 * pulse);
    if (action?.side === "party" && action.targetIndexes?.includes(enemy.index) && progress > 0.35) x += Math.round(Math.sin(progress * 42) * 4 * (1 - progress));
    return { x, y, w: drawW, h: drawH };
  }

  combatEnemySprite(enemy, index = 0) {
    const asset = enemy.asset;
    const animation = this.assets.manifest.images?.[asset]?.animation;
    if (!animation) return { asset, frame: undefined, flipX: false };
    const frames = Math.max(1, animation.frames ?? 1);
    const leftRow = animation.rows?.left ?? 1;
    const frame = leftRow * frames + (this.assets.animationFrame(asset, performance.now() + index * 140) % frames);
    return { asset, frame, flipX: false };
  }

  combatPartyLayout(actor, index, sprite, combat) {
    let x = 64 + index * 106;
    let y = 345 - sprite.h;
    const action = combat?.action;
    const progress = this.combatActionProgress(action);
    const pulse = Math.sin(progress * Math.PI);
    if (action?.side === "party" && action.actorId === actor.id) {
      x += Math.round(40 * pulse);
      y -= Math.round(7 * pulse);
    }
    if (action?.side === "enemy" && action.targetActorId === actor.id && progress > 0.35) x -= Math.round(Math.sin(progress * 40) * 3 * (1 - progress));
    return { x, y, w: sprite.w, h: sprite.h };
  }

  combatPartySprite(actor, index, combat = null) {
    const acting = combat?.action?.side === "party" && combat.action.actorId === actor.id;
    const asset = (acting ? actor.sprites?.move : actor.sprites?.idle) ?? actor.sprites?.move;
    const animation = this.assets.manifest.images?.[asset]?.animation;
    const drawW = actor.draw?.w ?? 58;
    const drawH = actor.draw?.h ?? 74;
    if (asset && animation) {
      return {
        asset,
        frame: this.actorMovementFrame(asset, "right", acting || Boolean(actor.sprites?.idle), performance.now() + index * 180, acting ? actor.id : null),
        flipX: false,
        w: drawW,
        h: drawH
      };
    }
    return { asset: actor.asset, frame: undefined, flipX: true, w: drawW, h: drawH };
  }

  combatActionProgress(action) {
    if (!action?.duration) return 0;
    return Math.max(0, Math.min(1, (action.elapsed ?? 0) / action.duration));
  }

  drawCombatActionEffects(combat, partyLayouts, enemyLayouts) {
    const action = combat?.action;
    if (!action) return;
    const ctx = this.ctx;
    const progress = this.combatActionProgress(action);
    const pulse = Math.sin(progress * Math.PI);
    const targets = action.targetIndexes?.length
      ? enemyLayouts.filter((layout) => action.targetIndexes.includes(layout.enemy.index))
      : enemyLayouts.slice(0, 1);
    if (this.drawGeneratedCombatEffect(action, progress, targets, partyLayouts)) return;
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (["strike", "shield-slash", "pierce"].includes(action.effect)) {
      const color = action.effect === "shield-slash" ? "rgba(116, 184, 255," : action.effect === "pierce" ? "rgba(222, 255, 190," : "rgba(255, 238, 170,";
      for (const target of targets) {
        const cx = target.x + target.w * 0.52;
        const cy = target.y + target.h * 0.45;
        ctx.strokeStyle = `${color}${0.72 * pulse})`;
        ctx.lineWidth = action.effect === "pierce" ? 3 : 5;
        ctx.beginPath();
        ctx.moveTo(cx - 34, cy + 20 - pulse * 16);
        ctx.lineTo(cx + 32, cy - 18 + pulse * 10);
        ctx.stroke();
        if (action.effect === "shield-slash") {
          ctx.strokeStyle = `rgba(255, 232, 154, ${0.58 * pulse})`;
          ctx.strokeRect(cx - 24, cy - 28, 48, 56);
        }
      }
    } else if (action.effect === "fire" || action.effect === "magic") {
      for (const target of targets) {
        const cx = target.x + target.w * 0.5;
        const cy = target.y + target.h * 0.45;
        const radius = 16 + 28 * pulse;
        const gradient = ctx.createRadialGradient(cx, cy, 2, cx, cy, radius);
        gradient.addColorStop(0, action.effect === "fire" ? `rgba(255, 220, 116, ${0.86 * pulse})` : `rgba(165, 226, 255, ${0.82 * pulse})`);
        gradient.addColorStop(1, action.effect === "fire" ? "rgba(255, 90, 38, 0)" : "rgba(111, 99, 255, 0)");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (action.effect === "heal" || action.effect === "guard" || action.effect === "barrier" || action.effect === "smoke") {
      const layouts = action.effect === "heal" ? partyLayouts : partyLayouts.filter((layout) => layout.actor.id === action.actorId);
      for (const layout of layouts) {
        const cx = layout.x + layout.w / 2;
        const cy = layout.y + layout.h * 0.55;
        ctx.strokeStyle = action.effect === "heal" ? `rgba(255, 238, 170, ${0.68 * pulse})` : `rgba(116, 184, 255, ${0.72 * pulse})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(cx, cy, 22 + 18 * pulse, 9 + 7 * pulse, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else if (action.effect === "enemy-strike") {
      const target = partyLayouts.find((layout) => layout.actor.id === action.targetActorId);
      if (target) {
        const cx = target.x + target.w / 2;
        const cy = target.y + target.h * 0.45;
        ctx.strokeStyle = `rgba(255, 110, 96, ${0.7 * pulse})`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(cx - 22, cy - 12);
        ctx.lineTo(cx + 24, cy + 14);
        ctx.moveTo(cx + 20, cy - 16);
        ctx.lineTo(cx - 18, cy + 16);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  drawGeneratedCombatEffect(action, progress, enemyTargets, partyLayouts) {
    const asset = BATTLE_EFFECT_ASSETS[action.effect];
    if (!asset) return false;
    const frame = Math.min(5, Math.max(0, Math.floor(progress * 6)));
    const draw = (x, y, size, options = {}) => this.assets.draw(this.ctx, asset, x - size / 2, y - size / 2, size, size, { frame, ...options });
    let drew = false;
    if (["strike", "shield-slash", "shield-bash", "pierce", "fire", "frost", "magic", "arcane"].includes(action.effect)) {
      const size = ["fire", "frost", "magic", "arcane"].includes(action.effect) ? 176 : 152;
      for (const target of enemyTargets) {
        const cx = target.x + target.w * 0.52;
        const cy = target.y + target.h * 0.48;
        drew = draw(cx, cy, size) || drew;
      }
    } else if (action.effect === "heal") {
      for (const layout of partyLayouts) {
        drew = draw(layout.x + layout.w / 2, layout.y + layout.h * 0.55, 138) || drew;
      }
    } else if (action.effect === "barrier" || action.effect === "guard") {
      const layouts = action.skillId === "radiant-veil" ? partyLayouts : partyLayouts.filter((layout) => layout.actor.id === action.actorId);
      for (const layout of layouts) {
        drew = draw(layout.x + layout.w / 2, layout.y + layout.h * 0.54, 152) || drew;
      }
    } else if (action.effect === "smoke") {
      for (const layout of partyLayouts.filter((item) => item.actor.id === action.actorId)) {
        drew = draw(layout.x + layout.w / 2, layout.y + layout.h * 0.68, 132) || drew;
      }
    } else if (action.effect === "enemy-strike") {
      const target = partyLayouts.find((layout) => layout.actor.id === action.targetActorId);
      if (target) drew = draw(target.x + target.w / 2, target.y + target.h * 0.45, 138, { flipX: true }) || drew;
    }
    return drew;
  }

  drawCombatIndicators(combat, partyLayouts, enemyLayouts) {
    const action = combat?.action;
    const indicators = action?.indicators ?? [];
    if (!indicators.length) return;
    const ctx = this.ctx;
    const progress = this.combatActionProgress(action);
    const alpha = Math.max(0, Math.min(1, progress < 0.72 ? 1 : (1 - progress) / 0.28));
    const rise = Math.round(progress * 12);
    ctx.save();
    ctx.font = "20px monospace";
    ctx.textBaseline = "alphabetic";
    for (const indicator of indicators) {
      const target = this.combatIndicatorTarget(indicator, partyLayouts, enemyLayouts);
      if (!target || !indicator.amount) continue;
      const kind = indicator.kind ?? "damage";
      const color = kind === "heal" ? "#72f29a" : kind === "mitigation" ? "#7bbdff" : "#ff6464";
      const value = kind === "heal" ? `+${indicator.amount}` : `${indicator.amount}`;
      const textW = ctx.measureText(value).width;
      const stack = indicator.stack ?? 0;
      const x = target.x + target.w / 2 - (textW + 28) / 2;
      const y = Math.max(28, target.y - 16 - stack * 22 - rise);
      const iconFrame = this.combatIndicatorIconFrame(indicator);
      this.assets.draw(ctx, "battle.status_icons", x, y - 22, 22, 22, { frame: iconFrame, smooth: true, alpha });
      ctx.globalAlpha = alpha;
      ctx.fillStyle = "#0b1020";
      ctx.fillText(value, x + 29, y + 2);
      ctx.fillStyle = color;
      ctx.fillText(value, x + 27, y);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  combatIndicatorTarget(indicator, partyLayouts, enemyLayouts) {
    if (indicator.side === "enemy") return enemyLayouts.find((layout) => layout.enemy.index === indicator.enemyIndex);
    return partyLayouts.find((layout) => layout.actor.id === indicator.actorId);
  }

  combatIndicatorIconFrame(indicator) {
    if (indicator.kind === "heal") return STATUS_ICON_FRAMES.heal;
    if (indicator.kind === "mitigation") return STATUS_ICON_FRAMES.mitigation;
    return STATUS_ICON_FRAMES[indicator.damageType] ?? STATUS_ICON_FRAMES.slash;
  }

  drawCombatPartyStatus(state) {
    const { nameX, barX, barW, hpH, mpH, startY, rowGap } = this.combatStatusLayout();
    state.partyOrder.forEach((id, index) => {
      const base = this.data.partyById[id];
      const live = state.party.find((p) => p.id === id);
      if (!base || !live) return;
      const y = startY + index * rowGap;
      this.text(base.name.split(" ")[0], nameX, y + 15, "#fff4d2", 13);
      this.drawCombatResourceBar(barX, y, barW, hpH, live.hp / base.stats.hp, "#e74c5b", `HP ${live.hp}/${base.stats.hp}`, 12);
      this.drawCombatResourceBar(barX, y + hpH + 5, barW, mpH, live.mp / base.stats.mp, "#459bff", "", 9);
    });
  }

  combatStatusLayout() {
    return {
      panel: COMBAT_PANEL,
      menu: COMBAT_MENU,
      nameX: 444,
      barX: 538,
      barW: 334,
      hpH: 18,
      mpH: 5,
      startY: 474,
      rowGap: 38,
      rowCount: 4
    };
  }

  drawCombatResourceBar(x, y, w, h, value, color, label = "", labelSize = 12) {
    this.drawMeter(x, y, w, h, value, color);
    if (!label) return;
    const textW = this.textWidth(label, labelSize);
    this.text(label, Math.round(x + w / 2 - textW / 2), y + h - 4, "#fff8e6", labelSize);
  }

  drawCombatSummary(state) {
    const summary = state.combatSummary;
    const ctx = this.ctx;
    const backdrop = summary?.backdrop ?? this.data.maps[state.mapId]?.backdrop ?? "backdrop.dungeon";
    this.assets.draw(ctx, backdrop, 0, 0, VIEW_W, VIEW_H);
    ctx.fillStyle = "rgba(3, 7, 16, 0.72)";
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    if (!this.assets.draw(ctx, "ui.combat.summary_panel", 112, 72, 736, 500)) this.drawGlassPanel(112, 72, 736, 500, 24);
    this.drawMenuTitle("Combat Summary", 170, 156);
    this.text(`XP ${summary?.victory?.xp ?? 0}`, 182, 202, "#ffe9a9", 18);
    this.text(`Gold ${summary?.victory?.gold ?? 0}`, 302, 202, "#ffe9a9", 18);
    this.text("Defeated", 182, 250, "#fff4d2", 20);
    (summary?.defeated ?? []).slice(0, 5).forEach((enemy, index) => {
      const y = 286 + index * 34;
      this.text(enemy.name, 204, y, "#f8f1dc", 15);
      this.text(`${enemy.xp}xp  ${enemy.gold}g`, 560, y, "#9bd6ff", 14);
    });
    this.text("Loot", 182, 450, "#fff4d2", 20);
    if (summary?.remains?.length) {
      summary.remains.slice(0, 3).forEach((remains, index) => {
        this.text(`${remains.name}: harvestable remains`, 204, 484 + index * 26, "#dcecff", 14);
      });
    } else {
      this.text("No special remains recovered.", 204, 484, "#b8cee8", 14);
    }
    if (!this.assets.draw(ctx, "ui.combat.summary_button", 596, 514, 178, 40)) this.drawSelectionHighlight(596, 514, 178, 40, 0.86);
    this.text(summary?.remains?.length ? "Harvest loot" : "Continue", 626, 540, "#fff4d2", 15);
  }

  combatList(items, selected, x, y) {
    items.forEach((item, index) => {
      const rowY = y - 22 + index * 30;
      if (!this.assets.draw(this.ctx, "ui.combat.option", x - 20, rowY, 360, 32, { alpha: index === selected ? 1 : 0.42 })) {
        this.drawSelectionHighlight(x - 18, rowY, 360, 30, index === selected ? 1 : 0.22);
      }
      this.text(item, x + 2, y + index * 30, index === selected ? "#fff4d2" : "#dcecff", 16);
    });
  }

  list(items, selected, x, y) {
    items.forEach((item, index) => {
      const rowY = y - 24 + index * 44;
      this.drawSelectionHighlight(x - 18, rowY, 360, 34, index === selected ? 1 : 0.22);
      this.text(item, x + 2, y + index * 44, index === selected ? "#fff4d2" : "#dcecff", 17);
    });
  }

  assetSource(id, crop = null) {
    const asset = this.assets.manifest.images?.[id];
    if (asset) {
      const image = this.assets.images.get(id);
      if (!image) return null;
      return crop
        ? { image, x: crop.x, y: crop.y, w: crop.w, h: crop.h }
        : { image, x: 0, y: 0, w: image.width, h: image.height };
    }

    const region = this.assets.region(id);
    if (!region) return null;
    const image = this.assets.images.get(region.atlasId);
    if (!image) return null;
    return { image, x: region.x, y: region.y, w: region.w, h: region.h };
  }

  drawAssetCover(id, x, y, w, h, options = {}) {
    const source = this.assetSource(id, options.crop);
    if (!source) return false;
    const focusX = options.focusX ?? 0.5;
    const focusY = options.focusY ?? 0.5;
    const scale = Math.max(w / source.w, h / source.h);
    const sw = Math.min(source.w, w / scale);
    const sh = Math.min(source.h, h / scale);
    const sx = source.x + Math.max(0, Math.min(source.w - sw, (source.w - sw) * focusX));
    const sy = source.y + Math.max(0, Math.min(source.h - sh, (source.h - sh) * focusY));
    const smoothing = this.ctx.imageSmoothingEnabled;
    if (options.smooth !== undefined) this.ctx.imageSmoothingEnabled = options.smooth;
    this.ctx.drawImage(source.image, sx, sy, sw, sh, x, y, w, h);
    this.ctx.imageSmoothingEnabled = smoothing;
    return true;
  }

  roundRectPath(x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  drawToast(text) {
    const w = 720;
    const h = 176;
    const x = Math.round((VIEW_W - w) / 2);
    const y = 18;
    if (!this.assets.draw(this.ctx, "ui.notification.centered", x, y, w, h, { smooth: true })) {
      this.assets.draw(this.ctx, "ui.banner", x + 145, y + 48, 430, 68);
    }
    const lines = String(text ?? "").split("\n").flatMap((line) => this.wrapLines(line, 560, 14)).slice(0, 2);
    const startY = y + (lines.length > 1 ? 82 : 96);
    lines.forEach((line, index) => this.centerText(line, VIEW_W / 2, startY + index * 20, "#ffe9a9", lines.length > 1 ? 13 : 15));
  }

  drawTransition(transition) {
    if (transition.kind === "title-new-game" && transition.phase === "out") {
      this.drawNewGameDoorTransition(transition);
      return;
    }

    const ctx = this.ctx;
    const progress = Math.max(0, Math.min(1, transition.timer / transition.duration));
    const alpha = transition.phase === "in" ? 1 - progress : progress;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.restore();
  }

  drawNewGameDoorTransition(transition) {
    const ctx = this.ctx;
    const elapsed = Math.max(0, transition.timer);
    const closeEnd = NEW_GAME_DOOR_TIMING.close;
    const openEnd = closeEnd + NEW_GAME_DOOR_TIMING.open;
    if (elapsed < closeEnd) {
      this.drawCoverImage("menu.transition.doorClose", 1);
      return;
    }
    if (elapsed < openEnd) {
      this.drawCoverImage("menu.transition.doorFinal", 1);
      this.drawCoverImage("menu.transition.doorOpen", 1);
      return;
    }

    const finalProgress = Math.max(0, Math.min(1, (elapsed - openEnd) / NEW_GAME_DOOR_TIMING.final));
    const eased = finalProgress * finalProgress * (3 - 2 * finalProgress);
    this.drawCoverImage("menu.transition.doorFinal", 1 + eased * 0.44);
    this.drawCoverImage("menu.transition.doorOpen", 1 + eased * 1.65);
    ctx.save();
    ctx.globalAlpha = eased;
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.restore();
  }

  drawCoverImage(assetId, scaleMultiplier = 1) {
    const ctx = this.ctx;
    const image = this.assets.images.get(assetId);
    if (!image) return;
    const scale = Math.max(VIEW_W / image.width, VIEW_H / image.height) * scaleMultiplier;
    const drawW = image.width * scale;
    const drawH = image.height * scale;
    const x = (VIEW_W - drawW) * 0.5;
    const y = (VIEW_H - drawH) * 0.5;
    ctx.drawImage(image, x, y, drawW, drawH);
  }

  text(text, x, y, color = "#f8f1dc", size = 15) {
    const ctx = this.ctx;
    ctx.font = `${size}px monospace`;
    ctx.fillStyle = "#0b1020";
    ctx.fillText(text, x + 2, y + 2);
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
  }

  bookText(text, x, y, color = "#3d2a20", size = 15) {
    const ctx = this.ctx;
    ctx.font = `${size}px monospace`;
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
  }

  centerText(text, centerX, y, color = "#f8f1dc", size = 15) {
    this.text(text, Math.round(centerX - this.textWidth(text, size) / 2), y, color, size);
  }

  textWidth(text, size = 15) {
    this.ctx.font = `${size}px monospace`;
    return this.ctx.measureText(text).width;
  }

  wrapLines(text, maxWidth, size) {
    this.ctx.font = `${size}px monospace`;
    const lines = [];
    for (const paragraph of text.split("\n")) {
      const words = paragraph.split(" ");
      let line = "";
      for (const word of words) {
        const test = line ? `${line} ${word}` : word;
        if (this.ctx.measureText(test).width > maxWidth && line) {
          lines.push(line);
          line = word;
        } else line = test;
      }
      if (line) lines.push(line);
    }
    return lines;
  }

  wrap(text, x, y, maxWidth, color, size, maxLines = 4) {
    const words = text.split(" ");
    let line = "";
    let lines = 0;
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (this.ctx.measureText(test).width > maxWidth && line) {
        this.text(line, x, y + lines * (size + 6), color, size);
        line = word;
        lines++;
        if (lines >= maxLines) return;
      } else line = test;
    }
    if (line && lines < maxLines) this.text(line, x, y + lines * (size + 6), color, size);
  }
}
