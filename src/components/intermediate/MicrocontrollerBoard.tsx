import React from 'react';
import { Sun, Thermometer, Volume2 } from 'lucide-react';
import { MicrocontrollerState } from '../../types/simulator';

interface MicrocontrollerBoardProps {
  state: MicrocontrollerState;
  onTogglePixel: (x: number, y: number) => void;
  onToggleButtonA: () => void;
  onToggleButtonB: () => void;
  onChangeTemperature: (temp: number) => void;
  onChangeLightLevel: (light: number) => void;
}

export const MicrocontrollerBoard: React.FC<MicrocontrollerBoardProps> = ({
  state,
  onTogglePixel,
  onToggleButtonA,
  onToggleButtonB,
  onChangeTemperature,
  onChangeLightLevel,
}) => {
  return (
    <div className="flex flex-col gap-4">
      {/* Virtual Microcontroller PCB Card */}
      <div className="relative bg-slate-900 border-2 border-slate-700 rounded-3xl p-5 shadow-2xl overflow-hidden">
        {/* Decorative Corner Mounting Holes */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-slate-950 border-2 border-amber-400" />
            <span className="text-xs font-black tracking-widest uppercase text-emerald-400">
              PulseBit v2.0 Board
            </span>
          </div>

          {/* Active Buzzer Indicator */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border transition-all ${
              state.buzzerFrequency > 0
                ? 'bg-purple-500/20 border-purple-400 text-purple-300 animate-pulse'
                : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>
              {state.buzzerFrequency > 0 ? `${state.buzzerFrequency} Hz` : 'Piezo Idle'}
            </span>
          </div>
        </div>

        {/* Main Board Layout: Button A | 5x5 LED Matrix | Button B */}
        <div className="flex items-center justify-between gap-3 my-2">
          {/* Push Button A */}
          <div className="flex flex-col items-center gap-1.5">
            <span className="text-xs font-black text-slate-300">BTN A</span>
            <button
              onClick={onToggleButtonA}
              className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center font-black text-lg transition-all shadow-inner ${
                state.buttonA
                  ? 'bg-emerald-500 border-emerald-300 text-slate-950 scale-95 shadow-lg shadow-emerald-500/40'
                  : 'bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700'
              }`}
              title="Click to toggle Button A state (Pressed / Released)"
            >
              A
            </button>
            <span className="text-[10px] font-bold uppercase text-slate-400">
              {state.buttonA ? 'ACTIVE' : 'IDLE'}
            </span>
          </div>

          {/* 5x5 Red/Amber LED Matrix */}
          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 shadow-inner">
            <div className="grid grid-cols-5 gap-2">
              {state.leds.map((row, y) =>
                row.map((brightness, x) => {
                  const isOn = brightness > 0;
                  const opacity = isOn ? Math.max(0.35, brightness / 255) : 0.12;
                  return (
                    <button
                      key={`${x}-${y}`}
                      onClick={() => onTogglePixel(x, y)}
                      title={`LED (${x}, ${y}) — Brightness: ${brightness} (Click to toggle)`}
                      className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg transition-all duration-150 ${
                        isOn
                          ? 'bg-rose-500 shadow-[0_0_14px_rgba(244,63,94,0.85)] border border-rose-300'
                          : 'bg-slate-800/90 hover:bg-slate-700 border border-slate-700'
                      }`}
                      style={{ opacity: isOn ? opacity : 1 }}
                    />
                  );
                })
              )}
            </div>
          </div>

          {/* Push Button B */}
          <div className="flex flex-col items-center gap-1.5">
            <span className="text-xs font-black text-slate-300">BTN B</span>
            <button
              onClick={onToggleButtonB}
              className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center font-black text-lg transition-all shadow-inner ${
                state.buttonB
                  ? 'bg-sky-500 border-sky-300 text-slate-950 scale-95 shadow-lg shadow-sky-500/40'
                  : 'bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700'
              }`}
              title="Click to toggle Button B state (Pressed / Released)"
            >
              B
            </button>
            <span className="text-[10px] font-bold uppercase text-slate-400">
              {state.buttonB ? 'ACTIVE' : 'IDLE'}
            </span>
          </div>
        </div>

        {/* Gold Edge Connector Pins (P0, P1, P2, 3V, GND) */}
        <div className="mt-5 pt-3 border-t border-slate-800 grid grid-cols-5 gap-2">
          {(['P0', 'P1', 'P2'] as const).map((pin) => {
            const high = state.pins[pin] > 0;
            return (
              <div
                key={pin}
                className={`flex flex-col items-center py-1.5 rounded-lg border-b-4 transition-all ${
                  high
                    ? 'bg-amber-400/20 border-amber-400 text-amber-300'
                    : 'bg-slate-950 border-amber-600/60 text-slate-400'
                }`}
              >
                <span className="text-xs font-black">{pin}</span>
                <span className="text-[10px] font-mono">
                  {high ? 'HIGH (1)' : 'LOW (0)'}
                </span>
              </div>
            );
          })}
          <div className="flex flex-col items-center py-1.5 rounded-lg bg-slate-950 border-b-4 border-rose-500/70 text-rose-400">
            <span className="text-xs font-black">3V</span>
            <span className="text-[10px] font-mono">PWR</span>
          </div>
          <div className="flex flex-col items-center py-1.5 rounded-lg bg-slate-950 border-b-4 border-slate-500 text-slate-400">
            <span className="text-xs font-black">GND</span>
            <span className="text-[10px] font-mono">0V</span>
          </div>
        </div>
      </div>

      {/* Virtual Environment Sensors Card (Temperature & Light Level Sliders) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Virtual Environment Sensors (Real-Time Input Sliders)
        </div>

        {/* Temperature Slider */}
        <div>
          <div className="flex items-center justify-between text-xs font-bold mb-1.5">
            <span className="flex items-center gap-1.5 text-amber-400">
              <Thermometer className="w-4 h-4" />
              <span>Ambient Temperature</span>
            </span>
            <span className="font-mono text-sm text-white bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
              {state.temperature} °C
            </span>
          </div>
          <input
            type="range"
            min={-5}
            max={50}
            value={state.temperature}
            onChange={(e) => onChangeTemperature(Number(e.target.value))}
            className="w-full accent-amber-400 cursor-pointer"
          />
        </div>

        {/* Light Level Slider */}
        <div>
          <div className="flex items-center justify-between text-xs font-bold mb-1.5">
            <span className="flex items-center gap-1.5 text-sky-400">
              <Sun className="w-4 h-4" />
              <span>Solar Light Sensor</span>
            </span>
            <span className="font-mono text-sm text-white bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
              {state.lightLevel} / 255
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={255}
            value={state.lightLevel}
            onChange={(e) => onChangeLightLevel(Number(e.target.value))}
            className="w-full accent-sky-400 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
