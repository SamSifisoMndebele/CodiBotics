// ============================================================================
// PulseMaker Simulator - Core TypeScript Interfaces & State Definitions
// Designed for South African DBE CAPS Coding & Robotics (Grades R-7)
// ============================================================================

export type GradePhase = 'foundation' | 'intermediate' | 'senior';

export type SeniorSubMode = 'rover' | 'logic';

// --- Phase 1: Foundation Phase (Grades R-3) ---

export type CardinalDirection = 'N' | 'E' | 'S' | 'W';

export type FloorBotCommandType =
  | 'FORWARD'
  | 'BACKWARD'
  | 'TURN_LEFT'
  | 'TURN_RIGHT'
  | 'BEEP'
  | 'FLASH';

export interface FloorBotCommand {
  id: string;
  type: FloorBotCommandType;
}

export type MapThemeId = 'township' | 'wildlife' | 'school';

export interface GridCoordinate {
  x: number;
  y: number;
}

export interface GridObstacle {
  x: number;
  y: number;
  label: string;
  emoji: string;
}

export interface GridCheckpoint {
  x: number;
  y: number;
  label: string;
  emoji: string;
  order: number;
}

export interface FoundationGridMap {
  id: MapThemeId;
  name: string;
  subtitle: string;
  gridSize: number; // e.g., 5 for 5x5 or 6 for 6x6
  bgColor: string;
  tileColor: string;
  tileAltColor: string;
  startPos: GridCoordinate;
  startDir: CardinalDirection;
  targetPos: GridCoordinate;
  targetEmoji: string;
  targetLabel: string;
  obstacles: GridObstacle[];
  checkpoints: GridCheckpoint[];
}

export interface FloorBotState {
  x: number;
  y: number;
  direction: CardinalDirection;
  isFlashing: boolean;
  isBeeping: boolean;
  visitedCheckpoints: number[];
  hasCollided: boolean;
  hasReachedGoal: boolean;
  pathHistory: GridCoordinate[];
}

// --- Phase 2: Intermediate Phase (Grades 4-6) ---

export type LedMatrix5x5 = number[][]; // 5x5 grid with brightness 0..255

export interface MicrocontrollerState {
  leds: LedMatrix5x5;
  buttonA: boolean;
  buttonB: boolean;
  temperature: number; // -10 to 50 °C
  lightLevel: number; // 0 to 255
  pins: {
    P0: number;
    P1: number;
    P2: number;
  };
  buzzerFrequency: number;
  variables: Record<string, number | string | boolean>;
}

export interface TraceLogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'action' | 'sensor' | 'warn' | 'error';
  message: string;
}

// --- Phase 3: Senior Phase (Grade 7) ---

export interface RoverState {
  x: number;
  y: number;
  angle: number; // radians
  vLeft: number; // -100 to 100
  vRight: number; // -100 to 100
  ultrasonicDistance: number; // cm (0 to 250)
  leftLineSensor: boolean; // true if over dark line
  rightLineSensor: boolean;
  trail: { x: number; y: number }[];
}

export interface MazeWall {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface LineSegment {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export type LogicGateType = 'INPUT' | 'OUTPUT' | 'AND' | 'OR' | 'NOT' | 'XOR';

export interface LogicNode {
  id: string;
  type: LogicGateType;
  label: string;
  x: number;
  y: number;
  state: boolean; // HIGH (true) or LOW (false)
}

export interface LogicWire {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  toInputIndex: 0 | 1;
}

// --- Phase 4: Platform & Facilitator Controls ---

export interface FacilitatorSettings {
  lockedPhase: GradePhase | null;
  difficulty: 'beginner' | 'standard' | 'challenge';
  audioMuted: boolean;
  showGridCoordinates: boolean;
}

export interface PulseMakerProjectFile {
  version: string;
  timestamp: string;
  projectName: string;
  activePhase: GradePhase;
  foundation: {
    mapId: MapThemeId;
    commandQueue: FloorBotCommand[];
  };
  intermediate: {
    blocklyXml: string;
    temperature: number;
    lightLevel: number;
  };
  senior: {
    subMode: SeniorSubMode;
    walls: MazeWall[];
    logicNodes: LogicNode[];
    logicWires: LogicWire[];
    roverProgramType: 'line_follow' | 'obstacle_avoid' | 'manual_motors' | 'blockly_custom';
  };
}
