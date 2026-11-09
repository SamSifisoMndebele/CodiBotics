"""
PulseMaker Piezo Buzzer Sound Synthesizer
"""
import sys
import time

class Music:
    def __init__(self):
        self._winsound = None
        if sys.platform == "win32":
            try:
                import winsound
                self._winsound = winsound
            except ImportError:
                self._winsound = None

    def pitch(self, frequency: int, duration: int = 300) -> None:
        """
        Play a musical frequency (Hz) for a duration (milliseconds).
        """
        freq = int(max(37, min(32767, frequency)))
        dur_ms = int(max(10, duration))

        played = False
        if self._winsound:
            try:
                # Windows hardware/driver beep
                self._winsound.Beep(freq, dur_ms)
                played = True
            except Exception:
                played = False

        if not played:
            # Fallback for systems without hardware beep
            print(f"[PulseMaker Buzzer ♫ {freq} Hz for {dur_ms} ms]", flush=True)
            time.sleep(dur_ms / 1000.0)

music = Music()
