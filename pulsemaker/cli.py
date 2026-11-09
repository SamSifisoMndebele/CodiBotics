"""
PulseMaker CLI Utility
"""
import sys
import runpy
from pulsemaker import __version__, display, Icon, music

def main():
    if len(sys.argv) > 1:
        cmd = sys.argv[1]
        if cmd in ("-v", "--version"):
            print(f"pulsemaker version {__version__}")
            return
        elif cmd in ("-h", "--help"):
            print("PulseMaker Python Simulator CLI")
            print("Usage:")
            print("  pulsemaker run <script.py>   Run a PulseMaker script")
            print("  pulsemaker demo              Run a built-in hardware demo")
            return
        elif cmd == "run" and len(sys.argv) > 2:
            filepath = sys.argv[2]
            print(f"Running PulseMaker script: {filepath}")
            runpy.run_path(filepath, run_name="__main__")
            return
        elif cmd == "demo":
            print("=== PulseMaker Demo ===")
            display.show(Icon.SUN)
            music.pitch(880, 250)
            return

    print(f"PulseMaker Python Runtime v{__version__} is ready.")
    print("Run with '--help' for options.")

if __name__ == "__main__":
    main()
