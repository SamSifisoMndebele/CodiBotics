"""
PulseMaker 2D Autonomous Rover Controller (Grade 7 Senior Phase)
"""
import os
import random

class UltrasonicSensor:
    def __init__(self, initial_dist: int = 120):
        self._distance = initial_dist

    def distance_cm(self) -> int:
        """
        Return simulated ultrasonic distance in cm.
        Can be overridden via PULSEMAKER_ROVER_DISTANCE=45.
        """
        env_val = os.environ.get("PULSEMAKER_ROVER_DISTANCE")
        if env_val:
            try:
                return int(env_val)
            except ValueError:
                pass
        return self._distance

    def set_distance(self, distance_cm: int) -> None:
        self._distance = int(distance_cm)

class Rover:
    def __init__(self):
        self.v_left = 0
        self.v_right = 0
        self.ultrasonic = UltrasonicSensor(initial_dist=45)
        self._left_line = False
        self._right_line = False

    def motors(self, v_left: int, v_right: int) -> None:
        """
        Set left and right motor velocities (-100 to 100).
        """
        self.v_left = max(-100, min(100, int(v_left)))
        self.v_right = max(-100, min(100, int(v_right)))
        print(f"[Rover Motors: v_left={self.v_left}%, v_right={self.v_right}%]", flush=True)

    def line_sensor_left(self) -> bool:
        """
        Return True if left optical sensor detects line.
        """
        return self._left_line

    def line_sensor_right(self) -> bool:
        """
        Return True if right optical sensor detects line.
        """
        return self._right_line

    def set_line_sensors(self, left: bool, right: bool) -> None:
        self._left_line = bool(left)
        self._right_line = bool(right)
