"""
PulseMaker Virtual Environment Sensors
"""
import os

class Sensors:
    def __init__(self):
        self._temp = 32.0  # Default 32°C so heatwave alarms trigger predictably in tests
        self._light = 180  # Default 180 (0-255)

    def temperature(self) -> float:
        """
        Get live simulated ambient temperature in °C.
        Can be overridden via environment variable PULSEMAKER_TEMP=35.
        """
        env_val = os.environ.get("PULSEMAKER_TEMP")
        if env_val:
            try:
                return float(env_val)
            except ValueError:
                pass
        return self._temp

    def light_level(self) -> int:
        """
        Get live simulated light level (0-255).
        Can be overridden via environment variable PULSEMAKER_LIGHT=200.
        """
        env_val = os.environ.get("PULSEMAKER_LIGHT")
        if env_val:
            try:
                return int(env_val)
            except ValueError:
                pass
        return self._light

    def set_temperature(self, degrees_celsius: float) -> None:
        """
        Set simulated ambient temperature.
        """
        self._temp = float(degrees_celsius)

    def set_light_level(self, level: int) -> None:
        """
        Set simulated light level (0 to 255).
        """
        self._light = max(0, min(255, int(level)))

sensors = Sensors()
