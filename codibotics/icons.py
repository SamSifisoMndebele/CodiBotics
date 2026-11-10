"""
CodiBotics 5x5 LED Matrix Icon Presets
"""
from typing import List

class IconImage:
    def __init__(self, name: str, matrix: List[List[int]]):
        self.name = name
        self.matrix = matrix

    def __repr__(self) -> str:
        return f"<Icon.{self.name}>"

class _IconMeta(type):
    def __getattr__(cls, name: str):
        raise AttributeError(f"Icon '{name}' does not exist on CodiBotics Icon set.")

class Icon(metaclass=_IconMeta):
    HEART = IconImage("HEART", [
        [0, 255, 0, 255, 0],
        [255, 255, 255, 255, 255],
        [255, 255, 255, 255, 255],
        [0, 255, 255, 255, 0],
        [0, 0, 255, 0, 0],
    ])

    SMILE = IconImage("SMILE", [
        [0, 255, 0, 255, 0],
        [0, 255, 0, 255, 0],
        [0, 0, 0, 0, 0],
        [255, 0, 0, 0, 255],
        [0, 255, 255, 255, 0],
    ])

    SAD = IconImage("SAD", [
        [0, 255, 0, 255, 0],
        [0, 0, 0, 0, 0],
        [0, 255, 255, 255, 0],
        [255, 0, 0, 0, 255],
        [0, 0, 0, 0, 0],
    ])

    SUN = IconImage("SUN", [
        [255, 0, 255, 0, 255],
        [0, 255, 255, 255, 0],
        [255, 255, 255, 255, 255],
        [0, 255, 255, 255, 0],
        [255, 0, 255, 0, 255],
    ])

    ARROW_N = IconImage("ARROW_N", [
        [0, 0, 255, 0, 0],
        [0, 255, 255, 255, 0],
        [255, 0, 255, 0, 255],
        [0, 0, 255, 0, 0],
        [0, 0, 255, 0, 0],
    ])

    CHECK = IconImage("CHECK", [
        [0, 0, 0, 0, 255],
        [0, 0, 0, 255, 0],
        [255, 0, 255, 0, 0],
        [0, 255, 0, 0, 0],
        [0, 0, 0, 0, 0],
    ])
