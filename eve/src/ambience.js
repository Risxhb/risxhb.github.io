export const MAX_PARTICLES = 160;

export const AMBIENCE_PROFILES = {
  default: {
    id: "default",
    visual: {
      darkness: 0,
      playerLightRadius: 0,
      dustMotes: false,
      dungeonMist: false,
      torchFlicker: false,
      rainLeaks: false,
      sporeHaze: false,
      ashFall: false,
      rootGlow: 0
    },
    audio: {
      profile: "field",
      intensity: 0.25
    },
    gameplay: {
      lightRadiusMod: 0,
      aggroRadiusMod: 0,
      trapVisibilityMod: 0
    }
  },

  moonroot_entry_safe: {
    id: "moonroot_entry_safe",
    visual: {
      darkness: 0.18,
      playerLightRadius: 6,
      dustMotes: true,
      dungeonMist: false,
      torchFlicker: true,
      rainLeaks: false,
      sporeHaze: false,
      ashFall: false,
      rootGlow: 0.08
    },
    audio: {
      profile: "moonroot_entry_safe",
      intensity: 0.35
    },
    gameplay: {
      lightRadiusMod: 1,
      aggroRadiusMod: -1,
      trapVisibilityMod: 0
    }
  },

  moonroot_entry_contested: {
    id: "moonroot_entry_contested",
    visual: {
      darkness: 0.38,
      playerLightRadius: 5.5,
      dustMotes: true,
      dungeonMist: true,
      torchFlicker: true,
      rainLeaks: true,
      sporeHaze: false,
      ashFall: false,
      rootGlow: 0.14
    },
    audio: {
      profile: "moonroot_entry_contested",
      intensity: 0.5
    },
    gameplay: {
      lightRadiusMod: 0,
      aggroRadiusMod: 0,
      trapVisibilityMod: 0
    }
  },

  moonroot_entry_deep: {
    id: "moonroot_entry_deep",
    visual: {
      darkness: 0.5,
      playerLightRadius: 5,
      dustMotes: true,
      dungeonMist: true,
      torchFlicker: true,
      rainLeaks: true,
      sporeHaze: false,
      ashFall: false,
      rootGlow: 0.18
    },
    audio: {
      profile: "moonroot_entry_deep",
      intensity: 0.65
    },
    gameplay: {
      lightRadiusMod: 0,
      aggroRadiusMod: 1,
      trapVisibilityMod: 0
    }
  },

  moonroot_boss: {
    id: "moonroot_boss",
    visual: {
      darkness: 0.58,
      playerLightRadius: 4.75,
      dustMotes: true,
      dungeonMist: true,
      torchFlicker: true,
      rainLeaks: false,
      sporeHaze: false,
      ashFall: true,
      rootGlow: 0.28
    },
    audio: {
      profile: "moonroot_boss",
      intensity: 0.8
    },
    gameplay: {
      lightRadiusMod: -1,
      aggroRadiusMod: 2,
      trapVisibilityMod: 0
    }
  }
};

let lightMaskCanvas = null;

export function createAmbienceState() {
  return {
    profileId: "default",
    audioProfileId: null,
    time: 0,
    particles: [],
    lightningFlash: 0,
    lastMapId: null,
    lastDungeonFloor: null
  };
}

export function hydrateAmbienceState(snapshot) {
  return {
    ...createAmbienceState(),
    profileId: snapshot?.profileId || "default",
    audioProfileId: null,
    lastMapId: null,
    lastDungeonFloor: null
  };
}

export function serializeAmbienceState(ambience) {
  if (!ambience) return undefined;
  return {
    profileId: ambience.profileId || "default",
    audioProfileId: ambience.audioProfileId || null,
    time: 0,
    particles: [],
    lightningFlash: 0,
    lastMapId: ambience.lastMapId || null,
    lastDungeonFloor: ambience.lastDungeonFloor || null
  };
}

export function resolveAmbienceProfile(map, state) {
  if (map?.ambience?.id && AMBIENCE_PROFILES[map.ambience.id]) {
    return mergeAmbienceProfile(AMBIENCE_PROFILES[map.ambience.id], map.ambience);
  }
  const floor = map?.dungeonFloor ?? state?.dungeon?.currentFloor ?? state?.dungeon?.floor;
  if (floor) return getDungeonAmbienceProfile(floor);
  return AMBIENCE_PROFILES.default;
}

export function getDungeonAmbienceProfile(floor) {
  if (floor === 1) return AMBIENCE_PROFILES.moonroot_entry_safe;
  if (floor === 10) return AMBIENCE_PROFILES.moonroot_boss;
  if (floor >= 7) return AMBIENCE_PROFILES.moonroot_entry_deep;
  return AMBIENCE_PROFILES.moonroot_entry_contested;
}

export function resetAmbience(state) {
  if (!state.ambience) return;
  state.ambience.particles = [];
  state.ambience.time = 0;
  state.ambience.lightningFlash = 0;
}

export function updateAmbience(state, map, dt) {
  if (!state.ambience) state.ambience = createAmbienceState();
  const profile = resolveAmbienceProfile(map, state);
  const ambience = state.ambience;
  ambience.profileId = profile.id;
  ambience.time += dt;
  updateParticles(ambience, profile, dt);
}

export function drawAmbienceUnderlay(ctx, state, map) {
  const profile = resolveAmbienceProfile(map, state);
  const visual = profile.visual || {};
  if (visual.rootGlow > 0) drawRootGlow(ctx, visual.rootGlow);
}

export function drawAmbienceOverlay(ctx, state) {
  const ambience = state.ambience;
  if (!ambience?.particles?.length) return;

  ctx.save();
  for (const particle of ambience.particles) {
    const fade = Math.max(0, Math.min(1, particle.life / particle.maxLife));
    ctx.globalAlpha = particle.alpha * fade;

    if (particle.type === "dust") {
      ctx.fillStyle = "#d8c59a";
      ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
    } else if (particle.type === "mist") {
      ctx.fillStyle = "#d8e6ef";
      ctx.beginPath();
      ctx.ellipse(particle.x, particle.y, particle.size, particle.size * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (particle.type === "drip") {
      ctx.fillStyle = "#a9c9d8";
      ctx.fillRect(particle.x, particle.y, 1, particle.size);
    } else if (particle.type === "spore") {
      ctx.fillStyle = "#c7d89a";
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    } else if (particle.type === "ash") {
      ctx.fillStyle = "#b8b0a3";
      ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
    }
  }
  ctx.restore();
}

export function drawLightMask(ctx, state, map, camera) {
  const profile = resolveAmbienceProfile(map, state);
  const visual = profile.visual || {};
  const darkness = Math.max(0, Math.min(0.85, visual.darkness || 0));
  if (darkness <= 0) return;

  const { width, height } = logicalCanvasSize(ctx);
  const mask = getLightMaskCanvas(width, height);
  const maskCtx = mask.getContext("2d");
  maskCtx.clearRect(0, 0, mask.width, mask.height);
  maskCtx.globalCompositeOperation = "source-over";
  maskCtx.fillStyle = `rgba(3, 5, 10, ${darkness})`;
  maskCtx.fillRect(0, 0, mask.width, mask.height);
  maskCtx.globalCompositeOperation = "destination-out";

  const playerRadius = (visual.playerLightRadius || 0) + (profile.gameplay?.lightRadiusMod || 0);
  if (playerRadius > 0 && state.player) {
    drawTileLight(maskCtx, state.player.x, state.player.y, playerRadius, 0.95, camera, map);
  }

  const emitters = collectLightEmitters(state, map, visual);
  for (const emitter of emitters) {
    drawTileLight(maskCtx, emitter.x, emitter.y, emitter.radius, emitter.intensity, camera, map);
  }

  maskCtx.globalCompositeOperation = "source-over";
  ctx.save();
  ctx.drawImage(mask, 0, 0, width, height);
  drawColoredLightGlow(ctx, emitters, camera, map);
  ctx.restore();
}

export function collectLightEmitters(state, map, visual = {}) {
  const emitters = [];
  const add = (item) => {
    if (!item?.light || !Number.isFinite(item.x) || !Number.isFinite(item.y)) return;
    if (!isLightDrawableVisible(item, state, map)) return;
    const flicker = item.light.flicker && visual.torchFlicker
      ? getFlicker(state.ambience?.time || 0, item.x, item.y)
      : 1;
    const effectFade = Number.isFinite(item.elapsed) && Number.isFinite(item.duration)
      ? Math.max(0.25, 1 - item.elapsed / Math.max(0.01, item.duration))
      : 1;
    emitters.push({
      x: item.x,
      y: item.y,
      radius: item.light.radius * flicker,
      intensity: (item.light.intensity ?? 0.75) * effectFade,
      color: item.light.color ?? "#ffffff"
    });
  };

  for (const prop of map.props || []) add(prop);
  for (const overlay of map.overlays || []) add(overlay);
  for (const layer of Object.values(map.dungeonLayers ?? {})) {
    if (!Array.isArray(layer)) continue;
    for (const item of layer) add(item);
  }
  for (const effect of state.worldEffects ?? []) add(effect);
  return emitters;
}

function mergeAmbienceProfile(base, override = {}) {
  return {
    ...base,
    ...override,
    visual: { ...base.visual, ...(override.visual || {}) },
    audio: { ...base.audio, ...(override.audio || {}) },
    gameplay: { ...base.gameplay, ...(override.gameplay || {}) }
  };
}

function updateParticles(ambience, profile, dt) {
  const visual = profile.visual || {};
  if (visual.dustMotes) spawnParticleBurst(ambience, "dust", 1);
  if (visual.dungeonMist) spawnParticleBurst(ambience, "mist", 1);
  if (visual.rainLeaks) spawnParticleBurst(ambience, "drip", 2);
  if (visual.sporeHaze) spawnParticleBurst(ambience, "spore", 1);
  if (visual.ashFall) spawnParticleBurst(ambience, "ash", 1);

  for (const particle of ambience.particles) {
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.life -= dt;
  }
  ambience.particles = ambience.particles.filter((particle) => particle.life > 0);
  if (ambience.particles.length > MAX_PARTICLES) {
    ambience.particles.splice(0, ambience.particles.length - MAX_PARTICLES);
  }
}

function spawnParticleBurst(ambience, type, count) {
  for (let i = 0; i < count; i++) {
    if (ambience.particles.length >= MAX_PARTICLES) return;
    ambience.particles.push(createParticle(type));
  }
}

function createParticle(type) {
  const x = Math.random() * 960;
  const y = Math.random() * 640;
  if (type === "dust") {
    return {
      type,
      x,
      y,
      vx: -2 + Math.random() * 4,
      vy: -4 - Math.random() * 8,
      size: 1 + Math.random() * 1.5,
      alpha: 0.08 + Math.random() * 0.08,
      life: 2 + Math.random() * 3,
      maxLife: 5
    };
  }
  if (type === "mist") {
    return {
      type,
      x,
      y: 430 + Math.random() * 220,
      vx: -8 + Math.random() * 16,
      vy: -1 + Math.random() * 2,
      size: 18 + Math.random() * 36,
      alpha: 0.035 + Math.random() * 0.045,
      life: 4 + Math.random() * 5,
      maxLife: 9
    };
  }
  if (type === "drip") {
    return {
      type,
      x,
      y: -20,
      vx: 0,
      vy: 90 + Math.random() * 120,
      size: 6 + Math.random() * 12,
      alpha: 0.12,
      life: 2,
      maxLife: 2
    };
  }
  if (type === "spore") {
    return {
      type,
      x,
      y,
      vx: -3 + Math.random() * 6,
      vy: -6 + Math.random() * 3,
      size: 2 + Math.random() * 3,
      alpha: 0.06,
      life: 3,
      maxLife: 3
    };
  }
  return {
    type: "ash",
    x,
    y: -20,
    vx: -8 + Math.random() * 16,
    vy: 18 + Math.random() * 32,
    size: 1 + Math.random() * 2,
    alpha: 0.08,
    life: 8,
    maxLife: 8
  };
}

function drawRootGlow(ctx, intensity) {
  const { width, height } = logicalCanvasSize(ctx);
  ctx.save();
  ctx.globalAlpha = intensity;
  const gradient = ctx.createRadialGradient(width * 0.5, height * 0.5, 20, width * 0.5, height * 0.5, Math.max(width, height) * 0.55);
  gradient.addColorStop(0, "rgba(120, 180, 210, 0.22)");
  gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

function getFlicker(time, x, y) {
  return 0.93 + Math.sin(time * 8 + x * 0.37 + y * 0.19) * 0.045;
}

function drawTileLight(ctx, tileX, tileY, radiusTiles, intensity, camera, map) {
  const tileSize = map.tileSize || 80;
  const screenX = Math.round(tileX * tileSize - camera.x + tileSize / 2);
  const screenY = Math.round(tileY * tileSize - camera.y + tileSize / 2);
  const radiusPx = radiusTiles * tileSize;
  const gradient = ctx.createRadialGradient(screenX, screenY, radiusPx * 0.15, screenX, screenY, radiusPx);
  gradient.addColorStop(0, `rgba(255,255,255,${intensity})`);
  gradient.addColorStop(0.55, `rgba(255,255,255,${intensity * 0.55})`);
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(screenX, screenY, radiusPx, 0, Math.PI * 2);
  ctx.fill();
}

function drawColoredLightGlow(ctx, emitters, camera, map) {
  if (!emitters.length) return;
  const tileSize = map.tileSize || 80;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const emitter of emitters) {
    if (!emitter.color || emitter.color === "#ffffff") continue;
    const [r, g, b] = colorToRgb(emitter.color);
    const screenX = Math.round(emitter.x * tileSize - camera.x + tileSize / 2);
    const screenY = Math.round(emitter.y * tileSize - camera.y + tileSize / 2);
    const radiusPx = emitter.radius * tileSize;
    const gradient = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, radiusPx);
    gradient.addColorStop(0, `rgba(${r},${g},${b},${Math.min(0.22, emitter.intensity * 0.24)})`);
    gradient.addColorStop(0.55, `rgba(${r},${g},${b},${Math.min(0.1, emitter.intensity * 0.1)})`);
    gradient.addColorStop(1, `rgba(${r},${g},${b},0)`);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(screenX, screenY, radiusPx, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function colorToRgb(color) {
  const match = /^#?([0-9a-f]{6})$/i.exec(color);
  if (!match) return [255, 255, 255];
  const value = match[1];
  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16)
  ];
}

function isLightDrawableVisible(item, state, map) {
  if (item.requires && !state.flags?.[item.requires]) return false;
  const pickupKey = item.id ? `pickup_${map.id}_${item.id}` : null;
  if (item.pickup && pickupKey && state.flags?.[pickupKey]) return false;
  if (item.hideWhenInsideTent && state.insideTent) return false;
  if (item.showWhenInsideTent && !state.insideTent) return false;
  return true;
}

function logicalCanvasSize(ctx) {
  const scale = Math.abs(ctx.getTransform?.().a || 1) || 1;
  return {
    width: Math.ceil(ctx.canvas.width / scale),
    height: Math.ceil(ctx.canvas.height / scale)
  };
}

function getLightMaskCanvas(width, height) {
  if (!lightMaskCanvas) lightMaskCanvas = document.createElement("canvas");
  if (lightMaskCanvas.width !== width || lightMaskCanvas.height !== height) {
    lightMaskCanvas.width = width;
    lightMaskCanvas.height = height;
  }
  return lightMaskCanvas;
}
