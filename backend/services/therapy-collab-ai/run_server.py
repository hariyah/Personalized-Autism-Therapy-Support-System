#!/usr/bin/env python3
"""Standalone FastAPI server runner"""
import subprocess
import time
import sys
from pathlib import Path

# Clean up any stale processes
subprocess.run(['taskkill', '/F', '/IM', 'python.exe'], stderr=subprocess.DEVNULL, stdout=subprocess.DEVNULL)
time.sleep(2)

# Start server
server_path = Path(__file__).parent
print(f"[INFO] Starting FastAPI server from {server_path}")
print(f"[INFO] Python: {sys.executable}")

env = Path(__file__).parent
proc = subprocess.Popen(
    [sys.executable, '-m', 'uvicorn', 'main:app', '--port', '8000', '--host', '127.0.0.1'],
    cwd=str(env),
    stdout=subprocess.PIPE,
    stderr=subprocess.STDOUT,
    text=True,
    bufsize=1
)

try:
    while True:
        line = proc.stdout.readline()
        print(line, end='')
        if 'Application startup complete' in line:
            print("\n[OK] Server ready for requests\n")
except KeyboardInterrupt:
    print("\n[INFO] Stopping server...")
    proc.terminate()
    proc.wait()
