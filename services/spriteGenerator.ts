
import { TILE_SIZE, COLORS } from '../constants';
import { BiomeTheme } from '../types';

const drawPixelArt = (
  ctx: CanvasRenderingContext2D, 
  pixels: string[], 
  palette: Record<string, string>, 
  pixelSize: number,
  offsetY: number = 0
) => {
  pixels.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const char = row[x];
      if (char !== ' ' && palette[char]) {
        ctx.fillStyle = palette[char];
        ctx.fillRect(x * pixelSize, (y + offsetY) * pixelSize, pixelSize, pixelSize);
      }
    }
  });
};

const composeSprite = (
  width: number, 
  height: number, 
  bodyPixels: string[], 
  legsPixels: string[], 
  palette: Record<string, string>
): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.imageSmoothingEnabled = false;
    const pixelSize = 1;
    drawPixelArt(ctx, bodyPixels, palette, pixelSize, 0);
    // Legs typically start around row 24 for a 32x32 sprite in this system
    drawPixelArt(ctx, legsPixels, palette, pixelSize, 24);
  }
  return canvas;
};

const createPattern = (width: number, height: number, drawFn: (ctx: CanvasRenderingContext2D) => void): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
        ctx.imageSmoothingEnabled = false;
        drawFn(ctx);
    }
    return canvas;
};

// --- ANIMATION FRAMES (LEGS) ---
const LEGS_IDLE = [
  "       LLLLLLLL         ",
  "       LL    LL         ",
  "       LL    LL         ",
  "       LL    LL         ",
  "       LL    LL         ",
  "      LLL    LLL        ",
  "      LLL    LLL        ",
  "                        "
];

const LEGS_RUN_1 = [
  "       LLLLLLLL         ",
  "      LL      LL        ",
  "     LLL      LL        ",
  "     LLL      LL        ",
  "    LLL       LL        ",
  "    LLL      LLL        ",
  "   LLL       LLL        ",
  "                        "
];

const LEGS_RUN_2 = [
  "       LLLLLLLL         ",
  "       LL    LL         ",
  "       LL    LL         ",
  "       LL    LL         ",
  "       LL    LL         ",
  "      LLL    LLL        ",
  "      LLL    LLL        ",
  "                        "
];

const LEGS_RUN_3 = [
  "       LLLLLLLL         ",
  "      LL      LL        ",
  "      LL      LLL       ",
  "      LL      LLL       ",
  "      LL       LLL      ",
  "     LLL       LLL      ",
  "     LLL      LLL       ",
  "                        "
];

const WALK_CYCLE = [LEGS_IDLE, LEGS_RUN_1, LEGS_RUN_2, LEGS_RUN_3];
const ATTACK_CYCLE = [LEGS_RUN_3, LEGS_RUN_1]; 

// Interface for structured sprites
export interface EntitySprites {
    IDLE: HTMLCanvasElement[];
    MOVE: HTMLCanvasElement[];
    ATTACK: HTMLCanvasElement[];
    CASTING: HTMLCanvasElement[];
    HIT: HTMLCanvasElement[];
    DEATH: HTMLCanvasElement[];
}

export interface SpriteSheet {
  player: EntitySprites; 
  skeleton: EntitySprites;
  goblin: EntitySprites;
  orc: EntitySprites;
  lich: EntitySprites;
  wall: HTMLCanvasElement[]; 
  floor: HTMLCanvasElement[]; 
  trap: HTMLCanvasElement;
  stairs: HTMLCanvasElement;
  potion: HTMLCanvasElement;
  weapon: HTMLCanvasElement;
  armor: HTMLCanvasElement;
  scroll: HTMLCanvasElement;
  chestClosed: HTMLCanvasElement;
  chestOpen: HTMLCanvasElement;
}

export const generateSprites = (theme: BiomeTheme): SpriteSheet => {
  
  // --- PLAYER ---
  const playerPalette = {
    'H': '#cbd5e1', 'M': '#64748b', 'S': '#fcd34d', 'C': '#2563eb', 
    'D': '#1e3a8a', 'B': '#78350f', 'L': '#451a03', 'G': '#eab308', 'R': '#991b1b'
  };

  const playerBody = [
    "             RRR                ",
    "            RRRRR               ",
    "           RRRRRRR              ",
    "           RRRRRRR              ",
    "           MHHHHHM              ",
    "          MHHHHHHHM             ",
    "          MHH   HHM             ",
    "          MH S S HM             ",
    "          MH S S HM             ",
    "          MHHHHHHHM             ",
    "          MMHHHHHMM             ",
    "         MMMDDDDDMMM            ",
    "        MMMDDCCCDDMMM           ",
    "       MMMDDCCCCCDDMMM          ",
    "       BBDDCCCCCCCDDBB          ",
    "       BBDCCCCCCCCCDBB          ",
    "       BBDDCCCCCCCDDBB          ",
    "       BBDDCCCCCCCDDBB          ",
    "        DDDDGBGDDDD             ",
    "        DDDGBBBGDDD             ",
    "        D DGBBBGD D             ",
    "        D DGBBBGD D             ",
    "        D D C C D D             ",
    "        D D C C D D             " 
  ];

  // Player Attack Frames (Swing)
  const playerBodyAttack1 = [
    "             RRR                ",
    "            RRRRR               ",
    "           RRRRRRR              ",
    "           RRRRRRR              ",
    "           MHHHHHM              ",
    "          MHHHHHHHM             ",
    "          MHH   HHM             ",
    "         MHH S S HM             ",
    "        MHH S S HM              ",
    "        MHHHHHHHM GGG           ",
    "        MMHHHHHMM GGG           ",
    "       MMMDDDDDMMMG G           ",
    "      MMMDDCCCDDMM G            ",
    "     MMMDDCCCCCDDMM             ",
    "     BBDDCCCCCCCDDBB            ",
    "     BBDCCCCCCCCCDBB            ",
    "     BBDDCCCCCCCDDBB            ",
    "     BBDDCCCCCCCDDBB            ",
    "      DDDDGBGDDDD               ",
    "      DDDGBBBGDDD               ",
    "      D DGBBBGD D               ",
    "      D DGBBBGD D               ",
    "      D D C C D D               ",
    "      D D C C D D               " 
  ];

  const playerBodyAttack2 = [
    "             RRR                ",
    "            RRRRR               ",
    "           RRRRRRR              ",
    "           RRRRRRR              ",
    "           MHHHHHM              ",
    "          MHHHHHHHM             ",
    "          MHH   HHM             ",
    "          MH S S HM             ",
    "          MH S S HM             ",
    "          MHHHHHHHM             ",
    "          MMHHHHHMM             ",
    "         MMMDDDDDMMM            ",
    "        MMMDDCCCDDMMM           ",
    "       MMMDDCCCCCDDMMM          ",
    "       BBDDCCCCCCCDDBB          ",
    "       BBDCCCCCCCCCDBB          ",
    "       BBDDCCCCCCCDDBB          ",
    "       BBDDCCCCCCCDDBB          ",
    "        DDDDGBGDDDD             ",
    "       DDDDGBBBGDDDD            ",
    "      DD DGBBBGD DD             ",
    "      DD DGBBBGD DD             ",
    "      DD D C C D DD             ",
    "      DD D C C D DD             " 
  ];

  // --- SKELETON ---
  const skeletonPalette = { 'W': '#f8fafc', 'G': '#94a3b8', 'D': '#334155', 'E': '#ef4444', 'S': '#0f172a', 'L': '#e2e8f0', 'I': '#d1d5db' };
  
  const skeletonBody = [
    "                                ",
    "            GGGGGGG             ",
    "           GWWWWWWWG            ",
    "          GWWWWWWWWWG           ",
    "          GWW E W E G           ",
    "          GWW E W E G           ",
    "          GWWWWWWWWWG           ",
    "           GWWWWWWWG            ",
    "            GWWWWWG             ",
    "             GGGGG              ",
    "        GGG  WWWWW  GGG         ",
    "       GWWWGGWWWWWGGWWWG        ",
    "       GWWWWWWWWWWWWWWWG        ",
    "       GWWWWWWWWWWWWWWWG        ",
    "        GGG WW D WW GGG         ",
    "            WW D WW             ",
    "        I   WW D WW             ",
    "        I   WW D WW             ",
    "        I   GG D GG             ",
    "        I   WW   WW             ",
    "        I   WW   WW             ",
    "       II  WW     WW            ",
    "           WW     WW            ",
    "          WW       WW           "
  ];

  const skeletonAttack1 = [
    "                                ",
    "            GGGGGGG             ",
    "           GWWWWWWWG            ",
    "          GWWWWWWWWWG           ",
    "          GWW E W E G           ",
    "          GWW E W E G           ",
    "          GWWWWWWWWWG           ",
    "           GWWWWWWWG            ",
    "            GWWWWWG             ",
    "             GGGGG              ",
    "        GGG  WWWWW  GGG         ",
    "       GWWWGGWWWWWGGWWWG        ",
    "       GWWWWWWWWWWWWWWWG        ",
    "       GWWWWWWWWWWWWWWWG        ",
    "        GGG WW D WW GGG         ",
    "            WW D WW   III       ",
    "            WW D WW  I          ",
    "            WW D WW I           ",
    "            GG D GGI            ",
    "            WW   WW             ",
    "            WW   WW             ",
    "           WW     WW            ",
    "           WW     WW            ",
    "          WW       WW           "
  ];

  const skeletonAttack2 = [
    "                                ",
    "            GGGGGGG             ",
    "           GWWWWWWWG            ",
    "          GWWWWWWWWWG           ",
    "          GWW E W E G           ",
    "          GWW E W E G           ",
    "          GWWWWWWWWWG           ",
    "           GWWWWWWWG            ",
    "            GWWWWWG             ",
    "             GGGGG              ",
    "        GGG  WWWWW  GGG         ",
    "       GWWWGGWWWWWGGWWWG        ",
    "       GWWWWWWWWWWWWWWWG        ",
    "       GWWWWWWWWWWWWWWWG        ",
    "        GGG WW D WW GGG         ",
    "       WW   WW D WW   WW        ",
    "       WW   WW D WW   WW        ",
    "       WW   WW D WW   WW        ",
    "       WW   GG D GG   WW        ",
    "       GG   WW   WW   GG        ",
    "            WW   WW   I         ",
    "           WW     WW  I         ",
    "           WW     WW  I         ",
    "          WW       WWII         "
  ];

  // --- GOBLIN ---
  const goblinPalette = { 'S': '#65a30d', 'D': '#3f6212', 'L': '#78350f', 'B': '#451a03', 'Y': '#facc15', 'K': '#1c1917', 'W': '#e5e7eb' };
  
  const goblinBody = [
    "                                ",
    "             DDDD               ",
    "           DDSSSSDD             ",
    "         DDD SSSS DDD           ",
    "        SDDD Y  Y DDDS          ",
    "       SSDDS Y  Y SDDSS         ",
    "       SSDDS      SDDSS         ",
    "       SSSDDDDDDDDDSSS          ",
    "        SSSDDDDDDDDSSS          ",
    "          SSSSSSSSSS            ",
    "           LLLLLLLL             ",
    "         LLLLLLLLLLLL           ",
    "        SLLLLLLLLLLLLS          ",
    "       SSLLLLLLLLLLLLSS         ",
    "       SSLLLLLLLLLLLLSS         ",
    "       SSLLLLLLLLLLLLSS         ",
    "       SSLLLLBBBBLLLLSS         ",
    "        SLLLLBBBBLLLLS          ",
    "         LLLLBBBBLLLL           ",
    "         BBLB    BLBB           ",
    "         BBLB    BLBB           ",
    "      W   SLB    BLS            ",
    "      W   SLB    BLS            ",
    "     WW   SLB    BLS            "
  ];
  
  const goblinAttack1 = [
    "                                ",
    "             DDDD               ",
    "           DDSSSSDD             ",
    "         DDD SSSS DDD           ",
    "        SDDD Y  Y DDDS          ",
    "       SSDDS Y  Y SDDSS         ",
    "       SSDDS      SDDSS         ",
    "       SSSDDDDDDDDDSSS          ",
    "        SSSDDDDDDDDSSS          ",
    "          SSSSSSSSSS            ",
    "           LLLLLLLL             ",
    "         LLLLLLLLLLLL           ",
    "        SLLLLLLLLLLLLS          ",
    "       SSLLLLLLLLLLLLSS         ",
    "       SSLLLLLLLLLLLLSS         ",
    "       SSLLLLLLLLLLLLSS         ",
    "       SSLLLLBBBBLLLLSS         ",
    "        SLLLLBBBBLLLLS          ",
    "         LLLLBBBBLLLL           ",
    "         BBLB    BLBB           ",
    "         BBLB    BLBB   W       ",
    "          SLB    BLS    W       ",
    "          SLB    BLS   WW       ",
    "          SLB    BLS            "
  ];

  const goblinAttack2 = [
    "                                ",
    "             DDDD               ",
    "           DDSSSSDD             ",
    "         DDD SSSS DDD           ",
    "        SDDD Y  Y DDDS          ",
    "       SSDDS Y  Y SDDSS         ",
    "       SSDDS      SDDSS         ",
    "       SSSDDDDDDDDDSSS          ",
    "        SSSDDDDDDDDSSS          ",
    "          SSSSSSSSSS            ",
    "           LLLLLLLL             ",
    "         LLLLLLLLLLLL           ",
    "        SLLLLLLLLLLLLS          ",
    "       SSLLLLLLLLLLLLSS         ",
    "       SSLLLLLLLLLLLLSS         ",
    "       SSLLLLLLLLLLLLSS         ",
    "       SSLLLLBBBBLLLLSS         ",
    "        SLLLLBBBBLLLLS          ",
    "        LLLLLBBBBLLLLL          ",
    "       LBBLB      BLBBL         ",
    "       LBBLB      BLBBL         ",
    "        SSLB      BLSS          ",
    "        SSLB      BLSS     WW   ",
    "        SSLB      BLSS     W    "
  ];

  // --- ORC ---
  const orcPalette = { 'S': '#15803d', 'A': '#52525b', 'H': '#a1a1aa', 'R': '#b91c1c', 'B': '#171717', 'L': '#7f1d1d', 'M': '#9ca3af' };
  const orcBody = [
    "           HHHHHHHH             ",
    "          HAAAAAAAAH            ",
    "         HAAAAAAAAAAH           ",
    "         H A SSSS A H           ",
    "         H A R  R A H           ",
    "         HHABSSSSBAHH           ",
    "          H SSSSSS H            ",
    "           SSSSSSSS             ",
    "          AAAAAAAAAA            ",
    "        HHHAAAAAAAAHHH          ",
    "       HAAAARAAAAARAAAH         ",
    "      HAAAAARAAAAARAAAAH        ",
    "      SAAAAARAAAAARAAAAS        ",
    "      SAAAAARAAAAARAAAAS        ",
    "      SAAAAARAAAAARAAAAS        ",
    "       AAAAARAAAAARAAAA         ",
    "       AAAAARAAAAARAAAA         ",
    "  MMM   AAAARAAAAARAAA          ",
    "   M     AA      AA             ",
    "   M     AA      AA             ",
    "   M    AAA      AAA            ",
    "   M    AAA      AAA            ",
    "  MM   AAAA      AAAA           ",
    "       AAAA      AAAA           "
  ];

  const orcAttack1 = [
    "           HHHHHHHH             ",
    "          HAAAAAAAAH            ",
    "         HAAAAAAAAAAH           ",
    "         H A SSSS A H           ",
    "         H A R  R A H           ",
    "         HHABSSSSBAHH           ",
    "          H SSSSSS H            ",
    "           SSSSSSSS             ",
    "          AAAAAAAAAA            ",
    "        HHHAAAAAAAAHHH          ",
    "       HAAAARAAAAARAAAH         ",
    "      HAAAAARAAAAARAAAAH   MMM  ",
    "      SAAAAARAAAAARAAAAS    M   ",
    "      SAAAAARAAAAARAAAAS    M   ",
    "      SAAAAARAAAAARAAAAS    M   ",
    "       AAAAARAAAAARAAAA     M   ",
    "       AAAAARAAAAARAAAA    MM   ",
    "        AAAARAAAAARAAA          ",
    "         AA      AA             ",
    "         AA      AA             ",
    "        AAA      AAA            ",
    "        AAA      AAA            ",
    "       AAAA      AAAA           ",
    "       AAAA      AAAA           "
  ];
  
  const orcAttack2 = [
    "           HHHHHHHH             ",
    "          HAAAAAAAAH            ",
    "         HAAAAAAAAAAH           ",
    "         H A SSSS A H           ",
    "         H A R  R A H           ",
    "         HHABSSSSBAHH           ",
    "          H SSSSSS H            ",
    "           SSSSSSSS             ",
    "          AAAAAAAAAA            ",
    "        HHHAAAAAAAAHHH          ",
    "       HAAAARAAAAARAAAH         ",
    "      HAAAAARAAAAARAAAAH        ",
    "      SAAAAARAAAAARAAAAS        ",
    "      SAAAAARAAAAARAAAAS        ",
    "      SAAAAARAAAAARAAAAS        ",
    "       AAAAARAAAAARAAAA         ",
    "      AAAAAARAAAAARAAAAA        ",
    "     AAAAAAARAAAAARAAAAAA       ",
    "     AAAAAA      AAAAAA         ",
    "     AAAAAA      AAAAAA         ",
    "      AAAAA      AAAAA          ",
    "      AAAAA      AAAAA  M       ",
    "       AAAA      AAAA   M       ",
    "       AAAA      AAAA  MMM      "
  ];

  // --- LICH (Floating) ---
  const lichPalette = { 'P': '#7e22ce', 'D': '#581c87', 'M': '#3b0764', 'S': '#e2e8f0', 'E': '#22d3ee', 'G': '#c084fc' };
  const lichBody = [
    "            PPPPPP              ",
    "           PPPPPPPP             ",
    "          PPPPPPPPPP            ",
    "          PPSSSSSSPP            ",
    "          PPSEEEESPP            ",
    "          PPS    SPP            ",
    "          PPSSSSSSPP            ",
    "           PPPPPPPP             ",
    "          DDDDDDDDDD            ",
    "         DDDDDDDDDDDD           ",
    "        DDDDDDDDDDDDDD          ",
    "       DDDDDDDDDDDDDDDD         ",
    "       DDDDDDDDDDDDDDDD         ",
    "      GMDDDDDDDDDDDDDMG         ",
    "      GMDDDDDDDDDDDDDMG         ",
    "       MDDDDDDDDDDDDDM          ",
    "       MMDDDDDDDDDDDMM          ",
    "       MMDDDDDDDDDDDMM          ",
    "       MMDDDDDDDDDDDMM          ",
    "        DDDDDDDDDDDD            ",
    "        DDDD    DDDD            ",
    "        DDDD    DDDD            ",
    "       DDDD      DDDD           ",
    "       DDDD      DDDD           "
  ];

  // Arms raised for casting
  const lichBodyCast = [
    "            PPPPPP              ",
    "           PPPPPPPP             ",
    "          PPPPPPPPPP            ",
    "          PPSSSSSSPP            ",
    "          PPSEEEESPP            ",
    "          PPS    SPP            ",
    "          PPSSSSSSPP            ",
    "           PPPPPPPP             ",
    "          DDDDDDDDDD            ",
    " E       DDDDDDDDDDDD       E   ",
    "  E     DDDDDDDDDDDDDD     E    ",
    "   E   DDDDDDDDDDDDDDDD   E     ",
    "    E  DDDDDDDDDDDDDDDD  E      ",
    "     EGMDDDDDDDDDDDDDMGE        ",
    "      GMDDDDDDDDDDDDDMG         ",
    "       MDDDDDDDDDDDDDM          ",
    "       MMDDDDDDDDDDDMM          ",
    "       MMDDDDDDDDDDDMM          ",
    "       MMDDDDDDDDDDDMM          ",
    "        DDDDDDDDDDDD            ",
    "        DDDD    DDDD            ",
    "        DDDD    DDDD            ",
    "       DDDD      DDDD           ",
    "       DDDD      DDDD           "
  ];

  const LICH_ROBE_1 = [
    "      DDDD        DDDD          ",
    "      DDDD        DDDD          ",
    "      DDD          DDD          ",
    "      DD            DD          ",
    "                                ",
    "                                ",
    "                                ",
    "                                "
  ];
  const LICH_ROBE_2 = [
    "      DDDD        DDDD          ",
    "       DDDD      DDDD           ",
    "        DDD      DDD            ",
    "         DD      DD             ",
    "                                ",
    "                                ",
    "                                ",
    "                                "
  ];
  const LICH_CYCLE = [LICH_ROBE_1, LICH_ROBE_2, LICH_ROBE_1, LICH_ROBE_2];


  // --- GENERATE ALL FRAMES ---
  
  const createEntitySprites = (body: string[], attackBodies: string[][], castBody: string[], legs: string[][], palette: any, attackPalette?: any): EntitySprites => {
      const pNormal = palette;
      const pAttack = attackPalette || palette;

      return {
          IDLE: legs.map(leg => composeSprite(32, 32, body, leg, pNormal)),
          MOVE: legs.map(leg => composeSprite(32, 32, body, leg, pNormal)),
          ATTACK: attackBodies.map((b, i) => composeSprite(32, 32, b, ATTACK_CYCLE[i % ATTACK_CYCLE.length], pAttack)),
          CASTING: legs.map(leg => composeSprite(32, 32, castBody, leg, pNormal)),
          HIT: [composeSprite(32, 32, body, LEGS_IDLE, pNormal)], 
          DEATH: [composeSprite(32, 32, body, LEGS_IDLE, pNormal)], 
      };
  };

  const playerSprites = createEntitySprites(playerBody, [playerBodyAttack1, playerBodyAttack2], playerBody, WALK_CYCLE, playerPalette);
  const skeletonSprites = createEntitySprites(skeletonBody, [skeletonAttack1, skeletonAttack2], skeletonBody, WALK_CYCLE, skeletonPalette);
  const goblinSprites = createEntitySprites(goblinBody, [goblinAttack1, goblinAttack2], goblinBody, WALK_CYCLE, goblinPalette);
  const orcSprites = createEntitySprites(orcBody, [orcAttack1, orcAttack2], orcBody, WALK_CYCLE, orcPalette);
  
  // Lich Special
  const lichSprites = createEntitySprites(lichBody, [lichBodyCast, lichBodyCast], lichBodyCast, LICH_CYCLE, lichPalette);
  const lichBrightPalette = { ...lichPalette, 'E': '#ffffff', 'P': '#a855f7' };
  lichSprites.ATTACK = LICH_CYCLE.map(leg => composeSprite(32, 32, lichBodyCast, leg, lichBrightPalette));
  lichSprites.CASTING = LICH_CYCLE.map(leg => composeSprite(32, 32, lichBodyCast, leg, lichBrightPalette));


  // --- ITEMS & PROPS ---
  
  const createSimpleSprite = (pixels: string[], palette: any) => {
     const canvas = document.createElement('canvas');
     canvas.width = 32; canvas.height = 32;
     const ctx = canvas.getContext('2d');
     if(ctx) { ctx.imageSmoothingEnabled = false; drawPixelArt(ctx, pixels, palette, 1, 0); }
     return canvas;
  };

  // Refined Potion - Glass flask with red liquid
  const potionPaletteLocal = { 
      'W': 'rgba(255, 255, 255, 0.6)', 
      'O': '#94a3b8', 
      'R': '#ef4444', 
      'D': '#b91c1c', 
      'C': '#78350f', 
      'B': '#451a03'  
  };
  const potionPixels = [
    "                                ",
    "                                ",
    "             BBBB               ",
    "            BCCCCB              ",
    "            BCCCCB              ",
    "           BBOOOOBB             ",
    "          BOOOWWWOB             ",
    "         BOOWWWWWWOB            ",
    "         BOWWWWWWWOB            ",
    "         BORRRRRRROB            ",
    "         BORRRRRRROB            ",
    "         BORRRRRRROB            ",
    "         BORRRRRRROB            ",
    "         BORRRRRRROB            ",
    "          BORRRRROB             ",
    "           BOOOOOB              ",
    "            BBBBB               ",
    "                                ",
    "                                ",
    "                                ",
    "                                ",
    "                                ",
    "                                ",
    "                                ",
    "                                ",
    "                                ",
    "                                ",
    "                                ",
    "                                ",
    "                                ",
    "                                ",
    "                                ",
  ];
  
  // Refined Weapon - Steel Sword with Gold Hilt
  const weaponPaletteLocal = { 
      'S': '#e2e8f0', // Blade Light
      'M': '#cbd5e1', // Blade Mid
      'D': '#64748b', // Blade Shadow
      'G': '#f59e0b', // Guard
      'H': '#78350f', // Grip
      'P': '#171717'  // Outline
  };
  const weaponPixels = [
    "                                ",
    "               P                ",
    "              SMS               ",
    "              SMS               ",
    "              SMS               ",
    "              SMS               ",
    "              SMS               ",
    "              SMS               ",
    "              SMS               ",
    "              SMS               ",
    "              SMS               ",
    "              SMS               ",
    "              SMS               ",
    "           P GGGGG P            ",
    "          PGGGHHGGGP            ",
    "             PHHP               ",
    "             PHHP               ",
    "             PHHP               ",
    "             PHHP               ",
    "            PPGPP               ",
    "            PGGGP               ",
    "             PPP                ",
    "                                ",
    "                                ",
    "                                ",
    "                                ",
    "                                ",
    "                                ",
    "                                ",
    "                                ",
    "                                ",
    "                                ",
  ];
  
  // Refined Armor - Plate Mail
  const armorPaletteLocal = {
      'H': '#f8fafc', // Highlight
      'S': '#94a3b8', // Silver
      'D': '#475569', // Dark
      'G': '#eab308', // Gold
      'B': '#1e293b'  // Outline
  };
  const armorPixels = [
      "                                ",
      "                                ",
      "          BBBB   BBBB           ",
      "         BGGGGB BGGGGB          ",
      "        BGGSSGGBGGSSGGB         ",
      "        BGSSSSGBGSSSSGB         ",
      "        BGSSSSGBGSSSSGB         ",
      "        BBGSSGGBGSSGBBB         ",
      "       BSSBBBBBBBBBBBSSB        ",
      "       BSSSBBBBBBBBBSSSB        ",
      "       BSSSSSSSSSSSSSSSB        ",
      "       BSSSHHSSSSSHHSSSB        ",
      "       BSSSHHSSSSSHHSSSB        ",
      "       BSSSSSSSSSSSSSSSB        ",
      "       BSSSSSSSSSSSSSSSB        ",
      "       BSSSSSSSSSSSSSSSB        ",
      "        BSSSSSSSSSSSSSB         ",
      "        BSSSSSSSSSSSSSB         ",
      "         BBBBBBBBBBBBB          ",
      "                                ",
      "                                ",
      "                                ",
      "                                ",
      "                                ",
      "                                ",
      "                                ",
      "                                ",
      "                                ",
      "                                ",
      "                                ",
      "                                ",
      "                                ",
  ];

  // Refined Scroll - Parchment
  const scrollPaletteLocal = {
      'P': '#fef3c7', // Paper
      'D': '#d6d3d1', // Darker Paper
      'R': '#dc2626', // Ribbon
      'O': '#78350f'  // Outline
  };
  const scrollPixels = [
      "                                ",
      "                                ",
      "                                ",
      "                                ",
      "           OOOOOOOOOO           ",
      "          OPPPPPPPPPDO          ",
      "         OPPPPPPPPPPDO          ",
      "        OPPPPPPPPPPPDO          ",
      "        ORRPPPPPPPPPRO          ",
      "        ORRPPPPPPPPPRO          ",
      "        ORRPPPPPPPPPRO          ",
      "        OPPPPPPPPPPPDO          ",
      "        OPPPPPPPPPPPDO          ",
      "        OPPPPPPPPPPPDO          ",
      "        OPPPPPPPPPPPDO          ",
      "        OPPPPPPPPPPPDO          ",
      "         ODDDDDDDDDDO           ",
      "          OOOOOOOOOO            ",
      "                                ",
      "                                ",
      "                                ",
      "                                ",
      "                                ",
      "                                ",
      "                                ",
      "                                ",
      "                                ",
      "                                ",
      "                                ",
      "                                ",
      "                                ",
      "                                ",
  ];

  const chestPaletteLocal = { 'W': '#451a03', 'L': '#78350f', 'G': '#f59e0b', 'B': '#171717' };
  const chestClosedPixels = [
      "                                ",
      "                                ",
      "                                ",
      "                                ",
      "                                ",
      "      BBBBBBBBBBBBBBBBBBBB      ",
      "     BGGGGGGGGGGGGGGGGGGGGB     ",
      "    BGGGGGGGGGGGGGGGGGGGGGGB    ",
      "    BGGLLLLLLLLLLLLLLLLGGBBB    ",
      "    BGGLLLLLLLLLLLLLLLLGGB B    ",
      "    BGGLLLLLLLLLLLLLLLLGGB B    ",
      "    BGGLLLLLLLLLLLLLLLLGGB B    ",
      "    BGGLLLLLLLLLLLLLLLLGGB B    ",
      "    BGGGGGGGGGGGGGGGGGGGGB B    ",
      "    BGGGGGGGGGGGGGGGGGGGGB B    ",
      "    BWWWWWWWWGWWGWWWWWWWWBBB    ",
      "    BWWWWWWWWGWWGWWWWWWWWB      ",
      "    BWWWWWWWWGWWGWWWWWWWWB      ",
      "    BWWWWWWWWGWWGWWWWWWWWB      ",
      "    BWWWWWWWWGWWGWWWWWWWWB      ",
      "    BWWWWWWWWGWWGWWWWWWWWB      ",
      "    BWWWWWWWWGWWGWWWWWWWWB      ",
      "    BWWWWWWWWGWWGWWWWWWWWB      ",
      "    BWWWWWWWWGWWGWWWWWWWWB      ",
      "    BGGGGGGGGGGGGGGGGGGGGB      ",
      "     BBBBBBBBBBBBBBBBBBBB       ",
      "                                ",
      "                                ",
      "                                ",
      "                                ",
      "                                ",
      "                                ",
  ];

  const chestOpenPixels = [
      "                                ",
      "                                ",
      "                                ",
      "                                ",
      "                                ",
      "      BBBBBBBBBBBBBBBBBBBB      ",
      "     BGGGGGGGGGGGGGGGGGGGGB     ",
      "    BGGLLLLLLLLLLLLLLLLGGGGB    ",
      "    BGGLLLLLLLLLLLLLLLLGGGGB    ",
      "    BGGLLLLLLLLLLLLLLLLGGGGB    ",
      "    BGGLLLLLLLLLLLLLLLLGGGGB    ",
      "    BGGLLLLLLLLLLLLLLLLGGGGB    ",
      "    BGGGGGGGGGGGGGGGGGGGGBBB    ",
      "    BBBBBBBBBBBBBBBBBBBBBB B    ",
      "    B                    B B    ",
      "    B       BBBBBB       BBB    ",
      "    B      BGGGGBGB      B      ",
      "    B      BGGGG BGB     B      ",
      "    B      BGGGG BGB     B      ",
      "    B      BGGGG BGB     B      ",
      "    B      BGGGG BGB     B      ",
      "    B      BGGGG BGB     B      ",
      "    B       BBBBBB       B      ",
      "    B                    B      ",
      "    BGGGGGGGGGGGGGGGGGGGGB      ",
      "     BBBBBBBBBBBBBBBBBBBB       ",
      "                                ",
      "                                ",
      "                                ",
      "                                ",
      "                                ",
      "                                ",
  ];

  // --- WALL GENERATION ---
  
  const createWallVariant = (type: 'normal' | 'mossy' | 'cracked'): HTMLCanvasElement => {
      return createPattern(64, 64, (ctx) => {
          ctx.fillStyle = theme.wallBase; 
          ctx.fillRect(0,0,64,64);
          
          const brickColor = theme.wallBrick;
          const highlight = theme.wallHighlight;
          const shadow = theme.wallShadow;
          const crackColor = '#000000';
          const mossColor = theme.detailColor;
          
          const drawBrick = (x: number, y: number, w: number, h: number) => {
              ctx.fillStyle = brickColor;
              ctx.fillRect(x, y, w, h);
              ctx.fillStyle = highlight;
              ctx.fillRect(x, y, w, 2); 
              ctx.fillRect(x, y, 2, h); 
              ctx.fillStyle = shadow;
              ctx.fillRect(x + w - 2, y, 2, h); 
              ctx.fillRect(x, y + h - 2, w, 2); 
              
              if (type === 'cracked' && Math.random() < 0.3) {
                  ctx.strokeStyle = theme.detailType === 'magma' ? theme.detailColor : crackColor;
                  ctx.lineWidth = 2;
                  ctx.beginPath();
                  ctx.moveTo(x + 5, y + 5);
                  ctx.lineTo(x + w/2, y + h/2);
                  ctx.lineTo(x + w - 5, y + h - 8);
                  ctx.stroke();
              }
              
              if (type === 'mossy' && Math.random() < 0.4) {
                  ctx.fillStyle = mossColor;
                  const mx = x + Math.random() * (w - 10);
                  const my = y + Math.random() * (h - 10);
                  ctx.fillRect(mx, my, 4, 4);
                  ctx.fillRect(mx + 2, my + 2, 4, 4);
                  ctx.fillRect(mx - 2, my + 3, 2, 2);
              }
          };

          const rows = 4;
          const rowHeight = 16;
          for (let r = 0; r < rows; r++) {
              const y = r * rowHeight;
              const offset = (r % 2) * 16;
              for (let c = -1; c < 3; c++) {
                  drawBrick(c * 32 + offset, y, 30, 14);
              }
          }
          
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 60, 64, 4); 
          ctx.fillStyle = highlight;
          ctx.fillRect(0, 0, 64, 2); 
      });
  };

  const walls = [
      createWallVariant('normal'),
      createWallVariant('cracked'),
      createWallVariant('mossy')
  ];

  // --- FLOOR GENERATION ---

  const createFloorVariant = (type: 'normal' | 'cracked' | 'mossy' | 'vine'): HTMLCanvasElement => {
      return createPattern(64, 64, (ctx) => {
          ctx.fillStyle = theme.floorBase; 
          ctx.fillRect(0,0,64,64);
          
          const tileSize = 32;
          for(let y=0; y<64; y+=tileSize) {
              for(let x=0; x<64; x+=tileSize) {
                  const val = Math.random(); 
                  ctx.fillStyle = val > 0.5 ? theme.floorTileMain : theme.floorTileAlt;
                  ctx.fillRect(x+1, y+1, tileSize-2, tileSize-2);
                  
                  if (Math.random() > 0.5) {
                       ctx.fillStyle = 'rgba(0,0,0,0.1)';
                       ctx.fillRect(x+4, y+4, tileSize-8, tileSize-8);
                  }
                  
                  if (type === 'mossy' && Math.random() < 0.6) {
                      ctx.fillStyle = theme.detailColor;
                      ctx.globalAlpha = 0.5;
                      const size = Math.random() * 12 + 4;
                      const px = x + Math.random() * (tileSize - size);
                      const py = y + Math.random() * (tileSize - size);
                      ctx.fillRect(px, py, size, size * 0.8);
                      ctx.globalAlpha = 1.0;
                  }
                  
                  if (type === 'cracked' && Math.random() < 0.4) {
                      ctx.strokeStyle = theme.detailType === 'magma' ? '#ef4444' : 'rgba(0,0,0,0.4)';
                      ctx.lineWidth = 1;
                      ctx.beginPath();
                      ctx.moveTo(x + 5, y + 5);
                      ctx.lineTo(x + 20, y + 20);
                      ctx.lineTo(x + 10, y + 28);
                      ctx.stroke();
                  }
              }
          }
          
          if (type === 'vine') {
               ctx.fillStyle = theme.detailColor; 
               
               const corner = Math.floor(Math.random() * 4);
               let startX = 0, startY = 0;
               let dirX = 1, dirY = 1;
               
               if (corner === 1) { startX = 64; startY = 0; dirX = -1; }
               else if (corner === 2) { startX = 64; startY = 64; dirX = -1; dirY = -1; }
               else if (corner === 3) { startX = 0; startY = 64; dirY = -1; }
               
               let cx = startX;
               let cy = startY;
               for(let i=0; i<20; i++) {
                   ctx.fillRect(cx, cy, 4, 4);
                   if (Math.random() > 0.5) cx += dirX * 4;
                   else cy += dirY * 4;
               }
          }
          
          ctx.strokeStyle = theme.floorBase;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(0, 0); ctx.lineTo(64,0);
          ctx.moveTo(0, 0); ctx.lineTo(0,64);
          ctx.stroke();
      });
  };

  const floors = [
      createFloorVariant('normal'), 
      createFloorVariant('cracked'), 
      createFloorVariant('mossy'), 
      createFloorVariant('mossy'), 
      createFloorVariant('mossy'), 
      createFloorVariant('mossy'), 
      createFloorVariant('vine'), 
      createFloorVariant('vine'), 
      createFloorVariant('vine'), 
      createFloorVariant('vine')  
  ];

  const trapSprite = createPattern(64, 64, (ctx) => {
      ctx.drawImage(floors[0], 0, 0);
      ctx.fillStyle = '#000000';
      const holes = [{x:16, y:16}, {x:48, y:16}, {x:16, y:48}, {x:48, y:48}, {x:32, y:32}];
      holes.forEach(h => { ctx.beginPath(); ctx.arc(h.x, h.y, 6, 0, Math.PI*2); ctx.fill(); });
      ctx.fillStyle = '#94a3b8';
      holes.forEach(h => { ctx.beginPath(); ctx.moveTo(h.x - 4, h.y + 4); ctx.lineTo(h.x + 4, h.y + 4); ctx.lineTo(h.x, h.y - 12); ctx.fill(); });
      ctx.fillStyle = 'rgba(153, 27, 27, 0.6)';
      ctx.beginPath(); ctx.arc(32, 36, 10, 0, Math.PI*2); ctx.fill();
  });

  const stairsSprite = createPattern(64, 64, (ctx) => {
      ctx.drawImage(floors[0], 0, 0);
      ctx.fillStyle = '#000000'; ctx.fillRect(10, 10, 44, 44);
      ctx.fillStyle = '#333333'; ctx.fillRect(10, 10, 44, 10);
      ctx.fillStyle = '#262626'; ctx.fillRect(10, 20, 44, 10);
      ctx.fillStyle = '#1a1a1a'; ctx.fillRect(10, 30, 44, 10);
      ctx.fillStyle = '#0d0d0d'; ctx.fillRect(10, 40, 44, 14);
      ctx.strokeStyle = theme.wallHighlight; ctx.lineWidth = 2; ctx.strokeRect(10, 10, 44, 44);
  });

  return {
    player: playerSprites,
    skeleton: skeletonSprites,
    goblin: goblinSprites,
    orc: orcSprites,
    lich: lichSprites,
    potion: createSimpleSprite(potionPixels, potionPaletteLocal),
    weapon: createSimpleSprite(weaponPixels, weaponPaletteLocal),
    armor: createSimpleSprite(armorPixels, armorPaletteLocal), 
    scroll: createSimpleSprite(scrollPixels, scrollPaletteLocal), 
    chestClosed: createSimpleSprite(chestClosedPixels, chestPaletteLocal),
    chestOpen: createSimpleSprite(chestOpenPixels, chestPaletteLocal),
    wall: walls,
    floor: floors,
    trap: trapSprite,
    stairs: stairsSprite
  };
};
