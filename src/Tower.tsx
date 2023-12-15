import { getButtonColor, fieldSize } from './App';
import Monster from './Monster';
import Shot from './Shot'; // Import the Shot class

export class Tower {
  type: 'Regular' | 'Ice' | 'Fire';
  position: { x: number; y: number }; // Change to position instead of x, y
  cooldown: number = 0; // Cooldown in frames, adjust as needed

  constructor(type: 'Regular' | 'Ice' | 'Fire', position: { x: number; y: number }) {
    this.type = type;
    this.position = position;
  }

  draw(context: CanvasRenderingContext2D) {
    context.fillStyle = getButtonColor(this.type);
    context.fillRect(this.position.x, this.position.y, fieldSize, fieldSize);
  }

  update() {
    if (this.cooldown > 0) {
      this.cooldown--;
    }
  }

  // New method to handle shooting
  shoot(monster: Monster): Shot | null {
    if (this.cooldown === 0) {
      this.cooldown = 60; // Assuming a 1-second cooldown (60 frames per second)
      console.log(monster);
      return new Shot(this.position, this.type, monster);
    }
    console.log('Tower is still on cooldown');
    return null; // Tower is still on cooldown
  }
}
