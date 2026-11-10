import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  Play,
  Square,
  RotateCcw,
  Plus,
  Trash2,
  Radar,
  Code2,
  Route,
} from 'lucide-react';
import { RoverState, MazeWall, LineSegment } from '../../types/simulator';
import {
  ROVER_RADIUS,
  stepRoverPhysics,
  computeOpticalLineSensors,
  computeUltrasonicDistance,
} from '../../engine/Physics2D';

interface RoverMazeSimulatorProps {
  walls: MazeWall[];
  onChangeWalls: React.Dispatch<React.SetStateAction<MazeWall[]>>;
  programMode: 'line_follow' | 'obstacle_avoid' | 'manual_motors' | 'blockly_custom';
  onChangeProgramMode: (
    m: 'line_follow' | 'obstacle_avoid' | 'manual_motors' | 'blockly_custom'
  ) => void;
}

export type TrackRouteId = 'oval' | 'serpentine' | 'figure8' | 'rounded_rect';

interface TrackRoutePreset {
  id: TrackRouteId;
  name: string;
  badge: string;
  startX: number;
  startY: number;
  startAngle: number;
  points: { x: number; y: number }[];
  segments: LineSegment[];
}

function pointsToClosedSegments(
  prefix: string,
  pts: { x: number; y: number }[]
): LineSegment[] {
  const segs: LineSegment[] = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    segs.push({
      id: `${prefix}-${i}`,
      x1: a.x,
      y1: a.y,
      x2: b.x,
      y2: b.y,
    });
  }
  return segs;
}

function buildTrackPresets(): Record<TrackRouteId, TrackRoutePreset> {
  // 1. Oval Speedway (Curved Stadium Loop)
  const ovalPts: { x: number; y: number }[] = [];
  const ovalR = 115;
  const leftCx = 185;
  const rightCx = 375;
  const cy = 210;
  // Top straight
  for (let i = 0; i <= 10; i++) {
    ovalPts.push({
      x: leftCx + ((rightCx - leftCx) * i) / 10,
      y: cy - ovalR,
    });
  }
  // Right semicircle (-PI/2 to +PI/2)
  for (let i = 1; i <= 24; i++) {
    const theta = -Math.PI / 2 + (Math.PI * i) / 24;
    ovalPts.push({
      x: rightCx + Math.cos(theta) * ovalR,
      y: cy + Math.sin(theta) * ovalR,
    });
  }
  // Bottom straight
  for (let i = 1; i <= 10; i++) {
    ovalPts.push({
      x: rightCx - ((rightCx - leftCx) * i) / 10,
      y: cy + ovalR,
    });
  }
  // Left semicircle (+PI/2 to 3*PI/2)
  for (let i = 1; i < 24; i++) {
    const theta = Math.PI / 2 + (Math.PI * i) / 24;
    ovalPts.push({
      x: leftCx + Math.cos(theta) * ovalR,
      y: cy + Math.sin(theta) * ovalR,
    });
  }

  // 2. Serpentine S-Curve Circuit (Smooth harmonic S-bend loop)
  const serpPts: { x: number; y: number }[] = [];
  const serpSteps = 96;
  for (let i = 0; i < serpSteps; i++) {
    const t = (2 * Math.PI * i) / serpSteps;
    const x = 280 + 195 * Math.cos(t);
    const y = 210 + 122 * Math.sin(t) + 36 * Math.sin(3 * t);
    serpPts.push({ x, y });
  }

  // 3. Figure-8 Infinity Crossover Loop
  const fig8Pts: { x: number; y: number }[] = [];
  const fig8Steps = 96;
  for (let i = 0; i < fig8Steps; i++) {
    const t = (2 * Math.PI * i) / fig8Steps;
    const x = 280 + 200 * Math.sin(t);
    const y = 210 + 130 * Math.sin(2 * t);
    fig8Pts.push({ x, y });
  }

  // 4. Rounded Warehouse Loop (Rectangle with smooth R=55 curved corners)
  const rectPts: { x: number; y: number }[] = [];
  const r = 55;
  const minX = 90;
  const maxX = 470;
  const minY = 95;
  const maxY = 335;
  const corners = [
    { cx: maxX - r, cy: minY + r, start: -Math.PI / 2 }, // Top-Right
    { cx: maxX - r, cy: maxY - r, start: 0 }, // Bottom-Right
    { cx: minX + r, cy: maxY - r, start: Math.PI / 2 }, // Bottom-Left
    { cx: minX + r, cy: minY + r, start: Math.PI }, // Top-Left
  ];
  corners.forEach((c) => {
    for (let i = 0; i <= 14; i++) {
      const a = c.start + ((Math.PI / 2) * i) / 14;
      rectPts.push({
        x: c.cx + Math.cos(a) * r,
        y: c.cy + Math.sin(a) * r,
      });
    }
  });

  return {
    oval: {
      id: 'oval',
      name: 'Curved Oval Track',
      badge: 'Smooth Loop',
      startX: 250,
      startY: cy - ovalR,
      startAngle: 0,
      points: ovalPts,
      segments: pointsToClosedSegments('oval', ovalPts),
    },
    serpentine: {
      id: 'serpentine',
      name: 'S-Curve Circuit',
      badge: 'Winding S-Bend',
      startX: 280,
      startY: 296,
      startAngle: Math.PI,
      points: serpPts,
      segments: pointsToClosedSegments('serp', serpPts),
    },
    figure8: {
      id: 'figure8',
      name: 'Figure-8 Infinity',
      badge: 'Crossover Curves',
      startX: Math.round(280 + 200 * Math.sin(0.25)),
      startY: Math.round(210 + 130 * Math.sin(0.5)),
      startAngle: Math.atan2(260 * Math.cos(0.5), 200 * Math.cos(0.25)),
      points: fig8Pts,
      segments: pointsToClosedSegments('fig8', fig8Pts),
    },
    rounded_rect: {
      id: 'rounded_rect',
      name: 'Rounded Warehouse',
      badge: '4 Curved Corners',
      startX: 90,
      startY: 250,
      startAngle: -Math.PI / 2,
      points: rectPts,
      segments: pointsToClosedSegments('rect', rectPts),
    },
  };
}

const TRACK_PRESETS = buildTrackPresets();

export const RoverMazeSimulator: React.FC<RoverMazeSimulatorProps> = ({
  walls,
  onChangeWalls,
  programMode,
  onChangeProgramMode,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const CANVAS_W = 560;
  const CANVAS_H = 420;

  const [routeId, setRouteId] = useState<TrackRouteId>('oval');
  const activeRoute = useMemo(() => TRACK_PRESETS[routeId], [routeId]);

  const createInitialRover = useCallback(
    (route: TrackRoutePreset): RoverState => {
      const sensors = computeOpticalLineSensors(
        route.startX,
        route.startY,
        route.startAngle,
        route.segments
      );
      return {
        x: route.startX,
        y: route.startY,
        angle: route.startAngle,
        vLeft: 60,
        vRight: 60,
        ultrasonicDistance: 150,
        leftLineSensor: sensors.leftSensor,
        rightLineSensor: sensors.rightSensor,
        trail: [{ x: route.startX, y: route.startY }],
      };
    },
    []
  );

  const [rover, setRover] = useState<RoverState>(() =>
    createInitialRover(TRACK_PRESETS.oval)
  );
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [manualLeft, setManualLeft] = useState<number>(60);
  const [manualRight, setManualRight] = useState<number>(60);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(
    null
  );

  // Reset rover position onto the new route when routeId changes
  const handleSelectRoute = (nextRouteId: TrackRouteId) => {
    setRouteId(nextRouteId);
    setIsRunning(false);
    const nextRoute = TRACK_PRESETS[nextRouteId];
    const initial = createInitialRover(nextRoute);
    initial.ultrasonicDistance = computeUltrasonicDistance(
      initial.x,
      initial.y,
      initial.angle,
      walls,
      CANVAS_W,
      CANVAS_H
    );
    setRover(initial);
  };

  // 30 FPS Autonomous Control Loop
  useEffect(() => {
    if (!isRunning) return;

    const interval = window.setInterval(() => {
      setRover((prev) => {
        let targetVL = prev.vLeft;
        let targetVR = prev.vRight;

        if (programMode === 'obstacle_avoid') {
          if (prev.ultrasonicDistance < 65) {
            // Obstacle detected! Spin right (clockwise: vLeft > vRight)
            targetVL = 65;
            targetVR = -65;
          } else {
            targetVL = 70;
            targetVR = 70;
          }
        } else if (programMode === 'line_follow') {
          const { leftSensor, rightSensor, leftDist, rightDist } =
            computeOpticalLineSensors(
              prev.x,
              prev.y,
              prev.angle,
              activeRoute.segments
            );

          if (leftSensor && !rightSensor) {
            // Line is under Left IR sensor -> steer Left (vRight > vLeft)
            targetVL = -10;
            targetVR = 80;
          } else if (!leftSensor && rightSensor) {
            // Line is under Right IR sensor -> steer Right (vLeft > vRight)
            targetVL = 80;
            targetVR = -10;
          } else if (leftSensor && rightSensor) {
            // Both sensors on line: drive forward with smooth centering trim
            const trim = Math.round(
              Math.max(-25, Math.min(25, (leftDist - rightDist) * 3))
            );
            targetVL = 62 + trim;
            targetVR = 62 - trim;
          } else {
            // Recovery if slightly off-line on a sharp curve
            if (Math.min(leftDist, rightDist) < 70) {
              if (leftDist < rightDist) {
                targetVL = -25;
                targetVR = 75;
              } else {
                targetVL = 75;
                targetVR = -25;
              }
            } else {
              targetVL = 55;
              targetVR = 55;
            }
          }
        } else {
          targetVL = manualLeft;
          targetVR = manualRight;
        }

        const updatedState = {
          ...prev,
          vLeft: targetVL,
          vRight: targetVR,
        };

        return stepRoverPhysics(
          updatedState,
          0.04,
          walls,
          activeRoute.segments,
          CANVAS_W,
          CANVAS_H
        );
      });
    }, 33);

    return () => window.clearInterval(interval);
  }, [isRunning, programMode, walls, manualLeft, manualRight, activeRoute]);

  // Render 2D Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Background Grid
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    ctx.strokeStyle = 'rgba(51, 65, 85, 0.45)';
    ctx.lineWidth = 1;
    for (let x = 0; x < CANVAS_W; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_H);
      ctx.stroke();
    }
    for (let y = 0; y < CANVAS_H; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_W, y);
      ctx.stroke();
    }

    // 2. Draw Smooth Optical Line-Following Track
    if (activeRoute.points.length > 1) {
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 20;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      activeRoute.points.forEach((pt, idx) => {
        if (idx === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.closePath();
      ctx.stroke();

      // Center dashed guide on track
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      activeRoute.points.forEach((pt, idx) => {
        if (idx === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.closePath();
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 3. Draw Rover Breadcrumb Trail
    if (rover.trail.length > 1) {
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.55)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      rover.trail.forEach((pt, idx) => {
        if (idx === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.stroke();
    }

    // 4. Draw Maze Obstacle Walls
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    walls.forEach((w) => {
      ctx.beginPath();
      ctx.moveTo(w.x1, w.y1);
      ctx.lineTo(w.x2, w.y2);
      ctx.stroke();
    });

    // 5. Draw Ultrasonic Raycast Beam
    const noseX = rover.x + Math.cos(rover.angle) * ROVER_RADIUS;
    const noseY = rover.y + Math.sin(rover.angle) * ROVER_RADIUS;
    const rayEndX = noseX + Math.cos(rover.angle) * rover.ultrasonicDistance;
    const rayEndY = noseY + Math.sin(rover.angle) * rover.ultrasonicDistance;

    ctx.strokeStyle =
      rover.ultrasonicDistance < 65
        ? 'rgba(244, 63, 94, 0.9)'
        : 'rgba(16, 185, 129, 0.75)';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(noseX, noseY);
    ctx.lineTo(rayEndX, rayEndY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Ray hit point dot
    ctx.fillStyle = rover.ultrasonicDistance < 65 ? '#f43f5e' : '#10b981';
    ctx.beginPath();
    ctx.arc(rayEndX, rayEndY, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // 6. Draw Differential Drive Rover Chassis
    ctx.save();
    ctx.translate(rover.x, rover.y);
    ctx.rotate(rover.angle);

    // Left & Right Tires
    ctx.fillStyle = '#020617';
    ctx.fillRect(-12, -ROVER_RADIUS - 4, 24, 6);
    ctx.fillRect(-12, ROVER_RADIUS - 2, 24, 6);

    // Metallic Blue Chassis Body
    ctx.fillStyle = '#0ea5e9';
    ctx.beginPath();
    ctx.arc(0, 0, ROVER_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#e0f2fe';
    ctx.stroke();

    // Forward Heading Triangle
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(ROVER_RADIUS - 4, 0);
    ctx.lineTo(-6, -8);
    ctx.lineTo(-6, 8);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    // 7. Draw Optical Line Sensor Dots
    const { leftPt, rightPt } = computeOpticalLineSensors(
      rover.x,
      rover.y,
      rover.angle,
      activeRoute.segments
    );

    ctx.fillStyle = rover.leftLineSensor ? '#facc15' : '#475569';
    ctx.beginPath();
    ctx.arc(leftPt.x, leftPt.y, 4.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = rover.rightLineSensor ? '#facc15' : '#475569';
    ctx.beginPath();
    ctx.arc(rightPt.x, rightPt.y, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }, [rover, walls, activeRoute]);

  // Interactive Wall Placement on Canvas Click
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    const x = Math.round((e.clientX - rect.left) * scaleX);
    const y = Math.round((e.clientY - rect.top) * scaleY);

    if (!drawStart) {
      setDrawStart({ x, y });
    } else {
      const newWall: MazeWall = {
        id: `w-${Date.now()}`,
        x1: drawStart.x,
        y1: drawStart.y,
        x2: x,
        y2: y,
      };
      onChangeWalls((prev) => [...prev, newWall]);
      setDrawStart(null);
    }
  };

  const handleResetRover = () => {
    setIsRunning(false);
    const initial = createInitialRover(activeRoute);
    initial.ultrasonicDistance = computeUltrasonicDistance(
      initial.x,
      initial.y,
      initial.angle,
      walls,
      CANVAS_W,
      CANVAS_H
    );
    setRover(initial);
  };

  // Generate Live Python Code Preview for the Active Rover Algorithm
  const generatedPython =
    programMode === 'obstacle_avoid'
      ? `# Grade 7 Autonomous Ultrasonic Obstacle Avoidance
from codibotics_rover import Rover
rover = Rover()

while True:
    dist_cm = rover.ultrasonic.distance_cm()
    if dist_cm < 65:
        # Obstacle detected! Spin right
        rover.motors(v_left=65, v_right=-65)
    else:
        # Path clear: drive straight
        rover.motors(v_left=70, v_right=70)`
      : programMode === 'line_follow'
      ? `# Grade 7 Infrared Optical Line Follower (${activeRoute.name})
from codibotics_rover import Rover
rover = Rover()

while True:
    left_ir = rover.line_sensor_left()
    right_ir = rover.line_sensor_right()

    if left_ir and not right_ir:
        # Line under Left IR -> steer Left
        rover.motors(v_left=5, v_right=80)
    elif right_ir and not left_ir:
        # Line under Right IR -> steer Right
        rover.motors(v_left=80, v_right=5)
    else:
        # Centered on track -> drive forward
        rover.motors(v_left=64, v_right=64)`
      : `# Grade 7 Differential Drive Kinematics (v_L, v_R)
from codibotics_rover import Rover
rover = Rover()

# Direct wheel velocity control
rover.motors(v_left=${manualLeft}, v_right=${manualRight})`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Column: 2D Physics Canvas, Track Selector & Maze Wall Builder */}
      <div className="lg:col-span-7 flex flex-col gap-3">
        <div className="bg-slate-900 border-2 border-slate-800 rounded-2xl p-3 shadow-2xl space-y-2.5">
          {/* Route Selector Pills */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800 px-1">
            <span className="text-xs font-extrabold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
              <Route className="w-4 h-4" />
              <span>Track Route:</span>
            </span>

            <div className="flex flex-wrap items-center gap-1.5">
              {(Object.keys(TRACK_PRESETS) as TrackRouteId[]).map((id) => {
                const preset = TRACK_PRESETS[id];
                const isSelected = routeId === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handleSelectRoute(id)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      isSelected
                        ? 'bg-sky-500 text-slate-950 border-sky-300 shadow-md'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    {preset.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Maze Wall Builder Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <span className="text-xs font-bold text-slate-300">
              {drawStart
                ? 'Click second point on arena to finish wall segment...'
                : 'Tip: Click any two points on the arena to build custom maze walls!'}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  onChangeWalls([
                    { id: 'w1', x1: 240, y1: 60, x2: 240, y2: 180 },
                    { id: 'w2', x1: 360, y1: 240, x2: 360, y2: 370 },
                  ])
                }
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-amber-300 border border-slate-700"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Sample Maze</span>
              </button>
              <button
                onClick={() => {
                  onChangeWalls([]);
                  setDrawStart(null);
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-xs font-semibold text-rose-300 border border-slate-700"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Walls</span>
              </button>
            </div>
          </div>

          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            onClick={handleCanvasClick}
            className="w-full rounded-xl cursor-crosshair border border-slate-800 block"
          />
        </div>

        {/* Live Telemetry Bar */}
        <div className="grid grid-cols-3 gap-3 bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs font-mono">
          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
            <div className="text-slate-400">Ultrasonic Ray:</div>
            <div className="text-base font-bold text-emerald-400">
              {rover.ultrasonicDistance} cm
            </div>
          </div>
          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
            <div className="text-slate-400">Wheel Motors (vL, vR):</div>
            <div className="text-base font-bold text-sky-400">
              {rover.vLeft}, {rover.vRight}
            </div>
          </div>
          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
            <div className="text-slate-400">Optical IR Sensors:</div>
            <div className="text-base font-bold text-amber-400">
              L:{rover.leftLineSensor ? '1' : '0'} R:{rover.rightLineSensor ? '1' : '0'}
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Algorithm Controls & Dual-Pane Python Transpiler */}
      <div className="lg:col-span-5 flex flex-col gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Radar className="w-4 h-4 text-sky-400" />
              <span>Autonomous Navigation Mode</span>
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { id: 'line_follow', label: 'Line Follower' },
                { id: 'obstacle_avoid', label: 'Obstacle Avoid' },
                { id: 'manual_motors', label: 'Manual (vL, vR)' },
              ] as const
            ).map((m) => (
              <button
                key={m.id}
                onClick={() => onChangeProgramMode(m.id)}
                className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition-all ${
                  programMode === m.id
                    ? 'bg-sky-500 text-slate-950 border-sky-300 shadow-md'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {programMode === 'manual_motors' && (
            <div className="space-y-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-sky-400">Left Motor Velocity (v_L)</span>
                  <span className="font-mono">{manualLeft}%</span>
                </div>
                <input
                  type="range"
                  min={-100}
                  max={100}
                  value={manualLeft}
                  onChange={(e) => setManualLeft(Number(e.target.value))}
                  className="w-full accent-sky-400"
                />
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-emerald-400">Right Motor Velocity (v_R)</span>
                  <span className="font-mono">{manualRight}%</span>
                </div>
                <input
                  type="range"
                  min={-100}
                  max={100}
                  value={manualRight}
                  onChange={(e) => setManualRight(Number(e.target.value))}
                  className="w-full accent-emerald-400"
                />
              </div>
            </div>
          )}

          {/* Start / Stop Rover Buttons */}
          <div className="flex items-center gap-2 pt-1">
            {!isRunning ? (
              <button
                onClick={() => setIsRunning(true)}
                className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                <span>Engage Autonomous Rover</span>
              </button>
            ) : (
              <button
                onClick={() => setIsRunning(false)}
                className="flex-1 py-3 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-black text-sm flex items-center justify-center gap-2"
              >
                <Square className="w-4 h-4 fill-white" />
                <span>Pause Rover</span>
              </button>
            )}

            <button
              onClick={handleResetRover}
              className="px-3.5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-1"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Live Dual-Pane Python Preview */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400 mb-2.5">
            <Code2 className="w-4 h-4" />
            <span>Dual-Pane Real-Time Python Preview</span>
          </div>
          <pre className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed">
            {generatedPython}
          </pre>
        </div>
      </div>
    </div>
  );
};
