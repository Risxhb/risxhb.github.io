export class Assets {
  constructor(manifest) {
    this.manifest = manifest;
    this.images = new Map();
  }

  async load() {
    const atlasEntries = Object.entries(this.manifest.atlases ?? {});
    const imageEntries = Object.entries(this.manifest.images ?? {});
    await Promise.all([
      ...atlasEntries.map(([id, atlas]) => new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => {
          this.images.set(id, image);
          resolve();
        };
        image.onerror = () => reject(new Error(`Failed to load atlas ${atlas.path}`));
        image.src = atlas.path;
      })),
      ...imageEntries.map(([id, asset]) => new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => {
          this.images.set(id, image);
          resolve();
        };
        image.onerror = () => reject(new Error(`Failed to load image ${asset.path}`));
        image.src = asset.path;
      }))
    ]);
  }

  region(id) {
    for (const [atlasId, atlas] of Object.entries(this.manifest.atlases)) {
      if (atlas.regions[id]) return { atlasId, ...atlas.regions[id] };
    }
    return null;
  }

  npcIdleAsset(npcId) {
    return this.manifest.npc_sprites?.[npcId]?.idle ?? null;
  }

  isAnimated(id) {
    return Boolean(this.manifest.images?.[id]?.animation);
  }

  animationFrame(id, now) {
    const animation = this.manifest.images?.[id]?.animation;
    if (!animation) return 0;
    const frames = Math.max(1, animation.frames ?? 1);
    const fps = Math.max(0, animation.fps ?? 1);
    return Math.floor((now / 1000) * fps) % frames;
  }

  draw(ctx, id, x, y, w, h, options = {}) {
    const asset = this.manifest.images?.[id];
    if (asset) {
      const image = this.images.get(id);
      if (!image) return false;
      const animation = asset.animation;
      const sourceW = animation?.frame_width ?? image.width;
      const sourceH = animation?.frame_height ?? image.height;
      const columns = Math.max(1, Math.floor(image.width / sourceW));
      const rows = Math.max(1, Math.floor(image.height / sourceH));
      const totalFrames = columns * rows;
      const frame = ((options.frame ?? 0) % totalFrames + totalFrames) % totalFrames;
      const sourceX = (frame % columns) * sourceW;
      const sourceY = Math.floor(frame / columns) * sourceH;
      ctx.save();
      ctx.imageSmoothingEnabled = Boolean(options.smooth ?? asset.rendering?.smooth);
      if (ctx.imageSmoothingEnabled) ctx.imageSmoothingQuality = asset.rendering?.quality ?? "high";
      if (Number.isFinite(options.alpha)) ctx.globalAlpha = options.alpha;
      if (options.flipX) {
        ctx.translate(x + w, y);
        ctx.scale(-1, 1);
        ctx.drawImage(image, sourceX, sourceY, sourceW, sourceH, 0, 0, w, h);
      } else {
        ctx.drawImage(image, sourceX, sourceY, sourceW, sourceH, x, y, w, h);
      }
      ctx.restore();
      return true;
    }
    const region = this.region(id);
    if (!region) return false;
    const image = this.images.get(region.atlasId);
    if (!image) return false;
    ctx.save();
    ctx.imageSmoothingEnabled = Boolean(options.smooth);
    if (ctx.imageSmoothingEnabled) ctx.imageSmoothingQuality = "high";
    if (Number.isFinite(options.alpha)) ctx.globalAlpha = options.alpha;
    if (options.flipX) {
      ctx.translate(x + w, y);
      ctx.scale(-1, 1);
      ctx.drawImage(image, region.x, region.y, region.w, region.h, 0, 0, w, h);
    } else {
      ctx.drawImage(image, region.x, region.y, region.w, region.h, x, y, w, h);
    }
    ctx.restore();
    return true;
  }
}
