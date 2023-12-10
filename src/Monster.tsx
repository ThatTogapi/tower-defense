// Monster.ts
import MonsterPath from "./MonsterPath";

class Monster {
  position: { x: number; y: number };
  path: MonsterPath;
  pathIndex: number = 0;
  speed: number = 0.05; // Adjust the speed as needed
  health: number = 100; // Adjust the initial health as needed
  monstersList: Monster[]; // Reference to the list of monsters
  isDefeated: boolean = false; // Flag to indicate if the monster is defeated

  constructor(startPosition: { x: number; y: number }, path: MonsterPath, monstersList: Monster[]) {
    this.position = startPosition;
    this.path = path;
    this.monstersList = monstersList;
  }

  update() {
    // Skip update if the monster is defeated
    if (this.isDefeated) {
      return;
    }

    const targetPosition = this.path.straightLinePositions[this.pathIndex];
    if (!targetPosition) {
      return;
    }

    const dx = targetPosition.x - this.position.x;
    const dy = targetPosition.y - this.position.y;

    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < this.speed) {
      // Move to the next position in the path
      this.position.x = targetPosition.x;
      this.position.y = targetPosition.y;
      this.pathIndex++;
    } else {
      // Move towards the target position
      this.position.x += (dx / distance) * this.speed;
      this.position.y += (dy / distance) * this.speed;
    }
  }

  display(context: CanvasRenderingContext2D, tileSize: number) {
    // Skip drawing if the monster is defeated
    if (this.isDefeated) {
      return;
    }

    context.fillStyle = 'purple';
    context.fillRect(
      this.position.x * tileSize,
      this.position.y * tileSize,
      tileSize,
      tileSize
    );
  }

  reduceHealth(damage: number) {
    this.health -= damage;

    // Check if the monster is defeated
    if (this.health <= 0) {
      // Set the defeated flag to true
      this.isDefeated = true;

      // Remove the monster from the list of monsters
      this.monstersList.splice(this.monstersList.indexOf(this), 1);
    }
  }
}

export default Monster;
