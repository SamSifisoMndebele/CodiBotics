import React, { useState, useEffect } from 'react';
import {
  GradePhase,
  MapThemeId,
  FloorBotCommand,
  SeniorSubMode,
  MazeWall,
  LogicNode,
  LogicWire,
  FacilitatorSettings,
  CodiBoticsProjectFile,
} from './types/simulator';
import { HeaderNav } from './components/common/HeaderNav';
import { FacilitatorModal } from './components/common/FacilitatorModal';
import { CloudProjectsModal } from './components/common/CloudProjectsModal';
import { FoundationWorkspace } from './components/foundation/FoundationWorkspace';
import { IntermediateWorkspace } from './components/intermediate/IntermediateWorkspace';
import { SeniorWorkspace } from './components/senior/SeniorWorkspace';
import { DEFAULT_INTERMEDIATE_XML } from './engine/BlocklyConfig';
import {
  DEFAULT_LOGIC_NODES,
  DEFAULT_LOGIC_WIRES,
} from './components/senior/LogicGatePlayground';
import { audioEngine } from './engine/AudioEngine';
import { useOfflinePWA } from './hooks/useOfflinePWA';
import { useFirebaseAuth } from './hooks/useFirebaseAuth';

const STORAGE_KEY = 'codibotics_simulator_state_v1';
const LEGACY_STORAGE_KEY = 'pulsemaker_simulator_state_v1';

export function App() {
  const { isOnline, markSaved } = useOfflinePWA();
  const { user } = useFirebaseAuth();

  const [activePhase, setActivePhase] = useState<GradePhase>('foundation');
  const [isCloudOpen, setIsCloudOpen] = useState<boolean>(false);

  // Phase 1 State: Foundation
  const [mapId, setMapId] = useState<MapThemeId>('township');
  const [commandQueue, setCommandQueue] = useState<FloorBotCommand[]>([
    { id: 'init-1', type: 'FORWARD' },
    { id: 'init-2', type: 'FORWARD' },
    { id: 'init-3', type: 'FORWARD' },
    { id: 'init-4', type: 'BEEP' },
    { id: 'init-5', type: 'TURN_RIGHT' },
    { id: 'init-6', type: 'FORWARD' },
    { id: 'init-7', type: 'FORWARD' },
  ]);

  // Phase 2 State: Intermediate
  const [blocklyXml, setBlocklyXml] = useState<string>(DEFAULT_INTERMEDIATE_XML);
  const [temperature, setTemperature] = useState<number>(26);
  const [lightLevel, setLightLevel] = useState<number>(180);

  // Phase 3 State: Senior
  const [seniorSubMode, setSeniorSubMode] = useState<SeniorSubMode>('rover');
  const [mazeWalls, setMazeWalls] = useState<MazeWall[]>([
    { id: 'w-init-1', x1: 250, y1: 70, x2: 250, y2: 180 },
  ]);
  const [logicNodes, setLogicNodes] = useState<LogicNode[]>(DEFAULT_LOGIC_NODES);
  const [logicWires, setLogicWires] = useState<LogicWire[]>(DEFAULT_LOGIC_WIRES);
  const [roverProgramType, setRoverProgramType] = useState<
    'line_follow' | 'obstacle_avoid' | 'manual_motors' | 'blockly_custom'
  >('line_follow');

  // Phase 4 State: Facilitator & Settings
  const [facilitator, setFacilitator] = useState<FacilitatorSettings>({
    lockedPhase: null,
    difficulty: 'standard',
    audioMuted: false,
    showGridCoordinates: true,
  });
  const [isFacilitatorOpen, setIsFacilitatorOpen] = useState<boolean>(false);

  // Restore saved state from localStorage on first mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<CodiBoticsProjectFile>;
      if (parsed.activePhase) setActivePhase(parsed.activePhase);
      if (parsed.foundation?.mapId) setMapId(parsed.foundation.mapId);
      if (parsed.foundation?.commandQueue) {
        setCommandQueue(parsed.foundation.commandQueue);
      }
      if (parsed.intermediate?.blocklyXml) {
        setBlocklyXml(parsed.intermediate.blocklyXml);
      }
      if (typeof parsed.intermediate?.temperature === 'number') {
        setTemperature(parsed.intermediate.temperature);
      }
      if (typeof parsed.intermediate?.lightLevel === 'number') {
        setLightLevel(parsed.intermediate.lightLevel);
      }
      if (parsed.senior?.subMode) setSeniorSubMode(parsed.senior.subMode);
      if (parsed.senior?.walls) setMazeWalls(parsed.senior.walls);
      if (parsed.senior?.logicNodes) setLogicNodes(parsed.senior.logicNodes);
      if (parsed.senior?.logicWires) setLogicWires(parsed.senior.logicWires);
    } catch (e) {
      console.warn('Failed to restore state from localStorage:', e);
    }
  }, []);

  // Auto-persist to localStorage on state changes
  useEffect(() => {
    const snapshot: CodiBoticsProjectFile = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      projectName: 'CodiBotics Classroom Project',
      activePhase,
      foundation: {
        mapId,
        commandQueue,
      },
      intermediate: {
        blocklyXml,
        temperature,
        lightLevel,
      },
      senior: {
        subMode: seniorSubMode,
        walls: mazeWalls,
        logicNodes,
        logicWires,
        roverProgramType,
      },
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
      markSaved();
    } catch {
      // Ignore storage quota warnings
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activePhase,
    mapId,
    commandQueue,
    blocklyXml,
    temperature,
    lightLevel,
    seniorSubMode,
    mazeWalls,
    logicNodes,
    logicWires,
    roverProgramType,
  ]);

  const handleToggleMute = () => {
    setFacilitator((prev) => {
      const nextMuted = !prev.audioMuted;
      audioEngine.setMuted(nextMuted);
      return { ...prev, audioMuted: nextMuted };
    });
  };

  const handleExportProject = () => {
    const payload: CodiBoticsProjectFile = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      projectName: `codibotics-${activePhase}-project`,
      activePhase,
      foundation: { mapId, commandQueue },
      intermediate: { blocklyXml, temperature, lightLevel },
      senior: {
        subMode: seniorSubMode,
        walls: mazeWalls,
        logicNodes,
        logicWires,
        roverProgramType,
      },
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `codibotics-${activePhase}-${new Date()
      .toISOString()
      .slice(0, 10)}.codibotics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const loadProjectState = (data: CodiBoticsProjectFile) => {
    if (data.activePhase) setActivePhase(data.activePhase);
    if (data.foundation) {
      setMapId(data.foundation.mapId || 'township');
      setCommandQueue(data.foundation.commandQueue || []);
    }
    if (data.intermediate) {
      setBlocklyXml(data.intermediate.blocklyXml || DEFAULT_INTERMEDIATE_XML);
      setTemperature(data.intermediate.temperature ?? 26);
      setLightLevel(data.intermediate.lightLevel ?? 180);
    }
    if (data.senior) {
      setSeniorSubMode(data.senior.subMode || 'rover');
      setMazeWalls(data.senior.walls || []);
      setLogicNodes(data.senior.logicNodes || DEFAULT_LOGIC_NODES);
      setLogicWires(data.senior.logicWires || DEFAULT_LOGIC_WIRES);
      setRoverProgramType(data.senior.roverProgramType || 'line_follow');
    }
    audioEngine.playVictory();
  };

  const handleImportProject = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result)) as CodiBoticsProjectFile;
        loadProjectState(data);
      } catch (err) {
        alert('Invalid .codibotics project file.');
        console.error(err);
      }
    };
    reader.readAsText(file);
  };

  const currentProjectSnapshot: CodiBoticsProjectFile = {
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    projectName: `codibotics-${activePhase}-project`,
    activePhase,
    foundation: { mapId, commandQueue },
    intermediate: { blocklyXml, temperature, lightLevel },
    senior: {
      subMode: seniorSubMode,
      walls: mazeWalls,
      logicNodes,
      logicWires,
      roverProgramType,
    },
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <HeaderNav
        activePhase={activePhase}
        onSelectPhase={(phase) => {
          if (facilitator.lockedPhase && facilitator.lockedPhase !== phase) return;
          audioEngine.playClick();
          setActivePhase(phase);
        }}
        facilitator={facilitator}
        onToggleMute={handleToggleMute}
        onOpenFacilitatorModal={() => setIsFacilitatorOpen(true)}
        onOpenCloudModal={() => setIsCloudOpen(true)}
        onExportProject={handleExportProject}
        onImportProject={handleImportProject}
        isOnline={isOnline}
        cloudUserDisplayName={user?.displayName || (user?.isAnonymous ? 'Learner (Cloud)' : user?.email)}
      />

      <main className="flex-1">
        {activePhase === 'foundation' && (
          <FoundationWorkspace
            mapId={mapId}
            onChangeMapId={setMapId}
            commandQueue={commandQueue}
            onChangeQueue={setCommandQueue}
            showCoordinates={facilitator.showGridCoordinates}
          />
        )}

        {activePhase === 'intermediate' && (
          <IntermediateWorkspace
            blocklyXml={blocklyXml}
            onChangeXml={setBlocklyXml}
            temperature={temperature}
            lightLevel={lightLevel}
            onChangeTemperature={setTemperature}
            onChangeLightLevel={setLightLevel}
          />
        )}

        {activePhase === 'senior' && (
          <SeniorWorkspace
            subMode={seniorSubMode}
            onChangeSubMode={setSeniorSubMode}
            walls={mazeWalls}
            onChangeWalls={setMazeWalls}
            logicNodes={logicNodes}
            logicWires={logicWires}
            onChangeLogicNodes={setLogicNodes}
            onChangeLogicWires={setLogicWires}
            roverProgramType={roverProgramType}
            onChangeRoverProgramType={setRoverProgramType}
          />
        )}
      </main>

      <FacilitatorModal
        isOpen={isFacilitatorOpen}
        onClose={() => setIsFacilitatorOpen(false)}
        settings={facilitator}
        onUpdateSettings={setFacilitator}
      />

      <CloudProjectsModal
        isOpen={isCloudOpen}
        onClose={() => setIsCloudOpen(false)}
        currentProject={currentProjectSnapshot}
        onLoadProject={loadProjectState}
      />
    </div>
  );
}

export default App;
