import React from 'react';
import { Terminal, Trash2 } from 'lucide-react';
import { TraceLogEntry, MicrocontrollerState } from '../../types/simulator';

interface TraceConsoleProps {
  logs: TraceLogEntry[];
  mcState: MicrocontrollerState;
  onClearLogs: () => void;
}

export const TraceConsole: React.FC<TraceConsoleProps> = ({
  logs,
  mcState,
  onClearLogs,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span>Live Execution Trace & Hardware State Inspector</span>
        </div>

        <button
          onClick={onClearLogs}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700"
        >
          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
          <span>Clear Log</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Console Output Stream */}
        <div className="md:col-span-8 bg-slate-950 border border-slate-800 rounded-xl p-3 h-36 overflow-y-auto font-mono text-xs space-y-1.5">
          {logs.length === 0 ? (
            <div className="text-slate-500 italic">
              Ready. Press "Run Program" or "Step Next" to inspect block execution...
            </div>
          ) : (
            logs.map((entry) => (
              <div key={entry.id} className="flex items-start gap-2">
                <span className="text-slate-500 shrink-0">[{entry.timestamp}]</span>
                <span
                  className={
                    entry.level === 'action'
                      ? 'text-emerald-400'
                      : entry.level === 'sensor'
                      ? 'text-sky-400'
                      : entry.level === 'warn'
                      ? 'text-amber-400'
                      : 'text-slate-200'
                  }
                >
                  {entry.message}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Live Hardware Register Pill Table */}
        <div className="md:col-span-4 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs space-y-1.5 font-mono">
          <div className="text-[11px] font-bold uppercase text-slate-400 border-b border-slate-800 pb-1">
            Live Registers
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">button_a:</span>
            <span className={mcState.buttonA ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
              {String(mcState.buttonA)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">button_b:</span>
            <span className={mcState.buttonB ? 'text-sky-400 font-bold' : 'text-slate-500'}>
              {String(mcState.buttonB)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">temperature:</span>
            <span className="text-amber-400">{mcState.temperature} °C</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">light_level:</span>
            <span className="text-sky-300">{mcState.lightLevel}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">pins (P0,P1,P2):</span>
            <span className="text-emerald-300">
              [{mcState.pins.P0}, {mcState.pins.P1}, {mcState.pins.P2}]
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
