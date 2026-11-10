import React from 'react';
import { X, Lock, Unlock, Printer, CheckCircle2 } from 'lucide-react';
import { FacilitatorSettings, GradePhase } from '../../types/simulator';
import { CodiBoticsLogo } from './CodiBoticsLogo';

interface FacilitatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: FacilitatorSettings;
  onUpdateSettings: React.Dispatch<React.SetStateAction<FacilitatorSettings>>;
}

export const FacilitatorModal: React.FC<FacilitatorModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  const phases: { id: GradePhase | null; label: string }[] = [
    { id: null, label: 'Unlocked (All Phases Accessible)' },
    { id: 'foundation', label: 'Lock to Foundation Phase (Grades R–3)' },
    { id: 'intermediate', label: 'Lock to Intermediate Phase (Grades 4–6)' },
    { id: 'senior', label: 'Lock to Senior Phase (Grade 7)' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <CodiBoticsLogo className="w-10 h-10 shrink-0 rounded-xl" />
            <div>
              <h2 className="text-xl font-black text-white">
                CodiBotics Teacher & Facilitator Panel
              </h2>
              <p className="text-xs text-slate-400">
                DBE CAPS Coding & Robotics Classroom Management & Offline Activity Cards
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Phase Locking */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Classroom Phase Lock (Prevent learners from switching grade modes)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {phases.map((p) => {
              const active = settings.lockedPhase === p.id;
              return (
                <button
                  key={String(p.id)}
                  onClick={() =>
                    onUpdateSettings((prev) => ({ ...prev, lockedPhase: p.id }))
                  }
                  className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-bold text-left transition-all ${
                    active
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {p.id === null ? (
                    <Unlock className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                  )}
                  <span>{p.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Grid Coordinates Toggle */}
        <div className="flex items-center justify-between bg-slate-950 p-4 rounded-2xl border border-slate-800">
          <div>
            <div className="text-sm font-bold text-white">
              Show A1–E5 Grid Coordinates on Foundation Mat
            </div>
            <div className="text-xs text-slate-400">
              Helpful for Grade 2 & Grade 3 map reading and spatial coordinates
            </div>
          </div>
          <button
            onClick={() =>
              onUpdateSettings((prev) => ({
                ...prev,
                showGridCoordinates: !prev.showGridCoordinates,
              }))
            }
            className={`px-4 py-2 rounded-xl text-xs font-extrabold border ${
              settings.showGridCoordinates
                ? 'bg-emerald-500 text-slate-950 border-emerald-300'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            {settings.showGridCoordinates ? 'SHOWN' : 'HIDDEN'}
          </button>
        </div>

        {/* Printable CAPS Task Cards */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              CAPS Curriculum Assessment Task Cards
            </span>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Task Cards</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-1.5">
              <div className="font-black text-amber-400">Grades R–3 Task</div>
              <div className="font-bold text-white">Ekasi Library Delivery</div>
              <p className="text-slate-400">
                Program Kazi-Bot to visit the Spaza Shop (★1) and Soccer Pitch (★2), flash its light, and reach the Library in under 14 steps.
              </p>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-1.5">
              <div className="font-black text-emerald-400">Grades 4–6 Task</div>
              <div className="font-bold text-white">Solar Heatwave Alarm</div>
              <p className="text-slate-400">
                Use an If/Else block so when Temperature &gt; 30°C, the 5x5 matrix shows a Sun icon and sounds an 880 Hz buzzer tone.
              </p>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-1.5">
              <div className="font-black text-sky-400">Grade 7 Task</div>
              <div className="font-bold text-white">Autonomous Maze & Logic</div>
              <p className="text-slate-400">
                Place 3 maze walls and test Ultrasonic Obstacle Avoidance. Then build a 2-input XOR gate circuit in the Logic Playground.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Done</span>
          </button>
        </div>
      </div>
    </div>
  );
};
