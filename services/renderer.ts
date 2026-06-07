
import { GameState, GameMap, Entity, TileType, Item, Chest, Particle, ItemType, EnemyType, EnemyState, Vector2 } from '../types';
import { TILE_SIZE, CHEST_SIZE, PLAYER_SIZE, ITEM_SIZE } from '../constants';
import { SpriteSheet, EntitySprites } from './spriteGenerator';

interface RenderWorldParams {
    ctx: CanvasRenderingContext2D;
    canvas: HTMLCanvasElement;
    world: {
        map: GameMap | null;
        player: Entity | null;
        enemies: Entity[];
        items: Item[];
        chests: Chest[];
        particles: Particle[];
        trail: Vector2[];
        camera: Vector2;
        shake: number;
        attackAnim: number;
        attackDir: Vector2;
        speedBoostTimer: number;
        menuScroll: number;
        transitionAlpha: number;
    };
    sprites: SpriteSheet;
    gameState: GameState;
    equipped: { weapon: Item | null; armor: Item | null };
}

export const renderWorld = ({ ctx, canvas, world, sprites, gameState, equipped }: RenderWorldParams) => {
    
    // --- MAIN MENU RENDER ---
    if (gameState === GameState.MAIN_MENU) {
        ctx.fillStyle = '#0c0a09'; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        world.menuScroll += 0.5;
        ctx.save();
        ctx.fillStyle = '#292524'; 
        
        const gridSize = 40;
        const timeOffset = world.menuScroll;
        
        ctx.globalAlpha = 0.4;
        for (let y = 0; y < canvas.height + gridSize; y+= gridSize) {
            for (let x = 0; x < canvas.width + gridSize; x+= gridSize) {
                const drawX = (x + timeOffset * 0.5) % (canvas.width + gridSize) - gridSize;
                const drawY = (y + timeOffset * 0.5) % (canvas.height + gridSize) - gridSize;
                
                if ((Math.floor(x/gridSize) + Math.floor(y/gridSize)) % 2 === 0) {
                    ctx.fillRect(drawX, drawY, gridSize-2, gridSize-2);
                }
            }
        }
        ctx.restore();

        const gradient = ctx.createRadialGradient(
            canvas.width / 2, canvas.height / 2, 100,
            canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) * 0.8
        );
        gradient.addColorStop(0, 'rgba(0,0,0,0.2)');
        gradient.addColorStop(1, 'rgba(12, 10, 9, 0.95)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0,0, canvas.width, canvas.height);
        
        return; 
    }

    if (!world.map) return;

    // --- GAME WORLD RENDER ---
    ctx.fillStyle = '#000000'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.save();
    ctx.translate(-Math.floor(world.camera.x), -Math.floor(world.camera.y));

    // Draw Map
    const startCol = Math.floor(world.camera.x / TILE_SIZE) - 1;
    const endCol = startCol + (canvas.width / TILE_SIZE) + 2;
    const startRow = Math.floor(world.camera.y / TILE_SIZE) - 1;
    const endRow = startRow + (canvas.height / TILE_SIZE) + 2;

    for (let y = startRow; y <= endRow; y++) {
      for (let x = startCol; x <= endCol; x++) {
        if (y >= 0 && y < world.map.height && x >= 0 && x < world.map.width) {
          const tile = world.map.tiles[y][x];
          const variant = world.map.variants[y][x];
          const dx = x * TILE_SIZE;
          const dy = y * TILE_SIZE;
          
          if (tile === TileType.WALL) {
             const wallSprite = sprites.wall[variant % sprites.wall.length];
             ctx.drawImage(wallSprite, dx, dy, TILE_SIZE, TILE_SIZE);
          } else if (tile === TileType.FLOOR) {
             const floorSprite = sprites.floor[variant % sprites.floor.length];
             ctx.drawImage(floorSprite, dx, dy, TILE_SIZE, TILE_SIZE);
          } else if (tile === TileType.TRAP) {
             ctx.drawImage(sprites.trap, dx, dy, TILE_SIZE, TILE_SIZE);
          } else if (tile === TileType.STAIRS) {
             ctx.drawImage(sprites.stairs, dx, dy, TILE_SIZE, TILE_SIZE);
          }
        }
      }
    }

    const drawShadow = (x: number, y: number, w: number) => {
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath();
        ctx.ellipse(Math.floor(x + w/2), Math.floor(y + w), w/2, 4, 0, 0, Math.PI * 2);
        ctx.fill();
    };

    // Draw Chests
    world.chests.forEach(chest => {
        if (chest.pos.x < world.camera.x - 50 || chest.pos.x > world.camera.x + canvas.width + 50) return;
        if (chest.pos.y < world.camera.y - 50 || chest.pos.y > world.camera.y + canvas.height + 50) return;

        // Ensure opacity is a valid number; default to 1.0 if not.
        const opacity = (typeof chest.opacity === 'number') ? chest.opacity : 1.0;

        ctx.save();
        ctx.globalAlpha = opacity;
        
        drawShadow(chest.pos.x, chest.pos.y, CHEST_SIZE);
        ctx.drawImage(chest.isOpened ? sprites.chestOpen : sprites.chestClosed, Math.floor(chest.pos.x), Math.floor(chest.pos.y), CHEST_SIZE, CHEST_SIZE);
        
        ctx.restore();

        // Draw Locked Feedback (Red Cross)
        if (chest.lockFeedbackAlpha > 0) {
            ctx.save();
            ctx.globalAlpha = chest.lockFeedbackAlpha * opacity;
            ctx.strokeStyle = '#dc2626';
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            const cx = Math.floor(chest.pos.x + CHEST_SIZE / 2);
            const cy = Math.floor(chest.pos.y - 10);
            const size = 8;
            
            // Draw X
            ctx.beginPath();
            ctx.moveTo(cx - size, cy - size);
            ctx.lineTo(cx + size, cy + size);
            ctx.moveTo(cx + size, cy - size);
            ctx.lineTo(cx - size, cy + size);
            ctx.stroke();

            // White highlight for better visibility
            ctx.strokeStyle = '#fca5a5';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(cx - size, cy - size);
            ctx.lineTo(cx + size, cy + size);
            ctx.moveTo(cx + size, cy - size);
            ctx.lineTo(cx - size, cy + size);
            ctx.stroke();

            ctx.restore();
        }

        if (!chest.isOpened) {
            const locked = chest.enemyIds.some(id => world.enemies.find(e => e.id === id && !e.isDead));
            if (locked) {
                const cx = chest.pos.x + CHEST_SIZE/2;
                const cy = chest.pos.y + CHEST_SIZE/2;
                const dist = Math.hypot(
                    (world.player!.pos.x + PLAYER_SIZE/2) - cx,
                    (world.player!.pos.y + PLAYER_SIZE/2) - cy
                );
                
                // Small permanent indicator for locked status if very close
                if (dist < 100) {
                    ctx.save();
                    ctx.strokeStyle = '#ef4444';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(cx, cy - 30, 6, 0, Math.PI*2);
                    ctx.stroke();
                    ctx.fillStyle = '#ef4444';
                    ctx.fillRect(cx - 4, cy - 28, 8, 8);
                    ctx.restore();
                }
            }
        }
    });

    // Draw Items
    world.items.forEach(item => {
        if (item.pos.x < world.camera.x - 50 || item.pos.x > world.camera.x + canvas.width + 50) return;
        if (item.pos.y < world.camera.y - 50 || item.pos.y > world.camera.y + canvas.height + 50) return;

        let sprite = sprites.potion;
        if (item.type === ItemType.WEAPON_BASIC) sprite = sprites.weapon;
        if (item.type === ItemType.ARMOR_BASIC) sprite = sprites.armor;
        if (item.type === ItemType.POWERUP_SPEED) sprite = sprites.scroll;
        const bob = Math.sin(performance.now() / 200) * 2;
        drawShadow(item.pos.x, item.pos.y, ITEM_SIZE);
        ctx.drawImage(sprite, Math.floor(item.pos.x), Math.floor(item.pos.y + bob), ITEM_SIZE, ITEM_SIZE);
    });

    // Draw Trail
    if (world.trail.length > 0 && world.player) {
        ctx.save();
        ctx.globalAlpha = 0.3;
        world.trail.forEach((pos, i) => {
            ctx.globalAlpha = 0.1 + (i / world.trail.length) * 0.2;
            
            // Draw player ghost for trail (using frame 0 of Move)
            ctx.drawImage(
                sprites.player.MOVE[0], 
                Math.floor(pos.x), 
                Math.floor(pos.y), 
                world.player!.size.x, 
                world.player!.size.y
            );
        });
        ctx.restore();
    }

    const drawEntity = (e: Entity, spriteSet: EntitySprites) => {
        const cx = e.pos.x + e.size.x / 2;
        const cy = e.pos.y + e.size.y / 2;

        drawShadow(e.pos.x, e.pos.y, e.size.x);

        ctx.save();
        
        // GSAP-driven Bobbing
        const bobY = e.anim.bobY || 0;

        ctx.translate(cx, cy);
        ctx.scale(e.anim.direction, 1);
        ctx.translate(-cx, -cy - bobY); // Apply bobbing vertically

        if (e.hitFlashTimer > 0) {
            ctx.globalCompositeOperation = 'source-over'; 
            ctx.filter = 'brightness(500%)'; 
        } else if (e.state === EnemyState.CASTING) {
            ctx.shadowColor = '#d8b4fe';
            ctx.shadowBlur = 10;
        }

        const currentState = e.anim.state;
        const currentFrames = spriteSet[currentState] || spriteSet.IDLE;
        // GSAP updates anim.frame as a number (potentially float), we floor it safely
        const frameIndex = Math.floor(e.anim.frame) % currentFrames.length;
        const sprite = currentFrames[frameIndex];
        
        if (sprite) {
            ctx.drawImage(sprite, Math.floor(e.pos.x), Math.floor(e.pos.y), e.size.x, e.size.y);
        }

        ctx.filter = 'none';
        ctx.shadowBlur = 0;
        ctx.restore();
    };

    // Draw Enemies
    world.enemies.forEach(e => {
      if (e.pos.x < world.camera.x - 50 || e.pos.x > world.camera.x + canvas.width + 50) return;
      if (e.pos.y < world.camera.y - 50 || e.pos.y > world.camera.y + canvas.height + 50) return;

      let spriteSet = sprites.skeleton;
      if (e.enemyType === EnemyType.GOBLIN) spriteSet = sprites.goblin;
      if (e.enemyType === EnemyType.ORC) spriteSet = sprites.orc;
      if (e.enemyType === EnemyType.LICH) spriteSet = sprites.lich;

      drawEntity(e, spriteSet);
      
      if (e.hp < e.maxHp) {
          const hpPercent = e.hp / e.maxHp;
          ctx.fillStyle = '#292524';
          ctx.fillRect(Math.floor(e.pos.x), Math.floor(e.pos.y - 8), e.size.x, 4);
          ctx.fillStyle = e.color;
          ctx.fillRect(Math.floor(e.pos.x + 1), Math.floor(e.pos.y - 7), (e.size.x - 2) * hpPercent, 2);
      }
    });

    // Draw Player
    if (world.player) {
      const p = world.player;
      
      if (world.speedBoostTimer > 0) {
          ctx.save();
          ctx.shadowColor = '#00ffff';
          ctx.shadowBlur = 15;
          drawEntity(p, sprites.player);
          ctx.restore();
      } else {
          drawEntity(p, sprites.player);
      }

      // Attack visual effect
      if (world.attackAnim > 0) {
        const cx = Math.floor(p.pos.x + p.size.x / 2);
        const cy = Math.floor(p.pos.y + p.size.y / 2);
        
        const maxAnim = 10;
        const progress = 1 - (world.attackAnim / maxAnim); 
        const baseAngle = Math.atan2(world.attackDir.y, world.attackDir.x);
        
        const startSwing = -Math.PI / 2.5;
        const endSwing = Math.PI / 2.5;
        const currentRot = baseAngle + startSwing + (endSwing - startSwing) * progress;

        ctx.save();
        ctx.translate(cx, cy);
        
        const alpha = Math.max(0, world.attackAnim / maxAnim);
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.5})`;
        ctx.lineWidth = 24; 
        ctx.lineCap = 'round';
        ctx.beginPath();
        const trailLen = Math.PI / 4;
        ctx.arc(0, 0, 24, currentRot - trailLen, currentRot);
        ctx.stroke();
        
        ctx.rotate(currentRot);
        ctx.translate(14, 0); 
        ctx.rotate(Math.PI / 2); 
        
        const weaponSprite = equipped.weapon ? sprites.weapon : sprites.weapon; 
        
        ctx.drawImage(weaponSprite, -16, -24, 32, 32);
        
        ctx.restore();
      }
    }

    // Draw Particles
    world.particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.fillRect(Math.floor(p.x), Math.floor(p.y), p.size, p.size);
    });
    ctx.globalAlpha = 1.0;
    
    ctx.restore();

    // Vignette
    const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 120,
        canvas.width / 2, canvas.height / 2, 450
    );
    gradient.addColorStop(0, 'transparent');
    gradient.addColorStop(0.8, 'rgba(12, 10, 9, 0.6)');
    gradient.addColorStop(1, 'rgba(12, 10, 9, 0.95)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0,0, canvas.width, canvas.height);

    // Fade Overlay (Transition)
    if (world.transitionAlpha > 0) {
        ctx.fillStyle = '#000000';
        ctx.globalAlpha = world.transitionAlpha;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1.0;
    }
};
