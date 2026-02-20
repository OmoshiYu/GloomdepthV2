
import React, { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import { 
  GameState, 
  GenerationMode, 
  GameMap, 
  Entity, 
  TileType, 
  Vector2,
  Item,
  ItemType,
  Chest,
  Particle,
  EnemyType,
  Language,
  EnemyState
} from '../types';
import { 
  TILE_SIZE, 
  MAP_WIDTH, 
  MAP_HEIGHT, 
  PLAYER_SIZE, 
  PLAYER_SPEED, 
  PLAYER_MAX_HP,
  COLORS,
  KEYBOARD,
  ENEMY_STATS,
  ENEMY_DETECT_RADIUS,
  ENEMY_ATTACK_COOLDOWN,
  ENEMY_ATTACK_DAMAGE,
  PLAYER_ATTACK_COOLDOWN,
  PLAYER_BASE_DAMAGE,
  PLAYER_ATTACK_RANGE,
  ITEM_DROP_CHANCE,
  ITEM_SIZE,
  CHEST_SIZE,
  POTION_HEAL_AMOUNT,
  SPEED_BOOST_DURATION,
  SPEED_BOOST_MULTIPLIER,
  CAMERA_SHAKE_AMOUNT,
  DEFAULT_MUSIC_VOLUME,
  DEFAULT_SFX_VOLUME,
  TRAP_DAMAGE,
  KNOCKBACK_FORCE_PLAYER_ATK,
  KNOCKBACK_FORCE_ENEMY_ATK,
  BIOMES,
  WEAPON_TABLE,
  ARMOR_TABLE,
  TIER_COLORS,
  LootDef
} from '../constants';
import { InputHandler } from '../utils/input';
import { TRANSLATIONS } from '../utils/translations';
import { generateDrunkardMap, generateBSPMap } from '../services/mapGenerator';
import { generateSprites, SpriteSheet } from '../services/spriteGenerator';
import { audioManager } from '../services/audioManager';
import { storageManager } from '../services/storageManager';
import { checkCollision, getPatrolPath, hasLineOfSight } from '../services/physics';
import { renderWorld } from '../services/renderer';
import { initAnimation, updateEntityVisuals, playStateAnimation } from '../services/animationSystem';
import { GameHUD, InventoryBar, InventoryModal, TouchControls } from './GameUI';
import { MainMenu, PauseMenu, GameOverMenu, SettingsMenu, HelpMenu, VictoryMenu } from './Menus';

const GloomdepthGame: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MAIN_MENU);
  const [genMode, setGenMode] = useState<GenerationMode>(GenerationMode.DRUNKARD);
  const [playerHp, setPlayerHp] = useState(PLAYER_MAX_HP);
  const [playerMaxHp, setPlayerMaxHp] = useState(PLAYER_MAX_HP);
  const [playerDamage, setPlayerDamage] = useState(PLAYER_BASE_DAMAGE);
  const [playerDefense, setPlayerDefense] = useState(0);
  const [score, setScore] = useState(0);
  const [floor, setFloor] = useState(1);
  const [inventory, setInventory] = useState<Item[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  
  const [musicVolume, setMusicVolume] = useState(DEFAULT_MUSIC_VOLUME);
  const [sfxVolume, setSfxVolume] = useState(DEFAULT_SFX_VOLUME);
  const [fullscreen, setFullscreen] = useState(false);
  const [language, setLanguage] = useState<Language>('ru');
  
  const [showTouchControls, setShowTouchControls] = useState<boolean>(false);

  const [audioInitialized, setAudioInitialized] = useState(false);
  const [hasSave, setHasSave] = useState(false);

  const [messageLog, setMessageLog] = useState<string[]>([]);
  
  const [equipped, setEquipped] = useState<{
    weapon: Item | null;
    armor: Item | null;
  }>({ weapon: null, armor: null });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | null>(null);
  const inputRef = useRef<InputHandler>(new InputHandler());
  const spritesRef = useRef<SpriteSheet | null>(null);
  
  const joystickRef = useRef({ 
    id: null as number | null, 
    startX: 0, 
    startY: 0, 
    vector: { x: 0, y: 0 },
    active: false 
  });
  const attackBtnRef = useRef(false);
  const joystickKnobRef = useRef<HTMLDivElement>(null);

  const worldRef = useRef<{
    map: GameMap | null;
    player: Entity | null;
    enemies: Entity[];
    items: Item[];
    chests: Chest[];
    particles: Particle[];
    trail: Vector2[]; 
    camera: Vector2;
    shake: number;
    lastTime: number;
    attackAnim: number;
    attackDir: Vector2;
    speedBoostTimer: number;
    trailTimer: number;
    menuScroll: number; 
    transitionAlpha: number;
  }>({
    map: null,
    player: null,
    enemies: [],
    items: [],
    chests: [],
    particles: [],
    trail: [],
    camera: { x: 0, y: 0 },
    shake: 0,
    lastTime: 0,
    attackAnim: 0,
    attackDir: { x: 0, y: 0 },
    speedBoostTimer: 0,
    trailTimer: 0,
    menuScroll: 0,
    transitionAlpha: 0
  });

  const t = TRANSLATIONS[language];

  // Initialize
  useEffect(() => {
    spritesRef.current = generateSprites(BIOMES.CASTLE);
    const loadedSettings = storageManager.loadSettings();
    if (loadedSettings) {
        setMusicVolume(loadedSettings.musicVolume);
        setSfxVolume(loadedSettings.sfxVolume);
        setLanguage(loadedSettings.language);
        if (loadedSettings.showTouchControls !== undefined) {
            setShowTouchControls(loadedSettings.showTouchControls);
        } else {
            setShowTouchControls(('ontouchstart' in window) || navigator.maxTouchPoints > 0);
        }
    } else {
        setShowTouchControls(('ontouchstart' in window) || navigator.maxTouchPoints > 0);
    }
    setHasSave(storageManager.hasSave());
    
    audioManager.setMusicVolume(loadedSettings ? loadedSettings.musicVolume : musicVolume);
    audioManager.setSfxVolume(loadedSettings ? loadedSettings.sfxVolume : sfxVolume);
    
    const initAudio = () => {
        audioManager.resume().then(() => { setAudioInitialized(true); });
        window.removeEventListener('click', initAudio);
        window.removeEventListener('keydown', initAudio);
        window.removeEventListener('touchstart', initAudio);
    };
    window.addEventListener('click', initAudio);
    window.addEventListener('keydown', initAudio);
    window.addEventListener('touchstart', initAudio);
    return () => {
         audioManager.stopMusic();
         window.removeEventListener('click', initAudio);
         window.removeEventListener('keydown', initAudio);
         window.removeEventListener('touchstart', initAudio);
    };
  }, []);

  useEffect(() => {
    storageManager.saveSettings({ musicVolume, sfxVolume, language, showTouchControls });
    audioManager.setMusicVolume(musicVolume);
  }, [musicVolume, sfxVolume, language, showTouchControls]);

  useEffect(() => { audioManager.setSfxVolume(sfxVolume); }, [sfxVolume]);

  useEffect(() => {
    if (!audioInitialized) return; 
    audioManager.resume();
    switch (gameState) {
        case GameState.MAIN_MENU: audioManager.playMenuMusic(); break;
        case GameState.PLAYING: audioManager.playGameMusic(); worldRef.current.lastTime = performance.now(); break;
        case GameState.GAME_OVER: case GameState.VICTORY: audioManager.stopMusic(); break;
        case GameState.PAUSED: break;
    }
  }, [gameState, audioInitialized]);

  const addLogMessage = (msg: string) => { setMessageLog(prev => [msg, ...prev].slice(0, 5)); };
  const getBiomeForFloor = (floor: number) => floor <= 3 ? BIOMES.CASTLE : (floor <= 6 ? BIOMES.FOREST : BIOMES.LAVA);

  const saveProgress = (currentFloor?: number) => {
      if (!worldRef.current.player || !worldRef.current.map) return;
      const saveFloor = currentFloor || floor;
      storageManager.saveGame({
          floor: saveFloor,
          score,
          genMode,
          player: { hp: playerHp, maxHp: playerMaxHp, damage: playerDamage, defense: playerDefense },
          playerPos: worldRef.current.player.pos,
          inventory,
          equipped,
          map: worldRef.current.map,
          enemies: worldRef.current.enemies,
          items: worldRef.current.items,
          chests: worldRef.current.chests,
          timestamp: Date.now()
      });
      setHasSave(true);
      addLogMessage(t.checkpointSaved);
  };

  const loadGame = () => {
      const save = storageManager.loadGame();
      if (!save) return;
      audioManager.resume();
      setGenMode(save.genMode);
      setFloor(save.floor);
      setScore(save.score);
      setPlayerHp(save.player.hp);
      setPlayerMaxHp(save.player.maxHp);
      setPlayerDamage(save.player.damage);
      setPlayerDefense(save.player.defense);
      setInventory(save.inventory);
      setEquipped(save.equipped);
      setMessageLog([]);

      worldRef.current.map = save.map;
      worldRef.current.enemies = save.enemies;
      worldRef.current.items = save.items;
      worldRef.current.chests = save.chests;

      worldRef.current.enemies.forEach(e => {
          initAnimation(e);
      });

      worldRef.current.player = {
        id: 'player',
        pos: save.playerPos, 
        size: { x: PLAYER_SIZE, y: PLAYER_SIZE },
        color: COLORS.PLAYER,
        speed: PLAYER_SPEED,
        baseSpeed: PLAYER_SPEED,
        hp: save.player.hp,
        maxHp: save.player.maxHp,
        damage: save.player.damage,
        defense: save.player.defense,
        isDead: false,
        type: 'player',
        state: EnemyState.IDLE, 
        knockback: { x: 0, y: 0 },
        cooldown: 0,
        hitFlashTimer: 0,
        anim: null as any 
      };
      initAnimation(worldRef.current.player);
      
      // Ensure existing chests have the new visual properties robustly
      worldRef.current.chests.forEach(c => { 
          if (typeof c.lockFeedbackAlpha !== 'number') c.lockFeedbackAlpha = 0;
          if (typeof c.opacity !== 'number') c.opacity = 1.0;
      });

      spritesRef.current = generateSprites(getBiomeForFloor(save.floor));
      worldRef.current.transitionAlpha = 0;
      setGameState(GameState.PLAYING);
      addLogMessage(t.floorLoaded.replace('{0}', save.floor.toString()));
  };

  // Joystick Logic
  const handleJoystickStart = (e: React.TouchEvent) => {
    if (e.cancelable) e.preventDefault();
    if (joystickRef.current.active) return;
    const touch = e.changedTouches[0] as React.Touch;
    joystickRef.current.id = touch.identifier;
    joystickRef.current.active = true;
    joystickRef.current.startX = touch.clientX;
    joystickRef.current.startY = touch.clientY;
    joystickRef.current.vector = { x: 0, y: 0 };
  };

  const handleJoystickMove = (e: React.TouchEvent) => {
    if (e.cancelable) e.preventDefault();
    if (!joystickRef.current.active) return;
    const touch = (Array.from(e.changedTouches) as React.Touch[]).find((t) => t.identifier === joystickRef.current.id);
    if (touch) {
      const maxDist = 40;
      const distX = touch.clientX - joystickRef.current.startX;
      const distY = touch.clientY - joystickRef.current.startY;
      const dist = Math.hypot(distX, distY);
      const visualDist = Math.min(dist, maxDist);
      const angle = Math.atan2(distY, distX);
      const mag = Math.min(dist / maxDist, 1.0);
      joystickRef.current.vector = { x: Math.cos(angle) * mag, y: Math.sin(angle) * mag };
      if (joystickKnobRef.current) {
        joystickKnobRef.current.style.transform = `translate(${Math.cos(angle) * visualDist}px, ${Math.sin(angle) * visualDist}px)`;
      }
    }
  };

  const handleJoystickEnd = (e: React.TouchEvent) => {
    if (e.cancelable) e.preventDefault();
    const touch = (Array.from(e.changedTouches) as React.Touch[]).find((t) => t.identifier === joystickRef.current.id);
    if (touch) {
      joystickRef.current.active = false;
      joystickRef.current.vector = { x: 0, y: 0 };
      if (joystickKnobRef.current) joystickKnobRef.current.style.transform = `translate(0px, 0px)`;
    }
  };

  const spawnParticles = (x: number, y: number, count: number, color: string, speed: number = 1) => {
      for (let i = 0; i < count; i++) {
          const angle = Math.random() * Math.PI * 2;
          const vel = Math.random() * speed;
          worldRef.current.particles.push({
              x, y, vx: Math.cos(angle) * vel, vy: Math.sin(angle) * vel,
              life: 1.0, color: color, size: Math.random() * 3 + 1
          });
      }
  };

  const spawnEnemy = (x: number, y: number, type: EnemyType, level: number): Entity => {
      const stats = ENEMY_STATS[type];
      const scaleMult = 1 + (level - 1) * 0.2; 
      const dmgMult = 1 + (level - 1) * 0.1; 
      const enemy: Entity = {
          id: `enemy-${Date.now()}-${Math.random()}`,
          pos: { x, y }, spawnPos: { x, y }, size: { x: stats.size, y: stats.size },
          color: stats.color, speed: stats.speed,
          hp: Math.floor(stats.hp * scaleMult), maxHp: Math.floor(stats.hp * scaleMult),
          damage: Math.floor(stats.damage * dmgMult), defense: 0,
          isDead: false, type: 'enemy', enemyType: type, state: EnemyState.IDLE,
          idleTimer: Math.random() * 2, knockback: { x: 0, y: 0 },
          cooldown: 0, summonTimer: 300, castingTimer: 0, hitFlashTimer: 0,
          anim: null as any
      };
      initAnimation(enemy);
      if (worldRef.current.map) enemy.patrolPath = getPatrolPath({x, y}, 250, worldRef.current.map, 3);
      return enemy;
  };

  // Loot Logic
  const getTierForFloor = (floor: number): number => {
      const r = Math.random();
      if (floor <= 2) return 1;
      if (floor <= 4) return r < 0.6 ? 1 : 2;
      if (floor <= 6) return r < 0.6 ? 2 : 3;
      if (floor <= 8) {
          if (r < 0.3) return 2;
          if (r < 0.9) return 3;
          return 4;
      }
      return r < 0.5 ? 3 : 4;
  };

  const getLootItem = (table: LootDef[], tier: number): LootDef | undefined => {
      const candidates = table.filter(i => i.tier === tier);
      if (candidates.length === 0) return table[0]; 
      return candidates[Math.floor(Math.random() * candidates.length)];
  };

  const getColorForTier = (tier: number): string => {
      switch(tier) {
          case 2: return TIER_COLORS.UNCOMMON;
          case 3: return TIER_COLORS.RARE;
          case 4: return TIER_COLORS.LEGENDARY;
          default: return TIER_COLORS.COMMON;
      }
  };

  const createChestItem = (level: number): Item => {
      const rand = Math.random();
      let type = ItemType.HEALTH_POTION;
      let name = 'itemNamePotion'; // Default key
      let color = COLORS.ITEM_POTION;
      let val = POTION_HEAL_AMOUNT;

      const lootBoost = Math.min(0.2, (level - 1) * 0.02);
      const tier = getTierForFloor(level);

      // 40% Potion, 30% Weapon, 20% Armor, 10% Scroll
      if (rand < 0.4 - lootBoost) {
           // Potion defaults
      } else if (rand < 0.7 - lootBoost) {
           type = ItemType.WEAPON_BASIC;
           const weapon = getLootItem(WEAPON_TABLE, tier);
           if (weapon) {
               name = weapon.nameKey;
               val = weapon.value;
               color = getColorForTier(weapon.tier);
           }
      } else if (rand < 0.9) {
           type = ItemType.ARMOR_BASIC;
           const armor = getLootItem(ARMOR_TABLE, tier);
           if (armor) {
               name = armor.nameKey;
               val = armor.value;
               color = getColorForTier(armor.tier);
           }
      } else {
           type = ItemType.POWERUP_SPEED;
           name = 'itemNameSpeed';
           color = COLORS.ITEM_POWERUP;
           val = 0;
      }
      return {
          id: `item-${Date.now()}-${Math.random()}`,
          type,
          name,
          pos: { x: 0, y: 0 }, 
          color,
          value: val
      };
  };

  const spawnChest = (x: number, y: number, enemyIds: string[], level: number) => {
      worldRef.current.chests.push({ 
          id: `chest-${Date.now()}-${Math.random()}`, 
          pos: { x, y }, 
          isOpened: false, 
          enemyIds, 
          contents: createChestItem(level),
          lockFeedbackAlpha: 0,
          opacity: 1.0 
      });
  };

  const spawnLoot = (x: number, y: number) => {
        const rand = Math.random();
        let type = ItemType.HEALTH_POTION;
        let name = 'itemNamePotion';
        let color = COLORS.ITEM_POTION;
        let val = POTION_HEAL_AMOUNT;
        
        // Floor based tier
        const tier = getTierForFloor(floor);

        // 50% Potion, 20% Scroll, 15% Weapon, 15% Armor
        if (rand < 0.5) { 
            // Potion
        } else if (rand < 0.7) { 
            type = ItemType.POWERUP_SPEED; 
            name = 'itemNameSpeed'; 
            color = COLORS.ITEM_POWERUP; 
            val = 0; 
        } else if (rand < 0.85) { 
            type = ItemType.WEAPON_BASIC; 
            const weapon = getLootItem(WEAPON_TABLE, tier);
            if (weapon) {
                name = weapon.nameKey;
                val = weapon.value;
                color = getColorForTier(weapon.tier);
            } else {
                color = COLORS.ITEM_WEAPON;
                val = 15;
            }
        } else { 
            type = ItemType.ARMOR_BASIC; 
            const armor = getLootItem(ARMOR_TABLE, tier);
            if (armor) {
                name = armor.nameKey;
                val = armor.value;
                color = getColorForTier(armor.tier);
            } else {
                color = COLORS.ITEM_ARMOR;
                val = 5;
            }
        }
        worldRef.current.items.push({ id: `item-${Date.now()}-${Math.random()}`, type, name, pos: { x, y }, color, value: val });
  };

  const initLevel = (level: number) => {
    worldRef.current.items = [];
    worldRef.current.chests = [];
    worldRef.current.particles = [];
    worldRef.current.trail = [];
    worldRef.current.transitionAlpha = 0;
    spritesRef.current = generateSprites(getBiomeForFloor(level));
    const map = genMode === GenerationMode.DRUNKARD ? generateDrunkardMap(MAP_WIDTH, MAP_HEIGHT) : generateBSPMap(MAP_WIDTH, MAP_HEIGHT);
    const enemies: Entity[] = [];
    
    if (map.rooms && genMode === GenerationMode.BSP) {
        map.rooms.forEach(room => {
            const cx = Math.floor(room.x + room.w/2) * TILE_SIZE;
            const cy = Math.floor(room.y + room.h/2) * TILE_SIZE;
            const roomEnemies: string[] = [];
            if (room.type === 'treasure') {
                const guard = spawnEnemy(cx + 40, cy, EnemyType.ORC, level);
                enemies.push(guard); roomEnemies.push(guard.id);
                spawnChest(cx - CHEST_SIZE/2, cy - CHEST_SIZE/2, roomEnemies, level);
            } else if (room.type === 'boss') {
                const boss = spawnEnemy(cx, cy, EnemyType.LICH, level);
                enemies.push(boss); roomEnemies.push(boss.id);
                spawnChest(cx - CHEST_SIZE/2, cy - CHEST_SIZE/2, roomEnemies, level);
            } else if (room.type === 'normal' && Math.random() < 0.3) {
                 const type = Math.random() > 0.6 ? EnemyType.GOBLIN : EnemyType.SKELETON;
                 enemies.push(spawnEnemy(cx, cy, type, level));
            }
        });
    }

    if (genMode === GenerationMode.DRUNKARD) {
        for(let i=0; i<8; i++) {
            let placed = false, attempts = 0;
            while(!placed && attempts < 50) {
                const tx = Math.floor(Math.random() * (map.width - 4)) + 2;
                const ty = Math.floor(Math.random() * (map.height - 4)) + 2;
                if (map.tiles[ty][tx] === TileType.FLOOR) {
                    const dist = Math.hypot(tx*TILE_SIZE - map.spawnPoint.x, ty*TILE_SIZE - map.spawnPoint.y);
                    if (dist > 600) {
                        const chestEnemies: string[] = [];
                        for(let k=0; k<3; k++) {
                            const angle = Math.random() * Math.PI * 2, r = 50 + Math.random() * 50;
                            const ex = tx * TILE_SIZE + Math.cos(angle) * r, ey = ty * TILE_SIZE + Math.sin(angle) * r;
                            if (map.tiles[Math.floor(ey/TILE_SIZE)][Math.floor(ex/TILE_SIZE)] === TileType.FLOOR) {
                                const type = Math.random() > 0.7 ? EnemyType.ORC : EnemyType.SKELETON;
                                const enemy = spawnEnemy(ex, ey, type, level);
                                enemies.push(enemy); chestEnemies.push(enemy.id);
                            }
                        }
                        spawnChest(tx * TILE_SIZE + (TILE_SIZE-CHEST_SIZE)/2, ty * TILE_SIZE + (TILE_SIZE-CHEST_SIZE)/2, chestEnemies, level);
                        placed = true;
                    }
                }
                attempts++;
            }
        }
    }

    let attempts = 0;
    const maxEnemies = 40 + (level * 2); 
    while (enemies.length < maxEnemies && attempts < 2000) {
      attempts++;
      const ex = Math.floor(Math.random() * map.width), ey = Math.floor(Math.random() * map.height);
      if (map.tiles[ey][ex] === TileType.FLOOR) {
        const spawnDist = Math.hypot(ex * TILE_SIZE - map.spawnPoint.x, ey * TILE_SIZE - map.spawnPoint.y);
        if (spawnDist > 400) { 
            const rand = Math.random();
            let type = EnemyType.SKELETON;
            if (level > 5 && rand > 0.90) type = EnemyType.LICH;
            else if (level > 2 && rand > 0.80) type = EnemyType.ORC;
            else if (rand > 0.60) type = EnemyType.GOBLIN;
            if (type === EnemyType.LICH && enemies.filter(e => e.enemyType === EnemyType.LICH).length >= 3) type = EnemyType.ORC;
            enemies.push(spawnEnemy(ex * TILE_SIZE, ey * TILE_SIZE, type, level));
        }
      }
    }
    worldRef.current.map = map;
    worldRef.current.enemies = enemies;
    if (worldRef.current.player) worldRef.current.player.pos = { ...map.spawnPoint };
  };

  const startGame = () => {
    audioManager.resume();
    setFloor(1);
    worldRef.current.player = {
        id: 'player', pos: { x: 0, y: 0 }, size: { x: PLAYER_SIZE, y: PLAYER_SIZE },
        color: COLORS.PLAYER, speed: PLAYER_SPEED, baseSpeed: PLAYER_SPEED,
        hp: PLAYER_MAX_HP, maxHp: PLAYER_MAX_HP, damage: PLAYER_BASE_DAMAGE, defense: 0,
        isDead: false, type: 'player', state: EnemyState.IDLE, knockback: { x: 0, y: 0 },
        cooldown: 0, hitFlashTimer: 0, anim: null as any
    };
    initAnimation(worldRef.current.player);
    initLevel(1);
    setPlayerHp(PLAYER_MAX_HP); setPlayerMaxHp(PLAYER_MAX_HP); setPlayerDamage(PLAYER_BASE_DAMAGE);
    setPlayerDefense(0); setEquipped({ weapon: null, armor: null }); setInventory([]); setScore(0); setMessageLog([]);
    setGameState(GameState.PLAYING);
    saveProgress(1);
  };

  const nextLevel = () => {
      const nextFloor = floor + 1;
      if (nextFloor > 10) {
          // Trigger Ending Sequence
          gsap.to(worldRef.current, {
              transitionAlpha: 1,
              duration: 2.5,
              onComplete: () => {
                  setGameState(GameState.VICTORY);
                  audioManager.playVictory();
                  storageManager.clearSave();
                  setHasSave(false);
              }
          });
          return;
      }
      setFloor(nextFloor);
      addLogMessage(`${t.descended} ${nextFloor}...`);
      audioManager.playLevelTransition(); 
      initLevel(nextFloor);
      saveProgress(nextFloor);
  };
  
  const checkTrapCollision = (player: Entity, map: GameMap) => {
      const cx = player.pos.x + player.size.x/2;
      const cy = player.pos.y + player.size.y/2;
      const tx = Math.floor(cx / TILE_SIZE);
      const ty = Math.floor(cy / TILE_SIZE);
      if (tx >= 0 && tx < map.width && ty >= 0 && ty < map.height) {
          if (map.tiles[ty][tx] === TileType.TRAP) {
              if (player.hitFlashTimer <= 0) { 
                  const finalDmg = Math.max(1, TRAP_DAMAGE - Math.floor(player.defense / 2));
                  player.hp -= finalDmg;
                  player.hitFlashTimer = 30; 
                  worldRef.current.shake = 3;
                  setPlayerHp(player.hp);
                  audioManager.playHit();
                  addLogMessage(t.steppedTrap);
                  spawnParticles(cx, cy, 5, '#52525b', 2);
                  if (player.hp <= 0) { setGameState(GameState.GAME_OVER); audioManager.playDeath(); }
              }
          }
      }
  }

  const checkStairs = (player: Entity, map: GameMap) => {
      const cx = player.pos.x + player.size.x/2;
      const cy = player.pos.y + player.size.y/2;
      const tx = Math.floor(cx / TILE_SIZE);
      const ty = Math.floor(cy / TILE_SIZE);
      if (tx >= 0 && tx < map.width && ty >= 0 && ty < map.height) {
          if (map.tiles[ty][tx] === TileType.STAIRS) {
              nextLevel();
          }
      }
  }

  const updatePlayerStats = () => {
      if (!worldRef.current.player) return;
      let dmg = PLAYER_BASE_DAMAGE, def = 0;
      if (equipped.weapon) dmg += (equipped.weapon.value || 0);
      if (equipped.armor) def += (equipped.armor.value || 0);
      worldRef.current.player.damage = dmg;
      worldRef.current.player.defense = def;
      setPlayerDamage(dmg); setPlayerDefense(def);
  };
  useEffect(() => { updatePlayerStats(); }, [equipped]);

  const usePotion = (item?: Item) => {
      if (!worldRef.current.player) return;
      setInventory(prev => {
          const index = item ? prev.indexOf(item) : prev.findIndex(i => i.type === ItemType.HEALTH_POTION);
          if (index === -1) { if (!showInventory && !item) addLogMessage(t.noPotions); return prev; }
          const usedItem = prev[index];
          if(usedItem.type !== ItemType.HEALTH_POTION) return prev;
          worldRef.current.player!.hp = Math.min(worldRef.current.player!.maxHp, worldRef.current.player!.hp + POTION_HEAL_AMOUNT);
          spawnParticles(worldRef.current.player!.pos.x + PLAYER_SIZE/2, worldRef.current.player!.pos.y + PLAYER_SIZE/2, 10, '#4ade80', 2);
          setPlayerHp(worldRef.current.player!.hp);
          addLogMessage(t.usedPotion);
          audioManager.playPickup(); 
          const newInv = [...prev]; newInv.splice(index, 1);
          return newInv;
      });
  };

  const equipItem = (item: Item) => {
      if (item.type === ItemType.WEAPON_BASIC) {
          setInventory(prev => { const newInv = prev.filter(i => i !== item); if (equipped.weapon) newInv.push(equipped.weapon); return newInv; });
          setEquipped(prev => ({ ...prev, weapon: item }));
          audioManager.playEquip(); addLogMessage(`${t.equipped} ${t[item.name] || item.name}`);
      } else if (item.type === ItemType.ARMOR_BASIC) {
          setInventory(prev => { const newInv = prev.filter(i => i !== item); if (equipped.armor) newInv.push(equipped.armor); return newInv; });
          setEquipped(prev => ({ ...prev, armor: item }));
          audioManager.playEquip(); addLogMessage(`${t.equipped} ${t[item.name] || item.name}`);
      }
  };

  const unequipItem = (slot: 'weapon' | 'armor') => {
      const item = equipped[slot];
      if (item) {
          setInventory(prev => [...prev, item]);
          setEquipped(prev => ({ ...prev, [slot]: null }));
          audioManager.playEquip(); addLogMessage(`${t.unequipped} ${t[item.name] || item.name}`);
      }
  };

  const update = (time: number) => {
    if (gameState !== GameState.PLAYING || showInventory) {
        worldRef.current.lastTime = time;
        return;
    }

    const world = worldRef.current;
    if (!world.player || !world.map) return;

    const dt = Math.min((time - world.lastTime) / 1000, 0.1); 
    world.lastTime = time;

    const player = world.player;
    const input = inputRef.current;

    if (world.shake > 0) {
        world.shake -= dt * 30; 
        if (world.shake < 0) world.shake = 0;
    }

    let dx = 0, dy = 0;
    const knockbackSpeed = Math.hypot(player.knockback.x, player.knockback.y);
    const hasControl = knockbackSpeed < 100;

    if (hasControl) {
        if (input.isDown(KEYBOARD.W) || input.isDown(KEYBOARD.ARROW_UP)) dy = -1;
        if (input.isDown(KEYBOARD.S) || input.isDown(KEYBOARD.ARROW_DOWN)) dy = 1;
        if (input.isDown(KEYBOARD.A) || input.isDown(KEYBOARD.ARROW_LEFT)) dx = -1;
        if (input.isDown(KEYBOARD.D) || input.isDown(KEYBOARD.ARROW_RIGHT)) dx = 1;
        
        let mag = 1.0;
        if (dx === 0 && dy === 0 && joystickRef.current.active) { 
            dx = joystickRef.current.vector.x; 
            dy = joystickRef.current.vector.y; 
            mag = Math.hypot(dx, dy);
        } else if (dx !== 0 || dy !== 0) {
            const len = Math.hypot(dx, dy);
            dx /= len; dy /= len;
        }
        
        if (dx !== 0 || dy !== 0) {
            world.attackDir = { x: mag > 0 ? dx/mag : 0, y: mag > 0 ? dy/mag : 0 };
        }
    }

    if (world.speedBoostTimer > 0) {
        world.speedBoostTimer -= dt;
        player.speed = (player.baseSpeed || PLAYER_SPEED) * SPEED_BOOST_MULTIPLIER;
        world.trailTimer -= dt;
        if (world.trailTimer <= 0) {
            world.trail.push({ x: player.pos.x, y: player.pos.y });
            if (world.trail.length > 8) world.trail.shift();
            world.trailTimer = 0.08;
        }
    } else {
        player.speed = player.baseSpeed || PLAYER_SPEED;
        world.trail = [];
    }

    const moveDist = player.speed * dt;
    // Apply position from velocity + GSAP-driven knockback directly
    const totalVx = (dx * moveDist) + (player.knockback.x * dt);
    const totalVy = (dy * moveDist) + (player.knockback.y * dt);

    const nextX = { ...player.pos, x: player.pos.x + totalVx };
    if (!checkCollision(nextX, player.size, world.map)) player.pos.x = nextX.x;
    
    const nextY = { ...player.pos, y: player.pos.y + totalVy };
    if (!checkCollision(nextY, player.size, world.map)) player.pos.y = nextY.y;

    // No manual friction needed, GSAP tweens knockback to 0.

    checkTrapCollision(player, world.map);
    checkStairs(player, world.map);

    // Update Visuals (GSAP)
    updateEntityVisuals(player, { x: dx, y: dy });

    // Chest Interaction
    for (let i = world.chests.length - 1; i >= 0; i--) {
        const chest = world.chests[i];
        
        // Robust Opacity Initialization Check
        if (typeof chest.opacity !== 'number') chest.opacity = 1.0;
        if (typeof chest.lockFeedbackAlpha !== 'number') chest.lockFeedbackAlpha = 0;

        if (chest.isOpened) {
             chest.opacity -= dt * 1.5; // Slightly faster fade for responsiveness
             // Ensure X fades out if it was visible
             chest.lockFeedbackAlpha = Math.max(0, chest.lockFeedbackAlpha - dt * 4);
             
             if (chest.opacity <= 0) {
                 world.chests.splice(i, 1);
                 continue;
             }
        } else {
            const dist = Math.hypot((player.pos.x + player.size.x/2) - (chest.pos.x + CHEST_SIZE/2), (player.pos.y + player.size.y/2) - (chest.pos.y + CHEST_SIZE/2));
            const locked = chest.enemyIds.some(id => world.enemies.find(e => e.id === id && !e.isDead));
            
            // Visual Feedback Logic for 'X'
            if (dist < PLAYER_SIZE * 2.0 && locked) {
                // Fade in 'X' if locked and close
                chest.lockFeedbackAlpha = Math.min(1.0, chest.lockFeedbackAlpha + dt * 4);
            } else {
                // Fade out 'X'
                chest.lockFeedbackAlpha = Math.max(0, chest.lockFeedbackAlpha - dt * 2);
            }

            if (dist < PLAYER_SIZE * 1.5) {
                if (!locked) {
                    chest.isOpened = true;
                    audioManager.playPickup();
                    spawnParticles(chest.pos.x + CHEST_SIZE/2, chest.pos.y + CHEST_SIZE/2, 20, '#fcd34d', 3);
                    const item = chest.contents;
                    item.pos = { x: chest.pos.x + (CHEST_SIZE - ITEM_SIZE)/2, y: chest.pos.y + (CHEST_SIZE - ITEM_SIZE)/2 };
                    world.items.push(item);
                }
            }
        }
    }

    for (let i = world.items.length - 1; i >= 0; i--) {
        const item = world.items[i];
        const dist = Math.hypot((player.pos.x + player.size.x/2) - (item.pos.x + ITEM_SIZE/2), (player.pos.y + player.size.y/2) - (item.pos.y + ITEM_SIZE/2));
        if (dist < PLAYER_SIZE) {
            world.items.splice(i, 1);
            if (item.type === ItemType.POWERUP_SPEED) {
                world.speedBoostTimer = SPEED_BOOST_DURATION;
                addLogMessage(t.speedBoost);
                spawnParticles(player.pos.x, player.pos.y, 15, '#fde047', 3);
                audioManager.playPowerup();
            } else {
                addLogMessage(`${t.pickedUp} ${t[item.name] || item.name}`);
                setInventory(prev => [...prev, item]);
                audioManager.playPickup();
            }
        }
    }

    if (player.cooldown > 0) player.cooldown -= dt;
    
    // Attack Input
    const isAttacking = input.isDown(KEYBOARD.SPACE) || attackBtnRef.current;

    if (isAttacking && player.cooldown <= 0) {
      player.cooldown = PLAYER_ATTACK_COOLDOWN;
      
      // GSAP Visuals for Attack
      playStateAnimation(player, 'ATTACK');
      
      // Animate Attack Swipe Visual
      world.attackAnim = 10;
      gsap.to(world, { attackAnim: 0, duration: 0.25, ease: "linear" }); // Swing speed matched

      world.shake = CAMERA_SHAKE_AMOUNT;
      audioManager.playAttack();
      
      const pCx = player.pos.x + player.size.x / 2;
      const pCy = player.pos.y + player.size.y / 2;
      
      for (let i = 0; i < 15; i++) {
          const speed = Math.random() * 10 + 5; 
          const spread = 0.7; 
          const angle = Math.atan2(world.attackDir.y, world.attackDir.x) + (Math.random() - 0.5) * spread;
          worldRef.current.particles.push({
              x: pCx + Math.cos(angle) * 10, y: pCy + Math.sin(angle) * 10,
              vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
              life: 0.2 + Math.random() * 0.2, color: '#ffffff', size: Math.random() * 3 + 2
          });
      }
      
      const attackCenter = { x: player.pos.x + player.size.x/2 + world.attackDir.x * 20, y: player.pos.y + player.size.y/2 + world.attackDir.y * 20 };

      world.enemies.forEach(enemy => {
         const enemyCenter = { x: enemy.pos.x + enemy.size.x/2, y: enemy.pos.y + enemy.size.y/2 };
         const dist = Math.hypot(enemyCenter.x - attackCenter.x, enemyCenter.y - attackCenter.y);
         const hasAttackLOS = hasLineOfSight({ x: pCx, y: pCy }, enemyCenter, world.map!);

         if (dist < PLAYER_ATTACK_RANGE && hasAttackLOS) {
           enemy.hp -= player.damage;
           enemy.hitFlashTimer = 10; 
           audioManager.playHit();
           playStateAnimation(enemy, 'HIT'); // Flash animation state if we want specific
           spawnParticles(enemy.pos.x + enemy.size.x/2, enemy.pos.y + enemy.size.y/2, 5, enemy.color, 2);

           const eCx = enemy.pos.x + enemy.size.x/2;
           const eCy = enemy.pos.y + enemy.size.y/2;
           let kbDirX = eCx - pCx, kbDirY = eCy - pCy;
           const len = Math.hypot(kbDirX, kbDirY) || 1;
           kbDirX /= len; kbDirY /= len;

           // GSAP Knockback
           gsap.killTweensOf(enemy.knockback);
           enemy.knockback = { x: kbDirX * KNOCKBACK_FORCE_PLAYER_ATK, y: kbDirY * KNOCKBACK_FORCE_PLAYER_ATK };
           gsap.to(enemy.knockback, { x: 0, y: 0, duration: 0.4, ease: "power2.out" });
           
           if (enemy.hp <= 0) {
             enemy.isDead = true;
             const stats = ENEMY_STATS[enemy.enemyType || EnemyType.SKELETON];
             setScore(s => s + stats.score);
             world.shake += 2; 
             spawnParticles(enemy.pos.x + enemy.size.x/2, enemy.pos.y + enemy.size.y/2, 20, enemy.color, 4);
             audioManager.playHit(); 
             if (Math.random() < ITEM_DROP_CHANCE) spawnLoot(enemy.pos.x, enemy.pos.y);
           }
         }
      });
    }

    world.enemies = world.enemies.filter(e => !e.isDead);
    const activeEnemies = world.enemies.filter(e => Math.abs(e.pos.x - player.pos.x) < 800 && Math.abs(e.pos.y - player.pos.y) < 600);

    activeEnemies.forEach(enemy => {
      if (enemy.hitFlashTimer > 0) enemy.hitFlashTimer--;
      if (enemy.cooldown > 0) enemy.cooldown -= dt;
      if (enemy.idleTimer !== undefined && enemy.idleTimer > 0) enemy.idleTimer -= dt;
      if (enemy.summonTimer !== undefined && enemy.summonTimer > 0) enemy.summonTimer--;

      // Distinct AI Behavior Logic (omitted for brevity, assume same logic as before but updated below)
      const centerPx = player.pos.x + player.size.x/2, centerPy = player.pos.y + player.size.y/2;
      const centerEx = enemy.pos.x + enemy.size.x/2, centerEy = enemy.pos.y + enemy.size.y/2;
      const dist = Math.hypot(centerPx - centerEx, centerPy - centerEy);

      // (AI Logic ... )
      if (enemy.enemyType === EnemyType.GOBLIN && enemy.hp < enemy.maxHp * 0.4 && enemy.state !== EnemyState.ATTACK) enemy.state = EnemyState.RETREAT;
      if (enemy.enemyType === EnemyType.ORC && enemy.hp < enemy.maxHp * 0.5) { enemy.speed = 220; enemy.color = '#dc2626'; }

      if (enemy.state !== EnemyState.CHASE && enemy.state !== EnemyState.ATTACK && enemy.state !== EnemyState.RETREAT && enemy.state !== EnemyState.CASTING) {
          const hasLOS = hasLineOfSight({x: centerEx, y: centerEy}, {x: centerPx, y: centerPy}, world.map!);
          if (dist < ENEMY_DETECT_RADIUS && hasLOS) {
              enemy.state = EnemyState.CHASE;
              spawnParticles(centerEx, centerEy - 20, 3, '#ef4444', 2);
          }
      }

      let moveDir = { x: 0, y: 0 };
      let speed = enemy.speed;
      const enemyKbSpeed = Math.hypot(enemy.knockback.x, enemy.knockback.y);
      const isStunned = enemyKbSpeed > 50;

      // Handle AI States
      if (enemy.state === EnemyState.CASTING) {
          if (enemy.castingTimer !== undefined) {
              enemy.castingTimer -= dt;
              playStateAnimation(enemy, 'CASTING');
              if (Math.random() < 0.3) {
                  const angle = Math.random() * Math.PI * 2, d = 30;
                  worldRef.current.particles.push({ x: centerEx + Math.cos(angle) * d, y: centerEy + Math.sin(angle) * d, vx: -Math.cos(angle), vy: -Math.sin(angle), life: 0.5, color: '#d8b4fe', size: 2 });
              }
              if (enemy.castingTimer <= 0) {
                  spawnParticles(enemy.pos.x, enemy.pos.y, 40, '#9333ea', 4);
                  audioManager.playSummon();
                  addLogMessage(t.lichSummon);
                  for(let i=0; i<3; i++) {
                       const angle = Math.random() * Math.PI * 2;
                       const sx = enemy.pos.x + Math.cos(angle) * 40, sy = enemy.pos.y + Math.sin(angle) * 40;
                       if (!checkCollision({x: sx, y: sy}, {x:24, y:24}, world.map!)) {
                           const minion = spawnEnemy(sx, sy, EnemyType.SKELETON, floor);
                           minion.state = EnemyState.CHASE; 
                           world.enemies.push(minion);
                           spawnParticles(sx, sy, 10, '#ffffff', 1);
                       }
                   }
                   enemy.state = EnemyState.RETREAT; 
                   enemy.summonTimer = 600; 
              }
          }
      } else if (!isStunned) {
          switch (enemy.state) {
              case EnemyState.IDLE:
                  if (enemy.idleTimer !== undefined && enemy.idleTimer <= 0) {
                      if (enemy.patrolPath && enemy.patrolPath.length > 0) {
                          const idx = ((enemy.patrolIndex || 0) + 1) % enemy.patrolPath.length;
                          enemy.patrolIndex = idx; enemy.patrolTarget = enemy.patrolPath[idx]; enemy.state = EnemyState.PATROL;
                      } else {
                         const origin = enemy.spawnPos || enemy.pos;
                         if (world.map) enemy.patrolPath = getPatrolPath(origin, 250, world.map, 3);
                         enemy.idleTimer = 1.0;
                      }
                  }
                  break;
              case EnemyState.PATROL:
                  if (enemy.patrolTarget) {
                      const tx = enemy.patrolTarget.x - enemy.pos.x, ty = enemy.patrolTarget.y - enemy.pos.y;
                      if (Math.hypot(tx, ty) < 10) { enemy.state = EnemyState.IDLE; enemy.idleTimer = 2 + Math.random() * 2; } 
                      else { moveDir = { x: tx, y: ty }; speed = enemy.speed * 0.4; }
                  } else { enemy.state = EnemyState.IDLE; }
                  break;
              case EnemyState.CHASE:
                  if (enemy.enemyType === EnemyType.LICH) {
                      if (enemy.summonTimer !== undefined && enemy.summonTimer <= 0) { enemy.state = EnemyState.CASTING; enemy.castingTimer = 1.5; break; }
                      if (dist < 150) enemy.state = EnemyState.RETREAT; else if (dist > 300) moveDir = { x: centerPx - centerEx, y: centerPy - centerEy };
                  } else {
                      moveDir = { x: centerPx - centerEx, y: centerPy - centerEy };
                      const overlapX = Math.abs(centerPx - centerEx) < (player.size.x + enemy.size.x) / 2;
                      const overlapY = Math.abs(centerPy - centerEy) < (player.size.y + enemy.size.y) / 2;
                      if (overlapX && overlapY) enemy.state = EnemyState.ATTACK;
                  }
                  if (dist > ENEMY_DETECT_RADIUS * 1.5) { enemy.state = EnemyState.IDLE; enemy.idleTimer = 1.0; }
                  break;
              case EnemyState.RETREAT:
                  if (dist > 300) enemy.state = EnemyState.CHASE; else moveDir = { x: centerEx - centerPx, y: centerEy - centerPy }; 
                  break;
              case EnemyState.ATTACK:
                  if (enemy.cooldown <= 0) {
                      const hasAttackLOS = hasLineOfSight({x: centerEx, y: centerEy}, {x: centerPx, y: centerPy}, world.map!);
                      if (hasAttackLOS) {
                          const rawDmg = enemy.damage || ENEMY_ATTACK_DAMAGE;
                          const finalDmg = Math.max(1, rawDmg - player.defense);
                          playStateAnimation(enemy, 'ATTACK'); 
                          player.hp -= finalDmg; player.hitFlashTimer = 5; enemy.cooldown = ENEMY_ATTACK_COOLDOWN;
                          world.shake = 5; setPlayerHp(player.hp);
                          spawnParticles(player.pos.x + PLAYER_SIZE/2, player.pos.y + PLAYER_SIZE/2, 5, '#ef4444', 2);
                          audioManager.playPlayerDamage();
                          let kbDirX = centerPx - centerEx, kbDirY = centerPy - centerEy;
                          const len = Math.hypot(kbDirX, kbDirY) || 1;
                          kbDirX /= len; kbDirY /= len;
                          // GSAP Knockback for Player
                          gsap.killTweensOf(player.knockback);
                          player.knockback = { x: kbDirX * KNOCKBACK_FORCE_ENEMY_ATK, y: kbDirY * KNOCKBACK_FORCE_ENEMY_ATK };
                          gsap.to(player.knockback, { x: 0, y: 0, duration: 0.4, ease: "power2.out" });

                          if (player.hp <= 0) { setGameState(GameState.GAME_OVER); audioManager.playDeath(); }
                      }
                  }
                  const overlapX = Math.abs(centerPx - centerEx) < (player.size.x + enemy.size.x) / 2;
                  const overlapY = Math.abs(centerPy - centerEy) < (player.size.y + enemy.size.y) / 2;
                  if (!overlapX || !overlapY) enemy.state = EnemyState.CHASE;
                  break;
          }
      }

      if (moveDir.x !== 0 || moveDir.y !== 0) { const len = Math.hypot(moveDir.x, moveDir.y); moveDir.x /= len; moveDir.y /= len; }
      
      const moveDist = speed * dt;
      const intentVx = isStunned ? 0 : (moveDir.x * moveDist);
      const intentVy = isStunned ? 0 : (moveDir.y * moveDist);
      
      // Velocity + Knockback
      const totalExVx = intentVx + (enemy.knockback.x * dt);
      const totalExVy = intentVy + (enemy.knockback.y * dt);
      
      if (Math.abs(totalExVx) > 0.1 || Math.abs(totalExVy) > 0.1) {
          const nextExPos = { x: enemy.pos.x + totalExVx, y: enemy.pos.y };
          if (!checkCollision(nextExPos, enemy.size, world.map!)) enemy.pos.x = nextExPos.x;
          const nextEyPos = { x: enemy.pos.x, y: enemy.pos.y + totalExVy };
          if (!checkCollision(nextEyPos, enemy.size, world.map!)) enemy.pos.y = nextEyPos.y;
      }
      
      // Update Visuals (GSAP)
      updateEntityVisuals(enemy, { x: totalExVx, y: totalExVy });
    });
    
    if (player.hitFlashTimer > 0) player.hitFlashTimer--;

    for (let i = world.particles.length - 1; i >= 0; i--) {
        const p = world.particles[i];
        p.x += p.vx; p.y += p.vy; p.life -= dt * 1.5;
        if (p.life <= 0) world.particles.splice(i, 1);
    }

    const canvas = canvasRef.current;
    if (canvas) {
      const shakeX = (Math.random() - 0.5) * world.shake * 2;
      const shakeY = (Math.random() - 0.5) * world.shake * 2;
      world.camera.x = player.pos.x + player.size.x/2 - canvas.width / 2 + shakeX;
      world.camera.y = player.pos.y + player.size.y/2 - canvas.height / 2 + shakeY;
    }
  };

  const render = () => {
    const canvas = canvasRef.current;
    const world = worldRef.current;
    const sprites = spritesRef.current;
    if (!canvas || !sprites) return;
    const ctx = canvas.getContext('2d', { alpha: false }); 
    if (!ctx) return;
    renderWorld({ ctx, canvas, world, sprites, gameState, equipped });
  };

  const tick = useCallback((time: number) => {
    if (gameState === GameState.PLAYING) update(time);
    render();
    requestRef.current = requestAnimationFrame(tick);
  }, [gameState, showInventory, equipped, musicVolume, sfxVolume, language, floor]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(tick);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [tick]);

  useEffect(() => {
    const handleResize = () => {
        if (canvasRef.current) {
            canvasRef.current.width = window.innerWidth;
            canvasRef.current.height = window.innerHeight;
            const ctx = canvasRef.current.getContext('2d');
            if(ctx) ctx.imageSmoothingEnabled = false;
        }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === KEYBOARD.ESCAPE) {
        if (showInventory) setShowInventory(false);
        else if (gameState === GameState.PLAYING) setGameState(GameState.PAUSED);
        else if (gameState === GameState.PAUSED) setGameState(GameState.PLAYING);
      }
      if (gameState === GameState.PLAYING) {
          if (e.key.toLowerCase() === KEYBOARD.E || e.key.toLowerCase() === KEYBOARD.Q) usePotion();
          if (e.key === KEYBOARD.TAB) { e.preventDefault(); setShowInventory(prev => !prev); }
      } else if (showInventory && e.key === KEYBOARD.TAB) { e.preventDefault(); setShowInventory(false); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, showInventory]);

  return (
    <div className="relative w-full h-full font-pixel">
      <canvas ref={canvasRef} className="block" />
      {(gameState === GameState.PLAYING || gameState === GameState.PAUSED || showInventory) && (
        <>
            <GameHUD playerHp={playerHp} playerMaxHp={playerMaxHp} score={score} floor={floor} messageLog={messageLog} t={t} />
            <InventoryBar inventory={inventory} sprites={spritesRef.current} onUseItem={usePotion} onEquipItem={equipItem} t={t} />
            {showInventory && (
                <InventoryModal inventory={inventory} equipped={equipped} playerDamage={playerDamage} playerDefense={playerDefense}
                    sprites={spritesRef.current} onClose={() => setShowInventory(false)} onUnequip={unequipItem} onUseItem={usePotion} onEquipItem={equipItem} t={t}
                />
            )}
            {showTouchControls && (
                <TouchControls onJoystickStart={handleJoystickStart} onJoystickMove={handleJoystickMove} onJoystickEnd={handleJoystickEnd} joystickKnobRef={joystickKnobRef}
                    onAttackStart={(e) => { if(e.cancelable) e.preventDefault(); attackBtnRef.current = true; }}
                    onAttackEnd={(e) => { if(e.cancelable) e.preventDefault(); attackBtnRef.current = false; }}
                    onPotion={() => usePotion()} hasPotion={inventory.some(i => i.type === ItemType.HEALTH_POTION)}
                    onPause={() => setGameState(GameState.PAUSED)} onInventory={() => setShowInventory(!showInventory)}
                />
            )}
        </>
      )}
      {gameState === GameState.MAIN_MENU && !showSettings && !showHelp && (
        <MainMenu genMode={genMode} setGenMode={setGenMode} onStart={startGame} onContinue={loadGame} hasSave={hasSave} onSettings={() => setShowSettings(true)} onHelp={() => setShowHelp(true)} t={t} />
      )}
      {gameState === GameState.PAUSED && !showInventory && (
        <PauseMenu onResume={() => setGameState(GameState.PLAYING)} onExit={() => setGameState(GameState.MAIN_MENU)} t={t} />
      )}
      {gameState === GameState.GAME_OVER && (
        <GameOverMenu score={score} floor={floor} onReturn={() => setGameState(GameState.MAIN_MENU)} onLoadCheckpoint={loadGame} hasSave={hasSave} t={t} />
      )}
      {gameState === GameState.VICTORY && (
        <VictoryMenu score={score} onReturn={() => setGameState(GameState.MAIN_MENU)} t={t} />
      )}
      {showHelp && (
        <HelpMenu onClose={() => setShowHelp(false)} t={t} />
      )}
      {showSettings && (
        <SettingsMenu musicVolume={musicVolume} setMusicVolume={setMusicVolume} sfxVolume={sfxVolume} setSfxVolume={setSfxVolume}
            language={language} setLanguage={setLanguage} fullscreen={fullscreen}
            setFullscreen={(f) => {
                if (!document.fullscreenElement) { document.documentElement.requestFullscreen(); setFullscreen(true); } 
                else { document.exitFullscreen(); setFullscreen(false); }
            }}
            showTouchControls={showTouchControls} setShowTouchControls={setShowTouchControls} onClose={() => setShowSettings(false)} t={t}
        />
      )}
    </div>
  );
};

export default GloomdepthGame;
