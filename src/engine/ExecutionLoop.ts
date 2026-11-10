import * as Blockly from 'blockly';
import { MicrocontrollerState } from '../types/simulator';
import { ICON_PATTERNS } from './BlocklyConfig';

// ============================================================================
// Client-Side Deterministic Execution Parser & Python Code Transpiler
// Converts Blockly Workspace AST into Step-by-Step Instructions & Python Code
// ============================================================================

export type ExecutionStep =
  | { type: 'SHOW_ICON'; blockId: string; icon: string }
  | { type: 'CLEAR_SCREEN'; blockId: string }
  | { type: 'SET_PIXEL'; blockId: string; x: number; y: number; brightness: number }
  | { type: 'PLAY_TONE'; blockId: string; freq: number; duration: number }
  | { type: 'WAIT'; blockId: string; ms: number }
  | { type: 'WRITE_PIN'; blockId: string; pin: 'P0' | 'P1' | 'P2'; value: number }
  | { type: 'LOG'; blockId: string; message: string };

function evaluateConditionBlock(
  condBlock: Blockly.Block | null,
  mcState: MicrocontrollerState
): boolean {
  if (!condBlock) return false;

  if (condBlock.type === 'pm_button_pressed') {
    const btn = condBlock.getFieldValue('BTN');
    return btn === 'A' ? mcState.buttonA : mcState.buttonB;
  }

  if (condBlock.type === 'pm_sensor_compare') {
    const sensor = condBlock.getFieldValue('SENSOR');
    const op = condBlock.getFieldValue('OP');
    const val = Number(condBlock.getFieldValue('VAL') || 0);
    const actual = sensor === 'TEMP' ? mcState.temperature : mcState.lightLevel;

    if (op === 'GT') return actual > val;
    if (op === 'LT') return actual < val;
    return actual === val;
  }

  if (condBlock.type === 'logic_negate') {
    const target = condBlock.getInputTargetBlock('BOOL');
    return !evaluateConditionBlock(target, mcState);
  }

  return false;
}

export function compileWorkspaceToSteps(
  workspace: Blockly.Workspace,
  mcState: MicrocontrollerState
): ExecutionStep[] {
  const steps: ExecutionStep[] = [];
  const topBlocks = workspace.getTopBlocks(true);

  const traverseChain = (startBlock: Blockly.Block | null, depth: number = 0) => {
    if (!startBlock || depth > 50 || steps.length > 200) return;

    let current: Blockly.Block | null = startBlock;
    while (current && steps.length <= 200) {
      const id = current.id;

      switch (current.type) {
        case 'pm_show_icon': {
          const icon = current.getFieldValue('ICON') || 'HEART';
          steps.push({ type: 'SHOW_ICON', blockId: id, icon });
          break;
        }
        case 'pm_clear_screen': {
          steps.push({ type: 'CLEAR_SCREEN', blockId: id });
          break;
        }
        case 'pm_set_pixel': {
          const x = Number(current.getFieldValue('X') ?? 0);
          const y = Number(current.getFieldValue('Y') ?? 0);
          const brightness = Number(current.getFieldValue('BRIGHTNESS') ?? 255);
          steps.push({ type: 'SET_PIXEL', blockId: id, x, y, brightness });
          break;
        }
        case 'pm_play_tone': {
          const freq = Number(current.getFieldValue('FREQ') ?? 440);
          const duration = Number(current.getFieldValue('DURATION') ?? 250);
          steps.push({ type: 'PLAY_TONE', blockId: id, freq, duration });
          break;
        }
        case 'pm_wait_ms': {
          const ms = Number(current.getFieldValue('MS') ?? 400);
          steps.push({ type: 'WAIT', blockId: id, ms });
          break;
        }
        case 'pm_write_pin': {
          const pin = (current.getFieldValue('PIN') || 'P0') as 'P0' | 'P1' | 'P2';
          const value = Number(current.getFieldValue('VALUE') ?? 1);
          steps.push({ type: 'WRITE_PIN', blockId: id, pin, value });
          break;
        }
        case 'pm_log_message': {
          const message = String(current.getFieldValue('MSG') || '');
          steps.push({ type: 'LOG', blockId: id, message });
          break;
        }
        case 'controls_repeat_ext': {
          const timesBlock = current.getInputTargetBlock('TIMES');
          const rawTimes = timesBlock
            ? Number(timesBlock.getFieldValue('NUM') ?? 2)
            : 2;
          const times = Math.max(0, Math.min(20, rawTimes));
          const doBlock = current.getInputTargetBlock('DO');
          for (let i = 0; i < times; i++) {
            traverseChain(doBlock, depth + 1);
          }
          break;
        }
        case 'controls_if': {
          let branchIdx = 0;
          let matched = false;
          while (current.getInput(`IF${branchIdx}`)) {
            const condBlock = current.getInputTargetBlock(`IF${branchIdx}`);
            if (evaluateConditionBlock(condBlock, mcState)) {
              const doBlock = current.getInputTargetBlock(`DO${branchIdx}`);
              traverseChain(doBlock, depth + 1);
              matched = true;
              break;
            }
            branchIdx++;
          }
          if (!matched && current.getInput('ELSE')) {
            const elseBlock = current.getInputTargetBlock('ELSE');
            traverseChain(elseBlock, depth + 1);
          }
          break;
        }
      }

      current = current.getNextBlock();
    }
  };

  topBlocks.forEach((b) => traverseChain(b));
  return steps;
}

/**
 * Real-time Blockly AST to MicroPython Code Transpiler (for Intermediate & Senior Dual-Pane View)
 */
export function transpileWorkspaceToPython(workspace: Blockly.Workspace | null): string {
  if (!workspace) {
    return '# CodiBotics Python Preview\nfrom codibotics import *\n';
  }

  const lines: string[] = [
    '# Auto-generated MicroPython from CodiBotics Blocks',
    'from codibotics import display, music, pin0, pin1, pin2, button_a, button_b, sensors, Icon',
    'import time',
    '',
  ];

  const renderConditionPython = (condBlock: Blockly.Block | null): string => {
    if (!condBlock) return 'False';
    if (condBlock.type === 'pm_button_pressed') {
      const btn = condBlock.getFieldValue('BTN') === 'A' ? 'button_a' : 'button_b';
      return `${btn}.is_pressed()`;
    }
    if (condBlock.type === 'pm_sensor_compare') {
      const sensor =
        condBlock.getFieldValue('SENSOR') === 'TEMP'
          ? 'sensors.temperature()'
          : 'sensors.light_level()';
      const opMap: Record<string, string> = { GT: '>', LT: '<', EQ: '==' };
      const op = opMap[condBlock.getFieldValue('OP')] || '>';
      const val = condBlock.getFieldValue('VAL') ?? 0;
      return `${sensor} ${op} ${val}`;
    }
    if (condBlock.type === 'logic_negate') {
      return `not (${renderConditionPython(condBlock.getInputTargetBlock('BOOL'))})`;
    }
    return 'True';
  };

  const renderBlockChain = (block: Blockly.Block | null, indentLevel: number) => {
    const pad = '    '.repeat(indentLevel);
    let current = block;
    let emitted = false;

    while (current) {
      emitted = true;
      switch (current.type) {
        case 'pm_show_icon':
          lines.push(`${pad}display.show(Icon.${current.getFieldValue('ICON')})`);
          break;
        case 'pm_clear_screen':
          lines.push(`${pad}display.clear()`);
          break;
        case 'pm_set_pixel':
          lines.push(
            `${pad}display.set_pixel(${current.getFieldValue('X')}, ${current.getFieldValue('Y')}, ${current.getFieldValue('BRIGHTNESS')})`
          );
          break;
        case 'pm_play_tone':
          lines.push(
            `${pad}music.pitch(${current.getFieldValue('FREQ')}, duration=${current.getFieldValue('DURATION')})`
          );
          break;
        case 'pm_wait_ms':
          lines.push(`${pad}time.sleep_ms(${current.getFieldValue('MS')})`);
          break;
        case 'pm_write_pin': {
          const pinName = (current.getFieldValue('PIN') || 'P0').toLowerCase();
          lines.push(
            `${pad}${pinName}.write_digital(${current.getFieldValue('VALUE')})`
          );
          break;
        }
        case 'pm_log_message':
          lines.push(`${pad}print("${current.getFieldValue('MSG')}")`);
          break;
        case 'controls_repeat_ext': {
          const timesBlock = current.getInputTargetBlock('TIMES');
          const count = timesBlock ? timesBlock.getFieldValue('NUM') : 3;
          lines.push(`${pad}for step in range(${count}):`);
          const doBlock = current.getInputTargetBlock('DO');
          if (doBlock) {
            renderBlockChain(doBlock, indentLevel + 1);
          } else {
            lines.push(`${pad}    pass`);
          }
          break;
        }
        case 'controls_if': {
          let idx = 0;
          while (current.getInput(`IF${idx}`)) {
            const cond = renderConditionPython(current.getInputTargetBlock(`IF${idx}`));
            lines.push(`${pad}${idx === 0 ? 'if' : 'elif'} ${cond}:`);
            const doBlock = current.getInputTargetBlock(`DO${idx}`);
            if (doBlock) {
              renderBlockChain(doBlock, indentLevel + 1);
            } else {
              lines.push(`${pad}    pass`);
            }
            idx++;
          }
          if (current.getInput('ELSE')) {
            lines.push(`${pad}else:`);
            const elseBlock = current.getInputTargetBlock('ELSE');
            if (elseBlock) {
              renderBlockChain(elseBlock, indentLevel + 1);
            } else {
              lines.push(`${pad}    pass`);
            }
          }
          break;
        }
      }
      current = current.getNextBlock();
    }

    if (!emitted && indentLevel > 0) {
      lines.push(`${pad}pass`);
    }
  };

  const topBlocks = workspace.getTopBlocks(true);
  if (topBlocks.length === 0) {
    lines.push('# Drag blocks onto the canvas to generate Python code');
  } else {
    topBlocks.forEach((b) => {
      renderBlockChain(b, 0);
      lines.push('');
    });
  }

  return lines.join('\n');
}

export function createBlankLedMatrix(): number[][] {
  return Array.from({ length: 5 }, () => [0, 0, 0, 0, 0]);
}

export function applyIconToMatrix(iconName: string): number[][] {
  const pattern = ICON_PATTERNS[iconName] || ICON_PATTERNS.HEART;
  return pattern.map((row) => [...row]);
}
