
import { Vector2, GameMap, TileType } from '../types';
import { TILE_SIZE } from '../constants';

export const checkCollision = (pos: Vector2, size: Vector2, map: GameMap): boolean => {
  const points = [
    { x: pos.x, y: pos.y },
    { x: pos.x + size.x, y: pos.y },
    { x: pos.x, y: pos.y + size.y },
    { x: pos.x + size.x, y: pos.y + size.y },
  ];

  for (const p of points) {
    const tx = Math.floor(p.x / TILE_SIZE);
    const ty = Math.floor(p.y / TILE_SIZE);
    if (tx < 0 || tx >= map.width || ty < 0 || ty >= map.height || map.tiles[ty][tx] === TileType.WALL) {
      return true;
    }
  }
  return false;
};

export const hasLineOfSight = (start: Vector2, end: Vector2, map: GameMap): boolean => {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const dist = Math.hypot(dx, dy);
    
    // Normalize and set step size (checking every quarter tile is usually precise enough)
    const stepSize = TILE_SIZE / 4;
    const steps = Math.ceil(dist / stepSize);
    
    const stepX = dx / steps;
    const stepY = dy / steps;

    let curX = start.x;
    let curY = start.y;

    for (let i = 0; i < steps; i++) {
        curX += stepX;
        curY += stepY;
        
        const tx = Math.floor(curX / TILE_SIZE);
        const ty = Math.floor(curY / TILE_SIZE);

        // Boundary checks
        if (tx < 0 || tx >= map.width || ty < 0 || ty >= map.height) {
            return false;
        }

        if (map.tiles[ty][tx] === TileType.WALL) {
            return false;
        }
    }
    return true;
};

export const getPatrolPoint = (origin: Vector2, range: number, map: GameMap): Vector2 | null => {
  for(let i=0; i<5; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * range;
      const x = origin.x + Math.cos(angle) * dist;
      const y = origin.y + Math.sin(angle) * dist;
      const tx = Math.floor(x / TILE_SIZE);
      const ty = Math.floor(y / TILE_SIZE);
      if (tx > 0 && tx < map.width && ty > 0 && ty < map.height && map.tiles[ty][tx] === TileType.FLOOR) {
          return {x, y};
      }
  }
  return null;
};

export const getPatrolPath = (start: Vector2, range: number, map: GameMap, points: number = 3): Vector2[] => {
    const path: Vector2[] = [ { ...start } ];
    for(let i=0; i<points-1; i++) {
        const p = getPatrolPoint(start, range, map);
        if (p) path.push(p);
    }
    return path;
};

export const computeDijkstraMap = (target: Vector2, map: GameMap): number[][] => {
    const w = map.width;
    const h = map.height;
    // Initialize with a large number
    const dMap: number[][] = Array(h).fill(null).map(() => Array(w).fill(999999));
    
    const tx = Math.floor(target.x / TILE_SIZE);
    const ty = Math.floor(target.y / TILE_SIZE);
    
    if (tx < 0 || tx >= w || ty < 0 || ty >= h) return dMap;

    dMap[ty][tx] = 0;
    const queue: {x: number, y: number}[] = [{x: tx, y: ty}];
    
    const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]]; // Up, Down, Left, Right

    while(queue.length > 0) {
        const curr = queue.shift()!;
        const currDist = dMap[curr.y][curr.x];
        
        for (const [dx, dy] of dirs) {
            const nx = curr.x + dx;
            const ny = curr.y + dy;
            
            if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                // Check if passable (FLOOR, TRAP, STAIRS - basically not WALL)
                if (map.tiles[ny][nx] !== TileType.WALL) {
                    if (dMap[ny][nx] > currDist + 1) {
                        dMap[ny][nx] = currDist + 1;
                        queue.push({x: nx, y: ny});
                    }
                }
            }
        }
    }
    return dMap;
};

export const getFlowDirection = (origin: Vector2, dMap: number[][]): Vector2 => {
    const tx = Math.floor(origin.x / TILE_SIZE);
    const ty = Math.floor(origin.y / TILE_SIZE);
    
    // Bounds check
    if (ty < 0 || ty >= dMap.length || tx < 0 || tx >= dMap[0].length) {
        return { x: 0, y: 0 };
    }

    const currentDist = dMap[ty][tx];
    if (currentDist >= 999999) return { x: 0, y: 0 }; // No path

    let bestDist = currentDist;
    let target = { x: 0, y: 0 };
    
    // Include diagonals
    const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]]; 

    for (const [dx, dy] of dirs) {
        const nx = tx + dx;
        const ny = ty + dy;
        
        if (ny >= 0 && ny < dMap.length && nx >= 0 && nx < dMap[0].length) {
             const dist = dMap[ny][nx];
             if (dist < bestDist) {
                 bestDist = dist;
                 target = { x: dx, y: dy };
             }
        }
    }
    
    // Normalize if we found a direction
    if (target.x !== 0 || target.y !== 0) {
        const len = Math.hypot(target.x, target.y);
        return { x: target.x / len, y: target.y / len };
    }
    
    return { x: 0, y: 0 };
};
