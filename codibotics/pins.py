"""
CodiBotics GPIO Edge Connector Pins (P0, P1, P2)
"""

class Pin:
    def __init__(self, name: str):
        self.name = name
        self.value = 0

    def write_digital(self, value: int) -> None:
        """
        Write digital state (1 for HIGH, 0 for LOW).
        """
        self.value = 1 if value else 0
        state_str = "HIGH (1)" if self.value else "LOW (0)"
        print(f"[CodiBotics Pin {self.name} -> {state_str}]", flush=True)

    def read_digital(self) -> int:
        """
        Read current digital state (0 or 1).
        """
        return self.value

    def __repr__(self) -> str:
        return f"<Pin {self.name}: {self.value}>"

pin0 = Pin("P0")
pin1 = Pin("P1")
pin2 = Pin("P2")
