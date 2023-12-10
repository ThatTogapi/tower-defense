// App.tsx

import React, { useState, useEffect } from 'react';
import MonsterPath from './MonsterPath';
import Monster from './Monster';
import { Tower } from './Tower';
import Shot from './Shot';

interface AppState {
  gameStarted: boolean;
  gold: number;
  selectedTower: 'Regular' | 'Ice' | 'Fire' | null;
  nextWaveStart: number;
  currentLevel: number;
  playerLives: number;
  towers: Tower[];
  monsters: Monster[];
  monsterPath: MonsterPath;
  shots: Shot[]; // Updated to include shots
}

const towerTypes = ['Regular', 'Ice', 'Fire'];
const framesPerSecond = 60; // Adjust as needed
export const fieldSize = 30;

function App() {
  const tileSize = 30;
  const startingPlayerLives = 3; // Adjust as needed
  const [state, setState] = useState<AppState>({
    gameStarted: false,
    gold: 10000,
    selectedTower: null,
    nextWaveStart: framesPerSecond * 5, // 5 seconds in frames
    currentLevel: 1,
    playerLives: startingPlayerLives,
    towers: [],
    monsters: [],
    monsterPath: new MonsterPath([
      { x: 1, y: -1 },
      { x: 1, y: 13 },
      { x: 3, y: 13 },
      { x: 3, y: 1 },
      { x: 5, y: 1 },
      { x: 5, y: 13 },
      { x: 7, y: 13 },
      { x: 7, y: 1 },
      { x: 9, y: 1 },
      { x: 9, y: 13 },
      { x: 11, y: 13 },
      { x: 11, y: 1 },
      { x: 13, y: 1 },
      { x: 13, y: 13 },
      { x: 15, y: 13 },
      { x: 15, y: 1 },
      { x: 17, y: 1 },
      { x: 17, y: 13 },
      { x: 20, y: 13 },
    ]),
    shots: [],
  });

  const initializeMonster = () => {
    const newMonster = new Monster({ x: 1, y: -1 }, state.monsterPath, state.monsters);
    setState((prevState) => ({
      ...prevState,
      monsters: [...prevState.monsters, newMonster],
    }));
  };

  const calculateDistance = (point1: { x: number; y: number }, point2: { x: number; y: number }) => {
    const dx = point1.x - point2.x;
    const dy = point1.y - point2.y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  useEffect(() => {
    if (state.gameStarted) {
      initializeMonster();
    }
  }, [state.gameStarted]);

  const mainLoop = () => {
    const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    const context = canvas.getContext('2d');
  
    if (context) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = 'lightgreen';
      context.fillRect(0, 0, canvas.width, canvas.height);
  
      state.monsterPath.draw(context, tileSize);
  
      state.towers.forEach((tower) => {
        tower.draw(context);
        tower.update();
      });
  
      // Create monsters periodically based on nextWaveStart status
      if (state.gameStarted && state.nextWaveStart === 0) {
        initializeMonster();
        setState((prevState) => ({
          ...prevState,
          nextWaveStart: framesPerSecond * 5, // Reset nextWaveStart to 5 seconds
        }));
      } else if (state.gameStarted) {
        setState((prevState) => ({
          ...prevState,
          nextWaveStart: prevState.nextWaveStart - 1,
        }));
      }
  
      // Display monsters
      state.monsters.forEach((monster, index) => {
        monster.update();
        monster.display(context, tileSize);
  
        // Check if the monster reaches the end of the path
        if (monster.pathIndex === state.monsterPath.straightLinePositions.length - 1) {
          // Remove the monster from the monsters array
          const updatedMonsters = [...state.monsters];
          updatedMonsters.splice(index, 1);
  
          // Reduce player lives
          setState((prevState) => ({
            ...prevState,
            monsters: updatedMonsters,
            playerLives: prevState.playerLives - 1,
          }));
  
          // Check if the player has no lives left
          if (state.playerLives - 1 === 0) {
            // Game over, reset the game
            setState((prevState) => ({
              ...prevState,
              gameStarted: false,
              playerLives: startingPlayerLives,
              towers: [],
              monsters: [],
            }));
          }
        }
      });
  
      state.towers.forEach((tower) => {
        tower.draw(context);
        tower.update();

        // Shoot at monsters
        state.monsters.forEach((monster) => {
          // Check if the monster is still alive
          if (monster.health > 0) {
            const distance = calculateDistance(tower.position, monster.position);
            const thresholdDistance = 10;

            if (distance < thresholdDistance) {
              const newShot = tower.shoot(monster);
              if (newShot) {
                setState((prevState) => ({
                  ...prevState,
                  shots: [...(prevState.shots || []), newShot],
                }));
              }
            }
          }
        });
      });

  
      // Inside the mainLoop function, after creating shots
      (state.shots || []).forEach((shot, shotIndex) => {
        const dx = shot.goal.position.x - shot.position.x;
        const dy = shot.goal.position.y - shot.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const speed = 2; // Adjust the shot speed as needed
  
        // Check if the shot reaches the monster
        const thresholdDistance = 1; // Adjust the threshold distance as needed
        if (distance < thresholdDistance) {
          // Reduce monster health
          shot.goal.reduceHealth(30); // Adjust the damage amount as needed
  
          // Delete the shot
          setState((prevState) => ({
            ...prevState,
            shots: prevState.shots.filter((_, index) => index !== shotIndex),
          }));
        } else {
          // Move the shot towards the monster
          shot.position.x += (dx / distance) * speed;
          shot.position.y += (dy / distance) * speed;
  
          // Render the shot
          context.fillStyle = shot.color;
          context.fillRect(
            shot.position.x * tileSize,
            shot.position.y * tileSize,
            fieldSize,
            fieldSize
          );
        }
      });
  
      // Move the requestAnimationFrame outside the loop to ensure continuous updates
      requestAnimationFrame(mainLoop);
    }
  };
  

  const handleTowerTypeSelect = (towerType: 'Regular' | 'Ice' | 'Fire' | null) => {
    setState((prevState) => ({ ...prevState, selectedTower: towerType }));
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();

    const x = Math.floor((event.clientX - rect.left) / fieldSize) * fieldSize;
    const y = Math.floor((event.clientY - rect.top) / fieldSize) * fieldSize;

    if (state.monsterPath.isWithinPath(x, y) === true) {
      console.log('You cannot place a tower on the monster path.');
      return;
    }

    if (state.towers.some((tower) => tower.position.x === x && tower.position.y === y)) {
      console.log('There is already a tower on this position.');
      return;
    }

    if (state.selectedTower && state.gold >= 50) {
      const newTower = new Tower(state.selectedTower, { x, y });
      setState((prevState) => ({
        ...prevState,
        towers: [...prevState.towers, newTower],
        gold: prevState.gold - 50,
      }));
    }
  };

  const handleStartButtonClick = () => {
    setState((prevState) => ({ ...prevState, gameStarted: true }));
  };

  useEffect(() => {
    mainLoop();
  }, [state.towers, state.monsters]);

  return (
    <div className="container">
      <h1>Tower Defense Game</h1>

      <button onClick={handleStartButtonClick} disabled={state.gameStarted}>
        Start Game
      </button>

      <p>Game Started: {state.gameStarted ? 'Yes' : 'No'}</p>
      <p>Gold: {state.gold}</p>

      <p>Selected Tower: {state.selectedTower}</p>
      <ToggleButtonGroup
        options={towerTypes}
        selectedOption={state.selectedTower}
        onOptionSelect={handleTowerTypeSelect}
      />

      <p>Next Wave Start: {Math.ceil(state.nextWaveStart / framesPerSecond)} seconds</p>
      <p>Current Level: {state.currentLevel}</p>
      <p>Player Lives: {state.playerLives}</p>
      <canvas
        id="gameCanvas"
        width={fieldSize * 20}
        height={fieldSize * 15}
        onClick={handleCanvasClick}
      ></canvas>
    </div>
  );
}

interface ToggleButtonGroupProps {
  options: ('Regular' | 'Ice' | 'Fire')[];
  selectedOption: string | null;
  onOptionSelect: (towerType: 'Regular' | 'Ice' | 'Fire' | null) => void;
}

const ToggleButtonGroup: React.FC<ToggleButtonGroupProps> = ({
  options,
  selectedOption,
  onOptionSelect,
}) => {
  return (
    <div>
      {options.map((option) => (
        <button
          key={option}
          onClick={() => onOptionSelect(option === selectedOption ? null : option)}
          style={{
            width: '100px',
            height: '40px',
            backgroundColor: getButtonColor(option),
            color: getButtonTextColor(option),
          }}
        >
          {option}
        </button>
      ))}
    </div>
  );
};

export const getButtonColor = (option: string): string => {
  switch (option) {
    case 'Regular':
      return 'blue';
    case 'Ice':
      return 'white';
    case 'Fire':
      return 'red';
    default:
      return 'white';
  }
};

const getButtonTextColor = (option: string): string => {
  switch (option) {
    case 'Regular':
      return 'white';
    case 'Ice':
      return 'blue';
    case 'Fire':
      return 'white';
    default:
      return 'black';
  }
};
export default App;
