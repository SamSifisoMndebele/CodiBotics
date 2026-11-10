import React, { useState, useMemo } from 'react';
import {
  ArrowUp,
  ArrowDown,
  RotateCcw,
  RotateCw,
  Volume2,
  Lightbulb,
  Play,
  Square,
  Trash2,
  Delete,
  GripVertical,
  Compass,
  ZoomIn,
  ZoomOut,
  Plus,
  X,
} from 'lucide-react';
import {
  CardinalDirection,
  FloorBotCommand,
  FloorBotCommandType,
} from '../../types/simulator';

interface IconCommandBarProps {
  queue: FloorBotCommand[];
  startDir?: CardinalDirection;
  activeStepIndex: number | null;
  isRunning: boolean;
  onAddCommand: (type: FloorBotCommandType) => void;
  onInsertCommandAt?: (index: number, type: FloorBotCommandType) => void;
  onMoveCommand?: (fromIndex: number, toIndex: number) => void;
  onRemoveCommandAt: (index: number) => void;
  onClearQueue: () => void;
  onUndoLast: () => void;
  onRunSequence: () => void;
  onStopSequence: () => void;
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

const OPPOSITE_DIR: Record<CardinalDirection, CardinalDirection> = {
  N: 'S',
  S: 'N',
  E: 'W',
  W: 'E',
};

const DIR_DELTA: Record<CardinalDirection, { dx: number; dy: number }> = {
  N: { dx: 0, dy: -1 },
  E: { dx: 1, dy: 0 },
  S: { dx: 0, dy: 1 },
  W: { dx: -1, dy: 0 },
};

const DIR_ARROW: Record<CardinalDirection, string> = {
  N: '↑',
  E: '→',
  S: '↓',
  W: '←',
};

const DIR_ROTATION_DEG: Record<CardinalDirection, number> = {
  N: 0,
  E: 90,
  S: 180,
  W: 270,
};

const DIR_LABEL: Record<CardinalDirection, string> = {
  N: 'Up (N)',
  E: 'Right (E)',
  S: 'Down (S)',
  W: 'Left (W)',
};

const COMMAND_META: Record<
  FloorBotCommandType,
  {
    label: string;
    shortLabel: string;
    shortSymbol: string;
    bgClass: string;
    solidColor: string;
    borderColor: string;
    icon: React.ReactNode;
  }
> = {
  FORWARD: {
    label: 'Forward',
    shortLabel: 'Fwd',
    shortSymbol: '↑',
    bgClass:
      'bg-emerald-500 hover:bg-emerald-400 border-emerald-300 text-slate-950',
    solidColor: '#10b981',
    borderColor: '#6ee7b7',
    icon: <ArrowUp className="w-7 h-7 stroke-[3]" />,
  },
  BACKWARD: {
    label: 'Back',
    shortLabel: 'Back',
    shortSymbol: '↓',
    bgClass: 'bg-teal-500 hover:bg-teal-400 border-teal-300 text-slate-950',
    solidColor: '#14b8a6',
    borderColor: '#5eead4',
    icon: <ArrowDown className="w-7 h-7 stroke-[3]" />,
  },
  TURN_LEFT: {
    label: 'Turn Left',
    shortLabel: 'Left',
    shortSymbol: '↺',
    bgClass: 'bg-amber-400 hover:bg-amber-300 border-amber-200 text-slate-950',
    solidColor: '#fbbf24',
    borderColor: '#fde68a',
    icon: <RotateCcw className="w-7 h-7 stroke-[2.75]" />,
  },
  TURN_RIGHT: {
    label: 'Turn Right',
    shortLabel: 'Right',
    shortSymbol: '↻',
    bgClass:
      'bg-orange-400 hover:bg-orange-300 border-orange-200 text-slate-950',
    solidColor: '#fb923c',
    borderColor: '#fed7aa',
    icon: <RotateCw className="w-7 h-7 stroke-[2.75]" />,
  },
  BEEP: {
    label: 'Beep Sound',
    shortLabel: 'Beep',
    shortSymbol: '🔊',
    bgClass: 'bg-sky-400 hover:bg-sky-300 border-sky-200 text-slate-950',
    solidColor: '#38bdf8',
    borderColor: '#bae6fd',
    icon: <Volume2 className="w-7 h-7 stroke-[2.5]" />,
  },
  FLASH: {
    label: 'Light Up',
    shortLabel: 'Light',
    shortSymbol: '💡',
    bgClass:
      'bg-purple-400 hover:bg-purple-300 border-purple-200 text-slate-950',
    solidColor: '#c084fc',
    borderColor: '#e9d5ff',
    icon: <Lightbulb className="w-7 h-7 stroke-[2.5]" />,
  },
};

interface SpatialBlockNode {
  index: number;
  cmd: FloorBotCommand;
  gx: number;
  gy: number;
  inDir: CardinalDirection;
  outDir: CardinalDirection;
  stepDir: CardinalDirection;
  relHint: string;
}

type DragPayload =
  | { kind: 'palette'; cmdType: FloorBotCommandType }
  | { kind: 'queue'; index: number };

export const IconCommandBar: React.FC<IconCommandBarProps> = ({
  queue,
  startDir = 'N',
  activeStepIndex,
  isRunning,
  onAddCommand,
  onInsertCommandAt,
  onMoveCommand,
  onRemoveCommandAt,
  onClearQueue,
  onUndoLast,
  onRunSequence,
  onStopSequence,
}) => {
  const [dragPayload, setDragPayload] = useState<DragPayload | null>(null);
  const [dropHoverTarget, setDropHoverTarget] = useState<
    'append' | 'trash' | number | null
  >(null);
  const [zoomScale, setZoomScale] = useState<number>(1);

  const commandOrder: FloorBotCommandType[] = [
    'FORWARD',
    'BACKWARD',
    'TURN_LEFT',
    'TURN_RIGHT',
    'BEEP',
    'FLASH',
  ];

  // Build the 2D directional layout of connected blocks:
  // - START is at (0, 0) facing `startDir`
  // - Forward places the next block in front (along current facing direction)
  // - Turn Left turns heading 90° left and places the next block to the left
  // - Turn Right turns heading 90° right and places the next block to the right
  // - Back steps opposite to the current facing direction
  const spatialGraph = useMemo(() => {
    const occupied = new Set<string>(['0,0']);
    const nodes: SpatialBlockNode[] = [];

    let curX = 0;
    let curY = 0;
    let curHeading: CardinalDirection = startDir;
    let pendingStepDir: CardinalDirection = startDir;
    let pendingRelHint = 'Start';

    for (let i = 0; i < queue.length; i++) {
      const cmd = queue[i];
      const delta = DIR_DELTA[pendingStepDir];

      // Step in pendingStepDir; if occupied by an earlier block, advance one more cell in that direction
      let nextX = curX + delta.dx;
      let nextY = curY + delta.dy;
      while (occupied.has(`${nextX},${nextY}`)) {
        nextX += delta.dx;
        nextY += delta.dy;
      }
      occupied.add(`${nextX},${nextY}`);

      const inDir = curHeading;
      let outDir: CardinalDirection = inDir;
      let stepDir: CardinalDirection = inDir;
      let nextRelHint = 'In Front';

      if (cmd.type === 'FORWARD') {
        outDir = inDir;
        stepDir = inDir;
        nextRelHint = 'In Front';
      } else if (cmd.type === 'BACKWARD') {
        outDir = inDir;
        stepDir = OPPOSITE_DIR[inDir];
        nextRelHint = 'Behind';
      } else if (cmd.type === 'TURN_LEFT') {
        outDir = TURN_LEFT_MAP[inDir];
        stepDir = outDir;
        nextRelHint = 'To the Left';
      } else if (cmd.type === 'TURN_RIGHT') {
        outDir = TURN_RIGHT_MAP[inDir];
        stepDir = outDir;
        nextRelHint = 'To the Right';
      } else {
        // BEEP or FLASH keeps heading and advances in front
        outDir = inDir;
        stepDir = inDir;
        nextRelHint = 'In Front';
      }

      nodes.push({
        index: i,
        cmd,
        gx: nextX,
        gy: nextY,
        inDir,
        outDir,
        stepDir,
        relHint: pendingRelHint,
      });

      curX = nextX;
      curY = nextY;
      curHeading = outDir;
      pendingStepDir = stepDir;
      pendingRelHint = nextRelHint;
    }

    // Compute the "Next Block" drop slot coordinate in the direction the last block points
    const nextDelta = DIR_DELTA[pendingStepDir];
    let dropX = curX + nextDelta.dx;
    let dropY = curY + nextDelta.dy;
    while (occupied.has(`${dropX},${dropY}`)) {
      dropX += nextDelta.dx;
      dropY += nextDelta.dy;
    }

    // Calculate bounding box of all coordinates (including START at 0,0 and drop slot)
    const allX = [0, dropX, ...nodes.map((n) => n.gx)];
    const allY = [0, dropY, ...nodes.map((n) => n.gy)];
    const minX = Math.min(...allX);
    const maxX = Math.max(...allX);
    const minY = Math.min(...allY);
    const maxY = Math.max(...allY);

    return {
      nodes,
      nextSlot: {
        gx: dropX,
        gy: dropY,
        dir: pendingStepDir,
        heading: curHeading,
        relHint: pendingRelHint,
      },
      bounds: {
        minX,
        maxX,
        minY,
        maxY,
        cols: maxX - minX + 1,
        rows: maxY - minY + 1,
      },
    };
  }, [queue, startDir]);

  // Drag & Drop handlers
  const handlePaletteDragStart = (
    e: React.DragEvent,
    cmdType: FloorBotCommandType
  ) => {
    if (isRunning || queue.length >= 24) {
      e.preventDefault();
      return;
    }
    const payload: DragPayload = { kind: 'palette', cmdType };
    setDragPayload(payload);
    e.dataTransfer.setData('text/plain', JSON.stringify(payload));
    e.dataTransfer.effectAllowed = 'copyMove';
  };

  const handleQueueDragStart = (e: React.DragEvent, index: number) => {
    if (isRunning) {
      e.preventDefault();
      return;
    }
    const payload: DragPayload = { kind: 'queue', index };
    setDragPayload(payload);
    e.dataTransfer.setData('text/plain', JSON.stringify(payload));
    e.dataTransfer.effectAllowed = 'copyMove';
  };

  const handleDragEnd = () => {
    setDragPayload(null);
    setDropHoverTarget(null);
  };

  const parseDragPayload = (e: React.DragEvent): DragPayload | null => {
    if (dragPayload) return dragPayload;
    try {
      const raw = e.dataTransfer.getData('text/plain');
      if (!raw) return null;
      return JSON.parse(raw) as DragPayload;
    } catch {
      return null;
    }
  };

  const handleDropOnAppend = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const payload = parseDragPayload(e);
    setDropHoverTarget(null);
    setDragPayload(null);
    if (!payload || isRunning) return;

    if (payload.kind === 'palette') {
      onAddCommand(payload.cmdType);
    } else if (payload.kind === 'queue' && onMoveCommand) {
      onMoveCommand(payload.index, queue.length - 1);
    }
  };

  const handleDropOnBlock = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    const payload = parseDragPayload(e);
    setDropHoverTarget(null);
    setDragPayload(null);
    if (!payload || isRunning) return;

    if (payload.kind === 'palette') {
      if (onInsertCommandAt) {
        onInsertCommandAt(targetIndex, payload.cmdType);
      } else {
        onAddCommand(payload.cmdType);
      }
    } else if (payload.kind === 'queue' && onMoveCommand) {
      onMoveCommand(payload.index, targetIndex);
    }
  };

  const handleDropOnTrash = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const payload = parseDragPayload(e);
    setDropHoverTarget(null);
    setDragPayload(null);
    if (!payload || isRunning) return;

    if (payload.kind === 'queue') {
      onRemoveCommandAt(payload.index);
    }
  };

  // Layout geometry constants for the 2D Connected Workspace
  const CELL_PITCH = 78; // px center-to-center distance between connected blocks
  const BLOCK_SIZE = 58; // px width/height of each block tile
  const PADDING = 36;

  const canvasWidth =
    Math.max(4, spatialGraph.bounds.cols) * CELL_PITCH + PADDING * 2;
  const canvasHeight =
    Math.max(3, spatialGraph.bounds.rows) * CELL_PITCH + PADDING * 2;

  const toPixelCenter = (gx: number, gy: number) => {
    // Center the bounding box inside the canvas when small
    const extraCols = Math.max(0, 4 - spatialGraph.bounds.cols) * 0.5;
    const extraRows = Math.max(0, 3 - spatialGraph.bounds.rows) * 0.5;
    const cx =
      PADDING +
      (gx - spatialGraph.bounds.minX + extraCols + 0.5) * CELL_PITCH;
    const cy =
      PADDING +
      (gy - spatialGraph.bounds.minY + extraRows + 0.5) * CELL_PITCH;
    return { cx, cy };
  };

  const startCenter = toPixelCenter(0, 0);
  const nextSlotCenter = toPixelCenter(
    spatialGraph.nextSlot.gx,
    spatialGraph.nextSlot.gy
  );

  // Build connector segments between consecutive nodes: START -> node[0] -> ... -> node[n-1] -> nextSlot
  const connectorSegments = useMemo(() => {
    const pts: {
      cx: number;
      cy: number;
      color: string;
      dir: CardinalDirection;
      isDashed?: boolean;
      stepIdx?: number;
    }[] = [
      {
        cx: startCenter.cx,
        cy: startCenter.cy,
        color: '#38bdf8',
        dir: startDir,
      },
      ...spatialGraph.nodes.map((n) => {
        const pt = toPixelCenter(n.gx, n.gy);
        return {
          cx: pt.cx,
          cy: pt.cy,
          color: COMMAND_META[n.cmd.type].solidColor,
          dir: n.stepDir,
          stepIdx: n.index,
        };
      }),
      {
        cx: nextSlotCenter.cx,
        cy: nextSlotCenter.cy,
        color: '#64748b',
        dir: spatialGraph.nextSlot.dir,
        isDashed: true,
      },
    ];

    const segs = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      const midX = (a.cx + b.cx) / 2;
      const midY = (a.cy + b.cy) / 2;
      const angleDeg =
        (Math.atan2(b.cy - a.cy, b.cx - a.cx) * 180) / Math.PI;
      segs.push({
        key: `seg-${i}`,
        x1: a.cx,
        y1: a.cy,
        x2: b.cx,
        y2: b.cy,
        midX,
        midY,
        angleDeg,
        color: b.isDashed ? a.color : b.color,
        isDashed: Boolean(b.isDashed),
        isActive:
          activeStepIndex !== null &&
          (b.stepIdx === activeStepIndex || a.stepIdx === activeStepIndex),
      });
    }
    return segs;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spatialGraph, startDir, activeStepIndex]);

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* 1. Draggable & Tap-Friendly Symbolic Command Pad */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              1. Drag & Drop or Tap Icons to Build Robot Path
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              <GripVertical className="w-3 h-3" /> Drag to Connect
            </span>
          </div>
          <span className="text-xs font-semibold text-amber-400">
            {queue.length} / 24 Steps
          </span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {commandOrder.map((cmdType) => {
            const meta = COMMAND_META[cmdType];
            const disabled = isRunning || queue.length >= 24;
            return (
              <button
                key={cmdType}
                draggable={!disabled}
                onDragStart={(e) => handlePaletteDragStart(e, cmdType)}
                onDragEnd={handleDragEnd}
                disabled={disabled}
                onClick={() => onAddCommand(cmdType)}
                aria-label={meta.label}
                title={`Drag or tap to add "${meta.label}"`}
                className={`group relative flex flex-col items-center justify-center py-3.5 px-2 rounded-2xl border-b-4 active:translate-y-0.5 transition-all shadow-lg cursor-grab active:cursor-grabbing disabled:opacity-40 disabled:cursor-not-allowed ${meta.bgClass}`}
              >
                <div className="flex items-center justify-center">
                  {meta.icon}
                </div>
                <span className="mt-1.5 text-xs font-extrabold tracking-tight">
                  {meta.label}
                </span>
                <span className="text-[10px] font-bold opacity-70 mt-0.5">
                  {cmdType === 'FORWARD'
                    ? 'Next: Front ↑'
                    : cmdType === 'BACKWARD'
                    ? 'Next: Back ↓'
                    : cmdType === 'TURN_LEFT'
                    ? 'Next: Left ←'
                    : cmdType === 'TURN_RIGHT'
                    ? 'Next: Right →'
                    : 'Next: Front ↑'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Connected Directional Code Blocks Workspace */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
              2. Connected Directional Code Path (Drag to Connect, Reorder, or Tap to Remove)
            </span>
            <span className="text-[11px] text-slate-400">
              Blocks snap in the direction Kazi-Bot moves: <strong className="text-emerald-300">Forward</strong> goes in front,{' '}
              <strong className="text-amber-300">Turn Left</strong> branches left,{' '}
              <strong className="text-orange-300">Turn Right</strong> branches right!
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Zoom Controls */}
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-0.5 mr-1">
              <button
                type="button"
                onClick={() =>
                  setZoomScale((z) => Math.max(0.65, Number((z - 0.15).toFixed(2))))
                }
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setZoomScale(1)}
                className="px-1.5 text-[11px] font-bold text-slate-300 hover:text-white"
                title="Reset Zoom"
              >
                {Math.round(zoomScale * 100)}%
              </button>
              <button
                type="button"
                onClick={() =>
                  setZoomScale((z) => Math.min(1.35, Number((z + 0.15).toFixed(2))))
                }
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={onUndoLast}
              disabled={isRunning || queue.length === 0}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 disabled:opacity-40"
              title="Remove Last Step"
            >
              <Delete className="w-4 h-4 text-amber-400" />
              <span>Undo</span>
            </button>
            <button
              onClick={onClearQueue}
              disabled={isRunning || queue.length === 0}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-rose-300 text-xs font-bold border border-slate-700 disabled:opacity-40"
              title="Clear All Steps"
            >
              <Trash2 className="w-4 h-4 text-rose-400" />
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* 2D Spatial Connected Code Map */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (dropHoverTarget === null) setDropHoverTarget('append');
          }}
          onDragLeave={(e) => {
            if (e.currentTarget === e.target) setDropHoverTarget(null);
          }}
          onDrop={handleDropOnAppend}
          className={`relative rounded-2xl bg-slate-950 border-2 transition-colors overflow-auto min-h-[270px] max-h-[400px] ${
            dropHoverTarget === 'append'
              ? 'border-emerald-400/80 bg-emerald-950/10'
              : 'border-slate-800'
          }`}
          style={{
            backgroundImage:
              'radial-gradient(rgba(148, 163, 184, 0.14) 1.5px, transparent 1.5px)',
            backgroundSize: '24px 24px',
          }}
        >
          {/* Compass & Next Direction HUD Pill */}
          <div className="sticky top-2.5 left-2.5 z-20 inline-flex flex-wrap items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 backdrop-blur border border-slate-700/80 text-[11px] font-bold text-slate-300 shadow-lg m-2">
            <span className="flex items-center gap-1 text-sky-300">
              <Compass className="w-3.5 h-3.5" />
              Start: {DIR_LABEL[startDir]}
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-emerald-300">
              Next Block Goes: {spatialGraph.nextSlot.relHint} (
              {DIR_ARROW[spatialGraph.nextSlot.dir]})
            </span>
          </div>

          {/* Drag-to-Trash Dropzone when dragging an existing queue block */}
          {dragPayload?.kind === 'queue' && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDropHoverTarget('trash');
              }}
              onDragLeave={() => setDropHoverTarget(null)}
              onDrop={handleDropOnTrash}
              className={`sticky top-2.5 float-right z-20 m-2 px-3 py-1.5 rounded-xl border-2 text-xs font-extrabold flex items-center gap-1.5 transition-all ${
                dropHoverTarget === 'trash'
                  ? 'bg-rose-500 text-white border-white scale-105 shadow-lg'
                  : 'bg-rose-950/90 text-rose-300 border-rose-500/60'
              }`}
            >
              <Trash2 className="w-4 h-4" />
              <span>Drop Here to Remove</span>
            </div>
          )}

          {/* Scaled 2D Connected Block Stage */}
          <div className="w-full flex items-center justify-center p-2">
            <div
              className="relative transition-transform origin-center"
              style={{
                width: `${canvasWidth}px`,
                height: `${canvasHeight}px`,
                transform: `scale(${zoomScale})`,
              }}
            >
              {/* SVG Layer: Physical Puzzle Bridges & Directional Flow Arrows */}
              <svg
                width={canvasWidth}
                height={canvasHeight}
                className="absolute inset-0 pointer-events-none z-0"
              >
                {connectorSegments.map((seg) => (
                  <g key={seg.key}>
                    {/* Outer dark casing for connected block bridge */}
                    {!seg.isDashed && (
                      <line
                        x1={seg.x1}
                        y1={seg.y1}
                        x2={seg.x2}
                        y2={seg.y2}
                        stroke="#0f172a"
                        strokeWidth={18}
                        strokeLinecap="round"
                      />
                    )}
                    {/* Colored puzzle connection bar */}
                    <line
                      x1={seg.x1}
                      y1={seg.y1}
                      x2={seg.x2}
                      y2={seg.y2}
                      stroke={seg.isActive ? '#ffffff' : seg.color}
                      strokeWidth={seg.isDashed ? 4 : 10}
                      strokeDasharray={seg.isDashed ? '6 5' : undefined}
                      strokeLinecap="round"
                      opacity={seg.isDashed ? 0.65 : 0.95}
                    />
                    {/* Midpoint directional chevron */}
                    <g
                      transform={`translate(${seg.midX}, ${seg.midY}) rotate(${seg.angleDeg})`}
                    >
                      <circle
                        r={8}
                        fill="#0f172a"
                        stroke={seg.color}
                        strokeWidth={2}
                      />
                      <path
                        d="M -3 -3.5 L 3.5 0 L -3 3.5 Z"
                        fill={seg.isActive ? '#ffffff' : seg.color}
                      />
                    </g>
                  </g>
                ))}
              </svg>

              {/* START Anchor Node */}
              <div
                style={{
                  left: `${startCenter.cx - 26}px`,
                  top: `${startCenter.cy - 26}px`,
                  width: '52px',
                  height: '52px',
                }}
                title={`Robot Start Facing ${DIR_LABEL[startDir]}`}
                className="absolute z-10 rounded-2xl bg-sky-500/20 border-2 border-sky-400 text-sky-200 flex flex-col items-center justify-center shadow-lg select-none"
              >
                <span className="text-base leading-none">
                  🐝 {DIR_ARROW[startDir]}
                </span>
                <span className="text-[9px] font-black uppercase tracking-wider mt-0.5 text-sky-300">
                  START
                </span>
              </div>

              {/* Connected Directional Code Blocks */}
              {spatialGraph.nodes.map((node) => {
                const meta = COMMAND_META[node.cmd.type];
                const isCurrent = activeStepIndex === node.index;
                const isDropTarget = dropHoverTarget === node.index;
                const { cx, cy } = toPixelCenter(node.gx, node.gy);

                return (
                  <div
                    key={node.cmd.id}
                    draggable={!isRunning}
                    onDragStart={(e) => handleQueueDragStart(e, node.index)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDropHoverTarget(node.index);
                    }}
                    onDragLeave={() => setDropHoverTarget(null)}
                    onDrop={(e) => handleDropOnBlock(e, node.index)}
                    onClick={() => {
                      if (!isRunning) onRemoveCommandAt(node.index);
                    }}
                    style={{
                      left: `${cx - BLOCK_SIZE / 2}px`,
                      top: `${cy - BLOCK_SIZE / 2}px`,
                      width: `${BLOCK_SIZE}px`,
                      height: `${BLOCK_SIZE}px`,
                    }}
                    title={`Step ${node.index + 1}: ${meta.label} (${node.relHint}, heading ${node.outDir}). Drag to reorder or tap to remove.`}
                    className={`group absolute z-10 rounded-2xl border-2 flex flex-col items-center justify-center font-bold select-none cursor-grab active:cursor-grabbing transition-all shadow-xl ${
                      meta.bgClass
                    } ${
                      isCurrent
                        ? 'ring-4 ring-white scale-115 z-20 shadow-2xl'
                        : isDropTarget
                        ? 'ring-4 ring-emerald-300 scale-110 z-20'
                        : 'hover:scale-105'
                    }`}
                  >
                    {/* Step Badge Top-Left */}
                    <span className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-slate-950 text-white border border-white/40 text-[10px] font-black flex items-center justify-center shadow">
                      {node.index + 1}
                    </span>

                    {/* Quick Remove Badge on Hover */}
                    {!isRunning && (
                      <span className="opacity-0 group-hover:opacity-100 absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center shadow transition-opacity">
                        <X className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                    )}

                    {/* Directional Command Icon oriented to show actual heading */}
                    <div className="flex items-center justify-center leading-none mt-0.5">
                      {node.cmd.type === 'FORWARD' ||
                      node.cmd.type === 'BACKWARD' ? (
                        <ArrowUp
                          className="w-6 h-6 stroke-[3] transition-transform"
                          style={{
                            transform: `rotate(${DIR_ROTATION_DEG[node.stepDir]}deg)`,
                          }}
                        />
                      ) : node.cmd.type === 'TURN_LEFT' ? (
                        <div className="flex items-center gap-0.5 text-sm font-black">
                          <span>{DIR_ARROW[node.inDir]}</span>
                          <RotateCcw className="w-4 h-4 stroke-[3]" />
                          <span>{DIR_ARROW[node.outDir]}</span>
                        </div>
                      ) : node.cmd.type === 'TURN_RIGHT' ? (
                        <div className="flex items-center gap-0.5 text-sm font-black">
                          <span>{DIR_ARROW[node.inDir]}</span>
                          <RotateCw className="w-4 h-4 stroke-[3]" />
                          <span>{DIR_ARROW[node.outDir]}</span>
                        </div>
                      ) : (
                        <span className="text-base leading-none">
                          {meta.shortSymbol}
                        </span>
                      )}
                    </div>

                    {/* Direction & Command Label */}
                    <span className="text-[9px] font-black uppercase tracking-tighter leading-none mt-1 opacity-90">
                      {meta.shortLabel} {DIR_ARROW[node.stepDir]}
                    </span>
                  </div>
                );
              })}

              {/* Pulsing "Next Connected Block" Drop Target Slot */}
              {queue.length < 24 && (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDropHoverTarget('append');
                  }}
                  onDrop={handleDropOnAppend}
                  style={{
                    left: `${nextSlotCenter.cx - BLOCK_SIZE / 2}px`,
                    top: `${nextSlotCenter.cy - BLOCK_SIZE / 2}px`,
                    width: `${BLOCK_SIZE}px`,
                    height: `${BLOCK_SIZE}px`,
                  }}
                  title={`Drop next block here (${spatialGraph.nextSlot.relHint})`}
                  className={`absolute z-10 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center transition-all select-none ${
                    dropHoverTarget === 'append'
                      ? 'border-emerald-400 bg-emerald-500/25 text-emerald-200 scale-110 shadow-lg'
                      : 'border-slate-600 bg-slate-900/75 text-slate-400 hover:border-amber-400/70 hover:text-amber-300'
                  }`}
                >
                  <Plus className="w-4 h-4 mb-0.5" />
                  <span className="text-[9px] font-extrabold leading-tight px-1">
                    {spatialGraph.nextSlot.relHint}
                  </span>
                  <span className="text-[10px] font-black text-emerald-400 leading-none">
                    {DIR_ARROW[spatialGraph.nextSlot.dir]}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Connected Linear Strip (Synchronized Quick-View & Reorder Bar) */}
        <div className="mt-3 p-2.5 rounded-xl bg-slate-950/90 border border-slate-800/90">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Connected Step Chain ({queue.length} steps — drag blocks to reorder or tap to delete)
            </span>
          </div>
          <div className="flex items-center overflow-x-auto py-1 scrollbar-thin">
            {/* Start Badge */}
            <div className="shrink-0 px-2.5 py-1.5 rounded-l-xl bg-sky-500/20 border border-sky-400/60 text-sky-300 text-[11px] font-black flex items-center gap-1">
              <span>🐝</span>
              <span>{DIR_ARROW[startDir]}</span>
            </div>

            {spatialGraph.nodes.length === 0 ? (
              <div className="ml-3 text-xs text-slate-500 font-medium py-1">
                Drag an icon from above into the dashed slot to connect your first block!
              </div>
            ) : (
              spatialGraph.nodes.map((node, idx) => {
                const meta = COMMAND_META[node.cmd.type];
                const isCurrent = activeStepIndex === idx;
                return (
                  <React.Fragment key={`strip-${node.cmd.id}`}>
                    {/* Interlocking connector link */}
                    <div className="shrink-0 w-3 h-2 bg-slate-700 flex items-center justify-center text-[9px] text-slate-300 font-black">
                      ›
                    </div>
                    <button
                      type="button"
                      draggable={!isRunning}
                      onDragStart={(e) => handleQueueDragStart(e, idx)}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDropHoverTarget(idx);
                      }}
                      onDrop={(e) => handleDropOnBlock(e, idx)}
                      disabled={isRunning}
                      onClick={() => onRemoveCommandAt(idx)}
                      title={`Step ${idx + 1}: ${meta.label} (${node.relHint}, ${DIR_ARROW[node.stepDir]})`}
                      className={`relative shrink-0 px-2.5 py-1.5 rounded-xl border-2 flex items-center gap-1 font-extrabold text-xs cursor-grab active:cursor-grabbing transition-all ${
                        meta.bgClass
                      } ${
                        isCurrent
                          ? 'ring-2 ring-white scale-105 z-10'
                          : dropHoverTarget === idx
                          ? 'ring-2 ring-emerald-300 scale-105'
                          : 'opacity-95 hover:opacity-100'
                      }`}
                    >
                      <span className="text-[10px] font-black px-1 rounded bg-slate-950/20">
                        {idx + 1}
                      </span>
                      <span>{meta.shortSymbol}</span>
                      <span className="text-[10px] font-black opacity-80">
                        {DIR_ARROW[node.stepDir]}
                      </span>
                    </button>
                  </React.Fragment>
                );
              })
            )}
          </div>
        </div>

        {/* Big Play / Stop Controls */}
        <div className="mt-4 flex items-center gap-3">
          {!isRunning ? (
            <button
              onClick={onRunSequence}
              disabled={queue.length === 0}
              className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-slate-950 font-black text-lg tracking-wide shadow-lg shadow-emerald-500/25 border-b-4 border-emerald-700 active:translate-y-0.5 flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <Play className="w-7 h-7 fill-slate-950" />
              <span>GO! RUN KAZI-BOT</span>
            </button>
          ) : (
            <button
              onClick={onStopSequence}
              className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white font-black text-lg tracking-wide shadow-lg shadow-rose-500/25 border-b-4 border-rose-800 flex items-center justify-center gap-3 transition-all"
            >
              <Square className="w-7 h-7 fill-white" />
              <span>STOP / RESET BOT</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
