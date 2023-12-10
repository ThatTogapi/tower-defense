// Shot.ts
import { getButtonColor } from './App';
import Monster from './Monster';

export default class Shot {
  position: { x: number; y: number };
  type: 'Regular' | 'Ice' | 'Fire';
  goal: Monster;
  color: string; // New property to store the color

  constructor(position: { x: number; y: number }, type: 'Regular' | 'Ice' | 'Fire', goal: Monster) {
    this.position = position;
    this.type = type;
    this.goal = goal;
    this.color = getButtonColor(type); // Get the color based on the tower type
  }
}
