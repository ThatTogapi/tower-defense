import React, { useState, useEffect } from 'react';
import MonsterPath from './MonsterPath';
import Monster from './Monster';
import { Tower } from './Tower';
import Shot from './Shot';
import { useForceUpdate } from './useForceUpdate';

interface AppState {
  gameStarted: boolean;
  gold: number;
  selectedTower: 'Regular' | 'Ice' | 'Fire' | null;
  nextWaveStart: number;
  currentLevel: number;
  playerLives: number;
  kills: number;
  playerLifeCost: number;
  towers: Tower[];
  monsters: Monster[];
  monsterPath: MonsterPath;
  shots: Shot[];
}

const towerTypes = ['Regular', 'Ice', 'Fire'];
const framesPerSecond = 60;
export const fieldSize = 30;

function App() {
  const tileSize = 30;
  const startingPlayerLives = 3;
  const forceUpdate = useForceUpdate();
  const [state, setState] = useState<AppState>({
    gameStarted: false,
    gold: 100,
    selectedTower: null,
    nextWaveStart: framesPerSecond * 5,
    currentLevel: 1,
    playerLives: startingPlayerLives,
    kills: 0,
    playerLifeCost: 100,
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

  const initializeMonster = (index: number) => {
    const startPosition = { x: 1, y: -1 - index }; // Adjust the starting position
    const newMonster = new Monster(startPosition, state.monsterPath, state.monsters);
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
      for (let i = 0; i < state.currentLevel * 2; i++) {
        initializeMonster(i);
      }
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

      const isWaveFinished = state.monsters.length === 0;

      if (state.gameStarted && (state.nextWaveStart === 0 || isWaveFinished)) {
        if (isWaveFinished) {
          setState((prevState) => ({
            ...prevState,
            nextWaveStart: framesPerSecond * 5,
            currentLevel: prevState.currentLevel + 1,
          }));
        } else {
          setState((prevState) => ({
            ...prevState,
            nextWaveStart: framesPerSecond * 5,
          }));
        }

        const newMonsters = Array.from({ length: state.currentLevel * 2 }, () => {
          return new Monster({ x: 1, y: -1 }, state.monsterPath, state.monsters);
        });

        setState((prevState) => ({
          ...prevState,
          monsters: [...prevState.monsters, ...newMonsters],
        }));
      } else if (state.gameStarted) {
        setState((prevState) => ({
          ...prevState,
          nextWaveStart: prevState.nextWaveStart - 1,
        }));
      }

      if (state.gameStarted && state.nextWaveStart === 0) {
        initializeMonster(state.currentLevel);
        setState((prevState) => ({
          ...prevState,
          nextWaveStart: framesPerSecond * 5,
        }));
      } else if (state.gameStarted) {
        setState((prevState) => ({
          ...prevState,
          nextWaveStart: prevState.nextWaveStart - 1,
        }));
      }

      state.monsters.forEach((monster, index) => {
        monster.update();
        monster.display(context, tileSize);

        if (monster.pathIndex === state.monsterPath.straightLinePositions.length - 1) {
          const updatedMonsters = [...state.monsters];
          updatedMonsters.splice(index, 1);

          setState((prevState) => ({
            ...prevState,
            monsters: updatedMonsters,
            playerLives: prevState.playerLives - 1,
          }));

          if (state.playerLives <= 0) {
            setState((prevState) => ({
              ...prevState,
              gameStarted: false,
              playerLives: startingPlayerLives,
              gold: 100,
              kills: 0,
              currentLevel: 1,
              towers: [],
              monsters: [],
            }));
          }
        }
      });

      state.towers.forEach((tower) => {
        tower.draw(context);
        tower.update();

        state.monsters.forEach((monster) => {
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

      (state.shots || []).forEach((shot, shotIndex) => {
        const dx = shot.goal.position.x - shot.position.x;
        const dy = shot.goal.position.y - shot.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const speed = 0.5;

        shot.position.x += (dx / distance) * speed;
        shot.position.y += (dy / distance) * speed;
        context.lineWidth = 10;
        context.strokeStyle = shot.color;
        context.beginPath();
        context.moveTo(shot.goal.position.x * tileSize, shot.goal.position.y * tileSize);
        context.lineTo(shot.position.x * tileSize, shot.position.y * tileSize);
        context.stroke();

        const thresholdDistance = 1;
        if (distance < thresholdDistance) {
          // Apply effects based on tower type
          switch (shot.type) {
            case 'Regular':
              shot.goal.reduceHealth(10);
              break;
            case 'Ice':
              // Freeze the monster in position for some time (e.g., 3 seconds)
              shot.goal.freeze(3);
              shot.goal.reduceHealth(1); // Ice tower also deals damage
              break;
            case 'Fire':
              shot.goal.reduceHealth(8); // Fire tower deals extra damage
              shot.goal.burn(3);
              break;
            default:
              break;
          }

          if (shot.goal.health <= 0) {
            setState((prevState) => ({
              ...prevState,
              kills: prevState.kills + 1,
              gold: prevState.gold + 10,
              shots: prevState.shots.filter((_, index) => index !== shotIndex),
            }));
            if(state.kills % 10 === 1){
              state.currentLevel++;
            }
          }
        }
      });
    }
  };

  useEffect(() => {
    const intervalId = setInterval(() => {
      requestAnimationFrame(mainLoop);
    }, 1000 / framesPerSecond);

    return () => clearInterval(intervalId);
  }, [state.towers, state.monsters, forceUpdate]);

  const handleTowerTypeSelect = (towerType: 'Regular' | 'Ice' | 'Fire' | null) => {
    setState((prevState) => ({ ...prevState, selectedTower: towerType }));
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();
  
    // Calculate the grid positions based on the mouse click coordinates
    const x = Math.floor((event.clientX - rect.left) / fieldSize) * fieldSize;
    const y = Math.floor((event.clientY - rect.top) / fieldSize) * fieldSize;
  
    // Check if a tower can be placed at the specified position
    if (
      x >= 0 &&
      x < canvas.width &&
      y >= 0 &&
      y < canvas.height &&
      !state.monsterPath.isWithinPath(x, y) &&
      state.towers.every(
        (tower) =>
          Math.abs(tower.position.x - x) > 0.1 || Math.abs(tower.position.y - y) > 0.1
      )
    ) {
      // Check if a tower type is selected and if there is enough gold to place the tower
      if (state.selectedTower && state.gold >= 50) {
        // Create a new tower at the calculated position
        const newTower = new Tower(state.selectedTower, { x, y });
  
        // Update the state to include the new tower and deduct the gold cost
        setState((prevState) => ({
          ...prevState,
          towers: [...prevState.towers, newTower],
          gold: prevState.gold - 50,
        }));
      }
    }
  };
   

  const handleStartButtonClick = () => {
    setState((prevState) => ({ ...prevState, gameStarted: true }));
  };

  const handleBuyLifeButtonClick = () => {
    if (state.gold >= state.playerLifeCost) {
      setState((prevState) => ({
        ...prevState,
        gold: prevState.gold - state.playerLifeCost,
        playerLives: prevState.playerLives + 1,
      }));
    } else {
      console.log('Not enough gold to buy a player life.');
    }
  };

  const handleKillAllMonsters = () => {
    if (state.gold >= 1000) {
      const updatedMonsters = state.monsters.map((monster) => {
        const updatedMonster: Monster = new Monster(
            monster.position,
            monster.path,
            monster.monstersList
        );
        updatedMonster.isDefeated = true;
        return updatedMonster;
      });

      setState((prevState) => ({
        ...prevState,
        gold: prevState.gold - 1000,
        monsters: updatedMonsters,
      }));
    } else {
      console.log('Not enough gold to kill all monsters.');
    }
  };

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

      <button onClick={handleBuyLifeButtonClick}>Buy Life ({state.playerLifeCost} Gold)</button>
      <button onClick={handleKillAllMonsters}>Kill All Monsters (1000 Gold)</button>

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
