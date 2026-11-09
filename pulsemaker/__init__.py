"""
PulseMaker Simulator - Python & MicroPython Runtime
DBE CAPS Coding & Robotics Platform
"""
import sys
import time
import builtins

from .display import display, Display
from .icons import Icon, IconImage
from .music import music, Music
from .pins import pin0, pin1, pin2, Pin
from .buttons import button_a, button_b, Button
from .sensors import sensors, Sensors
from .rover import Rover

# 1. MicroPython Compatibility Shim:
# MicroPython provides time.sleep_ms(ms), whereas standard CPython only provides time.sleep(seconds).
# We dynamically attach sleep_ms to the time module so standard Python scripts run without error.
if not hasattr(time, "sleep_ms"):
    time.sleep_ms = lambda ms: time.sleep(ms / 1000.0)  # type: ignore

# 2. Inject Icon into Python builtins as a safety fallback
# so transpiled code using Icon.SUN works even if 'Icon' was omitted from the import line.
if not hasattr(builtins, "Icon"):
    setattr(builtins, "Icon", Icon)

__version__ = "1.0.0"

__all__ = [
    "display",
    "Display",
    "Icon",
    "IconImage",
    "music",
    "Music",
    "pin0",
    "pin1",
    "pin2",
    "Pin",
    "button_a",
    "button_b",
    "Button",
    "sensors",
    "Sensors",
    "Rover",
]
