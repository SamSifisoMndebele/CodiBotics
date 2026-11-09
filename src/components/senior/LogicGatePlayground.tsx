import React, { useMemo, useState } from 'react';
import { Cpu, Plus, RotateCcw, Zap } from 'lucide-react';
import { LogicNode, LogicWire, LogicGateType } from '../../types/simulator';
import { audioEngine } from '../../engine/AudioEngine';

interface LogicGatePlaygroundProps {
  nodes: LogicNode[];
  wires: LogicWire[];
  onChangeNodes: React.Dispatch<React.SetStateAction<LogicNode[]>>;
  onChangeWires: React.Dispatch<React.SetStateAction<LogicWire[]>>;
}

export const DEFAULT_LOGIC_NODES: LogicNode[] = [
  { id: 'in-a', type: 'INPUT', label: 'Switch A', x: 70, y: 90, state: true },
  { id: 'in-b', type: 'INPUT', label: 'Switch B', x: 70, y: 210, state: false },
  { id: 'in-c', type: 'INPUT', label: 'Switch C', x: 70, y: 320, state: true },
  { id: 'gate-and', type: 'AND', label: 'AND Gate', x: 260, y: 140, state: false },
  { id: 'gate-not', type: 'NOT', label: 'NOT Gate', x: 260, y: 320, state: false },
  { id: 'gate-or', type: 'OR', label: 'OR Gate', x: 450, y: 220, state: false },
  { id: 'out-1', type: 'OUTPUT', label: 'Output LED', x: 630, y: 220, state: false },
];

export const DEFAULT_LOGIC_WIRES: LogicWire[] = [
  { id: 'w1', fromNodeId: 'in-a', toNodeId: 'gate-and', toInputIndex: 0 },
  { id: 'w2', fromNodeId: 'in-b', toNodeId: 'gate-and', toInputIndex: 1 },
  { id: 'w3', fromNodeId: 'in-c', toNodeId: 'gate-not', toInputIndex: 0 },
  { id: 'w4', fromNodeId: 'gate-and', toNodeId: 'gate-or', toInputIndex: 0 },
  { id: 'w5', fromNodeId: 'gate-not', toNodeId: 'gate-or', toInputIndex: 1 },
  { id: 'w6', fromNodeId: 'gate-or', toNodeId: 'out-1', toInputIndex: 0 },
];

export const LogicGatePlayground: React.FC<LogicGatePlaygroundProps> = ({
  nodes,
  wires,
  onChangeNodes,
  onChangeWires,
}) => {
  const [selectedFromId, setSelectedFromId] = useState<string | null>(null);

  // Propagate Boolean Truth Values across the circuit graph
  const evaluatedStates = useMemo(() => {
    const stateMap: Record<string, boolean> = {};
    nodes.forEach((n) => {
      if (n.type === 'INPUT') stateMap[n.id] = n.state;
    });

    // Multi-pass propagation for acyclic/shallow circuits
    for (let pass = 0; pass < 5; pass++) {
      nodes.forEach((node) => {
        if (node.type === 'INPUT') return;
        const incoming = wires.filter((w) => w.toNodeId === node.id);
        const in0Wire = incoming.find((w) => w.toInputIndex === 0);
        const in1Wire = incoming.find((w) => w.toInputIndex === 1);

        const val0 = in0Wire ? Boolean(stateMap[in0Wire.fromNodeId]) : false;
        const val1 = in1Wire ? Boolean(stateMap[in1Wire.fromNodeId]) : false;

        switch (node.type) {
          case 'AND':
            stateMap[node.id] = val0 && val1;
            break;
          case 'OR':
            stateMap[node.id] = val0 || val1;
            break;
          case 'XOR':
            stateMap[node.id] = val0 !== val1;
            break;
          case 'NOT':
            stateMap[node.id] = !val0;
            break;
          case 'OUTPUT':
            stateMap[node.id] = val0;
            break;
        }
      });
    }

    return stateMap;
  }, [nodes, wires]);

  const toggleInputSwitch = (id: string) => {
    audioEngine.playClick();
    onChangeNodes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, state: !n.state } : n))
    );
  };

  const addGateNode = (type: LogicGateType) => {
    audioEngine.playClick();
    const newNode: LogicNode = {
      id: `node-${Date.now()}`,
      type,
      label: `${type} Gate`,
      x: 240 + Math.floor(Math.random() * 180),
      y: 90 + Math.floor(Math.random() * 220),
      state: false,
    };
    onChangeNodes((prev) => [...prev, newNode]);
  };

  const handleConnectPin = (targetNodeId: string, inputIndex: 0 | 1) => {
    if (!selectedFromId || selectedFromId === targetNodeId) return;
    audioEngine.playClick();
    onChangeWires((prev) => [
      ...prev.filter(
        (w) => !(w.toNodeId === targetNodeId && w.toInputIndex === inputIndex)
      ),
      {
        id: `wire-${Date.now()}`,
        fromNodeId: selectedFromId,
        toNodeId: targetNodeId,
        toInputIndex: inputIndex,
      },
    ]);
    setSelectedFromId(null);
  };

  const resetCircuit = () => {
    audioEngine.playClick();
    onChangeNodes(DEFAULT_LOGIC_NODES);
    onChangeWires(DEFAULT_LOGIC_WIRES);
    setSelectedFromId(null);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-3.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-2">
            Add Logic Gate:
          </span>
          {(['AND', 'OR', 'NOT', 'XOR'] as LogicGateType[]).map((gate) => (
            <button
              key={gate}
              onClick={() => addGateNode(gate)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-extrabold text-sky-300 border border-slate-700"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{gate}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {selectedFromId && (
            <span className="text-xs font-bold text-amber-400 animate-pulse">
              Select a target gate IN1 or IN2 pin to complete wire...
            </span>
          )}
          <button
            onClick={resetCircuit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Default Circuit</span>
          </button>
        </div>
      </div>

      {/* Interactive SVG + Node Circuit Board */}
      <div className="relative w-full h-[430px] bg-slate-950 border-2 border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        {/* SVG Wire Layer */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {wires.map((wire) => {
            const fromNode = nodes.find((n) => n.id === wire.fromNodeId);
            const toNode = nodes.find((n) => n.id === wire.toNodeId);
            if (!fromNode || !toNode) return null;

            const isHigh = Boolean(evaluatedStates[fromNode.id]);
            const x1 = fromNode.x + 115;
            const y1 = fromNode.y + 28;
            const x2 = toNode.x;
            const y2 = toNode.y + (wire.toInputIndex === 0 ? 18 : 38);
            const midX = (x1 + x2) / 2;

            return (
              <path
                key={wire.id}
                d={`M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`}
                fill="none"
                stroke={isHigh ? '#10b981' : '#475569'}
                strokeWidth={isHigh ? 4 : 2.5}
              />
            );
          })}
        </svg>

        {/* Logic Nodes Layer */}
        {nodes.map((node) => {
          const isHigh = Boolean(evaluatedStates[node.id]);

          return (
            <div
              key={node.id}
              style={{ left: node.x, top: node.y }}
              className={`absolute w-[120px] rounded-xl p-2.5 border-2 shadow-lg transition-all select-none ${
                isHigh
                  ? 'bg-slate-900 border-emerald-400 shadow-emerald-500/20'
                  : 'bg-slate-900 border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider mb-1">
                <span className={isHigh ? 'text-emerald-400' : 'text-slate-400'}>
                  {node.type}
                </span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                    isHigh
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {isHigh ? 'HIGH (1)' : 'LOW (0)'}
                </span>
              </div>

              {node.type === 'INPUT' ? (
                <button
                  onClick={() => toggleInputSwitch(node.id)}
                  className={`w-full py-1.5 rounded-lg font-extrabold text-xs transition-all ${
                    isHigh
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {node.label}: {isHigh ? 'ON' : 'OFF'}
                </button>
              ) : node.type === 'OUTPUT' ? (
                <div className="flex items-center justify-center py-1.5">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      isHigh
                        ? 'bg-emerald-400 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.9)]'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    <Zap className="w-4 h-4" />
                  </div>
                </div>
              ) : (
                <div className="text-xs font-bold text-center py-1 text-white">
                  {node.label}
                </div>
              )}

              {/* Input / Output Pin Connectors */}
              <div className="mt-2 flex items-center justify-between text-[10px] font-bold">
                {node.type !== 'INPUT' ? (
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleConnectPin(node.id, 0)}
                      className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-sky-500 hover:text-slate-950 text-slate-300 border border-slate-600"
                      title="Connect wire to Input 1"
                    >
                      IN1
                    </button>
                    {node.type !== 'NOT' && node.type !== 'OUTPUT' && (
                      <button
                        onClick={() => handleConnectPin(node.id, 1)}
                        className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-sky-500 hover:text-slate-950 text-slate-300 border border-slate-600"
                        title="Connect wire to Input 2"
                      >
                        IN2
                      </button>
                    )}
                  </div>
                ) : (
                  <span />
                )}

                {node.type !== 'OUTPUT' && (
                  <button
                    onClick={() =>
                      setSelectedFromId(selectedFromId === node.id ? null : node.id)
                    }
                    className={`px-1.5 py-0.5 rounded border ${
                      selectedFromId === node.id
                        ? 'bg-amber-400 text-slate-950 border-amber-200'
                        : 'bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-emerald-300 border-slate-600'
                    }`}
                    title="Click to start a wire from this output"
                  >
                    OUT →
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Truth Table Quick Reference */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-300">
        <div className="flex items-center gap-2 font-bold text-sky-400">
          <Cpu className="w-4 h-4" />
          <span>CAPS Grade 7 Digital Logic Reference:</span>
        </div>
        <div className="flex flex-wrap gap-4 font-mono">
          <span>
            <strong className="text-white">AND:</strong> HIGH only if both inputs are 1
          </span>
          <span>
            <strong className="text-white">OR:</strong> HIGH if at least one input is 1
          </span>
          <span>
            <strong className="text-white">NOT:</strong> Inverts 1 → 0 and 0 → 1
          </span>
          <span>
            <strong className="text-white">XOR:</strong> HIGH if inputs are different
          </span>
        </div>
      </div>
    </div>
  );
};
