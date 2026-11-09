import * as Blockly from 'blockly';

// ============================================================================
// Custom Blockly Definitions & Toolbox for PulseMaker Intermediate & Senior
// 100% Client-Side, Offline-First
// ============================================================================

let blocksRegistered = false;

export const ICON_PATTERNS: Record<string, number[][]> = {
  HEART: [
    [0, 255, 0, 255, 0],
    [255, 255, 255, 255, 255],
    [255, 255, 255, 255, 255],
    [0, 255, 255, 255, 0],
    [0, 0, 255, 0, 0],
  ],
  SMILE: [
    [0, 255, 0, 255, 0],
    [0, 255, 0, 255, 0],
    [0, 0, 0, 0, 0],
    [255, 0, 0, 0, 255],
    [0, 255, 255, 255, 0],
  ],
  SAD: [
    [0, 255, 0, 255, 0],
    [0, 0, 0, 0, 0],
    [0, 255, 255, 255, 0],
    [255, 0, 0, 0, 255],
    [0, 0, 0, 0, 0],
  ],
  SUN: [
    [255, 0, 255, 0, 255],
    [0, 255, 255, 255, 0],
    [255, 255, 255, 255, 255],
    [0, 255, 255, 255, 0],
    [255, 0, 255, 0, 255],
  ],
  ARROW_N: [
    [0, 0, 255, 0, 0],
    [0, 255, 255, 255, 0],
    [255, 0, 255, 0, 255],
    [0, 0, 255, 0, 0],
    [0, 0, 255, 0, 0],
  ],
  CHECK: [
    [0, 0, 0, 0, 255],
    [0, 0, 0, 255, 0],
    [255, 0, 255, 0, 0],
    [0, 255, 0, 0, 0],
    [0, 0, 0, 0, 0],
  ],
};

export function registerPulseMakerBlocks() {
  if (blocksRegistered) return;
  blocksRegistered = true;

  Blockly.common.defineBlocksWithJsonArray([
    // --- DISPLAY BLOCKS ---
    {
      type: 'pm_show_icon',
      message0: 'show 5x5 icon %1',
      args0: [
        {
          type: 'field_dropdown',
          name: 'ICON',
          options: [
            ['❤️ Heart', 'HEART'],
            ['😊 Smile', 'SMILE'],
            ['😢 Sad', 'SAD'],
            ['☀️ Sun', 'SUN'],
            ['⬆️ North Arrow', 'ARROW_N'],
            ['✔️ Checkmark', 'CHECK'],
          ],
        },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: 160,
      tooltip: 'Display a preset icon on the 5x5 LED matrix',
    },
    {
      type: 'pm_clear_screen',
      message0: 'clear 5x5 LED matrix',
      previousStatement: null,
      nextStatement: null,
      colour: 160,
      tooltip: 'Turn off all 25 LEDs on the matrix',
    },
    {
      type: 'pm_set_pixel',
      message0: 'set LED x %1 y %2 brightness %3',
      args0: [
        { type: 'field_number', name: 'X', value: 2, min: 0, max: 4 },
        { type: 'field_number', name: 'Y', value: 2, min: 0, max: 4 },
        {
          type: 'field_dropdown',
          name: 'BRIGHTNESS',
          options: [
            ['ON (100%)', '255'],
            ['MEDIUM (50%)', '128'],
            ['OFF (0%)', '0'],
          ],
        },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: 160,
      tooltip: 'Set an individual pixel (x: 0-4, y: 0-4) on the 5x5 matrix',
    },

    // --- SOUND BLOCKS ---
    {
      type: 'pm_play_tone',
      message0: 'play piezo tone %1 Hz for %2 ms',
      args0: [
        {
          type: 'field_dropdown',
          name: 'FREQ',
          options: [
            ['Low C (262 Hz)', '262'],
            ['Middle D (294 Hz)', '294'],
            ['Middle E (330 Hz)', '330'],
            ['Middle G (392 Hz)', '392'],
            ['Concert A (440 Hz)', '440'],
            ['High C (523 Hz)', '523'],
            ['Siren High (880 Hz)', '880'],
          ],
        },
        { type: 'field_number', name: 'DURATION', value: 300, min: 50, max: 2000 },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: 290,
      tooltip: 'Play a musical note on the virtual piezo buzzer',
    },

    // --- WAIT / TIMING ---
    {
      type: 'pm_wait_ms',
      message0: 'pause for %1 ms',
      args0: [
        { type: 'field_number', name: 'MS', value: 400, min: 100, max: 5000 },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: 120,
      tooltip: 'Pause execution for a number of milliseconds',
    },

    // --- SENSORS & INPUTS ---
    {
      type: 'pm_button_pressed',
      message0: 'button %1 is pressed?',
      args0: [
        {
          type: 'field_dropdown',
          name: 'BTN',
          options: [
            ['A', 'A'],
            ['B', 'B'],
          ],
        },
      ],
      output: 'Boolean',
      colour: 210,
      tooltip: 'True if virtual push button A or B is currently toggled active',
    },
    {
      type: 'pm_sensor_compare',
      message0: 'sensor %1 %2 %3',
      args0: [
        {
          type: 'field_dropdown',
          name: 'SENSOR',
          options: [
            ['Temperature (°C)', 'TEMP'],
            ['Light Level (0-255)', 'LIGHT'],
          ],
        },
        {
          type: 'field_dropdown',
          name: 'OP',
          options: [
            ['>', 'GT'],
            ['<', 'LT'],
            ['=', 'EQ'],
          ],
        },
        { type: 'field_number', name: 'VAL', value: 28, min: -20, max: 255 },
      ],
      output: 'Boolean',
      colour: 210,
      tooltip: 'Compare live virtual environment slider against a threshold',
    },

    // --- PINS & LOGGING ---
    {
      type: 'pm_write_pin',
      message0: 'digital write pin %1 to %2',
      args0: [
        {
          type: 'field_dropdown',
          name: 'PIN',
          options: [
            ['P0', 'P0'],
            ['P1', 'P1'],
            ['P2', 'P2'],
          ],
        },
        {
          type: 'field_dropdown',
          name: 'VALUE',
          options: [
            ['HIGH (1)', '1'],
            ['LOW (0)', '0'],
          ],
        },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: 20,
      tooltip: 'Set GPIO edge connector pin P0, P1, or P2 to HIGH or LOW',
    },
    {
      type: 'pm_log_message',
      message0: 'print to trace console %1',
      args0: [
        { type: 'field_input', name: 'MSG', text: 'Hello South Africa!' },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: 45,
      tooltip: 'Print a message to the bottom execution console',
    },
  ]);
}

export const PULSEMAKER_TOOLBOX = {
  kind: 'categoryToolbox',
  contents: [
    {
      kind: 'category',
      name: '💡 Display (5x5)',
      colour: '#10b981',
      contents: [
        { kind: 'block', type: 'pm_show_icon' },
        { kind: 'block', type: 'pm_set_pixel' },
        { kind: 'block', type: 'pm_clear_screen' },
      ],
    },
    {
      kind: 'category',
      name: '🔊 Sound & Timing',
      colour: '#a855f7',
      contents: [
        { kind: 'block', type: 'pm_play_tone' },
        { kind: 'block', type: 'pm_wait_ms' },
      ],
    },
    {
      kind: 'category',
      name: '🌡️ Sensors & Pins',
      colour: '#3b82f6',
      contents: [
        { kind: 'block', type: 'pm_button_pressed' },
        { kind: 'block', type: 'pm_sensor_compare' },
        { kind: 'block', type: 'pm_write_pin' },
        { kind: 'block', type: 'pm_log_message' },
      ],
    },
    {
      kind: 'category',
      name: '🔁 Loops & Logic',
      colour: '#f59e0b',
      contents: [
        {
          kind: 'block',
          type: 'controls_repeat_ext',
          inputs: {
            TIMES: {
              shadow: {
                type: 'math_number',
                fields: { NUM: 3 },
              },
            },
          },
        },
        { kind: 'block', type: 'controls_if' },
        { kind: 'block', type: 'logic_negate' },
      ],
    },
  ],
};

export const DEFAULT_INTERMEDIATE_XML = `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="pm_log_message" x="25" y="25">
    <field name="MSG">Starting PulseMaker Board...</field>
    <next>
      <block type="controls_repeat_ext">
        <value name="TIMES">
          <shadow type="math_number">
            <field name="NUM">2</field>
          </shadow>
        </value>
        <statement name="DO">
          <block type="pm_show_icon">
            <field name="ICON">HEART</field>
            <next>
              <block type="pm_play_tone">
                <field name="FREQ">440</field>
                <field name="DURATION">250</field>
                <next>
                  <block type="pm_wait_ms">
                    <field name="MS">350</field>
                    <next>
                      <block type="pm_show_icon">
                        <field name="ICON">SMILE</field>
                        <next>
                          <block type="pm_play_tone">
                            <field name="FREQ">523</field>
                            <field name="DURATION">250</field>
                          </block>
                        </next>
                      </block>
                    </next>
                  </block>
                </next>
              </block>
            </next>
          </block>
        </statement>
        <next>
          <block type="pm_write_pin">
            <field name="PIN">P0</field>
            <field name="VALUE">1</field>
          </block>
        </next>
      </block>
    </next>
  </block>
</xml>`;
