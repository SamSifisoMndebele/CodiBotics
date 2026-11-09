import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RotateCcw, MapPin, Sparkles, Compass } from 'lucide-react';
import {
  MapThemeId,
  FloorBotCommand,
  FloorBotCommandType,
  FloorBotState,
  CardinalDirection,
} from '../../types/simulator';
import { FOUNDATION_MAPS } from './foundationMaps';
import { FloorBotCanvas } from './FloorBotCanvas';
import { IconCommandBar } from './IconCommandBar';
import { audioEngine } from '../../engine/AudioEngine';

interface FoundationWorkspaceProps {
  mapId: MapThemeId;
  onChangeMapId: (id: MapThemeId) => void;
  commandQueue: FloorBotCommand[];
  onChangeQueue: React.Dispatch<React.SetStateAction<FloorBotCommand[]>>;
  showCoordinates: boolean;
}

const TURN_LEFT_MAP: Record<CardinalDirection, CardinalDirection> = {
  N: 'W',
  W: 'S',
  S: 'E',
  E: 'N',
};

const TURN_RIGHT_MAP: Record<CardinalDirection, CardinalDirection> = {
  N: 'E',
  E: 'S',
  S: 'W',
  W: 'N',
};

const STEP_DELTA: Record<CardinalDirection, { dx: number; dy: number }> = {
  N: { dx: 0, dy: -1 },
  E: { dx: 1, dy: 0 },
  S: { dx: 0, dy: 1 },
  W: { dx: -1, dy: 0 },
};

export const FoundationWorkspace: React.FC<FoundationWorkspaceProps> = ({
  mapId,
  onChangeMapId,
  commandQueue,
  onChangeQueue,
  showCoordinates,
}) => {
  const currentMap = FOUNDATION_MAPS[mapId];

  const createInitialBotState = useCallback((): FloorBotState => {
    return {
      x: currentMap.startPos.x,
      y: currentMap.startPos.y,
      direction: currentMap.startDir,
      isFlashing: false,
      isBeeping: false,
      visitedCheckpoints: [],
      hasCollided: false,
      hasReachedGoal: false,
      pathHistory: [{ ...currentMap.startPos }],
    };
  }, [currentMap]);

  const [botState, setBotState] = useState<FloorBotState>(createInitialBotState);
  const [isRunning, setIsRunning] = useState(false);
  const [activeStepIndex, setActiveStepIndex] = useState<number | null>(null);
  const timerRef = useRef<number | null>(null);

  // Reset bot state when map changes
  useEffect(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    setIsRunning(false);
    setActiveStepIndex(null);
    setBotState(createInitialBotState());
  }, [mapId, createInitialBotState]);

  const handleResetBot = () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    setIsRunning(false);
    setActiveStepIndex(null);
    setBotState(createInitialBotState());
    audioEngine.playClick();
  };

  const handleAddCommand = (type: FloorBotCommandType) => {
    audioEngine.playClick();
    const newCmd: FloorBotCommand = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type,
    };
    onChangeQueue((prev) => [...prev, newCmd]);
  };

  const handleRemoveCommandAt = (index: number) => {
    audioEngine.playClick();
    onChangeQueue((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUndoLast = () => {
    audioEngine.playClick();
    onChangeQueue((prev) => prev.slice(0, -1));
  };

  const handleClearQueue = () => {
    audioEngine.playClick();
    handleResetBot();
    onChangeQueue([]);
  };

  const handleRunSequence = () => {
    if (commandQueue.length === 0) return;
    const initial = createInitialBotState();
    setBotState(initial);
    setIsRunning(true);
    setActiveStepIndex(0);

    let stepIdx = 0;
    let workingState = { ...initial, pathHistory: [...initial.pathHistory] };

    const executeNext = () => {
      if (stepIdx >= commandQueue.length) {
        setIsRunning(false);
        setActiveStepIndex(null);
        return;
      }

      setActiveStepIndex(stepIdx);
      const cmd = commandQueue[stepIdx];

      // Clear transient effects from prior step
      workingState = {
        ...workingState,
        isFlashing: false,
        isBeeping: false,
      };

      if (cmd.type === 'TURN_LEFT') {
        workingState.direction = TURN_LEFT_MAP[workingState.direction];
        audioEngine.playTurn();
      } else if (cmd.type === 'TURN_RIGHT') {
        workingState.direction = TURN_RIGHT_MAP[workingState.direction];
        audioEngine.playTurn();
      } else if (cmd.type === 'BEEP') {
        workingState.isBeeping = true;
        audioEngine.playRobotBeep();
      } else if (cmd.type === 'FLASH') {
        workingState.isFlashing = true;
        audioEngine.playFlashSound();
      } else if (cmd.type === 'FORWARD' || cmd.type === 'BACKWARD') {
        const delta = STEP_DELTA[workingState.direction];
        const mult = cmd.type === 'FORWARD' ? 1 : -1;
        const nextX = workingState.x + delta.dx * mult;
        const nextY = workingState.y + delta.dy * mult;

        // Check boundary collision
        const outOfBounds =
          nextX < 0 ||
          nextX >= currentMap.gridSize ||
          nextY < 0 ||
          nextY >= currentMap.gridSize;

        // Check obstacle collision
        const hitObstacle = currentMap.obstacles.some(
          (obs) => obs.x === nextX && obs.y === nextY
        );

        if (outOfBounds || hitObstacle) {
          workingState.hasCollided = true;
          setBotState({ ...workingState });
          audioEngine.playCollision();
          setIsRunning(false);
          setActiveStepIndex(null);
          return;
        }

        workingState.x = nextX;
        workingState.y = nextY;
        workingState.pathHistory = [
          ...workingState.pathHistory,
          { x: nextX, y: nextY },
        ];
        audioEngine.playStepMove();

        // Check checkpoint visit
        const cp = currentMap.checkpoints.find(
          (c) => c.x === nextX && c.y === nextY
        );
        if (cp && !workingState.visitedCheckpoints.includes(cp.order)) {
          workingState.visitedCheckpoints = [
            ...workingState.visitedCheckpoints,
            cp.order,
          ];
          audioEngine.playFlashSound();
        }

        // Check goal reached
        if (
          nextX === currentMap.targetPos.x &&
          nextY === currentMap.targetPos.y
        ) {
          workingState.hasReachedGoal = true;
          setBotState({ ...workingState });
          audioEngine.playVictory();
        }
      }

      setBotState({ ...workingState });
      stepIdx += 1;
      timerRef.current = window.setTimeout(executeNext, 650);
    };

    timerRef.current = window.setTimeout(executeNext, 250);
  };

  const loadSampleSolution = () => {
    audioEngine.playClick();
    handleResetBot();
    const presets: Record<MapThemeId, FloorBotCommandType[]> = {
      township: [
        'FORWARD',
        'FORWARD',
        'FORWARD',
        'BEEP',
        'TURN_RIGHT',
        'FORWARD',
        'FORWARD',
        'FLASH',
        'FORWARD',
        'FORWARD',
        'TURN_LEFT',
        'FORWARD',
      ],
      wildlife: [
        'FORWARD',
        'TURN_RIGHT',
        'FORWARD',
        'TURN_LEFT',
        'FORWARD',
        'BEEP',
        'FORWARD',
        'FORWARD',
        'TURN_RIGHT',
        'FORWARD',
        'FLASH',
        'FORWARD',
        'FORWARD',
      ],
      school: [
        'TURN_LEFT',
        'FORWARD',
        'TURN_RIGHT',
        'FORWARD',
        'FORWARD',
        'BEEP',
        'FORWARD',
        'TURN_RIGHT',
        'FORWARD',
        'FORWARD',
        'FLASH',
        'TURN_LEFT',
        'FORWARD',
        'TURN_LEFT',
        'FORWARD',
      ],
    };

    onChangeQueue(
      presets[mapId].map((type, idx) => ({
        id: `preset-${idx}-${Date.now()}`,
        type,
      }))
    );
  };

  return (
    <div className="max-w-[1500px] mx-auto p-4 lg:p-6">
      {/* Top Map Selector & Mission Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-2xl">
            🐝
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-white">
              {currentMap.name}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              {currentMap.subtitle}
            </p>
          </div>
        </div>

        {/* Map Theme Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {(Object.keys(FOUNDATION_MAPS) as MapThemeId[]).map((id) => {
            const m = FOUNDATION_MAPS[id];
            const active = mapId === id;
            return (
              <button
                key={id}
                onClick={() => onChangeMapId(id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                  active
                    ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>{m.name}</span>
              </button>
            );
          })}

          <button
            onClick={loadSampleSolution}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-colors"
            title="Load a working demo path for this map"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Demo Path</span>
          </button>

          <button
            onClick={handleResetBot}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-colors"
            title="Reset Kazi-Bot to Start Tile"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Bot</span>
          </button>
        </div>
      </div>

      {/* Main Split Grid: Left = 2D Canvas Mat, Right = Symbolic Command Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: 5x5 Interactive Grid Mat */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <FloorBotCanvas
            map={currentMap}
            botState={botState}
            showCoordinates={showCoordinates}
            activeStepIndex={activeStepIndex}
          />

          {/* Legend & Checkpoint Status */}
          <div className="mt-4 w-full max-w-[450px] bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-slate-300 font-semibold">
              <Compass className="w-4 h-4 text-amber-400" />
              <span>
                Facing: <strong className="text-white">{botState.direction}</strong> (Tile{' '}
                {String.fromCharCode(65 + botState.x)}
                {botState.y + 1})
              </span>
            </div>

            <div className="flex items-center gap-2">
              {currentMap.checkpoints.map((cp) => {
                const done = botState.visitedCheckpoints.includes(cp.order);
                return (
                  <span
                    key={cp.order}
                    className={`px-2 py-0.5 rounded-full font-bold border ${
                      done
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    {cp.emoji} {cp.label} {done ? '✓' : ''}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Symbolic Command Pad & Sequence Queue */}
        <div className="lg:col-span-7">
          <IconCommandBar
            queue={commandQueue}
            activeStepIndex={activeStepIndex}
            isRunning={isRunning}
            onAddCommand={handleAddCommand}
            onRemoveCommandAt={handleRemoveCommandAt}
            onClearQueue={handleClearQueue}
            onUndoLast={handleUndoLast}
            onRunSequence={handleRunSequence}
            onStopSequence={handleResetBot}
          />
        </div>
      </div>
    </div>
  );
};
