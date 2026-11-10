"""
CodiBotics Push Buttons A & B
"""
import os

class Button:
    def __init__(self, name: str):
        self.name = name
        self._pressed = False

    def is_pressed(self) -> bool:
        """
        Check if the button is currently pressed.
        Can be influenced by environment variables CODIBOTICS_BUTTON_A=1 / CODIBOTICS_BUTTON_B=1.
        """
        env_val = os.environ.get(f"CODIBOTICS_BUTTON_{self.name.upper()}", "")
        if env_val in ("1", "true", "True"):
            return True
        return self._pressed

    def set_pressed(self, pressed: bool = True) -> None:
        """
        Simulate pressing or releasing this button.
        """
        self._pressed = bool(pressed)

    def __repr__(self) -> str:
        return f"<Button {self.name}: {'PRESSED' if self.is_pressed() else 'RELEASED'}>"

button_a = Button("A")
button_b = Button("B")
