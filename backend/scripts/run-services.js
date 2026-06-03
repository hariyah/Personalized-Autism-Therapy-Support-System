#!/usr/bin/env node
/**
 * Common entry point: detects OS and runs the correct START_SERVICES script.
 * Run from repo root: node backend/scripts/run-services.js
 * Or from backend/scripts: node run-services.js   (or ./start on Unix, start.cmd on Windows)
 */

const path = require("path");
const { spawn } = require("child_process");

const scriptDir = __dirname;
const isWindows = process.platform === "win32";

let script;
let args;
let opts;

if (isWindows) {
  script = path.join(scriptDir, "START_SERVICES.bat");
  args = ["/c", `"${script}"`];
  opts = { stdio: "inherit", shell: true, cwd: scriptDir };
} else {
  script = path.join(scriptDir, "START_SERVICES.sh");
  args = [script];
  opts = { stdio: "inherit", cwd: scriptDir };
}

console.log(`OS: ${process.platform} → running ${path.basename(script)}\n`);

const child = spawn(isWindows ? "cmd" : "bash", args, opts);

child.on("error", (err) => {
  console.error("Failed to start:", err.message);
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (signal) process.exit(128 + (signal === "SIGINT" ? 2 : 1));
  process.exit(code != null ? code : 0);
});
