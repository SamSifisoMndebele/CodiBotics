import React from 'react';
import { Compass, Cpu } from 'lucide-react';
import {
  SeniorSubMode,
  MazeWall,
  LogicNode,
  LogicWire,
} from '../../types/simulator';
import { RoverMazeSimulator } from './RoverMazeSimulator';
import { LogicGatePlayground } from './LogicGatePlayground';

interface SeniorWorkspaceProps {
  subMode: SeniorSubMode;
  onChangeSubMode: (mode: SeniorSubMode) => void;
  walls: MazeWall[];
  onChangeWalls: React.Dispatch<React.SetStateAction<MazeWall[]>>;
  logicNodes: LogicNode[];
  logicWires: LogicWire[];
  onChangeLogicNodes: React.Dispatch<React.SetStateAction<LogicNode[]>>;
  onChangeLogicWires: React.Dispatch<React.SetStateAction<LogicWire[]>>;
  roverProgramType: 'line_follow' | 'obstacle_avoid' | 'manual_motors' | 'blockly_custom';
  onChangeRoverProgramType: (
    t: 'line_follow' | 'obstacle_avoid' | 'manual_motors' | 'blockly_custom'
  ) => void;
}

export const SeniorWorkspace: React.FC<SeniorWorkspaceProps> = ({
  subMode,
  onChangeSubMode,
  walls,
  onChangeWalls,
  logicNodes,
  logicWires,
  onChangeLogicNodes,
  onChangeLogicWires,
  roverProgramType,
  onChangeRoverProgramType,
}) => {
  return (
    <div className="max-w-[1600px] mx-auto p-4 lg:p-6 space-y-5">
      {/* Sub-mode Switcher: 2D Differential Drive Rover vs Digital Logic Gate Playground */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <div>
          <h2 className="text-lg font-extrabold text-white">
            Senior Phase (Grade 7) — Autonomous Systems & Digital Logic
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Explore 2D differential drive kinematics ($v_L, v_R$), ultrasonic raycasting, and Boolean logic gates.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => onChangeSubMode('rover')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-extrabold transition-all ${
              subMode === 'rover'
                ? 'bg-sky-500 text-slate-950 shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>2D Autonomous Rover & Maze</span>
          </button>

          <button
            onClick={() => onChangeSubMode('logic')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-extrabold transition-all ${
              subMode === 'logic'
                ? 'bg-indigo-500 text-white shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>Digital Logic Gate Builder</span>
          </button>
        </div>
      </div>

      {subMode === 'rover' ? (
        <RoverMazeSimulator
          walls={walls}
          onChangeWalls={onChangeWalls}
          programMode={roverProgramType}
          onChangeProgramMode={onChangeRoverProgramType}
        />
      ) : (
        <LogicGatePlayground
          nodes={logicNodes}
          wires={logicWires}
          onChangeNodes={onChangeLogicNodes}
          onChangeWires={onChangeLogicWires}
        />
      )}
    </div>
  );
};
