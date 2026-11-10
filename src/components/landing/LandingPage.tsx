import React, { useState } from 'react';
import {
  Bot,
  Cpu,
  Compass,
  Play,
  WifiOff,
  CheckCircle2,
  Terminal,
  Copy,
  Check,
  BookOpen,
  Cloud,
  Sparkles,
  ArrowRight,
  Layers,
  ShieldCheck,
  GraduationCap,
  ChevronDown,
  Zap,
  Globe,
  Code2,
  MonitorSmartphone,
} from 'lucide-react';
import { GradePhase, SeniorSubMode } from '../../types/simulator';
import { CodiBoticsLogo } from '../common/CodiBoticsLogo';

interface LandingPageProps {
  onLaunchApp: (options?: {
    phase?: GradePhase;
    seniorSubMode?: SeniorSubMode;
    openTeacherModal?: boolean;
  }) => void;
  isOnline: boolean;
}

const PYTHON_EXAMPLES = {
  intermediate: `from codibotics import display, music, sensors, Icon
import time

# Simulated DBE CAPS Grade 4–6 Microcontroller
if sensors.temperature() > 30:
    display.show(Icon.SUN)
    music.pitch(880, duration=300)
    print("Heatwave Alert! Temp > 30°C")
else:
    display.show(Icon.SMILE)
    print("Classroom Temperature Normal")

time.sleep_ms(1000)
display.clear()`,
  senior: `from codibotics_rover import Rover
import time

# Simulated DBE CAPS Grade 7 Autonomous Rover
rover = Rover()

for _ in range(10):
    dist = rover.ultrasonic.distance_cm()
    print(f"Ultrasonic distance: {dist} cm")

    if dist < 65:
        # Obstacle detected: pivot turn right
        rover.motors(v_left=65, v_right=-65)
    else:
        # Clear path: drive straight forward
        rover.motors(v_left=70, v_right=70)

    time.sleep_ms(200)`,
};

const FAQS = [
  {
    q: 'How does CodiBotics align with the South African DBE CAPS curriculum?',
    a: 'CodiBotics is purpose-built around the Department of Basic Education (DBE) Coding & Robotics CAPS curriculum from Grade R to Grade 7. It is structured into three age-appropriate workspaces: Foundation Phase (Grades R–3) tactile directional floor-robot sequencing on South African themed mats; Intermediate Phase (Grades 4–6) Blockly visual coding with a 5x5 LED matrix microcontroller, environmental sensors, and live MicroPython transpilation; and Senior Phase (Grade 7) 2D differential-drive autonomous rover physics and Boolean digital logic gate design.',
  },
  {
    q: 'Does CodiBotics work offline without internet or during load-shedding?',
    a: 'Yes! CodiBotics is engineered as an Offline-First Progressive Web App (PWA). Once loaded once in any browser, the entire simulator caches locally on the device and runs 100% offline with zero data costs. Learners and teachers can also save and load .codibotics project files directly to school PCs or USB flash drives.',
  },
  {
    q: 'Do schools need physical robotics hardware to use CodiBotics?',
    a: 'Zero hardware is required to start teaching immediately. Every learner gets a personal virtual Floor Bot, 5x5 LED Microcontroller with sensors and piezo audio synthesizer, 2D Ultrasonic Rover, and Digital Logic Gate breadboard right in the browser. When schools are ready to transition to desktop Python or physical MicroPython boards, learners can use the exact same API via pip install codibotics.',
  },
  {
    q: 'How can teachers manage classrooms and prevent learners from switching phases?',
    a: 'The built-in Teacher & Facilitator Control Panel allows educators to lock the simulator to a specific Grade Phase (Foundation, Intermediate, or Senior), toggle A1–E5 grid coordinates, mute classroom audio, share projects via 6-character Cloud Classroom codes, and print unplugged CAPS activity task cards.',
  },
  {
    q: 'Is CodiBotics free for South African schools and learners?',
    a: 'Yes. The CodiBotics Web App simulator and the companion Python library (pip install codibotics) are free and accessible in any modern browser on Windows PCs, Chromebooks, Macs, and Android tablets.',
  },
];

export const LandingPage: React.FC<LandingPageProps> = ({
  onLaunchApp,
  isOnline,
}) => {
  const [activeCodeTab, setActiveCodeTab] = useState<'intermediate' | 'senior'>(
    'intermediate'
  );
  const [copiedPip, setCopiedPip] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const handleCopyPip = () => {
    navigator.clipboard?.writeText('pip install codibotics');
    setCopiedPip(true);
    setTimeout(() => setCopiedPip(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(PYTHON_EXAMPLES[activeCodeTab]);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Top Sticky Header */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <a
            href="#top"
            className="flex items-center gap-3 group focus:outline-none"
            aria-label="CodiBotics Home"
          >
            <CodiBoticsLogo className="w-10 h-10 shrink-0 rounded-xl shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-white">
                  Codi<span className="text-emerald-400">Botics</span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  DBE CAPS R–7
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                South African Coding, Logic &amp; Robotics Platform
              </p>
            </div>
          </a>

          {/* Navigation Links */}
          <nav
            aria-label="Landing Page Navigation"
            className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-300"
          >
            <a
              href="#curriculum"
              className="hover:text-emerald-400 transition-colors"
            >
              CAPS Phases (R–7)
            </a>
            <a
              href="#features"
              className="hover:text-emerald-400 transition-colors"
            >
              Classroom Toolkit
            </a>
            <a
              href="#python-sdk"
              className="hover:text-emerald-400 transition-colors"
            >
              Python SDK
            </a>
            <a
              href="#faq"
              className="hover:text-emerald-400 transition-colors"
            >
              FAQ
            </a>
          </nav>

          {/* Right CTA Buttons */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-medium text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{isOnline ? '100% Offline-Ready PWA' : 'Offline Mode Ready'}</span>
            </div>

            <button
              onClick={() => onLaunchApp()}
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-extrabold text-sm shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all active:scale-95"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>Launch Web App</span>
            </button>
          </div>
        </div>
      </header>

      <main id="top" className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 border-b border-slate-900">
          {/* Ambient Background Glows */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-gradient-to-tr from-emerald-500/15 via-sky-500/10 to-amber-500/10 blur-3xl rounded-full"
          />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Left Column: Hero Copy & CTAs */}
              <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold tracking-wide uppercase">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Aligned with SA Department of Basic Education CAPS</span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.1]">
                  Zero-Install{' '}
                  <span className="bg-gradient-to-r from-emerald-400 via-sky-400 to-amber-400 bg-clip-text text-transparent">
                    Coding, Logic &amp; Robotics
                  </span>{' '}
                  for South African Schools
                </h1>

                <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                  Empower every Grade R to Grade 7 learner with an interactive,{' '}
                  <strong className="text-white font-semibold">
                    100% offline-first web simulator
                  </strong>
                  . From tactile Floor Bots on South African maps to Blockly
                  5x5 LED microcontrollers, 2D autonomous rovers, digital logic
                  gates, and real MicroPython — with zero hardware cost.
                </p>

                {/* Primary Hero CTA Buttons */}
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
                  <button
                    onClick={() => onLaunchApp()}
                    className="group inline-flex items-center gap-3 px-7 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-base sm:text-lg shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all active:scale-95"
                  >
                    <Play className="w-5 h-5 fill-slate-950" />
                    <span>Open CodiBotics Web App</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>

                  <a
                    href="#curriculum"
                    className="inline-flex items-center gap-2 px-6 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold text-base border border-slate-700/80 transition-colors"
                  >
                    <Layers className="w-5 h-5 text-sky-400" />
                    <span>Explore Grades R–7</span>
                  </a>
                </div>

                {/* Quick Phase Jump Pills */}
                <div className="pt-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                    Quick-Launch Directly Into a Curriculum Phase:
                  </p>
                  <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5">
                    <button
                      onClick={() => onLaunchApp({ phase: 'foundation' })}
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold transition-all"
                    >
                      <Bot className="w-4 h-4 text-amber-400" />
                      <span>Foundation (Grades R–3)</span>
                    </button>
                    <button
                      onClick={() => onLaunchApp({ phase: 'intermediate' })}
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition-all"
                    >
                      <Cpu className="w-4 h-4 text-emerald-400" />
                      <span>Intermediate (Grades 4–6)</span>
                    </button>
                    <button
                      onClick={() =>
                        onLaunchApp({ phase: 'senior', seniorSubMode: 'rover' })
                      }
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-300 text-xs font-bold transition-all"
                    >
                      <Compass className="w-4 h-4 text-sky-400" />
                      <span>Senior Grade 7 (Rover &amp; Logic)</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Interactive Simulator Preview Showcase */}
              <div className="lg:col-span-5">
                <div className="relative rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl p-5 sm:p-6 space-y-5">
                  {/* Mock Browser Window Header */}
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                      <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                      <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                      <span className="ml-2 text-xs font-mono text-slate-400">
                        codibotics.web.app/app
                      </span>
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      Interactive PWA
                    </span>
                  </div>

                  {/* Interactive Phase Cards inside Preview */}
                  <div className="space-y-3">
                    {/* Foundation Preview Card */}
                    <div
                      onClick={() => onLaunchApp({ phase: 'foundation' })}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) =>
                        e.key === 'Enter' && onLaunchApp({ phase: 'foundation' })
                      }
                      className="group cursor-pointer rounded-2xl bg-slate-950/90 hover:bg-slate-950 border border-slate-800 hover:border-amber-500/50 p-4 transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                            <Bot className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h2 className="text-sm font-extrabold text-white group-hover:text-amber-300 transition-colors">
                                Foundation Phase Floor Bot
                              </h2>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                                Grades R–3
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">
                              Township Solar, Kruger Safari &amp; Cape Town Harbour 5x5 Mats
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                      </div>
                    </div>

                    {/* Intermediate Preview Card */}
                    <div
                      onClick={() => onLaunchApp({ phase: 'intermediate' })}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) =>
                        e.key === 'Enter' &&
                        onLaunchApp({ phase: 'intermediate' })
                      }
                      className="group cursor-pointer rounded-2xl bg-slate-950/90 hover:bg-slate-950 border border-slate-800 hover:border-emerald-500/50 p-4 transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                            <Cpu className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h2 className="text-sm font-extrabold text-white group-hover:text-emerald-300 transition-colors">
                                5x5 Microcontroller &amp; Blockly
                              </h2>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                                Grades 4–6
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">
                              Virtual LED Matrix, Temp/Light Sensors, Buzzer &amp; MicroPython
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                      </div>
                    </div>

                    {/* Senior Preview Card */}
                    <div
                      onClick={() =>
                        onLaunchApp({ phase: 'senior', seniorSubMode: 'rover' })
                      }
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) =>
                        e.key === 'Enter' &&
                        onLaunchApp({ phase: 'senior', seniorSubMode: 'rover' })
                      }
                      className="group cursor-pointer rounded-2xl bg-slate-950/90 hover:bg-slate-950 border border-slate-800 hover:border-sky-500/50 p-4 transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
                            <Compass className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h2 className="text-sm font-extrabold text-white group-hover:text-sky-300 transition-colors">
                                2D Autonomous Rover &amp; Logic Gates
                              </h2>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-500/20 text-sky-300">
                                Grade 7
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">
                              Ultrasonic Raycasting, Line Following &amp; Boolean Circuits
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-sky-400 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                      </div>
                    </div>
                  </div>

                  {/* Mini LED / Telemetry Status Footer */}
                  <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-800/80">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <WifiOff className="w-4 h-4 text-emerald-400" />
                      <span>Zero data usage after load</span>
                    </div>
                    <button
                      onClick={() => onLaunchApp()}
                      className="text-xs font-extrabold text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1"
                    >
                      <span>Launch Full Simulator</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Key Metrics / Trust Strip */}
            <div className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  badge: 'Grades R–7',
                  title: '100% DBE CAPS Aligned',
                  desc: 'Covers Foundation, Intermediate & Senior Phase requirements.',
                  color: 'text-emerald-400',
                },
                {
                  badge: 'Offline-First PWA',
                  title: 'Load-Shedding Resilient',
                  desc: 'Works without internet or mobile data after initial open.',
                  color: 'text-amber-400',
                },
                {
                  badge: 'R0 Hardware Cost',
                  title: 'No Physical Kits Required',
                  desc: 'Every learner gets a virtual robot, microcontroller & breadboard.',
                  color: 'text-sky-400',
                },
                {
                  badge: 'pip install codibotics',
                  title: 'Real Python & MicroPython',
                  desc: 'Run browser-generated code on PCs or microcontrollers.',
                  color: 'text-indigo-400',
                },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="rounded-2xl bg-slate-900/70 border border-slate-800/90 p-5"
                >
                  <div className={`text-xs font-extrabold uppercase tracking-wider ${stat.color}`}>
                    {stat.badge}
                  </div>
                  <div className="text-base sm:text-lg font-black text-white mt-1">
                    {stat.title}
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {stat.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Detailed Curriculum Phases Section */}
        <section
          id="curriculum"
          className="py-20 bg-slate-950 border-b border-slate-900"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-400">
                Complete Primary School Progression
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white">
                One Simulator for Every DBE CAPS Grade Phase
              </h2>
              <p className="text-sm sm:text-base text-slate-400">
                Designed specifically for South African learners to progress
                naturally from concrete icon sequencing in Grade R to visual
                block programming, physical computing, and autonomous robotics
                by Grade 7.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Phase 1 Card */}
              <article className="rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 p-6 sm:p-7 flex flex-col justify-between transition-all">
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      Foundation Phase • Grades R–3
                    </span>
                    <Bot className="w-6 h-6 text-amber-400" />
                  </div>

                  <div>
                    <h3 className="text-xl font-black text-white">
                      Tactile Floor Bot &amp; SA Grid Maps
                    </h3>
                    <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                      Young learners build algorithmic thinking without reading
                      barriers using large, colourful directional command cards
                      and interactive 5x5 grid mats.
                    </p>
                  </div>

                  <ul className="space-y-2.5 text-xs sm:text-sm text-slate-300">
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>
                        <strong>South African Maps:</strong> Township Solar Grid,
                        Kruger Wildlife Safari, and Cape Town Harbour.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>
                        <strong>Icon Command Queue:</strong> Forward, Turn Left,
                        Turn Right, Beep Horn, and Solar LED Flash.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>
                        <strong>Spatial Literacy:</strong> Toggleable A1–E5 grid
                        coordinates, obstacle avoidance &amp; checkpoint goals.
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-800">
                  <button
                    onClick={() => onLaunchApp({ phase: 'foundation' })}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold text-sm shadow-md transition-all"
                  >
                    <span>Launch Foundation Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </article>

              {/* Phase 2 Card */}
              <article className="rounded-3xl bg-slate-900/90 border border-emerald-500/40 p-6 sm:p-7 flex flex-col justify-between shadow-xl shadow-emerald-500/5 transition-all">
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      Intermediate Phase • Grades 4–6
                    </span>
                    <Cpu className="w-6 h-6 text-emerald-400" />
                  </div>

                  <div>
                    <h3 className="text-xl font-black text-white">
                      Blockly &amp; 5x5 LED Microcontroller
                    </h3>
                    <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                      Bridge visual block programming and physical computing
                      with a virtual pocket microcontroller, environmental
                      sensors, and real-time MicroPython output.
                    </p>
                  </div>

                  <ul className="space-y-2.5 text-xs sm:text-sm text-slate-300">
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>
                        <strong>Virtual Microcontroller:</strong> 5x5 red/amber/green
                        LED matrix, Push Buttons A &amp; B, and GPIO Pins P0–P2.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>
                        <strong>Live Environment Sliders:</strong> Test loops and
                        conditionals against simulated Temperature (°C) &amp; Light.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>
                        <strong>1-Click MicroPython Transpiler:</strong> Inspect
                        clean Python code &amp; step through execution line by line.
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-800">
                  <button
                    onClick={() => onLaunchApp({ phase: 'intermediate' })}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-sm shadow-md transition-all"
                  >
                    <span>Launch Intermediate Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </article>

              {/* Phase 3 Card */}
              <article className="rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-sky-500/40 p-6 sm:p-7 flex flex-col justify-between transition-all">
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-sky-500/15 text-sky-300 border border-sky-500/30">
                      Senior Phase • Grade 7
                    </span>
                    <Compass className="w-6 h-6 text-sky-400" />
                  </div>

                  <div>
                    <h3 className="text-xl font-black text-white">
                      2D Autonomous Rover &amp; Logic Gates
                    </h3>
                    <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                      Master continuous 2D kinematics, sensor feedback loops,
                      and digital electronics with two dedicated Grade 7
                      engineering laboratories.
                    </p>
                  </div>

                  <ul className="space-y-2.5 text-xs sm:text-sm text-slate-300">
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                      <span>
                        <strong>Differential Drive Rover:</strong> Independent
                        left/right motor velocities ($v_L, v_R$) &amp; custom maze walls.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                      <span>
                        <strong>Ultrasonic &amp; Line Sensors:</strong> Real-time
                        raycasting distance cone (cm) and dual IR line followers.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                      <span>
                        <strong>Digital Logic Gate Playground:</strong> Wire AND,
                        OR, NOT, XOR, and NAND gates with live binary signals.
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-800 grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() =>
                      onLaunchApp({ phase: 'senior', seniorSubMode: 'rover' })
                    }
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold text-xs transition-all"
                  >
                    <span>Launch 2D Rover</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() =>
                      onLaunchApp({ phase: 'senior', seniorSubMode: 'logic' })
                    }
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-extrabold text-xs transition-all"
                  >
                    <span>Logic Gate Lab</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* Classroom & Offline Features Section */}
        <section
          id="features"
          className="py-20 bg-slate-900/40 border-b border-slate-900"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <div className="space-y-3 max-w-2xl">
                <span className="text-xs font-extrabold uppercase tracking-widest text-sky-400">
                  Engineered for Real South African Classrooms
                </span>
                <h2 className="text-3xl sm:text-4xl font-black text-white">
                  Built for Teachers, School Computer Labs &amp; Offline Tablets
                </h2>
                <p className="text-sm sm:text-base text-slate-400">
                  Whether your school has a connected computer lab, shared
                  offline tablets, or a single projector in front of the class,
                  CodiBotics adapts to your infrastructure.
                </p>
              </div>
              <div>
                <button
                  onClick={() => onLaunchApp({ openTeacherModal: true })}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 font-bold text-sm transition-colors"
                >
                  <BookOpen className="w-4 h-4 text-sky-400" />
                  <span>Open Teacher &amp; Facilitator Panel</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-3">
                <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <WifiOff className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white">
                  100% Offline-First PWA
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Service workers automatically cache the entire application.
                  Keep teaching seamlessly through internet outages or
                  load-shedding with zero recurring bandwidth costs.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-3">
                <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white">
                  Classroom Phase Locking &amp; Task Cards
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Lock the workspace to Foundation, Intermediate, or Senior
                  Phase so learners stay focused on the day’s lesson, and print
                  ready-made CAPS unplugged activity cards.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-3">
                <div className="w-11 h-11 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
                  <Cloud className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white">
                  USB Flash Files &amp; Cloud Share Codes
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Export portable <code className="text-emerald-300">.codibotics</code>{' '}
                  files onto USB drives for offline portfolio assessment, or
                  sync projects online using 6-character classroom share codes.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-3">
                <div className="w-11 h-11 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white">
                  WebAudio Piezo Sound Synthesizer
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Built-in procedural audio engine generates authentic robot
                  beeps, musical frequencies (Hz), and victory chimes — with a
                  single-click classroom mute toggle.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-3">
                <div className="w-11 h-11 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400">
                  <MonitorSmartphone className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white">
                  Touch, Tablet &amp; Low-Spec PC Friendly
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Lightweight HTML5 Canvas and SVG rendering runs at 60 FPS on
                  entry-level Android tablets, Chromebooks, and older school
                  desktop computers.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-3">
                <div className="w-11 h-11 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white">
                  POPIA-Conscious Learner Privacy
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Learners can use the entire simulator anonymously with
                  automatic local storage persistence — no personal student
                  accounts or emails required.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Companion Python / MicroPython SDK Section */}
        <section
          id="python-sdk"
          className="py-20 bg-slate-950 border-b border-slate-900"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-5 space-y-5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-300 text-xs font-bold">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Official Python &amp; MicroPython Package</span>
                </div>

                <h2 className="text-3xl sm:text-4xl font-black text-white">
                  From Browser Blocks to Real Python with{' '}
                  <span className="text-emerald-400 font-mono">codibotics</span>
                </h2>

                <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
                  Every Blockly program created in the Intermediate Phase
                  automatically transpiles into clean MicroPython code. Install
                  our official companion package on any computer to run the
                  exact same code in standard Python, IDLE, Thonny, or VS Code!
                </p>

                {/* Pip Install Copy Box */}
                <div className="flex items-center justify-between gap-3 bg-slate-900 border border-slate-700 rounded-2xl p-3.5">
                  <div className="flex items-center gap-3 font-mono text-sm sm:text-base text-emerald-300 pl-2">
                    <span className="text-slate-500 select-none">$</span>
                    <span>pip install codibotics</span>
                  </div>
                  <button
                    onClick={handleCopyPip}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-600 transition-colors"
                  >
                    {copiedPip ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => onLaunchApp({ phase: 'intermediate' })}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm transition-all"
                  >
                    <Code2 className="w-4 h-4" />
                    <span>Try Blockly-to-Python in Web App</span>
                  </button>
                </div>
              </div>

              {/* Code Preview Window */}
              <div className="lg:col-span-7">
                <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl">
                  <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-slate-950 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setActiveCodeTab('intermediate')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                          activeCodeTab === 'intermediate'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        5x5 Board (Grades 4–6)
                      </button>
                      <button
                        onClick={() => setActiveCodeTab('senior')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                          activeCodeTab === 'senior'
                            ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        2D Rover (Grade 7)
                      </button>
                    </div>

                    <button
                      onClick={handleCopyCode}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800"
                    >
                      {copiedCode ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Snippet</span>
                        </>
                      )}
                    </button>
                  </div>

                  <pre className="p-5 text-xs sm:text-sm font-mono text-slate-200 overflow-x-auto leading-relaxed select-text">
                    <code>{PYTHON_EXAMPLES[activeCodeTab]}</code>
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Frequently Asked Questions (SEO Rich) */}
        <section
          id="faq"
          className="py-20 bg-slate-900/30 border-b border-slate-900"
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            <div className="text-center space-y-3">
              <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-400">
                Frequently Asked Questions
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white">
                Everything Schools &amp; Educators Need to Know
              </h2>
            </div>

            <div className="space-y-3">
              {FAQS.map((item, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div
                    key={idx}
                    className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden"
                  >
                    <button
                      onClick={() =>
                        setOpenFaqIndex(isOpen ? null : idx)
                      }
                      aria-expanded={isOpen}
                      className="w-full flex items-center justify-between gap-4 p-5 text-left font-bold text-sm sm:text-base text-white hover:text-emerald-300 transition-colors"
                    >
                      <span>{item.q}</span>
                      <ChevronDown
                        className={`w-5 h-5 text-slate-400 shrink-0 transition-transform ${
                          isOpen ? 'rotate-180 text-emerald-400' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/60 pt-3">
                        {item.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Final Call to Action Banner */}
        <section className="py-20 relative overflow-hidden">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl bg-gradient-to-br from-emerald-950/90 via-slate-900 to-sky-950/90 border border-emerald-500/30 p-8 sm:p-12 text-center space-y-6 shadow-2xl">
              <h2 className="text-3xl sm:text-4xl font-black text-white">
                Ready to Launch Coding &amp; Robotics in Your Classroom?
              </h2>
              <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto">
                No installations, no sign-up walls, and zero hardware barriers.
                Open the CodiBotics simulator right now in your browser.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                <button
                  onClick={() => onLaunchApp()}
                  className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-base sm:text-lg shadow-xl shadow-emerald-500/25 transition-all active:scale-95"
                >
                  <Play className="w-5 h-5 fill-slate-950" />
                  <span>Launch CodiBotics Web App</span>
                </button>
                <button
                  onClick={() => onLaunchApp({ openTeacherModal: true })}
                  className="inline-flex items-center gap-2 px-6 py-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 font-bold text-sm sm:text-base border border-slate-700 transition-colors"
                >
                  <BookOpen className="w-5 h-5 text-sky-400" />
                  <span>Teacher Panel &amp; Task Cards</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Semantic Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-10 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <CodiBoticsLogo className="w-8 h-8 rounded-lg" />
            <div>
              <div className="font-bold text-slate-200">
                CodiBotics — DBE CAPS Coding &amp; Robotics Simulator (Grades R–7)
              </div>
              <div className="text-slate-500">
                Zero-install, 100% offline-ready educational platform for South African schools.
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => onLaunchApp({ phase: 'foundation' })}
              className="hover:text-amber-400 transition-colors"
            >
              Grades R–3 App
            </button>
            <button
              onClick={() => onLaunchApp({ phase: 'intermediate' })}
              className="hover:text-emerald-400 transition-colors"
            >
              Grades 4–6 App
            </button>
            <button
              onClick={() => onLaunchApp({ phase: 'senior' })}
              className="hover:text-sky-400 transition-colors"
            >
              Grade 7 App
            </button>
            <a
              href="https://pypi.org/project/codibotics/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:text-white transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>PyPI Package</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
