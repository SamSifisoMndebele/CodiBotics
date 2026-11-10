# CodiBotics Python Library

The official Python / MicroPython companion library for the **CodiBotics Simulator** (DBE CAPS Coding & Robotics curriculum for South African schools, Grades R–7).

This library allows code generated or written in the CodiBotics browser simulator to run on any computer or MicroPython microcontroller without modifications.

---

## Installation

Install via pip:

```bash
pip install codibotics
```

---

## Quick Example (Intermediate Phase 5x5 Board)

```python
from codibotics import display, music, pin0, pin1, pin2, button_a, button_b, sensors, Icon
import time

# Check simulated environment sensors
if sensors.temperature() > 30:
    display.show(Icon.SUN)
    music.pitch(880, duration=300)
    print("Heatwave Alert! Temp > 30C")
else:
    display.show(Icon.SMILE)
    print("Temperature Normal")

# Wait and clear
time.sleep_ms(1000)
display.clear()
```

---

## Senior Phase Example (2D Autonomous Rover)

```python
from codibotics_rover import Rover
import time

rover = Rover()

for _ in range(10):
    dist = rover.ultrasonic.distance_cm()
    print(f"Ultrasonic distance: {dist} cm")

    if dist < 65:
        # Avoid obstacle: spin right
        rover.motors(v_left=65, v_right=-65)
    else:
        # Drive forward
        rover.motors(v_left=70, v_right=70)

    time.sleep_ms(200)
```

---

## Features

- **5x5 LED Matrix Display**: Visual terminal rendering with ANSI color highlighting (`display.show`, `display.set_pixel`, `display.clear`).
- **Icons**: Pre-packaged icons including `Icon.HEART`, `Icon.SMILE`, `Icon.SAD`, `Icon.SUN`, `Icon.ARROW_N`, and `Icon.CHECK`.
- **Piezo Sound Synthesizer**: Native audio via PC speaker / `winsound` on Windows and terminal fallbacks on macOS/Linux.
- **Sensors & Pins**: Virtual inputs for Temperature, Light Level, Push Buttons A & B, and Edge Pins P0, P1, P2.
- **MicroPython Compatibility**: Automatically injects `time.sleep_ms()` into Python's built-in `time` module so MicroPython scripts run unmodified in standard CPython.
- **2D Rover Kinematics**: Complete differential drive robotics model with raycasting and line sensors (`codibotics_rover.Rover`).
