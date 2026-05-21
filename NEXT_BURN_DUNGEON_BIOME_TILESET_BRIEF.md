# Next Burn Brief: Dungeon Biomes, Tilesets, Sprites, And Survival Systems

Last updated: 2026-05-11

## Purpose

This document is the planning brief for the next major Eve: Moonroot Hollow work session. The goal is to make dungeon creation scalable: generate a biome tileset, add it to the manifest, wire it into a dungeon theme, and use that theme to build visually distinct floor ranges.

This should be written and used as a design handoff for GPT/image generation. It needs to be strict enough that generated assets can drop into the current canvas game without constant correction.

## North Star

The dungeon should become a system that can produce the remaining Moonroot Hollow floors while still feeling authored.

The player should feel:

- Each floor range has a real biome identity.
- The dungeon is readable while moving: walls, floors, doors, traps, props, pickups, NPCs, and exits are visually distinct.
- New sprites fit the current visual language, especially the taller Nia / Elara style for characters and humanoids.
- Survival inside the dungeon becomes part of the fantasy, not only combat and town resupply.

## Immediate Priority

For the next burn, prioritize dungeon infrastructure and visuals before the combat rewrite.

Suggested order:

1. Define a dungeon theme contract.
2. Choose one floor range to turn into a real biome slice.
3. Generate or design a complete biome tileset for that range.
4. Add the assets to `game/data/asset_manifest.json`.
5. Wire the biome into dungeon generation.
6. Screenshot-test floor readability, doors, wall stacks, traps, fog, and movement space.
7. Only after that, connect biome resources, monster loot, and survival/cooking hooks.

## Floors 1-10 Design Pass: Guild Forward Base

Before expanding too far into new biomes, floors 1-10 should be made into a strong first dungeon arc. The key idea is that the Adventurer's Guild has pushed into Moonroot Hollow and turned the first floor into an outpost / forward base.

This should make the dungeon feel less like an empty test map and more like a place people are actively trying to explore, exploit, survive, and understand.

### Adventurer's Guild Outpost

Floor 1 should function as the guild's forward base inside the dungeon.

Possible floor 1 features:

- Guild checkpoint desk or expedition counter.
- Supply crates, ration stacks, rope, lantern oil, chalk marks, bedrolls, spare shields, repair tools, and map boards.
- Wounded adventurer cot / healer corner.
- Cookpot or field kitchen that foreshadows the dungeon-survival food loop.
- Notice board with warnings about traps, floor 10 boss gate, and deeper-floor checkpoint rumors.
- Torchlit training room for movement, door, trap, and aggro tutorials.
- NPCs that make the outpost feel alive: guild quartermaster, scout, wounded delver, cook, mapper, guard, nervous rookie.
- Locked or guarded descent line that visually signals the dungeon gets more dangerous after the safe base.

This area can also teach systems:

- Aggro radius: enemies notice the party inside a visible radius.
- Light radius: the party and torches reveal nearby space.
- Door behavior: north/south and east/west doors should be obvious and consistent.
- Traps: visible practice examples before hidden or semi-hidden live traps.
- Cooking/resting: safe rooms create temporary buffs instead of introducing hunger penalties right away.

### Floors 2-9

Floors 2-9 should gradually move away from guild control.

Design direction:

- Floor 2: recently scouted halls with guild chalk marks and early monster pressure.
- Floors 3-4: old root stone, broken camps, more traps, first signs that the dungeon changes paths.
- Floors 5-6: stronger enemy patrols, more room identity, more resource nodes.
- Floors 7-8: hazardous routes, more darkness, more loot/survival choices.
- Floor 9: pre-boss pressure floor with fewer safe signs and stronger visual lead-in.

Each floor should have at least one memorable room type, not just rectangular rooms and corridors.

Room type examples:

- Guild storage annex.
- Collapsed sleeping camp.
- Root-cracked shrine.
- Flooded side chamber.
- Torch hall.
- Training barricade.
- Broken bridge / crumble room.
- Loot cache.
- Ambush room.
- Safe room.
- Cartography room.
- Lantern puzzle room.
- Monster den.

### Floor 10

Floor 10 should be the first boss gate and should feel intentionally different.

Requirements:

- Strong visual lead-up from floor 9.
- Boss antechamber.
- Clear locked descent or gate state before the boss is defeated.
- Boss room with unique floor treatment and more dramatic lighting.
- Post-boss path to floor 11 / next biome.
- Loot, story beat, or guild response that marks the party as having crossed the first threshold.

## Floors 1-10 Room Catalog

Use these room types as the first authoring vocabulary for floors 1-10. The generator should eventually choose room dressing, doodads, enemy sets, lighting, resources, and traps based on room type.

### Guild-Controlled Rooms

These rooms should appear mostly on floor 1, then become rarer or damaged on floors 2-4.

| Room Type | Description | Useful Doodads | Gameplay Use |
| --- | --- | --- | --- |
| Forward Base Hall | Main guild outpost room inside the dungeon, warm torchlight against old Moonroot stone. | Expedition desk, guild banner, bedrolls, crates, lantern rack, map board, wounded cot. | Safe hub, NPCs, first dungeon identity. |
| Quartermaster Nook | Small supply station where gear, potions, rope, and rations are counted. | Shelves, ration boxes, rope coils, tool chest, potion crate, ledger. | Shop/resupply, item tutorial, economy hook. |
| Mapper's Table | Cartography corner tracking discovered rooms, traps, and missing delvers. | Table map, pins, chalk marks, compass, scroll tubes, wall notes. | Dungeon map hints, region reveal tutorial. |
| Field Kitchen | Improvised cook station that foreshadows dungeon cooking. | Cookpot, cutting board, hanging herbs, drying rack, water barrel, ingredient sacks. | Positive survival loop tutorial. |
| Infirmary Corner | Triage area for wounded adventurers returning from deeper floors. | Cots, bandages, healer bag, bloodied shield, stool, privacy cloth. | Rest/healing NPC, rumors, danger foreshadowing. |
| Training Barricade Room | Controlled training space built from crates and broken dungeon debris. | Barricades, target dummy, practice trap plates, painted danger marks. | Movement, aggro, trap, and door tutorials. |
| Torch Depot | Storage and maintenance room for dungeon lighting. | Lantern oil, spare torches, wall brackets, brazier, soot marks. | Light radius tutorial, torch-emission QA. |

### Contested Rooms

These rooms should dominate floors 2-7. They show the line between guild control and dungeon control.

| Room Type | Description | Useful Doodads | Gameplay Use |
| --- | --- | --- | --- |
| Broken Camp | A failed expedition camp partly scavenged by monsters. | Torn bedrolls, cold cookpot, spilled pack, snapped spear, blood trail. | Loot scraps, monster clues, early survival resources. |
| Chalk-Marked Fork | Guild signs indicate safe and unsafe routes, but some marks are scratched out. | Chalk arrows, warning signs, scratched stone, route ribbons. | Route choice, fog/map teaching, false confidence. |
| Barricaded Corridor | A defensive line that has been broken through or partially repaired. | Planks, shields, crates, rope ties, claw marks, collapsed props. | Aggro radius tutorial, chokepoint fights. |
| Lost Supply Cache | Hidden or overrun stash of supplies. | Locked chest, ration box, oil flask, broken cart, torn inventory note. | Reward room, cooking/consumable supplies. |
| Ambush Storage Room | A tempting supply room that enemies now use as cover. | Crates, sacks, hanging cloth, dark corners, scattered coins. | Enemy ambush, aggro tests, loot after fight. |
| Collapsed Bridge Room | Floor collapse or broken crossing over a pit/channel. | Rope line, cracked planks, rubble, warning flag, exposed roots. | Crumble trap, alternate path, pitfall teaching. |
| Flooded Side Chamber | Early water intrusion before the cistern biome. | Shallow puddles, slime trails, water barrel, cracked drain. | Clean/dirty water intro, ooze/slime enemies. |
| Old Guard Post | Ancient dungeon checkpoint reused by the guild and later contested. | Stone bench, rusted weapon rack, guild lantern, broken gate. | Lore, door testing, small patrol fight. |

### Hollow-Controlled Rooms

These rooms become more common on floors 5-10. They should feel like the dungeon is alive and pushing back.

| Room Type | Description | Useful Doodads | Gameplay Use |
| --- | --- | --- | --- |
| Root-Cracked Shrine | Old shrine split by Moonroot growth. | Root altar, cracked statue, moon sigil, candle remains, root crystals. | Lore, rare material, curse/light hook. |
| Monster Den | Creature nesting area built from stolen supplies and bones. | Nests, bones, eggs, gnawed gear, hides, scraps, slime/fur. | Anatomy loot, cooking ingredients, enemy cluster. |
| Spore Pocket | Damp fungal chamber with edible and unsafe growths. | Mushrooms, spore sacs, fungus mats, rotted pack, water drops. | Poison/spore hazards, gatherable food. |
| Moonroot Vein Chamber | Glowing roots and mineral veins breaking through stone. | Root crystals, mineral seams, glowing cracks, broken pick. | Rare material, stronger encounter, visual set piece. |
| Pitfall Gallery | Floor section designed to teach suspicion and movement caution. | Cracked tiles, rope marker, old bones below, warning scratches. | Pitfall trap, safe path reading. |
| Dart Wall Hall | Narrow hall with old trap machinery in the walls. | Dart holes, pressure seams, broken darts, skeleton, wall scars. | Darts trap, wall readability. |
| Alarm Rune Room | Rune chamber where careless movement wakes nearby monsters. | Rune circle, skull markers, sleeping monsters, echoing wall glyphs. | Alarm trap, aggro radius, encounter escalation. |
| Echo Room | Strange acoustic room where sound carries too far. | Hollow columns, hanging roots, bell fragments, water drips. | Larger aggro radius, stealth/food buff hook. |
| Sealed Door Antechamber | Pre-gate room that tests door visuals and requirements. | East/west doors, lantern sockets, key grooves, wall trim, sigils. | Door bug QA, gated progress, light puzzle. |
| Boss Antechamber | Quiet warning room before floor 10 boss. | Wrecked guild banner, abandoned packs, extinguished torches, warning wall. | Save/rest cue, boss foreshadowing. |

### Suggested First-Floor Flow

Floor 1 can be built as:

```text
Forward Base Hall -> Training Barricade Room -> Torch Depot -> Chalk-Marked Fork -> Broken Camp -> Root-Cracked Shrine -> Floor 2 Descent
```

This gives the player safety, teaching, mood shift, first danger, and then the feeling that the dungeon is becoming real.

## Floors 1-10 Enemy Families And Boss Direction

Enemies in floors 1-10 should support the guild-forward-base fantasy. The first floors are not only random monsters; they are the first ecosystem pushing against the guild outpost.

### Enemy Families

| Enemy | Role | Floors | Description | Loot / Survival Hooks |
| --- | --- | --- | --- | --- |
| Moonroot Bat | Fast scout creature | 1-10 | Small bat warped by rootlight, common in dark halls and echo rooms. | Wings, fangs, small bones, bitter meat, sonar gland. |
| Bramble Rat | Quick scavenger | 1-8 | Dungeon rat nesting in ruined packs and food stores. | Meat, hide, teeth, tail, stolen crumbs, dirty trinkets. |
| Crystal Ooze | Slow magical hazard | 2-10 | Slime that absorbs moon minerals and old potion residue. | Slime gel, crystal grit, acid sac, clean/tainted core. |
| Road Wisp / Hollow Wisp | Magical nuisance | 2-10 | Floating light that lures delvers into traps. | Wisp mote, glow dust, unstable essence. |
| Goblin Scout | Patrol and aggro tutorial | 2-10 | Small intelligent enemy testing guild defenses. | Ears, dagger, tattered cloth, pouch, meat, stolen supplies. |
| Goblin Grunt | Basic humanoid fighter | 3-10 | Armed goblin used in patrols and barricade fights. | Ears, worn armor, club/spear, cracked shield, meat. |
| Goblin Trapper | Trap-room specialist | 4-10 | Carries darts, wire, cheap bombs, and bait. | Trap kit, wire, darts, ears, tool pouch, tainted meat. |
| Rootbound Guard | Heavy floor guardian | 6-10 | Former delver or creature armored in roots and stone. | Root plates, broken gear, hardened vine, cursed bone. |
| Spore Crawler | Fungal ambusher | 5-10 | Low creature that spreads spores near damp rooms. | Edible cap if clean, spore sac, crawler meat, chitin. |
| Hollow Mimic Cache | Loot-room surprise | 7-10 | Chest-like scavenger or parasite hiding in supply rooms. | Adhesive tongue, shell plates, swallowed loot, mimic meat. |

### Damage-To-Loot Examples

These examples should influence combat skill tags later.

| Damage Type | Loot Effect Examples |
| --- | --- |
| Fire | Burns ears, chars meat, ruins cloth, sterilizes slime, hardens some shells. |
| Slash | Can sever ears/tails cleanly, damages hide and cloth, opens meat cuts. |
| Pierce | Preserves hides but punctures organs, sacs, waterskins, and cores. |
| Blunt | Breaks bones, dents gear, bruises meat, preserves hide and ears. |
| Ice / Water | Preserves meat, waterlogs gear, makes brittle crystals, slows oozes. |
| Poison / Curse | Contaminates meat and organs, may preserve trophies, creates risky ingredients. |
| Holy / Light | Purifies cursed materials, may destroy wisp motes or spore sacs. |

### Boss Options For Floor 10

Pick one boss direction for the first major dungeon arc. The boss should reflect the enemy ecology of floors 1-10 and explain why the guild cannot simply secure the descent.

#### Option A: Grask Vear-Eater, Goblin Siege-Cook

Best fit if the first arc leans into goblins, supply raids, cooking, and survival.

Description:

Grask is a goblin boss who learned that the guild's forward base is only as strong as its food, oil, rope, and morale. He raids supply caches, traps kitchens, steals ears as trophies, and cooks whatever the dungeon gives him. His room is a ruined guild storehouse turned goblin camp.

Combat identity:

- Summons goblin scouts or trappers.
- Uses stolen bombs, oil flasks, and cooking fire.
- Can spoil or burn resources if not defeated cleanly.
- Good first boss for introducing loot condition and dungeon food themes.

Loot hooks:

- Boss ear trophy.
- Charred recipe scrap.
- Stolen guild seal.
- Heavy cleaver.
- Goblin spice pouch.
- Meat with condition based on finishing damage.

#### Option B: Rootbound Quartermaster

Best fit if the first arc leans into fallen guild tragedy.

Description:

A missing guild quartermaster has been overtaken by Moonroot growth and still tries to "organize" supplies, bodies, and monsters into perfect rows. His boss room is an outpost storeroom grown over with roots.

Combat identity:

- Uses root shields, thrown supply crates, and command pulses.
- Calls rootbound guards or bramble rats.
- Stronger defensive boss with story weight.

Loot hooks:

- Rootbound ledger.
- Guild keyring.
- Hardened root plate.
- Repairable gear.
- Moonroot-tainted meat is not edible but useful for crafting.

#### Option C: The Lantern-Eater

Best fit if the first arc leans into darkness, torches, and light radius.

Description:

A bat/wisp hybrid or dungeon predator that nests in torch depots and consumes flame, glow fungus, and wisp motes. The guild cannot hold floor 1 because the deeper halls keep going dark.

Combat identity:

- Dims torches or reduces light radius during battle.
- Summons bats/wisps.
- Weak to light, resistant in darkness.

Loot hooks:

- Light-eater gland.
- Wing membrane.
- Wisp-fed heart.
- Soot-black bones.
- Ingredient for a meal or oil that boosts light radius.

### Recommended Floor 10 Boss

Use **Grask Vear-Eater, Goblin Siege-Cook** first.

Why:

- He connects naturally to goblins, traps, stolen supplies, cooking, and dungeon survival.
- He creates a strong reason for the guild outpost to be under pressure.
- His loot can demonstrate condition-based anatomical/material drops.
- His boss room can reuse and corrupt guild doodads, making the first ten floors feel coherent.

## First Asset Generation List For Floors 1-10

Generate these before expanding into floors 11-20. This list focuses on assets that unlock better dungeon readability and room identity.

### Priority 1: Structural Fix Assets

Generate these first because they affect every floor and biome.

| Asset | Count | Format | Description | Generation Notes |
| --- | ---: | --- | --- | --- |
| Dungeon void/background | 2-3 | 64x64 opaque tile | Dark stone/root backing to replace pure black emptiness. | Must read as non-walkable. Low contrast. No path-like shapes. |
| Wall top variants | 3 | 64x64 opaque/transparent as current code expects | Old Moonroot stone tops with roots/cracks. | Same perspective and footprint as current wall top. |
| Wall face variants | 3 | 64x64 transparent standalone | Vertical wall face with correct overlap and no black edge gaps. | Clear vertical plane. Avoid floor-like texture. |
| Wall side left/right variants | 2 each | 64x64 transparent standalone | Side walls for east/west edges. | Must pair cleanly with wall tops and corners. |
| Wall corner caps | 1-2 each orientation | 64x64 transparent standalone | Outer TL/TR/BL/BR and inner left/right corners. | Must overlap without seams at 80px runtime scale. |
| East/west door set | 1 closed + 1 open each side | 64x64 transparent/opaque as needed | Side-facing doors for corridors and room entries. | Highest QA priority. Must not look like north/south doors. |
| North/south door refresh | 2 closed + 2 open | 64x64 | Clear door state variants. | Must match collision and fog reveal. |

### Priority 2: Guild Outpost Doodads

Generate these to make floor 1 feel alive.

| Asset | Format | Description | Generation Notes |
| --- | --- | --- | --- |
| Expedition desk | Transparent standalone, 64-128px footprint | Desk with ledger, small map, lantern, guild stamp. | Should sit against wall or room center. |
| Map board | Transparent standalone | Floor sketches, pinned notes, warning marks. | Readable silhouette, not text-dependent. |
| Supply crate stack | Transparent standalone | Crates, sacks, rope, potion box. | Useful in many rooms; make 2 variants. |
| Bedroll cluster | Transparent standalone | Rolled and unrolled sleeping gear. | Low enough not to hide actors. |
| Wounded cot | Transparent standalone | Simple cot with bandages and blanket. | For infirmary corner. |
| Cookpot / field kitchen | Transparent standalone | Pot, tripod, cutting board, herbs, water bucket. | Foreshadows cooking system. |
| Lantern rack | Transparent standalone | Spare lanterns/torches/oil. | Should visually connect to light system. |
| Guild banner | Transparent standalone | Fabric marker for guild-controlled rooms. | Needs damaged variant for deeper floors. |
| Training dummy | Transparent standalone | Straw/wood dummy with slash marks. | Tutorial room. |
| Barricade pieces | Transparent standalone | Planks, shields, crates, rope bindings. | 2-3 variants for chokepoints. |

### Priority 3: Room-Specific Dungeon Doodads

Generate these to create room identity beyond the guild base.

| Asset | Format | Description | Generation Notes |
| --- | --- | --- | --- |
| Chalk arrows / warning marks | Transparent decal or 64x64 tile detail | White/yellow chalk marks on stone. | Must not look like loot. |
| Broken camp pack | Transparent standalone | Torn backpack, spilled supplies, broken cup. | Can imply previous delvers. |
| Monster nest | Transparent standalone | Bones, scraps, bedding, eggs. | Supports anatomy/cooking loop. |
| Root-cracked altar | Transparent standalone, 128px possible | Small shrine split by roots. | Lore room focal object. |
| Spore cluster | Transparent standalone or animated tile | Fungal growth with readable cap/sacs. | Include edible and unsafe variants later. |
| Moonroot crystal vein | Transparent standalone/tile detail | Blue-white root crystal in wall/floor. | Rare material node. |
| Dart-hole wall detail | Transparent wall overlay | Small wall holes and scratches. | Supports dart trap readability. |
| Pitfall crack detail | 64x64 tile detail | Suspicious cracked floor. | Must be readable but not too noisy. |
| Alarm rune | 64x64 tile | Rune circle or carved warning glyph. | Existing asset can be refreshed if needed. |

### Priority 4: Enemy And Boss Sprites

Generate after the room/structural pass, but before hooking loot.

| Asset | Format | Description | Generation Notes |
| --- | --- | --- | --- |
| Goblin Scout movement sheet | 576x512, 96x128 frames | Small quick goblin with ears, dagger, pouch. | Nia/Elara-style proportions adapted to goblin. 4 directions, 6 frames. |
| Goblin Grunt movement sheet | 576x512, 96x128 frames | Stockier goblin with club/spear and worn armor. | Must show ears and gear clearly for loot. |
| Goblin Trapper movement sheet | 576x512, 96x128 frames | Goblin with dart case, wire, small bombs. | Useful for trap rooms. |
| Grask boss combat art | Standalone 256-512px | Goblin siege-cook boss with cleaver, stolen gear, cooking fire motif. | Bigger than normal goblin. Must show boss personality. |
| Grask field marker | Standalone or movement sheet | Boss room sprite/marker. | Can be idle stance if not animated yet. |
| Spore Crawler | Standalone or sheet | Low fungal creature with edible/risky anatomy. | Good survival loot test. |
| Lantern-Eater concept | Standalone | Optional alternate boss/miniboss bat-wisp creature. | Useful if light system becomes central. |

### Priority 5: Resource And Cooking Assets

Generate these to start the positive survival loop.

| Asset | Format | Description | Generation Notes |
| --- | --- | --- | --- |
| Clean water source | Transparent/tile | Small spring, barrel, or drip basin. | Must read as safe/useful. |
| Dirty water source | Transparent/tile | Murky puddle, cracked basin, slime water. | Must visually differ from clean water. |
| Edible fungus node | Transparent/tile | Warm cap cluster or shelf fungus. | Appealing but still dungeon-like. |
| Unsafe fungus node | Transparent/tile | Spore sacs or sickly caps. | Distinct from edible version. |
| Root vegetable / edible root | Transparent/tile | Pale root bulbs coming through stone. | Gatherable food. |
| Mineral salvage node | Transparent/tile | Ore/crystal scraps in wall/floor. | Crafting/sale resource. |
| Campfire / safe-room fire | Transparent standalone/animated optional | Small controlled cooking fire. | Safe-room marker, not a hazard tile. |
| Meal bowl icons | Icon set | Broth, roasted meat, fungus stew, tonic. | For inventory/cooking UI later. |

### Generation Quality Rules For First Assets

- Generate assets in small batches by category, not one giant mixed sheet.
- Keep every asset named according to the manifest ID it will eventually use.
- Produce contact sheets for review before integration.
- For structural tiles, test them in repeated 5x5 and corridor layouts before accepting.
- For doors, test closed/open states against wall sides and fog.
- For doodads, test actor overlap and sorting.
- For monster sprites, review every row as animation frames before building final sheets.
- For resources, make gatherable assets more readable than decoration but less loud than exits or enemies.

## Dungeon Visual And Technical Fix List

These fixes are high priority because they affect every future biome.

### Doors

Current door behavior and construction need a focused pass.

Goals:

- Fix the current bug in how dungeon doors are being built.
- Make east/west doors render correctly and read as side doors.
- Ensure open and closed states use the correct art for orientation.
- Ensure door collision matches door visuals.
- Ensure door reveal/fog interactions do not show legacy or incorrect wall pieces.
- Prevent wall caps or wall faces from incorrectly overlapping doors.
- Add QA screenshots for closed, open, hidden, revealed, north/south, east/west, and side-facing doors.

### Walls And Overlap

Wall texture composition needs to be stable before new biome art is added.

Goals:

- Fix wall texture overlap so wall tops, faces, sides, corners, and caps stack correctly.
- Ensure walls draw in the right order against actors, props, doors, and fog.
- Make outer corners, inner corners, side edges, and wall faces visually consistent.
- Prevent black gaps between wall layers.
- Add more wall variants so long corridors do not repeat the same tile too obviously.
- Validate walls at 0.75x, 1x, and 2x zoom.

### Dungeon Void / Background

The black emptiness around walls should be replaced or softened.

Goals:

- Add a background near dungeon walls instead of pure black void.
- Use dark stone, cavern depth, root shadow, rubble, or low-detail parallax-like backing.
- Keep the background clearly non-walkable.
- Avoid making background detail look like paths, doors, or loot.
- Let biome themes define their own void/background treatment.

### Doodads And Room Life

Dungeon rooms need more life through doodads and room-specific dressing.

Doodad categories:

- Guild supplies: crates, ropes, sacks, tools, bedrolls, cookpots, lantern oil.
- Dungeon architecture: columns, cracked statues, broken arches, grates, drainage channels.
- Exploration marks: chalk arrows, warning signs, rope lines, flags, spent torches.
- Ecology: roots, fungus, bones, nests, slime trails, spores, insects, mineral clusters.
- Loot context: broken packs, weapon scraps, smashed chests, empty potion bottles.
- Hazard context: scorch marks, claw marks, dart holes, old bloodstains, cracked floors.

Room dressing should depend on room type. A safe room, monster den, flooded chamber, guild annex, shrine, and ambush hall should not use the same prop mix.

### Floor, Wall, And Room Variations

The dungeon needs more visual variation without losing readability.

Add:

- More floor variants per biome.
- More wall top variants.
- More wall face variants.
- More side wall variants.
- Corner variations.
- Biome-specific prop clusters.
- Room-specific detail layers.
- Weighted variant tables so details appear intentionally rather than randomly everywhere.

Rules:

- Floor variation must stay flatter than interactables.
- Wall variation must not break collision readability.
- Resource doodads need stronger silhouettes than pure decoration.
- Trap tiles must stay distinct from floor detail.

## Dungeon Awareness And Light Systems

These systems should be planned early because they affect dungeon layout, enemy behavior, rendering, and asset design.

### Aggro Radius

Enemies should eventually have an aggro radius instead of only triggering when stepped on.

Design notes:

- Each enemy or encounter marker can define `aggroRadius`.
- Aggro can be circular or tile-distance based.
- Line of sight can come later; start with simple radius.
- Some enemies can be passive, patrolling, sleeping, guarding, or ambushing.
- Light, stealth, party speed, Nia/scout skills, and food buffs could eventually modify detection.
- Aggro should be visible during debug/QA.

Possible encounter fields:

```js
{
  id: "floor_3_goblin_patrol",
  x: 22,
  y: 14,
  enemies: ["goblin-scout", "goblin-grunt"],
  flag: "floor_3_goblin_patrol_won",
  aggroRadius: 5,
  behavior: "patrol"
}
```

### Light Radius

The dungeon should support light radius so darkness becomes part of exploration.

Design notes:

- Party has a base light radius.
- Torches and lantern props can emit light.
- Safe rooms and guild outpost rooms should be more brightly lit.
- Some biomes can use fungus glow, crystal glow, moonlight shafts, or cursed light instead of torches.
- Light should interact with fog-of-war but not make navigation unreadable.
- Light radius can later connect to meals, gear, skills, and dungeon events.

Possible prop fields:

```js
{
  id: "floor_1_wall_torch_a",
  asset: "tile.moonroot.semantic.torch",
  x: 18,
  y: 8,
  light: {
    radius: 5,
    color: "#f2b35d",
    intensity: 0.8,
    flicker: true
  }
}
```

### Torch Light

Torches on walls should emit light.

Requirements:

- Torch placement must align with wall faces/sides.
- Torch light should not expose invalid black void as if it were a room.
- Torch light should help players read doorways, safe rooms, and hazards.
- Animated torch art is ideal, but not required for the first pass.
- QA screenshots should include torchlit corridors, torchlit doors, and unlit rooms.

## Proposed Floor Biome Ranges

These can change, but this gives GPT a structure to design against.

| Floors | Working Biome | Function |
| --- | --- | --- |
| 1-10 | Moonroot Entry / Old Root Stone | First dungeon identity, basic traps, first boss gate |
| 11-20 | Flooded Cistern / Fungal Lower Halls | First new biome target, water/fungus resources, damp stone |
| 21-30 | Collapsed Mine / Crystal Veins | Ore, crystals, unstable bridges, mining salvage |
| 31-40 | Living Root Ruins | Overgrowth, root doors, moving hazards |
| 41-50 | Ancient Shrine Machinery | Mechanisms, lamps, moon devices, checkpoint push |
| 51-60 | Deep Beast Ecology | Strong monster food/resources, dens, nests |
| 61-70 | Cursed Banquet / Rot Kitchens | Cooking/survival emphasis, strange food risks |
| 71-80 | Void-Root Labyrinth | Spatial weirdness, teleport snares, distorted walls |
| 81-90 | Moonlit Ancient City | Lost civic layer, elite enemies, rare salvage |
| 91-100 | Heart of the Hollow | Final biome, root core, boss path, story closure |

## Biome Theme Contract

Each biome should eventually be represented by a data object, not hardcoded directly into generation.

Draft shape:

```js
{
  id: "moonroot_cistern",
  name: "Flooded Cistern",
  floors: [11, 20],
  mood: "cold blue damp stone, fungal glow, submerged roots",
  tileSize: 80,
  sourceTileArtSize: 64,
  palettes: {
    floor: "blue gray stone with moss and shallow water stains",
    walls: "wet stacked stone, root veins, mineral streaks",
    accents: "cyan fungus, pale moon reflections, rusted grates"
  },
  tiles: {
    void: "tile.cistern.void",
    floorBase: ["tile.cistern.floor.base.a", "tile.cistern.floor.base.b", "tile.cistern.floor.base.c"],
    floorDetail: ["tile.cistern.floor.cracked", "tile.cistern.floor.fungus", "tile.cistern.floor.puddle"],
    wallTop: ["tile.cistern.wall.top.a", "tile.cistern.wall.top.b", "tile.cistern.wall.top.c"],
    wallFace: ["tile.cistern.wall.face.a", "tile.cistern.wall.face.b", "tile.cistern.wall.face.roots"],
    wallSideLeft: ["tile.cistern.wall.side.left.a", "tile.cistern.wall.side.left.b"],
    wallSideRight: ["tile.cistern.wall.side.right.a", "tile.cistern.wall.side.right.b"],
    corners: {
      outerTL: ["tile.cistern.wall.corner.outer.tl.a"],
      outerTR: ["tile.cistern.wall.corner.outer.tr.a"],
      outerBL: ["tile.cistern.wall.corner.outer.bl.a"],
      outerBR: ["tile.cistern.wall.corner.outer.br.a"],
      innerLeft: ["tile.cistern.wall.corner.inner.left.a"],
      innerRight: ["tile.cistern.wall.corner.inner.right.a"]
    },
    doors: {
      nsClosed: ["tile.cistern.door.ns.closed.a"],
      nsOpen: ["tile.cistern.door.ns.open.a"],
      ewClosed: ["tile.cistern.door.ew.closed.a"],
      ewOpen: ["tile.cistern.door.ew.open.a"],
      face: "tile.cistern.door.face",
      top: "tile.cistern.door.top"
    },
    hazards: {
      spikes: "tile.cistern.trap.spikes",
      darts: "tile.cistern.trap.darts",
      poison: "tile.cistern.trap.spores",
      alarm: "tile.cistern.trap.rune",
      crumble: "tile.cistern.trap.crumble",
      teleport: "tile.cistern.trap.snare",
      pitfall: "tile.cistern.trap.pit"
    },
    props: {
      chest: "tile.cistern.chest",
      stairsDown: "tile.cistern.stairs.down",
      torch: "tile.cistern.lantern",
      banner: "tile.cistern.banner",
      column: "tile.cistern.column",
      water: "tile.cistern.water.channel",
      grate: "tile.cistern.iron.grate"
    }
  },
  generation: {
    roomShapes: ["cistern", "sluice", "fungal_chamber", "drainage_hall"],
    corridorStyle: "wide damp channels with occasional bridges",
    trapBias: ["poison", "crumble", "alarm", "teleport"],
    encounterFamilies: ["bat", "ooze", "goblin", "fungal_beast"],
    resourceTables: ["fungi", "clean_water", "dirty_water", "roots", "minerals"]
  },
  qa: {
    requiredScreens: ["entry", "door", "wall_corner", "trap_room", "fog", "map", "combat_backdrop"],
    movementClearance: "all walkable tiles must read as walkable at 1x and 0.75x zoom"
  }
}
```

## Strict Biome Tileset Requirements

All generated dungeon biome tiles must obey these rules unless the code is intentionally changed first.

### Tile Scale And Format

- Source dungeon tile art should be 64x64 PNG unless a specific runtime change is made.
- Current dungeon runtime scales dungeon tiles to 80x80 for display.
- Transparent PNG is required for standalone props, wall faces, side walls, corners, doors, columns, traps, stairs, and overlays.
- Opaque square PNG is acceptable for base floor tiles, void tiles, water tiles, and top-down tile fills.
- Every tile must read correctly at 0.75x, 1x, and 2x camera zoom.
- No asset should depend on tiny detail that disappears at gameplay zoom.

### Movement And Readability Rules

- The player must always be able to identify walkable floor, blocked wall, door, trap, exit, and interactable prop at a glance.
- Walkable floor tiles must stay visually flatter and lower contrast than walls, actors, doors, chests, traps, and stairs.
- Wall tops and wall faces must clearly show vertical structure. They cannot look like walkable floor.
- Door tiles must have separate open and closed states.
- Side-facing east/west doors must read from the side, not only as north/south doors.
- Hazard tiles must be visible enough to QA, even if future gameplay can mark some as hidden.
- Stairs, exits, chests, and cooking/safe-room resources must stand out more than random floor detail.
- Do not place high-contrast cracks, roots, or puddles in the center of every floor tile; this creates false interactables and noisy movement lanes.

### Tile Coverage Checklist

A usable biome tileset needs at least:

- Void/background tile.
- Base floor tile.
- 3 floor variants.
- Cracked floor detail.
- Resource floor detail, such as fungus, roots, puddle, ore, herb, bone, or mineral.
- Wall top straight variants.
- Wall bottom cap.
- Wall face straight variants.
- Wall side left and right.
- Wall edge east and west.
- Outer corner caps: TL, TR, BL, BR.
- Inner wall corners: left and right.
- Door top.
- Door face.
- North/south door closed variants.
- North/south door open variants.
- East/west door closed variants.
- East/west door open variants.
- Stairs down.
- Chest or loot container.
- Biome light source.
- Biome banner/sign/marker.
- Column or vertical prop.
- Water/channel or biome equivalent.
- Trap visuals for spikes, darts, poison/spores, alarm rune, crumble, teleport/snare, and pitfall.

### Visual Style Rules

- Match the existing painterly fantasy RPG look.
- Keep forms readable and slightly chunky rather than thin or overly realistic.
- Avoid photorealism.
- Avoid sterile pixel art unless the whole game style changes.
- Use the current Moonroot tiles as structural references, not as a palette prison.
- Biomes can change color and material identity, but should still feel like the same game.
- Lighting should help floor identity but should not tint everything into one flat color.
- Avoid overusing purple/blue glow as a default answer for magic.
- Do not create UI-looking outlines around world props.

## Strict Character, NPC, And Monster Sprite Requirements

Humanoid and important creature sprites should move toward the newer Nia / Elara visual standard.

Current Nia / Elara movement format:

- Sheet size: 576x512.
- Frame size: 96x128.
- 6 frames per row.
- 4 direction rows.
- Row order: down, left, right, up.
- Movement FPS: 6.
- Idle FPS: 4.

Older Rowan / Cassian format still exists:

- Sheet size: 256x256.
- Frame size: 64x64.
- 4 frames per row.
- 4 direction rows.

Preferred new standard:

- Use 96x128 frames for humanoids, tall NPCs, goblins, and character-like monsters.
- Use the same row order: down, left, right, up.
- Use exactly 6 planned frames per row for movement.
- Use a matching idle sheet where needed, also 96x128 frames and 6 frames per row.
- Keep the actor centered consistently on each frame.
- Feet must stay aligned to the same ground contact line across frames.
- Do not let weapons, ears, robes, tails, or hair clip outside the 96x128 frame.
- The silhouette should read at gameplay scale and match the Nia/Elara level of painterly detail.
- Avoid making non-Nia characters cat girls. Nia is the only cat girl unless intentionally changed in story direction.

### Movement Frame Plan

Use this plan for every 6-frame walking row:

| Frame | Pose Purpose | Requirements |
| --- | --- | --- |
| 0 | Neutral contact | Both feet readable, balanced, clean silhouette |
| 1 | First step anticipation | Lead foot begins moving, shoulders/cloth shift slightly |
| 2 | First step contact | Lead foot planted, opposite foot lifting |
| 3 | Passing / recovery | Body returns near center, clean transition frame |
| 4 | Second step contact | Opposite foot planted, mirrored energy from frame 2 |
| 5 | Settle / loop prep | Motion resolves back toward frame 0 |

Idle rows:

- Frame 0: neutral.
- Frame 1: slight breath or blink.
- Frame 2: small cloth, hair, ear, tail, lantern, or weapon movement.
- Frame 3: return toward neutral.
- Frame 4: subtle alternate breath.
- Frame 5: loop prep.

Idle animation must be subtle. It should not look like walking in place.

### Monster Sprite Rules

Monsters should have anatomy and loot readability when possible.

- Goblins should show ears, gear, hands, weapon, clothing condition, and body posture.
- Beasts should show harvestable anatomy: hide, horns, claws, glands, meat, shell, bones, teeth, eyes, or organs as relevant.
- Oozes and spirits can have material loot instead of anatomy: cores, slime, motes, residue, crystal pieces.
- If a monster has loot affected by fire/slash/blunt/pierce/magic, its anatomy should make those outcomes believable.
- Do not make every monster huge. Many dungeon creatures should fit normal encounter space.
- Important enemy families should have at least one field marker sprite and one combat art asset.

## GPT / Image Generation Prompt Template

Use this structure when asking GPT/imagegen to design a biome tileset.

```text
Design a complete dungeon biome tileset for Eve: Moonroot Hollow.

Biome:
- Name:
- Floor range:
- Mood:
- Materials:
- Hazards:
- Resources:
- Enemy families:

Game constraints:
- Browser canvas RPG.
- Current dungeon source tiles are 64x64 PNG and render around 80x80 in game.
- Assets must be readable during top-down movement.
- Use painterly fantasy RPG styling consistent with the existing Moonroot Hollow assets.
- Floors must be visibly walkable and lower contrast than walls, traps, doors, props, actors, and exits.
- Avoid photorealism, over-noisy floor detail, and one-color palettes.

Deliver:
- A named asset checklist.
- A visual description for each asset.
- Strict notes for transparent vs opaque tiles.
- Suggested asset IDs using the pattern tile.<biome>.<role>.
- Notes for how each tile supports player movement readability.
- QA screenshot scenarios needed after implementation.
```

Use this structure when asking for a character, NPC, or monster movement sheet.

```text
Design a 4-direction movement spritesheet for Eve: Moonroot Hollow.

Subject:
- Name:
- Type:
- Biome/faction:
- Personality:
- Anatomy/material loot notes:
- Gear/condition notes:

Game constraints:
- Preferred humanoid frame format: 96x128.
- Sheet: 576x512.
- 4 rows: down, left, right, up.
- 6 frames per row.
- Movement frame plan: neutral, anticipation, first contact, passing, second contact, loop prep.
- Match the painterly fantasy quality and proportions of the newer Nia/Elara sprites.
- Keep ground contact consistent and centered.
- No clipping outside the frame.
- Readable at gameplay scale.

Deliver:
- Row-by-row animation prompt.
- Frame-by-frame pose plan.
- Notes on harvestable anatomy or gear condition if this is a monster.
- Separate idle sheet notes if needed.
```

## Manifest Integration Notes

After generating assets:

- Add each image to `game/data/asset_manifest.json`.
- Use clear IDs that encode biome and role, such as `tile.cistern.floor.base.a`.
- Keep paths grouped under a biome folder, such as `game/assets/tiles/cistern/`.
- Include `kind`, `path`, `width`, and `height`.
- Add `animation` metadata only for true spritesheets.
- For animated tiles, ensure frame dimensions match the runtime tile size rules for that tile family.
- Add or update validation rules if the new biome introduces required assets.
- Run `game/tools/validate-data.mjs`.
- Run canvas smoke testing and capture QA screenshots.

Suggested biome folder structure:

```text
game/assets/tiles/cistern/
  floor-base-a.png
  floor-base-b.png
  floor-cracked.png
  wall-top-a.png
  wall-face-a.png
  wall-side-left-a.png
  wall-side-right-a.png
  wall-corner-outer-tl-a.png
  door-ns-closed-a.png
  door-ns-open-a.png
  trap-spores.png
  trap-crumble.png
  stairs-down.png
  chest.png
  lantern.png
```

## Dungeon Survival And Loot Notes For Next Run

These are high-priority design notes to preserve for the next burn.

The dungeon should eventually support positive survival incentives before adding hunger or fatigue pressure.

Start with:

- Monsters drop anatomical/material loot based on kill method.
- Floors have gatherable resources: fungi, clean water, dirty water, roots, herbs, minerals, salvage, bones, eggs, moss, and other biome-specific materials.
- Camps or safe rooms allow cooking.
- Meals give meaningful exploration buffs.
- Hunger or fatigue can exist later, but should not be the first implementation. Start with rewards and interesting choices before adding penalties.

Example monster loot direction:

- A goblin can drop ears, worn gear, tattered cloth, broken weapons, carried coins/items, food scraps, bones, and meat.
- Fire damage can burn ears, ruin cloth, cook or char meat, and damage leather.
- Slashing damage can sever or ruin ears, hides, meat cuts, sacks, straps, and clothing.
- Piercing damage can preserve skins but puncture organs or waterskins.
- Blunt damage can break bones, crack armor, bruise meat, and preserve hides.
- Poison or curse damage can contaminate meat but preserve external trophies.
- Ice or water damage can preserve meat and organs but make gear brittle or waterlogged.

Loot categories to plan for:

- Anatomy: ears, horns, claws, teeth, hide, meat, organs, glands, bones, eyes.
- Equipment: weapon, shield, armor, straps, pouches, charms, tools.
- Condition: pristine, usable, worn, tattered, broken, burned, bloodied, cracked, contaminated, cursed.
- Materials: leather, cloth, metal scraps, bone, slime, crystals, fungus, roots, oils, venom.
- Food: raw meat, edible fungus, bitter herbs, clean water, unsafe water, eggs, marrow, broth ingredients.
- Quest trophies: identifiable body parts or symbols.
- Salvage: things that can be repaired, sold, cooked with, or crafted.

Meal design should create reasons to stay in the dungeon:

- HP recovery over time.
- MP recovery.
- Temporary max HP / max MP increase.
- Trap awareness.
- Poison resistance.
- Better loot preservation.
- Improved scouting or fog reveal radius.
- Extra carry capacity.
- Better morale or ultimate gain.
- Biome-specific resistance, such as damp/cold/spore/curse resistance.

This system should connect to:

- Dungeon biome resources.
- Monster anatomy profiles.
- Damage tags on attacks and skills.
- Inventory item categories.
- Cooking/camp UI.
- Party personality and dialogue.
- Quest and economy systems.

## First Biome Target Recommendation

The best first new biome target is floors 11-20: Flooded Cistern / Fungal Lower Halls.

Why:

- Floor 11 already exists as the current edge of implementation.
- It naturally supports water, fungus, roots, damp stone, oozes, bats, and dungeon survival resources.
- It can reuse some existing Moonroot assets while proving the biome-theme system.
- It gives a clear visual contrast from floors 1-10 without jumping too far into late-game weirdness.

Minimum first-pass scope:

- One complete cistern floor tile family.
- One animated water or fungus tile.
- One resource prop each for edible fungus, clean water, dirty water, and roots.
- One safe-room/camp visual marker.
- One goblin or dungeon humanoid movement sprite using 96x128 frames.
- One monster loot profile connected to kill-method notes.
- QA screenshots for floor, doors, walls, traps, fog, map, resources, and combat backdrop.
