import React from 'react';
import {
  Bot,
  Cpu,
  Compass,
  Volume2,
  VolumeX,
  Download,
  Upload,
  ShieldAlert,
  Lock,
  Unlock,
  Wifi,
  WifiOff,
  BookOpen,
  Cloud,
} from 'lucide-react';
import { GradePhase, FacilitatorSettings } from '../../types/simulator';
import { CodiBoticsLogo } from './CodiBoticsLogo';

interface HeaderNavProps {
  activePhase: GradePhase;
  onSelectPhase: (phase: GradePhase) => void;
  facilitator: FacilitatorSettings;
  onToggleMute: () => void;
  onOpenFacilitatorModal: () => void;
  onOpenCloudModal: () => void;
  onExportProject: () => void;
  onImportProject: (file: File) => void;
  isOnline: boolean;
  cloudUserDisplayName?: string | null;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  activePhase,
  onSelectPhase,
  facilitator,
  onToggleMute,
  onOpenFacilitatorModal,
  onOpenCloudModal,
  onExportProject,
  onImportProject,
  isOnline,
  cloudUserDisplayName,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const phases: {
    id: GradePhase;
    label: string;
    grades: string;
    icon: React.ReactNode;
    accentColor: string;
  }[] = [
    {
      id: 'foundation',
      label: 'Foundation',
      grades: 'Grades R–3',
      icon: <Bot className="w-5 h-5" />,
      accentColor: 'from-amber-500 to-orange-500 border-amber-400 text-slate-950',
    },
    {
      id: 'intermediate',
      label: 'Intermediate',
      grades: 'Grades 4–6',
      icon: <Cpu className="w-5 h-5" />,
      accentColor: 'from-emerald-500 to-teal-500 border-emerald-400 text-slate-950',
    },
    {
      id: 'senior',
      label: 'Senior',
      grades: 'Grade 7',
      icon: <Compass className="w-5 h-5" />,
      accentColor: 'from-sky-500 to-indigo-500 border-sky-400 text-white',
    },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportProject(file);
      e.target.value = '';
    }
  };

  return (
    <header className="bg-slate-900/95 border-b border-slate-800 px-4 py-2.5 sticky top-0 z-30 backdrop-blur-md">
      <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Brand Identity */}
        <div className="flex items-center gap-3">
          <CodiBoticsLogo className="w-10 h-10 shrink-0 shadow-lg shadow-emerald-500/20 rounded-xl" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg tracking-tight text-white leading-none">
                Codi<span className="text-emerald-400">Botics</span>
              </h1>
              <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                DBE CAPS
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 hidden sm:block">
              Zero-Install Offline Coding & Robotics Simulator
            </p>
          </div>
        </div>

        {/* Grade Phase Switcher */}
        <nav
          aria-label="Curriculum Phase Selector"
          className="flex items-center bg-slate-950/90 p-1 rounded-xl border border-slate-800"
        >
          {phases.map((phase) => {
            const isActive = activePhase === phase.id;
            const isLocked =
              facilitator.lockedPhase !== null && facilitator.lockedPhase !== phase.id;

            return (
              <button
                key={phase.id}
                disabled={isLocked}
                onClick={() => onSelectPhase(phase.id)}
                className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all duration-150 ${
                  isActive
                    ? `bg-gradient-to-r ${phase.accentColor} shadow-md`
                    : isLocked
                    ? 'text-slate-600 cursor-not-allowed opacity-50'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
                title={
                  isLocked
                    ? `Locked by Facilitator to ${facilitator.lockedPhase} phase`
                    : `Switch to ${phase.label} Phase (${phase.grades})`
                }
              >
                {phase.icon}
                <div className="text-left">
                  <div className="leading-tight">{phase.label}</div>
                  <div
                    className={`text-[10px] leading-none ${
                      isActive ? 'opacity-90 font-bold' : 'text-slate-400'
                    }`}
                  >
                    {phase.grades}
                  </div>
                </div>
                {isLocked && <Lock className="w-3.5 h-3.5 ml-1 text-amber-500" />}
              </button>
            );
          })}
        </nav>

        {/* Action Toolbar: Offline Badge, Save/Load, Audio, Facilitator */}
        <div className="flex items-center gap-2">
          {/* 100% Offline Ready Pill */}
          <div
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-medium text-emerald-400"
            title={
              isOnline
                ? 'App cached locally — works 100% offline with zero data consumption'
                : 'Offline Mode Active — Running 100% locally'
            }
          >
            {isOnline ? (
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span>{isOnline ? 'Offline-Ready PWA' : 'Offline Mode'}</span>
          </div>

          {/* Cloud Workspace & Classroom Code */}
          <button
            onClick={onOpenCloudModal}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              cloudUserDisplayName
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25'
                : 'bg-slate-800 hover:bg-slate-700 text-sky-400 border-slate-700'
            }`}
            title="Open Firebase Cloud Projects & Classroom Sharing"
          >
            <Cloud className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {cloudUserDisplayName ? cloudUserDisplayName : 'Cloud Projects'}
            </span>
          </button>

          {/* Save (.codibotics JSON) */}
          <button
            onClick={onExportProject}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
            title="Save project to computer or USB flash drive (.codibotics)"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden lg:inline">Save File</span>
          </button>

          {/* Load (.codibotics JSON) */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
            title="Load project from computer or USB flash drive"
          >
            <Upload className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden lg:inline">Load File</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".codibotics,.pulsemaker,.json"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Audio Mute Toggle */}
          <button
            onClick={onToggleMute}
            className={`p-2 rounded-lg border transition-colors ${
              facilitator.audioMuted
                ? 'bg-rose-500/15 border-rose-500/40 text-rose-400'
                : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
            }`}
            title={facilitator.audioMuted ? 'Unmute Synthesizer Audio' : 'Mute Synthesizer Audio'}
            aria-label="Toggle Sound"
          >
            {facilitator.audioMuted ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            )}
          </button>

          {/* Teacher / Facilitator Panel Button */}
          <button
            onClick={onOpenFacilitatorModal}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              facilitator.lockedPhase
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
            }`}
            title="Teacher / Facilitator Control Panel & Printable CAPS Task Cards"
          >
            {facilitator.lockedPhase ? (
              <Lock className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <BookOpen className="w-3.5 h-3.5 text-sky-400" />
            )}
            <span className="hidden sm:inline">Teacher Panel</span>
          </button>
        </div>
      </div>
    </header>
  );
};
