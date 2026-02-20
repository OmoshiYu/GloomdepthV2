
import { KEYBOARD } from '../constants';

export class InputHandler {
  keys: Set<string>;

  constructor() {
    this.keys = new Set();
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  onKeyDown = (e: KeyboardEvent) => {
    this.keys.add(e.key);
  };

  onKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.key);
  };

  isDown(key: string): boolean {
    return this.keys.has(key);
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
