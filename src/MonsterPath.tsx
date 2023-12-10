class MonsterPath {
  straightLinePositions: { x: number; y: number }[] = [];

  constructor(coordinates: { x: number; y: number }[]) {
    this.generateStraightLines(coordinates);
  }

  private generateStraightLines(coordinates: { x: number; y: number }[]) {
    for (let i = 0; i < coordinates.length - 1; i++) {
      const startX = coordinates[i].x;
      const startY = coordinates[i].y;
      const endX = coordinates[i + 1].x;
      const endY = coordinates[i + 1].y;

      const pointsInLine = this.getLinePoints(startX, startY, endX, endY);
      this.straightLinePositions.push(...pointsInLine);
    }
  }

  private getLinePoints(startX: number, startY: number, endX: number, endY: number) {
    const points: { x: number; y: number }[] = [];
    const dx = Math.abs(endX - startX);
    const dy = Math.abs(endY - startY);
    const sx = startX < endX ? 1 : -1;
    const sy = startY < endY ? 1 : -1;
    let err = dx - dy;

    let x = startX;
    let y = startY;

    while (true) {
      points.push({ x, y });

      if (x === endX && y === endY) {
        break;
      }

      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x += sx;
      }
      if (e2 < dx) {
        err += dx;
        y += sy;
      }
    }

    return points;
  }

  draw(context: CanvasRenderingContext2D, tileSize: number) {
    context.fillStyle = 'black';
    this.straightLinePositions.forEach((position) => {
      context.fillRect(position.x * tileSize, position.y * tileSize, tileSize, tileSize);
    });
  }

  isWithinPath(x: number, y: number) {
    return this.straightLinePositions.some((position) => position.x === x && position.y === y);
  }
}

export default MonsterPath;
