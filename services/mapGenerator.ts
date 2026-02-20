
import { GameMap, Vector2, TileType } from '../types';
import { TILE_SIZE } from '../constants';

const createEmptyGrid = (width: number, height: number, defaultTile: TileType): number[][] => {
  return Array(height).fill(null).map(() => Array(width).fill(defaultTile));
};

const createEmptyVariants = (width: number, height: number): number[][] => {
  return Array(height).fill(null).map(() => Array(width).fill(0));
};

// Flood fill to remove disconnected regions, keeping only the largest one
const removeDisconnectedAreas = (width: number, height: number, tiles: number[][]): void => {
  const visited = Array(height).fill(false).map(() => Array(width).fill(false));
  const regions: { x: number, y: number }[][] = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (tiles[y][x] !== TileType.WALL && !visited[y][x]) {
        const region: { x: number, y: number }[] = [];
        const queue: { x: number, y: number }[] = [{ x, y }];
        visited[y][x] = true;
        region.push({ x, y });

        while (queue.length > 0) {
          const curr = queue.shift()!;
          const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
          for (const [dx, dy] of dirs) {
            const nx = curr.x + dx;
            const ny = curr.y + dy;
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              if (tiles[ny][nx] !== TileType.WALL && !visited[ny][nx]) {
                visited[ny][nx] = true;
                region.push({ x: nx, y: ny });
                queue.push({ x: nx, y: ny });
              }
            }
          }
        }
        regions.push(region);
      }
    }
  }

  if (regions.length > 0) {
    // Sort by size descending
    regions.sort((a, b) => b.length - a.length);
    // Keep largest (index 0), fill others with WALL
    for (let i = 1; i < regions.length; i++) {
      for (const p of regions[i]) {
        tiles[p.y][p.x] = TileType.WALL;
      }
    }
  }
};

const assignVariants = (width: number, height: number, tiles: number[][]): number[][] => {
    const variants = createEmptyVariants(width, height);
    for(let y=0; y<height; y++) {
        for(let x=0; x<width; x++) {
            if (tiles[y][x] === TileType.WALL) {
                // 70% normal (0), 15% cracked (1), 15% mossy (2)
                const rand = Math.random();
                if (rand < 0.7) variants[y][x] = 0;
                else if (rand < 0.85) variants[y][x] = 1;
                else variants[y][x] = 2;
            } else {
                // Floor Variants: 0:Normal, 1:Cracked, 2-5:Mossy, 6-9:Vine
                const rand = Math.random();
                if (rand < 0.85) variants[y][x] = 0; 
                else if (rand < 0.90) variants[y][x] = 1;
                else if (rand < 0.95) variants[y][x] = Math.floor(Math.random() * 4) + 2;
                else variants[y][x] = Math.floor(Math.random() * 4) + 6;
            }
        }
    }
    return variants;
};

// Calculate furthest point for stairs
const placeExit = (width: number, height: number, tiles: number[][], spawnX: number, spawnY: number): Vector2 => {
    let maxDist = 0;
    let exitX = spawnX;
    let exitY = spawnY;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (tiles[y][x] === TileType.FLOOR) {
                const d = Math.hypot(x - spawnX, y - spawnY);
                if (d > maxDist) {
                    maxDist = d;
                    exitX = x;
                    exitY = y;
                }
            }
        }
    }
    tiles[exitY][exitX] = TileType.STAIRS;
    return { x: exitX * TILE_SIZE, y: exitY * TILE_SIZE };
};

// Helper for Drunkard Cavern Mode
const fillCircle = (tiles: number[][], cx: number, cy: number, r: number, width: number, height: number): number => {
    let added = 0;
    for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
        for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
            if (x >= 2 && x < width - 2 && y >= 2 && y < height - 2) {
                if ((x - cx) ** 2 + (y - cy) ** 2 <= r ** 2) {
                    if (tiles[y][x] === TileType.WALL) {
                        tiles[y][x] = TileType.FLOOR;
                        added++;
                    }
                }
            }
        }
    }
    return added;
}

export const generateDrunkardMap = (width: number, height: number): GameMap => {
  const tiles = createEmptyGrid(width, height, TileType.WALL);
  const totalTiles = width * height;
  const targetFloorCount = Math.floor(totalTiles * 0.45); 

  let floorCount = 0;
  let cx = Math.floor(width / 2);
  let cy = Math.floor(height / 2);
  
  // Start with a small clearing
  floorCount += fillCircle(tiles, cx, cy, 2, width, height);

  // Drunkard State
  let mode: 'tunnel' | 'cavern' = 'cavern';
  let life = 100;
  let dir = Math.floor(Math.random() * 4); // 0:N, 1:E, 2:S, 3:W

  while (floorCount < targetFloorCount) {
    
    // Switch modes occasionally
    if (Math.random() < 0.05) {
        mode = mode === 'tunnel' ? 'cavern' : 'tunnel';
        life = mode === 'tunnel' ? 40 : 15; // Tunnels last longer
    }

    // Movement Logic
    if (mode === 'tunnel') {
        // High directional inertia
        if (Math.random() < 0.2) {
            dir = Math.floor(Math.random() * 4);
        }
    } else {
        // Caverns meander randomly
        dir = Math.floor(Math.random() * 4);
    }

    if (dir === 0) cy--;
    else if (dir === 1) cx++;
    else if (dir === 2) cy++;
    else if (dir === 3) cx--;

    // Clamp with padding
    cx = Math.max(3, Math.min(width - 4, cx));
    cy = Math.max(3, Math.min(height - 4, cy));

    // Carve
    if (mode === 'tunnel') {
        if (tiles[cy][cx] === TileType.WALL) {
            tiles[cy][cx] = TileType.FLOOR;
            floorCount++;
        }
        // Occasional width variation for tunnels
        if (Math.random() < 0.2) {
             const nx = cx + (Math.random() > 0.5 ? 1 : -1);
             const ny = cy + (Math.random() > 0.5 ? 1 : -1);
             if (nx > 2 && nx < width-3 && ny > 2 && ny < height-3 && tiles[ny][nx] === TileType.WALL) {
                 tiles[ny][nx] = TileType.FLOOR;
                 floorCount++;
             }
        }
    } else {
        // Cavern: Carve circle
        const radius = 1.5 + Math.random() * 1.5;
        floorCount += fillCircle(tiles, cx, cy, radius, width, height);
    }

    life--;
    if (life <= 0) {
      // Find a new valid start point to prevent getting stuck in a corner or filled area
      let valid = false;
      let attempts = 0;
      while (!valid && attempts < 50) {
        const rx = Math.floor(Math.random() * (width - 6)) + 3;
        const ry = Math.floor(Math.random() * (height - 6)) + 3;
        if (tiles[ry][rx] === TileType.FLOOR) {
          cx = rx;
          cy = ry;
          valid = true;
          // Reset state on jump
          mode = Math.random() > 0.5 ? 'tunnel' : 'cavern';
          life = 30;
        }
        attempts++;
      }
      if (!valid) life = 20; // Just continue if jump failed
    }
  }

  // Cellular Automata Smoothing (Pass 1)
  const nextTiles = tiles.map(row => [...row]);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
       let neighbors = 0;
       for (let dy = -1; dy <= 1; dy++) {
           for (let dx = -1; dx <= 1; dx++) {
               if (dy === 0 && dx === 0) continue;
               if (tiles[y+dy][x+dx] === TileType.WALL) neighbors++;
           }
       }
       if (neighbors >= 5) nextTiles[y][x] = TileType.WALL;
       else if (neighbors <= 3) nextTiles[y][x] = TileType.FLOOR;
    }
  }
  
  for(let y=0; y<height; y++) {
      for(let x=0; x<width; x++) {
          tiles[y][x] = nextTiles[y][x];
      }
  }

  removeDisconnectedAreas(width, height, tiles);

  // Add Traps
  for(let i=0; i<30; i++) {
     const tx = Math.floor(Math.random() * (width - 4)) + 2;
     const ty = Math.floor(Math.random() * (height - 4)) + 2;
     
     if (tiles[ty][tx] === TileType.FLOOR) {
         const clusterSize = Math.floor(Math.random() * 5) + 2;
         for(let j=0; j<clusterSize; j++) {
             const ox = Math.floor(Math.random() * 3) - 1;
             const oy = Math.floor(Math.random() * 3) - 1;
             if (tiles[ty+oy] && tiles[ty+oy][tx+ox] === TileType.FLOOR) {
                 tiles[ty+oy][tx+ox] = TileType.TRAP;
             }
         }
     }
  }

  // Find a valid spawn point closest to center
  let spawnX = Math.floor(width/2);
  let spawnY = Math.floor(height/2);
  let minDist = Infinity;
  
  for(let y=0; y<height; y++) {
      for(let x=0; x<width; x++) {
          if (tiles[y][x] === TileType.FLOOR) {
              const d = Math.hypot(x - width/2, y - height/2);
              if (d < minDist) {
                  minDist = d;
                  spawnX = x;
                  spawnY = y;
              }
          }
      }
  }
  
  const exitPoint = placeExit(width, height, tiles, spawnX, spawnY);
  const variants = assignVariants(width, height, tiles);

  return {
    width,
    height,
    tiles,
    variants,
    spawnPoint: { x: spawnX * TILE_SIZE, y: spawnY * TILE_SIZE },
    exitPoint
  };
};

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface RoomNode {
    rect: Rect;
    left?: RoomNode;
    right?: RoomNode;
    room?: Rect & { shape: 'rect' | 'cross' | 'diamond' | 'L' | 'T', type: 'normal' | 'treasure' | 'boss' };
}

export const generateBSPMap = (width: number, height: number): GameMap => {
  const tiles = createEmptyGrid(width, height, TileType.WALL);
  const minSize = 8;
  const padding = 2;

  const split = (rect: Rect, iter: number): RoomNode => {
    const node: RoomNode = { rect };

    if (iter === 0 || (rect.w <= minSize * 2.5 && rect.h <= minSize * 2.5)) {
      return node;
    }

    const splitH = Math.random() > 0.5;
    
    if (splitH) {
        if (rect.w < minSize * 2.5) return node;
        const splitAt = minSize + Math.floor(Math.random() * (rect.w - minSize * 2));
        node.left = split({x: rect.x, y: rect.y, w: splitAt, h: rect.h}, iter - 1);
        node.right = split({x: rect.x + splitAt, y: rect.y, w: rect.w - splitAt, h: rect.h}, iter - 1);
    } else {
        if (rect.h < minSize * 2.5) return node;
        const splitAt = minSize + Math.floor(Math.random() * (rect.h - minSize * 2));
        node.left = split({x: rect.x, y: rect.y, w: rect.w, h: splitAt}, iter - 1);
        node.right = split({x: rect.x, y: rect.y + splitAt, w: rect.w, h: rect.h - splitAt}, iter - 1);
    }
    return node;
  };

  const root = split({x: 1, y: 1, w: width - 2, h: height - 2}, 5);

  const rooms: (Rect & { shape: 'rect' | 'cross' | 'diamond' | 'L' | 'T', type: 'normal' | 'treasure' | 'boss' })[] = [];

  const collectLeaves = (node: RoomNode) => {
      if (!node.left && !node.right) {
          const w = Math.floor(Math.random() * (node.rect.w - padding * 2 - 4)) + 4;
          const h = Math.floor(Math.random() * (node.rect.h - padding * 2 - 4)) + 4;
          const x = node.rect.x + padding + Math.floor(Math.random() * (node.rect.w - w - padding*2));
          const y = node.rect.y + padding + Math.floor(Math.random() * (node.rect.h - h - padding*2));
          
          const randShape = Math.random();
          let shape: 'rect' | 'cross' | 'diamond' | 'L' | 'T' = 'rect';
          
          if (w > 6 && h > 6) {
              if (randShape > 0.85) shape = 'cross';
              else if (randShape > 0.75) shape = 'diamond';
              else if (randShape > 0.55) shape = 'L';
              else if (randShape > 0.35) shape = 'T';
          }

          let type: 'normal' | 'treasure' | 'boss' = 'normal';
          if (Math.random() > 0.85) type = 'treasure';

          node.room = { x, y, w, h, shape, type };
          rooms.push(node.room);
      } else {
          if (node.left) collectLeaves(node.left);
          if (node.right) collectLeaves(node.right);
      }
  };
  collectLeaves(root);

  // Rasterize rooms with new shapes
  rooms.forEach(r => {
      const cx = Math.floor(r.x + r.w / 2);
      const cy = Math.floor(r.y + r.h / 2);

      const fillRect = (rx: number, ry: number, rw: number, rh: number) => {
          for (let y = Math.floor(ry); y < Math.floor(ry + rh); y++) {
              for (let x = Math.floor(rx); x < Math.floor(rx + rw); x++) {
                  if(x > 0 && x < width-1 && y > 0 && y < height-1) tiles[y][x] = TileType.FLOOR;
              }
          }
      };

      if (r.shape === 'rect') {
          fillRect(r.x, r.y, r.w, r.h);
      } else if (r.shape === 'cross') {
          fillRect(r.x, r.y + r.h/3, r.w, r.h/3);
          fillRect(r.x + r.w/3, r.y, r.w/3, r.h);
      } else if (r.shape === 'diamond') {
          const radius = Math.min(r.w, r.h) / 2;
          for (let y = r.y; y < r.y + r.h; y++) {
              for (let x = r.x; x < r.x + r.w; x++) {
                  const dist = Math.abs(x - cx) + Math.abs(y - cy);
                  if (dist < radius) tiles[y][x] = TileType.FLOOR;
              }
          }
      } else if (r.shape === 'L') {
          // Vertical left + Horizontal bottom
          fillRect(r.x, r.y, r.w/3, r.h);
          fillRect(r.x, r.y + r.h * 0.6, r.w, r.h * 0.4);
      } else if (r.shape === 'T') {
          // Top bar + Middle Stem
          fillRect(r.x, r.y, r.w, r.h/3);
          fillRect(r.x + r.w/3, r.y, r.w/3, r.h);
      }
      
      if (r.type === 'treasure') {
         // Place traps around center if possible
         if (tiles[cy][cx] === TileType.FLOOR) {
             for(let dy=-2; dy<=2; dy++) {
                 for(let dx=-2; dx<=2; dx++) {
                     const dist = Math.max(Math.abs(dx), Math.abs(dy));
                     if (dist === 2 && tiles[cy+dy] && tiles[cy+dy][cx+dx] === TileType.FLOOR) {
                         tiles[cy+dy][cx+dx] = TileType.TRAP;
                     }
                 }
             }
         }
      }
  });

  const getRandomRoomFromSubtree = (node: RoomNode): Rect => {
     if (node.room) return node.room;
     const candidates: RoomNode[] = [];
     const stack = [node];
     
     while (stack.length > 0) {
         const n = stack.pop()!;
         if (n.room) {
             candidates.push(n);
         } else {
             if (n.left) stack.push(n.left);
             if (n.right) stack.push(n.right);
         }
     }
     
     if (candidates.length === 0) return node.rect; 
     const selected = candidates[Math.floor(Math.random() * candidates.length)];
     return selected.room!;
  };

  const getRoomCenter = (room: Rect): Vector2 => {
      return { 
          x: Math.floor(room.x + room.w / 2),
          y: Math.floor(room.y + room.h / 2)
      };
  };

  const ensureFloor = (x: number, y: number, tiles: number[][]) => {
      if (x > 0 && x < width-1 && y > 0 && y < height-1) {
          if (tiles[y][x] === TileType.WALL) {
              tiles[y][x] = TileType.FLOOR;
              if (Math.random() < 0.05) tiles[y][x] = TileType.TRAP;
          }
      }
  };

  const connect = (node: RoomNode) => {
      if (node.left && node.right) {
          const roomL = getRandomRoomFromSubtree(node.left);
          const roomR = getRandomRoomFromSubtree(node.right);
          
          const p1 = getRoomCenter(roomL);
          const p2 = getRoomCenter(roomR);
          
          const minX = Math.min(p1.x, p2.x);
          const maxX = Math.max(p1.x, p2.x);
          const minY = Math.min(p1.y, p2.y);
          const maxY = Math.max(p1.y, p2.y);

          if (Math.random() > 0.5) {
              for (let x = minX; x <= maxX; x++) ensureFloor(x, p1.y, tiles);
              for (let y = minY; y <= maxY; y++) ensureFloor(p2.x, y, tiles);
          } else {
              for (let y = minY; y <= maxY; y++) ensureFloor(p1.x, y, tiles);
              for (let x = minX; x <= maxX; x++) ensureFloor(x, p2.y, tiles);
          }

          connect(node.left);
          connect(node.right);
      }
  };

  connect(root);

  // Generate Dead Ends / Secret Branches
  const deadEndCount = 5;
  for(let i=0; i<deadEndCount; i++) {
      let attempts = 0;
      let placed = false;
      while(!placed && attempts < 50) {
          attempts++;
          const sx = Math.floor(Math.random() * (width - 4)) + 2;
          const sy = Math.floor(Math.random() * (height - 4)) + 2;
          
          // Must start on WALL, adjacent to exactly one FLOOR (to branch off)
          if (tiles[sy][sx] === TileType.WALL) {
              const neighbors = [
                  tiles[sy-1][sx] === TileType.FLOOR,
                  tiles[sy+1][sx] === TileType.FLOOR,
                  tiles[sy][sx-1] === TileType.FLOOR,
                  tiles[sy][sx+1] === TileType.FLOOR
              ];
              const floorCount = neighbors.filter(Boolean).length;
              
              if (floorCount === 1) {
                  // Valid start. Dig in opposite direction of floor
                  let dx = 0, dy = 0;
                  if (tiles[sy-1][sx] === TileType.FLOOR) dy = 1;
                  else if (tiles[sy+1][sx] === TileType.FLOOR) dy = -1;
                  else if (tiles[sy][sx-1] === TileType.FLOOR) dx = 1;
                  else if (tiles[sy][sx+1] === TileType.FLOOR) dx = -1;

                  const len = 3 + Math.floor(Math.random() * 4); // 3 to 6 tiles
                  let cx = sx, cy = sy;
                  let validTunnel = true;
                  const path: {x:number, y:number}[] = [];

                  for(let k=0; k<len; k++) {
                      cx += dx;
                      cy += dy;
                      if (cx < 1 || cx >= width-1 || cy < 1 || cy >= height-1) {
                          validTunnel = false; 
                          break; 
                      }
                      if (tiles[cy][cx] !== TileType.WALL) {
                          validTunnel = false; 
                          break;
                      }
                      path.push({x: cx, y: cy});
                  }

                  if (validTunnel && path.length > 0) {
                      tiles[sy][sx] = TileType.FLOOR; // Entrance
                      path.forEach(p => tiles[p.y][p.x] = TileType.FLOOR);
                      const end = path[path.length-1];
                      for(let rY = end.y - 1; rY <= end.y + 1; rY++) {
                          for(let rX = end.x - 1; rX <= end.x + 1; rX++) {
                              if (rX > 0 && rX < width-1 && rY > 0 && rY < height-1) {
                                  tiles[rY][rX] = TileType.FLOOR;
                              }
                          }
                      }
                      rooms.push({ x: end.x - 1, y: end.y - 1, w: 3, h: 3, shape: 'rect', type: 'treasure' });
                      placed = true;
                  }
              }
          }
      }
  }

  const spawnRoom = rooms.find(r => r.type === 'normal') || rooms[0];
  const sx = Math.floor(spawnRoom.x + spawnRoom.w/2);
  const sy = Math.floor(spawnRoom.y + spawnRoom.h/2);

  const exitPoint = placeExit(width, height, tiles, sx, sy);
  const variants = assignVariants(width, height, tiles);

  return {
    width,
    height,
    tiles,
    variants,
    spawnPoint: { x: sx * TILE_SIZE, y: sy * TILE_SIZE },
    exitPoint,
    rooms
  };
};
