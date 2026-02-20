
export enum GameState {
  MAIN_MENU = 'MAIN_MENU',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  GAME_OVER = 'GAME_OVER',
  VICTORY = 'VICTORY',
  HELP = 'HELP',
  SETTINGS = 'SETTINGS',
}

export enum GenerationMode {
  DRUNKARD = 'Cave Mode (Drunkard)',
  BSP = 'Dungeon Mode (BSP)',
}

export enum TileType {
  WALL = 0,
  FLOOR = 1,
  TRAP = 2,
  STAIRS = 3,
}

export enum ItemType {
  HEALTH_POTION = 'HEALTH_POTION',
  POWERUP_SPEED = 'POWERUP_SPEED',
  WEAPON_BASIC = 'WEAPON_BASIC',
  ARMOR_BASIC = 'ARMOR_BASIC',
}

export enum EnemyType {
  SKELETON = 'SKELETON',
  GOBLIN = 'GOBLIN',
  ORC = 'ORC',
  LICH = 'LICH',
}

export enum EnemyState {
  IDLE = 'IDLE',
  PATROL = 'PATROL',
  CHASE = 'CHASE',
  ATTACK = 'ATTACK',
  RETREAT = 'RETREAT',
  CASTING = 'CASTING',
}

export type AnimationState = 'IDLE' | 'MOVE' | 'ATTACK' | 'DEATH' | 'CASTING' | 'HIT';

export interface AnimationComponent {
  state: AnimationState;
  frame: number;
  direction: 1 | -1;
  bobY: number;
  _tweens: any[]; // Store GSAP tweens to kill them
}

export type Language = 'en' | 'ru';

export interface Vector2 {
  x: number;
  y: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

export interface Entity {
  id: string;
  pos: Vector2;
  size: Vector2;
  color: string;
  speed: number;
  baseSpeed?: number;
  hp: number;
  maxHp: number;
  damage: number;
  defense: number;
  isDead: boolean;
  type: 'player' | 'enemy';
  enemyType?: EnemyType;
  
  // Logic State
  state: EnemyState;
  patrolTarget?: Vector2;
  patrolPath?: Vector2[];
  patrolIndex?: number;
  spawnPos?: Vector2;
  idleTimer?: number;
  summonTimer?: number;
  castingTimer?: number;
  
  knockback: Vector2;
  cooldown: number;
  hitFlashTimer: number;

  // Visual State
  anim: AnimationComponent;
}

export interface Item {
  id: string;
  type: ItemType;
  name: string;
  pos: Vector2;
  color: string;
  value?: number;
}

export interface Chest {
  id: string;
  pos: Vector2;
  isOpened: boolean;
  enemyIds: string[]; // IDs of enemies that must be killed to unlock
  contents: Item;
  lockFeedbackAlpha: number; // Visual opacity for the locked 'X' indicator
  opacity: number; // For fading out
}

export interface GameMap {
  width: number;
  height: number;
  tiles: number[][];
  variants: number[][]; // 0: Normal, 1: Cracked, 2: Moss/Vines, 3: Special
  spawnPoint: Vector2;
  exitPoint: Vector2;
  rooms?: { x: number, y: number, w: number, h: number, type: 'normal' | 'treasure' | 'boss' }[];
}

export interface Camera {
  x: number;
  y: number;
}

export interface BiomeTheme {
  name: string;
  wallBase: string;
  wallBrick: string;
  wallHighlight: string;
  wallShadow: string;
  floorBase: string;
  floorTileMain: string; 
  floorTileAlt: string;
  detailColor: string; // Vines/Moss/Magma color
  detailType: 'moss' | 'magma' | 'dust';
}
