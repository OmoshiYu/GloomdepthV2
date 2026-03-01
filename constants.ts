
import { EnemyType, BiomeTheme } from "./types";

export const TILE_SIZE = 64;
export const MAP_WIDTH = 60; 
export const MAP_HEIGHT = 60;

export const PLAYER_SIZE = 32;
export const PLAYER_SPEED = 400; 
export const PLAYER_MAX_HP = 100;
export const PLAYER_ATTACK_COOLDOWN = 0.3;
export const PLAYER_ATTACK_RANGE = 80;
export const PLAYER_BASE_DAMAGE = 15;

export const ENEMY_SIZE = 32;
export const ENEMY_DETECT_RADIUS = 300;
export const ENEMY_MAX_HP = 50;
export const ENEMY_ATTACK_DAMAGE = 10;
export const ENEMY_ATTACK_COOLDOWN = 1.0;

export const KNOCKBACK_FORCE_PLAYER_ATK = 500; 
export const KNOCKBACK_FORCE_ENEMY_ATK = 400;  
export const KNOCKBACK_FRICTION = 8.0;         

export const ENEMY_STATS: Record<EnemyType, { hp: number, damage: number, speed: number, color: string, score: number, size: number }> = {
  [EnemyType.SKELETON]: { hp: 50, damage: 10, speed: 200, color: '#ef4444', score: 50, size: 32 },
  [EnemyType.GOBLIN]:   { hp: 30, damage: 5, speed: 300, color: '#fbbf24', score: 75, size: 32 },
  [EnemyType.ORC]:      { hp: 100, damage: 20, speed: 140, color: '#166534', score: 150, size: 32 },
  [EnemyType.LICH]:     { hp: 250, damage: 15, speed: 100, color: '#9333ea', score: 500, size: 32 },
};

export const BIOMES: Record<string, BiomeTheme> = {
  CASTLE: {
    name: 'Castle',
    wallBase: '#0f172a', // Slate 900
    wallBrick: '#334155', // Slate 700
    wallHighlight: '#475569', // Slate 600
    wallShadow: '#1e293b', // Slate 800
    floorBase: '#1c1917', // Stone 900
    floorTileMain: '#292524', // Stone 800
    floorTileAlt: '#44403c', // Stone 700
    detailColor: '#4d7c0f', // Green vines
    detailType: 'moss'
  },
  FOREST: {
    name: 'Forest',
    wallBase: '#052e16', // Green 950
    wallBrick: '#14532d', // Green 900
    wallHighlight: '#166534', // Green 800
    wallShadow: '#064e3b', // Emerald 900
    floorBase: '#1a2e05', // Lime 950 (Dark earth)
    floorTileMain: '#365314', // Lime 900
    floorTileAlt: '#3f6212', // Lime 800
    detailColor: '#65a30d', // Bright Moss
    detailType: 'moss'
  },
  LAVA: {
    name: 'Magma',
    wallBase: '#2a0a0a', // Red 950 (Darkened)
    wallBrick: '#450a0a', // Red 950
    wallHighlight: '#7f1d1d', // Red 900
    wallShadow: '#180404', 
    floorBase: '#1a0505', 
    floorTileMain: '#2d0808', 
    floorTileAlt: '#401010', 
    detailColor: '#ef4444', // Glowing Red Magma
    detailType: 'magma'
  }
};

export const ITEM_SIZE = 32;
export const CHEST_SIZE = 48;
export const ITEM_DROP_CHANCE = 0.3;
export const POTION_HEAL_AMOUNT = 30;
export const SPEED_BOOST_DURATION = 5.0;
export const SPEED_BOOST_MULTIPLIER = 1.8;

export const TRAP_DAMAGE = 15;

export const CAMERA_SHAKE_AMOUNT = 5;
export const CAMERA_SHAKE_DECAY = 0.9;

export const DEFAULT_MUSIC_VOLUME = 0.5;
export const DEFAULT_SFX_VOLUME = 0.7;

export const COLORS = {
  WALL: '#1f2937', 
  FLOOR: '#374151', 
  PLAYER: '#3b82f6', 
  PLAYER_ATTACK: '#ffffff',
  ENEMY: '#ef4444', 
  FOG: '#000000',
  ITEM_POTION: '#ef4444', 
  ITEM_POWERUP: '#fde047', 
  ITEM_WEAPON: '#9ca3af', 
  ITEM_ARMOR: '#60a5fa', 
};

export const KEYBOARD = {
  W: 'KeyW',
  A: 'KeyA',
  S: 'KeyS',
  D: 'KeyD',
  E: 'KeyE',
  Q: 'KeyQ',
  TAB: 'Tab',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  SPACE: 'Space',
  ESCAPE: 'Escape',
};

// --- LOOT DATA ---

export const TIER_COLORS = {
    COMMON: '#a1a1aa',    // Zinc 400
    UNCOMMON: '#4ade80',  // Green 400
    RARE: '#60a5fa',      // Blue 400
    EPIC: '#a78bfa',      // Purple 400
    LEGENDARY: '#fbbf24'  // Amber 400
};

export interface LootDef {
    id: string;
    nameKey: string;
    value: number; // Damage or Defense
    tier: 1 | 2 | 3 | 4;
}

export const WEAPON_TABLE: LootDef[] = [
    { id: 'dagger_rusty', nameKey: 'itemNameDaggerRusty', value: 8, tier: 1 },
    { id: 'sword_iron', nameKey: 'itemNameSwordIron', value: 14, tier: 1 },
    { id: 'axe_steel', nameKey: 'itemNameAxeSteel', value: 20, tier: 2 },
    { id: 'blade_tempered', nameKey: 'itemNameBladeTempered', value: 26, tier: 2 },
    { id: 'glaive_mithril', nameKey: 'itemNameGlaiveMithril', value: 35, tier: 3 },
    { id: 'blade_void', nameKey: 'itemNameBladeVoid', value: 50, tier: 4 },
];

export const ARMOR_TABLE: LootDef[] = [
    { id: 'tunic_ragged', nameKey: 'itemNameTunicRagged', value: 3, tier: 1 },
    { id: 'mail_chain', nameKey: 'itemNameMailChain', value: 6, tier: 1 },
    { id: 'plate_steel', nameKey: 'itemNamePlateSteel', value: 12, tier: 2 },
    { id: 'armor_royal', nameKey: 'itemNameArmorRoyal', value: 18, tier: 2 },
    { id: 'plate_dragon', nameKey: 'itemNamePlateDragon', value: 28, tier: 3 },
    { id: 'shroud_shadow', nameKey: 'itemNameShroudShadow', value: 40, tier: 4 },
];
