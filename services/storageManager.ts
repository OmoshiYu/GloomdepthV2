
import { Item, GenerationMode, Language, GameMap, Entity, Chest, Vector2 } from '../types';

const STORAGE_KEYS = {
  SETTINGS: 'gloomdepth_settings',
  GAME_SAVE: 'gloomdepth_save_v1'
};

export interface GameSettings {
  musicVolume: number;
  sfxVolume: number;
  language: Language;
  showTouchControls: boolean;
}

export interface GameSaveData {
  floor: number;
  score: number;
  genMode: GenerationMode;
  player: {
    hp: number;
    maxHp: number;
    damage: number;
    defense: number;
  };
  playerPos: Vector2;
  inventory: Item[];
  equipped: {
    weapon: Item | null;
    armor: Item | null;
  };
  map: GameMap;
  enemies: Entity[];
  items: Item[];
  chests: Chest[];
  timestamp: number;
}

export const storageManager = {
  // --- SETTINGS ---
  saveSettings: (settings: GameSettings) => {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save settings', e);
    }
  },

  loadSettings: (): GameSettings | null => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  // --- GAME SAVE ---
  saveGame: (data: GameSaveData) => {
    try {
      localStorage.setItem(STORAGE_KEYS.GAME_SAVE, JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save game', e);
    }
  },

  loadGame: (): GameSaveData | null => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.GAME_SAVE);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  hasSave: (): boolean => {
    return !!localStorage.getItem(STORAGE_KEYS.GAME_SAVE);
  },

  clearSave: () => {
    localStorage.removeItem(STORAGE_KEYS.GAME_SAVE);
  }
};
