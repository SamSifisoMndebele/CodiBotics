import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as Blockly from 'blockly';
import {
  Play,
  StepForward,
  RotateCcw,
  Code2,
  Sparkles,
} from 'lucide-react';
import { MicrocontrollerState, TraceLogEntry } from '../../types/simulator';
import {
  registerCodiBoticsBlocks,
  CODIBOTICS_TOOLBOX,
} from '../../engine/BlocklyConfig';
import {
  compileWorkspaceToSteps,
  transpileWorkspaceToPython,
  createBlankLedMatrix,
  applyIconToMatrix,
  ExecutionStep,
} from '../../engine/ExecutionLoop';
import { MicrocontrollerBoard } from './MicrocontrollerBoard';
import { TraceConsole } from '../shared/TraceConsole';
import { audioEngine } from '../../engine/AudioEngine';

interface IntermediateWorkspaceProps {
  blocklyXml: string;
  onChangeXml: (xml: string) => void;
  temperature: number;
  lightLevel: number;
  onChangeTemperature: (t: number) => void;
  onChangeLightLevel: (l: number) => void;
}

export const IntermediateWorkspace: React.FC<IntermediateWorkspaceProps> = ({
  blocklyXml,
  onChangeXml,
  temperature,
  lightLevel,
  onChangeTemperature,
  onChangeLightLevel,
}) => {
  const blocklyDivRef = useRef<HTMLDivElement | null>(null);
  const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);

  const [mcState, setMcState] = useState<MicrocontrollerState>({
    leds: createBlankLedMatrix(),
    buttonA: false,
    buttonB: false,
    temperature,
    lightLevel,
    pins: { P0: 0, P1: 0, P2: 0 },
    buzzerFrequency: 0,
    variables: {},
  });

  const [logs, setLogs] = useState<TraceLogEntry[]>([]);
  const [pythonCode, setPythonCode] = useState<string>('');
  const [showPythonModal, setShowPythonModal] = useState<boolean>(false);

  const [compiledSteps, setCompiledSteps] = useState<ExecutionStep[]>([]);
  const [stepCursor, setStepCursor] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const runTimerRef = useRef<number | null>(null);

  // Sync external sliders into mcState
  useEffect(() => {
    setMcState((prev) => ({
      ...prev,
      temperature,
      lightLevel,
    }));
  }, [temperature, lightLevel]);

  const appendLog = useCallback(
    (level: TraceLogEntry['level'], message: string) => {
      const now = new Date().toLocaleTimeString([], {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      setLogs((prev) => [
        ...prev.slice(-49),
        {
          id: `${Date.now()}-${Math.random()}`,
          timestamp: now,
          level,
          message,
        },
      ]);
    },
    []
  );

  // Initialize Blockly Workspace
  useEffect(() => {
    registerCodiBoticsBlocks();
    if (!blocklyDivRef.current) return;

    const ws = Blockly.inject(blocklyDivRef.current, {
      toolbox: CODIBOTICS_TOOLBOX,
      trashcan: true,
      zoom: {
        controls: true,
        wheel: true,
        startScale: 0.95,
        maxScale: 1.4,
        minScale: 0.6,
      },
      grid: {
        spacing: 20,
        length: 3,
        colour: '#334155',
        snap: true,
      },
    });

    workspaceRef.current = ws;

    if (blocklyXml) {
      try {
        const dom = Blockly.utils.xml.textToDom(blocklyXml);
        Blockly.Xml.domToWorkspace(dom, ws);
      } catch (e) {
        console.warn('Could not load saved Blockly XML:', e);
      }
    }

    const updateListener = () => {
      const dom = Blockly.Xml.workspaceToDom(ws);
      const xmlText = Blockly.Xml.domToText(dom);
      onChangeXml(xmlText);
      setPythonCode(transpileWorkspaceToPython(ws));
    };

    ws.addChangeListener(updateListener);
    setPythonCode(transpileWorkspaceToPython(ws));

    return () => {
      ws.removeChangeListener(updateListener);
      ws.dispose();
      workspaceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const executeSingleStep = useCallback(
    (step: ExecutionStep): number => {
      if (workspaceRef.current) {
        workspaceRef.current.highlightBlock(step.blockId);
      }

      switch (step.type) {
        case 'SHOW_ICON': {
          setMcState((prev) => ({
            ...prev,
            leds: applyIconToMatrix(step.icon),
            buzzerFrequency: 0,
          }));
          appendLog('action', `Display 5x5 Icon: ${step.icon}`);
          return 450;
        }
        case 'CLEAR_SCREEN': {
          setMcState((prev) => ({
            ...prev,
            leds: createBlankLedMatrix(),
            buzzerFrequency: 0,
          }));
          appendLog('action', 'Cleared 5x5 LED matrix');
          return 250;
        }
        case 'SET_PIXEL': {
          setMcState((prev) => {
            const nextLeds = prev.leds.map((r) => [...r]);
            if (nextLeds[step.y] && nextLeds[step.y][step.x] !== undefined) {
              nextLeds[step.y][step.x] = step.brightness;
            }
            return { ...prev, leds: nextLeds };
          });
          appendLog(
            'action',
            `Set LED (${step.x}, ${step.y}) brightness to ${step.brightness}`
          );
          return 250;
        }
        case 'PLAY_TONE': {
          audioEngine.playTone(step.freq, step.duration, 'square');
          setMcState((prev) => ({ ...prev, buzzerFrequency: step.freq }));
          appendLog(
            'action',
            `Piezo Buzzer playing ${step.freq} Hz for ${step.duration} ms`
          );
          setTimeout(() => {
            setMcState((prev) => ({ ...prev, buzzerFrequency: 0 }));
          }, step.duration);
          return Math.max(250, step.duration);
        }
        case 'WAIT': {
          appendLog('info', `Waiting ${step.ms} ms...`);
          return step.ms;
        }
        case 'WRITE_PIN': {
          setMcState((prev) => ({
            ...prev,
            pins: { ...prev.pins, [step.pin]: step.value },
          }));
          appendLog(
            'sensor',
            `Pin ${step.pin} set to ${step.value ? 'HIGH (1)' : 'LOW (0)'}`
          );
          return 250;
        }
        case 'LOG': {
          appendLog('info', `Console: "${step.message}"`);
          return 250;
        }
      }
    },
    [appendLog]
  );

  const handleRunFullProgram = () => {
    if (!workspaceRef.current) return;
    if (runTimerRef.current) window.clearTimeout(runTimerRef.current);

    const steps = compileWorkspaceToSteps(workspaceRef.current, mcState);
    setCompiledSteps(steps);
    setStepCursor(0);

    if (steps.length === 0) {
      appendLog('warn', 'No executable blocks found on workspace.');
      return;
    }

    setIsRunning(true);
    appendLog('info', `Compiled ${steps.length} steps. Running program...`);

    let idx = 0;
    const nextTick = () => {
      if (idx >= steps.length) {
        setIsRunning(false);
        setStepCursor(0);
        workspaceRef.current?.highlightBlock(null);
        appendLog('info', 'Program execution finished.');
        return;
      }
      setStepCursor(idx + 1);
      const delay = executeSingleStep(steps[idx]);
      idx += 1;
      runTimerRef.current = window.setTimeout(nextTick, delay);
    };

    nextTick();
  };

  const handleStepDebugger = () => {
    if (!workspaceRef.current) return;
    if (runTimerRef.current) {
      window.clearTimeout(runTimerRef.current);
      setIsRunning(false);
    }

    let activeSteps = compiledSteps;
    let cursor = stepCursor;

    if (activeSteps.length === 0 || cursor >= activeSteps.length) {
      activeSteps = compileWorkspaceToSteps(workspaceRef.current, mcState);
      setCompiledSteps(activeSteps);
      cursor = 0;
      appendLog(
        'info',
        `Step Debugger initialized (${activeSteps.length} total steps).`
      );
    }

    if (activeSteps.length === 0) {
      appendLog('warn', 'Add blocks to step through.');
      return;
    }

    const currentStep = activeSteps[cursor];
    executeSingleStep(currentStep);
    setStepCursor(cursor + 1);
  };

  const handleResetHardware = () => {
    if (runTimerRef.current) window.clearTimeout(runTimerRef.current);
    setIsRunning(false);
    setStepCursor(0);
    setCompiledSteps([]);
    workspaceRef.current?.highlightBlock(null);
    setMcState((prev) => ({
      ...prev,
      leds: createBlankLedMatrix(),
      pins: { P0: 0, P1: 0, P2: 0 },
      buzzerFrequency: 0,
    }));
    appendLog('info', 'Microcontroller reset.');
  };

  const loadPresetSensorDemo = () => {
    if (!workspaceRef.current) return;
    const sensorXml = `<xml xmlns="https://developers.google.com/blockly/xml">
      <block type="controls_if" x="25" y="25">
        <mutation else="1"></mutation>
        <value name="IF0">
          <block type="pm_sensor_compare">
            <field name="SENSOR">TEMP</field>
            <field name="OP">GT</field>
            <field name="VAL">30</field>
          </block>
        </value>
        <statement name="DO0">
          <block type="pm_show_icon">
            <field name="ICON">SUN</field>
            <next>
              <block type="pm_play_tone">
                <field name="FREQ">880</field>
                <field name="DURATION">300</field>
                <next>
                  <block type="pm_log_message">
                    <field name="MSG">Heatwave Alert! Temp &gt; 30C</field>
                  </block>
                </next>
              </block>
            </next>
          </block>
        </statement>
        <statement name="ELSE">
          <block type="pm_show_icon">
            <field name="ICON">SMILE</field>
            <next>
              <block type="pm_log_message">
                <field name="MSG">Temperature Normal</field>
              </block>
            </next>
          </block>
        </statement>
      </block>
    </xml>`;

    workspaceRef.current.clear();
    const dom = Blockly.utils.xml.textToDom(sensorXml);
    Blockly.Xml.domToWorkspace(dom, workspaceRef.current);
    appendLog('info', 'Loaded Temperature Alarm Conditional Demo.');
  };

  return (
    <div className="max-w-[1600px] mx-auto p-4 lg:p-6 space-y-5">
      {/* Execution & Debugger Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-3.5">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleRunFullProgram}
            disabled={isRunning}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-emerald-500/20 disabled:opacity-40 transition-all"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>Run Program</span>
          </button>

          <button
            onClick={handleStepDebugger}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-sm shadow-md transition-all"
            title="Execute one block at a time and highlight it"
          >
            <StepForward className="w-4 h-4" />
            <span>
              Step Debugger{' '}
              {compiledSteps.length > 0 ? `(${stepCursor}/${compiledSteps.length})` : ''}
            </span>
          </button>

          <button
            onClick={handleResetHardware}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Board</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={loadPresetSensorDemo}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 text-xs font-bold"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Load Sensor If/Else Demo</span>
          </button>

          <button
            onClick={() => setShowPythonModal((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
              showPythonModal
                ? 'bg-indigo-500 text-white border-indigo-400'
                : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>{showPythonModal ? 'Hide Python Code' : 'View Python Code'}</span>
          </button>
        </div>
      </div>

      {/* Main Split View: Left = Blockly Visual Editor, Right = Microcontroller & Sensors */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4">
          <div className="rounded-2xl overflow-hidden border-2 border-slate-800 bg-slate-900 shadow-2xl">
            <div ref={blocklyDivRef} className="w-full h-[470px]" />
          </div>

          {showPythonModal && (
            <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl p-4">
              <div className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-2">
                Live Transpiled MicroPython Code
              </div>
              <pre className="bg-slate-950 p-3 rounded-xl text-xs font-mono text-emerald-300 overflow-x-auto border border-slate-800">
                {pythonCode}
              </pre>
            </div>
          )}
        </div>

        <div className="lg:col-span-5 xl:col-span-4">
          <MicrocontrollerBoard
            state={mcState}
            onTogglePixel={(x, y) => {
              setMcState((prev) => {
                const next = prev.leds.map((r) => [...r]);
                next[y][x] = next[y][x] > 0 ? 0 : 255;
                return { ...prev, leds: next };
              });
            }}
            onToggleButtonA={() => {
              setMcState((prev) => {
                const nextA = !prev.buttonA;
                appendLog('sensor', `Button A ${nextA ? 'PRESSED' : 'RELEASED'}`);
                return { ...prev, buttonA: nextA };
              });
            }}
            onToggleButtonB={() => {
              setMcState((prev) => {
                const nextB = !prev.buttonB;
                appendLog('sensor', `Button B ${nextB ? 'PRESSED' : 'RELEASED'}`);
                return { ...prev, buttonB: nextB };
              });
            }}
            onChangeTemperature={onChangeTemperature}
            onChangeLightLevel={onChangeLightLevel}
          />
        </div>
      </div>

      {/* Bottom Trace Console */}
      <TraceConsole
        logs={logs}
        mcState={mcState}
        onClearLogs={() => setLogs([])}
      />
    </div>
  );
};
