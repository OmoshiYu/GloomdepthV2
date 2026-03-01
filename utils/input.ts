
import { KEYBOARD } from '../constants';

const RU_TO_CODE: Record<string, string> = {
  'ц': 'KeyW', 'ф': 'KeyA', 'ы': 'KeyS', 'в': 'KeyD', 'у': 'KeyE', 'й': 'KeyQ',
  'Ц': 'KeyW', 'Ф': 'KeyA', 'Ы': 'KeyS', 'В': 'KeyD', 'У': 'KeyE', 'Й': 'KeyQ',
};

export class InputHandler {
  keys: Set<string>;

  constructor() {
    this.keys = new Set();
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  onKeyDown = (e: KeyboardEvent) => {
    const key = e.key.toLowerCase();
    this.keys.add(key);
    if (RU_TO_CODE[key]) {
      this.keys.add(RU_TO_CODE[key]);
    }
    if (e.code) {
      this.keys.add(e.code);
    }
  };

  onKeyUp = (e: KeyboardEvent) => {
    const key = e.key.toLowerCase();
    this.keys.delete(key);
    if (RU_TO_CODE[key]) {
      this.keys.delete(RU_TO_CODE[key]);
    }
    if (e.code) {
      this.keys.delete(e.code);
    }
  };

  isDown(key: string): boolean {
    if (this.keys.has(key.toLowerCase()) || this.keys.has(key)) return true;
    if (key.startsWith('Key')) {
      const letter = key.charAt(3).toLowerCase();
      if (this.keys.has(letter)) return true;
    }
    return false;
  }

  getMovementVector(): { x: number, y: number } {
    let x = 0;
    let y = 0;
    if (this.isDown(KEYBOARD.W) || this.isDown(KEYBOARD.ARROW_UP)) y -= 1;
    if (this.isDown(KEYBOARD.S) || this.isDown(KEYBOARD.ARROW_DOWN)) y += 1;
    if (this.isDown(KEYBOARD.A) || this.isDown(KEYBOARD.ARROW_LEFT)) x -= 1;
    if (this.isDown(KEYBOARD.D) || this.isDown(KEYBOARD.ARROW_RIGHT)) x += 1;
    return { x, y };
  }

  isAttackPressed(): boolean {
    return this.isDown(KEYBOARD.SPACE);
  }

  cleanup() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  }
}
