"""
CodiBotics 5x5 LED Matrix Display Controller
"""
import sys
from typing import Union, List
from .icons import IconImage

class Display:
    def __init__(self):
        self._matrix: List[List[int]] = [[0 for _ in range(5)] for _ in range(5)]
        self._supports_color = hasattr(sys.stdout, "isatty") and sys.stdout.isatty()
        encoding = getattr(sys.stdout, "encoding", "utf-8") or "utf-8"
        self._is_utf8 = "utf" in encoding.lower()

    def show(self, image: Union[IconImage, List[List[int]], str]) -> None:
        """
        Display an icon preset or a 5x5 brightness matrix (0-255).
        """
        if isinstance(image, IconImage):
            self._matrix = [row[:] for row in image.matrix]
            name = image.name
        elif isinstance(image, list):
            self._matrix = [row[:] for row in image]
            name = "CUSTOM"
        else:
            name = str(image)

        self._render(header=f"Icon.{name}")

    def clear(self) -> None:
        """
        Turn off all 25 LEDs on the matrix.
        """
        self._matrix = [[0 for _ in range(5)] for _ in range(5)]
        self._render(header="CLEARED")

    def set_pixel(self, x: int, y: int, brightness: int = 255) -> None:
        """
        Set brightness of a single pixel (x: 0-4, y: 0-4, brightness: 0-255).
        """
        if 0 <= x < 5 and 0 <= y < 5:
            self._matrix[y][x] = max(0, min(255, brightness))
            self._render(header=f"pixel({x}, {y}) = {brightness}")

    def _render(self, header: str = "") -> None:
        """
        Render 5x5 LED matrix in the terminal safely across Windows (cp1252/utf-8) and Linux/macOS.
        """
        use_unicode = self._is_utf8
        
        # Characters for ON, MEDIUM, OFF
        if use_unicode:
            on_char = "■ "
            med_char = "▫ "
            off_char = "· "
            t_left, t_right = "┌", "┐"
            b_left, b_right = "└", "┘"
            h_bar, v_bar = "─", "│"
        else:
            # Safe ASCII fallback for Windows cp1252 / legacy CMD
            on_char = "# "
            med_char = "* "
            off_char = ". "
            t_left, t_right = "+", "+"
            b_left, b_right = "+", "+"
            h_bar, v_bar = "-", "|"

        title = f"[ CodiBit 5x5: {header} ]"
        total_width = 32
        left_pad = (total_width - len(title) - 2) // 2
        right_pad = total_width - len(title) - 2 - left_pad

        border_top = t_left + (h_bar * max(1, left_pad)) + title + (h_bar * max(1, right_pad)) + t_right
        border_bot = b_left + (h_bar * (len(border_top) - 2)) + b_right

        lines = [border_top]
        for y in range(5):
            row_chars = []
            for x in range(5):
                b = self._matrix[y][x]
                if b > 150:
                    char = f"\033[91m{on_char}\033[0m" if self._supports_color else on_char
                elif b > 0:
                    char = f"\033[33m{med_char}\033[0m" if self._supports_color else med_char
                else:
                    char = f"\033[90m{off_char}\033[0m" if self._supports_color else off_char
                row_chars.append(char)
            lines.append(f"{v_bar}        {''.join(row_chars)}     {v_bar}")
        lines.append(border_bot)

        output = "\n" + "\n".join(lines) + "\n"
        try:
            print(output, flush=True)
        except UnicodeEncodeError:
            # Emergency ASCII fallback
            safe_output = output.encode("ascii", "replace").decode("ascii")
            print(safe_output, flush=True)

display = Display()
