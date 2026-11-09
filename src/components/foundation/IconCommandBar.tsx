import React from 'react';
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
} from 'lucide-react';
import { FloorBotCommand, FloorBotCommandType } from '../../types/simulator';

interface IconCommandBarProps {
  queue: FloorBotCommand[];
  activeStepIndex: number | null;
  isRunning: boolean;
  onAddCommand: (type: FloorBotCommandType) => void;
  onRemoveCommandAt: (index: number) => void;
  onClearQueue: () => void;
  onUndoLast: () => void;
  onRunSequence: () => void;
  onStopSequence: () => void;
}

const COMMAND_META: Record<
  FloorBotCommandType,
  {
    label: string;
    shortSymbol: string;
    bgClass: string;
    icon: React.ReactNode;
  }
> = {
  FORWARD: {
    label: 'Forward',
    shortSymbol: '↑',
    bgClass: 'bg-emerald-500 hover:bg-emerald-400 border-emerald-300 text-slate-950',
    icon: <ArrowUp className="w-8 h-8 stroke-[3]" />,
  },
  BACKWARD: {
    label: 'Back',
    shortSymbol: '↓',
    bgClass: 'bg-teal-500 hover:bg-teal-400 border-teal-300 text-slate-950',
    icon: <ArrowDown className="w-8 h-8 stroke-[3]" />,
  },
  TURN_LEFT: {
    label: 'Turn Left',
    shortSymbol: '↺',
    bgClass: 'bg-amber-400 hover:bg-amber-300 border-amber-200 text-slate-950',
    icon: <RotateCcw className="w-8 h-8 stroke-[2.75]" />,
  },
  TURN_RIGHT: {
    label: 'Turn Right',
    shortSymbol: '↻',
    bgClass: 'bg-orange-400 hover:bg-orange-300 border-orange-200 text-slate-950',
    icon: <RotateCw className="w-8 h-8 stroke-[2.75]" />,
  },
  BEEP: {
    label: 'Beep Sound',
    shortSymbol: '🔊',
    bgClass: 'bg-sky-400 hover:bg-sky-300 border-sky-200 text-slate-950',
    icon: <Volume2 className="w-8 h-8 stroke-[2.5]" />,
  },
  FLASH: {
    label: 'Light Up',
    shortSymbol: '💡',
    bgClass: 'bg-purple-400 hover:bg-purple-300 border-purple-200 text-slate-950',
    icon: <Lightbulb className="w-8 h-8 stroke-[2.5]" />,
  },
};

export const IconCommandBar: React.FC<IconCommandBarProps> = ({
  queue,
  activeStepIndex,
  isRunning,
  onAddCommand,
  onRemoveCommandAt,
  onClearQueue,
  onUndoLast,
  onRunSequence,
  onStopSequence,
}) => {
  const commandOrder: FloorBotCommandType[] = [
    'FORWARD',
    'BACKWARD',
    'TURN_LEFT',
    'TURN_RIGHT',
    'BEEP',
    'FLASH',
  ];

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Touch-Friendly Symbolic Command Pad */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            1. Tap Icons to Build Robot Path
          </span>
          <span className="text-xs font-semibold text-amber-400">
            {queue.length} / 24 Steps
          </span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {commandOrder.map((cmdType) => {
            const meta = COMMAND_META[cmdType];
            return (
              <button
                key={cmdType}
                disabled={isRunning || queue.length >= 24}
                onClick={() => onAddCommand(cmdType)}
                aria-label={meta.label}
                title={meta.label}
                className={`group flex flex-col items-center justify-center py-4 px-2 rounded-2xl border-b-4 active:translate-y-0.5 transition-all shadow-lg disabled:opacity-40 disabled:cursor-not-allowed ${meta.bgClass}`}
              >
                {meta.icon}
                <span className="mt-1.5 text-xs font-extrabold tracking-tight">
                  {meta.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Visual Execution Sequence Queue Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            2. Command Sequence Queue (Tap any block to remove)
          </span>

          <div className="flex items-center gap-2">
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

        {/* Queue Tiles */}
        <div className="min-h-[76px] p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2 overflow-x-auto">
          {queue.length === 0 ? (
            <div className="w-full text-center py-3 text-slate-500 text-sm font-medium">
              Tap the big arrow buttons above to queue steps for Kazi-Bot!
            </div>
          ) : (
            queue.map((cmd, idx) => {
              const meta = COMMAND_META[cmd.type];
              const isCurrent = activeStepIndex === idx;
              return (
                <button
                  key={cmd.id}
                  disabled={isRunning}
                  onClick={() => onRemoveCommandAt(idx)}
                  title={`Step ${idx + 1}: ${meta.label} (Click to remove)`}
                  className={`relative shrink-0 w-12 h-12 rounded-xl flex flex-col items-center justify-center font-bold border-2 transition-all ${
                    meta.bgClass
                  } ${
                    isCurrent
                      ? 'ring-4 ring-white scale-110 z-10 shadow-xl'
                      : 'opacity-90 hover:opacity-100'
                  }`}
                >
                  <span className="text-lg leading-none">{meta.shortSymbol}</span>
                  <span className="text-[10px] font-black opacity-75 leading-none mt-0.5">
                    {idx + 1}
                  </span>
                </button>
              );
            })
          )}
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
